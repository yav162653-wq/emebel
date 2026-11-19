import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { fetchLatestReviews, type LatestReview } from "@/api/reviews";

export function TestimonialsSection() {
  const { t } = useTranslation();
  const { data: latestReviews = [], isLoading: reviewsLoading } = useQuery<LatestReview[]>({
    queryKey: ["/api/reviews/latest"],
    queryFn: () => fetchLatestReviews(3),
  });

  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-mono uppercase tracking-widest text-accent mb-3">{t("landing.testimonialsTitle")}</p>
          <h2 className="font-display text-5xl font-medium">{t("product.reviewsTitle")}</h2>
        </motion.div>

        {reviewsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-2xl" />
            ))}
          </div>
        ) : latestReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {latestReviews.map((review, i) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
                className="p-7 rounded-2xl border border-border/60 bg-secondary/10 hover:border-accent/30 hover:bg-secondary/20 transition-all duration-300"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: review.rating }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground/80 leading-relaxed text-sm mb-5">"{review.body}"</p>
                <div>
                  <p className="text-xs font-semibold font-mono uppercase tracking-wider text-muted-foreground">
                    — {review.user.name}
                  </p>
                  {review.product && (
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">{review.product.name}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Star className="h-10 w-10 mx-auto mb-4 text-muted-foreground/20" />
            <p className="text-sm">{t("product.noReviews")}</p>
            <Link href="/register">
              <PremiumButton variant="outline" className="mt-6">{t("product.writeReview")}</PremiumButton>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
