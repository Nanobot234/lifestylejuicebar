import { supabase } from "@/integrations/supabase/client";
import type { Order } from "@/types";

// One joined read avoids an individual request for every ticket.
export async function fetchLiveOrders(): Promise<Order[]> {
  const { data, error } = await supabase.from("orders")
    .select("*, order_items(quantity, price_at_purchase, products(*))")
    .in("status", ["pending", "preparing", "ready"])
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(row => ({
    id: row.id, orderNumber: row.order_number, userId: row.user_id ?? "guest",
    status: row.status as Order["status"], createdAt: row.created_at,
    total: Number(row.total_amount), orderDetails: row.order_details as unknown as Order["orderDetails"],
    items: (row.order_items ?? []).map(item => ({
      id: item.products?.id ?? "unavailable", name: item.products?.name ?? "Product unavailable",
      description: item.products?.description ?? "", image: item.products?.image_url ?? "",
      category: item.products?.category ?? "", ingredients: [], benefits: [],
      quantity: item.quantity, price: Number(item.price_at_purchase),
    })),
  }));
}

export async function advanceLiveOrder(order: Order, status: Order["status"]) {
  const { data, error } = await supabase.from("orders").update({ status })
    .eq("id", order.id).eq("status", order.status).select("id").maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("This order was changed on another screen. Refresh and try again.");
}