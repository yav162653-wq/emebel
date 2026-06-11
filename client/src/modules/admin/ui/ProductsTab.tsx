import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Pencil, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useFurniture } from "@/modules/furniture/hooks/use-furniture";
import { useAdminProductUpdate } from "../hooks/use-admin";
import { cn } from "@/lib/utils";
import type { Product } from "@shared/schema";

function StockEditor({
  product,
  onSave,
  isPending,
}: {
  product: Product;
  onSave: (id: number, stock: number) => void;
  isPending: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(product.stock));

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className={cn(
          "font-mono text-sm font-semibold",
          product.stock === 0 ? "text-destructive" :
          product.stock <= 5  ? "text-yellow-600 dark:text-yellow-400" :
          "text-green-600 dark:text-green-400"
        )}>
          {product.stock}
        </span>
        <button
          onClick={() => { setValue(String(product.stock)); setEditing(true); }}
          className="p-1 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors opacity-0 group-hover:opacity-100"
          data-testid={`button-edit-stock-${product.id}`}
        >
          <Pencil className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        value={value}
        min={0}
        onChange={(e) => setValue(e.target.value)}
        className="h-7 w-16 text-xs font-mono px-2"
        autoFocus
        data-testid={`input-stock-${product.id}`}
      />
      <button
        disabled={isPending}
        onClick={() => {
          const n = parseInt(value, 10);
          if (!isNaN(n) && n >= 0) onSave(product.id, n);
          setEditing(false);
        }}
        className="p-1 rounded-sm text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
        data-testid={`button-save-stock-${product.id}`}
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setEditing(false)}
        className="p-1 rounded-sm text-muted-foreground hover:bg-secondary/50 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

const CATEGORIES = ["All", "Seating", "Tables", "Lighting", "Storage", "Bedroom", "Outdoor", "Decor"];

export function ProductsTab() {
  const { data: products, isLoading } = useFurniture();
  const updateProduct = useAdminProductUpdate();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = products?.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "All" || p.category === category;
    return matchesSearch && matchesCat;
  }) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-mono uppercase tracking-widest text-accent mb-1">Catalog</p>
        <h1 className="font-display text-3xl font-medium">Products</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your {products?.length ?? 0} products — hover a row to edit stock.
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search products…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
            data-testid="input-product-search"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              data-testid={`filter-category-${cat}`}
              className={cn(
                "px-3 py-1.5 rounded-sm text-xs font-medium transition-colors",
                category === cat
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-sm border border-border bg-card overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/20">
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-12">#</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Category</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-3.5"><Skeleton className="h-4 w-6" /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-sm shrink-0" />
                          <Skeleton className="h-4 w-36" />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-5 py-3.5 text-right"><Skeleton className="h-4 w-14 ml-auto" /></td>
                      <td className="px-5 py-3.5 text-right"><Skeleton className="h-4 w-10 ml-auto" /></td>
                    </tr>
                  ))
                : filtered.map((product, i) => (
                    <tr
                      key={product.id}
                      className="group hover:bg-secondary/20 transition-colors"
                      data-testid={`product-row-${product.id}`}
                    >
                      <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                        {product.id}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 shrink-0 rounded-sm overflow-hidden bg-secondary/30">
                            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                          </div>
                          <span className="font-medium text-sm truncate max-w-[180px]">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="px-2 py-0.5 rounded-full bg-secondary/60 text-xs font-medium text-muted-foreground">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono text-sm">
                        ${(product.price / 100).toFixed(0)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end">
                          <StockEditor
                            product={product}
                            onSave={(id, stock) => updateProduct.mutate({ id, stock })}
                            isPending={updateProduct.isPending}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {!isLoading && filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground text-sm">
              No products match your filters.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
