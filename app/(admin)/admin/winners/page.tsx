"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Winning } from "@/types";
import { supabase } from "@/lib/supabase";

export default function AdminWinnersPage() {
  const [winnings, setWinnings] = useState<Winning[]>([]);
  const [filteredWinnings, setFilteredWinnings] = useState<Winning[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("pending");

  useEffect(() => {
    loadWinnings();
  }, []);

  const wait = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const getAccessToken = async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        return session.access_token;
      }

      await wait(250);
    }

    return null;
  };

  useEffect(() => {
    const filtered =
      filterStatus === "all"
        ? winnings
        : winnings.filter((w) => w.verification_status === filterStatus);
    setFilteredWinnings(filtered);
  }, [filterStatus, winnings]);

  const loadWinnings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = await getAccessToken();
      if (!token) {
        throw new Error("Unauthorized");
      }

      const response = await fetch("/api/admin/winnings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to load winnings");
      }

      const payload = (await response.json()) as { data?: Winning[] };
      setWinnings(payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load winnings");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const approveWinning = async (winningId: string) => {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Unauthorized");

      const response = await fetch("/api/admin/winnings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          winning_id: winningId,
          verification_status: "approved",
        }),
      });

      if (!response.ok) throw new Error("Failed to approve");

      setWinnings((prevs) =>
        prevs.map((w) =>
          w.id === winningId ? { ...w, verification_status: "approved" } : w,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    }
  };

  const rejectWinning = async (winningId: string) => {
    try {
      const reason = prompt("Reason for rejection:");
      if (!reason) return;

      const token = await getAccessToken();
      if (!token) throw new Error("Unauthorized");

      const response = await fetch("/api/admin/winnings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          winning_id: winningId,
          verification_status: "rejected",
          rejection_reason: reason,
        }),
      });

      if (!response.ok) throw new Error("Failed to reject");

      setWinnings((prevs) =>
        prevs.map((w) =>
          w.id === winningId ? { ...w, verification_status: "rejected" } : w,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container">
        <h1 className="heading-h1 mb-8">Winner Verification</h1>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {["all", "pending", "approved", "rejected"].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "primary" : "outline"}
              onClick={() => setFilterStatus(status as any)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-32 rounded-lg" />
            ))}
          </div>
        )}

        {/* Winnings List */}
        {!isLoading && (
          <>
            {filteredWinnings.length === 0 ? (
              <Card>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    No winnings found
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredWinnings.map((winning) => (
                  <Card key={winning.id}>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            PLAYER
                          </p>
                          <p className="font-semibold">{winning.user_id}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            MATCHES
                          </p>
                          <p className="text-2xl font-bold text-primary">
                            {winning.matches_count}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            PRIZE
                          </p>
                          <p className="font-semibold">
                            ${(winning.amount_won_cents / 100).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            STATUS
                          </p>
                          <Badge
                            variant={
                              winning.verification_status === "approved"
                                ? "success"
                                : winning.verification_status === "rejected"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {winning.verification_status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      {/* Proof Image */}
                      {winning.proof_image_url && (
                        <div className="mb-6">
                          <p className="text-xs text-muted-foreground mb-2">
                            PROOF
                          </p>
                          <img
                            src={winning.proof_image_url}
                            alt="Winning proof"
                            className="max-h-48 rounded-lg"
                          />
                        </div>
                      )}

                      {/* Rejection Reason */}
                      {winning.rejection_reason && (
                        <div className="mb-6 p-3 bg-destructive/10 rounded-lg">
                          <p className="text-sm text-destructive">
                            <strong>Reason:</strong> {winning.rejection_reason}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      {winning.verification_status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            onClick={() => approveWinning(winning.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => rejectWinning(winning.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
