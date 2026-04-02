"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { assertSupabaseClientConfigured, supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [pageIsLoading, setPageIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const getIsAdmin = async (userId: string, email?: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    if (token) {
      const response = await fetch("/api/auth/role", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = (await response.json()) as { isAdmin?: boolean };
        return Boolean(data.isAdmin);
      }
    }

    const { data: byId } = (await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle()) as { data: { is_admin: boolean } | null };

    if (byId) {
      return Boolean(byId.is_admin);
    }

    if (email) {
      const { data: byEmail } = (await supabase
        .from("profiles")
        .select("is_admin")
        .eq("email", email)
        .maybeSingle()) as { data: { is_admin: boolean } | null };

      return Boolean(byEmail?.is_admin);
    }

    return false;
  };

  // Check if user is already authenticated and redirect
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const isAdmin = await getIsAdmin(user.id, user.email);
          router.push(isAdmin ? "/admin" : "/dashboard");
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

  if (pageIsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      assertSupabaseClientConfigured();

      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: formData.email,
          password: formData.password,
        },
      );

      if (authError) throw authError;

      const isAdmin = await getIsAdmin(data.user.id, data.user.email);
      router.push(isAdmin ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="heading-h2 mb-2">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your Golf Charity account
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
              disabled={isLoading}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-primary hover:underline font-semibold"
              >
                Sign Up
              </Link>
            </p>
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              <Link href="/" className="text-primary hover:underline">
                Back to Home
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
