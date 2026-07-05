---
name: Numeric Zod fields need matching DB column type
description: A Zod number field that allows decimals will fail at insert time if the Drizzle column is declared as integer
---

When the OpenAPI/Zod schema declares a field as `type: number` (no integer constraint) — e.g. a rating like 4.5 — the corresponding Drizzle column must be `numeric`/`real`/`doublePrecision`, not `integer`.

**Why:** A suppliers `rating` field was typed as `integer` in Drizzle while the Zod schema allowed any number. Posting a decimal value (4.5) passed validation but threw an unhandled 500 at the DB insert layer, since Postgres rejects a fractional value for an integer column. Typecheck did not catch this because Zod's `number()` and Drizzle's `integer()` both compile to `number` in TS — the mismatch is only a runtime/DB-level constraint.

**How to apply:** When defining a Drizzle column for a field the OpenAPI spec types as `number` (not `integer`), default to `numeric(column, { mode: "number", precision, scale })` unless the field is truly integer-only (e.g. counts, quantities). Re-run `pnpm --filter @workspace/db run push` after changing a column type.
