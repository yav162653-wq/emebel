import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export function LandingMarquee() {
  const { t } = useTranslation();

  return (
    <div className="bg-primary text-primary-foreground py-3 overflow-hidden">
      <motion.div
        animate={{ x: ["0%", "-50%"] }}
        transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
        className="flex gap-8 whitespace-nowrap"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="flex items-center gap-8 text-xs font-mono uppercase tracking-widest opacity-70">
            <span>{t("landing.freeWhiteGloveDelivery")}</span>
            <span className="text-primary-foreground/30">✦</span>
            <span>{t("landing.lifetimeWarranty")}</span>
            <span className="text-primary-foreground/30">✦</span>
            <span>{t("landing.thirtyDayReturns")}</span>
            <span className="text-primary-foreground/30">✦</span>
            <span>{t("landing.studioCrafted")}</span>
            <span className="text-primary-foreground/30">✦</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
