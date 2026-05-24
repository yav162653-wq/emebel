import { create } from "zustand";
import { persist } from "zustand/middleware";

export const CATEGORIES = [
  "All", "Seating", "Tables", "Lighting", "Storage", "Bedroom", "Outdoor", "Decor"
] as const;
export type Category = (typeof CATEGORIES)[number];
export type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc";

export type PriceRange = "all" | "under-500" | "500-1000" | "1000-2000" | "over-2000";

export const PRICE_RANGES: { value: PriceRange; label: string; min: number; max: number }[] = [
  { value: "all",        label: "All Prices",    min: 0,       max: Infinity },
  { value: "under-500",  label: "Under $500",    min: 0,       max: 50000   },
  { value: "500-1000",   label: "$500–$1,000",   min: 50000,   max: 100000  },
  { value: "1000-2000",  label: "$1,000–$2,000", min: 100000,  max: 200000  },
  { value: "over-2000",  label: "Over $2,000",   min: 200000,  max: Infinity},
];

interface FurnitureStore {
  activeCategory: Category;
  searchQuery: string;
  sortOption: SortOption;
  priceRange: PriceRange;
  cartDrawerOpen: boolean;
  mobileNavOpen: boolean;
  setCategory: (category: Category) => void;
  setSearchQuery: (query: string) => void;
  setSortOption: (option: SortOption) => void;
  setPriceRange: (range: PriceRange) => void;
  setCartDrawerOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
  clearFilters: () => void;
}

export const useFurnitureStore = create<FurnitureStore>((set) => ({
  activeCategory: "All",
  searchQuery: "",
  sortOption: "featured",
  priceRange: "all",
  cartDrawerOpen: false,
  mobileNavOpen: false,
  setCategory: (category) => set({ activeCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortOption: (option) => set({ sortOption: option }),
  setPriceRange: (range) => set({ priceRange: range }),
  setCartDrawerOpen: (open) => set({ cartDrawerOpen: open }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  clearFilters: () => set({ activeCategory: "All", searchQuery: "", sortOption: "featured", priceRange: "all" }),
}));

// Wishlist store with localStorage persistence
interface WishlistStore {
  items: number[];
  toggle: (productId: number) => void;
  has: (productId: number) => boolean;
  clear: () => void;
  count: () => number;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (productId) => {
        const current = get().items;
        set({
          items: current.includes(productId)
            ? current.filter((id) => id !== productId)
            : [...current, productId],
        });
      },
      has: (productId) => get().items.includes(productId),
      clear: () => set({ items: [] }),
      count: () => get().items.length,
    }),
    { name: "space-wishlist" }
  )
);

// Recently viewed store with localStorage persistence
interface RecentlyViewedStore {
  ids: number[];
  add: (productId: number) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      ids: [],
      add: (productId) => {
        const current = get().ids.filter((id) => id !== productId);
        set({ ids: [productId, ...current].slice(0, 8) });
      },
      clear: () => set({ ids: [] }),
    }),
    { name: "space-recently-viewed" }
  )
);
