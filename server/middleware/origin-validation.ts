import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../utils/errors";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

function parseOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (
      !["http:", "https:"].includes(url.protocol)
      || url.username
      || url.password
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function requestOrigin(req: Request): string | null {
  const host = req.get("host");
  return host ? parseOrigin(`${req.protocol}://${host}`) : null;
}

function sourceOrigin(req: Request): string | null {
  const origin = req.get("origin");
  if (origin !== undefined) {
    const parsed = parseOrigin(origin);
    if (!parsed) return null;
    const url = new URL(origin);
    return url.pathname === "/" && !url.search && !url.hash ? parsed : null;
  }

  const referer = req.get("referer");
  return referer ? parseOrigin(referer) : null;
}

export function originValidationMiddleware(allowedOrigins: ReadonlySet<string>) {
  const configuredOrigins = new Set<string>();
  allowedOrigins.forEach((origin) => {
    const parsed = parseOrigin(origin);
    if (!parsed) throw new Error("Invalid configured origin");
    configuredOrigins.add(parsed);
  });

  return (req: Request, _res: Response, next: NextFunction) => {
    if (safeMethods.has(req.method.toUpperCase())) return next();

    const origin = sourceOrigin(req);
    if (!origin) {
      return next(new ForbiddenError("Origin or Referer header required"));
    }

    if (origin !== requestOrigin(req) && !configuredOrigins.has(origin)) {
      return next(new ForbiddenError("Origin not allowed"));
    }

    next();
  };
}
