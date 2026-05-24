import { Link } from "wouter";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { useTheme } from "@/app/providers/ThemeProvider";
import { motion } from "framer-motion";
import { ArrowRight, Moon, Star, Sun, Truck, Shield } from "lucide-react";

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <span className="font-display text-2xl font-bold tracking-tighter">SPACE.</span>
          <div className="flex gap-3 items-center">
            <button
              data-testid="button-landing-theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Link href="/login">
              <PremiumButton variant="ghost" size="sm" data-testid="button-login">
                Log In
              </PremiumButton>
            </Link>
            <Link href="/register">
              <PremiumButton size="sm" data-testid="button-get-started">
                Get Started
              </PremiumButton>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-background z-10" />
          <img
            src="https://images.unsplash.com/photo-1595514020180-8c240a39d78c?auto=format&fit=crop&q=80&w=2000"
            alt="Minimalist Living Room"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="relative z-20 max-w-5xl mx-auto px-6 text-center text-white space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-white/60 mb-6">
              Space Furniture — Est. 2025
            </p>
            <h1 className="font-display text-6xl md:text-8xl font-medium tracking-tight leading-[1.05]">
              Elevate Your <br /> Living Space
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Curated furniture for the modern minimalist. Designed with purpose, built to last.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Link href="/register">
              <PremiumButton
                size="lg"
                className="bg-white text-black hover:bg-white/90 shadow-2xl shadow-black/20"
                data-testid="button-hero-shop"
              >
                Shop the Collection <ArrowRight className="ml-2 h-5 w-5" />
              </PremiumButton>
            </Link>
            <Link href="/login">
              <PremiumButton
                size="lg"
                variant="ghost"
                className="text-white border-white/30 hover:bg-white/10"
                data-testid="button-hero-signin"
              >
                Sign In
              </PremiumButton>
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        >
          <span className="text-white/40 text-xs font-mono uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent"
          />
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-mono uppercase tracking-widest text-accent mb-3">Why Space</p>
            <h2 className="font-display text-4xl md:text-5xl font-medium">Built Different</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Star, title: "Premium Quality", desc: "Hand-picked materials and expert craftsmanship from studios around the world." },
              { icon: Truck, title: "White Glove Delivery", desc: "We handle the heavy lifting, assembly, placement, and cleanup. Zero stress." },
              { icon: Shield, title: "Lifetime Warranty", desc: "We stand behind everything we sell, forever. No asterisks." },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="group p-8 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 space-y-4"
              >
                <div className="inline-flex p-3 rounded-xl bg-accent/10 text-accent group-hover:bg-accent/15 transition-colors">
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Craftsmanship Banner */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden relative aspect-[21/9]">
          <img
            src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=2000"
            alt="Craftsmanship"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent flex items-center">
            <div className="text-white max-w-lg space-y-6 p-12">
              <p className="font-mono text-xs uppercase tracking-widest text-white/50">Philosophy</p>
              <h2 className="font-display text-4xl md:text-5xl font-medium leading-tight">
                Defined by Detail
              </h2>
              <p className="text-white/70 leading-relaxed">
                Every curve, joint, and finish is considered. We believe furniture should be as
                functional as it is beautiful — and as lasting as the memories made around it.
              </p>
              <Link href="/register">
                <PremiumButton className="bg-white text-black hover:bg-white/90 mt-2">
                  Explore Craft <ArrowRight className="ml-2 h-4 w-4" />
                </PremiumButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-20 px-6 bg-secondary/20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "14+", label: "Collections" },
            { value: "98%", label: "Satisfaction Rate" },
            { value: "60+", label: "Countries Shipped" },
            { value: "∞", label: "Year Warranty" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="space-y-2"
            >
              <p className="font-display text-4xl font-bold text-foreground">{stat.value}</p>
              <p className="text-muted-foreground text-sm font-mono uppercase tracking-wider">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-2xl font-bold tracking-tighter">SPACE.</span>
          <p className="font-mono text-xs opacity-50 uppercase tracking-widest">
            © 2025 Space Furniture. Designed for the future.
          </p>
          <div className="flex gap-6 text-xs opacity-60">
            <a href="#" className="hover:opacity-100 transition-opacity">Privacy</a>
            <a href="#" className="hover:opacity-100 transition-opacity">Terms</a>
            <a href="#" className="hover:opacity-100 transition-opacity">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
