import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type Event = Database['public']['Tables']['events']['Row'];
type EventInsert = Database['public']['Tables']['events']['Insert'];
type EventUpdate = Database['public']['Tables']['events']['Update'];

export const eventsService = {
    /**
     * Get all events
     */
    async getAll() {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get upcoming events
     */
    async getUpcoming() {
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('events')
            .select('*')
            .gte('date', today)
            .order('date', { ascending: true });

        if (error) throw error;
        return data;
    },

    /**
     * Get events by type
     */
    async getByType(type: Event['type']) {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .eq('type', type)
            .order('date', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get events by date range
     */
    async getByDateRange(startDate: string, endDate: string) {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        if (error) throw error;
        return data;
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
    async create(event: EventInsert) {
        const { data, error } = await supabase
            .from('events')
            .insert(event)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update an event
     */
    async update(id: string, updates: EventUpdate) {
        const { data, error } = await supabase
            .from('events')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
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
};
