import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/database.types';

type Cell = Database['public']['Tables']['cells']['Row'];
type CellInsert = Database['public']['Tables']['cells']['Insert'];
type CellUpdate = Database['public']['Tables']['cells']['Update'];

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
const CACHE_TTL_MS = isTestEnv ? 0 : 60 * 1000;
const allCellsCache = new Map<string, CacheEntry<any[]>>();
const inFlightCells = new Map<string, Promise<any[]>>();

export function clearCellsCache(churchId?: string) {
    if (churchId) {
        allCellsCache.delete(churchId);
        inFlightCells.delete(churchId);
    } else {
        allCellsCache.clear();
        inFlightCells.clear();
    }
}

export const cellsService = {
    /**
     * Get all cells (com cache e deduplicação)
     */
    async getAll(churchId?: string | null, options?: { forceRefresh?: boolean }) {
        const cacheKey = churchId || '__all__';

        if (!options?.forceRefresh && CACHE_TTL_MS > 0) {
            const cached = allCellsCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
                return cached.data;
            }
            const inFlight = inFlightCells.get(cacheKey);
            if (inFlight) {
                return inFlight;
            }
        }

        const fetchPromise = (async () => {
            try {
                let query = supabase
                    .from('cells')
                    .select(`
                *,
                leader:members!cells_leader_id_fkey(id, name, phone, email),
                host:members!cells_host_id_fkey(id, name, phone, email)
              `)
                    .order('name');
                
                if (churchId) {
                    query = query.eq('church_id', churchId);
                }

                const { data, error } = await query;

                if (error) throw error;
                const result = data || [];
                if (CACHE_TTL_MS > 0) {
                    allCellsCache.set(cacheKey, { data: result, timestamp: Date.now() });
                }
                return result;
            } finally {
                inFlightCells.delete(cacheKey);
            }
        })();

        if (CACHE_TTL_MS > 0) {
            inFlightCells.set(cacheKey, fetchPromise);
        }
        return fetchPromise;
    },

    /**
     * Get active cells only (filtrado por igreja para multi-tenant, reaproveitando cache)
     */
    async getActive(churchId?: string | null) {
        if (!churchId) return [];
        if (CACHE_TTL_MS > 0) {
            const all = await this.getAll(churchId);
            return (all || []).filter((c: any) => c.active !== false);
        }
        const { data, error } = await supabase
            .from('cells')
            .select(`
        *,
        leader:members!cells_leader_id_fkey(id, name, phone, email),
        host:members!cells_host_id_fkey(id, name, phone, email)
      `)
            .eq('church_id', churchId)
            .eq('active', true)
            .order('name');

        if (error) throw error;
        return data || [];
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
        clearCellsCache(churchId);
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
        clearCellsCache();
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
        clearCellsCache();
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
