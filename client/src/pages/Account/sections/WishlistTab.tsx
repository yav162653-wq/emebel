import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Heart, Trash2 } from "lucide-react";
import type { Product } from "@shared/schema";
import { PremiumButton } from "@/shared/components/PremiumButton";

interface WishlistTabProps {
  products: Product[];
  onRemove: (id: number, name: string) => void;
}

export function WishlistTab({ products, onRemove }: WishlistTabProps) {
  const { t } = useTranslation();

  if (products.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Heart className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="font-medium">{t("wishlist.emptyTitle")}</p>
        <p className="text-sm mt-1">{t("wishlist.emptyDesc")}</p>
        <Link href="/shop">
          <PremiumButton size="sm" className="mt-6">{t("landing.shopNow")}</PremiumButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product, i) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="group relative rounded-sm border border-border bg-card overflow-hidden"
          data-testid={`wishlist-item-${product.id}`}
        >
          <div className="aspect-[4/3] bg-secondary/20 overflow-hidden">
            <img
              src={product.image} alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="p-4 space-y-2">
            <div className="flex justify-between items-start gap-2">
              <p className="font-medium text-sm leading-snug">{product.name}</p>
              <span className="font-mono text-sm font-bold shrink-0">${(product.price / 100).toFixed(0)}</span>
            </div>
            <p className="text-xs text-muted-foreground">{product.category}</p>
            <div className="flex gap-2 pt-1">
              <Link href={`/product/${product.id}`} className="flex-1">
                <PremiumButton size="sm" className="w-full text-xs">{t("account.viewOrder")}</PremiumButton>
              </Link>
              <button
                onClick={() => onRemove(product.id, product.name)}
                className="p-2 rounded-sm border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                data-testid={`button-remove-wishlist-${product.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
