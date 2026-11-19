import { type OrderStatus } from "../../../lib/api-zod/src";
import { logger } from "../../config/logger";

export type AuditEvent =
  | {
      event: "admin.product.updated";
      actorId: number;
      requestId?: string;
      productId: number;
      changedFields: string[];
    }
  | {
      event: "admin.order.status.updated";
      actorId: number;
      requestId?: string;
      orderId: number;
      status: OrderStatus;
    }
  | {
      event: "shopify.catalog.sync.started";
      operationId: string;
    }
  | {
      event: "shopify.catalog.sync.succeeded";
      operationId: string;
      productCount: number;
    }
  | {
      event: "shopify.catalog.sync.failed";
      operationId: string;
      productCount?: number;
      errorCode: string;
    };

const auditLogger = logger.child({ subsystem: "audit" });

export function recordAuditEvent(event: AuditEvent): void {
  auditLogger.info({ audit: true, ...event }, "Audit event");
}
