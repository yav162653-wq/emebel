import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useWishlistStore } from "@/modules/furniture/store/furniture-store";
import { useFurniture } from "@/modules/furniture/hooks/use-furniture";
import { usePageTitle } from "@/hooks/use-page-title";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Heart, LogOut, Package, Settings, Star, Trash2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order } from "@shared/schema";
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

export default function AccountPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { items: wishlistIds, toggle, count } = useWishlistStore();
  const { data: products } = useFurniture();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  usePageTitle(t("account.title"));

  const [name, setName] = useState(user?.name || "");

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/my"],
    queryFn: async () => {
      const res = await fetch("/api/orders/my");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: t("account.saveChanges"), description: t("account.fullName") + " updated." });
    },
    onError: () => {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.retry") });
    },
  });

  const wishlistProducts = products?.filter((p) => wishlistIds.includes(p.id)) ?? [];
  const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

  const handleRemoveWishlist = (id: number, name: string) => {
    toggle(id);
    toast({ title: t("wishlist.removedFromWishlist"), description: name, duration: 2000 });
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      Delivered:  t("account.delivered"),
      Processing: t("account.processing"),
      Shipped:    t("account.shipped"),
      Pending:    t("account.pending"),
      Cancelled:  t("account.cancelled"),
    };
    return map[status] || status;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/shop">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> {t("product.backToShop")}
            </button>
          </Link>
          <span className="font-display text-xl font-bold tracking-tighter">SPACE.</span>
          <div className="w-24" />
        </div>
      </header>

      <div className="container py-10 max-w-4xl">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10"
        >
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0 ring-4 ring-primary/10">
            <span className="text-3xl font-bold text-primary uppercase">
              {(user?.name || user?.username || "U").charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display text-3xl font-medium">{user?.name || user?.username}</h1>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                user?.role === "admin" ? "bg-accent/15 text-accent" : "bg-secondary text-muted-foreground"
              )}>
                {user?.role === "admin" ? t("common.admin") : t("common.user")}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-1">@{user?.username}</p>
            <div className="flex gap-6 mt-3">
              <div className="text-center">
                <p className="font-bold text-foreground">{ordersLoading ? "—" : orders.length}</p>
                <p className="text-xs text-muted-foreground">{t("account.totalOrders")}</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">{count()}</p>
                <p className="text-xs text-muted-foreground">{t("account.wishlistItems")}</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">
                  {ordersLoading ? "—" : `$${(totalSpent / 100).toFixed(0)}`}
                </p>
                <p className="text-xs text-muted-foreground">{t("account.totalSpent")}</p>
              </div>
            </div>
          </div>
          <PremiumButton
            variant="ghost" size="sm"
            onClick={() => { logout(); setLocation("/"); }}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            data-testid="button-logout"
          >
            <LogOut className="mr-2 h-4 w-4" /> {t("account.logout")}
          </PremiumButton>
        </motion.div>

        <Tabs defaultValue="orders">
          <TabsList className="bg-secondary/40 rounded-sm mb-8">
            <TabsTrigger value="orders" className="rounded-sm gap-2" data-testid="tab-orders">
              <Package className="h-4 w-4" /> {t("account.orders")} ({ordersLoading ? "…" : orders.length})
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="rounded-sm gap-2" data-testid="tab-wishlist">
              <Heart className="h-4 w-4" /> {t("account.wishlist")} ({count()})
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-sm gap-2" data-testid="tab-settings">
              <Settings className="h-4 w-4" /> {t("account.profile")}
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            {ordersLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-sm" />
              ))
            ) : orders.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">{t("account.noOrders")}</p>
                <p className="text-sm mt-1">{t("account.noOrdersDesc")}</p>
                <Link href="/shop">
                  <PremiumButton size="sm" className="mt-6">{t("account.shopNow")}</PremiumButton>
                </Link>
              </div>
            ) : (
              orders.map((order, i) => (
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
                          {statusLabel(order.status)}
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
              ))
            )}
          </TabsContent>

          {/* Wishlist Tab */}
          <TabsContent value="wishlist">
            {wishlistProducts.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">{t("wishlist.emptyTitle")}</p>
                <p className="text-sm mt-1">{t("wishlist.emptyDesc")}</p>
                <Link href="/shop">
                  <PremiumButton size="sm" className="mt-6">{t("landing.shopNow")}</PremiumButton>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistProducts.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="group relative rounded-sm border border-border bg-card overflow-hidden"
                    data-testid={`wishlist-item-${product.id}`}
                  >
                    <div className="aspect-[4/3] bg-secondary/20 overflow-hidden">
                      <img
                        src={product.image} alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-medium text-sm leading-snug">{product.name}</p>
                        <span className="font-mono text-sm font-bold shrink-0">${(product.price / 100).toFixed(0)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                      <div className="flex gap-2 pt-1">
                        <Link href={`/product/${product.id}`} className="flex-1">
                          <PremiumButton size="sm" className="w-full text-xs">{t("account.viewOrder")}</PremiumButton>
                        </Link>
                        <button
                          onClick={() => handleRemoveWishlist(product.id, product.name)}
                          className="p-2 rounded-sm border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
                          data-testid={`button-remove-wishlist-${product.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="max-w-lg space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">{t("account.profile")}</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("account.fullName")}</label>
                  <Input
                    className="mt-1.5 h-11 bg-secondary/30"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="input-profile-name"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("account.username")}</label>
                  <Input
                    className="mt-1.5 h-11 bg-secondary/30 opacity-60 cursor-not-allowed"
                    value={user?.username || ""}
                    disabled
                  />
                </div>
              </div>
              <PremiumButton
                size="sm"
                isLoading={updateProfileMutation.isPending}
                onClick={() => updateProfileMutation.mutate(name)}
                data-testid="button-save-profile"
                disabled={name === user?.name || !name.trim()}
              >
                {t("account.saveChanges")}
              </PremiumButton>
            </div>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">{t("account.overview")}</h3>
              <div className="space-y-3">
                {[
                  { label: "Order confirmation emails",  checked: true  },
                  { label: "New arrivals newsletter",    checked: false },
                  { label: "Exclusive member offers",    checked: true  },
                ].map((pref) => (
                  <label key={pref.label} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      defaultChecked={pref.checked}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground group-hover:text-accent transition-colors">{pref.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
