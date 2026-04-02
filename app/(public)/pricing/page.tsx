"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { PricingPlan } from "@/types";
import { supabase } from "@/lib/supabase";

const PRICING_PLANS: PricingPlan[] = [
  {
    id: "monthly",
    type: "monthly",
    name: "Monthly",
    price: 9.99,
    features: [
      "Track up to 5 golf scores",
      "Monthly draw participation",
      "Charity contribution (10%+)",
      "Dashboard access",
      "Prize eligibility",
      "Email support",
    ],
    stripePriceId: "price_monthly",
  },
  {
    id: "yearly",
    type: "yearly",
    name: "Yearly",
    price: 99.99,
    discount: 16,
    features: [
      "All monthly features",
      "Save 17% vs monthly",
      "Priority support",
      "Exclusive member benefits",
      "Annual charity report",
      "Early access to draws",
    ],
    stripePriceId: "price_yearly",
  },
];

export default function PricingPage() {
  const [isStartingCheckout, setIsStartingCheckout] = useState<
    "monthly" | "yearly" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  const handleStartCheckout = async (planType: "monthly" | "yearly") => {
    setError(null);
    setIsStartingCheckout(planType);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/signup";
        return;
      }

      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          plan_type: planType,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.checkoutUrl) {
        throw new Error(data?.error || "Unable to start checkout");
      }

      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start payment flow",
      );
      setIsStartingCheckout(null);
    }
  };

  return (
    <div className="min-h-screen py-20 md:py-32">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="primary" className="mb-4">
            Simple Pricing
          </Badge>
          <h1 className="heading-h1 mb-4">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Flexible plans that fit your budget. Minimum 10% of your
            subscription goes to charity.
          </p>
          {error && (
            <Alert variant="error" className="mt-6 max-w-2xl mx-auto text-left">
              {error}
            </Alert>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {PRICING_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${plan.type === "yearly" ? "border-primary md:scale-105" : ""}`}
            >
              {plan.type === "yearly" && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge variant="success">BEST VALUE</Badge>
                </div>
              )}
              <CardHeader>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground ml-2">
                    /{plan.type === "monthly" ? "month" : "year"}
                  </span>
                </div>
                {plan.discount && (
                  <p className="text-sm text-accent">
                    Save {plan.discount}% compared to monthly
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="text-primary text-xl mt-1">✓</span>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  size="lg"
                  isLoading={isStartingCheckout === plan.type}
                  disabled={isStartingCheckout !== null}
                  onClick={() => handleStartCheckout(plan.type)}
                >
                  {isStartingCheckout === plan.type
                    ? "Redirecting to secure payment..."
                    : "Get Started"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div>
            <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
            <p className="text-sm text-muted-foreground">
              Yes, you can cancel your subscription at any time without
              penalties or questions.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Can I change my charity?</h3>
            <p className="text-sm text-muted-foreground">
              You can change your selected charity anytime from your dashboard.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">How often are draws?</h3>
            <p className="text-sm text-muted-foreground">
              Draws are held monthly. Prize pool rolls over if there's no
              jackpot winner.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">
              Do I need a golf club membership?
            </h3>
            <p className="text-sm text-muted-foreground">
              No, anyone can participate! Track scores from any course
              worldwide.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
