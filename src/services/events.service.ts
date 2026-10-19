import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/database.types';

type Event = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];
type EventUpdate = Database['public']['Tables']['events']['Update'];

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
const CACHE_TTL_MS = isTestEnv ? 0 : 60 * 1000;
const allEventsCache = new Map<string, CacheEntry<Event[]>>();
const inFlightEvents = new Map<string, Promise<Event[]>>();

export function clearEventsCache(churchId?: string) {
    if (churchId) {
        allEventsCache.delete(churchId);
        inFlightEvents.delete(churchId);
    } else {
        allEventsCache.clear();
        inFlightEvents.clear();
    }
}

export const eventsService = {
    /**
     * Get all events (com cache e deduplicação)
     */
    async getAll(churchId?: string | null, options?: { forceRefresh?: boolean }) {
        const cacheKey = churchId || '__all__';

        if (!options?.forceRefresh && CACHE_TTL_MS > 0) {
            const cached = allEventsCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
                return cached.data;
            }
            const inFlight = inFlightEvents.get(cacheKey);
            if (inFlight) {
                return inFlight;
            }
        }

        const fetchPromise = (async () => {
            try {
                let query = supabase
                    .from('events')
                    .select('*')
                    .order('date', { ascending: false });

                if (churchId) {
                    query = query.eq('church_id', churchId);
                }

                const { data, error } = await query;

                if (error) throw error;
                const result = (data || []) as Event[];
                if (CACHE_TTL_MS > 0) {
                    allEventsCache.set(cacheKey, { data: result, timestamp: Date.now() });
                }
                return result;
            } finally {
                inFlightEvents.delete(cacheKey);
            }
        })();

        if (CACHE_TTL_MS > 0) {
            inFlightEvents.set(cacheKey, fetchPromise);
        }
        return fetchPromise;
    },

    /**
     * Get upcoming events (reaproveita o cache de getAll para poupar queries no Dashboard)
     */
    async getUpcoming(churchId?: string | null) {
        const today = new Date().toISOString().split('T')[0];

        if (CACHE_TTL_MS > 0) {
            const all = await this.getAll(churchId);
            return [...(all || [])]
                .filter((e: any) => (e.date || '') >= today)
                .sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''));
        }

        let query = supabase
            .from('events')
            .select('*')
            .gte('date', today)
            .order('date', { ascending: true });

        if (churchId) {
            query = query.eq('church_id', churchId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    },

    /**
     * Get events by type
     */
    async getByType(type: Event['type'], churchId?: string | null) {
        let query = supabase
            .from('events')
            .select('*')
            .eq('type', type)
            .order('date', { ascending: false });

        if (churchId) {
            query = query.eq('church_id', churchId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    },

    /**
     * Get events by date range
     */
    async getByDateRange(startDate: string, endDate: string, churchId?: string | null) {
        let query = supabase
            .from('events')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        if (churchId) {
            query = query.eq('church_id', churchId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    },

    /**
     * Get a single event by ID
     */
    async getById(id: string) {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Create a new event
     */
    async create(event: EventInsert, churchId: string) {
        const { data, error } = await (supabase.from('events') as any)
            .insert({
                ...event,
                church_id: churchId
            })
            .select()
            .single();

        if (error) throw error;
        clearEventsCache(churchId);
        return data;
    },

    /**
     * Update an event
     */
    async update(id: string, updates: EventUpdate) {
        const { data, error } = await (supabase.from('events') as any)
            .update(updates as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        clearEventsCache();
        return data;
    },

    /**
     * Notifica todos os usuários da igreja sobre um evento
     */
    async notifyChurchAboutEvent(churchId: string, event: { title: string; date: string; time: string; type?: string }, link?: string) {
        try {
            const message = `${event.title} — ${event.date} às ${event.time}`;
            const { data, error } = await (supabase as any).rpc('notify_church_about_event', {
                p_church_id: churchId,
                p_title: '📅 Novo evento na agenda',
                p_message: message,
                p_link: link || null,
            });
            if (error) throw error;
            return data as number;
        } catch (e) {
            console.warn('notify_church_about_event:', e);
            return 0;
        }
    },

    /**
     * Delete an event
     */
    async delete(id: string) {
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id);

        if (error) throw error;
        clearEventsCache();
    },

    /**
     * Get event checklists
     */
    async getChecklists(eventId: string) {
        const { data, error } = await supabase
            .from('event_checklists')
            .select('*')
            .eq('event_id', eventId);

        if (error) throw error;
        return data;
    },

    /**
     * Add checklist item
     */
    async addChecklistItem(eventId: string, task: string, responsibleId?: string) {
        const { data, error } = await supabase
            .from('event_checklists')
            .insert({
                event_id: eventId,
                task,
                responsible_id: responsibleId,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Toggle checklist item completion
     */
    async toggleChecklistItem(id: string, completed: boolean) {
        const { data, error } = await supabase
            .from('event_checklists')
            .update({ completed })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get service scale for event
     */
    async getServiceScale(eventId: string) {
        const { data, error } = await supabase
            .from('service_scales')
            .select(`
        *,
        member:members(name, phone, email)
      `)
            .eq('event_id', eventId);

        if (error) throw error;
        return data;
    },

    /**
     * Add person to service scale
     */
    async addToServiceScale(eventId: string, memberId: string, role: string) {
        const { data, error } = await supabase
            .from('service_scales')
            .insert({
                event_id: eventId,
                member_id: memberId,
                role,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Confirm service scale participation
     */
    async confirmServiceScale(id: string, confirmed: boolean) {
        const { data, error } = await supabase
            .from('service_scales')
            .update({ confirmed })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get a single scale item with details
     */
    async getScaleItem(id: string) {
        const { data, error } = await supabase
            .from('service_scales')
            .select(`
                *,
                member:members(name),
                event:events(title, date, time)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get scale details via public RPC
     */
    async getScaleDetailsPublic(scaleId: string) {
        const { data, error } = await supabase.rpc('get_scale_details_public' as any, {
            scale_id: scaleId
        });

        if (error) throw error;
        return data;
    },

    /**
     * Confirm participation via public RPC (bypasses RLS)
     */
    async confirmParticipationPublic(scaleId: string, confirmed: boolean = true) {
        const { data, error } = await supabase.rpc('confirm_participation' as any, {
            scale_id: scaleId,
            p_confirmed: confirmed
        });

        if (error) throw error;
        return data;
    }
};
