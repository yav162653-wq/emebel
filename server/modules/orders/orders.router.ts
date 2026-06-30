import { Router } from "express";
import { z } from "zod";
import { OrdersService } from "./orders.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";
import { orderLimiter } from "../../middleware/rateLimiter";
import { ValidationError } from "../../utils/errors";
import { db } from "../../db/client";

const router = Router();

router.use(requireAuth);

const createOrderSchema = z.object({
  address: z.string().min(1),
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      quantity: z.number().int().positive().max(50),
    })
  ).min(1),
});

// POST /api/orders — place order; prices are fetched from DB (never trusted from client)
router.post(
  "/",
  orderLimiter,
  asyncHandler(async (req, res) => {
    const { address, items } = createOrderSchema.parse(req.body);

    // Fetch real prices from DB
    const productIds = items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, price: true, image: true, stock: true },
    });

    if (products.length !== productIds.length) {
      throw new ValidationError("One or more products not found");
    }

    // Verify stock and build verified items
    const verifiedItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
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

    const total = verifiedItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    const order = await OrdersService.create(req.session.userId!, {
      total,
      address,
      items: verifiedItems,
    });
    res.status(201).json(order);
  })
);

// GET /api/orders/my — user's order history
router.get(
  "/my",
  asyncHandler(async (req, res) => {
    const orders = await OrdersService.getByUser(req.session.userId!);
    res.json(orders);
  })
);

// GET /api/orders/:id — single order
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const order = await OrdersService.getById(req.session.userId!, id);
    res.json(order);
  })
);

export default router;
