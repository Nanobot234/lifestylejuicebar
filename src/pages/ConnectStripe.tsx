import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";

const ConnectStripe = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isBusinessOwner, isLoading: authLoading } = useAuth();
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) return;
    if (!isBusinessOwner) return;

    const startOnboarding = async () => {
      setStarting(true);
      try {
        const environment = getStripeEnvironment();
        const { data, error } = await supabase.functions.invoke("connect-onboard", {
          body: { environment, returnUrl: `${window.location.origin}/business-dashboard` },
        });
        if (error || !data?.url) {
          console.error("connect-onboard failed:", error, data);
          toast.error(data?.error ?? "Could not start Stripe onboarding");
          setStarting(false);
          return;
        }
        window.location.href = data.url as string;
      } catch (err) {
        console.error("connect-onboard exception:", err);
        toast.error("Could not start Stripe onboarding");
        setStarting(false);
      }
    };

    startOnboarding();
  }, [isAuthenticated, isBusinessOwner, authLoading, navigate]);

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Sign in required</CardTitle>
              <CardDescription>
                You need to sign in as the business owner before connecting Stripe.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/login")} className="w-full">
                Sign in
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!isBusinessOwner) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Owner access only</CardTitle>
              <CardDescription>
                Only the business owner can connect a Stripe account. The signed-in account does not
                have owner permissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                Go home
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Connect Stripe
              {starting && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <CardDescription>
              Redirecting you to Stripe to complete the connected account setup…
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled={starting} className="w-full">
              {starting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Continue to Stripe
              <ExternalLink className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ConnectStripe;
