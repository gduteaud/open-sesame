import {
  date,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  eventDate: date("date", { mode: "string" }).notNull(),
  perKeyCredits: numeric("per_key_credits", {
    precision: 12,
    scale: 4,
  }).notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const attendees = pgTable(
  "attendees",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    openrouterKey: text("openrouter_key"),
    openrouterKeyHash: text("openrouter_key_hash"),
    provisionedAt: timestamp("provisioned_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("attendees_event_id_email_idx").on(t.eventId, t.email),
  ],
);

export const eventsRelations = relations(events, ({ many }) => ({
  attendees: many(attendees),
}));

export const attendeesRelations = relations(attendees, ({ one }) => ({
  event: one(events, {
    fields: [attendees.eventId],
    references: [events.id],
  }),
}));
