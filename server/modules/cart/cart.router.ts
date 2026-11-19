import { Router, type RequestHandler } from "express";
import { CartService } from "./cart.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { apiLimiter } from "../../middleware/rateLimiter";
import { cartAddSchema, cartUpdateSchema, idParamSchema } from "../../../lib/api-zod/src";

export type CartRouterService = Pick<
  typeof CartService,
  "getByUser" | "add" | "updateQuantity" | "remove" | "clear"
>;

export function createCartRouter(
  service: CartRouterService = CartService,
  authenticate: RequestHandler = requireAuth,
) {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/",
    apiLimiter,
    asyncHandler(async (req, res) => {
      const items = await service.getByUser(req.session.userId!);
      res.json(items);
    })
  );

  router.post(
    "/",
    apiLimiter,
    asyncHandler(async (req, res) => {
      const { productId, quantity } = cartAddSchema.parse(req.body);
      const item = await service.add(req.session.userId!, productId, quantity);
      res.json(item);
    })
  );

  router.patch(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = idParamSchema.parse(req.params.id);
      const { quantity } = cartUpdateSchema.parse(req.body);
      const item = await service.updateQuantity(req.session.userId!, id, quantity);
      if (item === null) return res.sendStatus(204);
      res.json(item);
    })
  );

  router.delete(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = idParamSchema.parse(req.params.id);
      await service.remove(req.session.userId!, id);
      res.sendStatus(204);
    })
  );

  router.delete(
    "/",
    asyncHandler(async (req, res) => {
      await service.clear(req.session.userId!);
      res.sendStatus(204);
    })
  );

  return router;
}

export default createCartRouter();
