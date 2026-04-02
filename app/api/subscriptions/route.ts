import { stripe } from "@/lib/stripe";
import { supabaseServer } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { formatErrorResponse } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { user_id, plan_type } = await request.json();

    if (!user_id || !plan_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const monthlyPriceId = (process.env.STRIPE_MONTHLY_PRICE_ID || "").trim();
    const yearlyPriceId = (process.env.STRIPE_YEARLY_PRICE_ID || "").trim();

    if (!monthlyPriceId || !yearlyPriceId) {
      return NextResponse.json(
        {
          error:
            "Stripe prices are not configured. Set STRIPE_MONTHLY_PRICE_ID and STRIPE_YEARLY_PRICE_ID.",
        },
        { status: 500 },
      );
    }

    if (
      monthlyPriceId.includes("replace_with") ||
      yearlyPriceId.includes("replace_with")
    ) {
      return NextResponse.json(
        {
          error:
            "Stripe price IDs are placeholders. Replace STRIPE_MONTHLY_PRICE_ID and STRIPE_YEARLY_PRICE_ID in .env.local.",
        },
        { status: 500 },
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseServer
      .from("profiles")
      .select("*")
      .eq("id", user_id)
      .single();

    if (profileError) throw profileError;
    if (!profile) throw new Error("User not found");

    // Get or create Stripe customer
    let customerId = profile.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile.email,
        name: profile.full_name,
        metadata: {
          user_id,
        },
      });
      customerId = customer.id;

      // Update profile with Stripe customer ID
      await supabaseServer
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user_id);
    }

    // Define price IDs (should be configured in environment)
    const priceIds = {
      monthly: monthlyPriceId,
      yearly: yearlyPriceId,
    };

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceIds[plan_type as keyof typeof priceIds],
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `https://golfcharity-three.vercel.app/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://golfcharity-three.vercel.app/pricing`,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    const { message, statusCode } = formatErrorResponse(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseServer
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return NextResponse.json({
      success: true,
      data: data || null,
    });
  } catch (error) {
    const { message, statusCode } = formatErrorResponse(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
