import { useFurniture, useFurnitureItem } from "@/modules/furniture/hooks/use-furniture";
import { useCart } from "@/modules/furniture/hooks/use-cart";
import { useWishlistStore, useFurnitureStore } from "@/modules/furniture/store/furniture-store";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, Minus, Package, Plus, RotateCcw, Shield, ShoppingBag, Star, Truck } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { FurnitureCard } from "@/modules/furniture/ui/FurnitureCard";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { data: product, isLoading } = useFurnitureItem(productId);
  const { data: allProducts } = useFurniture();
  const { addToCart, isAdding } = useCart();
  const { has, toggle } = useWishlistStore();
  const { setCartDrawerOpen } = useFurnitureStore();
  const [quantity, setQuantity] = useState(1);

  const isWishlisted = product ? has(product.id) : false;
  const relatedProducts = allProducts
    ?.filter((p) => p.category === product?.category && p.id !== product?.id)
    .slice(0, 4) ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Skeleton className="h-6 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <Skeleton className="aspect-[4/5] w-full rounded-sm" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="h-16 w-16 text-muted-foreground/30 mx-auto" />
          <h2 className="font-display text-3xl font-medium">Product Not Found</h2>
          <p className="text-muted-foreground">This item may have been removed or doesn't exist.</p>
          <Link href="/shop"><PremiumButton>Back to Shop</PremiumButton></Link>
        </div>
      </div>
    );
  }

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(product.price / 100);

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b">
        <div className="container py-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/shop">
            <button className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Shop
            </button>
          </Link>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="aspect-[4/5] overflow-hidden rounded-sm bg-secondary/20 relative">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
              {/* Badges */}
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center rounded-full bg-background/85 backdrop-blur-sm border border-border/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                  {product.category}
                </span>
              </div>
              {isLowStock && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center rounded-full bg-accent/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-accent-foreground">
                    Only {product.stock} left
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-7 lg:pt-4"
          >
            {/* Rating */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-4 w-4 fill-accent text-accent" />
              ))}
              <span className="text-sm text-muted-foreground ml-1">(48 reviews)</span>
            </div>

            {/* Title + Price */}
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
                  <span className="text-sm font-medium text-accent">Only {product.stock} in stock</span>
                )}
                {isOutOfStock && (
                  <span className="text-sm font-medium text-destructive">Out of Stock</span>
                )}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Description */}
            <p className="text-foreground/80 leading-relaxed">{product.description}</p>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: "Category", value: product.category },
                { label: "Stock", value: isOutOfStock ? "Sold Out" : `${product.stock} units` },
                { label: "Material", value: "Premium Grade" },
                { label: "Warranty", value: "Lifetime" },
                { label: "Assembly", value: "White Glove" },
                { label: "Origin", value: "Studio Crafted" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            <div className="h-px bg-border" />

            {/* Quantity + Actions */}
            {!isOutOfStock && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground shrink-0">
                  Qty
                </span>
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
                onClick={() => {
                  addToCart({ productId: product.id, quantity });
                  setCartDrawerOpen(true);
                }}
                isLoading={isAdding}
                disabled={isOutOfStock}
                className="flex-1"
                size="lg"
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                {isOutOfStock ? "Out of Stock" : "Add to Bag"}
              </PremiumButton>
              <PremiumButton
                data-testid="button-wishlist"
                variant="outline"
                size="lg"
                onClick={() => toggle(product.id)}
                className={isWishlisted ? "border-accent text-accent hover:bg-accent/5" : ""}
              >
                <Heart className={`h-4 w-4 ${isWishlisted ? "fill-accent" : ""}`} />
              </PremiumButton>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: "Free Delivery", sub: "White glove" },
                { icon: Shield, label: "Lifetime Warranty", sub: "No asterisks" },
                { icon: RotateCcw, label: "30-Day Returns", sub: "Hassle free" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1.5 p-3 rounded-sm bg-secondary/30">
                  <Icon className="h-4 w-4 text-accent" />
                  <p className="text-[11px] font-semibold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-24 space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">You May Also Like</p>
                <h2 className="font-display text-3xl font-medium">More in {product.category}</h2>
              </div>
              <Link href="/shop">
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  View all →
                </button>
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
              {relatedProducts.map((p, i) => (
                <FurnitureCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
