import { z } from "zod";
import {
  cartAddSchema,
  registerSchema,
  reviewInputSchema,
} from "../lib/api-zod/src";
import type {
  AdminOrderResponse,
  CartItemResponse,
  CartListResponse as ApiCartListResponse,
  LoginRequest as ApiLoginRequest,
  OrderListResponse as ApiOrderListResponse,
  ProductResponse as ApiProductResponse,
  PublicUser,
  ReviewResponse,
  ReviewSummaryResponse,
} from "../lib/api-zod/src";

// ── User ──────────────────────────────────────────────────────────────────────
export const insertUserSchema = registerSchema;

export type InsertUser = z.input<typeof insertUserSchema>;

export type User = PublicUser;

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
export type Product = ApiProductResponse;

// ── CartItem ──────────────────────────────────────────────────────────────────
export const insertCartItemSchema = cartAddSchema;

export type InsertCartItem = z.input<typeof insertCartItemSchema>;
export type CartItem = CartItemResponse;

// ── Order ─────────────────────────────────────────────────────────────────────
export type Order = ApiOrderListResponse[number];
export type OrderItem = Order["items"][number];

// Admin-facing order with user info
export type AdminOrder = AdminOrderResponse;

// ── Review ────────────────────────────────────────────────────────────────────
export const insertReviewSchema = reviewInputSchema;

export type InsertReview = z.input<typeof insertReviewSchema>;

export type Review = ReviewResponse;

export type ReviewSummary = ReviewSummaryResponse;

// ── Request / Response aliases ────────────────────────────────────────────────
export type LoginRequest = ApiLoginRequest;
export type AuthResponse = PublicUser;
export type ProductListResponse = Product[];
export type ProductResponse = Product;
export type CartListResponse = ApiCartListResponse;
export type OrderListResponse = ApiOrderListResponse;
export type AdminOrderListResponse = AdminOrder[];
export type ReviewListResponse = Review[];
