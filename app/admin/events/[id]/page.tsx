import Link from "next/link";

export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { attendees, events } from "@/db/schema";
import { db } from "@/lib/db";
import { formatFullDate, formatFullDateTime } from "@/lib/format-date";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EventCsvUpload } from "@/components/event-csv-upload";
import { EventAddAttendee } from "@/components/event-add-attendee";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminEventDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) notFound();

  const rows = await db
    .select({
      id: attendees.id,
      firstName: attendees.firstName,
      lastName: attendees.lastName,
      email: attendees.email,
      provisionedAt: attendees.provisionedAt,
    })
    .from(attendees)
    .where(eq(attendees.eventId, id))
    .orderBy(asc(attendees.email));

  const origin =
    process.env.NEXT_PUBLIC_APP_ORIGIN ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const claimUrl = `${origin}/${event.slug}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {event.name}
            </h1>
            <p className="text-muted-foreground text-sm">
              {formatFullDate(event.eventDate)} · Per-key limit:{" "}
              {event.perKeyCredits} USD · slug: {event.slug}
            </p>
          </div>
          <Link
            href="/admin"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            All events
          </Link>
        </div>
        <p className="text-muted-foreground text-sm">
          Attendee claim link:{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
            {claimUrl}
          </code>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload attendees (CSV)</CardTitle>
            <CardDescription>
              Required columns: <code>first_name</code>, <code>last_name</code>,{" "}
              <code>email</code>. Duplicate emails for this event are skipped.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventCsvUpload eventId={event.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add individual attendee</CardTitle>
            <CardDescription>Register a single person for this event.</CardDescription>
          </CardHeader>
          <CardContent>
            <EventAddAttendee eventId={event.id} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendees ({rows.length})</CardTitle>
          <CardDescription>
            &ldquo;Key&rdquo; means they claimed their OpenRouter key from the
            public claim page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No attendees yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Key provisioned</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.firstName} {r.lastName}
                    </TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>
                      {r.provisionedAt
                        ? formatFullDateTime(r.provisionedAt)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
