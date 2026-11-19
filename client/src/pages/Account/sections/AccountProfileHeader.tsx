import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { cn } from "@/lib/utils";

interface AccountProfileHeaderProps {
  displayName?: string;
  username?: string;
  role?: string;
  ordersLoading: boolean;
  ordersError: boolean;
  ordersCount: number;
  wishlistCount: number;
  wishlistLoading: boolean;
  wishlistError: boolean;
  totalSpent: number;
  onLogout: () => void;
}

export function AccountProfileHeader({
  displayName,
  username,
  role,
  ordersLoading,
  ordersError,
  ordersCount,
  wishlistCount,
  wishlistLoading,
  wishlistError,
  totalSpent,
  onLogout,
}: AccountProfileHeaderProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10"
    >
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ring-4 ring-primary/10">
        <span className="text-3xl font-bold text-primary uppercase">
          {(displayName || username || "U").charAt(0)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="font-display text-3xl font-medium">{displayName}</h1>
          <span className={cn(
            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
            role === "admin" ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"
          )}>
            {role === "admin" ? t("common.admin") : t("common.user")}
          </span>
        </div>
        <p className="text-muted-foreground text-sm mt-1">@{username}</p>
        <div className="flex gap-6 mt-3">
          <div className="text-center">
            <p className="font-bold text-foreground">
              {ordersLoading || ordersError ? "—" : ordersCount}
            </p>
            <p className="text-xs text-muted-foreground">{t("account.totalOrders")}</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground">
              {wishlistLoading || wishlistError ? "—" : wishlistCount}
            </p>
            <p className="text-xs text-muted-foreground">{t("account.wishlistItems")}</p>
          </div>
          <div className="text-center">
            <p className="font-bold text-foreground">
              {ordersLoading || ordersError ? "—" : `$${(totalSpent / 100).toFixed(0)}`}
            </p>
            <p className="text-xs text-muted-foreground">{t("account.totalSpent")}</p>
          </div>
        </div>
      </div>
      <PremiumButton
        variant="ghost" size="sm"
        onClick={onLogout}
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        data-testid="button-logout"
      >
        <LogOut className="mr-2 h-4 w-4" /> {t("account.logout")}
      </PremiumButton>
    </motion.div>
  );
}
