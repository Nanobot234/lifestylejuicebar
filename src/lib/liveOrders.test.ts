/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import type { Order } from "@/types";
import { isLiveOrder, newlyArrivedOrders, nextOrderStatus, sortLiveOrders } from "./liveOrders";

const order = (id: string, status: Order["status"], createdAt = "2026-10-09T22:00:00Z"): Order => ({
  id, status, createdAt, userId: "owner", total: 25, items: [],
  orderDetails: { name: "Customer", email: "", phone: "", deliveryMethod: "pickup", paymentMethod: "card" },
});

describe("live order queue", () => {
  test("keeps multiple active orders, oldest first, excluding finished records", () => {
    expect(sortLiveOrders([order("newer", "pending", "2026-10-09T22:01:00Z"), order("done", "completed"), order("older", "preparing")]).map(o => o.id)).toEqual(["older", "newer"]);
    expect(isLiveOrder(order("shipped", "delivered"))).toBe(false);
    expect(isLiveOrder(order("ready", "ready"))).toBe(true);
  });
  test("detects every new arrival without repeating existing orders", () => {
    expect(newlyArrivedOrders(new Set(["known"]), [order("known", "pending"), order("one", "pending"), order("two", "pending"), order("done", "completed")]).map(o => o.id)).toEqual(["one", "two"]);
  });
  test("progresses new orders through preparation and ready to completion", () => {
    expect(nextOrderStatus("pending")).toBe("preparing");
    expect(nextOrderStatus("preparing")).toBe("ready");
    expect(nextOrderStatus("ready")).toBe("completed");
    expect(nextOrderStatus("completed")).toBeNull();
  });
});