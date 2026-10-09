import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { advanceLiveOrder, fetchLiveOrders } from "@/services/liveOrdersService";
import { newlyArrivedOrders } from "@/lib/liveOrders";
import type { Order } from "@/types";
import { toast } from "sonner";

export function useLiveOrders(enabled: boolean) {
  const client = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [arrivals, setArrivals] = useState<string[]>([]);
  const known = useRef<Set<string> | null>(null);
  const query = useQuery({ queryKey: ["liveOrders"], queryFn: fetchLiveOrders, enabled,
    refetchInterval: 15000, refetchOnWindowFocus: true });

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => client.invalidateQueries({ queryKey: ["liveOrders"] }), 250);
    };
    const channel = supabase.channel("staff-live-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, refresh)
      .subscribe(status => {
        setConnected(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") refresh();
      });
    const onOnline = () => refresh();
    const onOffline = () => setConnected(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [enabled, client]);

  useEffect(() => {
    if (!query.data) return;
    if (known.current) {
      const added = newlyArrivedOrders(known.current, query.data);
      if (added.length) setArrivals(prev => [...new Set([...prev, ...added.map(o => o.id)])]);
    }
    const previous = known.current ?? new Set<string>();
    query.data.forEach(order => previous.add(order.id));
    known.current = previous;
    setArrivals(prev => prev.filter(id => query.data.some(o => o.id === id && o.status === "pending")));
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: ({ order, status }: { order: Order; status: Order["status"] }) => advanceLiveOrder(order, status),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["liveOrders"] });
      void client.invalidateQueries({ queryKey: ["allOrders"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Unable to update order.");
      void client.invalidateQueries({ queryKey: ["liveOrders"] });
    },
  });
  return { ...query, connected, arrivals, acknowledge: () => setArrivals([]), mutation };
}