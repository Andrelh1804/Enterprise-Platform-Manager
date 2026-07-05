---
name: Contract-first route paths must match OpenAPI exactly
description: Express route paths were built from resource names instead of the actual OpenAPI path, causing 404s on the frontend
---

When wiring an Express router for a resource, some resources are nested under a prefix in the OpenAPI spec (e.g. `/finance/transactions` instead of `/transactions`) rather than mounted flatly at the resource name. The generated frontend API client (Orval) always calls the exact path from the spec.

**Why:** A transactions router was mounted at `/transactions` while the spec (and therefore the generated frontend hooks) called `/finance/transactions`. This produced silent 404s that manifested as an infinite loading skeleton on the page, not an obvious error — easy to miss without cross-checking network calls against the spec.

**How to apply:** When adding or reviewing a new resource router, grep the OpenAPI spec's top-level paths (`^  /` in `lib/api-spec/openapi.yaml`) and confirm the Express route path is byte-for-byte identical, including any nested prefix segment. Don't assume the resource name alone is the route path.
