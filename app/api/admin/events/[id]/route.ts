import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { events } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import {
  isReservedSlug,
  randomSuffix,
  reservedSlugMessage,
  slugify,
} from "@/lib/slug";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  perKeyCredits: z.coerce.number().positive().optional(),
  slug: z.string().min(1).max(120).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const [row] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!existing[0]) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updates: {
    name?: string;
    eventDate?: string;
    perKeyCredits?: string;
    slug?: string;
  } = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.date !== undefined) updates.eventDate = parsed.data.date;
  if (parsed.data.perKeyCredits !== undefined) {
    updates.perKeyCredits = String(parsed.data.perKeyCredits);
  }

  if (parsed.data.slug !== undefined) {
    let newSlug = slugify(parsed.data.slug);
    if (isReservedSlug(newSlug)) {
      return NextResponse.json({ error: reservedSlugMessage(newSlug) }, { status: 400 });
    }
    const [collision] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.slug, newSlug))
      .limit(1);
    if (collision && collision.id !== id) {
      newSlug = `${newSlug}-${randomSuffix()}`;
    }
    updates.slug = newSlug;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(existing[0]);
  }

  const [updated] = await db
    .update(events)
    .set(updates)
    .where(eq(events.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const deleted = await db.delete(events).where(eq(events.id, id)).returning();
  if (deleted.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
