import type { Request, Response, NextFunction } from "express";
import { db } from "../db/client";
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

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.session?.userId) return next(new UnauthorizedError());
  const user = await db.user.findUnique({
    where: { id: req.session.userId },
    select: { role: true },
  });
  if (!user || user.role !== "admin") return next(new ForbiddenError());
  next();
}
