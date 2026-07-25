import bcrypt from "bcryptjs";
import { db } from "./client";
import { logger } from "../config/logger";

const SALT_ROUNDS = 12;

async function seed() {
  logger.info("🌱 Checking seed status...");

  const productCount = await db.product.count();
  if (productCount > 0) {
    logger.info(`✅ Database already seeded (${productCount} products). Skipping.`);
    return;
  }

  logger.info("🌱 Seeding database...");

  // ── Demo users + local identities ────────────────────────────────────
  const adminHash = await bcrypt.hash("password", SALT_ROUNDS);
  const userHash  = await bcrypt.hash("password", SALT_ROUNDS);

  const admin = await db.user.upsert({
    where:  { username: "nasa_admin" },
    update: {},
    create: { username: "nasa_admin", name: "NASA Admin", role: "admin" },
  });

  await db.identity.upsert({
    where:  { provider_providerId: { provider: "local", providerId: "nasa_admin" } },
    update: {},
    create: {
      userId:      admin.id,
      provider:    "local",
      providerId:  "nasa_admin",
      credentials: { hash: adminHash },
    },
  });

  const user = await db.user.upsert({
    where:  { username: "user" },
    update: {},
    create: { username: "user", name: "Test User", role: "user" },
  });

  await db.identity.upsert({
    where:  { provider_providerId: { provider: "local", providerId: "user" } },
    update: {},
    create: {
      userId:      user.id,
      provider:    "local",
      providerId:  "user",
      credentials: { hash: userHash },
    },
  });

  // ── Products ──────────────────────────────────────────────────────────
  await db.product.createMany({
    data: [
      // SEATING
      {
        name: "Cosimo Lounge Chair",
        description: "Hand-stitched full-grain leather with a solid walnut frame. Designed for the deliberate sitter.",
        price: 189000, category: "Seating",
        image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=800",
        stock: 8, material: "Full-Grain Leather", warranty: "Lifetime", origin: "Italy",
        colors: ["Walnut", "Onyx", "Cognac"],
      },
      {
        name: "Slate Accent Chair",
        description: "Bouclé fabric on a powder-coated steel base. A sculptural piece that works in any room.",
        price: 97500, category: "Seating",
        image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=800",
        stock: 12, material: "Bouclé / Steel", warranty: "5 Years", origin: "Denmark",
        colors: ["Cream", "Slate", "Charcoal"],
      },
      {
        name: "Arc Dining Chair",
        description: "Bent plywood seat with matte black steel legs. Stackable, elegant, enduring.",
        price: 42000, category: "Seating",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800",
        stock: 30, material: "Bent Plywood / Steel", warranty: "3 Years", origin: "Germany",
        colors: ["Natural Oak", "Onyx", "White"],
      },
      {
        name: "Rattan Barrel Chair",
        description: "Handwoven natural rattan over a powder-coated iron frame. Brings warmth to any corner.",
        price: 64500, category: "Seating",
        image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&q=80&w=800",
        stock: 14, material: "Natural Rattan / Iron", warranty: "3 Years", origin: "Indonesia",
        colors: ["Natural", "Honey", "Bleached"],
      },
      // TABLES
      {
        name: "Orbital Coffee Table",
        description: "Tempered glass top suspended on a sculptural matte steel frame. Floats above any floor.",
        price: 112000, category: "Tables",
        image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=800",
        stock: 5, material: "Tempered Glass / Steel", warranty: "5 Years", origin: "Sweden",
        colors: ["Clear / Matte Black", "Smoked / Brass"],
      },
      {
        name: "Slab Dining Table",
        description: "Live-edge American walnut slab on raw steel trestles. Each table is one of a kind.",
        price: 345000, category: "Tables",
        image: "https://images.unsplash.com/photo-1577140917170-285929fb55b7?auto=format&fit=crop&q=80&w=800",
        stock: 3, material: "American Walnut / Steel", warranty: "Lifetime", origin: "USA",
        colors: ["Natural Walnut", "Ebonized"],
      },
      {
        name: "Grid Side Table",
        description: "Powder-coated aluminum grid structure with a honed marble top. Minimal and refined.",
        price: 58000, category: "Tables",
        image: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&q=80&w=800",
        stock: 15, material: "Aluminum / Marble", warranty: "5 Years", origin: "Italy",
        colors: ["White Marble / Black", "Grey Marble / Brass"],
      },
      {
        name: "Travertine Console",
        description: "Solid Italian travertine top on polished brass hairpin legs. A statement entry piece.",
        price: 228000, category: "Tables",
        image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=800",
        stock: 4, material: "Italian Travertine / Brass", warranty: "Lifetime", origin: "Italy",
        colors: ["Travertine / Gold Brass", "Travertine / Matte Black"],
      },
      // LIGHTING
      {
        name: "Nebula Pendant",
        description: "Hand-blown opal glass with an antique brass canopy. Casts a warm, diffused glow.",
        price: 68000, category: "Lighting",
        image: "https://images.unsplash.com/photo-1507473883581-20963378120f?auto=format&fit=crop&q=80&w=800",
        stock: 20, material: "Hand-Blown Glass / Brass", warranty: "2 Years", origin: "Czech Republic",
        colors: ["Opal / Antique Brass", "Smoke / Matte Black"],
      },
      {
        name: "Arch Floor Lamp",
        description: "A sweeping satin brass arc reaching 1.9m. Brings gallery-level light to living spaces.",
        price: 52000, category: "Lighting",
        image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80&w=800",
        stock: 10, material: "Satin Brass / Marble Base", warranty: "2 Years", origin: "Netherlands",
        colors: ["Satin Brass", "Matte Black", "Chrome"],
      },
      {
        name: "Cone Table Lamp",
        description: "Linen shade over a turned oak base. Warm and architectural. Pairs with any palette.",
        price: 28500, category: "Lighting",
        image: "https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&q=80&w=800",
        stock: 25, material: "Linen / Turned Oak", warranty: "2 Years", origin: "Japan",
        colors: ["Natural Linen", "Ivory", "Charcoal"],
      },
      {
        name: "Dome Sconce",
        description: "Brushed nickel wall-mounted dome with a frosted glass diffuser. Ideal for layered lighting.",
        price: 34000, category: "Lighting",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=800",
        stock: 18, material: "Brushed Nickel / Glass", warranty: "2 Years", origin: "USA",
        colors: ["Brushed Nickel", "Matte Black", "Antique Brass"],
      },
      // STORAGE
      {
        name: "Meridian Bookshelf",
        description: "Open steel shelving with solid oak planks. Scales from single to full wall configuration.",
        price: 138000, category: "Storage",
        image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&q=80&w=800",
        stock: 7, material: "Solid Oak / Powder-Coated Steel", warranty: "10 Years", origin: "Norway",
        colors: ["Oak / Black", "Oak / White", "Walnut / Brass"],
      },
      {
        name: "Form Cabinet",
        description: "Smoked oak veneer with push-to-open doors. Invisible hardware, pure form.",
        price: 224000, category: "Storage",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=800",
        stock: 4, material: "Smoked Oak Veneer", warranty: "10 Years", origin: "Denmark",
        colors: ["Smoked Oak", "White Oak", "Ebony"],
      },
      {
        name: "Slot Wardrobe",
        description: "Full-height wardrobe in matte white with integrated handles. Seamless, minimal, room-defining.",
        price: 386000, category: "Storage",
        image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?auto=format&fit=crop&q=80&w=800",
        stock: 3, material: "MDF / Lacquered Finish", warranty: "10 Years", origin: "Germany",
        colors: ["Matte White", "Matte Black", "Stone Grey"],
      },
      // BEDROOM
      {
        name: "Monolith Bed Frame",
        description: "Solid white oak with a low-slung silhouette. Upholstered headboard in dove grey linen.",
        price: 285000, category: "Bedroom",
        image: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&q=80&w=800",
        stock: 6, material: "Solid White Oak / Linen", warranty: "Lifetime", origin: "Japan",
        colors: ["White Oak / Grey Linen", "Walnut / Cream Linen"],
      },
      {
        name: "Drift Nightstand",
        description: "Wall-mounted white oak with a single push-to-open drawer. Designed to disappear.",
        price: 44000, category: "Bedroom",
        image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&q=80&w=800",
        stock: 18, material: "Solid White Oak", warranty: "5 Years", origin: "Japan",
        colors: ["White Oak", "Walnut", "Ebonized"],
      },
      {
        name: "Cloud Ottoman",
        description: "Deep-filled down-alternative cushioning wrapped in performance linen. Sinks perfectly every time.",
        price: 76000, category: "Bedroom",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800",
        stock: 9, material: "Performance Linen / Down-Alt", warranty: "3 Years", origin: "Portugal",
        colors: ["Natural Linen", "Slate Blue", "Blush"],
      },
      // OUTDOOR
      {
        name: "Teak Sun Lounger",
        description: "Grade A teak with a seven-position recline mechanism. Built for decades of outdoor use.",
        price: 142000, category: "Outdoor",
        image: "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=800",
        stock: 6, material: "Grade A Teak", warranty: "10 Years", origin: "Indonesia",
        colors: ["Natural Teak", "Weathered Grey"],
      },
      {
        name: "Rope Weave Sofa",
        description: "UV-resistant olefin rope over a powder-coated aluminum frame. Outdoor luxury redefined.",
        price: 234000, category: "Outdoor",
        image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&q=80&w=800",
        stock: 4, material: "Olefin Rope / Aluminum", warranty: "5 Years", origin: "Spain",
        colors: ["White / Sand", "Charcoal / Dark Grey"],
      },
      {
        name: "Stone Planter Trio",
        description: "Cast stone planters in three graduated sizes. Frost-resistant and beautifully textured.",
        price: 38500, category: "Outdoor",
        image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=800",
        stock: 20, material: "Cast Stone", warranty: "Lifetime", origin: "UK",
        colors: ["Portland Stone", "Slate", "Sandstone"],
      },
      // DECOR
      {
        name: "Arch Mirror",
        description: "Full-length arched mirror with a thin solid brass frame. Reflects light, adds volume.",
        price: 89000, category: "Decor",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800",
        stock: 11, material: "Glass / Solid Brass", warranty: "5 Years", origin: "France",
        colors: ["Antique Brass", "Matte Black", "Chrome"],
      },
      {
        name: "Wabi-Sabi Vase Set",
        description: "Hand-thrown stoneware in matte sand glaze. Each piece subtly unique, intentionally imperfect.",
        price: 22000, category: "Decor",
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&q=80&w=800",
        stock: 30, material: "Stoneware", warranty: "N/A", origin: "Japan",
        colors: ["Sand", "Fog", "Dusk"],
      },
      {
        name: "Linen Throw Blanket",
        description: "100% Belgian linen with a natural fringe border. Drape, wrap, or display.",
        price: 18500, category: "Decor",
        image: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&q=80&w=800",
        stock: 40, material: "100% Belgian Linen", warranty: "N/A", origin: "Belgium",
        colors: ["Natural", "Stone", "Dune", "Slate"],
      },
    ],
  });

  logger.info("✅ Seeded: 2 users + 2 local identities + 24 products.");
}

seed()
  .catch((e) => {
    logger.error({ error: e.message }, "❌ Seed failed");
    process.exit(1);
  })
  .finally(() => db.$disconnect());
