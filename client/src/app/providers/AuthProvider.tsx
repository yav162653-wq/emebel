import React, { createContext, useContext, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { User } from '@shared/schema';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | undefined | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: any) => void;
  logout: () => void;
  register: (data: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  // Show a full screen loader on initial check if needed, 
  // but usually for better UX we just render children and let the UI handle loading states
  // Here we'll just expose the state
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
