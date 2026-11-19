import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Package, Search, X } from "lucide-react";
import { api, type AdminOrder, type OrderStatus } from "@shared/routes";
import { fetchAdminOrders, updateAdminOrderStatus } from "@/api/admin";
import { QueryErrorState } from "@/shared/components/QueryErrorState";

const STATUSES = ["All", "Processing", "Shipped", "Delivered"] as const;
type StatusFilter = typeof STATUSES[number];

const STATUS_STYLE: Record<string, string> = {
  Processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  Shipped:    "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400",
  Delivered:  "bg-green-100  text-green-800  dark:bg-green-900/30  dark:text-green-400",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function OrdersTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [search, setSearch] = useState("");

  const { data: orders = [], isLoading, isError, refetch } = useQuery<AdminOrder[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: fetchAdminOrders,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: OrderStatus }) =>
      updateAdminOrderStatus(id, status),
    onSuccess: (updated) => {
      queryClient.setQueryData<AdminOrder[]>(["/api/admin/orders"], (old = []) =>
        old.map((o) => (o.id === updated.id ? updated : o))
      );
      toast({ title: "Status updated", description: `Order SP-${String(updated.id).padStart(5, "0")} → ${updated.status}`, duration: 2500 });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Update failed", description: "Please try again." });
    },
  });

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    const q = search.toLowerCase().trim();
    const matchSearch = !q ||
      o.user.name.toLowerCase().includes(q) ||
      (o.user.username ?? "").toLowerCase().includes(q) ||
      `SP-${String(o.id).padStart(5, "0")}`.includes(q);
    return matchStatus && matchSearch;
  });

  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const processingCount = orders.filter(o => o.status === "Processing").length;
  const shippedCount = orders.filter(o => o.status === "Shipped").length;

  if (isError) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-medium">Orders</h1>
        <QueryErrorState onRetry={refetch} className="py-16" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-medium">Orders</h1>
        <p className="text-muted-foreground text-sm mt-1">{orders.length} total orders</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue",  value: `$${(totalRevenue / 100).toLocaleString()}`, sub: "All time"        },
          { label: "Total Orders",   value: orders.length,                                sub: "Placed"          },
          { label: "Processing",     value: processingCount,                              sub: "Needs fulfillment"},
          { label: "Shipped",        value: shippedCount,                                 sub: "In transit"      },
        ].map((kpi) => (
          <div key={kpi.label} className="p-5 rounded-sm border bg-card space-y-1">
            <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{kpi.label}</p>
            <p className="text-2xl font-bold font-display">{kpi.value}</p>
            <p className="text-xs text-muted-foreground">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Status filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              data-testid={`filter-status-${s.toLowerCase()}`}
              className={cn(
                "px-3 py-1.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-all",
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
              )}
            >
              {s}
              {s !== "All" && (
                <span className="ml-1.5 opacity-60">
                  ({orders.filter(o => o.status === s).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or order #…"
            data-testid="input-order-search"
            className="h-9 pl-9 pr-8 text-sm bg-secondary/40 border border-border rounded-sm focus:outline-none focus:ring-2 focus:ring-ring/30 w-full sm:w-64"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-sm" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <p className="text-muted-foreground">No orders match your filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {filtered.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                data-testid={`admin-order-${order.id}`}
                className="flex items-center gap-4 p-4 rounded-sm border bg-card hover:border-primary/20 transition-colors"
              >
                {/* Order # */}
                <div className="shrink-0 w-28">
                  <p className="font-mono text-sm font-semibold">
                    SP-{String(order.id).padStart(5, "0")}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {formatDate(order.createdAt)}
                  </p>
                </div>

                {/* Customer */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{order.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.user.username ? `@${order.user.username}` : "—"}
                  </p>
                </div>

                {/* Items thumbnails */}
                <div className="hidden sm:flex gap-1.5 shrink-0">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="h-9 w-9 rounded-sm overflow-hidden bg-secondary/30">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="h-9 w-9 rounded-sm bg-secondary/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>

                {/* Total */}
                <div className="shrink-0 text-right w-24">
                  <p className="font-mono text-sm font-bold">${(order.total / 100).toFixed(2)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {order.items.reduce((s, i) => s + i.quantity, 0)} items
                  </p>
                </div>

                {/* Status badge */}
                <div className="shrink-0">
                  <span className={cn(
                    "inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    STATUS_STYLE[order.status] ?? STATUS_STYLE.Processing
                  )}>
                    {order.status}
                  </span>
                </div>

                {/* Status selector */}
                <div className="shrink-0 w-36">
                  <Select
                    value={order.status}
                    onValueChange={(val) => {
                      const parsed = api.admin.updateOrderStatus.input.safeParse({ status: val });
                      if (parsed.success) {
                        updateStatus.mutate({ id: order.id, status: parsed.data.status });
                      }
                    }}
                  >
                    <SelectTrigger
                      data-testid={`select-order-status-${order.id}`}
                      className="h-8 text-xs border-border bg-transparent rounded-sm"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Processing">Processing</SelectItem>
                      <SelectItem value="Shipped">Shipped</SelectItem>
                      <SelectItem value="Delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
