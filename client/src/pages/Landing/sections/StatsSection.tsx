import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { fetchPublicStats, type PublicStats } from "@/api/landing";

export function StatsSection() {
  const { t } = useTranslation();
  const { data: stats } = useQuery<PublicStats>({
    queryKey: ["/api/stats"],
    queryFn: fetchPublicStats,
  });

  const dynamicStats = [
    { value: stats ? `${stats.productCount}+` : "—", label: t("product.category") },
    { value: stats ? `${stats.reviewCount}+` : "—", label: t("product.reviewsTitle") },
    { value: stats ? `${stats.orderCount}+` : "—", label: t("account.totalOrders") },
    { value: "∞", label: t("landing.warrantyLabel") },
  ];

  return (
    <section className="py-20 px-6 bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {dynamicStats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
          >
            <p className="font-display text-5xl font-bold" data-testid={`stat-value-${i}`}>{stat.value}</p>
            <p className="text-primary-foreground/80 text-xs font-mono uppercase tracking-widest mt-2">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
