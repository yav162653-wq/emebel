import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  fetchCurrentUser,
  login,
  logout,
  register,
  requestMagicLink,
} from "@/api/auth";
import { syncWishlist } from "@/api/wishlist";
import { useWishlistStore } from "@/modules/furniture/store/furniture-store";

export function useAuth() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: [api.auth.me.path],
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  /** After login, merge any guest localStorage wishlist items into the DB */
  async function syncLocalWishlist() {
    const localIds = useWishlistStore.getState().items;
    if (localIds.length === 0) return;
    try {
      await syncWishlist(localIds);
      useWishlistStore.getState().clear();
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
    } catch {
      // non-critical — guest items remain in localStorage
    }
  }

  const loginMutation = useMutation({
    mutationFn: login,
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
    mutationFn: register,
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
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      queryClient.clear();
      setLocation("/");
      toast({ description: "Successfully logged out" });
    },
  });

  const magicLinkMutation = useMutation({
    mutationFn: requestMagicLink,
    onSuccess: (data) => {
      toast({ title: "Check your email", description: data.message });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Magic link failed", description: error.message });
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
    requestMagicLink: magicLinkMutation.mutate,
    isRequestingMagicLink: magicLinkMutation.isPending,
  };
}
