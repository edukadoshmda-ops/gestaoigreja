import { supabase } from '@/lib/supabaseClient';

export interface ChurchPastor {
  id: string;
  church_id: string;
  name: string;
  position: string | null;
  photo_url: string | null;
  bio: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface ChurchPastorInsert {
  church_id: string;
  name: string;
  position?: string | null;
  photo_url?: string | null;
  bio?: string | null;
  display_order?: number;
}

export interface ChurchPastorUpdate {
  name?: string;
  position?: string | null;
  photo_url?: string | null;
  bio?: string | null;
  display_order?: number;
}

const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
const CACHE_TTL_MS = isTestEnv ? 0 : 2 * 60 * 1000;
const pastorsCache = new Map<string, { data: ChurchPastor[]; timestamp: number }>();

export const pastorsService = {
  async listByChurch(churchId: string): Promise<ChurchPastor[]> {
    if (CACHE_TTL_MS > 0) {
      const cached = pastorsCache.get(churchId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
      }
    }

    const { data, error } = await supabase
      .from('church_pastors')
      .select('*')
      .eq('church_id', churchId)
      .order('display_order', { ascending: true });

    if (error) throw error;
    const list = (data || []) as ChurchPastor[];
    if (CACHE_TTL_MS > 0) {
      pastorsCache.set(churchId, { data: list, timestamp: Date.now() });
    }
    return list;
  },

  async create(pastor: ChurchPastorInsert): Promise<ChurchPastor> {
    const { data, error } = await supabase
      .from('church_pastors')
      .insert({
        church_id: pastor.church_id,
        name: pastor.name,
        position: pastor.position ?? null,
        photo_url: pastor.photo_url ?? null,
        bio: pastor.bio ?? null,
        display_order: pastor.display_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;
    pastorsCache.delete(pastor.church_id);
    return data as ChurchPastor;
  },

  async update(id: string, updates: ChurchPastorUpdate): Promise<ChurchPastor> {
    const { data, error } = await supabase
      .from('church_pastors')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    pastorsCache.clear();
    return data as ChurchPastor;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('church_pastors')
      .delete()
      .eq('id', id);

    if (error) throw error;
    pastorsCache.clear();
  },
};
