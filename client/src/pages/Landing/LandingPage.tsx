import { Link } from "wouter";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { motion } from "framer-motion";
import { ArrowRight, Star, Truck, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <span className="font-display text-2xl font-bold tracking-tighter">SPACE.</span>
          <div className="flex gap-4">
            <Link href="/login">
              <PremiumButton variant="ghost" size="sm">Log In</PremiumButton>
            </Link>
            <Link href="/register">
              <PremiumButton size="sm">Get Started</PremiumButton>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background z-10" />
          {/* Using Unsplash image: Minimalist interior design */}
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
            <h1 className="font-display text-6xl md:text-8xl font-medium tracking-tight leading-[1.1]">
              Elevate Your <br/> Living Space
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Curated furniture for the modern minimalist. Designed with purpose, built to last, and delivered with care.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link href="/register">
              <PremiumButton size="lg" className="bg-white text-black hover:bg-white/90 shadow-2xl shadow-black/20">
                Shop Collection <ArrowRight className="ml-2 h-5 w-5" />
              </PremiumButton>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 bg-background">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { icon: Star, title: "Premium Quality", desc: "Hand-picked materials and expert craftsmanship." },
            { icon: Truck, title: "White Glove Delivery", desc: "We handle the heavy lifting, assembly, and cleanup." },
            { icon: Shield, title: "Lifetime Warranty", desc: "We stand behind everything we sell, forever." },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="text-center space-y-4 p-8 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors duration-300"
            >
              <div className="inline-flex p-4 rounded-full bg-primary/5 text-primary mb-2">
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Image */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto rounded-3xl overflow-hidden relative aspect-[21/9]">
          {/* Unsplash: Artisan furniture detail */}
          <img 
            src="https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?auto=format&fit=crop&q=80&w=2000" 
            alt="Craftsmanship" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="text-center text-white max-w-2xl space-y-6 p-6">
              <h2 className="font-display text-5xl font-medium">Defined by Detail</h2>
              <p className="text-lg opacity-90">Every curve, joint, and finish is considered. We believe furniture should be as functional as it is beautiful.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 bg-primary text-primary-foreground text-center">
        <p className="font-mono text-sm opacity-60">© 2024 SPACE FURNITURE. DESIGNED FOR THE FUTURE.</p>
      </footer>
    </div>
  );
}
