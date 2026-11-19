import { motion } from "framer-motion";
import type { Product } from "@shared/schema";
import { useTranslation } from "react-i18next";

interface ProductGalleryProps {
  product: Product;
  isLowStock: boolean;
}

export function ProductGallery({ product, isLowStock }: ProductGalleryProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="aspect-[4/5] overflow-hidden rounded-sm bg-secondary/20 relative group">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
        />
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center rounded-full bg-background/85 backdrop-blur-sm border border-border/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            {product.category}
          </span>
        </div>
        {isLowStock && (
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center rounded-full bg-accent/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-accent-foreground">
              {t("product.onlyLeft", { count: product.stock })}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
