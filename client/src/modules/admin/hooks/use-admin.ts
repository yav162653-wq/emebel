import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  fetchAdminStats,
  fetchAdminUsers,
  updateAdminProduct,
  type AdminStats,
  type AdminUser,
} from "@/api/admin";

export function useAdminStats() {
  return useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: fetchAdminStats,
  });
}

export function useAdminUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: fetchAdminUsers,
  });
}

export function useAdminProductUpdate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      stock,
      price,
    }: { id: number; stock?: number; price?: number }) =>
      updateAdminProduct(id, { stock, price }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Product updated", description: "Changes saved successfully." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Could not update product." });
    },
  });
}
