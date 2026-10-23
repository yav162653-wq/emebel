---
name: Identity-centric auth architecture
description: Security invariants for keeping multiple authentication providers attached to one canonical account.
---

## Security invariants
- Never auto-link a provider account solely because its claimed email matches an existing user. The provider must attest that the email is verified.
- Linking a new provider to an existing account must be an explicit authenticated action; do not silently transfer an identity that is already owned by another user.
- Keep secrets and provider credentials attached to the provider identity, not on the canonical user profile.

**Why:** Automatically joining accounts on unverified or ambiguous email can let an attacker take over an existing account.

**How to apply:** For each new login provider, distinguish first-time account creation, verified-email matching, and explicit account linking. Enforce provider identity uniqueness and keep the canonical user ID stable across login methods.
