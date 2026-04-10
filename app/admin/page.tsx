import Link from "next/link";

export const dynamic = "force-dynamic";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { formatFullDate } from "@/lib/format-date";
import { events } from "@/db/schema";
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

export default async function AdminEventsPage() {
  const rows = await db.select().from(events).orderBy(desc(events.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Events
          </h1>
          <p className="text-muted-foreground text-sm">
            Create events, upload attendee lists, and set per-key credit limits.
          </p>
        </div>
        <Link
          href="/admin/events/new"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          New event
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All events</CardTitle>
          <CardDescription>
            Click an event to manage attendees and share the claim link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm">No events yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Per-key limit (USD)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/events/${e.id}`}
                        className="hover:underline"
                      >
                        {e.name}
                      </Link>
                      <div className="text-muted-foreground text-xs">
                        slug: {e.slug}
                      </div>
                    </TableCell>
                    <TableCell>{formatFullDate(e.eventDate)}</TableCell>
                    <TableCell className="text-right">
                      {e.perKeyCredits}
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
