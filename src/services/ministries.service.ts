import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/database.types';

type Ministry = Database['public']['Tables']['ministries']['Row'];
type MinistryInsert = Database['public']['Tables']['ministries']['Insert'];
type MinistryUpdate = Database['public']['Tables']['ministries']['Update'];

const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
const CACHE_TTL_MS = isTestEnv ? 0 : 60 * 1000;
const allMinistriesCache = new Map<string, { data: any[]; timestamp: number }>();
const inFlightMinistries = new Map<string, Promise<any[]>>();

export function clearMinistriesCache(churchId?: string) {
    if (churchId) {
        allMinistriesCache.delete(churchId);
        inFlightMinistries.delete(churchId);
    } else {
        allMinistriesCache.clear();
        inFlightMinistries.clear();
    }
}

export const ministriesService = {
    /**
     * Get all ministries (com cache e deduplicação)
     */
    async getAll(churchId?: string | null, options?: { forceRefresh?: boolean }) {
        const cacheKey = churchId || '__all__';

        if (!options?.forceRefresh && CACHE_TTL_MS > 0) {
            const cached = allMinistriesCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
                return cached.data;
            }
            const inFlight = inFlightMinistries.get(cacheKey);
            if (inFlight) return inFlight;
        }

        const fetchPromise = (async () => {
            try {
                let query = supabase
                    .from('ministries')
                    .select(`
        *,
        leader:members!ministries_leader_id_fkey(id, name, phone, email)
      `)
                    .order('name');
                
                if (churchId) {
                    query = query.eq('church_id', churchId);
                }

                const { data, error } = await query;

                if (error) throw error;
                const result = data || [];
                if (CACHE_TTL_MS > 0) {
                    allMinistriesCache.set(cacheKey, { data: result, timestamp: Date.now() });
                }
                return result;
            } finally {
                inFlightMinistries.delete(cacheKey);
            }
        })();

        if (CACHE_TTL_MS > 0) {
            inFlightMinistries.set(cacheKey, fetchPromise);
        }
        return fetchPromise;
    },

    /**
     * Get active ministries only (reaproveita cache de getAll)
     */
    async getActive(churchId?: string | null) {
        if (CACHE_TTL_MS > 0) {
            const all = await this.getAll(churchId);
            return (all || []).filter((m: any) => m.active !== false);
        }

        let query = supabase
            .from('ministries')
            .select(`
        *,
        leader:members!ministries_leader_id_fkey(id, name, phone, email)
      `)
            .eq('active', true)
            .order('name');

        if (churchId) {
            query = query.eq('church_id', churchId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
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
        clearMinistriesCache(churchId);
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
        clearMinistriesCache();
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
        clearMinistriesCache();
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
