"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Charity } from "@/types";
import { supabase } from "@/lib/supabase";

export default function CharitiesAdminPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    website_url: "",
    is_featured: false,
  });

  useEffect(() => {
    loadCharities();
  }, []);

  const loadCharities = async () => {
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from("charities")
        .select("*")
        .order("name");

      if (fetchError) throw fetchError;
      setCharities(data || []);
    } catch (err) {
      setError("Failed to load charities");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.name) {
        setError("Charity name is required");
        return;
      }

      const url = editingId ? `/api/charities` : `/api/charities`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editingId ? { id: editingId, ...formData } : formData,
        ),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save charity");
      }

      await loadCharities();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;

    try {
      const response = await fetch(`/api/charities?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");
      await loadCharities();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      image_url: "",
      website_url: "",
      is_featured: false,
    });
    setEditingId(null);
    setError(null);
  };

  const handleEdit = (charity: Charity) => {
    setFormData({
      name: charity.name,
      description: charity.description || "",
      image_url: charity.image_url || "",
      website_url: charity.website_url || "",
      is_featured: charity.is_featured,
    });
    setEditingId(charity.id);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-24 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container">
        <h1 className="heading-h1 mb-8">Manage Charities</h1>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Form */}
          <Card>
            <CardHeader title={editingId ? "Edit Charity" : "Add Charity"} />
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Charity Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />

                <Textarea
                  label="Description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />

                <Input
                  label="Image URL"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                />

                <Input
                  label="Website URL"
                  type="url"
                  value={formData.website_url}
                  onChange={(e) =>
                    setFormData({ ...formData, website_url: e.target.value })
                  }
                />

                <div className="form-group">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_featured: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">Featured</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingId ? "Update" : "Add"} Charity
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* List */}
          <Card>
            <CardHeader title={`Charities (${charities.length})`} />
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {charities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No charities yet
                  </p>
                ) : (
                  charities.map((charity) => (
                    <div
                      key={charity.id}
                      className="p-3 bg-muted rounded-lg space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm">
                            {charity.name}
                          </p>
                          {charity.is_featured && (
                            <Badge variant="success" className="mt-1">
                              Featured
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(charity)}
                          >
                            ✏️
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(charity.id)}
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                      {charity.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {charity.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
