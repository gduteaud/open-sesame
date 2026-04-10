import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, or } from "drizzle-orm";
import { events } from "@/db/schema";
import { db } from "@/lib/db";
import { formatFullDate } from "@/lib/format-date";
import { isKeyClaimAllowedForEventDate } from "@/lib/event-claim-window";
import { isUuidString } from "@/lib/uuid";
import { ClaimForm } from "@/components/claim-form";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ eventSlug: string }> };

export default async function EventClaimPage({ params }: PageProps) {
  const { eventSlug } = await params;

  const byKey = isUuidString(eventSlug)
    ? or(eq(events.id, eventSlug), eq(events.slug, eventSlug))
    : eq(events.slug, eventSlug);

  const [event] = await db.select().from(events).where(byKey).limit(1);

  if (!event) notFound();

  const claimOpen = isKeyClaimAllowedForEventDate(event.eventDate);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Open Sesame
        </h1>
        <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
          OpenRouter API key management made simple.
        </p>
      </div>

      <div className="text-center">
        <p className="font-heading text-lg font-semibold tracking-tight">
          {event.name}
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {formatFullDate(event.eventDate)}
        </p>
      </div>

      {claimOpen ? (
        <ClaimForm
          fixedEvent={{
            eventKey: event.slug,
            eventName: event.name,
            eventDate: event.eventDate,
          }}
        />
      ) : (
        <p className="text-muted-foreground max-w-md text-center text-sm">
          This event has passed.
        </p>
      )}

      <Link
        href="/admin/login"
        className="text-muted-foreground/50 text-xs underline-offset-4 transition-colors hover:text-muted-foreground hover:underline"
      >
        Admin
      </Link>
    </div>
  );
}
