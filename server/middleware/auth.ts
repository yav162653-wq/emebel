import type { Request, Response, NextFunction } from "express";
import { db } from "../db/client";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";
import { userRoleSchema } from "../../lib/api-zod/src";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    authenticatedAt?: number;
    externalAuthStates?: Array<{ provider: string; stateHash: string }>;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return next(new UnauthorizedError());
  }
  next();
}

export function getAuthenticatedUserId(req: Request): number {
  const userId = req.session?.userId;
  if (typeof userId !== "number" || !Number.isSafeInteger(userId) || userId <= 0) {
    throw new UnauthorizedError();
  }
  return userId;
}

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.session?.userId) return next(new UnauthorizedError());
  const user = await db.user.findUnique({
    where: { id: req.session.userId },
    select: { role: true },
  });
  if (!user || userRoleSchema.safeParse(user.role).data !== userRoleSchema.enum.admin) {
    return next(new ForbiddenError());
  }
  next();
}
