import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";
import { logger } from "../config/logger";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId: string = res.locals["requestId"] ?? "unknown";
  const isProd = process.env.NODE_ENV === "production";

  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      requestId,
      errors: err.issues.map((e) => ({
        field: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  // Known operational errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({
        requestId,
        code: err.code,
        path: req.path,
        method: req.method,
        ...(isProd ? {} : { stack: err.stack }),
        msg: err.message,
      });
    }
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      requestId,
    });
    return;
  }

  // Unknown / programming errors
  logger.error({
    requestId,
    path: req.path,
    method: req.method,
    ...(isProd ? {} : { stack: err.stack }),
    msg: err.message ?? "Unhandled error",
  });

  res.status(500).json({
    error: "Internal Server Error",
    code: "INTERNAL_ERROR",
    requestId,
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  const requestId: string = res.locals["requestId"] ?? "unknown";
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
    code: "NOT_FOUND",
    requestId,
  });
}
