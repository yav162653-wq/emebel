import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";

const SessionStore = MemoryStore(session);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup Session for "Auth Provider" mock
  app.use(session({
    cookie: { maxAge: 86400000 },
    store: new SessionStore({ checkPeriod: 86400000 }),
    resave: false,
    saveUninitialized: false,
    secret: 'nasa-secret-key-123',
  }));

  // === AUTH ROUTES ===
  app.post(api.auth.login.path, async (req, res) => {
    const { username, password } = api.auth.login.input.parse(req.body);
    const user = await storage.getUserByUsername(username);
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // Set session
    (req.session as any).userId = user.id;
    res.json(user);
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy(() => {
      res.sendStatus(200);
    });
  });

  app.get(api.auth.me.path, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
       return res.status(401).json({ message: "User not found" });
    }
    res.json(user);
  });

  app.post(api.auth.register.path, async (req, res) => {
    const input = api.auth.register.input.parse(req.body);
    const existing = await storage.getUserByUsername(input.username);
    if (existing) {
      return res.status(400).json({ message: "Username already exists" });
    }
    const user = await storage.createUser(input);
    (req.session as any).userId = user.id;
    res.status(201).json(user);
  });

  // === PRODUCT ROUTES ===
  app.get(api.products.list.path, async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get(api.products.get.path, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  // === CART ROUTES ===
  app.get(api.cart.list.path, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const items = await storage.getCartItems(userId);
    res.json(items);
  });

  app.post(api.cart.add.path, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    
    const input = api.cart.add.input.parse(req.body);
    const item = await storage.addToCart(userId, input as any);
    res.json(item);
  });

  app.delete(api.cart.remove.path, async (req, res) => {
    const userId = (req.session as any).userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    await storage.removeFromCart(userId, Number(req.params.id));
    res.sendStatus(204);
  });

  return httpServer;
}
