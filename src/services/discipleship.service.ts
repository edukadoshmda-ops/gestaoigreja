import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/database.types';

type Discipleship = Database['public']['Tables']['discipleships']['Row'];
type DiscipleshipInsert = Database['public']['Tables']['discipleships']['Insert'];
type DiscipleshipUpdate = Database['public']['Tables']['discipleships']['Update'];

export const discipleshipService = {
    /**
     * Get all discipleships
     */
    async getAll() {
        const { data, error } = await supabase
            .from('discipleships')
            .select(`
                *,
                disciple:members!discipleships_disciple_id_fkey(*),
                mentor:members!discipleships_mentor_id_fkey(*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get discipleships by status
     */
    async getByStatus(status: 'em_andamento' | 'concluido' | 'cancelado') {
        const { data, error } = await supabase
            .from('discipleships')
            .select(`
                *,
                disciple:members!discipleships_disciple_id_fkey(*),
                mentor:members!discipleships_mentor_id_fkey(*)
            `)
            .eq('status', status)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get statistics
     */
    async getStatistics() {
        const { data, error } = await supabase
            .from('discipleships')
            .select('status');

        if (error) throw error;

        const active = (data as any[] || []).filter(d => d.status === 'em_andamento').length;
        const completed = (data as any[] || []).filter(d => d.status === 'concluido').length;
        const total = (data as any[] || []).length;

        return {
            active,
            completed,
            total,
            inProgress: active // For now, mapping active to inProgress as in mock
        };
    },

    /**
     * Create a new discipleship
     */
    async create(discipleship: any, churchId: string) {
        const { data, error } = await (supabase.from('discipleships') as any)
            .insert({ ...discipleship, church_id: churchId } as any)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a discipleship
     */
    async update(id: string, updates: any) {
        const { data, error } = await (supabase.from('discipleships') as any)
            .update(updates as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },
};
