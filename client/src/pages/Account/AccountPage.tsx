import { useAuth } from "@/hooks/use-auth";
import { useWishlistStore } from "@/modules/furniture/store/furniture-store";
import { useFurniture } from "@/modules/furniture/hooks/use-furniture";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft, Heart, LogOut, Package, Settings, ShoppingBag, Star, Trash2, User,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const MOCK_ORDERS = [
  { id: "SP-38291", date: "May 18, 2025", status: "Delivered", total: 28900, items: 2 },
  { id: "SP-27183", date: "Apr 3, 2025", status: "Processing", total: 112000, items: 1 },
  { id: "SP-19042", date: "Feb 22, 2025", status: "Delivered", total: 52000, items: 3 },
];

const STATUS_COLORS: Record<string, string> = {
  Delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Shipped: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { items: wishlistIds, toggle, count } = useWishlistStore();
  const { data: products } = useFurniture();
  const [, setLocation] = useLocation();

  const wishlistProducts = products?.filter((p) => wishlistIds.includes(p.id)) ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/shop">
            <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Shop
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
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                user?.role === "admin"
                  ? "bg-accent/15 text-accent"
                  : "bg-secondary text-muted-foreground"
              }`}>
                {user?.role}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mt-1">@{user?.username}</p>
            <div className="flex gap-6 mt-3">
              <div className="text-center">
                <p className="font-bold text-foreground">{MOCK_ORDERS.length}</p>
                <p className="text-xs text-muted-foreground">Orders</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">{count()}</p>
                <p className="text-xs text-muted-foreground">Wishlist</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-foreground">$1,929</p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </div>
            </div>
          </div>
          <PremiumButton
            variant="ghost"
            size="sm"
            onClick={() => { logout(); setLocation("/"); }}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </PremiumButton>
        </motion.div>

        <Tabs defaultValue="orders">
          <TabsList className="bg-secondary/40 rounded-sm mb-8">
            <TabsTrigger value="orders" className="rounded-sm gap-2">
              <Package className="h-4 w-4" /> Orders ({MOCK_ORDERS.length})
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="rounded-sm gap-2">
              <Heart className="h-4 w-4" /> Wishlist ({count()})
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-sm gap-2">
              <Settings className="h-4 w-4" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            {MOCK_ORDERS.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No orders yet</p>
              </div>
            ) : (
              MOCK_ORDERS.map((order, i) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="p-5 rounded-sm border border-border bg-card hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="font-mono text-sm font-semibold">{order.id}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[order.status]}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{order.date} · {order.items} item{order.items > 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono font-bold text-foreground">${(order.total / 100).toFixed(2)}</p>
                      <button className="text-xs text-accent hover:underline mt-1">View Details</button>
                    </div>
                  </div>
                  {order.status === "Delivered" && (
                    <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-3.5 w-3.5 ${s <= 5 ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">Rate this order</span>
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
                <p className="font-medium">Your wishlist is empty</p>
                <p className="text-sm mt-1">Heart items in the shop to save them here.</p>
                <Link href="/shop">
                  <PremiumButton size="sm" className="mt-6">Browse Shop</PremiumButton>
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
                  >
                    <div className="aspect-[4/3] bg-secondary/20 overflow-hidden">
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-medium text-sm leading-snug">{product.name}</p>
                        <span className="font-mono text-sm font-bold shrink-0">${(product.price / 100).toFixed(0)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                      <div className="flex gap-2 pt-1">
                        <Link href={`/product/${product.id}`} className="flex-1">
                          <PremiumButton size="sm" className="w-full text-xs">View Item</PremiumButton>
                        </Link>
                        <button
                          onClick={() => toggle(product.id)}
                          className="p-2 rounded-sm border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
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
              <h3 className="font-semibold text-foreground">Profile Information</h3>
              <div className="space-y-3">
                {[
                  { label: "Full Name", value: user?.name || "" },
                  { label: "Username", value: user?.username || "" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{field.label}</label>
                    <input
                      className="mt-1.5 w-full h-11 px-3 text-sm bg-secondary/30 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-ring/30"
                      defaultValue={field.value}
                    />
                  </div>
                ))}
              </div>
              <PremiumButton size="sm" variant="outline">Save Changes</PremiumButton>
            </div>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Preferences</h3>
              <div className="space-y-3">
                {[
                  { label: "Order confirmation emails", checked: true },
                  { label: "New arrivals newsletter", checked: false },
                  { label: "Exclusive member offers", checked: true },
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
