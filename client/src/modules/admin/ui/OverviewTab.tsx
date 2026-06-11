import { motion } from "framer-motion";
import { BarChart3, DollarSign, Package, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStats } from "../hooks/use-admin";
import { useFurniture } from "@/modules/furniture/hooks/use-furniture";
import { cn } from "@/lib/utils";

const MOCK_ORDERS = [
  { id: "SP-91823", customer: "Emma Wilson",  product: "Cosimo Lounge Chair", amount: 189000, status: "Processing" },
  { id: "SP-81723", customer: "James Carter", product: "Slab Dining Table",   amount: 345000, status: "Shipped"    },
  { id: "SP-71623", customer: "Sophie Tan",   product: "Nebula Pendant",      amount: 68000,  status: "Delivered"  },
  { id: "SP-61523", customer: "Luca Romano",  product: "Monolith Bed Frame",  amount: 285000, status: "Processing" },
  { id: "SP-51423", customer: "Mia Chen",     product: "Arch Floor Lamp",     amount: 52000,  status: "Delivered"  },
];

const STATUS_COLORS: Record<string, string> = {
  Delivered:  "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",
  Processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Shipped:    "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400",
};

export function OverviewTab() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: products, isLoading: productsLoading } = useFurniture();

  const kpiCards = stats
    ? [
        {
          label: "Total Products",
          value: stats.productCount,
          icon: Package,
          change: `${stats.outOfStock} out of stock`,
          up: stats.outOfStock === 0,
        },
        {
          label: "Registered Users",
          value: stats.userCount,
          icon: Users,
          change: "All time",
          up: true,
        },
        {
          label: "Inventory Value",
          value: `$${(stats.totalInventoryValue / 100).toLocaleString()}`,
          icon: DollarSign,
          change: "Total stock value",
          up: true,
        },
        {
          label: "Low Stock Alerts",
          value: stats.lowStock,
          icon: BarChart3,
          change: stats.lowStock > 0 ? "Needs attention" : "All good",
          up: stats.lowStock === 0,
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-mono uppercase tracking-widest text-accent mb-1">Dashboard</p>
        <h1 className="font-display text-3xl font-medium">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">Real-time inventory and store metrics.</p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {statsLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-sm" />
            ))
          : kpiCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="p-5 rounded-sm border border-border bg-card"
                data-testid={`stat-card-${i}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-sm bg-secondary/50">
                    <card.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className={cn(
                    "text-xs font-semibold flex items-center gap-0.5",
                    card.up ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"
                  )}>
                    {card.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {card.change}
                  </span>
                </div>
                <p className="font-display text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
              </motion.div>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Orders (mock) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3 rounded-sm border border-border bg-card overflow-hidden"
        >
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Recent Orders</h3>
            <span className="text-xs text-muted-foreground font-mono">Demo data</span>
          </div>
          <div className="divide-y divide-border">
            {MOCK_ORDERS.map((order) => (
              <div
                key={order.id}
                className="px-5 py-3.5 flex items-center gap-4 hover:bg-secondary/20 transition-colors"
                data-testid={`order-row-${order.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
                    <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider", STATUS_COLORS[order.status])}>
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

        {/* Inventory Quick View */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 rounded-sm border border-border bg-card overflow-hidden"
        >
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Inventory</h3>
            {stats && (
              <span className="text-xs text-muted-foreground font-mono">
                ${(stats.totalInventoryValue / 100).toLocaleString()}
              </span>
            )}
          </div>
          <div className="divide-y divide-border max-h-72 overflow-y-auto">
            {productsLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-sm shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </div>
                ))
              : products?.map((product) => (
                  <div
                    key={product.id}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-secondary/20 transition-colors"
                    data-testid={`inventory-row-${product.id}`}
                  >
                    <div className="h-8 w-8 shrink-0 rounded-sm overflow-hidden bg-secondary/30">
                      <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{product.name}</p>
                      <p className="text-[10px] text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={cn("text-xs font-bold",
                        product.stock === 0 ? "text-destructive" :
                        product.stock <= 5  ? "text-yellow-600 dark:text-yellow-400" :
                        "text-green-600 dark:text-green-400"
                      )}>
                        {product.stock === 0 ? "Out" : `${product.stock}`}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        ${(product.price / 100).toFixed(0)}
                      </p>
                    </div>
                  </div>
                ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
