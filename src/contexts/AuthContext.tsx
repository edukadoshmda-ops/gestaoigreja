import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: Record<UserRole, User> = {
  admin: { id: '1', name: 'Pastor João', email: 'admin@gestaochurch.com', role: 'admin' },
  secretario: { id: '2', name: 'Maria Silva', email: 'secretario@gestaochurch.com', role: 'secretario' },
  tesoureiro: { id: '3', name: 'Carlos Santos', email: 'tesoureiro@gestaochurch.com', role: 'tesoureiro' },
  membro: { id: '4', name: 'Ana Oliveira', email: 'membro@gestaochurch.com', role: 'membro' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string, role: UserRole) => {
    // Demo login - in production, validate with backend
    if (password.length >= 4) {
      setUser(mockUsers[role]);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
