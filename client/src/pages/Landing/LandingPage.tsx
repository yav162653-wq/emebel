import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { useTheme } from "@/app/providers/ThemeProvider";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { ArrowRight, Moon, Star, Sun, Truck, Shield, Zap } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import type { Product } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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

type LatestReview = {
  id: number;
  rating: number;
  body: string | null;
  createdAt: string;
  user: { id: number; name: string; username: string };
  product: { id: number; name: string };
};

type PublicStats = {
  productCount: number;
  reviewCount: number;
  orderCount: number;
};

export default function LandingPage() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  const featuresRef = useRef<HTMLElement>(null);
  const featuresInView = useInView(featuresRef, { once: true, margin: "-100px" });

  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: latestReviews = [], isLoading: reviewsLoading } = useQuery<LatestReview[]>({
    queryKey: ["/api/reviews/latest"],
    queryFn: async () => {
      const res = await fetch("/api/reviews/latest?limit=3");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: stats } = useQuery<PublicStats>({
    queryKey: ["/api/stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) return { productCount: 0, reviewCount: 0, orderCount: 0 };
      return res.json();
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (emailAddr: string) =>
      apiRequest("POST", "/api/newsletter", { email: emailAddr }),
    onSuccess: () => {
      setSubscribed(true);
      setEmail("");
      toast({ title: "You're in!", description: "Welcome to the Designer Club.", duration: 4000 });
    },
    onError: (err: any) => {
      const msg = err?.message?.includes("409") ? "This email is already subscribed." : "Could not subscribe. Try again.";
      toast({ variant: "destructive", title: "Subscription failed", description: msg });
    },
  });

  const featuredProducts = products?.slice(0, 4) ?? [];
  const TAG_LABELS = ["Best Seller", "Limited", "New", "Editor's Pick"];

  const dynamicStats = [
    { value: stats?.productCount ? `${stats.productCount}+` : "24+", label: t("product.category") },
    { value: stats?.reviewCount ? `${stats.reviewCount}+` : "0",  label: t("product.reviewsTitle") },
    { value: stats?.orderCount  ? `${stats.orderCount}+`  : "0",  label: t("account.totalOrders") },
    { value: "∞",                                                  label: t("landing.warrantyLabel") },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="font-display text-2xl font-bold tracking-tighter"
          >
            SPACE.
          </motion.span>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex gap-2 items-center"
          >
            <LanguageSwitcher />
            <button
              data-testid="button-landing-theme-toggle"
              onClick={toggleTheme}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link href="/login">
              <PremiumButton variant="ghost" size="sm" data-testid="button-login">Log In</PremiumButton>
            </Link>
            <Link href="/register">
              <PremiumButton size="sm" data-testid="button-get-started">{t("landing.shopNow")}</PremiumButton>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* ── HERO ── */}
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
            {["Elevate", "Your", "Living", "Space"].map((word, i) => (
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
                Sign In
              </PremiumButton>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <span className="text-white/30 text-[10px] font-mono uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent"
          />
        </motion.div>
      </section>

      {/* ── MARQUEE STRIP ── */}
      <div className="bg-primary text-primary-foreground py-3 overflow-hidden">
        <motion.div
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          className="flex gap-8 whitespace-nowrap"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="flex items-center gap-8 text-xs font-mono uppercase tracking-widest opacity-70">
              <span>Free White-Glove Delivery</span>
              <span className="text-primary-foreground/30">✦</span>
              <span>Lifetime Warranty</span>
              <span className="text-primary-foreground/30">✦</span>
              <span>30-Day Returns</span>
              <span className="text-primary-foreground/30">✦</span>
              <span>Studio Crafted</span>
              <span className="text-primary-foreground/30">✦</span>
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── FEATURED PRODUCTS ── */}
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
                            {TAG_LABELS[i % TAG_LABELS.length]}
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

      {/* ── FEATURES ── */}
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
              { icon: Star,   title: "Premium Quality",      desc: "Hand-picked materials and expert craftsmanship from studios around the world." },
              { icon: Truck,  title: "White Glove Delivery", desc: "We handle heavy lifting, assembly, placement, and cleanup. Zero stress for you." },
              { icon: Shield, title: "Lifetime Warranty",    desc: "We stand behind everything we sell, forever. No asterisks, no fine print." },
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

      {/* ── REVIEWS ── */}
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

      {/* ── CINEMATIC BANNER ── */}
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

      {/* ── STATS ── */}
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
              <p className="text-primary-foreground/50 text-xs font-mono uppercase tracking-widest mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── NEWSLETTER CTA ── */}
      <section className="py-32 px-6 bg-background text-center">
        <div className="max-w-2xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-accent mb-4">{t("landing.newsletterTitle")}</p>
            <h2 className="font-display text-6xl font-medium tracking-tight">Ready to Elevate?</h2>
            <p className="text-muted-foreground leading-relaxed mt-4">
              {t("landing.newsletterDesc")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            {subscribed ? (
              <div className="flex items-center justify-center gap-2 text-accent font-medium text-sm py-3 px-6 rounded-full border border-accent/30 bg-accent/5 w-fit mx-auto">
                <Zap className="h-4 w-4" />
                You're in the club! Watch your inbox.
              </div>
            ) : (
              <div className="flex gap-2 max-w-sm mx-auto">
                <Input
                  type="email"
                  placeholder={t("landing.newsletterPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && email && subscribeMutation.mutate(email)}
                  className="h-11 rounded-sm bg-secondary/20"
                  data-testid="input-newsletter-email"
                />
                <PremiumButton
                  onClick={() => email && subscribeMutation.mutate(email)}
                  isLoading={subscribeMutation.isPending}
                  disabled={!email}
                  data-testid="button-newsletter-join"
                >
                  {t("landing.newsletterCta")}
                </PremiumButton>
              </div>
            )}

            <div className="flex gap-4 justify-center flex-wrap mt-4">
              <Link href="/register">
                <PremiumButton size="lg">
                  {t("landing.exploreCollection")} <ArrowRight className="ml-2 h-5 w-5" />
                </PremiumButton>
              </Link>
              <Link href="/login">
                <PremiumButton size="lg" variant="outline">Sign In</PremiumButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-2xl font-bold tracking-tighter">SPACE.</span>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            © {currentYear} Space Furniture. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <Link href="/shop">
              <span className="hover:text-foreground transition-colors cursor-pointer">{t("wishlist.shop")}</span>
            </Link>
            <Link href="/login">
              <span className="hover:text-foreground transition-colors cursor-pointer">{t("nav.myAccount")}</span>
            </Link>
            <a href="mailto:hello@spacefurniture.com" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
