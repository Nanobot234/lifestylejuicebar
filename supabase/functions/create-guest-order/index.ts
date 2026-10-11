import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Edge function that creates an order for a guest (no authentication required).
// Uses the service role to bypass RLS because the user is not logged in.
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items, orderDetails, total } = await req.json();

    if (!Array.isArray(items) || items.length === 0 || !orderDetails || typeof total !== "number") {
      return new Response(JSON.stringify({ error: "Invalid request payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create an admin Supabase client to write the guest order and items.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: null,
        order_details: orderDetails,
        total_amount: total,
        status: "pending",
      })
      .select("id, order_number")
      .single();

    if (orderError) {
      console.error("create-guest-order: order insert failed", orderError);
      return new Response(JSON.stringify({ error: orderError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cart IDs may carry a variant suffix (e.g. "<uuid>-16oz"); keep only the product UUID.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    const orderItems = items.map((item: any) => {
      const rawId = String(item.id ?? "");
      const productId = rawId.match(UUID_RE)?.[0] ?? rawId;
      return {
        order_id: order.id,
        product_id: productId,
        quantity: item.quantity,
        price_at_purchase: item.price,
        special_instructions: productId !== rawId ? (item.name ?? null) : null,
      };
    });

    const { error: itemsError } = await admin.from("order_items").insert(orderItems);
    if (itemsError) {
      console.error("create-guest-order: items insert failed", itemsError);
      return new Response(JSON.stringify({ error: itemsError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ orderId: order.id, orderNumber: order.order_number }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("create-guest-order error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});