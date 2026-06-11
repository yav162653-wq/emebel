import { BarChart3, ChevronRight, LogOut, Package, Settings, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export type AdminTab = "overview" | "products" | "users";

const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: "overview",  label: "Overview",  icon: BarChart3 },
  { id: "products",  label: "Products",  icon: Package   },
  { id: "users",     label: "Users",     icon: Users     },
];

interface AdminSidebarProps {
  active: AdminTab;
  onSelect: (tab: AdminTab) => void;
}

export function AdminSidebar({ active, onSelect }: AdminSidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-60 shrink-0 flex flex-col border-r bg-card h-screen sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b shrink-0">
        <span className="font-display text-xl font-bold tracking-tighter">SPACE.</span>
        <span className="px-1.5 py-0.5 rounded-full bg-accent/15 text-accent text-[9px] font-bold uppercase tracking-wider">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            data-testid={`sidebar-nav-${id}`}
            onClick={() => onSelect(id)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-sm text-sm transition-all group",
              active === id
                ? "bg-accent/10 text-accent font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <div className="flex items-center gap-2.5">
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </div>
            {active === id && <ChevronRight className="h-3.5 w-3.5 opacity-60" />}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t space-y-1 shrink-0">
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">@{user?.username}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          data-testid="button-admin-logout"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
