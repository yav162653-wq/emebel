import { Router, type RequestHandler } from "express";
import { WishlistService } from "./wishlist.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { idParamSchema, wishlistSyncSchema } from "../../../lib/api-zod/src";

export type WishlistRouterService = Pick<
  typeof WishlistService,
  "getIds" | "add" | "remove" | "clear" | "sync"
>;

export function createWishlistRouter(
  service: WishlistRouterService = WishlistService,
  authenticate: RequestHandler = requireAuth,
) {
  const router = Router();

  router.use(authenticate);

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const ids = await service.getIds(req.session.userId!);
      res.json(ids);
    })
  );

  router.post(
    "/sync",
    asyncHandler(async (req, res) => {
      const { productIds } = wishlistSyncSchema.parse(req.body);
      await service.sync(req.session.userId!, productIds);
      const ids = await service.getIds(req.session.userId!);
      res.json(ids);
    })
  );

  router.post(
    "/:productId",
    asyncHandler(async (req, res) => {
      const productId = idParamSchema.parse(req.params.productId);
      await service.add(req.session.userId!, productId);
      res.sendStatus(204);
    })
  );

  router.delete(
    "/:productId",
    asyncHandler(async (req, res) => {
      const productId = idParamSchema.parse(req.params.productId);
      await service.remove(req.session.userId!, productId);
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

export default createWishlistRouter();
