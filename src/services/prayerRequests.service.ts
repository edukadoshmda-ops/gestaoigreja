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

export const prayerRequestsService = {
  async list(churchId: string): Promise<PrayerRequest[]> {
    const { data, error } = await supabase
      .from('prayer_requests')
      .select('*')
      .eq('church_id', churchId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as PrayerRequest[];
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
    return data as PrayerRequest;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('prayer_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
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
  },

  subscribe(churchId: string, onInsert: (request: PrayerRequest) => void, onUpdate?: (request: PrayerRequest) => void) {
    const channel = supabase
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
          onUpdate?.(payload.new as PrayerRequest);
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  },
};
