import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Product } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { apiFetch } from "@/api/http";

export function FeaturedProductsSection() {
  const { t } = useTranslation();
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { limit: 4 }],
    queryFn: async () => {
      const res = await apiFetch("/api/products?limit=4");
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
  });
  const featuredProducts = products?.slice(0, 4) ?? [];

  return (
    <section className="py-28 bg-background">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-xs font-mono uppercase tracking-[0.25em] text-accent mb-3">{t("landing.collectionsLabel")}</p>
            <h2 className="font-display text-5xl md:text-6xl font-medium tracking-tight">{t("landing.featuredTitle")}</h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link href="/register">
              <PremiumButton variant="outline" data-testid="button-view-all">
                {t("landing.viewAll")} <ArrowRight className="ml-2 h-4 w-4" />
              </PremiumButton>
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {productsLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[3/4] w-full rounded-sm" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            : featuredProducts.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="group cursor-pointer"
                >
                  <Link href="/register">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-secondary/20 mb-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                          {[
                            t("landing.tagBestSeller"),
                            t("landing.tagLimited"),
                            t("landing.tagNew"),
                            t("landing.tagEditorsPick"),
                          ][i % 4]}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-medium group-hover:text-accent transition-colors">{item.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.category}</p>
                      </div>
                      <span className="font-mono text-sm font-bold shrink-0">
                        ${(item.price / 100).toLocaleString()}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))
          }
        </div>
      </div>
    </section>
  );
}
