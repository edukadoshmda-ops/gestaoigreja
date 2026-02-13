import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Profile['role'];

export interface SignUpData {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
}

export interface SignInData {
    email: string;
    password: string;
}

export const authService = {
    /**
     * Sign up a new user
     */
    async signUp({ email, password, name, role = 'membro' }: SignUpData) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    role,
                },
                emailRedirectTo: window.location.origin,
            },
        });

        if (error) throw error;

        // Se o usuário foi criado mas não confirmado, tente fazer login de qualquer forma
        // Nota: Isso só funciona se a confirmação de email estiver desabilitada no Supabase
        if (data?.user && !data.session) {
            console.warn('Usuário criado mas email não confirmado. Configure o Supabase para desabilitar confirmação de email.');
        }

        return data;
    },

    /**
     * Sign in an existing user
     */
    async signIn({ email, password }: SignInData) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
        return data;
    },

    /**
     * Sign out the current user
     */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /**
     * Get the current session
     */
    async getSession() {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return data.session;
    },

    /**
     * Get the current user
     */
    async getUser() {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        return data.user;
    },

    /**
     * Get the current user's profile with church data
     */
    async getProfile() {
        const user = await this.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                church:churches(*)
            `)
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is code for "no rows found"
            console.error('Error fetching profile:', error);
            throw error;
        }

        return data;
    },

    /**
     * Update the current user's profile
     */
    async updateProfile(updates: Partial<Profile>) {
        const user = await this.getUser();
        if (!user) throw new Error('No user logged in');

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Reset password
     */
    async resetPassword(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;
    },

    /**
     * Update password
     */
    async updatePassword(newPassword: string) {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });

        if (error) throw error;
    },

    /**
     * Subscribe to auth state changes
     */
    onAuthStateChange(callback: (event: string, session: any) => void) {
        return supabase.auth.onAuthStateChange(callback);
    },
};
