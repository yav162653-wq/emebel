---
name: Reviews module
description: How the SPACE. reviews system is structured and key constraints
---

## Schema
`Review` model with `@@unique([productId, userId])` — one review per product per user.
Compound unique key name in Prisma is `productId_userId` (used in `findUnique` and `upsert`).

## API routes (mounted at /api/reviews)
- `GET /:productId` — all reviews, public
- `GET /:productId/summary` — `{ count, average }`, public
- `GET /:productId/mine` — current user's own review (auth required)
- `POST /:productId` — create or update (upsert) review (auth required)
- `DELETE /:productId` — remove own review (auth required)

## Frontend
- `ReviewsSection` component is self-contained inside `ProductDetail.tsx`
- Star rating picker uses hover state + `fill-accent` for selected stars
- Summary shown in the header area of ProductDetail replaces the old hardcoded "48 reviews"
- `useQuery` for summary uses key `["/api/reviews", productId, "summary"]`

**Why:** Upsert pattern chosen so users can edit their review without a separate PUT endpoint; @@unique enforces one review per product per user at DB level.
