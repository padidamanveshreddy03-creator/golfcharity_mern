import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase";
import { getOrCreateSubscription } from "@/lib/auth";
import { formatErrorResponse } from "@/lib/utils";

type AppSubscriptionStatus = "active" | "cancelled" | "expired" | "pending";

function mapStripeStatus(status: string): AppSubscriptionStatus {
  if (status === "active" || status === "trialing") {
    return "active";
  }

  if (status === "incomplete" || status === "past_due" || status === "unpaid") {
    return "pending";
  }

  if (status === "canceled" || status === "incomplete_expired") {
    return "cancelled";
  }

  return "pending";
}

export async function POST(request: NextRequest) {
  try {
    const { user_id, session_id } = await request.json();

    if (!user_id || !session_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(
      session_id,
      {
        expand: ["subscription", "customer"],
      },
    );

    if (!checkoutSession.subscription || !checkoutSession.customer) {
      return NextResponse.json(
        { error: "No subscription found for this checkout session" },
        { status: 400 },
      );
    }

    const subscription = checkoutSession.subscription;
    const customer = checkoutSession.customer;

    if (typeof subscription === "string" || typeof customer === "string") {
      return NextResponse.json(
        { error: "Unable to expand Stripe checkout session details" },
        { status: 500 },
      );
    }

    if ("deleted" in customer && customer.deleted) {
      return NextResponse.json(
        { error: "Stripe customer was deleted" },
        { status: 400 },
      );
    }

    const subscriptionUserId = customer.metadata?.user_id;
    if (subscriptionUserId && subscriptionUserId !== user_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const planType =
      subscription.items.data[0]?.price?.recurring?.interval === "year"
        ? "yearly"
        : "monthly";
    const amountCents = subscription.items.data[0]?.price?.unit_amount || 0;

    const savedSubscription = await getOrCreateSubscription(
      user_id,
      customer.id,
      subscription.id,
      planType,
      amountCents,
    );

    if (!savedSubscription?.id) {
      throw new Error("Failed to save subscription");
    }

    const normalizedStatus = mapStripeStatus(subscription.status);

    const { data: updatedSubscription, error: updateError } =
      await supabaseServer
        .from("subscriptions")
        .update({
          status: normalizedStatus,
          current_period_start: new Date(
            subscription.current_period_start * 1000,
          ).toISOString(),
          current_period_end: new Date(
            subscription.current_period_end * 1000,
          ).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        })
        .eq("id", savedSubscription.id)
        .select("*")
        .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      data: updatedSubscription,
    });
  } catch (error) {
    const { message, statusCode } = formatErrorResponse(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
