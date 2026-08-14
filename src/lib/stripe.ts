import { loadStripe, Stripe } from "@stripe/stripe-js";

/** Which Stripe environment this build talks to. */
export type StripeEnv = "sandbox" | "live";

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

/**
 * Derives the payments environment from the publishable token prefix.
 * Never defaults to "live" — a missing token is a configuration error.
 */
function paymentsEnvironment(): StripeEnv {
  if (clientToken?.startsWith("pk_test_")) return "sandbox";
  if (clientToken?.startsWith("pk_live_")) return "live";
  throw new Error(
    "Stripe payments are not configured for this build. Complete Stripe go-live to enable production checkout.",
  );
}

let stripePromise: Promise<Stripe | null> | null = null;

/** Lazily loads Stripe.js with the correct publishable token. */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    paymentsEnvironment();
    stripePromise = loadStripe(clientToken as string);
  }
  return stripePromise;
}

/** Returns "sandbox" or "live" for the current build. */
export function getStripeEnvironment(): StripeEnv {
  return paymentsEnvironment();
}
