import Stripe from "stripe";

function normalizeEnv(value: string | undefined): string {
  return (value || "").trim().replace(/^['\"]|['\"]$/g, "");
}

const stripeSecretKey = normalizeEnv(process.env.STRIPE_SECRET_KEY);

if (!stripeSecretKey || stripeSecretKey.includes("your_str")) {
  throw new Error(
    "Stripe is not configured. Set a valid STRIPE_SECRET_KEY in .env.local.",
  );
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

export { stripe };

// Create a Stripe customer
export async function createStripeCustomer(email: string, name?: string) {
  const customer = await stripe.customers.create({
    email,
    name,
  });
  return customer;
}

// Get Stripe customer
export async function getStripeCustomer(customerId: string) {
  return await stripe.customers.retrieve(customerId);
}

// Create checkout session
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  mode: "subscription" | "payment" = "subscription",
  cancelUrl: string,
  successUrl: string,
) {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode,
    allow_promotion_codes: true,
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}

// Get subscription
export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId);
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

// Update subscription
export async function updateSubscription(
  subscriptionId: string,
  updates: Stripe.SubscriptionUpdateParams,
) {
  return await stripe.subscriptions.update(subscriptionId, updates);
}

// List invoices for customer
export async function getCustomerInvoices(customerId: string) {
  return await stripe.invoices.list({
    customer: customerId,
    limit: 10,
  });
}

// Get products and prices
export async function getStripePrices() {
  return await stripe.prices.list({
    limit: 100,
  });
}

// Construct event from webhook
export async function constructWebhookEvent(
  body: string | Buffer,
  sig: string,
  secret: string,
) {
  let event = stripe.webhooks.constructEvent(body, sig, secret);
  return event;
}

// Get payment intent
export async function getPaymentIntent(paymentIntentId: string) {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

// Refund payment
export async function refundPayment(chargeId: string, amount?: number) {
  return await stripe.refunds.create({
    charge: chargeId,
    amount,
  });
}
