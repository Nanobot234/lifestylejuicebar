// Creates (or resumes) Stripe Connect Express onboarding for the store owner's
// payout account. Only a signed-in business owner can call this.
// Money then flows: customer -> platform -> connected account, minus our platform fee.
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const environment: StripeEnv = body.environment === "live" ? "live" : "sandbox";
    const returnUrl: string = typeof body.returnUrl === "string" ? body.returnUrl : "";
    if (!returnUrl.startsWith("http")) throw new Error("Invalid return URL");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Authenticate and authorize: business owners only.
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);
    const { data: userData } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);
    const { data: profile } = await admin
      .from("profiles")
      .select("role, email")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "business_owner") return json({ error: "Forbidden" }, 403);

    const stripe = createStripeClient(environment);

    const { data: existing } = await admin
      .from("connect_accounts")
      .select("*")
      .eq("environment", environment)
      .maybeSingle();

    let accountId = existing?.stripe_account_id as string | undefined;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "US",
        email: (profile?.email as string) ?? user.email ?? undefined,
        business_type: "company",
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: { name: "Lifestyle 1104", product_description: "Juice bar, smoothies and wellness products" },
      });
      accountId = account.id;
      await admin.from("connect_accounts").upsert(
        {
          environment,
          stripe_account_id: accountId,
          details_submitted: account.details_submitted ?? false,
          charges_enabled: account.charges_enabled ?? false,
          payouts_enabled: account.payouts_enabled ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "environment" },
      );
    }

    const link = await stripe.accountLinks.create({
      account: accountId!,
      refresh_url: returnUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return json({ url: link.url, accountId });
  } catch (error) {
    console.error("connect-onboard error:", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
