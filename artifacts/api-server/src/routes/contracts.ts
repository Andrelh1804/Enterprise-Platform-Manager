import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, contractsTable } from "@workspace/db";
import {
  CreateContractBody,
  UpdateContractBody,
  GetContractParams,
  GetContractResponse,
  UpdateContractParams,
  UpdateContractResponse,
  DeleteContractParams,
  ListContractsQueryParams,
  ListContractsResponse,
  CreateContractResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/contracts", async (req, res): Promise<void> => {
  const query = ListContractsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const contracts = query.data.eventId
    ? await db.select().from(contractsTable).where(eq(contractsTable.eventId, query.data.eventId))
    : await db.select().from(contractsTable);

  res.json(ListContractsResponse.parse(contracts));
});

router.post("/contracts", async (req, res): Promise<void> => {
  const parsed = CreateContractBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [contract] = await db
    .insert(contractsTable)
    .values({
      ...parsed.data,
      startDate: parsed.data.startDate.toISOString().slice(0, 10),
      endDate: parsed.data.endDate.toISOString().slice(0, 10),
    })
    .returning();

  res.status(201).json(CreateContractResponse.parse(contract));
});

router.get("/contracts/:id", async (req, res): Promise<void> => {
  const params = GetContractParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [contract] = await db.select().from(contractsTable).where(eq(contractsTable.id, params.data.id));

  if (!contract) {
    res.status(404).json({ error: "Contract not found" });
    return;
  }

  res.json(GetContractResponse.parse(contract));
});

router.patch("/contracts/:id", async (req, res): Promise<void> => {
  const params = UpdateContractParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateContractBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [contract] = await db
    .update(contractsTable)
    .set({
      ...parsed.data,
      startDate: parsed.data.startDate?.toISOString().slice(0, 10),
      endDate: parsed.data.endDate?.toISOString().slice(0, 10),
    })
    .where(eq(contractsTable.id, params.data.id))
    .returning();

  if (!contract) {
    res.status(404).json({ error: "Contract not found" });
    return;
  }

  res.json(UpdateContractResponse.parse(contract));
});

router.delete("/contracts/:id", async (req, res): Promise<void> => {
  const params = DeleteContractParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [contract] = await db.delete(contractsTable).where(eq(contractsTable.id, params.data.id)).returning();

  if (!contract) {
    res.status(404).json({ error: "Contract not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
