import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RecentlyViewedStore {
  ids: number[];
  add: (id: number) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      ids: [],
      add: (id) => {
        const current = get().ids.filter((i) => i !== id);
        set({ ids: [id, ...current].slice(0, 8) });
      },
      clear: () => set({ ids: [] }),
    }),
    { name: "space-recently-viewed" }
  )
);
