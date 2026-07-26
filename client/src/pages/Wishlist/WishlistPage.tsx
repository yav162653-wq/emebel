import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Trash2, ArrowLeft, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useWishlist } from "@/modules/furniture/hooks/use-wishlist";
import { useFurniture } from "@/modules/furniture/hooks/use-furniture";
import { useCart } from "@/modules/furniture/hooks/use-cart";
import { useFurnitureStore } from "@/modules/furniture/store/furniture-store";
import { usePageTitle } from "@/hooks/use-page-title";
import { useToast } from "@/hooks/use-toast";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@shared/schema";

function WishlistCard({ product, index }: { product: Product; index: number }) {
  const { t } = useTranslation();
  const { toggle } = useWishlist();
  const { addToCart, isAdding } = useCart();
  const { setCartDrawerOpen } = useFurnitureStore();
  const { toast } = useToast();

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(product.price / 100);

  const isOutOfStock = product.stock === 0;

  const handleRemove = () => {
    toggle(product.id);
    toast({
      title: t("wishlist.removedFromWishlist"),
      description: product.name,
      duration: 2000,
    });
  };

  const handleAddToCart = () => {
    addToCart({ productId: product.id, quantity: 1 });
    setCartDrawerOpen(true);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05, duration: 0.3, layout: { duration: 0.25 } }}
      data-testid={`wishlist-card-${product.id}`}
      className="group relative flex flex-col"
    >
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-secondary/20 mb-4 cursor-pointer">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700"
          />
          <div className="absolute top-3 left-3">
            <span className="px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-[10px] font-semibold uppercase tracking-wider border border-border/40">
              {product.category}
            </span>
          </div>
          {isOutOfStock && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <span className="text-sm font-semibold text-muted-foreground">{t("wishlist.soldOut")}</span>
            </div>
          )}
          <button
            onClick={(e) => { e.preventDefault(); handleRemove(); }}
            data-testid={`button-remove-wishlist-${product.id}`}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/90 backdrop-blur-sm border border-border/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:border-destructive/40"
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" />
          </button>
        </div>
      </Link>

      <div className="flex-1 flex flex-col gap-1.5">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-display text-base font-medium leading-snug hover:text-accent transition-colors cursor-pointer line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <p className="font-mono text-sm font-bold text-foreground">{formattedPrice}</p>
      </div>

      <div className="mt-4 flex gap-2">
        <PremiumButton
          size="sm"
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAdding}
          data-testid={`button-wishlist-add-cart-${product.id}`}
          className="flex-1 text-xs"
        >
          <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
          {isOutOfStock ? t("wishlist.soldOut") : t("wishlist.addToBag")}
        </PremiumButton>
        <button
          onClick={handleRemove}
          data-testid={`button-remove-mobile-${product.id}`}
          className="h-9 w-9 shrink-0 flex items-center justify-center rounded-sm border border-border hover:border-destructive/40 hover:bg-destructive/5 transition-colors"
        >
          <Heart className="h-4 w-4 fill-accent text-accent" />
        </button>
      </div>
    </motion.div>
  );
}

export default function WishlistPage() {
  const { t } = useTranslation();
  usePageTitle(t("wishlist.title"));
  const { items: wishlistIds, clear, isLoading: wishlistLoading } = useWishlist();
  const { data: allProducts, isLoading: productsLoading } = useFurniture();
  const isLoading = productsLoading || wishlistLoading;
  const { toast } = useToast();

  const wishlisted = allProducts?.filter((p) => wishlistIds.includes(p.id)) ?? [];

  const handleClearAll = () => {
    clear();
    toast({ title: t("wishlist.wishlistCleared"), duration: 2000 });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/shop">
              <button className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                {t("wishlist.shop")}
              </button>
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{t("wishlist.title")}</span>
          </div>
          {wishlisted.length > 0 && (
            <button
              onClick={handleClearAll}
              data-testid="button-clear-wishlist"
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              {t("wishlist.clearAll")}
            </button>
          )}
        </div>
      </div>

      <div className="container py-12">
        <div className="mb-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">{t("wishlist.savedItems")}</p>
              <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight">
                {t("wishlist.title")}
              </h1>
              {!isLoading && (
                <p className="text-muted-foreground mt-2 text-sm">
                  {wishlisted.length > 0
                    ? t(wishlisted.length === 1 ? "wishlist.pieceSaved" : "wishlist.piecesSaved", { count: wishlisted.length })
                    : t("wishlist.nothingSaved")}
                </p>
              )}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/5] w-full rounded-sm" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && wishlisted.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 gap-6 text-center"
          >
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-secondary/50 flex items-center justify-center">
                <Heart className="h-12 w-12 text-muted-foreground/20" />
              </div>
              <Sparkles className="h-5 w-5 text-accent absolute -top-1 -right-1" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-2xl font-medium">{t("wishlist.emptyTitle")}</h2>
              <p className="text-muted-foreground text-sm max-w-xs">{t("wishlist.emptyDesc")}</p>
            </div>
            <Link href="/shop">
              <PremiumButton size="lg" data-testid="button-explore-shop">
                {t("wishlist.exploreCollection")}
              </PremiumButton>
            </Link>
          </motion.div>
        )}

        {!isLoading && wishlisted.length > 0 && (
          <motion.div layout className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            <AnimatePresence mode="popLayout">
              {wishlisted.map((product, i) => (
                <WishlistCard key={product.id} product={product} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!isLoading && wishlisted.length > 0 && (
          <div className="mt-16 pt-10 border-t text-center">
            <p className="text-muted-foreground text-sm mb-4">{t("wishlist.findMore")}</p>
            <Link href="/shop">
              <PremiumButton variant="outline" data-testid="button-continue-shopping">
                {t("wishlist.continueShopping")}
              </PremiumButton>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
