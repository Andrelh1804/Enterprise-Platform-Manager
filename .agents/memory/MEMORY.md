# Memory Index

- [Contract-first route paths](openapi-route-paths.md) — always verify Express route paths against the OpenAPI spec paths (including nested prefixes like `/finance/transactions`), not just the resource name.
- [Numeric Zod fields need matching DB column type](drizzle-numeric-vs-integer.md) — a Zod `number` field (e.g. ratings, scores) will 500 at insert time if the Drizzle column is `integer`; use `numeric(..., {mode:"number"})` when decimals are allowed.
