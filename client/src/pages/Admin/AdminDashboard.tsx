import { useFurniture } from "@/modules/furniture/hooks/use-furniture";
import { useAuth } from "@/hooks/use-auth";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft, ArrowUpRight, BarChart3, DollarSign, Eye, Package,
  ShoppingBag, Sparkles, TrendingUp, Users,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const STAT_CARDS = [
  { label: "Total Revenue", value: "$48,290", change: "+12.5%", icon: DollarSign, up: true },
  { label: "Active Orders", value: "38", change: "+4 this week", icon: ShoppingBag, up: true },
  { label: "Customers", value: "1,204", change: "+8.2%", icon: Users, up: true },
  { label: "Avg. Order", value: "$1,271", change: "-2.1%", icon: TrendingUp, up: false },
];

const RECENT_ORDERS = [
  { id: "SP-91823", customer: "Emma Wilson", product: "Cosimo Lounge Chair", amount: 189000, status: "Processing" },
  { id: "SP-81723", customer: "James Carter", product: "Slab Dining Table", amount: 345000, status: "Shipped" },
  { id: "SP-71623", customer: "Sophie Tan", product: "Nebula Pendant", amount: 68000, status: "Delivered" },
  { id: "SP-61523", customer: "Luca Romano", product: "Monolith Bed Frame", amount: 285000, status: "Processing" },
  { id: "SP-51423", customer: "Mia Chen", product: "Arch Floor Lamp", amount: 52000, status: "Delivered" },
];

const STATUS_COLORS: Record<string, string> = {
  Delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Shipped: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: products, isLoading } = useFurniture();
  const [, setLocation] = useLocation();

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Eye className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="font-display text-3xl font-medium">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
          <p className="text-xs font-mono text-muted-foreground/60">Login as nasa_admin to access the dashboard.</p>
          <Link href="/shop"><PremiumButton>Back to Shop</PremiumButton></Link>
        </div>
      </div>
    );
  }

  const totalProducts = products?.length ?? 0;
  const lowStockProducts = products?.filter((p) => p.stock <= 5 && p.stock > 0) ?? [];
  const outOfStock = products?.filter((p) => p.stock === 0) ?? [];
  const totalInventoryValue = products?.reduce((sum, p) => sum + p.price * p.stock, 0) ?? 0;

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
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold tracking-tighter">SPACE.</span>
            <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-bold uppercase tracking-wider">
              Admin
            </span>
          </div>
          <div className="w-28" />
        </div>
      </header>

      <div className="container py-10 space-y-10">
        {/* Page Title */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-xs font-mono uppercase tracking-widest text-accent mb-2">Dashboard</p>
          <h1 className="font-display text-4xl font-medium">Welcome, {user.name?.split(" ")[0]}</h1>
          <p className="text-muted-foreground mt-1 text-sm">Here's what's happening with your store today.</p>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-5 rounded-sm border border-border bg-card hover:border-primary/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-sm bg-secondary/50">
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className={`text-xs font-semibold flex items-center gap-0.5 ${card.up ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                  {card.change}
                </span>
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Inventory Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Total Products", value: totalProducts, icon: Package, color: "text-primary" },
            { label: "Low Stock Items", value: lowStockProducts.length, icon: BarChart3, color: "text-yellow-600" },
            { label: "Out of Stock", value: outOfStock.length, icon: Sparkles, color: "text-destructive" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-center gap-4 p-5 rounded-sm border border-border bg-card"
            >
              <div className={`p-3 rounded-sm bg-secondary/40`}>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-3 rounded-sm border border-border bg-card overflow-hidden"
          >
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Recent Orders</h3>
              <button className="text-xs text-accent hover:underline flex items-center gap-1">
                View all <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {RECENT_ORDERS.map((order) => (
                <div key={order.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-secondary/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate mt-0.5">{order.product}</p>
                    <p className="text-xs text-muted-foreground">{order.customer}</p>
                  </div>
                  <span className="font-mono text-sm font-semibold shrink-0">
                    ${(order.amount / 100).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Product Inventory */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 rounded-sm border border-border bg-card overflow-hidden"
          >
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Inventory</h3>
              <span className="text-xs text-muted-foreground font-mono">
                Value: ${(totalInventoryValue / 100).toFixed(0)}
              </span>
            </div>
            <div className="divide-y divide-border max-h-80 overflow-y-auto scrollbar-thin">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-sm" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </div>
                ))
              ) : (
                products?.map((product) => (
                  <div key={product.id} className="px-5 py-3 flex items-center gap-3 hover:bg-secondary/20 transition-colors">
                    <div className="h-8 w-8 shrink-0 rounded-sm overflow-hidden bg-secondary/30">
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{product.name}</p>
                      <p className="text-[10px] text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-bold ${
                        product.stock === 0 ? "text-destructive" :
                        product.stock <= 5 ? "text-yellow-600 dark:text-yellow-400" :
                        "text-green-600 dark:text-green-400"
                      }`}>
                        {product.stock === 0 ? "Out" : `${product.stock} left`}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">${(product.price / 100).toFixed(0)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
