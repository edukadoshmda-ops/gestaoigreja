import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';

import { authService } from '@/services/auth.service';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole, name?: string) => Promise<boolean>;
  logout: () => void;
  updateAvatar: (url: string) => void;
  switchChurch: (churchId: string | null, churchName?: string) => void;
  exitChurchView: () => void;
  isAuthenticated: boolean;
  churchId?: string;
  /** Quando superadmin está visualizando uma igreja como se fosse dela */
  viewingChurch?: { id: string; name: string } | null;
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

  const [churchId, setChurchId] = useState<string | undefined>(() => {
    const saved = user?.churchId ?? undefined;
    if (user?.role === 'superadmin') {
      try {
        const viewing = sessionStorage.getItem('superadmin_viewing_church');
        if (viewing) {
          const parsed = JSON.parse(viewing) as { id: string; name: string };
          return parsed.id;
        }
      } catch {}
    }
    return saved;
  });

  const [viewingChurch, setViewingChurch] = useState<{ id: string; name: string } | null>(() => {
    if (user?.role !== 'superadmin') return null;
    try {
      const v = sessionStorage.getItem('superadmin_viewing_church');
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  });

  const login = async (email: string, password: string, role: UserRole, name?: string) => {
    try {
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
      } else if (profile && role === 'superadmin' && profile.role !== 'superadmin') {
        // Se o usuário fez login como superadmin mas o perfil tem outro role, atualizar
        const { data: updatedProfile } = await (supabase.from('profiles') as any).update({
          role: 'superadmin',
          updated_at: new Date().toISOString()
        }).eq('id', authUser.id).select().single();
        if (updatedProfile) profile = updatedProfile;
      }

      if (!profile) throw new Error('Falha ao carregar ou criar perfil');

      // Garantir que o role seja atualizado se o usuário fez login com um role diferente
      if (profile.role !== role && role === 'superadmin') {
        // Atualizar o perfil com o role correto
        await (supabase.from('profiles') as any).update({
          role: 'superadmin',
          updated_at: new Date().toISOString()
        }).eq('id', authUser.id);
        profile.role = 'superadmin';
      }

      const newUser: User = {
        id: authUser.id,
        name: profile.full_name || name || 'Usuário',
        email: authUser.email || '',
        role: (profile.role === 'superadmin' ? 'superadmin' : profile.role) as UserRole,
        churchId: profile.church_id || undefined,
        avatar: authUser.user_metadata?.avatar_url
      };

      setUser(newUser);
      const effectiveChurchId = profile.church_id || undefined;
      setChurchId(effectiveChurchId);
      if (role === 'superadmin') {
        const viewing = sessionStorage.getItem('superadmin_viewing_church');
        if (viewing) {
          try {
            const parsed = JSON.parse(viewing) as { id: string; name: string };
            const restoredUser = { ...newUser, churchId: parsed.id };
            setViewingChurch(parsed);
            setChurchId(parsed.id);
            setUser(restoredUser);
            localStorage.setItem('church_user', JSON.stringify(restoredUser));
            return true;
          } catch {}
        }
        setViewingChurch(null);
      }
      localStorage.setItem('church_user', JSON.stringify(newUser));
      return true;
    } catch (err: any) {
      console.error('Erro no login/provisionamento:', err);

      // Falha de rede / Supabase não configurado
      if (err?.message === 'Failed to fetch' || err?.message?.includes('fetch')) {
        throw new Error(
          'Não foi possível conectar ao servidor. Verifique se o arquivo .env.local existe na raiz do projeto com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (copie do .env.example e preencha no painel Supabase > Settings > API).'
        );
      }

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
    setViewingChurch(null);
    localStorage.removeItem('church_user');
    sessionStorage.removeItem('superadmin_viewing_church');
  };

  const switchChurch = (targetChurchId: string | null, churchName = 'Igreja') => {
    if (user?.role !== 'superadmin') return;
    if (!targetChurchId) {
      exitChurchView();
      return;
    }
    const viewing = { id: targetChurchId, name: churchName };
    sessionStorage.setItem('superadmin_viewing_church', JSON.stringify(viewing));
    setViewingChurch(viewing);
    setChurchId(targetChurchId);
    const updatedUser = user ? { ...user, churchId: targetChurchId } : null;
    setUser(updatedUser);
    if (updatedUser) localStorage.setItem('church_user', JSON.stringify(updatedUser));
  };

  const exitChurchView = () => {
    if (user?.role !== 'superadmin') return;
    sessionStorage.removeItem('superadmin_viewing_church');
    setViewingChurch(null);
    setChurchId(undefined);
    const updatedUser = user ? { ...user, churchId: undefined } : null;
    setUser(updatedUser);
    if (updatedUser) localStorage.setItem('church_user', JSON.stringify(updatedUser));
  };

  const updateAvatar = (url: string) => {
    if (user) {
      const updatedUser = { ...user, avatar: url };
      setUser(updatedUser);
      localStorage.setItem('church_user', JSON.stringify(updatedUser));
    }
  };

  useEffect(() => {
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || session === null) {
        setUser(null);
        setChurchId(undefined);
        localStorage.removeItem('church_user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/' && !window.location.pathname.startsWith('/reset-password')) {
          window.location.href = '/login';
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      churchId,
      login,
      logout,
      updateAvatar,
      switchChurch,
      exitChurchView,
      isAuthenticated: !!user,
      viewingChurch,
    }}>
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
