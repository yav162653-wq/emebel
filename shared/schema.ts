import { z } from "zod";

// ── User ──────────────────────────────────────────────────────────────────────
export const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required").max(100),
  role: z.enum(["user", "admin"]).default("user"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// API-safe User — no password field returned from the server
export type User = {
  id: number;
  username: string | null;
  name: string;
  role: string;
  email?: string | null;
  emailVerified?: boolean;
};

// ── Product ───────────────────────────────────────────────────────────────────
export const insertProductSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  price: z.number().int().positive(),
  category: z.string().min(1),
  image: z.string(),
  stock: z.number().int().default(0),
  material: z.string().default("Premium Grade"),
  warranty: z.string().default("Lifetime"),
  origin: z.string().default("Studio Crafted"),
  assembly: z.string().default("White Glove"),
  colors: z.array(z.string()).default([]),
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = InsertProduct & { id: number };

// ── CartItem ──────────────────────────────────────────────────────────────────
export const insertCartItemSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
});

export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type CartItem = {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
};

// ── Order ─────────────────────────────────────────────────────────────────────
export type OrderItem = {
  id: number;
  orderId: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

export type Order = {
  id: number;
  userId: number;
  total: number;
  status: string;
  address: string;
  createdAt: string;
  items: OrderItem[];
};

// Admin-facing order with user info
export type AdminOrder = Order & {
  user: { id: number; username: string; name: string };
};

// ── Review ────────────────────────────────────────────────────────────────────
export const insertReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().max(1000).optional(),
});

export type InsertReview = z.infer<typeof insertReviewSchema>;

export type Review = {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  body: string | null;
  createdAt: string;
  user: { id: number; name: string; username: string };
};

export type ReviewSummary = {
  count: number;
  average: number;
};

// ── Request / Response aliases ────────────────────────────────────────────────
export type LoginRequest = { username: string; password: string };
export type AuthResponse = User;
export type ProductListResponse = Product[];
export type ProductResponse = Product;
export type CartListResponse = (CartItem & { product: Product })[];
export type OrderListResponse = Order[];
export type AdminOrderListResponse = AdminOrder[];
export type ReviewListResponse = Review[];
