import { useEffect, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Bell, Check, ClipboardList, Maximize, Minimize, RefreshCw, Volume2, VolumeX, Wifi, WifiOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useLiveOrders } from "@/hooks/useLiveOrders";
import { liveStatuses, sortLiveOrders, type LiveStatus } from "@/lib/liveOrders";
import LiveOrderTicket from "@/components/business/live/LiveOrderTicket";
import logo from "@/assets/logo.webp";

const statusLabels = { pending: "New orders", preparing: "Preparing", ready: "Ready" };

export default function LiveOrders() {
  const { isLoading: authLoading, isAuthenticated, isBusinessOwner } = useAuth();
  const live = useLiveOrders(!authLoading && isAuthenticated && isBusinessOwner);
  const [status, setStatus] = useState<LiveStatus | "all">("all");
  const [method, setMethod] = useState("all");
  const [location, setLocation] = useState("all");
  const [now, setNow] = useState(Date.now());
  const [sound, setSound] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const audio = useRef<AudioContext | null>(null);
  const arrivalsRef = useRef(0);

  const chime = () => {
    const ctx = audio.current;
    if (!ctx || ctx.state !== "running") return;
    [660, 880, 1100].forEach((frequency, i) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain); gain.connect(ctx.destination);
      oscillator.frequency.value = frequency;
      const start = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
      oscillator.start(start); oscillator.stop(start + 0.5);
    });
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => { clearInterval(timer); document.removeEventListener("fullscreenchange", onFullscreen); void audio.current?.close(); };
  }, []);

  useEffect(() => {
    if (sound && live.arrivals.length > arrivalsRef.current) chime();
    arrivalsRef.current = live.arrivals.length;
    if (!sound || !live.arrivals.length) return;
    const repeat = setInterval(chime, 12000);
    return () => clearInterval(repeat);
  }, [sound, live.arrivals]);

  const toggleSound = async () => {
    if (sound) { setSound(false); return; }
    try {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      setSound(true);
      chime();
    } catch { setSound(false); }
  };
  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { /* Some tablets use browser full-screen controls instead. */ }
  };

  if (authLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="size-8 animate-spin" aria-label="Loading account" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isBusinessOwner) return <Navigate to="/" replace />;

  const orders = sortLiveOrders(live.data ?? []);
  const filtered = orders.filter(order =>
    (status === "all" || order.status === status) &&
    (method === "all" || order.orderDetails.deliveryMethod === method) &&
    (location === "all" || (order.orderDetails.deliveryMethod === "pickup" && (order.orderDetails.address ?? "").includes(location === "bronx" ? "167th" : "35th"))));

  return (
    <main className="live-orders min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4"><img src={logo} alt="Lifestyle 1104" className="h-14 w-20 object-contain" /><div className="border-l border-border pl-4"><h1 className="text-2xl font-bold">Live orders</h1><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">{live.connected ? <Wifi className="size-4 text-order-ready" /> : <WifiOff className="size-4 text-order-new" />}{live.connected ? "Connected" : "Reconnecting · auto-refresh on"}<span className="hidden sm:inline">· {new Date(now).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span></p></div></div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="h-12" onClick={toggleSound} aria-pressed={sound}>{sound ? <Volume2 /> : <VolumeX />}{sound ? "Sound on" : "Enable sound"}</Button>
            <Button variant="outline" size="icon" className="size-12" onClick={() => void live.refetch()} disabled={live.isFetching} title="Refresh orders" aria-label="Refresh orders"><RefreshCw className={live.isFetching ? "animate-spin" : ""} /></Button>
            {document.fullscreenEnabled && <Button variant="outline" size="icon" className="size-12" onClick={toggleFullscreen} title={fullscreen ? "Exit full screen" : "Full screen"} aria-label={fullscreen ? "Exit full screen" : "Full screen"}>{fullscreen ? <Minimize /> : <Maximize />}</Button>}
            <Button asChild variant="ghost" className="h-12"><Link to="/business-dashboard"><ArrowLeft />Records</Link></Button>
          </div>
        </div>
      </header>

      {live.arrivals.length > 0 && <section role="alert" className="sticky top-0 z-20 border-b border-order-new bg-order-new px-4 py-4 text-order-ink md:px-8"><div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><Bell className="size-7 motion-safe:animate-pulse" /><div><p className="text-xl font-bold">{live.arrivals.length} new {live.arrivals.length === 1 ? "order has" : "orders have"} arrived</p><p className="mt-1 text-sm">{orders.filter(o => live.arrivals.includes(o.id)).map(o => `#${o.orderNumber ?? o.id.slice(-6)}`).join(" · ")}</p></div></div><Button className="h-12" onClick={() => { live.acknowledge(); setStatus("pending"); setMethod("all"); setLocation("all"); }}><Check />Acknowledge</Button></div></section>}

      <div className="mx-auto max-w-[1600px] px-4 py-6 md:px-8">
        <div className="mb-6 grid grid-cols-3 gap-3" aria-label="Order status filters">
          {liveStatuses.map(key => <Button key={key} variant="outline" onClick={() => setStatus(status === key ? "all" : key)} aria-pressed={status === key} className={`status-summary-${key} h-auto min-h-24 flex-col items-start justify-between whitespace-normal border-l-4 px-4 py-3 text-left ${status === key ? "ring-2 ring-ring" : ""}`}><span className="text-sm font-semibold sm:text-base">{statusLabels[key]}</span><span className="text-3xl font-bold tabular-nums">{orders.filter(o => o.status === key).length}</span></Button>)}
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <div><h2 className="text-xl font-bold">{status === "all" ? "Order queue" : statusLabels[status]} <span className="ml-1 text-muted-foreground">({filtered.length})</span></h2><p className="mt-1 text-sm text-muted-foreground">Oldest first{live.dataUpdatedAt ? ` · Updated ${new Date(live.dataUpdatedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}` : ""}</p></div>
          <div className="flex flex-wrap items-center gap-3">
            {status !== "all" && <Button variant="ghost" onClick={() => setStatus("all")}>All statuses</Button>}
            <label className="text-sm font-medium">Fulfillment<select aria-label="Fulfillment" className="ml-2 h-12 max-w-full rounded-md border border-input bg-card px-3 text-base" value={method} onChange={e => { setMethod(e.target.value); if (e.target.value !== "pickup") setLocation("all"); }}><option value="all">All orders</option><option value="pickup">Pickup</option><option value="shipping">Shipping</option><option value="delivery">Local delivery</option></select></label>
            <label className="text-sm font-medium">Location<select aria-label="Location" className="ml-2 h-12 max-w-full rounded-md border border-input bg-card px-3 text-base" value={location} onChange={e => { setLocation(e.target.value); if (e.target.value !== "all") setMethod("pickup"); }}><option value="all">All locations</option><option value="bronx">Bronx pickup</option><option value="manhattan">Manhattan pickup</option></select></label>
          </div>
        </div>

        {live.isError && <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive bg-destructive/10 p-4"><p>Orders could not refresh. {live.data ? "Showing the last received orders." : "Check your connection and try again."}</p><Button variant="outline" onClick={() => void live.refetch()}>Retry</Button></div>}
        {live.isLoading ? <div className="flex justify-center py-24"><Loader2 className="size-10 animate-spin" aria-label="Loading orders" /></div> : filtered.length ? <div className="grid items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{filtered.map(order => <LiveOrderTicket key={order.id} order={order} now={now} highlighted={live.arrivals.includes(order.id)} busy={live.mutation.isPending && live.mutation.variables?.order.id === order.id} onAdvance={newStatus => live.mutation.mutate({ order, status: newStatus })} />)}</div> : !live.isError && <section className="flex min-h-[360px] flex-col items-center justify-center text-center"><div className="mb-5 flex size-20 items-center justify-center rounded-full bg-muted"><ClipboardList className="size-9 text-muted-foreground" /></div><h2 className="text-2xl font-bold">{orders.length ? "No matching orders" : "All caught up"}</h2><p className="mt-3 text-base text-muted-foreground">{orders.length ? "No orders in this view." : "Waiting for the next order."}</p>{orders.length > 0 && <Button variant="outline" className="mt-5 h-12" onClick={() => { setStatus("all"); setMethod("all"); setLocation("all"); }}>Show all orders</Button>}</section>}
      </div>
    </main>
  );
}