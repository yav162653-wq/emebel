---
name: Production run mode
description: Deployment runtime requirement for bundled Node services that parse NODE_ENV from the environment object.
---

The production run command must explicitly set `NODE_ENV=production` (for example through the package start script). A build-time replacement of direct `process.env.NODE_ENV` references does not change `process.env` parsing, so a bare `node dist/index.cjs` can incorrectly enter the development/Vite branch.

**Why:** The autoscale image built successfully but failed its startup probe when the deployment command omitted the runtime mode.

**How to apply:** Keep the deployment run command aligned with the package production start script, and smoke-test the exact configured command against `GET /` before republishing.