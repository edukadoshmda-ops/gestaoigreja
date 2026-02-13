import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/database.types';

type Ministry = Database['public']['Tables']['ministries']['Row'];
type MinistryInsert = Database['public']['Tables']['ministries']['Insert'];
type MinistryUpdate = Database['public']['Tables']['ministries']['Update'];

export const ministriesService = {
    /**
     * Get all ministries
     */
    async getAll() {
        const { data, error } = await supabase
            .from('ministries')
            .select(`
        *,
        leader:members!ministries_leader_id_fkey(id, name, phone, email)
      `)
            .order('name');

        if (error) throw error;
        return data;
    },

    /**
     * Get active ministries only
     */
    async getActive() {
        const { data, error } = await supabase
            .from('ministries')
            .select(`
        *,
        leader:members!ministries_leader_id_fkey(id, name, phone, email)
      `)
            .eq('active', true)
            .order('name');

        if (error) throw error;
        return data;
    },

    /**
     * Get a single ministry by ID
     */
    async getById(id: string) {
        const { data, error } = await supabase
            .from('ministries')
            .select(`
        *,
        leader:members!ministries_leader_id_fkey(id, name, phone, email)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Create a new ministry
     */
    async create(ministry: any, churchId: string) {
        const { data, error } = await (supabase.from('ministries') as any)
            .insert({ ...ministry, church_id: churchId } as any)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a ministry
     */
    async update(id: string, updates: any) {
        const { data, error } = await (supabase.from('ministries') as any)
            .update(updates as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete a ministry
     */
    async delete(id: string) {
        const { error } = await supabase
            .from('ministries')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Get ministry members
     */
    async getMembers(ministryId: string) {
        const { data, error } = await supabase
            .from('ministry_members')
            .select(`
        *,
        member:members(*)
      `)
            .eq('ministry_id', ministryId);

        if (error) throw error;
        return data;
    },

    /**
     * Add member to ministry
     */
    async addMember(ministryId: string, memberId: string, role?: string) {
        const { data, error } = await (supabase.from('ministry_members') as any)
            .insert({
                ministry_id: ministryId,
                member_id: memberId,
                role,
            } as any)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Remove member from ministry
     */
    async removeMember(ministryId: string, memberId: string) {
        const { error } = await supabase
            .from('ministry_members')
            .delete()
            .eq('ministry_id', ministryId)
            .eq('member_id', memberId);

        if (error) throw error;
    },

    /**
     * Get member count for ministry
     */
    async getMemberCount(ministryId: string) {
        const { count, error } = await supabase
            .from('ministry_members')
            .select('*', { count: 'exact', head: true })
            .eq('ministry_id', ministryId);

        if (error) throw error;
        return count || 0;
    },
};
