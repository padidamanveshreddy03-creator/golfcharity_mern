"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { GolfScore, Subscription } from "@/types";
import { supabase } from "@/lib/supabase";
import {
  getUserScores,
  checkSubscriptionStatus,
  getUserCharity,
} from "@/lib/supabase";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [scores, setScores] = useState<GolfScore[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [syncNotice, setSyncNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [userCharity, setUserCharity] = useState<any>(null);
  const [newScore, setNewScore] = useState("");
  const [scoreDate, setScoreDate] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current user
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          // Redirect to login
          window.location.href = "/login";
          return;
        }

        const isAdmin = await getIsAdmin(currentUser.id, currentUser.email);

        if (isAdmin) {
          window.location.href = "/admin";
          return;
        }

        setUser(currentUser);

        const sessionId = new URLSearchParams(window.location.search).get(
          "session_id",
        );

        if (sessionId) {
          try {
            const syncResponse = await fetch("/api/subscriptions/sync", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_id: currentUser.id,
                session_id: sessionId,
              }),
            });

            if (!syncResponse.ok) {
              const syncError = await syncResponse.json();
              setSyncNotice({
                type: "error",
                message:
                  syncError?.error ||
                  "Payment completed, but subscription sync failed. Please refresh in a moment.",
              });
              console.error(
                "Subscription sync failed:",
                syncError?.error || "Unknown error",
              );
            } else {
              setSyncNotice({
                type: "success",
                message:
                  "Payment confirmed. Your subscription has been updated.",
              });
            }
          } catch (syncError) {
            setSyncNotice({
              type: "error",
              message:
                "Payment completed, but we could not confirm subscription status right now.",
            });
            console.error("Subscription sync error:", syncError);
          }

          const cleanUrl = new URL(window.location.href);
          cleanUrl.searchParams.delete("session_id");
          window.history.replaceState({}, "", cleanUrl.toString());
        }

        // Get scores
        const userScores = await getUserScores(currentUser.id);
        setScores(userScores);

        // Get subscription
        const userSubscription = await checkSubscriptionStatus(currentUser.id);
        setSubscription(userSubscription || null);

        // Get charity selection
        const charity = await getUserCharity(currentUser.id);
        setUserCharity(charity || null);
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingScore(true);
    setError(null);
    setSuccess(null);

    try {
      const score = parseInt(newScore);

      if (!score || score < 1 || score > 45) {
        throw new Error("Score must be between 1 and 45");
      }

      if (!scoreDate) {
        throw new Error("Please select a date");
      }

      if (!user?.id) {
        throw new Error("User not found");
      }

      // Call API to add score
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          score,
          score_date: scoreDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save score");
      }

      const data = await response.json();

      // Update scores list
      setScores([data.data, ...scores].slice(0, 5));
      setNewScore("");
      setScoreDate("");
      setSuccess("Score added successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save score");
    } finally {
      setIsSavingScore(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-20">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-48 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-12">
          <h1 className="heading-h1 mb-2">
            Welcome, {user?.user_metadata?.full_name || "Golfer"}!
          </h1>
          <p className="text-muted-foreground">
            Track your scores and manage your account
          </p>
          {syncNotice && (
            <Alert variant={syncNotice.type} className="mt-4">
              {syncNotice.message}
            </Alert>
          )}
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Subscription Status */}
          <Card>
            <CardHeader title="Subscription" />
            <CardContent>
              {subscription ? (
                <>
                  <Badge
                    variant={
                      subscription.status === "active" ? "success" : "warning"
                    }
                    className="mb-3"
                  >
                    {subscription.status.toUpperCase()}
                  </Badge>
                  <p className="text-sm text-muted-foreground mb-2">
                    Plan:{" "}
                    <span className="font-semibold">
                      {subscription.plan_type}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    ${(subscription.amount_in_cents / 100).toFixed(2)}/
                    {subscription.plan_type === "monthly" ? "mo" : "yr"}
                  </p>
                  <Link href="/pricing">
                    <Button variant="outline" size="sm" className="w-full">
                      Manage
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    No active subscription
                  </p>
                  <Link href="/pricing">
                    <Button size="sm" className="w-full">
                      Subscribe Now
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          {/* Scores */}
          <Card>
            <CardHeader title="Recent Scores" />
            <CardContent>
              <p className="text-3xl font-bold text-primary mb-2">
                {scores.length}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {scores.length === 5
                  ? "Maximum scores stored"
                  : `You can add ${5 - scores.length} more`}
              </p>
              {scores.length > 0 && (
                <p className="text-sm font-semibold">
                  Latest:{" "}
                  <span className="text-primary">{scores[0].score}</span>
                </p>
              )}
            </CardContent>
          </Card>

          {/* Charity */}
          <Card>
            <CardHeader title="Charity" />
            <CardContent>
              {userCharity ? (
                <>
                  <p className="text-sm font-semibold mb-2 line-clamp-2">
                    {userCharity.charities?.name || "Selected"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {userCharity.contribution_percentage}% contribution
                  </p>
                  <Link href="/charities">
                    <Button variant="outline" size="sm" className="w-full">
                      Change
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    No charity selected
                  </p>
                  <Link href="/charities">
                    <Button size="sm" className="w-full">
                      Select Charity
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Score Entry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <Card>
            <CardHeader title="Add Score" />
            <CardContent>
              {error && (
                <Alert variant="error" className="mb-4">
                  {error}
                </Alert>
              )}
              {success && (
                <Alert variant="success" className="mb-4">
                  {success}
                </Alert>
              )}

              <form onSubmit={handleAddScore} className="space-y-4">
                <Input
                  label="Golf Score (1-45)"
                  type="number"
                  value={newScore}
                  onChange={(e) => setNewScore(e.target.value)}
                  placeholder="Enter score"
                  min={1}
                  max={45}
                  disabled={isSavingScore}
                  required
                />

                <Input
                  label="Score Date"
                  type="date"
                  value={scoreDate}
                  onChange={(e) => setScoreDate(e.target.value)}
                  disabled={isSavingScore}
                  required
                />

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isSavingScore}
                  disabled={isSavingScore}
                >
                  Add Score
                </Button>
              </form>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>💡 Tip:</strong> Keep your last 5 scores to maximize
                  your chances in the monthly draw!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Score History */}
          <Card>
            <CardHeader title="Score History" />
            <CardContent>
              {scores.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No scores yet. Add your first score to get started!
                </p>
              ) : (
                <div className="space-y-3">
                  {scores.map((score, idx) => (
                    <div
                      key={score.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">Score #{idx + 1}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(score.score_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {score.score}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
