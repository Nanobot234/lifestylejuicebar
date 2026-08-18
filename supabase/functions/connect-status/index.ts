// Returns the current onboarding/payout status of the connected Stripe account
// and refreshes the cached flags in the database. Business owners only.
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

    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);
    const { data: userData } = await admin.auth.getUser(token);
    if (!userData?.user) return json({ error: "Unauthorized" }, 401);
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (profile?.role !== "business_owner") return json({ error: "Forbidden" }, 403);

    const { data: row } = await admin
      .from("connect_accounts")
      .select("*")
      .eq("environment", environment)
      .maybeSingle();

    if (!row) return json({ connected: false });

    const stripe = createStripeClient(environment);
    const account = await stripe.accounts.retrieve(row.stripe_account_id as string);

    await admin
      .from("connect_accounts")
      .update({
        details_submitted: account.details_submitted ?? false,
        charges_enabled: account.charges_enabled ?? false,
        payouts_enabled: account.payouts_enabled ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("environment", environment);

    return json({
      connected: true,
      accountId: account.id,
      detailsSubmitted: account.details_submitted ?? false,
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
      platformFeeCents: row.platform_fee_cents ?? 150,
    });
  } catch (error) {
    console.error("connect-status error:", error);
    return json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
