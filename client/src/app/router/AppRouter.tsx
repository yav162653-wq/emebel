import { Route, Switch, useLocation } from "wouter";
import { useAuthContext } from "@/app/providers/AuthProvider";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import LandingPage from "@/pages/Landing/LandingPage";
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import HeroPage from "@/pages/Hero/HeroPage";
import ProductDetail from "@/pages/Product/ProductDetail";
import CheckoutPage from "@/pages/Checkout/CheckoutPage";
import AccountPage from "@/pages/Account/AccountPage";
import AdminDashboard from "@/pages/Admin/AdminDashboard";
import WishlistPage from "@/pages/Wishlist/WishlistPage";
import NotFound from "@/pages/not-found";

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15, ease: "easeIn" } },
};

function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}

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
  const [location] = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <PageTransition key={location}>
        <Switch location={location}>
          <Route path="/" component={LandingPage} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/shop">
            <ProtectedRoute component={HeroPage} />
          </Route>
          <Route path="/product/:id">
            {() => <ProtectedRoute component={ProductDetail} />}
          </Route>
          <Route path="/checkout">
            {() => <ProtectedRoute component={CheckoutPage} />}
          </Route>
          <Route path="/account">
            {() => <ProtectedRoute component={AccountPage} />}
          </Route>
          <Route path="/admin">
            {() => <ProtectedRoute component={AdminDashboard} />}
          </Route>
          <Route path="/wishlist">
            {() => <ProtectedRoute component={WishlistPage} />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </PageTransition>
    </AnimatePresence>
  );
}
