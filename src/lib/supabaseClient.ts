import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder') && supabaseAnonKey !== 'placeholder-key';
if (!isConfigured) {
    const hint = 'Configure o .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (Supabase → Settings → API).';
    console.error('[Supabase]', hint);
}

/** Mensagem amigável quando a API do Supabase retorna "Invalid API key" (chave ausente ou errada). */
export const SUPABASE_CONFIG_HINT = 'Chave do Supabase inválida ou não configurada. Crie o arquivo .env.local na raiz do projeto com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (painel Supabase → Settings → API) e reinicie o servidor (npm run dev).';

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
