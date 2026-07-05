import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ticketTypesTable } from "@workspace/db";
import {
  CreateTicketTypeBody,
  UpdateTicketTypeBody,
  GetTicketTypeParams,
  GetTicketTypeResponse,
  UpdateTicketTypeParams,
  UpdateTicketTypeResponse,
  DeleteTicketTypeParams,
  ListTicketTypesQueryParams,
  ListTicketTypesResponse,
  CreateTicketTypeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/ticket-types", async (req, res): Promise<void> => {
  const query = ListTicketTypesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const ticketTypes = query.data.eventId
    ? await db.select().from(ticketTypesTable).where(eq(ticketTypesTable.eventId, query.data.eventId))
    : await db.select().from(ticketTypesTable);

  res.json(ListTicketTypesResponse.parse(ticketTypes));
});

router.post("/ticket-types", async (req, res): Promise<void> => {
  const parsed = CreateTicketTypeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [ticketType] = await db.insert(ticketTypesTable).values(parsed.data).returning();

  res.status(201).json(CreateTicketTypeResponse.parse(ticketType));
});

router.get("/ticket-types/:id", async (req, res): Promise<void> => {
  const params = GetTicketTypeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ticketType] = await db.select().from(ticketTypesTable).where(eq(ticketTypesTable.id, params.data.id));

  if (!ticketType) {
    res.status(404).json({ error: "Ticket type not found" });
    return;
  }

  res.json(GetTicketTypeResponse.parse(ticketType));
});

router.patch("/ticket-types/:id", async (req, res): Promise<void> => {
  const params = UpdateTicketTypeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTicketTypeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [ticketType] = await db
    .update(ticketTypesTable)
    .set(parsed.data)
    .where(eq(ticketTypesTable.id, params.data.id))
    .returning();

  if (!ticketType) {
    res.status(404).json({ error: "Ticket type not found" });
    return;
  }

  res.json(UpdateTicketTypeResponse.parse(ticketType));
});

router.delete("/ticket-types/:id", async (req, res): Promise<void> => {
  const params = DeleteTicketTypeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ticketType] = await db.delete(ticketTypesTable).where(eq(ticketTypesTable.id, params.data.id)).returning();

  if (!ticketType) {
    res.status(404).json({ error: "Ticket type not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
