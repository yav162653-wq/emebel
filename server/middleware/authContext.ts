import type { Request, Response, NextFunction } from "express";

export function authContextMiddleware(req: Request, res: Response, next: NextFunction) {
  res.locals["userId"] = req.session?.userId ?? null;
  next();
}
