import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFurniture, useFurnitureItem } from "@/modules/furniture/hooks/use-furniture";
import { useCart } from "@/modules/furniture/hooks/use-cart";
import { useWishlist } from "@/modules/furniture/hooks/use-wishlist";
import { useFurnitureStore } from "@/modules/furniture/store/furniture-store";
import { useRecentlyViewedStore } from "@/hooks/use-recently-viewed";
import { usePageTitle } from "@/hooks/use-page-title";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Eye, Heart, Minus, Package, Plus, RotateCcw,
  Shield, ShoppingBag, Star, Truck, MessageSquare, Check,
} from "lucide-react";
import { Link, useParams } from "wouter";
import { FurnitureCard } from "@/modules/furniture/ui/FurnitureCard";
import type { Review, ReviewSummary } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

// ── Star Rating Picker ────────────────────────────────────────────────────────
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          data-testid={`star-pick-${s}`}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "h-6 w-6 transition-colors",
              s <= (hovered || value)
                ? "fill-accent text-accent"
                : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ── Review Card ───────────────────────────────────────────────────────────────
function ReviewCard({ review }: { review: Review }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-sm border border-border bg-card space-y-2"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-accent">
              {review.user.name[0].toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold">{review.user.name}</p>
            <p className="text-[11px] text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={cn(
                "h-3.5 w-3.5",
                s <= review.rating ? "fill-accent text-accent" : "text-muted-foreground/20"
              )}
            />
          ))}
        </div>
      </div>
      {review.body && (
        <p className="text-sm text-foreground/80 leading-relaxed pl-11">{review.body}</p>
      )}
    </motion.div>
  );
}

