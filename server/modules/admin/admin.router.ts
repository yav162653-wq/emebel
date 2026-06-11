import { Router } from "express";
import { z } from "zod";
import { AdminService } from "./admin.service";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireAdmin } from "../../middleware/auth";

const router = Router();

router.use(requireAdmin);

// GET /api/admin/stats
router.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const stats = await AdminService.getStats();
    res.json(stats);
  })
);

// GET /api/admin/users
router.get(
  "/users",
  asyncHandler(async (_req, res) => {
    const users = await AdminService.getUsers();
    res.json(users);
  })
);

// PATCH /api/admin/products/:id
router.patch(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const id = z.coerce.number().int().positive().parse(req.params.id);
    const data = z
      .object({
        stock: z.number().int().min(0).optional(),
        price: z.number().int().positive().optional(),
      })
      .parse(req.body);
    const product = await AdminService.updateProduct(id, data);
    res.json(product);
  })
);

export default router;
