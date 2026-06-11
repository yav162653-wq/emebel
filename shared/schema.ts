import { z } from "zod";

// ── User ──────────────────────────────────────────────────────────────────────
export const insertUserSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required").max(100),
  role: z.enum(["user", "admin"]).default("user"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// API-safe User — no password field returned from the server
export type User = {
  id: number;
  username: string;
  name: string;
  role: string;
};

// ── Product ───────────────────────────────────────────────────────────────────
export const insertProductSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  price: z.number().int().positive(),
  category: z.string().min(1),
  image: z.string(),
  stock: z.number().int().default(0),
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

// ── Request / Response aliases ────────────────────────────────────────────────
export type LoginRequest = { username: string; password: string };
export type AuthResponse = User;
export type ProductListResponse = Product[];
export type ProductResponse = Product;
export type CartListResponse = (CartItem & { product: Product })[];
