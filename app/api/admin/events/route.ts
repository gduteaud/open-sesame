import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
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

const createSchema = z.object({
  name: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  perKeyCredits: z.coerce.number().positive(),
  slug: z.string().min(1).max(120).optional(),
});

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const rows = await db.select().from(events).orderBy(desc(events.createdAt));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, date, perKeyCredits, slug: slugInput } = parsed.data;
  const baseSlug = slugInput?.trim()
    ? slugify(slugInput)
    : slugify(name);
  let slug = baseSlug;
  if (isReservedSlug(slug)) {
    return NextResponse.json({ error: reservedSlugMessage(slug) }, { status: 400 });
  }
  for (let i = 0; i < 10; i++) {
    const existing = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.slug, slug))
      .limit(1);
    if (existing.length === 0) break;
    slug = `${baseSlug}-${randomSuffix()}`;
  }

  const [created] = await db
    .insert(events)
    .values({
      name,
      eventDate: date,
      perKeyCredits: String(perKeyCredits),
      slug,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
