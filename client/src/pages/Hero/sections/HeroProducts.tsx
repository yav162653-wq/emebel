import { useFurniture } from "@/modules/furniture/hooks/use-furniture";
import { FurnitureCard } from "@/modules/furniture/ui/FurnitureCard";
import { Skeleton } from "@/components/ui/skeleton";

export function HeroProducts() {
  const { data: products, isLoading } = useFurniture();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-[4/5] w-full rounded-sm" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
      {products?.map((product, index) => (
        <FurnitureCard key={product.id} product={product} index={index} />
      ))}
    </div>
  );
}
