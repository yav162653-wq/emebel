import pino from "pino";
import pinoHttp from "pino-http";
import type { Response as ExpressResponse } from "express";

const isDev = process.env.NODE_ENV !== "production";

const loggerOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers['set-cookie']",
      "req.headers.x-csrf-token",
      "req.headers.x-api-key",
      "req.headers.x-auth-token",
      "res.headers['set-cookie']",
      "res.headers.location",
      "req.query.code",
      "req.query.state",
      "req.query.id_token",
      "req.query.access_token",
      "req.query.refresh_token",
      "req.query.token",
      "req.query.client_secret",
      "body.password",
      "body.confirmPassword",
      "body.cardNumber",
      "body.cvv",
      "body.secret",
      "body.clientSecret",
      "body.apiKey",
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "secret",
      "clientSecret",
      "apiKey",
      "*.password",
      "*.secret",
      "*.clientSecret",
      "*.apiKey",
      "*.accessToken",
      "*.refreshToken",
    ],
    censor: "[REDACTED]",
  },
};

export function createLogger(destination?: pino.DestinationStream) {
  return pino({
    ...loggerOptions,
    ...(isDev && !destination
      ? {
          transport: {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss",
              ignore: "pid,hostname",
            },
          },
        }
      : {}),
  }, destination);
}

export const logger = createLogger();

const sensitiveQueryParams = new Set([
  "code",
  "state",
  "id_token",
  "access_token",
  "refresh_token",
  "token",
  "secret",
  "client_secret",
  "clientsecret",
  "password",
  "api_key",
  "apikey",
  "authorization",
  "credential",
  "assertion",
  "signature",
  "hmac",
  "oauth_token",
]);

export function sanitizeRequestUrl(requestUrl: string): string {
  try {
    const url = new URL(requestUrl, "http://localhost");
    for (const key of Array.from(new Set(url.searchParams.keys()))) {
      if (sensitiveQueryParams.has(key.toLowerCase())) {
        url.searchParams.set(key, "[REDACTED]");
      }
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return requestUrl.split("?", 1)[0];
  }
}

export function createHttpRequestLogger(requestLogger = logger) {
  return pinoHttp({
    logger: requestLogger,
    serializers: {
      req(req) {
        const requestUrl = typeof req.url === "string" ? req.url : "/";
        const path = sanitizeRequestUrl(requestUrl).split("?", 1)[0];
        const isExternalAuthCallback =
          /^\/api\/auth\/external\/(google|github|telegram)\/callback$/.test(path);
        return {
          id: req.id,
          method: req.method,
          url: isExternalAuthCallback ? path : sanitizeRequestUrl(requestUrl),
          ...(isExternalAuthCallback ? { query: "[REDACTED]" } : {}),
          headers: {
            host: req.headers?.host,
            "user-agent": req.headers?.["user-agent"],
            "content-type": req.headers?.["content-type"],
          },
          remoteAddress: req.socket?.remoteAddress,
          remotePort: req.socket?.remotePort,
        };
      },
    },
    customProps: (_req, res) => {
      const locals = (res as ExpressResponse).locals;
      return {
        requestId: locals["requestId"],
        userId: locals["userId"] ?? undefined,
      };
    },
    autoLogging: {
      ignore: (req) => req.url === "/api/health" || req.url === "/health",
    },
    customLogLevel: (_req, res, err) => {
      if (err || res.statusCode >= 500) return "error";
      if (res.statusCode >= 400) return "warn";
      return "info";
    },
  });
}
