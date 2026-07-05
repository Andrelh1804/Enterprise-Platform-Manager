import { pgTable, text, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { eventsTable } from "./events";
import { ticketTypesTable } from "./ticket-types";

export const registrationsTable = pgTable("registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").notNull().references(() => eventsTable.id, { onDelete: "cascade" }),
  ticketTypeId: uuid("ticket_type_id").notNull().references(() => ticketTypesTable.id, { onDelete: "restrict" }),
  ticketCode: text("ticket_code").notNull().unique(),
  participantName: text("participant_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  price: integer("price").notNull(),
  status: text("status").notNull(),
  checkedIn: boolean("checked_in").notNull().default(false),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRegistrationSchema = createInsertSchema(registrationsTable).omit({
  id: true,
  ticketCode: true,
  checkedIn: true,
  checkedInAt: true,
  createdAt: true,
});
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrationsTable.$inferSelect;
