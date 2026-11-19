import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Star, Truck } from "lucide-react";
import { useTranslation } from "react-i18next";

export function FeaturesSection() {
  const { t } = useTranslation();
  const featuresRef = useRef<HTMLElement>(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });

  return (
    <section ref={featuresRef} className="py-24 px-6 bg-secondary/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <p className="text-xs font-mono uppercase tracking-widest text-accent mb-3">{t("landing.heroEyebrow")}</p>
            <h2 className="font-display text-5xl font-medium">{t("landing.collectionsTitle")}</h2>
          </motion.div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Star, title: t("landing.qualityTitle"), desc: t("landing.qualityDesc") },
            { icon: Truck, title: t("landing.deliveryTitle"), desc: t("landing.deliveryDesc") },
            { icon: Shield, title: t("landing.warrantyTitle"), desc: t("landing.warrantyDesc") },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={featuresInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="group p-8 rounded-2xl bg-background hover:shadow-lg transition-all duration-500 space-y-4 border border-border/50 hover:border-accent/30"
            >
              <div className="inline-flex p-3 rounded-xl bg-accent/10 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors duration-300">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
