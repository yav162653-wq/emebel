import { useFurniture } from "@/modules/furniture/hooks/use-furniture";
import { FurnitureCard } from "@/modules/furniture/ui/FurnitureCard";
import {
  useFurnitureStore,
  type SortOption,
  type PriceRange,
  PRICE_RANGES,
} from "@/modules/furniture/store/furniture-store";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { PackageSearch, SlidersHorizontal, X } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { QueryErrorState } from "@/shared/components/QueryErrorState";
import { Button } from "@/components/ui/button";

export function HeroProducts() {
  const { t } = useTranslation();
  const {
    activeCategory, searchQuery, sortOption, priceRange,
    setSortOption, setPriceRange, clearFilters,
  } = useFurnitureStore();
  const {
    data: products,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useFurniture({
    limit: 24,
    category: activeCategory === "All" ? undefined : activeCategory,
    search: searchQuery.trim() || undefined,
  });
  const [filterOpen, setFilterOpen] = useState(false);

  const activeRange = PRICE_RANGES.find((range) => range.value === priceRange);
  if (!activeRange) throw new Error(`Unknown price range: ${priceRange}`);
  const rangeLabels: Record<PriceRange, string> = {
    all: t("shop.allPrices"),
    "under-500": t("shop.under500"),
    "500-1000": t("shop.price5001000"),
    "1000-2000": t("shop.price10002000"),
    "over-2000": t("shop.over2000"),
  };
  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "featured",   label: t("shop.featured") },
    { value: "price-asc",  label: t("shop.priceLowHigh") },
    { value: "price-desc", label: t("shop.priceHighLow") },
    { value: "name-asc",   label: t("shop.nameAZ") },
  ];

  const filtered = (products ?? [])
    .filter(p => p.price >= activeRange.min && p.price < activeRange.max)
    .sort((a, b) => {
      switch (sortOption) {
        case "price-asc":  return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "name-asc":   return a.name.localeCompare(b.name);
        default:           return a.id - b.id;
      }
    });

  const activeFilterCount = [
    activeCategory !== "All",
    searchQuery.trim() !== "",
    priceRange !== "all",
    sortOption !== "featured",
  ].filter(Boolean).length;

  return (
    <section className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.25em] text-accent mb-2">
             {t("shop.collectionYear", { year: new Date().getFullYear() })}
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight">
             {activeCategory === "All" ? t("shop.allProducts") : t(`nav.${activeCategory.toLowerCase()}`)}
          </h2>
          {!isLoading && (
            <p className="text-muted-foreground mt-2 text-sm">
              {searchQuery
                 ? t("shop.resultsFor", { count: filtered.length, query: searchQuery })
                 : t("shop.piecesAvailable", { count: filtered.length })}
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">

          {/* Price Filter Popover */}
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <button
                data-testid="button-filter"
                className={`relative flex items-center gap-2 h-9 px-3.5 rounded-sm border text-sm font-medium transition-all duration-200 ${
                  priceRange !== "all"
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                 <span>{t("shop.price")}</span>
                {priceRange !== "all" && (
                  <span className="ml-0.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-accent text-[9px] font-bold text-accent-foreground">
                    1
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-52 p-2 space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground px-2 py-1">
                 {t("shop.priceRange")}
              </p>
              {PRICE_RANGES.map(range => (
                <button
                  key={range.value}
                  onClick={() => { setPriceRange(range.value); setFilterOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-sm text-sm transition-colors ${
                    priceRange === range.value
                      ? "bg-accent/10 text-accent font-semibold"
                      : "hover:bg-secondary/60 text-foreground"
                  }`}
                >
                   {rangeLabels[range.value]}
                </button>
              ))}
            </PopoverContent>
          </Popover>

          {/* Sort */}
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger
              data-testid="select-sort"
              aria-label={t("shop.sortBy")}
              className="w-44 h-9 text-sm border-border bg-transparent rounded-sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
               {sortOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filter Pills */}
      <AnimatePresence>
        {(priceRange !== "all" || searchQuery) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap items-center gap-2 overflow-hidden"
          >
            {priceRange !== "all" && (
              <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-medium">
                 {rangeLabels[priceRange]}
                <button
                  onClick={() => setPriceRange("all")}
                  className="hover:bg-accent/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-secondary border border-border text-xs font-medium text-foreground">
                "{searchQuery}"
                <button
                  onClick={() => useFurnitureStore.getState().setSearchQuery("")}
                  className="hover:bg-secondary/80 rounded-full p-0.5 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {activeFilterCount > 1 && (
              <button
                onClick={clearFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                 {t("shop.clearAll")}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              className="space-y-4"
            >
              <Skeleton className="aspect-[4/5] w-full rounded-sm" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-4 w-1/3" />
            </motion.div>
          ))}
        </div>
      ) : isError ? (
        <QueryErrorState onRetry={refetch} className="py-20" />
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-36 text-center gap-5"
        >
          <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center">
            <PackageSearch className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <div>
             <p className="font-medium text-foreground text-lg">{t("shop.noItems")}</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              {searchQuery
                 ? t("shop.noSearchResults", { query: searchQuery })
                 : t("shop.noFilterResults")}
            </p>
          </div>
          <button
            onClick={clearFilters}
            className="text-sm text-accent hover:underline font-medium"
          >
             {t("shop.clearAllFilters")}
          </button>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeCategory}-${sortOption}-${searchQuery}-${priceRange}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12"
          >
            {filtered.map((product, index) => (
              <FurnitureCard key={product.id} product={product} index={index} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            data-testid="button-load-more-products"
          >
            {isFetchingNextPage ? t("shop.loadingMore") : t("shop.loadMore")}
          </Button>
        </div>
      )}
    </section>
  );
}
