import { createHash } from "node:crypto";
import { Router, type NextFunction, type Request, type Response } from "express";
import { DomainError } from "../../../../packages/kernel/src";
import {
  emailSchema,
  loginSchema,
  profileSchema,
  registerSchema,
  tokenSchema,
} from "../../../../lib/api-zod/src";
import { AppError, UnauthorizedError } from "../../../utils/errors";
import { asyncHandler } from "../../../utils/asyncHandler";
import { authLimiter } from "../../../middleware/rateLimiter";
import { getAuthenticatedUserId, requireAuth } from "../../../middleware/auth";
import { logger } from "../../../config/logger";
import { createResponseSpanMiddleware } from "../../../config/tracing";
import type { ExternalAuthService } from "../application/external-auth.service";
import type { IdentityService } from "../application/identity.service";

function mapIdentityError(error: unknown): unknown {
  if (!(error instanceof DomainError)) return error;

  const statusByCode: Record<string, number> = {
    INVALID_CREDENTIALS: 401,
    INVALID_AUTH_TOKEN: 400,
    ACCOUNT_NOT_FOUND: 404,
    USERNAME_TAKEN: 409,
    EMAIL_IN_USE: 409,
    ACCOUNT_LINK_REQUIRES_SIGN_IN: 409,
    EMAIL_DELIVERY_NOT_CONFIGURED: 503,
    EMAIL_SENDER_NOT_CONFIGURED: 503,
    EMAIL_DELIVERY_FAILED: 503,
    UNSUPPORTED_IDENTITY_PROVIDER: 400,
    EXTERNAL_AUTH_NOT_CONFIGURED: 503,
    EXTERNAL_AUTH_PROVIDER_UNAVAILABLE: 503,
    EXTERNAL_AUTH_PROVIDER_FAILED: 401,
    INVALID_EXTERNAL_AUTH_STATE: 400,
    EXTERNAL_AUTH_SESSION_CHANGED: 401,
    IDENTITY_ALREADY_LINKED: 409,
    INVALID_EMAIL: 400,
    INVALID_USERNAME: 400,
  };
  return new AppError(error.message, statusByCode[error.code] ?? 400, error.code);
}

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export interface IdentityRouterDependencies {
  externalAuthService: Pick<
    ExternalAuthService,
    "availableProviders" | "begin" | "complete" | "cancel"
  >;
  identityAppOrigin: string;
  identityService: Pick<
    IdentityService,
    | "login"
    | "register"
    | "getById"
    | "updateProfile"
    | "listIdentities"
    | "requestMagicLink"
    | "consumeMagicLink"
    | "requestAccountLink"
    | "consumeAccountLink"
  >;
}

function route(handler: Handler) {
  return asyncHandler(async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(mapIdentityError(error));
    }
  });
}

function establishSession(req: Request, userId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
      if (regenerateError) return reject(regenerateError);
      req.session.userId = userId;
      req.session.authenticatedAt = Date.now();
      req.session.save((saveError) => (saveError ? reject(saveError) : resolve()));
    });
  });
}

function routeParam(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : value?.[0] ?? "";
}

function authOperation(req: Request): string {
  const staticOperations: Record<string, string> = {
    "GET /external/providers": "external.providers",
    "POST /login": "login",
    "POST /register": "register",
    "POST /logout": "logout",
    "GET /me": "session.read",
    "PATCH /profile": "profile.update",
    "GET /identities": "identities.read",
    "POST /magic-link/request": "magic_link.request",
    "POST /magic-link/consume": "magic_link.consume",
    "POST /account-link/request": "account_link.request",
    "POST /account-link/consume": "account_link.consume",
  };
  const operation = staticOperations[`${req.method} ${req.path}`];
  if (operation) return operation;
  if (req.method === "GET" && /^\/external\/[^/]+\/callback$/.test(req.path)) {
    return "external.callback";
  }
  if (req.method === "GET" && /^\/external\/[^/]+\/link$/.test(req.path)) {
    return "external.link";
  }
  if (req.method === "GET" && /^\/external\/[^/]+$/.test(req.path)) {
    return "external.begin";
  }
  return "other";
}

export function createIdentityRouter(dependencies: IdentityRouterDependencies): Router {
  const router = Router();
  const { externalAuthService, identityAppOrigin, identityService } = dependencies;

  router.use(createResponseSpanMiddleware((req) => {
    const operation = authOperation(req);
    return {
      name: `auth.${operation}`,
      attributes: { "auth.operation": operation },
    };
  }));

router.get(
  "/external/providers",
  route(async (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ providers: externalAuthService.availableProviders() });
  }),
);

router.get(
  "/external/:provider",
  authLimiter,
  route(async (req, res) => {
    const provider = routeParam(req.params.provider);
    const authorizationUrl = await externalAuthService.begin(provider);
    rememberExternalAuthState(req, provider, authorizationUrl);
    await saveSession(req);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.redirect(302, authorizationUrl);
  }),
);

router.get(
  "/external/:provider/link",
  requireAuth,
  authLimiter,
  route(async (req, res) => {
    const provider = routeParam(req.params.provider);
    const authorizationUrl = await externalAuthService.begin(
      provider,
      getAuthenticatedUserId(req),
    );
    rememberExternalAuthState(req, provider, authorizationUrl);
    await saveSession(req);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.redirect(302, authorizationUrl);
  }),
);

function queryString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function externalAuthStateHash(state: string): string {
  return createHash("sha256").update(state).digest("hex");
}

