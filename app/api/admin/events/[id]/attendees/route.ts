import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { attendees, events } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { normalizeEmail } from "@/lib/email";

const addSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id: eventId } = await context.params;
  const eventRows = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!eventRows[0]) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const rows = await db
    .select({
      id: attendees.id,
      firstName: attendees.firstName,
      lastName: attendees.lastName,
      email: attendees.email,
      provisionedAt: attendees.provisionedAt,
    })
    .from(attendees)
    .where(eq(attendees.eventId, eventId))
    .orderBy(asc(attendees.email));

  return NextResponse.json(rows);
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id: eventId } = await context.params;
  const eventRows = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (!eventRows[0]) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = addSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const email = normalizeEmail(parsed.data.email);

  try {
    const [created] = await db
      .insert(attendees)
      .values({
        eventId,
        firstName: parsed.data.firstName.trim(),
        lastName: parsed.data.lastName.trim(),
        email,
      })
      .returning({
        id: attendees.id,
        firstName: attendees.firstName,
        lastName: attendees.lastName,
        email: attendees.email,
        provisionedAt: attendees.provisionedAt,
      });
    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    const code =
      e && typeof e === "object" && "code" in e
        ? String((e as { code: unknown }).code)
        : "";
    if (code === "23505") {
      return NextResponse.json(
        { error: "An attendee with this email already exists for this event" },
        { status: 409 },
      );
    }
    throw e;
  }
}
