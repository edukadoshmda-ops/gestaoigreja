import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { UNRESTRICTED_EMAILS } from '@/lib/constants';
import { authService } from '@/services/auth.service';
import { trialService } from '@/services/trial.service';
import { supabase } from '@/lib/supabaseClient';
import { clearTenantSession } from '@/hooks/useTenant';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole, name?: string) => Promise<boolean>;
  logout: () => void;
  updateAvatar: (url: string) => Promise<void>;
  setRegistrationCompleted: () => Promise<void>;
  switchChurch: (churchId: string | null, churchName?: string) => void;
  exitChurchView: () => void;
  isAuthenticated: boolean;
  authLoading: boolean;
  churchId?: string;
  /** Quando superadmin está visualizando uma igreja como se fosse dela */
  viewingChurch?: { id: string; name: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [churchId, setChurchId] = useState<string | undefined>(undefined);
  const [viewingChurch, setViewingChurch] = useState<{ id: string; name: string } | null>(null);

  const login = async (email: string, password: string, role: UserRole, name?: string) => {
    try {
      // E-mail sem restrição: sempre entra como superadmin
      const normalized = (email || '').trim().toLowerCase();
      const effectiveRole = UNRESTRICTED_EMAILS.some(e => e.trim().toLowerCase() === normalized)
        ? 'superadmin'
        : role;

      // 1. Tentar Login Real no Supabase
      const signInResult = await supabase.auth.signInWithPassword({
        email,
        password: password, // Usando o PIN como senha (obrigatoriamente 6+ caracteres)
      });
      let data = signInResult.data;
      const error = signInResult.error;

      // 2. Se o usuário não existir, tentamos criar (Auto-provisionamento para migração)
      let wasNewSignup = false;
      if (error && error.message.includes('Invalid login credentials')) {
        wasNewSignup = true;
        const signUpResult: any = await authService.signUp({
          email,
          password: password,
          name: name || 'Usuário',
          role: effectiveRole
        });

        data = signUpResult;
      } else if (error) {
        throw error;
      }

      const authUser = data?.user;
      if (!authUser) throw new Error('Falha ao obter usuário');

      // 3. Buscar Perfil e Igreja
      const profileResult = await authService.getProfile();
      let profile: any = profileResult;

      // 4. Se não houver perfil ou igreja vinculada
      const isTrialSignup = wasNewSignup && typeof sessionStorage !== 'undefined' && sessionStorage.getItem('trial_signup') === '1';
      if (isTrialSignup) sessionStorage.removeItem('trial_signup');
      if (!profile) {
        if (effectiveRole === 'superadmin') {
          // Caso superadmin não tenha perfil ainda, cria um sem igreja obrigatória
          const { data: newProfile } = await (supabase.from('profiles') as any).upsert({
            id: authUser.id,
            church_id: null,
            full_name: name || authUser.user_metadata?.name || 'Administrador Root',
            role: 'superadmin',
            updated_at: new Date().toISOString()
          }).select().single();
          profile = newProfile;
        } else {
          let targetChurchId: string | undefined;

          if (isTrialSignup) {
            try {
              targetChurchId = await trialService.createTrialChurchForUser(
                authUser.email || '',
                name || authUser.user_metadata?.name || 'Usuário'
              );
            } catch (e: any) {
              throw new Error(e?.message || 'Não foi possível criar igreja de teste. Limite de 100 vagas pode ter sido atingido.');
            }
          } else {
            const { data: churches } = await supabase.from('churches').select('id').limit(1);
            if (!churches || churches.length === 0) {
              const { data: newChurch } = await (supabase.from('churches') as any).insert({
                name: 'Igreja Sede',
                slug: 'sede'
              }).select().single();
              targetChurchId = newChurch?.id;
            } else {
              targetChurchId = (churches as { id: string }[])[0]?.id;
            }
          }

          const { data: newProfile } = await (supabase.from('profiles') as any).upsert({
            id: authUser.id,
            church_id: targetChurchId,
            full_name: name || authUser.user_metadata?.name || 'Usuário',
            role: isTrialSignup ? 'admin' : effectiveRole,
            updated_at: new Date().toISOString()
          }).select().single();

          profile = newProfile;
        }
      } else if (profile && effectiveRole === 'superadmin' && profile.role !== 'superadmin') {
        // Se o usuário fez login como superadmin mas o perfil tem outro role, atualizar
        const { data: updatedProfile } = await (supabase.from('profiles') as any).update({
          role: 'superadmin',
          updated_at: new Date().toISOString()
        }).eq('id', authUser.id).select().single();
        if (updatedProfile) profile = updatedProfile;
      }

      // Se o profile existe mas não tem church_id vinculado (exceto superadmin), vincular a uma igreja
      if (profile && !profile.church_id && effectiveRole !== 'superadmin') {
        let targetChurchId: string | undefined;

        if (isTrialSignup) {
          try {
            targetChurchId = await trialService.createTrialChurchForUser(
              authUser.email || '',
              name || authUser.user_metadata?.name || 'Usuário'
            );
          } catch (e: any) {
            throw new Error(e?.message || 'Não foi possível criar igreja de teste. Limite de 100 vagas pode ter sido atingido.');
          }
        } else {
          const { data: churches } = await supabase.from('churches').select('id').limit(1);
          if (!churches || churches.length === 0) {
            const { data: newChurch } = await (supabase.from('churches') as any).insert({
              name: 'Igreja Sede',
              slug: 'sede'
            }).select().single();
            targetChurchId = newChurch?.id;
          } else {
            targetChurchId = (churches as { id: string }[])[0]?.id;
          }
        }

        if (targetChurchId) {
          const { data: updatedProfile } = await (supabase.from('profiles') as any).update({
            church_id: targetChurchId,
            updated_at: new Date().toISOString()
          }).eq('id', authUser.id).select().single();
          if (updatedProfile) profile = updatedProfile;
        }
      }

      if (!profile) throw new Error('Falha ao carregar ou criar perfil');

      // Garantir que o role seja atualizado se o usuário fez login com um role diferente
      if (profile.role !== effectiveRole && effectiveRole === 'superadmin') {
        // Atualizar o perfil com o role correto
        await (supabase.from('profiles') as any).update({
          role: 'superadmin',
          updated_at: new Date().toISOString()
        }).eq('id', authUser.id);
        profile.role = 'superadmin';
      }

      // Sincronizar profile com members table para que usuários apareçam na lista de membros
      if (profile.church_id && profile.role !== 'superadmin') {
        try {
          // Verificar se o usuário já existe como membro pelo e-mail (já que user_id não existe na tabela)
          const { data: existingMember } = await supabase
            .from('members')
            .select('id')
            .eq('email', authUser.email)
            .eq('church_id', profile.church_id)
            .maybeSingle();

          // Se não existir, criar o registro de membro
          if (!existingMember) {
            await supabase
              .from('members')
              .insert({
                church_id: profile.church_id,
                name: profile.full_name || name || 'Usuário',
                email: authUser.email || '',
                phone: authUser.user_metadata?.phone || null,
                status: 'ativo'
              });
          }
        } catch (syncError) {
          // Não bloquear o login se a sincronização falhar
          console.error('Erro ao sincronizar profile com members:', syncError);
        }
      }

      // Para PastorAdmin: garantir que o managed_churches criado no Auth vá para o Profile
      if (profile.role === 'pastor_admin' && (!profile.managed_churches || profile.managed_churches.length === 0)) {
        let metaChurches = authUser.user_metadata?.managed_churches;
        
        // Se metadata falhar, busca no localStorage o backup local
        if (!metaChurches || metaChurches.length === 0) {
           const backupKey = `pending_churches_${authUser.email?.toLowerCase()}`;
           const backup = localStorage.getItem(backupKey);
           if (backup) {
               try { metaChurches = JSON.parse(backup); } catch(e) {}
               localStorage.removeItem(backupKey); // limpa após uso
           }
        }

        if (typeof metaChurches === 'string') {
           try { metaChurches = JSON.parse(metaChurches); } catch(e) {}
        }
        
        if (Array.isArray(metaChurches) && metaChurches.length > 0) {
          const { data: updatedProfile, error: updateError } = await (supabase.from('profiles') as any).update({
            managed_churches: metaChurches
          }).eq('id', authUser.id).select().single();
          
          if (updateError) {
             console.error("Erro ao sincronizar managed_churches:", updateError);
             try { localStorage.setItem('debug_update_error', JSON.stringify(updateError)); } catch(e){}
          }
          if (updatedProfile) profile = updatedProfile;
        }
      }

      if (isTrialSignup && profile.church_id) {
        try { sessionStorage.setItem('redirect_to_institucional', '1'); } catch {}
      }

      const newUser: User = {
        id: authUser.id,
        name: profile.full_name || name || 'Usuário',
        email: authUser.email || '',
        role: (profile.role === 'superadmin' ? 'superadmin' : profile.role) as UserRole,
        churchId: profile.church_id || undefined,
        avatar: authUser.user_metadata?.avatar_url ?? (profile as any)?.avatar_url,
        registrationCompleted: !!(profile as any).registration_completed,
      };

      setUser(newUser);
      const effectiveChurchId = profile.church_id || undefined;
      setChurchId(effectiveChurchId);
      if (effectiveRole === 'superadmin') {
        const viewing = sessionStorage.getItem('superadmin_viewing_church');
        if (viewing) {
          try {
            const parsed = JSON.parse(viewing) as { id: string; name: string };
            setViewingChurch(parsed);
            setChurchId(parsed.id);
            setUser({ ...newUser, churchId: parsed.id });
            return true;
          } catch {}
        }
        setViewingChurch(null);
      }
      return true;
    } catch (err: any) {
      console.error('Erro no login/provisionamento:', err);

      const errMsg = (typeof err === 'string' ? err : err?.message || err?.error_description || err?.msg || err?.cause?.message || '') + '';
      const errLower = errMsg.toLowerCase();

      // LockManager timed out (múltiplas abas ou browser travou)
      if (
        errMsg.includes('LockManager') ||
        (errLower.includes('lock') && errLower.includes('timed out')) ||
        errMsg.includes('10000ms')
      ) {
        throw new Error('Aguarde um momento e tente novamente. Se o problema continuar, feche outras abas do app e recarregue a página.');
      }

      // Falha de rede / Supabase não configurado
      if (errMsg === 'Failed to fetch' || errMsg.includes('fetch')) {
        const isProd = import.meta.env.PROD || !window.location.hostname.includes('localhost');
        const hint = isProd
          ? 'Verifique: (1) Projeto Supabase ativo em supabase.com/dashboard, (2) VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel (Settings > Env Vars), (3) Supabase > Auth > URL Configuration com sua URL.'
          : 'Verifique .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (Supabase > Settings > API) e reinicie npm run dev.';
        throw new Error(`Não foi possível conectar ao servidor. ${hint}`);
      }

      // Erro de sessão ausente ou email não confirmado (precisa confirmar o e-mail)
      if (
        errMsg.includes('Email not confirmed') ||
        errMsg.includes('email_confirmed_at') ||
        errLower.includes('auth session missing') ||
        errLower.includes('session missing')
      ) {
        const isUnrestricted = UNRESTRICTED_EMAILS.some(
          e => e.trim().toLowerCase() === (email || '').trim().toLowerCase()
        );
        if (isUnrestricted) {
          throw new Error(
            'Supabase está exigindo confirmação de e-mail. Desative em: Supabase → Authentication → Providers → Email → desmarque "Confirm email" e salve. Depois tente entrar de novo.'
          );
        }
        throw new Error(
          'Confirme seu e-mail para entrar. Verifique sua caixa de entrada e a pasta de spam — você recebeu um link de confirmação ao se cadastrar. Clique no link e tente fazer login novamente.'
        );
      }

      // Erro de credenciais inválidas
      if (errMsg.includes('Invalid login credentials')) {
        throw new Error('E-mail ou PIN incorretos.');
      }

      // Limite de envio de e-mail excedido (Supabase)
      if (errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('email rate limit')) {
        throw new Error('Muitas tentativas. Aguarde alguns minutos e tente novamente. Se o problema continuar, acesse Supabase > Authentication > Rate Limits para ajustar.');
      }

      // Erro ao criar novo usuário no banco (trigger handle_new_user)
      if (errLower.includes('database error') || (errLower.includes('saving') && errLower.includes('new user'))) {
        throw new Error('Erro ao criar sua conta. Execute o script supabase/fix-handle-new-user.sql no Supabase (SQL Editor) e tente novamente.');
      }

      throw err;
    }
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
    setChurchId(undefined);
    setViewingChurch(null);
    sessionStorage.removeItem('superadmin_viewing_church');
    clearTenantSession();
  };

  const switchChurch = (targetChurchId: string | null, churchName = 'Igreja') => {
    if (user?.role !== 'superadmin' && user?.role !== 'pastor_admin') return;
    if (!targetChurchId) {
      exitChurchView();
      return;
    }
    const viewing = { id: targetChurchId, name: churchName };
    sessionStorage.setItem('superadmin_viewing_church', JSON.stringify(viewing));
    setViewingChurch(viewing);
    setChurchId(targetChurchId);
    if (user) setUser({ ...user, churchId: targetChurchId });
  };

  const exitChurchView = () => {
    if (user?.role !== 'superadmin' && user?.role !== 'pastor_admin') return;
    sessionStorage.removeItem('superadmin_viewing_church');
    setViewingChurch(null);
    setChurchId(undefined);
    if (user) setUser({ ...user, churchId: undefined });
  };

  const updateAvatar = async (url: string) => {
    if (!user) return;
    try {
      await authService.saveAvatarUrl(url);
      setUser({ ...user, avatar: url });
    } catch (err) {
      setUser({ ...user, avatar: url });
    }
  };

  const setRegistrationCompleted = async () => {
    await authService.setRegistrationCompleted();
    if (user) setUser({ ...user, registrationCompleted: true });
  };

  useEffect(() => {
    let loadedUserId: string | null = null;
    let inFlightLoad: Promise<void> | null = null;

    const loadUserFromSession = async (existingSession?: any) => {
      if (inFlightLoad) return inFlightLoad;

      inFlightLoad = (async () => {
        try {
          const session = existingSession !== undefined ? existingSession : await authService.getSession();
          if (!session?.user) {
            loadedUserId = null;
            setAuthLoading(false);
            return;
          }
          const profile = await authService.getProfile(session.user.id);
          if (!profile) {
            setAuthLoading(false);
            return;
          }
          loadedUserId = session.user.id;
          const u: User = {
            id: session.user.id,
            name: (profile as any).full_name || session.user.email?.split('@')[0] || 'Usuário',
            email: session.user.email || '',
            role: ((profile as any).role === 'superadmin' ? 'superadmin' : (profile as any).role) as UserRole,
            churchId: (profile as any).church_id || undefined,
            avatar: session.user.user_metadata?.avatar_url ?? (profile as any)?.avatar_url,
            registrationCompleted: !!(profile as any).registration_completed,
          };
          setUser(u);
          const cid = (profile as any).church_id || undefined;
          if (u.role === 'superadmin') {
            try {
              const viewing = sessionStorage.getItem('superadmin_viewing_church');
              if (viewing) {
                const parsed = JSON.parse(viewing) as { id: string; name: string };
                setViewingChurch(parsed);
                setChurchId(parsed.id);
                setUser({ ...u, churchId: parsed.id });
                return;
              }
            } catch {}
            setViewingChurch(null);
          }
          setChurchId(cid);
        } catch (e) {
          console.error('AuthContext: Erro ao carregar sessão', e);
        } finally {
          inFlightLoad = null;
          setAuthLoading(false);
        }
      })();

      return inFlightLoad;
    };

    loadUserFromSession();

    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || session === null) {
        loadedUserId = null;
        setUser(null);
        setChurchId(undefined);
        setViewingChurch(null);
        if (window.location.pathname !== '/login' && window.location.pathname !== '/' && !window.location.pathname.startsWith('/reset-password') && !window.location.pathname.startsWith('/confirmar/')) {
          window.location.href = '/login';
        }
      } else if (event === 'SIGNED_IN') {
        if (session?.user?.id && session.user.id !== loadedUserId) {
          loadUserFromSession(session);
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Só recarrega perfil no refresh do token se ainda não estiver carregado em memória
        if (!loadedUserId && session?.user?.id) {
          loadUserFromSession(session);
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
      setRegistrationCompleted,
      switchChurch,
      exitChurchView,
      isAuthenticated: !!user,
      authLoading,
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
