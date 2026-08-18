// Creates an embedded Stripe Checkout session for a catalog price (one-time or
// recurring). Used for the monthly website-maintenance subscription.
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Finds (or creates) a Stripe customer that carries userId metadata so later reads can resolve it. */
/** Unix timestamp for 00:00 UTC-ish on the next upcoming Monday (used to delay first billing). */
function nextMondayUnix(): number {
  const now = new Date();
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0));
  do {
    date.setUTCDate(date.getUTCDate() + 1);
  } while (date.getUTCDay() !== 1);
  return Math.floor(date.getTime() / 1000);
}

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const environment: StripeEnv = body.environment === "live" ? "live" : "sandbox";
    const priceId: string = body.priceId;
    const quantity = Math.max(1, Math.round(Number(body.quantity) || 1));
    const returnUrl: string = typeof body.returnUrl === "string" ? body.returnUrl : "";

    if (!priceId || !/^[a-zA-Z0-9_-]+$/.test(priceId)) throw new Error("Invalid priceId");
    if (!returnUrl.startsWith("http")) throw new Error("Invalid return URL");

    let userId: string | undefined;
    let customerEmail: string | undefined = body.customerEmail;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      );
      const { data } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (data.user) {
        userId = data.user.id;
        customerEmail = data.user.email ?? customerEmail;
      }
    }

    const stripe = createStripeClient(environment);

    // Human-readable price IDs are stored as Stripe lookup keys.
    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!prices.data.length) throw new Error("Price not found");
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    const customerId = (customerEmail || userId)
      ? await resolveOrCreateCustomer(stripe, { email: customerEmail, userId })
      : undefined;

    let productDescription: string | undefined;
    if (!isRecurring) {
      const productId = typeof stripePrice.product === "string" ? stripePrice.product : stripePrice.product.id;
      const product = await stripe.products.retrieve(productId);
      productDescription = product.name;
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      ...(customerId && { customer: customerId }),
      ...(!isRecurring && { payment_intent_data: { description: productDescription } }),
      ...(userId && {
        metadata: { userId },
        ...(isRecurring && { subscription_data: { metadata: { userId } } }),
      }),
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-checkout error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
