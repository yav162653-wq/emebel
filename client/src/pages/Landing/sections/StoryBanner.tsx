import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PremiumButton } from "@/shared/components/PremiumButton";

export function StoryBanner() {
  const { t } = useTranslation();

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto overflow-hidden rounded-3xl relative">
        <div className="aspect-[21/8] relative overflow-hidden">
          <motion.img
            src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=2000"
            alt="Craftsmanship"
            className="w-full h-full object-cover"
            whileInView={{ scale: 1 }}
            initial={{ scale: 1.1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent flex items-center">
            <div className="text-white max-w-lg space-y-5 p-10 md:p-16">
              <motion.p
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.7 }}
                className="font-mono text-xs uppercase tracking-widest text-white/40"
              >
                {t("landing.ourStory")}
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1 }}
                className="font-display text-4xl md:text-5xl font-medium leading-tight"
              >
                {t("landing.collectionsDesc")}
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Link href="/register">
                  <PremiumButton className="bg-white text-black hover:bg-white/90">
                    {t("landing.exploreCollection")} <ArrowRight className="ml-2 h-4 w-4" />
                  </PremiumButton>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
