"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Charity } from "@/types";
import {
  assertSupabaseClientConfigured,
  supabase,
  getAllCharities,
} from "@/lib/supabase";

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [charities, setCharities] = useState<Charity[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    charity_id: "",
    contribution_percentage: "10",
    wants_admin: false,
    admin_access_code: "",
  });

  // Check if user is already authenticated and redirect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          router.push("/dashboard");
          return;
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setPageIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (pageIsLoading) return;

    const loadCharities = async () => {
      try {
        const data = (await getAllCharities()) as Charity[];
        setCharities(data);
        if (data.length > 0) {
          const requestedCharityId = searchParams.get("charity");
          const hasRequestedCharity = requestedCharityId
            ? data.some((charity) => charity.id === requestedCharityId)
            : false;

          setFormData((prev) => ({
            ...prev,
            charity_id: hasRequestedCharity
              ? (requestedCharityId as string)
              : data[0].id,
          }));
        }
      } catch (err) {
        console.error("Error loading charities:", err);
      }
    };

    loadCharities();
  }, [pageIsLoading, searchParams]);

  if (pageIsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const isCheckbox =
      e.target instanceof HTMLInputElement && e.target.type === "checkbox";
    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      assertSupabaseClientConfigured();

      // Validate form
      if (!formData.email || !formData.password || !formData.full_name) {
        throw new Error("Please fill in all required fields");
      }

      if (formData.password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      if (formData.wants_admin && !formData.admin_access_code.trim()) {
        throw new Error("Admin access code is required for admin signup");
      }

      // Sign up with Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");

      const setupResponse = await fetch("/api/auth/setup-profile", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          userId: authData.user.id,
          email: formData.email,
          fullName: formData.full_name,
          charityId: formData.charity_id || undefined,
          contributionPercentage: parseFloat(formData.contribution_percentage),
          wantsAdmin: formData.wants_admin,
          adminAccessCode: formData.admin_access_code || undefined,
        }),
      });

      if (!setupResponse.ok) {
        const setupData = (await setupResponse.json()) as { error?: string };
        throw new Error(setupData.error || "Could not finish account setup");
      }

      // Redirect to pricing for subscription
      router.push("/pricing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const charityOptions = charities.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="heading-h2 mb-2">Join Golf Charity</h1>
          <p className="text-sm text-muted-foreground">
            Track scores, win prizes, support charities
          </p>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              placeholder="John Doe"
              disabled={isLoading}
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              disabled={isLoading}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              helpText="At least 8 characters"
              disabled={isLoading}
            />

            <Select
              label="Select Your Charity"
              name="charity_id"
              value={formData.charity_id}
              onChange={handleChange}
              options={charityOptions}
              disabled={isLoading}
            />

            <Input
              label="Charity Contribution (%)"
              type="number"
              name="contribution_percentage"
              value={formData.contribution_percentage}
              onChange={handleChange}
              min={10}
              max={100}
              step={1}
              helpText="Minimum 10%"
              disabled={isLoading}
            />

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="wants_admin"
                checked={formData.wants_admin}
                onChange={handleChange}
                disabled={isLoading}
              />
              Request admin access
            </label>

            {formData.wants_admin && (
              <Input
                label="Admin Access Code"
                type="password"
                name="admin_access_code"
                value={formData.admin_access_code}
                onChange={handleChange}
                placeholder="Enter admin code"
                disabled={isLoading}
                required
              />
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Create Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-semibold"
              >
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-border text-xs text-muted-foreground">
            <p>
              By signing up, you agree to our{" "}
              <Link href="#" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
