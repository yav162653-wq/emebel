import type { TFunction } from "i18next";

export type ProductCardVariant = "grid" | "featured" | "compact";

export function formatProductPrice(
  priceInMinorUnits: number,
  locale = "en-US",
  currency = "USD",
): string {
  if (!Number.isFinite(priceInMinorUnits)) return "";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(priceInMinorUnits / 100);
}

export function getCategoryTranslationKey(category: string): string | undefined {
  switch (category) {
    case "Seating":
      return "nav.seating";
    case "Tables":
      return "nav.tables";
    case "Lighting":
      return "nav.lighting";
    case "Storage":
      return "nav.storage";
    case "Bedroom":
      return "nav.bedroom";
    case "Outdoor":
      return "nav.outdoor";
    case "Decor":
      return "nav.decor";
    default:
      return undefined;
  }
}

export function getCategoryLabel(
  t: TFunction,
  category: string,
): string {
  const key = getCategoryTranslationKey(category);
  return key ? t(key) : category;
}
