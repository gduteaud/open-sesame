import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import Papa from "papaparse";
import { z } from "zod";
import { db } from "@/lib/db";
import { attendees, events } from "@/db/schema";
import { requireAdmin } from "@/lib/require-admin";
import { normalizeEmail } from "@/lib/email";

type RouteContext = { params: Promise<{ id: string }> };

const rowSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
});

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

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file field" }, { status: 400 });
  }

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors.length) {
    return NextResponse.json(
      { error: "CSV parse error", details: parsed.errors.slice(0, 5) },
      { status: 400 },
    );
  }

  let inserted = 0;
  let skipped = 0;
  const rowErrors: string[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const raw = parsed.data[i];
    const checked = rowSchema.safeParse({
      first_name: raw.first_name,
      last_name: raw.last_name,
      email: raw.email,
    });
    if (!checked.success) {
      rowErrors.push(`Row ${i + 2}: invalid data`);
      continue;
    }
    const email = normalizeEmail(checked.data.email);
    try {
      const res = await db
        .insert(attendees)
        .values({
          eventId,
          firstName: checked.data.first_name.trim(),
          lastName: checked.data.last_name.trim(),
          email,
        })
        .onConflictDoNothing({
          target: [attendees.eventId, attendees.email],
        })
        .returning({ id: attendees.id });

      if (res.length) inserted += 1;
      else skipped += 1;
    } catch {
      rowErrors.push(`Row ${i + 2}: failed to insert`);
    }
  }

  return NextResponse.json({
    inserted,
    skipped,
    totalRows: parsed.data.length,
    rowErrors: rowErrors.slice(0, 20),
  });
}
