import React, { createContext, useContext } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { InsertUser, LoginRequest, User } from '@shared/schema';

interface AuthContextType {
  user: User | undefined | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => void;
  logout: () => void;
  register: (data: InsertUser) => void;
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
