/**
 * One-time migration: updates existing products with real material/warranty/origin/colors data.
 * Run with: npx tsx server/db/update-products.ts
 */
import { db } from "./client";
import { logger } from "../config/logger";

const PRODUCT_DATA: Record<string, { material: string; warranty: string; origin: string; assembly: string; colors: string[] }> = {
  "Cosimo Lounge Chair":   { material: "Full-Grain Leather",            warranty: "Lifetime",  origin: "Italy",         assembly: "White Glove",      colors: ["Walnut", "Onyx", "Cognac"] },
  "Slate Accent Chair":    { material: "Bouclé / Steel",                warranty: "5 Years",   origin: "Denmark",       assembly: "White Glove",      colors: ["Cream", "Slate", "Charcoal"] },
  "Arc Dining Chair":      { material: "Bent Plywood / Steel",          warranty: "3 Years",   origin: "Germany",       assembly: "Self-Assembly",    colors: ["Natural Oak", "Onyx", "White"] },
  "Rattan Barrel Chair":   { material: "Natural Rattan / Iron",         warranty: "3 Years",   origin: "Indonesia",     assembly: "Self-Assembly",    colors: ["Natural", "Honey", "Bleached"] },
  "Orbital Coffee Table":  { material: "Tempered Glass / Steel",        warranty: "5 Years",   origin: "Sweden",        assembly: "Self-Assembly",    colors: ["Clear / Matte Black", "Smoked / Brass"] },
  "Slab Dining Table":     { material: "American Walnut / Steel",       warranty: "Lifetime",  origin: "USA",           assembly: "White Glove",      colors: ["Natural Walnut", "Ebonized"] },
  "Grid Side Table":       { material: "Aluminum / Marble",             warranty: "5 Years",   origin: "Italy",         assembly: "Self-Assembly",    colors: ["White Marble / Black", "Grey Marble / Brass"] },
  "Travertine Console":    { material: "Italian Travertine / Brass",    warranty: "Lifetime",  origin: "Italy",         assembly: "White Glove",      colors: ["Travertine / Gold Brass", "Travertine / Matte Black"] },
  "Nebula Pendant":        { material: "Hand-Blown Glass / Brass",      warranty: "2 Years",   origin: "Czech Republic",assembly: "Electrician Required", colors: ["Opal / Antique Brass", "Smoke / Matte Black"] },
  "Arch Floor Lamp":       { material: "Satin Brass / Marble Base",     warranty: "2 Years",   origin: "Netherlands",   assembly: "Self-Assembly",    colors: ["Satin Brass", "Matte Black", "Chrome"] },
  "Cone Table Lamp":       { material: "Linen / Turned Oak",            warranty: "2 Years",   origin: "Japan",         assembly: "Ready to Use",     colors: ["Natural Linen", "Ivory", "Charcoal"] },
  "Dome Sconce":           { material: "Brushed Nickel / Glass",        warranty: "2 Years",   origin: "USA",           assembly: "Electrician Required", colors: ["Brushed Nickel", "Matte Black", "Antique Brass"] },
  "Meridian Bookshelf":    { material: "Solid Oak / Powder-Coated Steel",warranty: "10 Years", origin: "Norway",        assembly: "Self-Assembly",    colors: ["Oak / Black", "Oak / White", "Walnut / Brass"] },
  "Form Cabinet":          { material: "Smoked Oak Veneer",             warranty: "10 Years",  origin: "Denmark",       assembly: "Self-Assembly",    colors: ["Smoked Oak", "White Oak", "Ebony"] },
  "Slot Wardrobe":         { material: "MDF / Lacquered Finish",        warranty: "10 Years",  origin: "Germany",       assembly: "Self-Assembly",    colors: ["Matte White", "Matte Black", "Stone Grey"] },
  "Monolith Bed Frame":    { material: "Solid White Oak / Linen",       warranty: "Lifetime",  origin: "Japan",         assembly: "White Glove",      colors: ["White Oak / Grey Linen", "Walnut / Cream Linen"] },
  "Drift Nightstand":      { material: "Solid White Oak",               warranty: "5 Years",   origin: "Japan",         assembly: "Self-Assembly",    colors: ["White Oak", "Walnut", "Ebonized"] },
  "Cloud Ottoman":         { material: "Performance Linen / Down-Alt",  warranty: "3 Years",   origin: "Portugal",      assembly: "Ready to Use",     colors: ["Natural Linen", "Slate Blue", "Blush"] },
  "Teak Sun Lounger":      { material: "Grade A Teak",                  warranty: "10 Years",  origin: "Indonesia",     assembly: "Self-Assembly",    colors: ["Natural Teak", "Weathered Grey"] },
  "Rope Weave Sofa":       { material: "Olefin Rope / Aluminum",        warranty: "5 Years",   origin: "Spain",         assembly: "White Glove",      colors: ["White / Sand", "Charcoal / Dark Grey"] },
  "Stone Planter Trio":    { material: "Cast Stone",                    warranty: "Lifetime",  origin: "UK",            assembly: "Ready to Use",     colors: ["Portland Stone", "Slate", "Sandstone"] },
  "Arch Mirror":           { material: "Glass / Solid Brass",           warranty: "5 Years",   origin: "France",        assembly: "Self-Assembly",    colors: ["Antique Brass", "Matte Black", "Chrome"] },
  "Wabi-Sabi Vase Set":    { material: "Stoneware",                     warranty: "N/A",       origin: "Japan",         assembly: "Ready to Use",     colors: ["Sand", "Fog", "Dusk"] },
  "Linen Throw Blanket":   { material: "100% Belgian Linen",            warranty: "N/A",       origin: "Belgium",       assembly: "Ready to Use",     colors: ["Natural", "Stone", "Dune", "Slate"] },
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
