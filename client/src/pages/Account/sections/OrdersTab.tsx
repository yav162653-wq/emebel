import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Package, Star } from "lucide-react";
import type { Order } from "@shared/schema";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  Delivered:  "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",
  Processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Shipped:    "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

function getStatusLabel(status: string, t: (key: string) => string) {
  const labels: Record<string, string> = {
    Delivered: "account.delivered",
    Processing: "account.processing",
    Shipped: "account.shipped",
    Pending: "account.pending",
    Cancelled: "account.cancelled",
  };
  return labels[status] ? t(labels[status]) : status;
}

interface OrdersTabProps {
  orders: Order[];
  isLoading: boolean;
}

export function OrdersTab({ orders, isLoading }: OrdersTabProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-sm" />
        ))}
      </>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
        <p className="font-medium">{t("account.noOrders")}</p>
        <p className="text-sm mt-1">{t("account.noOrdersDesc")}</p>
        <Link href="/shop">
          <PremiumButton size="sm" className="mt-6">{t("account.shopNow")}</PremiumButton>
        </Link>
      </div>
    );
  }

  return (
    <>
      {orders.map((order, i) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="p-5 rounded-sm border border-border bg-card hover:border-primary/30 transition-colors"
          data-testid={`order-card-${order.id}`}
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <div className="flex items-center gap-3 flex-wrap">
                <p className="font-mono text-sm font-semibold">
                  SP-{String(order.id).padStart(5, "0")}
                </p>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", STATUS_COLORS[order.status] ?? STATUS_COLORS.Processing)}>
                  {getStatusLabel(order.status, t)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDate(order.createdAt)} · {order.items.length} {t("account.items").toLowerCase()}
              </p>
              <div className="flex gap-1.5 mt-2">
                {order.items.slice(0, 4).map((item) => (
                  <div key={item.id} className="h-8 w-8 rounded-sm overflow-hidden bg-secondary/30 shrink-0">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                ))}
                {order.items.length > 4 && (
                  <div className="h-8 w-8 rounded-sm bg-secondary/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                    +{order.items.length - 4}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono font-bold text-foreground">${(order.total / 100).toFixed(2)}</p>
            </div>
          </div>
          {order.status === "Delivered" && (
            <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-accent text-accent" />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{t("product.writeReview")}</span>
            </div>
          )}
        </motion.div>
      ))}
    </>
  );
}
