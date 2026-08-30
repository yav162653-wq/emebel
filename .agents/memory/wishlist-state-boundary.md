---
name: Wishlist state boundary
description: Keeps guest local wishlist state and authenticated persistent wishlist state consistent across all UI entry points.
---

All wishlist UI must use the unified wishlist hook. The local Zustand store is an implementation detail for guests and for migrating guest items after login; authenticated UI should read and mutate the server-backed query instead.

**Why:** Direct store access in authenticated screens made wishlist state differ between screens and bypassed persistence across devices.

**How to apply:** When adding or changing a wishlist button, badge, counter, or list, use the unified hook and do not import the local store into the UI component.