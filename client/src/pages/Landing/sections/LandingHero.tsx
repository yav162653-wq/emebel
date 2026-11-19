import { useRef } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PremiumButton } from "@/shared/components/PremiumButton";

function AnimatedWord({ word, delay }: { word: string; delay: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 60, rotateX: -40 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className="inline-block"
    >
      {word}&nbsp;
    </motion.span>
  );
}

export function LandingHero() {
  const { t } = useTranslation();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
      <motion.div className="absolute inset-0 z-0" style={{ scale: heroScale }}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-background z-10"
          style={{ opacity: heroOpacity }}
        />
        <img
          src="https://images.unsplash.com/photo-1595514020180-8c240a39d78c?auto=format&fit=crop&q=80&w=2000"
          alt="Minimalist Living Room"
          className="h-full w-full object-cover"
        />
      </motion.div>

      <motion.div
        className="relative z-20 max-w-5xl mx-auto px-6 text-center text-white"
        style={{ y: heroY }}
      >
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.5em" }}
          animate={{ opacity: 1, letterSpacing: "0.3em" }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="text-xs font-mono uppercase text-white/50 mb-8 tracking-[0.3em]"
        >
          Space Furniture — Est. 2025
        </motion.p>

        <div className="font-display text-6xl md:text-8xl font-medium tracking-tight leading-[1.05] mb-8 overflow-hidden"
          style={{ perspective: "1000px" }}>
          {t("landing.heroTitle").split("\n").flatMap((line) => line.split(" ")).map((word, i) => (
            <AnimatedWord key={word} word={word} delay={0.3 + i * 0.12} />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto font-light leading-relaxed mb-10"
        >
          {t("landing.heroDesc")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="flex gap-4 justify-center flex-wrap"
        >
          <Link href="/register">
            <PremiumButton
              size="lg"
              className="bg-white text-black hover:bg-white/90 shadow-2xl shadow-black/30"
              data-testid="button-hero-shop"
            >
              {t("landing.exploreCollection")} <ArrowRight className="ml-2 h-5 w-5" />
            </PremiumButton>
          </Link>
          <Link href="/login">
            <PremiumButton size="lg" variant="ghost" className="text-white border-white/30 hover:bg-white/10">
              {t("landing.signIn")}
            </PremiumButton>
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
      >
        <span className="text-white/30 text-[10px] font-mono uppercase tracking-widest">{t("landing.scroll")}</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent"
        />
      </motion.div>
    </section>
  );
}
