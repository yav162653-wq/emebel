import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFurniture, useFurnitureItem } from "@/modules/furniture/hooks/use-furniture";
import { useCart } from "@/modules/furniture/hooks/use-cart";
import { useWishlist } from "@/modules/furniture/hooks/use-wishlist";
import { useFurnitureStore } from "@/modules/furniture/store/furniture-store";
import { useRecentlyViewedStore } from "@/hooks/use-recently-viewed";
import { usePageTitle } from "@/hooks/use-page-title";
import { useToast } from "@/hooks/use-toast";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Eye, Package } from "lucide-react";
import { Link, useParams } from "wouter";
import { FurnitureCard } from "@/modules/furniture/ui/FurnitureCard";
import type { ReviewSummary } from "@shared/schema";
import { useTranslation } from "react-i18next";
import { ProductGallery } from "./sections/ProductGallery";
import { ProductInformation } from "./sections/ProductInformation";
import { ReviewsSection } from "./sections/ReviewsSection";
import { fetchReviewSummary } from "@/api/reviews";
import { QueryErrorState } from "@/shared/components/QueryErrorState";

export default function ProductDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { data: product, isLoading, isError, refetch } = useFurnitureItem(productId);
  const { data: allProducts } = useFurniture();
  const { addToCart, isAdding } = useCart();
  const { has, toggle } = useWishlist();
  const { setCartDrawerOpen } = useFurnitureStore();
  const { add: addRecentlyViewed, ids: recentIds } = useRecentlyViewedStore();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>("");

  const { data: summary } = useQuery<ReviewSummary>({
    queryKey: ["/api/reviews", productId, "summary"],
    queryFn: () => fetchReviewSummary(productId),
    enabled: !!productId,
  });

  usePageTitle(product?.name);

  useEffect(() => {
    if (product) {
      addRecentlyViewed(product.id);
      if (product.colors && product.colors.length > 0 && !selectedColor) {
        setSelectedColor(product.colors[0]);
      }
    }
  }, [product, addRecentlyViewed, selectedColor]);

  const isWishlisted = product ? has(product.id) : false;

  const relatedProducts = allProducts
    ?.filter((p) => p.category === product?.category && p.id !== product?.id)
    .slice(0, 4) ?? [];

  const recentlyViewed = allProducts
    ?.filter((p) => recentIds.includes(p.id) && p.id !== product?.id)
    .sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id))
    .slice(0, 4) ?? [];

  const handleWishlist = () => {
    if (!product) return;
    toggle(product.id);
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Saved to wishlist",
      description: product.name,
      duration: 2000,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <Skeleton className="h-6 w-32 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <Skeleton className="aspect-[4/5] w-full rounded-sm" />
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product && isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <QueryErrorState onRetry={refetch} className="py-16" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Package className="h-16 w-16 text-muted-foreground/30 mx-auto" />
          <h2 className="font-display text-3xl font-medium">{t("product.productNotFound")}</h2>
          <p className="text-muted-foreground">{t("product.removedOrMissing")}</p>
          <Link href="/shop"><PremiumButton>{t("common.backToShop")}</PremiumButton></Link>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b">
        <div className="container py-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/shop">
            <button className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Shop
            </button>
          </Link>
          <span>/</span>
          <span>{product.category}</span>
          <span>/</span>
          <span className="text-foreground font-medium truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
          <ProductGallery product={product} isLowStock={isLowStock} />
          <ProductInformation
            product={product}
            summary={summary}
            quantity={quantity}
            setQuantity={setQuantity}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
            isAdding={isAdding}
            isOutOfStock={isOutOfStock}
            isLowStock={isLowStock}
            isWishlisted={isWishlisted}
            onAddToCart={() => {
              addToCart({ productId: product.id, quantity });
              setCartDrawerOpen(true);
            }}
            onWishlist={handleWishlist}
          />
        </div>

        {/* Reviews */}
        <ReviewsSection productId={productId} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-24 space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">{t("product.relatedLabel")}</p>
                <h2 className="font-display text-3xl font-medium">{t("product.moreIn", { category: product.category })}</h2>
              </div>
              <Link href="/shop">
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  {t("product.viewAll")}
                </button>
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
              {relatedProducts.map((p, i) => (
                <FurnitureCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <section className="mt-20 space-y-8">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-2xl font-medium">{t("product.recentlyViewed")}</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
              {recentlyViewed.map((p, i) => (
                <FurnitureCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
