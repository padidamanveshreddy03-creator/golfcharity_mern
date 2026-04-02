"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export const Header: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const loadUserRole = async (userId: string, email?: string) => {
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
        setIsAdmin(Boolean(data.isAdmin));
        return;
      }
    }

    const { data: byId } = (await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", userId)
      .maybeSingle()) as { data: { is_admin: boolean } | null };

    if (byId) {
      setIsAdmin(Boolean(byId.is_admin));
      return;
    }

    if (email) {
      const { data: byEmail } = (await supabase
        .from("profiles")
        .select("is_admin")
        .eq("email", email)
        .maybeSingle()) as { data: { is_admin: boolean } | null };

      setIsAdmin(Boolean(byEmail?.is_admin));
      return;
    }

    setIsAdmin(false);
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        setUser(currentUser);

        if (currentUser) {
          await loadUserRole(currentUser.id, currentUser.email);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser) {
        loadUserRole(sessionUser.id, sessionUser.email).catch((error) => {
          console.error("Error loading user role:", error);
          setIsAdmin(false);
        });
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getUserInitials = (email?: string) => {
    if (!email) return "U";
    const parts = email.split("@")[0].split(".");
    return parts
      .map((p) => p[0].toUpperCase())
      .join("")
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-bold text-xl text-primary">
            ⛳ Golf Charity
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/pricing"
            className="text-sm hover:text-primary transition"
          >
            Pricing
          </Link>
          <Link
            href="/charities"
            className="text-sm hover:text-primary transition"
          >
            Charities
          </Link>
          {user && (
            <Link
              href="/admin"
              className="text-sm hover:text-primary transition"
            >
              Manage Admin
            </Link>
          )}
          {user && (
            <Link
              href={isAdmin ? "/admin" : "/dashboard"}
              className="text-sm hover:text-primary transition"
            >
              {isAdmin ? "Admin" : "Dashboard"}
            </Link>
          )}

          {!loading && user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition"
              >
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                  {getUserInitials(user.email)}
                </div>
                <span className="text-sm">{user.email}</span>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg">
                  <button
                    onClick={() =>
                      router.push(isAdmin ? "/admin" : "/dashboard")
                    }
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition text-red-600"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : !loading ? (
            <>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Sign Up</Button>
              </Link>
            </>
          ) : null}
        </nav>

        <div className="md:hidden">
          <Button variant="ghost" size="sm">
            Menu
          </Button>
        </div>
      </div>
    </header>
  );
};
