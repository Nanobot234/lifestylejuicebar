import React, { useCallback, useMemo } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

interface StripeEmbeddedCheckoutProps {
  /** Edge function that creates the checkout session and returns a clientSecret. */
  functionName: "create-cart-checkout" | "create-checkout" | "create-recurring-checkout";
  /** Request body for that function (environment and returnUrl are added automatically). */
  body: Record<string, unknown>;
  /** Where Stripe sends the payer after payment. */
  returnUrl: string;
}

/**
 * Renders Stripe's embedded checkout form inline.
 * The client secret is fetched from a Lovable-managed edge function, so no
 * Stripe keys ever touch the browser beyond the publishable token.
 */
export const StripeEmbeddedCheckout: React.FC<StripeEmbeddedCheckoutProps> = ({
  functionName,
  body,
  returnUrl,
}) => {
  const serializedBody = JSON.stringify(body);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: {
        ...JSON.parse(serializedBody),
        returnUrl,
        environment: getStripeEnvironment(),
      },
    });
    if (error || !data?.clientSecret) {
      throw new Error(data?.error || error?.message || "Failed to create checkout session");
    }
    return data.clientSecret as string;
  }, [functionName, serializedBody, returnUrl]);

  // Memoized so the provider is not remounted (which Stripe forbids once created).
  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
};

export default StripeEmbeddedCheckout;
