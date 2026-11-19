import { Link } from "wouter";
import { useTranslation } from "react-i18next";

export function LandingFooter() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
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
          <a href="mailto:hello@spacefurniture.com" className="hover:text-foreground transition-colors">{t("landing.contact")}</a>
        </div>
      </div>
    </footer>
  );
}
