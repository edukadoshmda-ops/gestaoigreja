import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '@/types';

import { authService } from '@/services/auth.service';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole, name?: string) => Promise<boolean>;
  logout: () => void;
  updateAvatar: (url: string) => void;
  isAuthenticated: boolean;
  churchId?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem('church_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error('AuthContext: Erro ao carregar usuário do localStorage', e);
      localStorage.removeItem('church_user');
      return null;
    }
  });

  const [churchId, setChurchId] = useState<string | undefined>(user?.churchId);

  const login = async (email: string, password: string, role: UserRole, name?: string) => {
    try {
      console.log('AuthContext: Tentando login para', email, 'com senha de tamanho:', password.length);

      // 1. Tentar Login Real no Supabase
      let { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password, // Usando o PIN como senha (obrigatoriamente 6+ caracteres)
      });

      // 2. Se o usuário não existir, tentamos criar (Auto-provisionamento para migração)
      if (error && error.message.includes('Invalid login credentials')) {
        const signUpResult: any = await authService.signUp({
          email,
          password: password,
          name: name || 'Usuário',
          role: role
        });

        data = signUpResult;
      } else if (error) {
        throw error;
      }

      const authUser = data?.user;
      if (!authUser) throw new Error('Falha ao obter usuário');

      // 3. Buscar Perfil e Igreja
      let profileResult = await authService.getProfile();
      let profile: any = profileResult;

      // 4. Se não houver perfil ou igreja vinculada (e não for superadmin), vinculamos à primeira igreja
      if (!profile || (!profile.church_id && role !== 'superadmin')) {
        // Buscar primeira igreja disponível
        let { data: churches } = await supabase.from('churches').select('id').limit(1);
        let targetChurchId;

        if (!churches || churches.length === 0) {
          // Criar igreja padrão se não existir nada no banco
          const { data: newChurch } = await (supabase.from('churches') as any).insert({
            name: 'Igreja Sede',
            slug: 'sede'
          }).select().single();
          targetChurchId = newChurch.id;
        } else {
          targetChurchId = churches[0].id;
        }

        // Criar ou atualizar perfil
        const { data: newProfile } = await (supabase.from('profiles') as any).upsert({
          id: authUser.id,
          church_id: targetChurchId,
          full_name: name || authUser.user_metadata?.name || 'Usuário',
          role: role,
          updated_at: new Date().toISOString()
        }).select().single();

        profile = newProfile;
      } else if (!profile && role === 'superadmin') {
        // Caso superadmin não tenha perfil ainda, cria um sem igreja obrigatória
        const { data: newProfile } = await (supabase.from('profiles') as any).upsert({
          id: authUser.id,
          church_id: null,
          full_name: name || authUser.user_metadata?.name || 'Administrador Root',
          role: 'superadmin',
          updated_at: new Date().toISOString()
        }).select().single();
        profile = newProfile;
      }

      if (!profile) throw new Error('Falha ao carregar ou criar perfil');

      const newUser: User = {
        id: authUser.id,
        name: profile.full_name || name || 'Usuário',
        email: authUser.email || '',
        role: profile.role as UserRole,
        churchId: profile.church_id || undefined,
        avatar: authUser.user_metadata?.avatar_url
      };

      setUser(newUser);
      setChurchId(profile.church_id || undefined);
      localStorage.setItem('church_user', JSON.stringify(newUser));
      return true;
    } catch (err: any) {
      console.error('Erro no login/provisionamento:', err);

      // Erro específico de email não confirmado
      if (err.message?.includes('Email not confirmed') || err.message?.includes('email_confirmed_at')) {
        throw new Error('Email não confirmado. Configure o Supabase para desabilitar confirmação de email ou confirme seu email.');
      }

      // Erro de credenciais inválidas
      if (err.message?.includes('Invalid login credentials')) {
        throw new Error('E-mail ou PIN incorretos.');
      }

      throw err;
    }
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
    setChurchId(undefined);
    localStorage.removeItem('church_user');
  };

  const updateAvatar = (url: string) => {
    if (user) {
      const updatedUser = { ...user, avatar: url };
      setUser(updatedUser);
      localStorage.setItem('church_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, churchId, login, logout, updateAvatar, isAuthenticated: !!user }}>
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
