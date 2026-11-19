import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PremiumButton } from "@/shared/components/PremiumButton";

export function NewsletterSection() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const subscribeMutation = useMutation({
    mutationFn: async (emailAddr: string) =>
      apiRequest("POST", "/api/newsletter", { email: emailAddr }),
    onSuccess: () => {
      setSubscribed(true);
      setEmail("");
      toast({ title: "You're in!", description: "Welcome to the Designer Club.", duration: 4000 });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "";
      const msg = message.includes("409") ? "This email is already subscribed." : "Could not subscribe. Try again.";
      toast({ variant: "destructive", title: "Subscription failed", description: msg });
    },
  });

  return (
    <section className="py-32 px-6 bg-background text-center">
      <div className="max-w-2xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-accent mb-4">{t("landing.newsletterTitle")}</p>
          <h2 className="font-display text-6xl font-medium tracking-tight">{t("landing.readyToElevate")}</h2>
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
              {t("landing.clubSuccess")}
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
              <PremiumButton size="lg" variant="outline">{t("landing.signIn")}</PremiumButton>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
