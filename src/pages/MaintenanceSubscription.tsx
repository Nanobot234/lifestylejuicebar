
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import StripeEmbeddedCheckout from "@/components/StripeEmbeddedCheckout";

/**
 * MaintenanceSubscription landing page.
 * Shows the $85/month maintenance plan and mounts Stripe's embedded checkout
 * inline. After payment Stripe returns here with ?paid=1 and a session id.
 */
const MaintenanceSubscription: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paid = searchParams.get("paid") === "1";
  const [showCheckout, setShowCheckout] = useState(false);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="max-w-xl w-full bg-white rounded-xl shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-2 font-montserrat">
            Website Maintenance
          </h1>
          <p className="text-gray-600 mb-6">
            $85/month for site maintenance, updates, and domain management.
          </p>

          {paid ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="h-12 w-12 text-juicy-green" />
              <p className="font-medium">Subscription active — thank you!</p>
              <p className="text-sm text-gray-500">
                A receipt has been emailed to you. You can cancel any time.
              </p>
            </div>
          ) : showCheckout ? (
            <StripeEmbeddedCheckout
              functionName="create-checkout"
              body={{ priceId: "site_maintenance_monthly", quantity: 1 }}
              returnUrl={`${window.location.origin}/maintenance?paid=1&session_id={CHECKOUT_SESSION_ID}`}
            />
          ) : (
            <Button
              onClick={() => setShowCheckout(true)}
              className="bg-juicy-green hover:bg-juicy-green/90"
            >
              Subscribe — $85/month
            </Button>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MaintenanceSubscription;
