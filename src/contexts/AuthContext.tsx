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
  admin: { id: '1', name: 'Administrador', email: 'admin@gestaochurch.com', role: 'admin' },
  secretario: { id: '2', name: 'Maria Silva', email: 'secretario@gestaochurch.com', role: 'secretario' },
  tesoureiro: { id: '3', name: 'Carlos Santos', email: 'tesoureiro@gestaochurch.com', role: 'tesoureiro' },
  membro: { id: '4', name: 'Ana Oliveira', email: 'membro@gestaochurch.com', role: 'membro' },
  lider_celula: { id: '5', name: 'Líder Pedro', email: 'celula@gestaochurch.com', role: 'lider_celula' },
  lider_ministerio: { id: '6', name: 'Líder Aline', email: 'ministerio@gestaochurch.com', role: 'lider_ministerio' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string, role: UserRole) => {
    // Demo login - in production, validate with backend
    if (password.length >= 4) {
      const selectedUser = mockUsers[role] || mockUsers['admin'];
      setUser(selectedUser);
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
