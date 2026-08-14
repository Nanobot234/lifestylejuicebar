
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge function that creates a Stripe Checkout session for a monthly
 * website-maintenance subscription. This is intended for the client of the
 * developer maintaining the site to pay $85/month for site maintenance and
 * domain updates. The checkout is unauthenticated; Stripe collects the payer's
 * email and payment details on the checkout page.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const origin = req.headers.get("origin") || "http://localhost:8080";

    // Initialize Stripe with the project secret key.
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create a monthly subscription checkout session for $85.00.
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Website Maintenance & Domain Updates",
              description: "Monthly maintenance, updates, and domain management for lifestylejuice.lovable.app",
            },
            unit_amount: 8500, // $85.00 in cents
            recurring: {
              interval: "month",
              interval_count: 1,
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/maintenance`,
      metadata: {
        service_type: "website_maintenance",
        amount: "85.00",
        interval: "monthly",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating maintenance subscription session:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
