import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, registrationsTable } from "@workspace/db";
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
} from "@workspace/api-zod";

const router: IRouter = Router();

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

  const [registration] = await db.insert(registrationsTable).values(parsed.data).returning();

  res.status(201).json(CreateRegistrationResponse.parse(registration));
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

  const [registration] = await db
    .delete(registrationsTable)
    .where(eq(registrationsTable.id, params.data.id))
    .returning();

  if (!registration) {
    res.status(404).json({ error: "Registration not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
