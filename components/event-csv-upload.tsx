"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function EventCsvUpload({ eventId }: { eventId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!file) {
      setError("Choose a CSV file");
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await fetch(`/api/admin/events/${eventId}/csv`, {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        inserted?: number;
        skipped?: number;
        totalRows?: number;
        rowErrors?: string[];
      };
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        setLoading(false);
        return;
      }
      setMessage(
        `Imported ${data.inserted ?? 0} new rows, skipped ${data.skipped ?? 0} duplicates (${data.totalRows ?? 0} total lines).`,
      );
      if (data.rowErrors?.length) {
        setError(data.rowErrors.join("; "));
      }
      setFile(null);
      window.location.reload();
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="csv">CSV (columns: first_name, last_name, email)</Label>
        <Input
          id="csv"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "Uploading…" : "Upload CSV"}
      </Button>
    </form>
  );
}