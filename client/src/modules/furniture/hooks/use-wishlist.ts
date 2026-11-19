/**
 * useWishlist — smart wishlist hook
 *
 * - Authenticated users: synced to /api/wishlist (persistent across devices)
 * - Guests:              falls back to localStorage via useWishlistStore
 *
 * The API is identical either way, so no component needs to know which path
 * is active. Optimistic updates keep the UI instant.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useAuth } from "@/hooks/use-auth";
import {
  addWishlistItem,
  clearWishlist,
  fetchWishlist,
  removeWishlistItem,
} from "@/api/wishlist";
import { useWishlistStore } from "../store/furniture-store";

const WISHLIST_KEY = [api.wishlist.list.path];

export function useWishlist() {
  const { isAuthenticated } = useAuth();
  const local = useWishlistStore();
  const queryClient = useQueryClient();

  // ── Remote state (authenticated) ─────────────────────────────────────
  const { data: remoteIds = [], isLoading: remoteLoading } = useQuery<number[]>({
    queryKey: WISHLIST_KEY,
    queryFn: fetchWishlist,
    enabled:   isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });

  const addMutation = useMutation({
    mutationFn: addWishlistItem,
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_KEY });
      const prev = queryClient.getQueryData<number[]>(WISHLIST_KEY) ?? [];
      if (!prev.includes(productId)) {
        queryClient.setQueryData<number[]>(WISHLIST_KEY, [...prev, productId]);
      }
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(WISHLIST_KEY, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: WISHLIST_KEY }),
  });

  const removeMutation = useMutation({
    mutationFn: removeWishlistItem,
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_KEY });
      const prev = queryClient.getQueryData<number[]>(WISHLIST_KEY) ?? [];
      queryClient.setQueryData<number[]>(WISHLIST_KEY, prev.filter((id) => id !== productId));
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(WISHLIST_KEY, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: WISHLIST_KEY }),
  });

  const clearMutation = useMutation({
    mutationFn: clearWishlist,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_KEY });
      const prev = queryClient.getQueryData<number[]>(WISHLIST_KEY);
      queryClient.setQueryData(WISHLIST_KEY, []);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(WISHLIST_KEY, ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: WISHLIST_KEY }),
  });

  // ── Unified interface ─────────────────────────────────────────────────
  const items     = isAuthenticated ? remoteIds : local.items;
  const isLoading = isAuthenticated ? remoteLoading : false;

  const has = (productId: number) => items.includes(productId);

  const toggle = (productId: number) => {
    if (isAuthenticated) {
      if (has(productId)) {
        removeMutation.mutate(productId);
      } else {
        addMutation.mutate(productId);
      }
    } else {
      local.toggle(productId);
    }
  };

  const clear = () => {
    if (isAuthenticated) {
      clearMutation.mutate();
    } else {
      local.clear();
    }
  };

  return {
    items,
    isLoading,
    has,
    toggle,
    clear,
    count: items.length,
  };
}
