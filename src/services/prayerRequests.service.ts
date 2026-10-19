import { supabase } from '@/lib/supabaseClient';

export interface PrayerRequest {
  id: string;
  church_id: string;
  content: string;
  is_anonymous: boolean;
  requester_id: string | null;
  requester_name: string | null;
  contact?: string | null;
  category?: 'saude' | 'familia' | 'financeiro' | 'espiritual' | 'outros' | null;
  status?: 'pendente' | 'em_oracao' | 'respondido' | 'concluido' | null;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  return_date?: string | null;
  testimony?: string | null;
  answered_at?: string | null;
  prayed_count: number;
  created_at: string;
}

const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
const CACHE_TTL_MS = isTestEnv ? 0 : 60 * 1000;
const prayerCache = new Map<string, { data: PrayerRequest[]; timestamp: number }>();

export function clearPrayerRequestsCache(churchId?: string) {
  if (churchId) prayerCache.delete(churchId);
  else prayerCache.clear();
}

export const prayerRequestsService = {
  async list(churchId: string, options?: { forceRefresh?: boolean }): Promise<PrayerRequest[]> {
    if (!options?.forceRefresh && CACHE_TTL_MS > 0) {
      const cached = prayerCache.get(churchId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
      }
    }

    const { data, error } = await supabase
      .from('prayer_requests')
      .select('*')
      .eq('church_id', churchId)
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) throw error;
    const result = (data || []) as PrayerRequest[];
    if (CACHE_TTL_MS > 0) {
      prayerCache.set(churchId, { data: result, timestamp: Date.now() });
    }
    return result;
  },

  async create(
    churchId: string,
    params: {
      content: string;
      isAnonymous?: boolean;
      requesterName?: string;
      contact?: string;
      category?: 'saude' | 'familia' | 'financeiro' | 'espiritual' | 'outros';
      status?: 'pendente' | 'em_oracao' | 'respondido' | 'concluido';
      assignedTo?: string;
      assignedToName?: string;
      returnDate?: string;
      testimony?: string;
      answeredAt?: string;
    }
  ): Promise<PrayerRequest> {
    const { data: { user } } = await supabase.auth.getUser();

    const initialStatus = params.status || (params.testimony?.trim() ? 'respondido' : 'pendente');
    const initialAnsweredAt = params.answeredAt || (params.testimony?.trim() ? new Date().toISOString() : null);

    const { data, error } = await supabase
      .from('prayer_requests')
      .insert({
        church_id: churchId,
        content: params.content.trim(),
        is_anonymous: params.isAnonymous ?? false,
        requester_id: params.isAnonymous ? null : user?.id ?? null,
        requester_name: params.isAnonymous ? null : (params.requesterName?.trim() || user?.email?.split('@')[0] || 'Anônimo'),
        contact: params.contact?.trim() || null,
        category: params.category || 'outros',
        status: initialStatus,
        assigned_to: params.assignedTo || null,
        assigned_to_name: params.assignedToName || null,
        return_date: params.returnDate || null,
        testimony: params.testimony?.trim() || null,
        answered_at: initialAnsweredAt,
      })
      .select()
      .single();

    if (error) throw error;
    clearPrayerRequestsCache(churchId);
    return data as PrayerRequest;
  },

  async update(id: string, updates: Partial<PrayerRequest>): Promise<PrayerRequest> {
    const { data, error } = await supabase
      .from('prayer_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    clearPrayerRequestsCache();
    return data as PrayerRequest;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('prayer_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
    clearPrayerRequestsCache();
  },

  async incrementPrayed(id: string): Promise<void> {
    const { data } = await supabase
      .from('prayer_requests')
      .select('prayed_count')
      .eq('id', id)
      .single();

    const newCount = ((data as any)?.prayed_count ?? 0) + 1;

    const { error } = await supabase
      .from('prayer_requests')
      .update({ prayed_count: newCount })
      .eq('id', id);

    if (error) throw error;
    clearPrayerRequestsCache();
  },

  subscribe(churchId: string, onInsert: (request: PrayerRequest) => void, onUpdate?: (request: PrayerRequest) => void) {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;
    const IDLE_TIMEOUT_MS = 60 * 1000; // 60s sem interação desconecta o WebSocket para poupar as 200 conexões

    const disconnect = () => {
      if (channel) {
        supabase.removeChannel(channel);
        channel = null;
      }
    };

    const connect = () => {
      if (channel || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) return;
      channel = supabase
        .channel(`prayer_requests:${churchId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'prayer_requests',
            filter: `church_id=eq.${churchId}`,
          },
          (payload) => {
            clearPrayerRequestsCache(churchId);
            onInsert(payload.new as PrayerRequest);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'prayer_requests',
            filter: `church_id=eq.${churchId}`,
          },
          (payload) => {
            clearPrayerRequestsCache(churchId);
            onUpdate?.(payload.new as PrayerRequest);
          }
        )
        .subscribe();
    };

    const resetIdle = () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        connect();
        idleTimer = setTimeout(disconnect, IDLE_TIMEOUT_MS);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (idleTimer) clearTimeout(idleTimer);
        disconnect();
      } else {
        resetIdle();
      }
    };

    resetIdle();
    window.addEventListener('pointerdown', resetIdle, { passive: true });
    window.addEventListener('keydown', resetIdle, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener('pointerdown', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      document.removeEventListener('visibilitychange', onVisibility);
      disconnect();
    };
  },
};
