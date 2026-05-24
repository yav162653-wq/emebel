import { motion } from "framer-motion";
import { type Product } from "@shared/schema";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { Heart, ShoppingBag } from "lucide-react";
import { useCart } from "../hooks/use-cart";
import { useWishlistStore } from "../store/furniture-store";
import { Link } from "wouter";

interface FurnitureCardProps {
  product: Product;
  index?: number;
}

export function FurnitureCard({ product, index = 0 }: FurnitureCardProps) {
  const { addToCart, isAdding } = useCart();
  const { has, toggle } = useWishlistStore();
  const isWishlisted = has(product.id);

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(product.price / 100);

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.07, 0.5), ease: [0.16, 1, 0.3, 1] }}
      data-testid={`card-product-${product.id}`}
      className="group relative flex flex-col gap-3"
    >
      {/* Image Container */}
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-secondary/30 cursor-pointer">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Wishlist Button */}
          <button
            data-testid={`button-wishlist-${product.id}`}
            onClick={(e) => {
              e.preventDefault();
              toggle(product.id);
            }}
            className={`absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-full backdrop-blur-sm border transition-all duration-200 ${
              isWishlisted
                ? "bg-accent/90 border-accent/50 opacity-100 translate-y-0"
                : "bg-background/80 border-border/50 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0"
            }`}
          >
            <Heart className={`h-3.5 w-3.5 transition-colors ${isWishlisted ? "fill-white text-white" : "text-foreground"}`} />
          </button>

          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center rounded-full bg-background/85 backdrop-blur-sm border border-border/30 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground">
              {product.category}
            </span>
          </div>

          {/* Stock Badges */}
          {isLowStock && (
            <div className="absolute bottom-14 left-3">
              <span className="inline-flex items-center rounded-full bg-accent/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
                Only {product.stock} left
              </span>
            </div>
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <span className="bg-foreground/90 text-background px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-widest">
                Sold Out
              </span>
            </div>
          )}

          {/* Add to Cart — hover overlay */}
          {!isOutOfStock && (
            <div className="absolute bottom-3 left-3 right-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
              <PremiumButton
                onClick={(e) => {
                  e.preventDefault();
                  addToCart({ productId: product.id });
                }}
                isLoading={isAdding}
                data-testid={`button-add-to-cart-${product.id}`}
                className="w-full bg-background/95 text-foreground hover:bg-background shadow-lg border border-border/30"
                size="sm"
              >
                <ShoppingBag className="mr-1.5 h-3.5 w-3.5" />
                Add to Bag
              </PremiumButton>
            </div>
          )}
        </div>
      </Link>

      {/* Product Info */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-start gap-2">
          <Link href={`/product/${product.id}`}>
            <h3
              data-testid={`text-product-name-${product.id}`}
              className="font-display text-base font-medium tracking-tight text-foreground hover:text-accent transition-colors cursor-pointer leading-snug"
            >
              {product.name}
            </h3>
          </Link>
          <span
            data-testid={`text-price-${product.id}`}
            className="font-mono text-sm font-semibold text-foreground shrink-0"
          >
            {formattedPrice}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
          {product.description}
        </p>
      </div>
    </motion.div>
  );
}
