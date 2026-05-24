import { create } from "zustand";
import { persist } from "zustand/middleware";

export const CATEGORIES = ["All", "Seating", "Tables", "Lighting", "Storage", "Bedroom"] as const;
export type Category = (typeof CATEGORIES)[number];
export type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc";

interface FurnitureStore {
  activeCategory: Category;
  searchQuery: string;
  sortOption: SortOption;
  cartDrawerOpen: boolean;
  mobileNavOpen: boolean;
  setCategory: (category: Category) => void;
  setSearchQuery: (query: string) => void;
  setSortOption: (option: SortOption) => void;
  setCartDrawerOpen: (open: boolean) => void;
  setMobileNavOpen: (open: boolean) => void;
}

export const useFurnitureStore = create<FurnitureStore>((set) => ({
  activeCategory: "All",
  searchQuery: "",
  sortOption: "featured",
  cartDrawerOpen: false,
  mobileNavOpen: false,
  setCategory: (category) => set({ activeCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortOption: (option) => set({ sortOption: option }),
  setCartDrawerOpen: (open) => set({ cartDrawerOpen: open }),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
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
