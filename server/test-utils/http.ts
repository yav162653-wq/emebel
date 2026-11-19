import { createServer } from "node:http";
import { once } from "node:events";
import type { TestContext } from "node:test";
import express, { type Router } from "express";
import session from "express-session";
import { errorHandler } from "../middleware/errorHandler";

interface HttpTestServerOptions {
  mountPath: string;
  userId?: number;
}

export async function startHttpTestServer(
  t: TestContext,
  router: Router,
  options: HttpTestServerOptions,
): Promise<string> {
  const app = express();
  app.use(express.json());
  app.use(
    session({
      secret: "test-http-session-secret-long-enough",
      resave: false,
      saveUninitialized: false,
    }),
  );

  if (options.userId !== undefined) {
    app.use((req, _res, next) => {
      req.session.userId = options.userId;
      next();
    });
  }

  app.use(options.mountPath, router);
  app.use(errorHandler);

  const server = createServer(app);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    server.close();
    await once(server, "close");
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Unable to resolve the HTTP test server address");
  }

  return `http://127.0.0.1:${address.port}`;
}
