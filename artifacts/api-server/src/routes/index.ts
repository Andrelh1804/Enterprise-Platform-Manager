import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import eventsRouter from "./events";
import sponsorsRouter from "./sponsors";
import suppliersRouter from "./suppliers";
import contractsRouter from "./contracts";
import staffRouter from "./staff";
import transactionsRouter from "./transactions";
import registrationsRouter from "./registrations";
import ticketTypesRouter from "./ticket-types";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(eventsRouter);
router.use(sponsorsRouter);
router.use(suppliersRouter);
router.use(contractsRouter);
router.use(staffRouter);
router.use(transactionsRouter);
router.use(ticketTypesRouter);
router.use(registrationsRouter);

export default router;
