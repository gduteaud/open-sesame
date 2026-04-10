"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewEventPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [perKeyCredits, setPerKeyCredits] = useState("1");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        name,
        date,
        perKeyCredits: Number(perKeyCredits),
      };
      if (slug.trim()) body.slug = slug.trim();

      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        id?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not create event");
        setLoading(false);
        return;
      }
      if (data.id) {
        router.push(`/admin/events/${data.id}`);
        router.refresh();
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          New event
        </h1>
      </div>

      <Card>
        <form onSubmit={onSubmit}>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-4 pt-3">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="AI Summit 2026"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <p className="text-muted-foreground text-sm">
                Keys will be valid through the end of the UTC day following this date.
              </p>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">Per-key credit limit (USD)</Label>
              <p className="text-muted-foreground text-sm">
                OpenRouter usage limit per attendee key in USD.
              </p>
              <Input
                id="credits"
                type="number"
                step="0.01"
                min="0.01"
                value={perKeyCredits}
                onChange={(e) => setPerKeyCredits(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (optional)</Label>
              <p className="text-muted-foreground text-sm">
                One will be generated from the event name if omitted.
              </p>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ai-summit-2026"
              />
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create event"}
            </Button>
            <Link
              href="/admin"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "inline-flex items-center justify-center",
              )}
            >
              Cancel
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