function rememberExternalAuthState(
  req: Request,
  provider: string,
  authorizationUrl: string,
): void {
  const state = queryString(new URL(authorizationUrl).searchParams.get("state"));
  if (!state) {
    throw new DomainError("INVALID_EXTERNAL_AUTH_STATE", "Invalid external sign-in response");
  }

  const stateHash = externalAuthStateHash(state);
  const pendingStates = req.session.externalAuthStates ?? [];
  req.session.externalAuthStates = [
    ...pendingStates.filter((entry) => entry.stateHash !== stateHash),
    { provider, stateHash },
  ].slice(-5);
}

function consumeExternalAuthState(req: Request, provider: string, state: string): boolean {
  const stateHash = externalAuthStateHash(state);
  const pendingStates = req.session.externalAuthStates ?? [];
  const isBoundToSession = pendingStates.some(
    (entry) => entry.provider === provider && entry.stateHash === stateHash,
  );
  if (!isBoundToSession) return false;

  req.session.externalAuthStates = pendingStates.filter(
    (entry) => entry.provider !== provider || entry.stateHash !== stateHash,
  );
  return true;
}

function saveSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

function safeAuthRedirect(path: "/login" | "/shop" | "/account", error?: string): string {
  const url = new URL(path, identityAppOrigin);
  if (error) url.searchParams.set("auth_error", error);
  return url.toString();
}

router.get(
  "/external/:provider/callback",
  authLimiter,
  asyncHandler(async (req, res) => {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("Referrer-Policy", "no-referrer");

    const provider = routeParam(req.params.provider);
    const state = queryString(req.query.state);
    const isAuthenticated = Boolean(req.session.userId);

    try {
      if (!state || !consumeExternalAuthState(req, provider, state)) {
        throw new DomainError("INVALID_EXTERNAL_AUTH_STATE", "Invalid external sign-in response");
      }

      if (queryString(req.query.error)) {
        const linked = await externalAuthService.cancel(provider, state);
        res.redirect(302, safeAuthRedirect(linked ? "/account" : "/login", "cancelled"));
        return;
      }

      const code = queryString(req.query.code);
      if (!code || !state) {
        throw new DomainError("INVALID_EXTERNAL_AUTH_STATE", "Invalid external sign-in response");
      }

      const result = await externalAuthService.complete(provider, {
        code,
        state,
        currentUserId: req.session.userId,
      });
      await establishSession(req, result.user.id);
      res.redirect(302, safeAuthRedirect(result.linked ? "/account" : "/shop"));
    } catch (error) {
      const errorCode = error instanceof DomainError ? error.code : "EXTERNAL_AUTH_FAILED";
      logger.warn({ provider, errorCode }, "External identity sign-in failed");
      const redirectPath = isAuthenticated ? "/account" : "/login";
      const redirectCode =
        errorCode === "ACCOUNT_LINK_REQUIRES_SIGN_IN"
          ? "link_required"
          : errorCode === "EMAIL_IN_USE"
            ? "email_in_use"
          : errorCode === "IDENTITY_ALREADY_LINKED"
            ? "identity_in_use"
            : "provider_failed";
      res.redirect(302, safeAuthRedirect(redirectPath, redirectCode));
    }
  }),
);

router.post(
  "/login",
  authLimiter,
  route(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await identityService.login(input.username, input.password);
    await establishSession(req, user.id);
    res.json(user);
  }),
);

router.post(
  "/register",
  authLimiter,
  route(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const user = await identityService.register(input);
    await establishSession(req, user.id);
    res.status(201).json(user);
  }),
);

router.post(
  "/logout",
  route(async (req, res) => {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((error) => (error ? reject(error) : resolve()));
    });
    res.clearCookie("connect.sid");
    res.sendStatus(200);
  }),
);

router.get(
  "/me",
  requireAuth,
  route(async (req, res) => {
    const user = await identityService.getById(getAuthenticatedUserId(req));
    if (!user) {
      req.session.destroy(() => {});
      throw new UnauthorizedError("Session expired");
    }
    res.json(user);
  }),
);

router.patch(
  "/profile",
  requireAuth,
  route(async (req, res) => {
    const input = profileSchema.parse(req.body);
    const user = await identityService.updateProfile(getAuthenticatedUserId(req), input);
    res.json(user);
  }),
);

router.get(
  "/identities",
  requireAuth,
  route(async (req, res) => {
    res.json(await identityService.listIdentities(getAuthenticatedUserId(req)));
  }),
);

router.post(
  "/magic-link/request",
  authLimiter,
  route(async (req, res) => {
    const { email } = emailSchema.parse(req.body);
    await identityService.requestMagicLink(email);
    // Deliberately generic to prevent account enumeration.
    res.status(202).json({ message: "If the address is eligible, a sign-in link was sent." });
  }),
);

router.post(
  "/magic-link/consume",
  authLimiter,
  route(async (req, res) => {
    const { token } = tokenSchema.parse(req.body);
    const user = await identityService.consumeMagicLink(token);
    await establishSession(req, user.id);
    res.json(user);
  }),
);

router.post(
  "/account-link/request",
  requireAuth,
  authLimiter,
  route(async (req, res) => {
    const { email } = emailSchema.parse(req.body);
    await identityService.requestAccountLink(getAuthenticatedUserId(req), email);
    res.status(202).json({ message: "A confirmation link was sent." });
  }),
);

router.post(
  "/account-link/consume",
  authLimiter,
  route(async (req, res) => {
    const { token } = tokenSchema.parse(req.body);
    const user = await identityService.consumeAccountLink(token);
    await establishSession(req, user.id);
    res.json(user);
  }),
);

  return router;
}