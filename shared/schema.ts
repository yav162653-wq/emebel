import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS (In-Memory Simulation Compatible) ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // In real app, this would be hashed. Here we simulate.
  name: text("name").notNull(),
  role: text("role").default("user").notNull(), // 'admin' | 'user'
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // In cents
  category: text("category").notNull(),
  image: text("image").notNull(),
  stock: integer("stock").notNull().default(0),
});

export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Foreign key simulation
  productId: integer("product_id").notNull(), // Foreign key simulation
  quantity: integer("quantity").notNull().default(1),
});

// === SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertCartItemSchema = createInsertSchema(cartItems).omit({ id: true });

// === EXPLICIT TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

// Request/Response Types
export type LoginRequest = { username: string; password: string }; // Simple mock auth
export type AuthResponse = User;

export type ProductListResponse = Product[];
export type ProductResponse = Product;

export type CartListResponse = (CartItem & { product: Product })[]; // Hydrated cart
