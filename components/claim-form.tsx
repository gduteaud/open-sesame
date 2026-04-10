"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatFullDate } from "@/lib/format-date";

export type ClaimFormFixedEvent = {
  eventKey: string;
  eventName: string;
  eventDate: string;
};

type ClaimFormProps = {
  fixedEvent?: ClaimFormFixedEvent;
};

type ChoiceEvent = { slug: string; name: string; eventDate: string };

export function ClaimForm({ fixedEvent }: ClaimFormProps) {
  const [email, setEmail] = useState("");
  const [key, setKey] = useState<string | null>(null);
  const [already, setAlready] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [choiceEvents, setChoiceEvents] = useState<ChoiceEvent[] | null>(null);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [successMeta, setSuccessMeta] = useState<{
    eventName: string;
    eventDate: string;
  } | null>(null);

  async function claim(opts: { email: string; eventKey?: string }) {
    const body: { email: string; eventKey?: string } = { email: opts.email };
    if (opts.eventKey) body.eventKey = opts.eventKey;

    const res = await fetch("/api/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      key?: string;
      alreadyClaimed?: boolean;
      needsEventChoice?: boolean;
      events?: ChoiceEvent[];
      eventName?: string;
      eventDate?: string;
    };

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    if (data.needsEventChoice && data.events?.length) {
      setChoiceEvents(data.events);
      setError(null);
      return;
    }

    if (data.key) {
      setKey(data.key);
      setAlready(!!data.alreadyClaimed);
      setChoiceEvents(null);
      setSelectedSlug("");
      if (data.eventName && data.eventDate) {
        setSuccessMeta({ eventName: data.eventName, eventDate: data.eventDate });
      } else if (fixedEvent) {
        setSuccessMeta({
          eventName: fixedEvent.eventName,
          eventDate: fixedEvent.eventDate,
        });
      } else {
        setSuccessMeta(null);
      }
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setKey(null);
    setCopied(false);
    setSuccessMeta(null);
    setLoading(true);
    try {
      if (fixedEvent) {
        await claim({ email, eventKey: fixedEvent.eventKey });
      } else if (choiceEvents) {
        if (!selectedSlug) {
          setError("Select which event you registered for.");
          setLoading(false);
          return;
        }
        await claim({ email, eventKey: selectedSlug });
      } else {
        await claim({ email });
      }
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  async function copyKey() {
    if (!key) return;
    await navigator.clipboard.writeText(key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function resetFlow() {
    setKey(null);
    setEmail("");
    setChoiceEvents(null);
    setSelectedSlug("");
    setSuccessMeta(null);
    setError(null);
  }

  const cardTitle = choiceEvents ? "Which event?" : "Retrieve your API key";

  const cardDescription = choiceEvents
    ? "This email is on the list for more than one upcoming event."
    : "Please enter the email address you used to register for the event.";

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="font-heading text-xl">{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Registration email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setChoiceEvents(null);
                setSelectedSlug("");
              }}
              required
              disabled={!!key}
            />
          </div>
          {choiceEvents && !key ? (
            <div className="space-y-2">
              <Label>Event</Label>
              <Select
                value={selectedSlug || undefined}
                onValueChange={(v) => setSelectedSlug(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose your event…" />
                </SelectTrigger>
                <SelectContent>
                  {choiceEvents.map((e) => (
                    <SelectItem key={e.slug} value={e.slug}>
                      {e.name} ({formatFullDate(e.eventDate)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          {!key ? (
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Provisioning…" : "Get my key"}
            </Button>
          ) : null}
        </form>

        {key ? (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
            {successMeta ? (
              <p className="text-muted-foreground text-xs">
                {successMeta.eventName} · {formatFullDate(successMeta.eventDate)}
              </p>
            ) : null}
            <p className="text-sm font-medium">
              {already
                ? "Your key (you already claimed it — save it somewhere safe)."
                : "Your OpenRouter API key (shown once here — copy it now)."}
            </p>
            <code className="block break-all rounded bg-background p-2 text-xs">
              {key}
            </code>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => void copyKey()}>
                {copied ? "Copied" : "Copy key"}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={resetFlow}>
                Use another email
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
