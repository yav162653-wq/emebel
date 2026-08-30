import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6 max-w-md"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary/50 mb-2">
          <PackageSearch className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-accent">Error 404</p>
          <h1 className="font-display text-5xl font-medium tracking-tight">{t("common.pageNotFound")}</h1>
          <p className="text-muted-foreground leading-relaxed">
            {t("common.pageNotFoundDesc")}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <PremiumButton variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.goHome")}
            </PremiumButton>
          </Link>
          <Link href="/shop">
            <PremiumButton>{t("common.browseShop")}</PremiumButton>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
