import { type Dispatch, type SetStateAction } from "react";
import { motion } from "framer-motion";
import {
  Heart, Minus, Plus, RotateCcw, Shield, ShoppingBag, Star, Truck,
} from "lucide-react";
import type { Product, ReviewSummary } from "@shared/schema";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ProductInformationProps {
  product: Product;
  summary?: ReviewSummary;
  quantity: number;
  setQuantity: Dispatch<SetStateAction<number>>;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  isAdding: boolean;
  isOutOfStock: boolean;
  isLowStock: boolean;
  isWishlisted: boolean;
  onAddToCart: () => void;
  onWishlist: () => void;
}

const COLOR_HEX: Record<string, string> = {
  "Walnut":         "#7C5C3A",
  "Onyx":           "#1C1C1E",
  "Slate":          "#6B7280",
  "Cream":          "#F0EBE0",
  "Natural Oak":    "#C4A98A",
  "Natural":        "#C4A98A",
  "White":          "#F5F5F5",
  "Ebonized":       "#1A1A1A",
  "Cognac":         "#9B4F1B",
  "Charcoal":       "#374151",
  "Honey":          "#D97706",
  "Bleached":       "#E8DCC8",
  "Stone Grey":     "#9CA3AF",
  "Matte Black":    "#1C1C1E",
  "Matte White":    "#F9F9F9",
  "Chrome":         "#C0C0C0",
  "Sand":           "#C2B280",
  "Fog":            "#B0B7C3",
  "Dusk":           "#8B7F9E",
  "Dune":           "#C4B597",
  "Stone":          "#9CA3AF",
  "Blush":          "#FBBF9A",
  "Ivory":          "#FFFFF0",
};

function getColorHex(colorName: string): string {
  const first = colorName.split("/")[0].trim();
  return COLOR_HEX[first] ?? "#9CA3AF";
}

export function ProductInformation({
  product,
  summary,
  quantity,
  setQuantity,
  selectedColor,
  setSelectedColor,
  isAdding,
  isOutOfStock,
  isLowStock,
  isWishlisted,
  onAddToCart,
  onWishlist,
}: ProductInformationProps) {
  const { t } = useTranslation();
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(product.price / 100);
  const avgStars = summary?.average ?? 0;
  const reviewCount = summary?.count ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="flex flex-col gap-7 lg:pt-4"
    >
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={cn(
              "h-4 w-4",
              reviewCount === 0
                ? "text-muted-foreground/30"
                : s <= Math.round(avgStars)
                ? "fill-accent text-accent"
                : "text-muted-foreground/30"
            )}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1" data-testid="text-review-count">
          {reviewCount > 0
            ? `${avgStars.toFixed(1)} (${t("product.reviewCount", { count: reviewCount })})`
            : t("product.noReviewsShort")}
        </span>
      </div>

      <div className="space-y-2">
        <h1 data-testid="text-product-title"
          className="font-display text-4xl md:text-5xl font-medium tracking-tight leading-tight">
          {product.name}
        </h1>
        <div className="flex items-baseline gap-3 flex-wrap">
          <span data-testid="text-product-price"
            className="font-mono text-3xl font-bold text-foreground">
            {formattedPrice}
          </span>
          {isLowStock && (
            <span className="text-sm font-medium text-accent">{t("product.onlyInStock", { count: product.stock })}</span>
          )}
          {isOutOfStock && (
            <span className="text-sm font-medium text-destructive">{t("product.outOfStock")}</span>
          )}
        </div>
      </div>

      <div className="h-px bg-border" />

      <p className="text-foreground/80 leading-relaxed">{product.description}</p>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4">
        {[
          { label: t("product.category"), value: product.category },
          { label: t("product.stock"),    value: isOutOfStock ? t("product.soldOut") : t("product.stockUnits", { count: product.stock }) },
          { label: t("product.material"), value: product.material },
          { label: t("product.warranty"), value: product.warranty },
          { label: t("product.assembly"), value: product.assembly },
          { label: t("product.origin"),   value: product.origin },
        ].map(({ label, value }) => (
          <div key={label}>
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <div className="h-px bg-border" />

      {product.colors && product.colors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{t("product.finish")}</p>
            <p className="text-sm font-semibold text-foreground truncate max-w-[160px]">{selectedColor}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((color) => (
              <button
                key={color}
                data-testid={`button-finish-${color.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setSelectedColor(color)}
                title={color}
                className={cn(
                  "h-9 w-9 rounded-full border-2 transition-all duration-200 hover:scale-110 focus:outline-none",
                  selectedColor === color
                    ? "border-foreground ring-2 ring-offset-2 ring-foreground/30 scale-110"
                    : "border-border/60 hover:border-foreground/40"
                )}
                style={{ backgroundColor: getColorHex(color) }}
                aria-label={color}
              />
            ))}
          </div>
        </div>
      )}

      {!isOutOfStock && (
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground shrink-0">{t("product.quantity")}</span>
          <div className="flex items-center border border-border rounded-sm">
            <button
              data-testid="button-qty-decrease"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-10 w-10 flex items-center justify-center hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span data-testid="text-qty"
              className="h-10 w-12 flex items-center justify-center text-sm font-semibold border-x border-border">
              {quantity}
            </span>
            <button
              data-testid="button-qty-increase"
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              className="h-10 w-10 flex items-center justify-center hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <PremiumButton
          data-testid="button-add-to-cart"
          onClick={onAddToCart}
          isLoading={isAdding}
          disabled={isOutOfStock}
          className="flex-1"
          size="lg"
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          {isOutOfStock ? t("product.outOfStock") : t("product.addToBag")}
        </PremiumButton>
        <PremiumButton
          data-testid="button-wishlist"
          variant="outline"
          size="lg"
          onClick={onWishlist}
          className={isWishlisted ? "border-accent text-accent hover:bg-accent/5" : ""}
        >
          <Heart className={`h-4 w-4 transition-all ${isWishlisted ? "fill-accent scale-110" : ""}`} />
        </PremiumButton>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Truck, label: t("product.freeDelivery"), sub: t("product.whiteGlove") },
          { icon: Shield, label: t("product.lifetimeWarranty"), sub: t("product.noAsterisks") },
          { icon: RotateCcw, label: t("product.thirtyDayReturns"), sub: t("product.hassleFree") },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center text-center gap-1.5 p-3 rounded-sm bg-secondary/30 hover:bg-secondary/50 transition-colors">
            <Icon className="h-4 w-4 text-accent" />
            <p className="text-[11px] font-semibold text-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
