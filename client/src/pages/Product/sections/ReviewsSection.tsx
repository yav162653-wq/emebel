import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Check, MessageSquare, Star } from "lucide-react";
import { Link } from "wouter";
import type { Review, ReviewSummary } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  fetchMyReview,
  fetchReviews,
  fetchReviewSummary,
  submitReview as submitReviewRequest,
} from "@/api/reviews";

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

export function ReviewsSection({ productId }: { productId: number }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: summary } = useQuery<ReviewSummary>({
    queryKey: ["/api/reviews", productId, "summary"],
    queryFn: () => fetchReviewSummary(productId),
  });

  const { data: reviews = [], isLoading: reviewsLoading, isError: reviewsError } = useQuery<Review[]>({
    queryKey: ["/api/reviews", productId],
    queryFn: () => fetchReviews(productId),
  });

  const { data: myReview, isError: myReviewError } = useQuery({
    queryKey: ["/api/reviews", productId, "mine"],
    queryFn: () => fetchMyReview(productId),
    enabled: !!user,
  });

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setBody(myReview.body ?? "");
    }
  }, [myReview]);

  const submitReview = useMutation({
    mutationFn: () =>
      submitReviewRequest(productId, rating, body.trim() || undefined),
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

      {user && myReviewError && (
        <p className="text-sm text-destructive">{t("common.error")}</p>
      )}

      {user && !showForm && !myReviewError && (
        <button
          onClick={() => setShowForm(true)}
          data-testid="button-write-review"
          className="flex items-center gap-2 text-sm font-medium text-accent hover:underline transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          {myReview ? t("product.editYourReview") : t("product.writeReview")}
        </button>
      )}

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

      {!user && (
        <p className="text-sm text-muted-foreground">
          <Link href="/login">
              <span className="text-accent underline cursor-pointer hover:no-underline">{t("auth.signIn")}</span>
          </Link>{" "}
          {t("product.loginToReviewHint")}
        </p>
      )}

      {reviewsLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-sm" />)}
        </div>
      ) : reviewsError ? (
        <p className="py-12 text-center text-sm text-destructive">{t("common.error")}</p>
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
