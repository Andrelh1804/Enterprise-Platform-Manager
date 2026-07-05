import { pgTable, text, integer, date, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  eventType: text("event_type").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  time: text("time"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  venue: text("venue").notNull(),
  organizer: text("organizer").notNull(),
  capacity: integer("capacity").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
