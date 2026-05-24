import { useState } from "react";
import { HeroHeader } from "./sections/HeroHeader";
import { HeroProducts } from "./sections/HeroProducts";
import { motion } from "framer-motion";

const CATEGORIES = ["All", "Seating", "Tables", "Lighting", "Storage", "Bedroom"];

export default function HeroPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <div className="min-h-screen bg-background">
      <HeroHeader />

      <main className="container py-12 space-y-16">
        <section>
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">
                Collection 2025
              </p>
              <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight">
                {activeCategory === "All" ? "New Arrivals" : activeCategory}
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">
                Discover our curated collection of premium furniture.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <motion.button
                  key={cat}
                  data-testid={`filter-${cat.toLowerCase()}`}
                  onClick={() => setActiveCategory(cat)}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          </div>

          <HeroProducts activeCategory={activeCategory} />
        </section>

        {/* Newsletter / Club CTA */}
        <section className="relative overflow-hidden bg-primary rounded-2xl p-12 md:p-16 text-center space-y-6">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-white blur-3xl" />
          </div>
          <div className="relative">
            <p className="text-xs font-mono uppercase tracking-widest text-primary-foreground/60 mb-3">
              Designer Club
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-medium text-primary-foreground">
              Exclusive Access Awaits
            </h2>
            <p className="max-w-md mx-auto text-primary-foreground/70 mt-3 text-sm leading-relaxed">
              Early drops, limited editions, and personalized design consultation — reserved for members.
            </p>
            <div className="flex max-w-sm mx-auto gap-2 mt-8">
              <input
                type="email"
                placeholder="your@email.com"
                data-testid="input-newsletter-email"
                className="flex-1 px-4 py-2.5 rounded-md text-sm bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30"
              />
              <button
                data-testid="button-newsletter-subscribe"
                className="px-5 py-2.5 bg-primary-foreground text-primary rounded-md font-semibold text-sm hover:bg-primary-foreground/90 transition-colors"
              >
                Join
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 mt-16">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-xl font-bold tracking-tighter text-foreground">SPACE.</span>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            © 2025 Space Furniture. Designed for the future.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Shipping</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
