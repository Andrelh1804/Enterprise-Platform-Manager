import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, staffTable } from "@workspace/db";
import {
  CreateStaffBody,
  UpdateStaffBody,
  GetStaffParams,
  GetStaffResponse,
  UpdateStaffParams,
  UpdateStaffResponse,
  DeleteStaffParams,
  ListStaffQueryParams,
  ListStaffResponse,
  CreateStaffResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/staff", async (req, res): Promise<void> => {
  const query = ListStaffQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const staff = query.data.eventId
    ? await db.select().from(staffTable).where(eq(staffTable.eventId, query.data.eventId))
    : await db.select().from(staffTable);

  res.json(ListStaffResponse.parse(staff));
});

router.post("/staff", async (req, res): Promise<void> => {
  const parsed = CreateStaffBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [staffMember] = await db.insert(staffTable).values(parsed.data).returning();

  res.status(201).json(CreateStaffResponse.parse(staffMember));
});

router.get("/staff/:id", async (req, res): Promise<void> => {
  const params = GetStaffParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [staffMember] = await db.select().from(staffTable).where(eq(staffTable.id, params.data.id));

  if (!staffMember) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  res.json(GetStaffResponse.parse(staffMember));
});

router.patch("/staff/:id", async (req, res): Promise<void> => {
  const params = UpdateStaffParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateStaffBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [staffMember] = await db
    .update(staffTable)
    .set(parsed.data)
    .where(eq(staffTable.id, params.data.id))
    .returning();

  if (!staffMember) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  res.json(UpdateStaffResponse.parse(staffMember));
});

router.delete("/staff/:id", async (req, res): Promise<void> => {
  const params = DeleteStaffParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [staffMember] = await db.delete(staffTable).where(eq(staffTable.id, params.data.id)).returning();

  if (!staffMember) {
    res.status(404).json({ error: "Staff member not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
