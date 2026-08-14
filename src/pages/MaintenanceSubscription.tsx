
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * MaintenanceSubscription landing page.
 * When opened it immediately creates a Stripe subscription checkout session for
 * $85/month and redirects the payer to Stripe. If the creation fails, it shows
 * a retry button instead of leaving the user on a blank page.
 */
const MaintenanceSubscription: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const createSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        "create-maintenance-subscription",
        { body: {} }
      );

      if (functionError) {
        throw functionError;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create checkout session";
      console.error("Maintenance subscription error:", err);
      setError(message);
      toast.error("Could not start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    createSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-2 font-montserrat">
            Website Maintenance
          </h1>
          <p className="text-gray-600 mb-6">
            $85/month for site maintenance, updates, and domain management.
          </p>

          {isLoading && (
            <div className="flex flex-col items-center">
              <Loader2 className="h-10 w-10 animate-spin text-juicy-green mb-4" />
              <p className="text-sm text-gray-500">Preparing secure checkout...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="space-y-4">
              <p className="text-red-600 text-sm">{error}</p>
              <Button
                onClick={createSession}
                className="bg-juicy-green hover:bg-juicy-green/90"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Checkout
              </Button>
            </div>
          )}

          {!isLoading && !error && (
            <p className="text-sm text-gray-500">Redirecting to Stripe...</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MaintenanceSubscription;
