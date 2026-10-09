import type { Order } from "@/types";

export const liveStatuses = ["pending", "preparing", "ready"] as const;
export type LiveStatus = typeof liveStatuses[number];

export function isLiveOrder(order: Pick<Order, "status">): boolean {
  return liveStatuses.some(status => status === order.status);
}

export function sortLiveOrders(orders: Order[]): Order[] {
  return orders.filter(isLiveOrder).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt) || a.id.localeCompare(b.id));
}

export function newlyArrivedOrders(previous: Set<string>, orders: Order[]): Order[] {
  return orders.filter(order => !previous.has(order.id) && order.status === "pending");
}

export function nextOrderStatus(status: Order["status"]): Order["status"] | null {
  if (status === "pending") return "preparing";
  if (status === "preparing") return "ready";
  if (status === "ready") return "completed";
  return null;
}