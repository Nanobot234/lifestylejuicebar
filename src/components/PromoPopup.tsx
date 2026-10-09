import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Sparkles, Copy, Check } from "lucide-react";
import { useLocation } from "react-router-dom";

const STORAGE_KEY = "lifestyle1104_promo_dismissed";
const DELAY_MS = 8000;
const PROMO_CODE = "WELCOME15";

const PromoPopup = () => {
  const { pathname } = useLocation();
  const staffScreen = pathname === "/live-orders" || pathname === "/business-dashboard";
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (staffScreen) { setOpen(false); return; }
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(t);
  }, [staffScreen]);

  const handleClose = (val: boolean) => {
    setOpen(val);
    if (!val) localStorage.setItem(STORAGE_KEY, "1");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      toast.error("Please enter a valid email.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: trimmed, discount_code: PROMO_CODE, source: "promo_popup" });
      if (error && !error.message?.toLowerCase().includes("duplicate")) {
        throw error;
      }
      setSubscribed(true);
      localStorage.setItem(STORAGE_KEY, "1");
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      toast.success("Code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — please copy manually.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!subscribed ? (
          <>
            <DialogHeader className="text-center items-center">
              <div className="h-12 w-12 rounded-full bg-juicy-green/10 flex items-center justify-center mb-2">
                <Sparkles className="h-6 w-6 text-juicy-green" />
              </div>
              <DialogTitle className="font-display text-2xl">Enjoy 15% off your first order</DialogTitle>
              <DialogDescription>
                Plus fresh tips and new-menu drops — straight to your inbox.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                required
              />
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Sending…" : "Send me the code"}
              </Button>
              <button
                type="button"
                onClick={() => handleClose(false)}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                No thanks
              </button>
            </form>
          </>
        ) : (
          <>
            <DialogHeader className="text-center items-center">
              <div className="h-12 w-12 rounded-full bg-juicy-green/10 flex items-center justify-center mb-2">
                <Check className="h-6 w-6 text-juicy-green" />
              </div>
              <DialogTitle className="font-display text-2xl">You're in!</DialogTitle>
              <DialogDescription>
                Use this code at checkout for 15% off your first order.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-2 flex items-center justify-between gap-2 border-2 border-dashed border-juicy-green/40 rounded-lg p-4 bg-juicy-green/5">
              <span className="font-mono text-xl tracking-widest font-semibold">{PROMO_CODE}</span>
              <Button size="sm" variant="outline" onClick={copyCode}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button className="w-full mt-3" onClick={() => handleClose(false)}>
              Start shopping
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PromoPopup;