"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function EventAddAttendee({ eventId }: { eventId: string }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/attendees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not add attendee");
        setLoading(false);
        return;
      }
      setFirstName("");
      setLastName("");
      setEmail("");
      window.location.reload();
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
      {error ? (
        <div className="sm:col-span-2">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="fn">First name</Label>
        <Input
          id="fn"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="ln">Last name</Label>
        <Input
          id="ln"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="em">Email</Label>
        <Input
          id="em"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Adding…" : "Add attendee"}
        </Button>
      </div>
    </form>
  );
}
