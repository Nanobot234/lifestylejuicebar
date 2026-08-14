// Creates an embedded Stripe Checkout session for a recurring juice delivery
// subscription. The recurring amount is built from the customer's cart, so the
// price is created inline (price_data) rather than pulled from a catalog.
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INTERVALS: Record<string, { interval: "week" | "month"; interval_count: number }> = {
  weekly: { interval: "week", interval_count: 1 },
  "bi-weekly": { interval: "week", interval_count: 2 },
  monthly: { interval: "month", interval_count: 1 },
};

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
    const amount = Number(body.amount);
    const frequency = String(body.frequency ?? "weekly");
    const returnUrl: string = typeof body.returnUrl === "string" ? body.returnUrl : "";
    const recurring = INTERVALS[frequency];

    if (!recurring) throw new Error("Invalid frequency");
    if (!(amount > 0.5)) throw new Error("Invalid subscription amount");
    if (!returnUrl.startsWith("http")) throw new Error("Invalid return URL");

    // Subscriptions require a signed-in customer.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const stripe = createStripeClient(environment);

    let customerId: string;
    const existing = await stripe.customers.search({
      query: `metadata['userId']:'${user.id}'`,
      limit: 1,
    });
    if (existing.data.length) {
      customerId = existing.data[0].id;
    } else {
      const created = await stripe.customers.create({
        ...(user.email ? { email: user.email } : {}),
        metadata: { userId: user.id },
      });
      customerId = created.id;
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Juice Delivery Subscription (${frequency})` },
            unit_amount: Math.round(amount * 100),
            recurring,
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      customer: customerId,
      metadata: { userId: user.id, frequency },
      subscription_data: { metadata: { userId: user.id, frequency } },
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-recurring-checkout error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
