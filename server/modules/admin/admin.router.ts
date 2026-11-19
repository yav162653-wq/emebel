import { Router, type RequestHandler } from "express";
import { AdminService } from "./admin.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAdmin } from "../../middleware/auth";
import { adminLimiter } from "../../middleware/rateLimiter";
import {
  adminProductUpdateSchema,
  adminOrderStatusUpdateSchema,
  adminListQuerySchema,
  adminOrderListQuerySchema,
  idParamSchema,
} from "../../../lib/api-zod/src";

export type AdminRouterService = typeof AdminService;

export function createAdminRouter(
  service: AdminRouterService = AdminService,
  authorize: RequestHandler = requireAdmin,
) {
  const router = Router();

  router.use(authorize, adminLimiter);

  router.get(
    "/stats",
    asyncHandler(async (_req, res) => {
      const stats = await service.getStats();
      res.json(stats);
    })
  );

  router.get(
    "/users",
    asyncHandler(async (_req, res) => {
      const query = adminListQuerySchema.parse(_req.query);
      const users = await service.getUsers(query);
      res.json(users);
    })
  );

  router.patch(
    "/products/:id",
    asyncHandler(async (req, res) => {
      const id = idParamSchema.parse(req.params.id);
      const data = adminProductUpdateSchema.parse(req.body);
      const product = await service.updateProduct(id, data);
      res.json(product);
    })
  );

  router.get(
    "/orders",
    asyncHandler(async (_req, res) => {
      const query = adminOrderListQuerySchema.parse(_req.query);
      const orders = await service.getAllOrders(query);
      res.json(orders);
    })
  );

  router.patch(
    "/orders/:id/status",
    asyncHandler(async (req, res) => {
      const id = idParamSchema.parse(req.params.id);
      const { status } = adminOrderStatusUpdateSchema.parse(req.body);
      const order = await service.updateOrderStatus(id, status);
      res.json(order);
    })
  );

  return router;
}

export default createAdminRouter();
