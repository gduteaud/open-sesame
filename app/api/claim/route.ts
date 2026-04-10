import { NextResponse } from "next/server";
import { and, eq, gte, or } from "drizzle-orm";
import { z } from "zod";
import { attendees, events } from "@/db/schema";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/email";
import { provisionOpenRouterKey } from "@/lib/openrouter";
import {
  utcCalendarDateToday,
  isKeyClaimAllowedForEventDate,
  openRouterKeyExpiresAtIso,
} from "@/lib/event-claim-window";
import { isUuidString } from "@/lib/uuid";

const bodySchema = z.object({
  email: z.string().email(),
  eventKey: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { eventKey: rawEventKey, email: rawEmail } = parsed.data;
  const email = normalizeEmail(rawEmail);
  const today = utcCalendarDateToday();

  let event: {
    id: string;
    name: string;
    slug: string;
    eventDate: string;
    perKeyCredits: string;
  };

  if (!rawEventKey) {
    const upcoming = await db
      .select({
        id: events.id,
        name: events.name,
        slug: events.slug,
        eventDate: events.eventDate,
        perKeyCredits: events.perKeyCredits,
      })
      .from(attendees)
      .innerJoin(events, eq(attendees.eventId, events.id))
      .where(
        and(eq(attendees.email, email), gte(events.eventDate, today)),
      );

    if (upcoming.length === 0) {
      return NextResponse.json(
        {
          error:
            "We could not find a matching event registration for this email address. Contact the organizer if you need help.",
        },
        { status: 404 },
      );
    }

    if (upcoming.length > 1) {
      return NextResponse.json({
        needsEventChoice: true as const,
        events: upcoming.map((e) => ({
          slug: e.slug,
          name: e.name,
          eventDate: e.eventDate,
        })),
      });
    }

    event = upcoming[0]!;
  } else {
    const byKey = isUuidString(rawEventKey)
      ? or(eq(events.id, rawEventKey), eq(events.slug, rawEventKey))
      : eq(events.slug, rawEventKey);

    const [row] = await db.select().from(events).where(byKey).limit(1);

    if (!row) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    event = row;
  }

  if (!isKeyClaimAllowedForEventDate(event.eventDate)) {
    return NextResponse.json(
      { error: "This event has passed." },
      { status: 410 },
    );
  }

  const limitUsd = Number(event.perKeyCredits);
  if (!Number.isFinite(limitUsd) || limitUsd <= 0) {
    return NextResponse.json(
      { error: "Event misconfigured" },
      { status: 500 },
    );
  }

  try {
    const result = await db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(attendees)
        .where(
          and(
            eq(attendees.eventId, event.id),
            eq(attendees.email, email),
          ),
        )
        .for("update")
        .limit(1);

      const row = rows[0];
      if (!row) {
        return {
          kind: "not_registered" as const,
        };
      }

      if (row.openrouterKey && row.provisionedAt) {
        return {
          kind: "success" as const,
          key: row.openrouterKey,
          alreadyClaimed: true as const,
        };
      }

      const keyName = `${event.name} — ${row.firstName} ${row.lastName}`;
      const { key, hash } = await provisionOpenRouterKey({
        name: keyName,
        limitUsd,
        expiresAtIso: openRouterKeyExpiresAtIso(event.eventDate),
      });

      await tx
        .update(attendees)
        .set({
          openrouterKey: key,
          openrouterKeyHash: hash,
          provisionedAt: new Date(),
        })
        .where(eq(attendees.id, row.id));

      return {
        kind: "success" as const,
        key,
        alreadyClaimed: false as const,
      };
    });

    if (result.kind === "not_registered") {
      return NextResponse.json(
        {
          error:
            "This email is not registered for this event. Contact the organizer if you believe this is a mistake.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      key: result.key,
      alreadyClaimed: result.alreadyClaimed,
      eventName: event.name,
      eventDate: event.eventDate,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Claim failed";
    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }
}
