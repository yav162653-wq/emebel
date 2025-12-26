import { useQuery } from "@tanstack/react-query";
import { api, type Product } from "@shared/routes";

export function useFurniture() {
  return useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await fetch(api.products.list.path);
      if (!res.ok) throw new Error("Failed to fetch furniture collection");
      return await res.json() as Product[];
    },
  });
}

export function useFurnitureItem(id: number) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: async () => {
      const url = api.products.get.path.replace(':id', String(id));
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch item details");
      return await res.json() as Product;
    },
  });
}
