import { useFurniture } from "@/modules/furniture/hooks/use-furniture";
import { FurnitureCard } from "@/modules/furniture/ui/FurnitureCard";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { PackageSearch } from "lucide-react";

interface HeroProductsProps {
  activeCategory: string;
}

export function HeroProducts({ activeCategory }: HeroProductsProps) {
  const { data: products, isLoading } = useFurniture();

  const filtered = products?.filter(
    (p) => activeCategory === "All" || p.category === activeCategory
  ) ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-[4/5] w-full rounded-sm" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-32 text-center gap-4"
      >
        <PackageSearch className="h-12 w-12 text-muted-foreground/40" />
        <p className="text-muted-foreground font-medium">No items found in this category.</p>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeCategory}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12"
      >
        {filtered.map((product, index) => (
          <FurnitureCard key={product.id} product={product} index={index} />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
