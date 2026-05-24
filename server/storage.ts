import { users, products, cartItems, type User, type InsertUser, type Product, type InsertProduct, type CartItem, type InsertCartItem } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  getCartItems(userId: number): Promise<(CartItem & { product: Product })[]>;
  addToCart(userId: number, item: InsertCartItem): Promise<CartItem>;
  removeFromCart(userId: number, id: number): Promise<void>;
  sessionStore: Map<string, number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private cartItems: Map<number, CartItem>;
  public sessionStore: Map<string, number>;

  private userIdCounter = 1;
  private productIdCounter = 1;
  private cartIdCounter = 1;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.cartItems = new Map();
    this.sessionStore = new Map();
    this.seedData();
  }

  private seedData() {
    this.createUser({ username: "nasa_admin", password: "password", name: "NASA Admin", role: "admin" });
    this.createUser({ username: "user", password: "password", name: "Test User", role: "user" });

    // ── SEATING ──
    this.createProduct({
      name: "Cosimo Lounge Chair",
      description: "Hand-stitched full-grain leather with a solid walnut frame. Designed for the deliberate sitter.",
      price: 189000,
      category: "Seating",
      image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800",
      stock: 8,
    });
    this.createProduct({
      name: "Slate Accent Chair",
      description: "Bouclé fabric on a powder-coated steel base. A sculptural piece that works in any room.",
      price: 97500,
      category: "Seating",
      image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=800",
      stock: 12,
    });
    this.createProduct({
      name: "Arc Dining Chair",
      description: "Bent plywood seat with matte black steel legs. Stackable, elegant, enduring.",
      price: 42000,
      category: "Seating",
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800",
      stock: 30,
    });
    this.createProduct({
      name: "Rattan Barrel Chair",
      description: "Handwoven natural rattan over a powder-coated iron frame. Brings warmth to any corner.",
      price: 64500,
      category: "Seating",
      image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&q=80&w=800",
      stock: 14,
    });

    // ── TABLES ──
    this.createProduct({
      name: "Orbital Coffee Table",
      description: "Tempered glass top suspended on a sculptural matte steel frame. Floats above any floor.",
      price: 112000,
      category: "Tables",
      image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=800",
      stock: 5,
    });
    this.createProduct({
      name: "Slab Dining Table",
      description: "Live-edge American walnut slab on raw steel trestles. Each table is one of a kind.",
      price: 345000,
      category: "Tables",
      image: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&q=80&w=800",
      stock: 3,
    });
    this.createProduct({
      name: "Grid Side Table",
      description: "Powder-coated aluminum grid structure with a honed marble top. Minimal and refined.",
      price: 58000,
      category: "Tables",
      image: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&q=80&w=800",
      stock: 15,
    });
    this.createProduct({
      name: "Travertine Console",
      description: "Solid Italian travertine top on polished brass hairpin legs. A statement entry piece.",
      price: 228000,
      category: "Tables",
      image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800",
      stock: 4,
    });

    // ── LIGHTING ──
    this.createProduct({
      name: "Nebula Pendant",
      description: "Hand-blown opal glass with an antique brass canopy. Casts a warm, diffused glow.",
      price: 68000,
      category: "Lighting",
      image: "https://images.unsplash.com/photo-1507473883581-20963378120f?auto=format&fit=crop&q=80&w=800",
      stock: 20,
    });
    this.createProduct({
      name: "Arch Floor Lamp",
      description: "A sweeping satin brass arc reaching 1.9m. Brings gallery-level light to living spaces.",
      price: 52000,
      category: "Lighting",
      image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80&w=800",
      stock: 10,
    });
    this.createProduct({
      name: "Cone Table Lamp",
      description: "Linen shade over a turned oak base. Warm and architectural. Pairs with any palette.",
      price: 28500,
      category: "Lighting",
      image: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&q=80&w=800",
      stock: 25,
    });
    this.createProduct({
      name: "Dome Sconce",
      description: "Brushed nickel wall-mounted dome with a frosted glass diffuser. Ideal for layered lighting.",
      price: 34000,
      category: "Lighting",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800",
      stock: 18,
    });

    // ── STORAGE ──
    this.createProduct({
      name: "Meridian Bookshelf",
      description: "Open steel shelving with solid oak planks. Scales from single to full wall configuration.",
      price: 138000,
      category: "Storage",
      image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=800",
      stock: 7,
    });
    this.createProduct({
      name: "Form Cabinet",
      description: "Smoked oak veneer with push-to-open doors. Invisible hardware, pure form.",
      price: 224000,
      category: "Storage",
      image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=800",
      stock: 4,
    });
    this.createProduct({
      name: "Slot Wardrobe",
      description: "Full-height wardrobe in matte white with integrated handles. Seamless, minimal, room-defining.",
      price: 386000,
      category: "Storage",
      image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&q=80&w=800",
      stock: 3,
    });

    // ── BEDROOM ──
    this.createProduct({
      name: "Monolith Bed Frame",
      description: "Solid white oak with a low-slung silhouette. Upholstered headboard in dove grey linen.",
      price: 285000,
      category: "Bedroom",
      image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=800",
      stock: 6,
    });
    this.createProduct({
      name: "Drift Nightstand",
      description: "Wall-mounted white oak with a single push-to-open drawer. Designed to disappear.",
      price: 44000,
      category: "Bedroom",
      image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=800",
      stock: 18,
    });
    this.createProduct({
      name: "Cloud Ottoman",
      description: "Deep-filled down-alternative cushioning wrapped in performance linen. Sinks perfectly every time.",
      price: 76000,
      category: "Bedroom",
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800",
      stock: 9,
    });

    // ── OUTDOOR ──
    this.createProduct({
      name: "Teak Sun Lounger",
      description: "Grade A teak with a seven-position recline mechanism. Built for decades of outdoor use.",
      price: 142000,
      category: "Outdoor",
      image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=800",
      stock: 6,
    });
    this.createProduct({
      name: "Rope Weave Sofa",
      description: "UV-resistant olefin rope over a powder-coated aluminum frame. Outdoor luxury redefined.",
      price: 234000,
      category: "Outdoor",
      image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=800",
      stock: 4,
    });
    this.createProduct({
      name: "Stone Planter Trio",
      description: "Cast stone planters in three graduated sizes. Frost-resistant and beautifully textured.",
      price: 38500,
      category: "Outdoor",
      image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=800",
      stock: 20,
    });

    // ── DECOR ──
    this.createProduct({
      name: "Arch Mirror",
      description: "Full-length arched mirror with a thin solid brass frame. Reflects light, adds volume.",
      price: 89000,
      category: "Decor",
      image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800",
      stock: 11,
    });
    this.createProduct({
      name: "Wabi-Sabi Vase Set",
      description: "Hand-thrown stoneware in matte sand glaze. Each piece subtly unique, intentionally imperfect.",
      price: 22000,
      category: "Decor",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&q=80&w=800",
      stock: 30,
    });
    this.createProduct({
      name: "Linen Throw Blanket",
      description: "100% Belgian linen with a natural fringe border. Drape, wrap, or display.",
      price: 18500,
      category: "Decor",
      image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800",
      stock: 40,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id, role: insertUser.role || "user" };
    this.users.set(id, user);
    return user;
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = this.productIdCounter++;
    const product: Product = { ...insertProduct, id, stock: insertProduct.stock || 0 };
    this.products.set(id, product);
    return product;
  }

  async getCartItems(userId: number): Promise<(CartItem & { product: Product })[]> {
    return Array.from(this.cartItems.values())
      .filter(item => item.userId === userId)
      .map(item => {
        const product = this.products.get(item.productId);
        if (!product) throw new Error("Product not found");
        return { ...item, product };
      });
  }

  async addToCart(userId: number, item: InsertCartItem): Promise<CartItem> {
    const id = this.cartIdCounter++;
    const cartItem: CartItem = { ...item, id, userId, quantity: item.quantity || 1 };
    this.cartItems.set(id, cartItem);
    return cartItem;
  }

  async removeFromCart(userId: number, id: number): Promise<void> {
    const item = this.cartItems.get(id);
    if (item && item.userId === userId) {
      this.cartItems.delete(id);
    }
  }
}

export const storage = new MemStorage();
