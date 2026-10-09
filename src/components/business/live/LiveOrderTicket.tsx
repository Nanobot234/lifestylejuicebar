import { Clock, MapPin, Phone, Truck, Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Order } from "@/types";
import { nextOrderStatus } from "@/lib/liveOrders";

const labels = { pending: "New", preparing: "Preparing", ready: "Ready", completed: "Completed", delivered: "Delivered" };
const styles = { pending: "border-order-new", preparing: "border-order-preparing", ready: "border-order-ready", completed: "border-border", delivered: "border-border" };

export default function LiveOrderTicket({ order, now, highlighted, busy, onAdvance }: {
  order: Order; now: number; highlighted: boolean; busy: boolean; onAdvance: (status: Order["status"]) => void;
}) {
  const details = order.orderDetails;
  const notes = (details as Order["orderDetails"] & { notes?: string }).notes;
  const minutes = Math.max(0, Math.floor((now - Date.parse(order.createdAt)) / 60000));
  const next = nextOrderStatus(order.status);
  const action = order.status === "pending" ? "Start preparing" : order.status === "preparing" ? "Mark ready" : details.deliveryMethod === "shipping" ? "Mark shipped" : "Complete order";
  return (
    <article aria-label={`Order ${order.orderNumber ?? order.id.slice(-6)}`} className={`live-ticket flex min-w-0 flex-col rounded-lg border border-t-[6px] bg-card text-card-foreground ${styles[order.status]} ${highlighted ? "ring-2 ring-order-new motion-safe:animate-fade-in" : ""}`}>
      <div className="border-b border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
          <span className={`order-status-${order.status} rounded px-2.5 py-1`}>{labels[order.status]}</span>
          <span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="size-4" />{minutes < 1 ? "Just now" : `${minutes} min`}</span>
        </div>
        <h2 className="mt-4 break-words text-3xl font-bold">#{order.orderNumber ?? order.id.slice(-6)}</h2>
        <p className="mt-1 break-words text-xl font-semibold">{details.name || "Guest customer"}</p>
        <p className="mt-2 text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
      </div>
      <div className="space-y-2 border-b border-border bg-muted/40 px-5 py-4">
        <p className="flex items-center gap-2 font-bold capitalize">{details.deliveryMethod === "shipping" ? <Truck className="size-5" /> : <MapPin className="size-5" />}{details.deliveryMethod || "Pickup"}</p>
        {details.address && <p className="break-words text-base leading-relaxed">{details.address}</p>}
        {details.phone && <a href={`tel:${details.phone}`} className="flex items-center gap-2 text-base"><Phone className="size-4" />{details.phone}</a>}
      </div>
      <ul className="flex-1 divide-y divide-border px-5 py-2">
        {order.items.map((item, index) => <li key={`${item.id}-${index}`} className="flex items-start gap-3 py-4"><span className="flex size-10 shrink-0 items-center justify-center rounded bg-muted text-xl font-bold">{item.quantity}×</span><span className="min-w-0 break-words pt-1 text-lg font-semibold leading-snug">{item.name}</span></li>)}
        {!order.items.length && <li className="py-4 text-muted-foreground"><Loader2 className="mr-2 inline size-4 animate-spin" />Loading order items…</li>}
      </ul>
      {notes && <div className="mx-5 mb-4 border-l-4 border-order-new bg-order-new/10 p-3"><p className="text-xs font-bold uppercase">Customer note</p><p className="mt-1 break-words text-base">{notes}</p></div>}
      <div className="border-t border-border p-5">
        <div className="mb-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">Order total</span><span className="text-xl font-bold">${order.total.toFixed(2)}</span></div>
        {next && <Button className="h-14 w-full whitespace-normal text-base font-semibold" disabled={busy || !order.items.length} onClick={() => onAdvance(next)}>{busy ? <Loader2 className="animate-spin" /> : order.status === "ready" ? <Check /> : <ArrowRight />}{action}</Button>}
      </div>
    </article>
  );
}