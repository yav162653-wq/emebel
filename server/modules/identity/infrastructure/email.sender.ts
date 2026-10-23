import { DomainError } from "../../../../packages/kernel/src";
import type {
  EmailMessage,
  EmailSender,
} from "../../../../packages/platform/src";
import { logger } from "../../../config/logger";

/**
 * Development transport intentionally logs the link only outside production.
 * A real SMTP/provider adapter can implement EmailSender without touching the
 * Identity domain or application service.
 */
export class ConfigurableEmailSender implements EmailSender {
  async send(message: EmailMessage): Promise<void> {
    if (process.env.NODE_ENV !== "production") {
      logger.info(
        { to: message.to, kind: message.kind, link: message.text },
        "Identity email link generated",
      );
      return;
    }

    throw new DomainError(
      "EMAIL_DELIVERY_NOT_CONFIGURED",
      "Email delivery is not configured for this environment",
    );
  }
}