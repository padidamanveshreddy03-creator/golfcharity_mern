"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Charity } from "@/types";
import { getAllCharities } from "@/lib/supabase";
import { Input } from "@/components/ui/Input";

export default function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [filteredCharities, setFilteredCharities] = useState<Charity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCharities = async () => {
      try {
        setIsLoading(true);
        const data = await getAllCharities();
        setCharities(data);
        setFilteredCharities(data);
      } catch (err) {
        setError("Failed to load charities");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCharities();
  }, []);

  useEffect(() => {
    const filtered = charities.filter(
      (charity) =>
        charity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        charity.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredCharities(filtered);
  }, [searchTerm, charities]);

  return (
    <div className="min-h-screen py-20 md:py-32">
      <div className="container">
        {/* Header */}
        <div className="mb-12">
          <h1 className="heading-h1 mb-4">Our Charities</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Every subscription supports the charities you choose. Browse and
            select the cause that matters to you.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 max-w-md">
          <Input
            placeholder="Search charities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-64 rounded-lg" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-error">
            <p>{error}</p>
          </div>
        )}

        {/* Charities Grid */}
        {!isLoading && (
          <>
            {filteredCharities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No charities found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredCharities.map((charity) => (
                  <Link key={charity.id} href={`/charities/${charity.id}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="bg-muted h-48 flex items-center justify-center overflow-hidden rounded-t-lg">
                        {charity.image_url ? (
                          <img
                            src={charity.image_url}
                            alt={charity.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-6xl">❤️</div>
                        )}
                      </div>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-lg line-clamp-2">
                            {charity.name}
                          </h3>
                          {charity.is_featured && (
                            <Badge variant="success" className="shrink-0">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {charity.description ||
                            "Making a difference in the world"}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
