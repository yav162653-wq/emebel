import { Route, Switch, useLocation } from "wouter";
import { useAuthContext } from "@/app/providers/AuthProvider";
import { Loader2 } from "lucide-react";

import LandingPage from "@/pages/Landing/LandingPage";
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import HeroPage from "@/pages/Hero/HeroPage";
import ProductDetail from "@/pages/Product/ProductDetail";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuthContext();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    setTimeout(() => setLocation("/login"), 0);
    return null;
  }

  return <Component />;
}

export function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/shop">
        <ProtectedRoute component={HeroPage} />
      </Route>
      <Route path="/product/:id">
        {(params) => <ProtectedRoute component={ProductDetail} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}
