import { env } from "../../../config/env";
import { applicationMetrics } from "../../../config/metrics";
import { DomainError } from "../../../../packages/kernel/src";
import type {
  EmailMessage,
  EmailSender,
} from "../../../../packages/platform/src";
import { logger } from "../../../config/logger";

type ResendProxyOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
};

type ResendProxy = {
  proxy(
    connector: string,
    path: string,
    options: ResendProxyOptions,
  ): Promise<Response>;
};

type ResendEmailSenderOptions = {
  timeoutMs?: number;
  maxAttempts?: number;
  retryBaseDelayMs?: number;
  sleep?: (milliseconds: number) => Promise<void>;
  apiKey?: string;
  fetcher?: typeof fetch;
};

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_BASE_DELAY_MS = 250;

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export class ResendEmailSender implements EmailSender {
  private readonly timeoutMs: number;
  private readonly maxAttempts: number;
  private readonly retryBaseDelayMs: number;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly apiKey: string | undefined;
  private readonly fetcher: typeof fetch;

  constructor(
    private readonly from: string | undefined,
    private readonly connector?: ResendProxy,
    options: ResendEmailSenderOptions = {},
  ) {
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
    this.retryBaseDelayMs = options.retryBaseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS;
    this.sleep = options.sleep ?? sleep;
    this.apiKey = options.apiKey ?? env.RESEND_API_KEY;
    this.fetcher = options.fetcher ?? fetch;
    if (!Number.isSafeInteger(this.maxAttempts) || this.maxAttempts < 1) {
      throw new RangeError("Resend maxAttempts must be a positive safe integer");
    }
    if (!Number.isFinite(this.timeoutMs) || this.timeoutMs <= 0) {
      throw new RangeError("Resend timeoutMs must be a positive number");
    }
    if (!Number.isFinite(this.retryBaseDelayMs) || this.retryBaseDelayMs < 0) {
      throw new RangeError("Resend retryBaseDelayMs must be a non-negative number");
    }
  }

  async send(message: EmailMessage): Promise<void> {
    if (!this.from) {
      applicationMetrics.recordProviderFailure("resend", "EMAIL_SENDER_NOT_CONFIGURED");
      throw new DomainError(
        "EMAIL_SENDER_NOT_CONFIGURED",
        "Set AUTH_EMAIL_FROM to a verified Resend sender address",
      );
    }

    const apiKey = this.connector ? undefined : this.apiKey;
    if (!this.connector && !apiKey) {
      applicationMetrics.recordProviderFailure("resend", "EMAIL_SENDER_NOT_CONFIGURED");
      throw new DomainError(
        "EMAIL_SENDER_NOT_CONFIGURED",
        "Set RESEND_API_KEY to a valid Resend API key",
      );
    }

    const body = {
      from: this.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    };

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      let response: Response;
      try {
        response = await this.request(body, message.idempotencyKey, apiKey);
      } catch (error) {
        if (attempt === this.maxAttempts) {
          logger.error(
            { attempts: attempt, errorType: errorType(error) },
            "Resend email request failed",
          );
          throw this.deliveryError();
        }
        await this.sleep(this.retryDelay(attempt));
        continue;
      }

      if (response.ok) return;

      if (!isRetryableStatus(response.status) || attempt === this.maxAttempts) {
        logger.error(
          {
            attempts: attempt,
            statusCode: response.status,
            requestId: response.headers.get("x-request-id") ?? undefined,
          },
          "Resend rejected an authentication email",
        );
        throw this.deliveryError();
      }

      await this.sleep(this.retryDelay(attempt));
    }

    throw this.deliveryError();
  }

  private async request(
    body: Record<string, string>,
    idempotencyKey: string,
    apiKey: string | undefined,
  ): Promise<Response> {
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const request = this.connector
      ? this.connector.proxy("resend", "/emails", {
          method: "POST",
          headers: { "Idempotency-Key": idempotencyKey },
          body,
          signal: controller.signal,
        })
      : this.fetcher("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": idempotencyKey,
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

    try {
      return await Promise.race([
        request,
        new Promise<never>((_resolve, reject) => {
          timeout = setTimeout(() => {
            controller.abort();
            const error = new Error("Resend request timed out");
            error.name = "TimeoutError";
            reject(error);
          }, this.timeoutMs);
        }),
      ]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }

  private retryDelay(attempt: number): number {
    return this.retryBaseDelayMs * 2 ** (attempt - 1);
  }

  private deliveryError(): DomainError {
    applicationMetrics.recordProviderFailure("resend", "EMAIL_DELIVERY_FAILED");
    return new DomainError(
      "EMAIL_DELIVERY_FAILED",
      "Email could not be sent. Please try again.",
    );
  }
}

function errorType(error: unknown): string {
  return error instanceof Error ? error.name : "unknown";
}
