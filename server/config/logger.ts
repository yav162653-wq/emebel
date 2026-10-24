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
      "res.headers['set-cookie']",
      "res.headers.location",
      "req.query.code",
      "req.query.state",
      "req.query.id_token",
      "req.query.access_token",
      "body.password",
      "body.confirmPassword",
      "body.cardNumber",
      "body.cvv",
      "password",
      "token",
      "accessToken",
      "refreshToken",
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

export function createHttpRequestLogger(requestLogger = logger) {
  return pinoHttp({
    logger: requestLogger,
    serializers: {
      req(req) {
        const requestUrl = typeof req.url === "string" ? req.url : "/";
        const path = requestUrl.split("?", 1)[0];
        const isExternalAuthCallback =
          /^\/api\/auth\/external\/(google|github|telegram)\/callback$/.test(path);
        return {
          id: req.id,
          method: req.method,
          url: isExternalAuthCallback ? path : requestUrl,
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
