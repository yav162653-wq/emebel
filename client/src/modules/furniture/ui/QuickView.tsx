import { type Product } from "@shared/schema";
import { useCart } from "../hooks/use-cart";
import { useWishlist } from "../hooks/use-wishlist";
import { useFurnitureStore } from "../store/furniture-store";
import { useToast } from "@/hooks/use-toast";
import { PremiumButton } from "@/shared/components/PremiumButton";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Heart, RotateCcw, Shield, ShoppingBag, Star, Truck, X } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ReviewSummary } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface QuickViewProps {
  product: Product | null;
  onClose: () => void;
}

export function QuickView({ product, onClose }: QuickViewProps) {
  const { t } = useTranslation();
  const { addToCart, isAdding } = useCart();
  const { has, toggle } = useWishlist();
  const { setCartDrawerOpen } = useFurnitureStore();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { data: reviewSummary } = useQuery<ReviewSummary>({
    queryKey: ["/api/reviews", product?.id, "summary"],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/${product!.id}/summary`);
      if (!res.ok) throw new Error("Failed to load review summary");
      return res.json();
    },
    enabled: !!product,
  });

  if (!product) return null;

  const isWishlisted = has(product.id);
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
  }).format(product.price / 100);

  const handleWishlist = () => {
    toggle(product.id);
    toast({ title: isWishlisted ? "Removed from wishlist" : "Saved to wishlist", description: product.name, duration: 2000 });
  };

  const handleAddToCart = () => {
    addToCart({ productId: product.id, quantity });
    setCartDrawerOpen(true);
    onClose();
  };

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden gap-0 border border-border/50 shadow-2xl">
        <DialogTitle className="sr-only">{product.name} — {t("product.quickView")}</DialogTitle>
        <DialogDescription className="sr-only">
          {product.description}. Price: {formattedPrice}. Category: {product.category}.
        </DialogDescription>

        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border hover:bg-secondary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Image */}
          <div className="relative aspect-square md:aspect-auto md:h-full bg-secondary/20 overflow-hidden">
            {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-secondary/40" />}
            <motion.img
              src={product.image}
              alt={product.name}
              onLoad={() => setImgLoaded(true)}
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: imgLoaded ? 1 : 0 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full object-cover"
            />
            {/* Badges */}
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center rounded-full bg-background/85 backdrop-blur-sm border border-border/30 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                {product.category}
              </span>
            </div>
            {isLowStock && (
              <div className="absolute bottom-4 left-4">
                <span className="inline-flex items-center rounded-full bg-accent/90 px-2.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                  {t("product.onlyLeft", { count: product.stock })}
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-5 p-7">
            {/* Rating */}
            <div className="flex items-center gap-1.5">
              {[1,2,3,4,5].map((s) => (
                <Star
                  key={s}
                  className={`h-3.5 w-3.5 ${
                    reviewSummary && s <= Math.round(reviewSummary.average)
                      ? "fill-accent text-accent"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                {reviewSummary?.count
                  ? `${reviewSummary.count} review${reviewSummary.count !== 1 ? "s" : ""}`
                  : "No reviews yet"}
              </span>
            </div>

            {/* Name + Price */}
            <div className="space-y-1.5">
              <h2 className="font-display text-2xl font-medium leading-tight">{product.name}</h2>
              <p className="font-mono text-2xl font-bold">{formattedPrice}</p>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>

            {/* Specs */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 py-3 border-y border-border">
              {[
                { label: t("product.category"), value: product.category },
                { label: t("product.stock"), value: isOutOfStock ? t("product.soldOut") : t("product.stockUnits", { count: product.stock }) },
                { label: t("product.assembly"), value: product.assembly },
                { label: t("product.warranty"), value: product.warranty },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
                  <p className="text-xs font-semibold mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <PremiumButton
                  onClick={handleAddToCart}
                  isLoading={isAdding}
                  disabled={isOutOfStock}
                  className="flex-1"
                  size="lg"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  {isOutOfStock ? t("product.outOfStock") : t("product.addToBag")}
                </PremiumButton>
                <PremiumButton
                  variant="outline" size="lg"
                  onClick={handleWishlist}
                  className={isWishlisted ? "border-accent text-accent" : ""}
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? "fill-accent" : ""}`} />
                </PremiumButton>
              </div>

              <Link href={`/product/${product.id}`} onClick={onClose}>
                <button className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 group">
                  {t("product.viewFullDetails")}
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            </div>

            {/* Trust */}
            <div className="flex gap-3">
              {[
                { icon: Truck, text: t("product.freeDelivery") },
                { icon: Shield, text: t("product.lifetimeWarranty") },
                { icon: RotateCcw, text: t("product.thirtyDayReturns") },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Icon className="h-3 w-3 text-accent shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
