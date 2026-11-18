import { env } from "../../../config/env";
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
};

type ResendProxy = {
  proxy(
    connector: string,
    path: string,
    options: ResendProxyOptions,
  ): Promise<Response>;
};

export class ResendEmailSender implements EmailSender {
  constructor(
    private readonly from: string | undefined,
    private readonly connector?: ResendProxy,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    if (!this.from) {
      throw new DomainError(
        "EMAIL_SENDER_NOT_CONFIGURED",
        "Set AUTH_EMAIL_FROM to a verified Resend sender address",
      );
    }

    let response: Response;
    try {
      const body = {
          from: this.from,
          to: message.to,
          subject: message.subject,
          text: message.text,
          ...(message.html ? { html: message.html } : {}),
      };

      if (this.connector) {
        response = await this.connector.proxy("resend", "/emails", {
          method: "POST",
          headers: {
            "Idempotency-Key": message.idempotencyKey,
          },
          body,
        });
      } else {
        if (!env.RESEND_API_KEY) {
          throw new DomainError(
            "EMAIL_SENDER_NOT_CONFIGURED",
            "Set RESEND_API_KEY to a valid Resend API key",
          );
        }
        response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
            "Idempotency-Key": message.idempotencyKey,
          },
          body: JSON.stringify(body),
        });
      }
    } catch (error) {
      logger.error(
        { errorType: error instanceof Error ? error.name : "unknown" },
        "Resend email request failed before receiving a response",
      );
      throw new DomainError(
        "EMAIL_DELIVERY_FAILED",
        "Email could not be sent. Please try again.",
      );
    }

    if (!response.ok) {
      // Do not log response bodies: providers may include recipient or content data.
      logger.error(
        { statusCode: response.status, requestId: response.headers.get("x-request-id") ?? undefined },
        "Resend rejected an authentication email",
      );
      throw new DomainError(
        "EMAIL_DELIVERY_FAILED",
        "Email could not be sent. Please try again.",
      );
    }
  }
}
