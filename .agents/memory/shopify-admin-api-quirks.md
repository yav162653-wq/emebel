---
name: Shopify Admin mutation quirks
description: Version-specific constraints found while provisioning Shopify catalog data through the Replit proxy.
---

Shopify Admin mutations in the current API require `@idempotent(key: "...")` on the mutation field, not on the mutation operation. Inventory quantity writes also require `changeFromQuantity`, so setup code must query the current available level before setting stock.

**Why:** The API accepted the product mutation structure but rejected writes without these fields; retry-safe keys and optimistic quantity guards are required for resumable catalog syncs.

**How to apply:** Keep Admin writes behind `shopify-admin-api.mjs`, use deterministic keys derived from the product/variant and desired operation, and keep nested inventory queries below Shopify’s single-query cost limit.