import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder') && supabaseAnonKey !== 'placeholder-key';
if (!isConfigured) {
    console.error(
        '[Supabase] Configure o arquivo .env.local na raiz do projeto com:\n' +
        '  VITE_SUPABASE_URL=https://seu-projeto.supabase.co\n' +
        '  VITE_SUPABASE_ANON_KEY=sua_chave_anon\n' +
        'Copie o .env.example para .env.local e preencha com os dados do painel Supabase (Settings > API).'
    );
}

const effectiveUrl = supabaseUrl || 'https://placeholder.supabase.co';
const effectiveKey = supabaseAnonKey || 'placeholder-key';

export const supabase = createClient<Database>(effectiveUrl, effectiveKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any) {
    console.error('Supabase error:', error);

    if (error.message) {
        return error.message;
    }

    return 'An unexpected error occurred';
}

// Helper function to check if user is authenticated
export async function isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
}

// Helper function to get current user
export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

// Helper function to get current user profile
export async function getCurrentUserProfile() {
    const user = await getCurrentUser();

    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return data;
}
