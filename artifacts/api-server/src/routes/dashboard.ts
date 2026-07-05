import { Router, type IRouter } from "express";
import { desc, eq, gte, sql } from "drizzle-orm";
import {
  db,
  eventsTable,
  sponsorsTable,
  suppliersTable,
  staffTable,
  contractsTable,
  transactionsTable,
  registrationsTable,
} from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [
    activeEvents,
    totalRegistrations,
    sponsorsCount,
    suppliersCount,
    staffCount,
    pendingContracts,
    contractsExpiringSoon,
    incomeAgg,
    expenseAgg,
    upcomingEvents,
    recentTransactions,
  ] = await Promise.all([
    db.$count(eventsTable, sql`${eventsTable.status} in ('planning', 'confirmed', 'in_progress')`),
    db.$count(registrationsTable),
    db.$count(sponsorsTable),
    db.$count(suppliersTable),
    db.$count(staffTable),
    db.$count(contractsTable, sql`${contractsTable.status} in ('draft', 'sent')`),
    db.$count(
      contractsTable,
      sql`${contractsTable.status} = 'signed' and ${contractsTable.endDate} <= ${soon} and ${contractsTable.endDate} >= ${today}`,
    ),
    db
      .select({ total: sql<string>`coalesce(sum(${transactionsTable.amount}), 0)` })
      .from(transactionsTable)
      .where(eq(transactionsTable.type, "income")),
    db
      .select({ total: sql<string>`coalesce(sum(${transactionsTable.amount}), 0)` })
      .from(transactionsTable)
      .where(eq(transactionsTable.type, "expense")),
    db.select().from(eventsTable).where(gte(eventsTable.date, today)).orderBy(eventsTable.date).limit(5),
    db.select().from(transactionsTable).orderBy(desc(transactionsTable.createdAt)).limit(5),
  ]);

  const realizedRevenue = await db
    .select({ total: sql<string>`coalesce(sum(${transactionsTable.amount}), 0)` })
    .from(transactionsTable)
    .where(sql`${transactionsTable.type} = 'income' and ${transactionsTable.status} = 'paid'`);

  const expectedRevenue = Number(incomeAgg[0]?.total ?? 0);
  const totalExpenses = Number(expenseAgg[0]?.total ?? 0);
  const realized = Number(realizedRevenue[0]?.total ?? 0);

  const summary = {
    activeEventsCount: activeEvents,
    totalRegistrations,
    expectedRevenue,
    realizedRevenue: realized,
    totalExpenses,
    profit: realized - totalExpenses,
    sponsorsCount,
    suppliersCount,
    staffCount,
    pendingContracts,
    contractsExpiringSoon,
    upcomingEvents,
    recentTransactions,
  };

  res.json(GetDashboardSummaryResponse.parse(summary));
});

export default router;
