import winston from "winston";
import morgan from "morgan";

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? `\n  ${JSON.stringify(meta, null, 2)}`
      : "";
    return `${timestamp} [${level}] ${message}${stack ? `\n${stack}` : ""}${metaStr}`;
  })
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: process.env.NODE_ENV === "production" ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === "production"
      ? [
          new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
          }),
          new winston.transports.File({ filename: "logs/combined.log" }),
        ]
      : []),
  ],
  exitOnError: false,
});

// HTTP request logger via Morgan → Winston
const morganStream = {
  write: (message: string) => logger.http(message.trim()),
};

export const httpLogger = morgan(
  process.env.NODE_ENV === "production"
    ? "combined"
    : ":method :url :status :res[content-length]b :response-time ms",
  {
    stream: morganStream,
    skip: (req) => req.path === "/health" || req.path === "/api/health",
  }
);
