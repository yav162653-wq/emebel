import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { fetchFurnitureItem, fetchFurnitureCollection } from "@/api/products";

export type FurnitureFilters = {
  limit?: number;
  category?: string;
  search?: string;
};

export function useFurniture(filters: FurnitureFilters = {}) {
  const limit = filters.limit ?? 100;
  const query = useInfiniteQuery({
    queryKey: [
      api.products.list.path,
      { limit, category: filters.category, search: filters.search },
    ],
    queryFn: ({ pageParam }) => fetchFurnitureCollection({
      limit,
      cursor: pageParam,
      category: filters.category,
      search: filters.search,
    }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  return {
    ...query,
    data: query.data?.pages.flatMap((page) => page.items),
    total: query.data?.pages[0]?.total,
  };
}

export function useFurnitureItem(id: number) {
  return useQuery({
    queryKey: [api.products.get.path, id],
    queryFn: () => fetchFurnitureItem(id),
  });
}
