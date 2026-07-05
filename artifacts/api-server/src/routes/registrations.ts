import { randomBytes } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, registrationsTable, ticketTypesTable } from "@workspace/db";
import {
  CreateRegistrationBody,
  UpdateRegistrationBody,
  GetRegistrationParams,
  GetRegistrationResponse,
  UpdateRegistrationParams,
  UpdateRegistrationResponse,
  DeleteRegistrationParams,
  ListRegistrationsQueryParams,
  ListRegistrationsResponse,
  CreateRegistrationResponse,
  CheckInRegistrationBody,
  CheckInRegistrationResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function generateTicketCode(): string {
  return randomBytes(5).toString("hex").toUpperCase();
}

router.get("/registrations", async (req, res): Promise<void> => {
  const query = ListRegistrationsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const registrations = query.data.eventId
    ? await db.select().from(registrationsTable).where(eq(registrationsTable.eventId, query.data.eventId))
    : await db.select().from(registrationsTable);

  res.json(ListRegistrationsResponse.parse(registrations));
});

router.post("/registrations", async (req, res): Promise<void> => {
  const parsed = CreateRegistrationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const registration = await db.transaction(async (tx) => {
      const [ticketType] = await tx
        .select()
        .from(ticketTypesTable)
        .where(eq(ticketTypesTable.id, parsed.data.ticketTypeId));

      if (!ticketType) {
        throw new Error("TICKET_TYPE_NOT_FOUND");
      }
      if (ticketType.status !== "active") {
        throw new Error("TICKET_TYPE_INACTIVE");
      }
      if (ticketType.sold >= ticketType.quantity) {
        throw new Error("SOLD_OUT");
      }

      const [updatedTicketType] = await tx
        .update(ticketTypesTable)
        .set({
          sold: sql`${ticketTypesTable.sold} + 1`,
          status: ticketType.sold + 1 >= ticketType.quantity ? "sold_out" : ticketType.status,
        })
        .where(and(eq(ticketTypesTable.id, ticketType.id), sql`${ticketTypesTable.sold} < ${ticketTypesTable.quantity}`))
        .returning();

      if (!updatedTicketType) {
        throw new Error("SOLD_OUT");
      }

      let ticketCode = generateTicketCode();
      for (let attempt = 0; attempt < 5; attempt++) {
        const [existing] = await tx
          .select({ id: registrationsTable.id })
          .from(registrationsTable)
          .where(eq(registrationsTable.ticketCode, ticketCode));
        if (!existing) break;
        ticketCode = generateTicketCode();
      }

      const [created] = await tx
        .insert(registrationsTable)
        .values({ ...parsed.data, ticketCode })
        .returning();

      return created;
    });

    res.status(201).json(CreateRegistrationResponse.parse(registration));
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    if (message === "TICKET_TYPE_NOT_FOUND") {
      res.status(404).json({ error: "Ticket type not found" });
      return;
    }
    if (message === "TICKET_TYPE_INACTIVE") {
      res.status(400).json({ error: "This ticket type is not available for sale" });
      return;
    }
    if (message === "SOLD_OUT") {
      res.status(409).json({ error: "This ticket type is sold out" });
      return;
    }
    throw err;
  }
});

router.post("/registrations/checkin", async (req, res): Promise<void> => {
  const parsed = CheckInRegistrationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [registration] = await db
    .select()
    .from(registrationsTable)
    .where(eq(registrationsTable.ticketCode, parsed.data.ticketCode.trim().toUpperCase()));

  if (!registration) {
    res.status(404).json({ error: "Ticket code not found" });
    return;
  }

  if (registration.checkedIn) {
    res.json(CheckInRegistrationResponse.parse({ registration, alreadyCheckedIn: true }));
    return;
  }

  const [updated] = await db
    .update(registrationsTable)
    .set({ checkedIn: true, checkedInAt: new Date() })
    .where(eq(registrationsTable.id, registration.id))
    .returning();

  res.json(CheckInRegistrationResponse.parse({ registration: updated, alreadyCheckedIn: false }));
});

router.get("/registrations/:id", async (req, res): Promise<void> => {
  const params = GetRegistrationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [registration] = await db
    .select()
    .from(registrationsTable)
    .where(eq(registrationsTable.id, params.data.id));

  if (!registration) {
    res.status(404).json({ error: "Registration not found" });
    return;
  }

  res.json(GetRegistrationResponse.parse(registration));
});

router.patch("/registrations/:id", async (req, res): Promise<void> => {
  const params = UpdateRegistrationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateRegistrationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [registration] = await db
    .update(registrationsTable)
    .set(parsed.data)
    .where(eq(registrationsTable.id, params.data.id))
    .returning();

  if (!registration) {
    res.status(404).json({ error: "Registration not found" });
    return;
  }

  res.json(UpdateRegistrationResponse.parse(registration));
});

router.delete("/registrations/:id", async (req, res): Promise<void> => {
  const params = DeleteRegistrationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const registration = await db.transaction(async (tx) => {
    const [deleted] = await tx
      .delete(registrationsTable)
      .where(eq(registrationsTable.id, params.data.id))
      .returning();

    if (deleted) {
      await tx
        .update(ticketTypesTable)
        .set({
          sold: sql`GREATEST(${ticketTypesTable.sold} - 1, 0)`,
          status: sql`CASE WHEN ${ticketTypesTable.status} = 'sold_out' THEN 'active' ELSE ${ticketTypesTable.status} END`,
        })
        .where(eq(ticketTypesTable.id, deleted.ticketTypeId));
    }

    return deleted;
  });

  if (!registration) {
    res.status(404).json({ error: "Registration not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
