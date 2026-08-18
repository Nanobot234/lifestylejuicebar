/**
 * Stripe Connect payouts admin panel.
 *
 * Lets the business owner onboard the store's own Stripe account (Express).
 * Once onboarding is complete, customer payments are sent straight to that
 * account and the platform keeps a fixed fee per order.
 */
import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";
import { Loader2, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

interface ConnectStatus {
  connected: boolean;
  accountId?: string;
  detailsSubmitted?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  platformFeeCents?: number;
}

const PayoutsTab = () => {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  const environment = (() => {
    try {
      return getStripeEnvironment();
    } catch {
      return "sandbox" as const;
    }
  })();

  const loadStatus = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("connect-status", {
      body: { environment },
    });
    if (error) {
      console.error("connect-status failed:", error);
      toast.error("Could not load payout status");
    } else {
      setStatus(data as ConnectStatus);
    }
    setLoading(false);
  }, [environment]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const startOnboarding = async () => {
    setStarting(true);
    const { data, error } = await supabase.functions.invoke("connect-onboard", {
      body: { environment, returnUrl: `${window.location.origin}/business-dashboard` },
    });
    setStarting(false);
    if (error || !data?.url) {
      console.error("connect-onboard failed:", error, data);
      toast.error(data?.error ?? "Could not start Stripe onboarding");
      return;
    }
    window.location.href = data.url as string;
  };

  const feeLabel = `$${((status?.platformFeeCents ?? 150) / 100).toFixed(2)}`;
  const ready = Boolean(status?.chargesEnabled);

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Payouts &amp; Connected Account
            <Badge variant={environment === "live" ? "default" : "secondary"}>
              {environment === "live" ? "Live mode" : "Test mode"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Connect the store's own Stripe account so order payments land there directly. A {feeLabel} platform
            fee is deducted from each order automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking status…
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2">
                {ready ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                )}
                <div className="text-sm">
                  {ready ? (
                    <p className="font-medium">
                      Connected — payments are routed to the store's Stripe account.
                    </p>
                  ) : status?.connected ? (
                    <p className="font-medium">
                      Onboarding started but not finished. Continue below to unlock payouts.
                    </p>
                  ) : (
                    <p className="font-medium">No connected account yet. Start onboarding below.</p>
                  )}
                  {status?.accountId && (
                    <p className="text-muted-foreground">Account: {status.accountId}</p>
                  )}
                  {status?.connected && (
                    <ul className="text-muted-foreground mt-2 space-y-1">
                      <li>Details submitted: {status.detailsSubmitted ? "Yes" : "No"}</li>
                      <li>Can accept charges: {status.chargesEnabled ? "Yes" : "No"}</li>
                      <li>Payouts enabled: {status.payoutsEnabled ? "Yes" : "No"}</li>
                    </ul>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={startOnboarding} disabled={starting}>
                  {starting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {status?.connected ? "Continue Stripe onboarding" : "Connect Stripe account"}
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
                <Button variant="outline" onClick={loadStatus} disabled={loading}>
                  Refresh status
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PayoutsTab;
