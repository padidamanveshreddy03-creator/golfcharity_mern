"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Charity } from "@/types";
import { supabase } from "@/lib/supabase";
import { Alert } from "@/components/ui/Alert";

export default function CharityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const charityId = params.id as string;
  const [charity, setCharity] = useState<Charity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupporting, setIsSupporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSupportCharity = async () => {
    try {
      setIsSupporting(true);
      setError(null);
      setSuccess(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push(`/signup?charity=${charityId}`);
        return;
      }

      // Keep exactly one selected charity per user for dashboard compatibility.
      const { error: deleteError } = await supabase
        .from("user_charity")
        .delete()
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      const { error: insertError } = await (
        supabase.from("user_charity") as any
      ).insert({
        user_id: user.id,
        charity_id: charityId,
        contribution_percentage: 10,
      });

      if (insertError) throw insertError;

      setSuccess("Charity selected. You can now continue from your dashboard.");
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to support this charity",
      );
    } finally {
      setIsSupporting(false);
    }
  };

  useEffect(() => {
    const loadCharity = async () => {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from("charities")
          .select("*")
          .eq("id", charityId)
          .single();

        if (fetchError) throw fetchError;
        setCharity(data);
      } catch (err) {
        setError("Failed to load charity details");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCharity();
  }, [charityId]);

  if (isLoading) {
    return (
      <div className="min-h-screen py-20">
        <div className="container">
          <div className="skeleton h-96 w-full rounded-lg mb-8" />
          <div className="skeleton h-24 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (error || !charity) {
    return (
      <div className="min-h-screen py-20">
        <div className="container">
          <Alert variant="error" title="Error">
            {error || "Charity not found"}
          </Alert>
          <Link href="/charities" className="mt-4 inline-block">
            <Button variant="outline">Back to Charities</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="container">
        {/* Back Link */}
        <Link
          href="/charities"
          className="text-primary hover:underline mb-8 inline-block"
        >
          ← Back to Charities
        </Link>

        {/* Hero */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          <div>
            {error && (
              <Alert variant="error" className="mb-6">
                {error}
              </Alert>
            )}
            {success && (
              <Alert variant="success" className="mb-6">
                {success}
              </Alert>
            )}
            <div className="flex items-start gap-2 mb-4">
              <h1 className="heading-h1">{charity.name}</h1>
              {charity.is_featured && (
                <Badge variant="success" className="mt-2">
                  Featured
                </Badge>
              )}
            </div>
            <p className="text-lg text-muted-foreground mb-8">
              {charity.description || "Making a positive impact on the world"}
            </p>
            <div className="space-y-4 mb-12">
              <div>
                <h3 className="font-semibold mb-2">About This Charity</h3>
                <p className="text-sm text-muted-foreground">
                  When you subscribe to Golf Charity, a minimum of 10% goes to
                  the charity of your choice. This organization has been
                  verified and selected by our team.
                </p>
              </div>
            </div>
            {charity.website_url && (
              <a
                href={charity.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mb-8"
              >
                <Button variant="outline">Visit Website →</Button>
              </a>
            )}
            <div className="flex gap-4 flex-wrap">
              <Button
                size="lg"
                isLoading={isSupporting}
                disabled={isSupporting}
                onClick={handleSupportCharity}
              >
                Support This Charity
              </Button>
              <Link href="/charities">
                <Button variant="outline" size="lg">
                  Explore Others
                </Button>
              </Link>
            </div>
          </div>

          {/* Image */}
          <div className="bg-muted rounded-2xl h-96 flex items-center justify-center overflow-hidden">
            {charity.image_url ? (
              <img
                src={charity.image_url}
                alt={charity.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-8xl">❤️</div>
            )}
          </div>
        </div>

        {/* Impact Info */}
        <Card>
          <CardContent>
            <h3 className="heading-h3 mb-6">Your Impact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold text-primary mb-2">
                  $9.99+
                </div>
                <p className="text-sm text-muted-foreground">
                  Monthly subscription supports this charity
                </p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">10%+</div>
                <p className="text-sm text-muted-foreground">
                  Minimum contribution to charities of your choice
                </p>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary mb-2">∞</div>
                <p className="text-sm text-muted-foreground">
                  Plus win prizes in monthly draws
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
