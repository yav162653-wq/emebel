import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { fetchFurnitureItem, fetchFurnitureCollection } from "@/api/products";

export function useFurniture() {
  return useQuery({
    queryKey: [api.products.list.path],
    queryFn: () => fetchFurnitureCollection(),
  });
}

export function useFurnitureItem(id: number) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: () => fetchFurnitureItem(id),
  });
}
