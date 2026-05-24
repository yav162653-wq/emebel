import { create } from "zustand";

export const CATEGORIES = ["All", "Seating", "Tables", "Lighting", "Storage", "Bedroom"] as const;
export type Category = (typeof CATEGORIES)[number];

export type SortOption = "featured" | "price-asc" | "price-desc" | "name-asc";

interface FurnitureStore {
  activeCategory: Category;
  searchQuery: string;
  sortOption: SortOption;
  setCategory: (category: Category) => void;
  setSearchQuery: (query: string) => void;
  setSortOption: (option: SortOption) => void;
}

export const useFurnitureStore = create<FurnitureStore>((set) => ({
  activeCategory: "All",
  searchQuery: "",
  sortOption: "featured",
  setCategory: (category) => set({ activeCategory: category }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortOption: (option) => set({ sortOption: option }),
}));
