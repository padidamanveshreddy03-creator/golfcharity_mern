"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { supabase } from "@/lib/supabase";
import { Subscription } from "@/types";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "draws" | "charities" | "winners"
  >("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    charityContributions: 0,
  });

  const [drawDate, setDrawDate] = useState("");
  const [drawMode, setDrawMode] = useState<"random" | "algorithm">("random");
  const [isRunningDraw, setIsRunningDraw] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (!token) {
        router.push("/login");
        return;
      }

      const roleResponse = await fetch("/api/auth/role", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!roleResponse.ok) {
        router.push("/login");
        return;
      }

      const roleData = (await roleResponse.json()) as { isAdmin?: boolean };

      if (!roleData.isAdmin) {
        router.push("/dashboard");
        return;
      }

      // Get total users
      const { data: users } = await supabase.from("profiles").select("id");

      // Get active subscriptions
      const { data: subscriptions } = (await supabase
        .from("subscriptions")
        .select("*")
        .eq("status", "active")) as { data: Subscription[] | null };

      setStats({
        totalUsers: users?.length || 0,
        activeSubscriptions: subscriptions?.length || 0,
        totalRevenue:
          (subscriptions?.reduce((sum, s) => sum + s.amount_in_cents, 0) || 0) /
          100,
        charityContributions: 0, // TODO: Calculate from donations
      });
    } catch (err) {
      setError("Failed to load admin data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunDraw = async (publish: boolean) => {
    try {
      if (!drawDate) {
        setError("Please select a draw date");
        return;
      }

      setIsRunningDraw(true);
      setError(null);

      const response = await fetch("/api/draws", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          draw_date: drawDate,
          draw_mode: drawMode,
          publish,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to run draw");
      }

      setDrawDate("");
      setError(null);
      alert(
        publish
          ? "Draw published successfully!"
          : "Draw simulated successfully!",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run draw");
    } finally {
      setIsRunningDraw(false);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container">
        {/* Header */}
        <div className="mb-12">
          <h1 className="heading-h1 mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage platform, runs draws, verify winners
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {["overview", "users", "draws", "charities", "winners"].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "primary" : "outline"}
              onClick={() => setActiveTab(tab as any)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <>
            {error && (
              <Alert variant="error" className="mb-6">
                {error}
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Total Users
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {stats.totalUsers}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Active Subscriptions
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {stats.activeSubscriptions}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Total Revenue
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    ${stats.totalRevenue.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">
                    Charity Contributions
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    ${stats.charityContributions.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Draws Tab */}
        {activeTab === "draws" && (
          <Card>
            <CardHeader title="Run Monthly Draw" />
            <CardContent>
              {error && (
                <Alert variant="error" className="mb-4">
                  {error}
                </Alert>
              )}

              <div className="space-y-4 max-w-md">
                <Input
                  label="Draw Date"
                  type="date"
                  value={drawDate}
                  onChange={(e) => setDrawDate(e.target.value)}
                  disabled={isRunningDraw}
                />

                <Select
                  label="Draw Mode"
                  value={drawMode}
                  onChange={(e) => setDrawMode(e.target.value as any)}
                  options={[
                    { value: "random", label: "Random (Equal probability)" },
                    {
                      value: "algorithm",
                      label: "Algorithm (Frequency-based)",
                    },
                  ]}
                  disabled={isRunningDraw}
                />

                <div className="space-y-2">
                  <Button
                    onClick={() => handleRunDraw(false)}
                    variant="outline"
                    className="w-full"
                    isLoading={isRunningDraw}
                    disabled={isRunningDraw}
                  >
                    Simulate Draw
                  </Button>
                  <Button
                    onClick={() => handleRunDraw(true)}
                    className="w-full"
                    isLoading={isRunningDraw}
                    disabled={isRunningDraw}
                  >
                    Publish Draw
                  </Button>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>📌 Note:</strong> Simulate first to preview results
                    before publishing. Published draws create winner records
                    automatically.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charities Tab */}
        {activeTab === "charities" && (
          <Card>
            <CardHeader title="Manage Charities" />
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Add, edit, and manage charities in the database.
              </p>
              <div className="mt-6">
                <Link href="/admin/charities">
                  <Button>Charity Management</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Winners Tab */}
        {activeTab === "winners" && (
          <Card>
            <CardHeader title="Verify Winners" />
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Review and verify winning submissions
              </p>
              <div className="mt-6">
                <Link href="/admin/winners">
                  <Button>Winner Management</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <Card>
            <CardHeader title="User Management" />
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage users, subscriptions, and permissions
              </p>
              <div className="mt-6">
                <Link href="/admin/users">
                  <Button>User Management</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
