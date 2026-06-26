import { HeroHeader } from "./sections/HeroHeader";
import { HeroProducts } from "./sections/HeroProducts";
import { usePageTitle } from "@/hooks/use-page-title";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function HeroPage() {
  usePageTitle("Shop");
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const newsletterMutation = useMutation({
    mutationFn: (email: string) =>
      apiRequest("POST", "/api/newsletter", { email }),
    onSuccess: () => {
      toast({ title: "Welcome to the club!", description: "You're on the list for early access and exclusive drops.", duration: 4000 });
      setEmail("");
    },
    onError: () => {
      toast({ title: "Already subscribed", description: "This email is already on the list.", variant: "destructive", duration: 3000 });
    },
  });

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    newsletterMutation.mutate(email.trim());
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroHeader />

      <main className="container py-12 space-y-20">
        <HeroProducts />

        {/* Newsletter CTA */}
        <section className="relative overflow-hidden bg-primary rounded-2xl p-12 md:p-16 text-center space-y-6">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          </div>
          <div className="relative">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-primary-foreground/50 mb-3">
              Designer Club
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-medium text-primary-foreground">
              Exclusive Access Awaits
            </h2>
            <p className="max-w-md mx-auto text-primary-foreground/60 mt-3 text-sm leading-relaxed">
              Early drops, limited editions, and personalized design consultation — reserved for members.
            </p>
            <form onSubmit={handleNewsletter} className="flex max-w-sm mx-auto gap-2 mt-8">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                data-testid="input-newsletter-email-shop"
                required
                className="flex-1 px-4 py-2.5 rounded-sm text-sm bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:ring-2 focus:ring-primary-foreground/30"
              />
              <button
                type="submit"
                disabled={newsletterMutation.isPending}
                data-testid="button-newsletter-subscribe-shop"
                className="px-5 py-2.5 bg-primary-foreground text-primary rounded-sm font-semibold text-xs uppercase tracking-wider hover:bg-primary-foreground/90 transition-colors disabled:opacity-60"
              >
                {newsletterMutation.isPending ? "…" : "Join"}
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t mt-20">
        <div className="container py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <span className="font-display text-xl font-bold tracking-tighter">SPACE.</span>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest text-center">
            © {new Date().getFullYear()} Space Furniture. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            {["Privacy", "Terms", "Shipping", "Returns"].map((link) => (
              <a key={link} href="#" className="hover:text-foreground transition-colors">{link}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
