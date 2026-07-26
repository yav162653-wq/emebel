import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type LoginRequest, type InsertUser } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useWishlistStore } from "@/modules/furniture/store/furniture-store";

export function useAuth() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path);
      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return await res.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  /** After login, merge any guest localStorage wishlist items into the DB */
  async function syncLocalWishlist() {
    const localIds = useWishlistStore.getState().items;
    if (localIds.length === 0) return;
    try {
      await fetch("/api/wishlist/sync", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ productIds: localIds }),
      });
      useWishlistStore.getState().clear();
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
    } catch {
      // non-critical — guest items remain in localStorage
    }
  }

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const res = await fetch(api.auth.login.path, {
        method:  api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(credentials),
      });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Invalid credentials");
        throw new Error("Login failed");
      }
      return await res.json();
    },
    onSuccess: async (data) => {
      queryClient.setQueryData([api.auth.me.path], data);
      await syncLocalWishlist();
      toast({ title: "Welcome back", description: `Logged in as ${data.name}` });
      setLocation("/shop");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await fetch(api.auth.register.path, {
        method:  api.auth.register.method,
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Registration failed");
      }
      return await res.json();
    },
    onSuccess: async (data) => {
      queryClient.setQueryData([api.auth.me.path], data);
      await syncLocalWishlist();
      toast({ title: "Account Created", description: "Welcome to Space Furniture." });
      setLocation("/shop");
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Registration Failed", description: error.message });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch(api.auth.logout.path, { method: api.auth.logout.method });
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      queryClient.clear();
      setLocation("/");
      toast({ description: "Successfully logged out" });
    },
  });

  return {
    user,
    isLoading,
    isError,
    isAuthenticated: !!user,
    login:        loginMutation.mutate,
    isLoggingIn:  loginMutation.isPending,
    register:     registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout:       logoutMutation.mutate,
  };
}
