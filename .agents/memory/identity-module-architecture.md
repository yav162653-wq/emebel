---
name: Identity module architecture
description: Project direction for an environment-independent, enterprise-ready modular backend and shared packages.
---

## Rule
Keep identity behavior provider-neutral in the domain and application layers. Put persistence, sessions, email delivery, and provider protocol details behind ports and infrastructure adapters; expose behavior through presentation adapters. Shared primitives and contracts belong in reusable packages rather than being coupled to a specific server or frontend.

**Why:** The user asked to continue evolving the project toward DDD, Hexagonal Architecture, and modular boundaries, starting with Identity and SaaS organizations.

**How to apply:** When adding auth providers, SaaS capabilities, or other modules, preserve those boundaries and avoid importing infrastructure/framework details into domain rules. Keep transport-specific code at module edges.
