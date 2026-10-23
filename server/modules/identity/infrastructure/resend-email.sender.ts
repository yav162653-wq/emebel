import { ReplitConnectors } from "@replit/connectors-sdk";
import { DomainError } from "../../../../packages/kernel/src";
import type {
  EmailMessage,
  EmailSender,
} from "../../../../packages/platform/src";
import { logger } from "../../../config/logger";

const connectors = new ReplitConnectors();

type ResendProxy = Pick<ReplitConnectors, "proxy">;

export class ResendEmailSender implements EmailSender {
  constructor(
    private readonly from: string | undefined,
    private readonly connector: ResendProxy = connectors,
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
      response = await this.connector.proxy("resend", "/emails", {
        method: "POST",
        headers: {
          "Idempotency-Key": message.idempotencyKey,
        },
        body: {
          from: this.from,
          to: message.to,
          subject: message.subject,
          text: message.text,
          ...(message.html ? { html: message.html } : {}),
        },
      });
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
