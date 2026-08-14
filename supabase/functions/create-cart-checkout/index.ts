// Creates an embedded Stripe Checkout session for a one-time cart order.
// Works for logged-in customers and guests. Prices are built dynamically from
// the cart (price_data) because the menu catalog lives in our own database.
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartItem {
  name: string;
  description?: string;
  price: number;
  quantity: number;
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
    const items: CartItem[] = Array.isArray(body.items) ? body.items : [];
    const fees = Number(body.fees ?? 0);
    const tax = Number(body.tax ?? 0);
    const returnUrl: string = typeof body.returnUrl === "string" ? body.returnUrl : "";

    if (items.length === 0) throw new Error("Cart is empty");
    if (!returnUrl.startsWith("http")) throw new Error("Invalid return URL");

    // Resolve the signed-in user, if any (guests are allowed).
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

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: String(item.name).slice(0, 250),
          ...(item.description ? { description: String(item.description).slice(0, 500) } : {}),
        },
        unit_amount: Math.round(Number(item.price) * 100),
      },
      quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
    }));

    if (fees > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Delivery / Shipping" },
          unit_amount: Math.round(fees * 100),
        },
        quantity: 1,
      });
    }
    if (tax > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Sales Tax" },
          unit_amount: Math.round(tax * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      ...(customerEmail ? { customer_email: customerEmail } : {}),
      payment_intent_data: { description: "Lifestyle 1104 order" },
      metadata: {
        ...(userId ? { userId } : { userId: "guest" }),
      },
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("create-cart-checkout error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
