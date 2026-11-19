import { randomBytes, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../utils/errors";

declare module "express-session" {
  interface SessionData {
    csrfToken?: string;
  }
}

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function csrfTokenHandler(req: Request, res: Response) {
  req.session.csrfToken ??= randomBytes(32).toString("base64url");
  res.setHeader("Cache-Control", "no-store");
  res.json({ token: req.session.csrfToken });
}

export function csrfMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (safeMethods.has(req.method.toUpperCase())) return next();

  const expected = req.session?.csrfToken;
  const provided = req.get("x-csrf-token");
  if (!expected || !provided) {
    return next(new ForbiddenError("CSRF token missing or invalid"));
  }

  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  if (
    expectedBytes.length !== providedBytes.length
    || !timingSafeEqual(expectedBytes, providedBytes)
  ) {
    return next(new ForbiddenError("CSRF token missing or invalid"));
  }

  next();
}
