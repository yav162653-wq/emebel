import type { NextFunction, Request, Response } from "express";
import { SESSION_ABSOLUTE_TIMEOUT_MS } from "../config/session-policy";

export function sessionLifetimeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.session?.userId) return next();

  const now = Date.now();
  const authenticatedAt = req.session.authenticatedAt;
  if (typeof authenticatedAt !== "number" || !Number.isFinite(authenticatedAt)) {
    req.session.authenticatedAt = now;
    return next();
  }

  if (
    authenticatedAt > now
    || now - authenticatedAt >= SESSION_ABSOLUTE_TIMEOUT_MS
  ) {
    req.session.userId = undefined;
    req.session.authenticatedAt = undefined;
    return req.session.destroy((error) => {
      res.clearCookie("connect.sid", { path: "/" });
      if (error) return next(error);
      next();
    });
  }

  next();
}
