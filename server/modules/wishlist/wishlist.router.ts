import { Router, type RequestHandler } from "express";
import { WishlistService } from "./wishlist.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { getAuthenticatedUserId, requireAuth } from "../../middleware/auth";
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
      const ids = await service.getIds(getAuthenticatedUserId(req));
      res.json(ids);
    })
  );

  router.post(
    "/sync",
    asyncHandler(async (req, res) => {
      const { productIds } = wishlistSyncSchema.parse(req.body);
      const userId = getAuthenticatedUserId(req);
      await service.sync(userId, productIds);
      const ids = await service.getIds(userId);
      res.json(ids);
    })
  );

  router.post(
    "/:productId",
    asyncHandler(async (req, res) => {
      const productId = idParamSchema.parse(req.params.productId);
      await service.add(getAuthenticatedUserId(req), productId);
      res.sendStatus(204);
    })
  );

  router.delete(
    "/:productId",
    asyncHandler(async (req, res) => {
      const productId = idParamSchema.parse(req.params.productId);
      await service.remove(getAuthenticatedUserId(req), productId);
      res.sendStatus(204);
    })
  );

  router.delete(
    "/",
    asyncHandler(async (req, res) => {
      await service.clear(getAuthenticatedUserId(req));
      res.sendStatus(204);
    })
  );

  return router;
}

export default createWishlistRouter();
