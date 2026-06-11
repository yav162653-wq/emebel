import { Router } from "express";
import { z } from "zod";
import { OrdersService } from "./orders.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAuth } from "../../middleware/auth";

const router = Router();

router.use(requireAuth);

const createOrderSchema = z.object({
  total: z.number().int().positive(),
  address: z.string().min(1),
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      name: z.string(),
      price: z.number().int().positive(),
      quantity: z.number().int().positive(),
      image: z.string(),
    })
  ).min(1),
});

// POST /api/orders — place order from cart
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createOrderSchema.parse(req.body);
    const order = await OrdersService.create(req.session.userId!, input);
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
