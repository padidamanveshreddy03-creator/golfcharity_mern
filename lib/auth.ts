import { supabase, supabaseServer } from "./supabase";

/**
 * Get current user from session
 */
export async function getCurrentUserSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const user = await getCurrentUserSession();
  return !!user;
}

/**
 * Create a new user profile
 */
export async function createUserProfile(
  userId: string,
  email: string,
  fullName?: string,
) {
  const { data, error } = await supabaseServer
    .from("profiles")
    .insert({
      id: userId,
      email,
      full_name: fullName,
      is_admin: false,
    })
    .select();

  if (error) throw error;
  return data?.[0];
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: { full_name?: string; avatar_url?: string },
) {
  const { data, error } = await supabaseServer
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select();

  if (error) throw error;
  return data?.[0];
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(userId: string) {
  const { data, error } = await supabaseServer
    .from("profiles")
    .select("is_admin")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data?.is_admin || false;
}

/**
 * Validate user subscription
 */
export async function validateSubscription(userId: string) {
  const { data, error } = await supabaseServer
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .gte("current_period_end", new Date().toISOString())
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return !!data;
}

/**
 * Update subscription status
 */
export async function updateSubscriptionStatus(
  subscriptionId: string,
  status: "active" | "cancelled" | "expired" | "pending",
) {
  const { data, error } = await supabaseServer
    .from("subscriptions")
    .update({ status })
    .eq("id", subscriptionId)
    .select();

  if (error) throw error;
  return data?.[0];
}

/**
 * Get or create subscription
 */
export async function getOrCreateSubscription(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  planType: "monthly" | "yearly",
  amountCents: number,
) {
  // Check if subscription exists
  const { data: existingSubscription, error: fetchError } = await supabaseServer
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (fetchError && fetchError.code === "PGRST116") {
    // No subscription exists, create one
    const { data, error } = await supabaseServer
      .from("subscriptions")
      .insert({
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId,
        plan_type: planType,
        amount_in_cents: amountCents,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: getPeriodEnd(planType),
      })
      .select();

    if (error) throw error;
    return data?.[0];
  }

  if (fetchError) throw fetchError;

  // Update existing subscription
  const { data, error } = await supabaseServer
    .from("subscriptions")
    .update({
      stripe_subscription_id: stripeSubscriptionId,
      plan_type: planType,
      amount_in_cents: amountCents,
      status: "active",
      current_period_end: getPeriodEnd(planType),
    })
    .eq("id", existingSubscription.id)
    .select();

  if (error) throw error;
  return data?.[0];
}

/**
 * Calculate period end date
 */
function getPeriodEnd(planType: "monthly" | "yearly"): string {
  const now = new Date();
  if (planType === "monthly") {
    now.setMonth(now.getMonth() + 1);
  } else {
    now.setFullYear(now.getFullYear() + 1);
  }
  return now.toISOString();
}

/**
 * Handle Stripe webhook - subscription updated
 */
export async function handleSubscriptionUpdate(
  subscriptionId: string,
  data: {
    status: string;
    cancel_at_period_end: boolean;
    current_period_end: number;
  },
) {
  const { data: subscription, error } = await supabaseServer
    .from("subscriptions")
    .update({
      status: data.status === "active" ? "active" : "cancelled",
      cancel_at_period_end: data.cancel_at_period_end,
      current_period_end: new Date(
        data.current_period_end * 1000,
      ).toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId)
    .select();

  if (error) throw error;
  return subscription?.[0];
}

/**
 * Handle Stripe webhook - customer subscription deleted
 */
export async function handleSubscriptionDeleted(subscriptionId: string) {
  const { data, error } = await supabaseServer
    .from("subscriptions")
    .update({
      status: "cancelled",
    })
    .eq("stripe_subscription_id", subscriptionId)
    .select();

  if (error) throw error;
  return data?.[0];
}
