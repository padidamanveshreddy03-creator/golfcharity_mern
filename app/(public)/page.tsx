"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Charity } from "@/types";
import { getAllCharities } from "@/lib/supabase";

export default function Home() {
  const [featuredCharity, setFeaturedCharity] = useState<Charity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCharity = async () => {
      try {
        const charities = await getAllCharities();
        if (charities.length > 0) {
          setFeaturedCharity(charities[0]);
        }
      } catch (error) {
        console.error("Error loading charities:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCharity();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
        <div className="container relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="mb-4">
                <Badge variant="primary">⛳ Golf Meets Charity</Badge>
              </div>
              <h1 className="heading-h1 mb-6">
                Track Your Game
                <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Change Lives
                </span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-md">
                Score. Compete. Win. Every subscription supports charities you
                love. Join thousands of golfers making a difference.
              </p>
              <div className="flex gap-4">
                <Link href="/signup">
                  <Button size="lg">Get Started Free</Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" size="lg">
                    View Plans
                  </Button>
                </Link>
              </div>
            </div>

            <div className="animate-slide-in-up">
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-8 backdrop-blur-sm">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">📊</div>
                    <div>
                      <h3 className="font-semibold mb-1">Track Scores</h3>
                      <p className="text-sm text-muted-foreground">
                        Record and track your last 5 scores in Stableford format
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">🎲</div>
                    <div>
                      <h3 className="font-semibold mb-1">Monthly Draws</h3>
                      <p className="text-sm text-muted-foreground">
                        Win cash prizes in our algorithm-based draws
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">❤️</div>
                    <div>
                      <h3 className="font-semibold mb-1">Support Charity</h3>
                      <p className="text-sm text-muted-foreground">
                        Contribute to charities while you play
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-20 md:py-32 bg-muted/50">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="heading-h2 mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple, transparent, and rewarding. Join our community of golf
              enthusiasts supporting great charities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Subscribe",
                description: "Choose monthly or yearly plan",
              },
              {
                step: "2",
                title: "Enter Scores",
                description: "Track your last 5 golf scores",
              },
              {
                step: "3",
                title: "Participate",
                description: "Join monthly draws with other players",
              },
              {
                step: "4",
                title: "Win & Give",
                description: "Claim prizes and support charities",
              },
            ].map((item) => (
              <Card key={item.step} className="text-center">
                <CardContent>
                  <div className="text-5xl font-bold text-primary mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Charity */}
      {featuredCharity && (
        <section className="py-20 md:py-32">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="success" className="mb-4">
                  Featured Charity
                </Badge>
                <h2 className="heading-h2 mb-4">{featuredCharity.name}</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  {featuredCharity.description}
                </p>
                <Link href={`/charities/${featuredCharity.id}`}>
                  <Button variant="primary">Learn More</Button>
                </Link>
              </div>
              <div className="bg-muted rounded-2xl h-80 flex items-center justify-center">
                {featuredCharity.image_url ? (
                  <img
                    src={featuredCharity.image_url}
                    alt={featuredCharity.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <div className="text-6xl">❤️</div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="container text-center">
          <h2 className="heading-h2 mb-4">Ready to Tee Off?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Join Our Community of Golfers Making a Difference
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup">
              <Button size="lg">Subscribe Now</Button>
            </Link>
            <Link href="/charities">
              <Button variant="outline" size="lg">
                Explore Charities
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
