import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase";
import {
  handleSubscriptionUpdate,
  handleSubscriptionDeleted,
  getOrCreateSubscription,
} from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  try {
    // Store the event in database
    await supabaseServer.from("stripe_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      event_data: event.data,
      processed: false,
    });

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.customer && session.subscription) {
          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer.id;
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id;

          // Get subscription details
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);

          // Get customer
          const customer = await stripe.customers.retrieve(customerId);

          if ("deleted" in customer && customer.deleted) {
            break;
          }

          const userId = customer.metadata?.user_id;

          if (userId) {
            // Determine plan type
            const planType =
              subscription.items.data[0].price.recurring?.interval === "year"
                ? "yearly"
                : "monthly";

            // Create or update subscription in DB
            await getOrCreateSubscription(
              userId,
              customerId,
              subscriptionId,
              planType,
              subscription.items.data[0].price.unit_amount || 0,
            );
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription.id, {
          status: subscription.status,
          cancel_at_period_end: subscription.cancel_at_period_end,
          current_period_end: subscription.current_period_end,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription.id);
        break;
      }

      case "invoice.payment_succeeded": {
        // Handle successful invoice payment
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice paid:", invoice.id);
        break;
      }

      case "invoice.payment_failed": {
        // Handle failed invoice payment
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Invoice payment failed:", invoice.id);
        break;
      }
    }

    // Mark event as processed
    await supabaseServer
      .from("stripe_events")
      .update({ processed: true })
      .eq("stripe_event_id", event.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
