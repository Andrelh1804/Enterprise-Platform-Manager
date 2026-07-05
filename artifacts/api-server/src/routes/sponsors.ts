import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, sponsorsTable } from "@workspace/db";
import {
  CreateSponsorBody,
  UpdateSponsorBody,
  GetSponsorParams,
  GetSponsorResponse,
  UpdateSponsorParams,
  UpdateSponsorResponse,
  DeleteSponsorParams,
  ListSponsorsQueryParams,
  ListSponsorsResponse,
  CreateSponsorResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/sponsors", async (req, res): Promise<void> => {
  const query = ListSponsorsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const sponsors = query.data.eventId
    ? await db.select().from(sponsorsTable).where(eq(sponsorsTable.eventId, query.data.eventId))
    : await db.select().from(sponsorsTable);

  res.json(ListSponsorsResponse.parse(sponsors));
});

router.post("/sponsors", async (req, res): Promise<void> => {
  const parsed = CreateSponsorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [sponsor] = await db.insert(sponsorsTable).values(parsed.data).returning();

  res.status(201).json(CreateSponsorResponse.parse(sponsor));
});

router.get("/sponsors/:id", async (req, res): Promise<void> => {
  const params = GetSponsorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sponsor] = await db.select().from(sponsorsTable).where(eq(sponsorsTable.id, params.data.id));

  if (!sponsor) {
    res.status(404).json({ error: "Sponsor not found" });
    return;
  }

  res.json(GetSponsorResponse.parse(sponsor));
});

router.patch("/sponsors/:id", async (req, res): Promise<void> => {
  const params = UpdateSponsorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSponsorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [sponsor] = await db
    .update(sponsorsTable)
    .set(parsed.data)
    .where(eq(sponsorsTable.id, params.data.id))
    .returning();

  if (!sponsor) {
    res.status(404).json({ error: "Sponsor not found" });
    return;
  }

  res.json(UpdateSponsorResponse.parse(sponsor));
});

router.delete("/sponsors/:id", async (req, res): Promise<void> => {
  const params = DeleteSponsorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [sponsor] = await db.delete(sponsorsTable).where(eq(sponsorsTable.id, params.data.id)).returning();

  if (!sponsor) {
    res.status(404).json({ error: "Sponsor not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
