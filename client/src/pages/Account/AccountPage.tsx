import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useWishlist } from "@/modules/furniture/hooks/use-wishlist";
import { useFurniture } from "@/modules/furniture/hooks/use-furniture";
import { usePageTitle } from "@/hooks/use-page-title";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Heart, Package, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Order } from "@shared/schema";
import { AccountProfileHeader } from "./sections/AccountProfileHeader";
import { OrdersTab } from "./sections/OrdersTab";
import { WishlistTab } from "./sections/WishlistTab";
import { AccountSettingsTab } from "./sections/AccountSettingsTab";
import { QueryErrorState } from "@/shared/components/QueryErrorState";
import { fetchMyOrders } from "@/api/commerce";
import { requestAccountLink, updateProfile } from "@/api/account";

export default function AccountPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const {
    items: wishlistIds,
    toggle,
    count,
    isLoading: wishlistLoading,
    isError: wishlistError,
    refetch: refetchWishlist,
  } = useWishlist();
  const {
    data: products,
    isError: productsError,
    refetch: refetchProducts,
  } = useFurniture();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  usePageTitle(t("account.title"));

  const [name, setName] = useState(user?.name || "");
  const [authEmail, setAuthEmail] = useState(user?.email || "");

  const {
    data: orders = [],
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useQuery<Order[]>({
    queryKey: ["/api/orders/my"],
    queryFn: fetchMyOrders,
  });

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({ title: t("account.saveChanges"), description: t("account.fullName") + " updated." });
    },
    onError: () => {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.retry") });
    },
  });

  const accountLinkMutation = useMutation({
    mutationFn: requestAccountLink,
    onSuccess: () => {
      toast({
        title: t("account.emailVerificationSent"),
        description: t("account.checkEmailToVerify"),
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: error.message,
      });
    },
  });

  const wishlistProducts = products?.filter((p) => wishlistIds.includes(p.id)) ?? [];
  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
  const wishlistDataError = wishlistError || productsError;
  const retryWishlistData = async () => {
    const retries = [];
    if (wishlistError) retries.push(refetchWishlist());
    if (productsError) retries.push(refetchProducts());
    await Promise.all(retries);
  };

  const handleRemoveWishlist = (id: number, productName: string) => {
    toggle(id);
    toast({ title: t("wishlist.removedFromWishlist"), description: productName, duration: 2000 });
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
        <AccountProfileHeader
          displayName={user?.name || user?.username || undefined}
          username={user?.username || undefined}
          role={user?.role}
          ordersLoading={ordersLoading}
          ordersError={ordersError}
          ordersCount={orders.length}
          wishlistCount={count}
          wishlistLoading={wishlistLoading || !products}
          wishlistError={wishlistDataError}
          totalSpent={totalSpent}
          onLogout={() => { logout(); setLocation("/"); }}
        />

        <Tabs defaultValue="orders">
          <TabsList className="bg-secondary/40 rounded-sm mb-8">
            <TabsTrigger value="orders" className="rounded-sm gap-2" data-testid="tab-orders">
              <Package className="h-4 w-4" /> {t("account.orders")} (
                {ordersLoading ? "…" : ordersError ? "—" : orders.length}
              )
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="rounded-sm gap-2" data-testid="tab-wishlist">
              <Heart className="h-4 w-4" /> {t("account.wishlist")} ({count})
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-sm gap-2" data-testid="tab-settings">
              <Settings className="h-4 w-4" /> {t("account.profile")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            {ordersError ? (
              <QueryErrorState onRetry={refetchOrders} className="py-12" />
            ) : (
              <OrdersTab orders={orders} isLoading={ordersLoading} />
            )}
          </TabsContent>

          <TabsContent value="wishlist">
            {wishlistDataError ? (
              <QueryErrorState
                onRetry={retryWishlistData}
                className="py-12"
              />
            ) : (
              <WishlistTab products={wishlistProducts} onRemove={handleRemoveWishlist} />
            )}
          </TabsContent>

          <TabsContent value="settings" className="max-w-lg space-y-6">
            <AccountSettingsTab
              name={name}
              fullName={user?.name || ""}
              username={user?.username || ""}
              email={authEmail}
              emailVerified={!!user?.emailVerified}
              isSaving={updateProfileMutation.isPending}
              isSendingVerification={accountLinkMutation.isPending}
              onNameChange={setName}
              onEmailChange={setAuthEmail}
              onSave={() => updateProfileMutation.mutate(name)}
              onSendVerification={() => accountLinkMutation.mutate(authEmail.trim())}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
