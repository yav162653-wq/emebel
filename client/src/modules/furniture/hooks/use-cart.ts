import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type CartListResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useCart() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = [api.cart.list.path];

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(api.cart.list.path);
      if (!res.ok) {
        if (res.status === 401) return [];
        throw new Error("Failed to fetch cart");
      }
      return await res.json() as CartListResponse;
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity?: number }) => {
      const res = await fetch(api.cart.add.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: quantity ?? 1 }),
      });
      if (!res.ok) throw new Error("Failed to add to cart");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Added to Cart", description: "Item successfully added." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Could not add item. Please log in." });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      const res = await fetch(`/api/cart/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error("Failed to update quantity");
      if (res.status === 204) return null;
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Could not update quantity." });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (id: number) => {
      const url = api.cart.remove.path.replace(":id", String(id));
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ description: "Item removed from cart" });
    },
  });

  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return {
    items,
    isLoading,
    total,
    addToCart: addToCartMutation.mutate,
    isAdding: addToCartMutation.isPending,
    updateQuantity: updateQuantityMutation.mutate,
    isUpdating: updateQuantityMutation.isPending,
    removeFromCart: removeFromCartMutation.mutate,
    isRemoving: removeFromCartMutation.isPending,
  };
}
