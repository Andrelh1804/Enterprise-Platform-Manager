import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, transactionsTable } from "@workspace/db";
import {
  CreateTransactionBody,
  UpdateTransactionBody,
  GetTransactionParams,
  GetTransactionResponse,
  UpdateTransactionParams,
  UpdateTransactionResponse,
  DeleteTransactionParams,
  ListTransactionsQueryParams,
  ListTransactionsResponse,
  CreateTransactionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/finance/transactions", async (req, res): Promise<void> => {
  const query = ListTransactionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.eventId) conditions.push(eq(transactionsTable.eventId, query.data.eventId));
  if (query.data.type) conditions.push(eq(transactionsTable.type, query.data.type));

  const transactions =
    conditions.length > 0
      ? await db.select().from(transactionsTable).where(and(...conditions))
      : await db.select().from(transactionsTable);

  res.json(ListTransactionsResponse.parse(transactions));
});

router.post("/finance/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [transaction] = await db
    .insert(transactionsTable)
    .values({ ...parsed.data, dueDate: parsed.data.dueDate.toISOString().slice(0, 10) })
    .returning();

  res.status(201).json(CreateTransactionResponse.parse(transaction));
});

router.get("/finance/transactions/:id", async (req, res): Promise<void> => {
  const params = GetTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [transaction] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, params.data.id));

  if (!transaction) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json(GetTransactionResponse.parse(transaction));
});

router.patch("/finance/transactions/:id", async (req, res): Promise<void> => {
  const params = UpdateTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [transaction] = await db
    .update(transactionsTable)
    .set({ ...parsed.data, dueDate: parsed.data.dueDate?.toISOString().slice(0, 10) })
    .where(eq(transactionsTable.id, params.data.id))
    .returning();

  if (!transaction) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json(UpdateTransactionResponse.parse(transaction));
});

router.delete("/finance/transactions/:id", async (req, res): Promise<void> => {
  const params = DeleteTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [transaction] = await db
    .delete(transactionsTable)
    .where(eq(transactionsTable.id, params.data.id))
    .returning();

  if (!transaction) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
