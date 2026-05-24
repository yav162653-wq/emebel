import { useFurniture } from "@/modules/furniture/hooks/use-furniture";
import { FurnitureCard } from "@/modules/furniture/ui/FurnitureCard";
import { useFurnitureStore, type SortOption } from "@/modules/furniture/store/furniture-store";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { PackageSearch, SlidersHorizontal } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Name: A–Z" },
];

export function HeroProducts() {
  const { data: products, isLoading } = useFurniture();
  const { activeCategory, searchQuery, sortOption, setSortOption } = useFurnitureStore();

  const filtered = (products ?? [])
    .filter((p) => activeCategory === "All" || p.category === activeCategory)
    .filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      switch (sortOption) {
        case "price-asc": return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "name-asc": return a.name.localeCompare(b.name);
        default: return a.id - b.id;
      }
    });

  return (
    <section className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.25em] text-accent mb-2">
            Collection 2025
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight">
            {activeCategory === "All" ? "All Products" : activeCategory}
          </h2>
          {!isLoading && (
            <p className="text-muted-foreground mt-2 text-sm">
              {searchQuery
                ? `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${searchQuery}"`
                : `${filtered.length} piece${filtered.length !== 1 ? "s" : ""} available`}
            </p>
          )}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select
            value={sortOption}
            onValueChange={(v) => setSortOption(v as SortOption)}
          >
            <SelectTrigger
              data-testid="select-sort"
              className="w-44 h-9 text-sm border-border bg-transparent rounded-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-[4/5] w-full rounded-sm" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-36 text-center gap-4"
          >
            <PackageSearch className="h-14 w-14 text-muted-foreground/30" />
            <div>
              <p className="font-medium text-foreground">No items found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? `Try a different search term.` : "No products in this category yet."}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeCategory}-${sortOption}-${searchQuery}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12"
          >
            {filtered.map((product, index) => (
              <FurnitureCard key={product.id} product={product} index={index} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </section>
  );
}
