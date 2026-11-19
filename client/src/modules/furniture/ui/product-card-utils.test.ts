import { describe, expect, it } from "vitest";
import { formatProductPrice, getCategoryTranslationKey } from "./product-card-utils";

describe("product card utilities", () => {
  it("formats minor-unit prices as USD", () => {
    expect(formatProductPrice(189000)).toBe("$1,890");
  });

  it("returns an empty price for an invalid value", () => {
    expect(formatProductPrice(Number.NaN)).toBe("");
  });

  it("maps known categories to translation keys", () => {
    expect(getCategoryTranslationKey("Seating")).toBe("nav.seating");
  });

  it("falls back to an undefined key for unknown categories", () => {
    expect(getCategoryTranslationKey("Custom")).toBeUndefined();
  });
});