// ── Reviews Section ───────────────────────────────────────────────────────────
function ReviewsSection({ productId }: { productId: number }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: summary } = useQuery<ReviewSummary>({
    queryKey: ["/api/reviews", productId, "summary"],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/${productId}/summary`);
      return res.json();
    },
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ["/api/reviews", productId],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/${productId}`);
      return res.json();
    },
  });

  const { data: myReview } = useQuery({
    queryKey: ["/api/reviews", productId, "mine"],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/${productId}/mine`);
      return res.json();
    },
    enabled: !!user,
  });

  // Pre-fill if user already has a review
  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setBody(myReview.body ?? "");
    }
  }, [myReview]);

  const submitReview = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/reviews/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, body: body.trim() || undefined }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews", productId] });
      setShowForm(false);
      toast({ title: myReview ? "Review updated" : "Review submitted", description: "Thank you for your feedback!", duration: 3000 });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Could not submit your review." });
    },
  });

  const avgStars = summary?.average ?? 0;
  const fullStars = Math.floor(avgStars);

  return (
    <section className="mt-20 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">{t("product.verifiedBuyers")}</p>
          <h2 className="font-display text-3xl font-medium">{t("product.reviewsTitle")}</h2>
        </div>

        {summary && summary.count > 0 && (
          <div className="text-right hidden sm:block">
            <div className="flex items-center gap-1 justify-end mb-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "h-4 w-4",
                    s <= fullStars ? "fill-accent text-accent" :
                    s === fullStars + 1 && avgStars % 1 >= 0.5 ? "fill-accent/50 text-accent" :
                    "text-muted-foreground/20"
                  )}
                />
              ))}
              <span className="ml-1.5 font-bold text-lg">{avgStars.toFixed(1)}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t("product.reviewCount", { count: summary.count })}</p>
          </div>
        )}
      </div>

      {/* Write a Review CTA */}
      {user && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          data-testid="button-write-review"
          className="flex items-center gap-2 text-sm font-medium text-accent hover:underline transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          {myReview ? t("product.editYourReview") : t("product.writeReview")}
        </button>
      )}

      {/* Review Form */}
      <AnimatePresence>
        {showForm && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 rounded-sm border border-accent/20 bg-accent/5 space-y-5">
              <h3 className="font-semibold">{myReview ? t("product.updateYourReview") : t("product.leaveReview")}</h3>

              <div className="space-y-1.5">
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{t("product.rating")}</p>
                <StarPicker value={rating} onChange={setRating} />
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  {t("product.commentOptional")}
                </p>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={t("product.shareExperience")}
                  data-testid="input-review-body"
                  className="resize-none h-24 bg-background"
                  maxLength={1000}
                />
              </div>

              <div className="flex gap-3">
                <PremiumButton
                  onClick={() => submitReview.mutate()}
                  isLoading={submitReview.isPending}
                  disabled={rating === 0}
                  data-testid="button-submit-review"
                >
                  <Check className="mr-2 h-4 w-4" />
                  {myReview ? t("product.updateReview") : t("product.submitReview")}
                </PremiumButton>
                <PremiumButton
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  data-testid="button-cancel-review"
                >
                  {t("product.cancel")}
                </PremiumButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login prompt */}
      {!user && (
        <p className="text-sm text-muted-foreground">
          <Link href="/login">
              <span className="text-accent underline cursor-pointer hover:no-underline">{t("auth.signIn")}</span>
          </Link>{" "}
          {t("product.loginToReviewHint")}
        </p>
      )}

      {/* Reviews List */}
      {reviewsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-sm" />)}
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-border rounded-sm">
          <Star className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{t("product.noReviewsShort")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
        </div>
      )}
    </section>
  );
}

// ── Color label → hex map (for swatch display) ───────────────────────────────
const COLOR_HEX: Record<string, string> = {
  "Walnut":         "#7C5C3A",
  "Onyx":           "#1C1C1E",
  "Slate":          "#6B7280",
  "Cream":          "#F0EBE0",
  "Natural Oak":    "#C4A98A",
  "Natural":        "#C4A98A",
  "White":          "#F5F5F5",
  "Ebonized":       "#1A1A1A",
  "Cognac":         "#9B4F1B",
  "Charcoal":       "#374151",
  "Honey":          "#D97706",
  "Bleached":       "#E8DCC8",
  "Stone Grey":     "#9CA3AF",
  "Matte Black":    "#1C1C1E",
  "Matte White":    "#F9F9F9",
  "Chrome":         "#C0C0C0",
  "Sand":           "#C2B280",
  "Fog":            "#B0B7C3",
  "Dusk":           "#8B7F9E",
  "Dune":           "#C4B597",
  "Stone":          "#9CA3AF",
  "Blush":          "#FBBF9A",
  "Ivory":          "#FFFFF0",
};

function getColorHex(colorName: string): string {
  const first = colorName.split("/")[0].trim();
  return COLOR_HEX[first] ?? "#9CA3AF";
}

// ── Main ProductDetail ────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const { data: product, isLoading } = useFurnitureItem(productId);
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
    queryFn: async () => {
      const res = await fetch(`/api/reviews/${productId}/summary`);
      return res.json();
    },
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
  }, [product]);

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

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(product.price / 100);

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const avgStars = summary?.average ?? 0;
  const reviewCount = summary?.count ?? 0;

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
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="aspect-[4/5] overflow-hidden rounded-sm bg-secondary/20 relative group">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
              />
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center rounded-full bg-background/85 backdrop-blur-sm border border-border/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                  {product.category}
                </span>
              </div>
              {isLowStock && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center rounded-full bg-accent/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-accent-foreground">
                    {t("product.onlyLeft", { count: product.stock })}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-7 lg:pt-4"
          >
            {/* Rating — real data */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "h-4 w-4",
                    reviewCount === 0
                      ? "text-muted-foreground/30"
                      : s <= Math.round(avgStars)
                      ? "fill-accent text-accent"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
              <span className="text-sm text-muted-foreground ml-1" data-testid="text-review-count">
                {reviewCount > 0
                  ? `${avgStars.toFixed(1)} (${t("product.reviewCount", { count: reviewCount })})`
                  : t("product.noReviewsShort")}
              </span>
            </div>

            {/* Title + Price */}
            <div className="space-y-2">
              <h1 data-testid="text-product-title"
                className="font-display text-4xl md:text-5xl font-medium tracking-tight leading-tight">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span data-testid="text-product-price"
                  className="font-mono text-3xl font-bold text-foreground">
                  {formattedPrice}
                </span>
                {isLowStock && (
                  <span className="text-sm font-medium text-accent">{t("product.onlyInStock", { count: product.stock })}</span>
                )}
                {isOutOfStock && (
                  <span className="text-sm font-medium text-destructive">{t("product.outOfStock")}</span>
                )}
              </div>
            </div>

            <div className="h-px bg-border" />

            <p className="text-foreground/80 leading-relaxed">{product.description}</p>

            {/* Specs — real data from DB */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: t("product.category"), value: product.category },
                { label: t("product.stock"),    value: isOutOfStock ? t("product.soldOut") : t("product.stockUnits", { count: product.stock }) },
                { label: t("product.material"), value: product.material },
                { label: t("product.warranty"), value: product.warranty },
                { label: t("product.assembly"), value: product.assembly },
                { label: t("product.origin"),   value: product.origin },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            <div className="h-px bg-border" />

            {/* Color / Finish Selector — real data from DB */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{t("product.finish")}</p>
                  <p className="text-sm font-semibold text-foreground truncate max-w-[160px]">{selectedColor}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      data-testid={`button-finish-${color.toLowerCase().replace(/\s+/g, "-")}`}
                      onClick={() => setSelectedColor(color)}
                      title={color}
                      className={cn(
                        "h-9 w-9 rounded-full border-2 transition-all duration-200 hover:scale-110 focus:outline-none",
                        selectedColor === color
                          ? "border-foreground ring-2 ring-offset-2 ring-foreground/30 scale-110"
                          : "border-border/60 hover:border-foreground/40"
                      )}
                      style={{ backgroundColor: getColorHex(color) }}
                      aria-label={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            {!isOutOfStock && (
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground shrink-0">{t("product.quantity")}</span>
                <div className="flex items-center border border-border rounded-sm">
                  <button
                    data-testid="button-qty-decrease"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="h-10 w-10 flex items-center justify-center hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span data-testid="text-qty"
                    className="h-10 w-12 flex items-center justify-center text-sm font-semibold border-x border-border">
                    {quantity}
                  </span>
                  <button
                    data-testid="button-qty-increase"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    className="h-10 w-10 flex items-center justify-center hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <PremiumButton
                data-testid="button-add-to-cart"
                onClick={() => {
                  addToCart({ productId: product.id, quantity });
                  setCartDrawerOpen(true);
                }}
                isLoading={isAdding}
                disabled={isOutOfStock}
                className="flex-1"
                size="lg"
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                {isOutOfStock ? t("product.outOfStock") : t("product.addToBag")}
              </PremiumButton>
              <PremiumButton
                data-testid="button-wishlist"
                variant="outline"
                size="lg"
                onClick={handleWishlist}
                className={isWishlisted ? "border-accent text-accent hover:bg-accent/5" : ""}
              >
                <Heart className={`h-4 w-4 transition-all ${isWishlisted ? "fill-accent scale-110" : ""}`} />
              </PremiumButton>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: t("product.freeDelivery"), sub: t("product.whiteGlove") },
                { icon: Shield, label: t("product.lifetimeWarranty"), sub: t("product.noAsterisks") },
                { icon: RotateCcw, label: t("product.thirtyDayReturns"), sub: t("product.hassleFree") },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center text-center gap-1.5 p-3 rounded-sm bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <Icon className="h-4 w-4 text-accent" />
                  <p className="text-[11px] font-semibold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
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
