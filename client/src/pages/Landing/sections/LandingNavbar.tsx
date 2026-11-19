import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { useTheme } from "@/app/providers/ThemeProvider";
import { LanguageSwitcher } from "@/shared/components/LanguageSwitcher";

export function LandingNavbar() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
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
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            type="button"
            className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <Link href="/login">
            <PremiumButton variant="ghost" size="sm" data-testid="button-login">{t("landing.logIn")}</PremiumButton>
          </Link>
          <Link href="/register">
            <PremiumButton size="sm" data-testid="button-get-started">{t("landing.shopNow")}</PremiumButton>
          </Link>
        </motion.div>
      </div>
    </nav>
  );
}
