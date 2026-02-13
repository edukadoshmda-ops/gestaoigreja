import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/lib/database.types';

export type Church = Database['public']['Tables']['churches']['Row'];
export type ChurchInsert = Database['public']['Tables']['churches']['Insert'];
export type ChurchUpdate = Database['public']['Tables']['churches']['Update'];

export const churchesService = {
    /**
     * Lista todas as igrejas da plataforma (Acesso SuperAdmin)
     */
    async getAll() {
        const { data, error } = await supabase
            .from('churches')
            .select('*')
            .order('name');

        if (error) throw error;
        return data;
    },

    /**
     * Obtém detalhes de uma igreja específica
     */
    async getById(id: string) {
        const { data, error } = await supabase
            .from('churches')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Cria um novo tenant (Igreja) com um admin inicial opcional
     */
    async create(church: ChurchInsert & { adminEmail?: string }) {
        if (church.adminEmail) {
            const { data, error } = await supabase.rpc('create_church_with_admin', {
                church_name: church.name,
                church_slug: church.slug,
                admin_email: church.adminEmail
            });
            if (error) throw error;
            return data;
        }

        const { data, error } = await (supabase.from('churches') as any)
            .insert({
                name: church.name,
                slug: church.slug,
                logo_url: church.logo_url
            } as any)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Atualiza uma igreja existente
     */
    async update(id: string, updates: ChurchUpdate) {
        const { data, error } = await (supabase.from('churches') as any)
            .update(updates as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Deleta um tenant (Ação crítica)
     */
    async delete(id: string) {
        const { error } = await supabase
            .from('churches')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Estatísticas Globais para o Painel Root
     */
    async getGlobalStats() {
        // Total de igrejas
        const { count: churchCount } = await supabase
            .from('churches')
            .select('*', { count: 'exact', head: true });

        // Total de membros (Across all tenants)
        const { count: memberCount } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true });

        // Total de usuários ativos
        const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        return {
            totalChurches: churchCount || 0,
            totalMembers: memberCount || 0,
            totalUsers: userCount || 0
        };
    }
};
