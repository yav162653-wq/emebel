import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Eye, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { AdminSidebar, type AdminTab } from "@/modules/admin/ui/AdminSidebar";
import { OverviewTab } from "@/modules/admin/ui/OverviewTab";
import { ProductsTab } from "@/modules/admin/ui/ProductsTab";
import { UsersTab } from "@/modules/admin/ui/UsersTab";
import { cn } from "@/lib/utils";

function TabContent({ tab }: { tab: AdminTab }) {
  if (tab === "overview") return <OverviewTab />;
  if (tab === "products") return <ProductsTab />;
  if (tab === "users")    return <UsersTab />;
  return null;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <Eye className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="font-display text-3xl font-medium">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view this page.</p>
          <p className="text-xs font-mono text-muted-foreground/60">
            Login as <strong>nasa_admin</strong> to access the dashboard.
          </p>
          <Link href="/shop">
            <PremiumButton>Back to Shop</PremiumButton>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <AdminSidebar active={activeTab} onSelect={setActiveTab} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10">
            <AdminSidebar
              active={activeTab}
              onSelect={(tab) => { setActiveTab(tab); setMobileSidebarOpen(false); }}
            />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b bg-card shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-lg font-bold tracking-tighter">SPACE. Admin</span>
          <Link href="/shop">
            <button className="p-2 rounded-sm text-muted-foreground hover:text-foreground transition-colors text-xs flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Shop
            </button>
          </Link>
        </header>

        {/* Desktop top breadcrumb */}
        <div className="hidden lg:flex items-center justify-between px-8 h-14 border-b shrink-0 bg-background/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-display font-bold text-foreground">SPACE.</span>
            <span>/</span>
            <span className="capitalize">{activeTab}</span>
          </div>
          <Link href="/shop">
            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Shop
            </button>
          </Link>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
          <TabContent tab={activeTab} />
        </main>
      </div>
    </div>
  );
}
