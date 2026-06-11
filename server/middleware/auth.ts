import type { Request, Response, NextFunction } from "express";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return next(new UnauthorizedError());
  }
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const role = (req as any).user?.role;
  if (!role || role !== "admin") {
    return next(new ForbiddenError());
  }
  next();
}
