import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/database.types';

type Cell = Database['public']['Tables']['cells']['Row'];
type CellInsert = Database['public']['Tables']['cells']['Insert'];
type CellUpdate = Database['public']['Tables']['cells']['Update'];

export const cellsService = {
    /**
     * Get all cells
     */
    async getAll() {
        const { data, error } = await supabase
            .from('cells')
            .select(`
        *,
        leader:members!cells_leader_id_fkey(id, name, phone, email),
        host:members!cells_host_id_fkey(id, name, phone, email)
      `)
            .order('name');

        if (error) throw error;
        return data;
    },

    /**
     * Get active cells only
     */
    async getActive() {
        const { data, error } = await supabase
            .from('cells')
            .select(`
        *,
        leader:members!cells_leader_id_fkey(id, name, phone, email),
        host:members!cells_host_id_fkey(id, name, phone, email)
      `)
            .eq('active', true)
            .order('name');

        if (error) throw error;
        return data;
    },

    /**
     * Get a single cell by ID
     */
    async getById(id: string) {
        const { data, error } = await supabase
            .from('cells')
            .select(`
        *,
        leader:members!cells_leader_id_fkey(id, name, phone, email),
        host:members!cells_host_id_fkey(id, name, phone, email)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Create a new cell
     */
    async create(cell: any, churchId: string) {
        const { data, error } = await (supabase.from('cells') as any)
            .insert({ ...cell, church_id: churchId } as any)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update a cell
     */
    async update(id: string, updates: any) {
        const { data, error } = await (supabase.from('cells') as any)
            .update(updates as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete a cell
     */
    async delete(id: string) {
        const { error } = await supabase
            .from('cells')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Get cell members
     */
    async getMembers(cellId: string) {
        const { data, error } = await supabase
            .from('cell_members')
            .select(`
        *,
        member:members(*)
      `)
            .eq('cell_id', cellId);

        if (error) throw error;
        return data;
    },

    /**
     * Add member to cell
     */
    async addMember(cellId: string, memberId: string) {
        const { data, error } = await (supabase.from('cell_members') as any)
            .insert({
                cell_id: cellId,
                member_id: memberId,
            } as any)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Remove member from cell
     */
    async removeMember(cellId: string, memberId: string) {
        const { error } = await supabase
            .from('cell_members')
            .delete()
            .eq('cell_id', cellId)
            .eq('member_id', memberId);

        if (error) throw error;
    },

    /**
     * Get all cell reports
     */
    async getAllReports() {
        const { data, error } = await supabase
            .from('cell_reports')
            .select(`
                *,
                cell:cells(id, name)
            `)
            .order('date', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Create cell report
     */
    async createReport(report: any, churchId: string) {
        const { data, error } = await (supabase.from('cell_reports') as any)
            .insert({ ...report, church_id: churchId } as any)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get member count for cell
     */
    async getMemberCount(cellId: string) {
        const { count, error } = await supabase
            .from('cell_members')
            .select('*', { count: 'exact', head: true })
            .eq('cell_id', cellId);

        if (error) throw error;
        return count || 0;
    },
};
