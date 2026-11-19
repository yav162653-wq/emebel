import { Router, type RequestHandler } from "express";
import { OrdersService } from "./orders.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { orderLimiter } from "../../middleware/rateLimiter";
import { ValidationError } from "../../utils/errors";
import { db } from "../../db/client";
import {
  createOrderHeadersSchema,
  createOrderSchema,
  idParamSchema,
} from "../../../lib/api-zod/src";
import { createOrderRequestHash, type OrderWithItems } from "./orders.service";

export type OrderProduct = {
  id: number;
  name: string;
  price: number;
  image: string;
  stock: number;
};

export type OrdersRouterService = Pick<
  typeof OrdersService,
  "create" | "findByIdempotencyKey" | "getByUser" | "getById"
>;

export interface OrdersRouterDependencies {
  service?: OrdersRouterService;
  findProducts?: (productIds: number[]) => Promise<OrderProduct[]>;
  authenticate?: RequestHandler;
}

function toOrderResponse(order: OrderWithItems) {
  return {
    id: order.id,
    userId: order.userId,
    total: order.total,
    status: order.status,
    address: order.address,
    createdAt: order.createdAt,
    items: order.items,
  };
}

export function createOrdersRouter({
  service = OrdersService,
  findProducts = (productIds) =>
    db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, image: true, stock: true },
    }),
  authenticate = requireAuth,
}: OrdersRouterDependencies = {}) {
  const router = Router();
  router.use(authenticate);

  router.post(
    "/",
    orderLimiter,
    asyncHandler(async (req, res) => {
      const { "idempotency-key": idempotencyKey } = createOrderHeadersSchema.parse({
        "idempotency-key": req.get("Idempotency-Key"),
      });
      const { address, items } = createOrderSchema.parse(req.body);
      const requestHash = createOrderRequestHash({ address, items });
      const userId = req.session.userId!;

      const existingOrder = await service.findByIdempotencyKey(userId, idempotencyKey, requestHash);
      if (existingOrder) {
        res.status(201).json(toOrderResponse(existingOrder));
        return;
      }

      const productIds = Array.from(new Set(items.map((item) => item.productId)));
      const products = await findProducts(productIds);
      if (products.length !== productIds.length) {
        throw new ValidationError("One or more products not found");
      }

      const productsById = new Map(products.map((product) => [product.id, product]));
      const verifiedItems = items.map((item) => {
        const product = productsById.get(item.productId);
        if (!product) {
          throw new ValidationError("One or more products not found");
        }
        if (product.stock < item.quantity) {
          throw new ValidationError(`Insufficient stock for "${product.name}"`);
        }
        return {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
          image: product.image,
        };
      });

      const total = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      const order = await service.create(
        userId,
        { total, address, items: verifiedItems },
        idempotencyKey,
        requestHash,
      );
      res.status(201).json(toOrderResponse(order));
    })
  );

  router.get(
    "/my",
    asyncHandler(async (req, res) => {
      const orders = await service.getByUser(req.session.userId!);
      res.json(orders);
    })
  );

  router.get(
    "/:id",
    asyncHandler(async (req, res) => {
      const id = idParamSchema.parse(req.params.id);
      const order = await service.getById(req.session.userId!, id);
      res.json(order);
    })
  );

  return router;
}

export default createOrdersRouter();
