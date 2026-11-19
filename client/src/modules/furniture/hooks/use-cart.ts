import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import {
  addCartItem,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from "@/api/cart";
import { useToast } from "@/hooks/use-toast";

export function useCart() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = [api.cart.list.path];

  const { data: items = [], isLoading } = useQuery({
    queryKey,
    queryFn: fetchCart,
  });

  const addToCartMutation = useMutation({
    mutationFn: addCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Added to Cart", description: "Item successfully added." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Could not add item. Please log in." });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: updateCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Could not update quantity." });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: removeCartItem,
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
