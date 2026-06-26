/**
 * One-time migration: updates existing products with real material/warranty/origin/colors data.
 * Run with: npx tsx server/db/update-products.ts
 */
import { db } from "./client";
import { logger } from "../config/logger";

const PRODUCT_DATA: Record<string, { material: string; warranty: string; origin: string; colors: string[] }> = {
  "Cosimo Lounge Chair":   { material: "Full-Grain Leather",            warranty: "Lifetime",  origin: "Italy",         colors: ["Walnut", "Onyx", "Cognac"] },
  "Slate Accent Chair":    { material: "Bouclé / Steel",                warranty: "5 Years",   origin: "Denmark",       colors: ["Cream", "Slate", "Charcoal"] },
  "Arc Dining Chair":      { material: "Bent Plywood / Steel",          warranty: "3 Years",   origin: "Germany",       colors: ["Natural Oak", "Onyx", "White"] },
  "Rattan Barrel Chair":   { material: "Natural Rattan / Iron",         warranty: "3 Years",   origin: "Indonesia",     colors: ["Natural", "Honey", "Bleached"] },
  "Orbital Coffee Table":  { material: "Tempered Glass / Steel",        warranty: "5 Years",   origin: "Sweden",        colors: ["Clear / Matte Black", "Smoked / Brass"] },
  "Slab Dining Table":     { material: "American Walnut / Steel",       warranty: "Lifetime",  origin: "USA",           colors: ["Natural Walnut", "Ebonized"] },
  "Grid Side Table":       { material: "Aluminum / Marble",             warranty: "5 Years",   origin: "Italy",         colors: ["White Marble / Black", "Grey Marble / Brass"] },
  "Travertine Console":    { material: "Italian Travertine / Brass",    warranty: "Lifetime",  origin: "Italy",         colors: ["Travertine / Gold Brass", "Travertine / Matte Black"] },
  "Nebula Pendant":        { material: "Hand-Blown Glass / Brass",      warranty: "2 Years",   origin: "Czech Republic",colors: ["Opal / Antique Brass", "Smoke / Matte Black"] },
  "Arch Floor Lamp":       { material: "Satin Brass / Marble Base",     warranty: "2 Years",   origin: "Netherlands",   colors: ["Satin Brass", "Matte Black", "Chrome"] },
  "Cone Table Lamp":       { material: "Linen / Turned Oak",            warranty: "2 Years",   origin: "Japan",         colors: ["Natural Linen", "Ivory", "Charcoal"] },
  "Dome Sconce":           { material: "Brushed Nickel / Glass",        warranty: "2 Years",   origin: "USA",           colors: ["Brushed Nickel", "Matte Black", "Antique Brass"] },
  "Meridian Bookshelf":    { material: "Solid Oak / Powder-Coated Steel",warranty: "10 Years", origin: "Norway",        colors: ["Oak / Black", "Oak / White", "Walnut / Brass"] },
  "Form Cabinet":          { material: "Smoked Oak Veneer",             warranty: "10 Years",  origin: "Denmark",       colors: ["Smoked Oak", "White Oak", "Ebony"] },
  "Slot Wardrobe":         { material: "MDF / Lacquered Finish",        warranty: "10 Years",  origin: "Germany",       colors: ["Matte White", "Matte Black", "Stone Grey"] },
  "Monolith Bed Frame":    { material: "Solid White Oak / Linen",       warranty: "Lifetime",  origin: "Japan",         colors: ["White Oak / Grey Linen", "Walnut / Cream Linen"] },
  "Drift Nightstand":      { material: "Solid White Oak",               warranty: "5 Years",   origin: "Japan",         colors: ["White Oak", "Walnut", "Ebonized"] },
  "Cloud Ottoman":         { material: "Performance Linen / Down-Alt",  warranty: "3 Years",   origin: "Portugal",      colors: ["Natural Linen", "Slate Blue", "Blush"] },
  "Teak Sun Lounger":      { material: "Grade A Teak",                  warranty: "10 Years",  origin: "Indonesia",     colors: ["Natural Teak", "Weathered Grey"] },
  "Rope Weave Sofa":       { material: "Olefin Rope / Aluminum",        warranty: "5 Years",   origin: "Spain",         colors: ["White / Sand", "Charcoal / Dark Grey"] },
  "Stone Planter Trio":    { material: "Cast Stone",                    warranty: "Lifetime",  origin: "UK",            colors: ["Portland Stone", "Slate", "Sandstone"] },
  "Arch Mirror":           { material: "Glass / Solid Brass",           warranty: "5 Years",   origin: "France",        colors: ["Antique Brass", "Matte Black", "Chrome"] },
  "Wabi-Sabi Vase Set":    { material: "Stoneware",                     warranty: "N/A",       origin: "Japan",         colors: ["Sand", "Fog", "Dusk"] },
  "Linen Throw Blanket":   { material: "100% Belgian Linen",            warranty: "N/A",       origin: "Belgium",       colors: ["Natural", "Stone", "Dune", "Slate"] },
};

async function updateProducts() {
  logger.info("🔄 Updating existing products with rich metadata...");

  const products = await db.product.findMany({ select: { id: true, name: true } });
  let updated = 0;

  for (const product of products) {
    const data = PRODUCT_DATA[product.name];
    if (data) {
      await db.product.update({
        where: { id: product.id },
        data,
      });
      updated++;
    }
  }

  logger.info(`✅ Updated ${updated}/${products.length} products with rich metadata.`);
}

updateProducts()
  .catch((e) => {
    logger.error("❌ Update failed", { error: e.message });
    process.exit(1);
  })
  .finally(() => db.$disconnect());
