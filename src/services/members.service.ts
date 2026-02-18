import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/database.types';

type Member = Database['public']['Tables']['members']['Row'];
type MemberInsert = Database['public']['Tables']['members']['Insert'];
type MemberUpdate = Database['public']['Tables']['members']['Update'];

export const membersService = {
    /**
     * Get all members (filtrado por igreja para multi-tenant)
     */
    async getAll(churchId?: string | null) {
        if (!churchId) return [];
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('church_id', churchId)
            .not('church_id', 'is', null)
            .order('name');

        if (error) throw error;
        return data || [];
    },

    /**
     * Get active members only (filtrado por igreja)
     */
    async getActive(churchId?: string | null) {
        if (!churchId) return [];
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('church_id', churchId)
            .not('church_id', 'is', null)
            .eq('status', 'ativo')
            .order('name');

        if (error) throw error;
        return data || [];
    },

    /**
     * Get a single member by ID
     */
    async getById(id: string) {
        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Create a new member
     */
    async create(member: MemberInsert, churchId: string): Promise<Member> {
        if (!churchId) {
            throw new Error('churchId é obrigatório para criar um membro');
        }
        const { data, error } = await supabase
            .from('members')
            .insert({
                ...member,
                church_id: churchId
            })
            .select()
            .single();

        if (error) throw error;
        return data as Member;
    },

    /**
     * Update a member
     */
    async update(id: string, updates: MemberUpdate): Promise<Member> {
        const { data, error } = await supabase
            .from('members')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Member;
    },

    /**
     * Delete a member
     */
    async delete(id: string) {
        const { error } = await supabase
            .from('members')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Search members by name or email (filtrado por igreja)
     */
    async search(query: string, churchId?: string | null) {
        if (!churchId) return [];
        const q = supabase
            .from('members')
            .select('*')
            .eq('church_id', churchId)
            .not('church_id', 'is', null)
            .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
            .order('name');
        const { data, error } = await q;
        if (error) throw error;
        return data || [];
    },

    /**
     * Get members with birthdays in current month (filtrado por igreja)
     */
    async getBirthdaysThisMonth(churchId?: string | null) {
        if (!churchId) return [];
        const currentMonth = new Date().getMonth() + 1;

        const { data, error } = await supabase
            .from('members')
            .select('*')
            .eq('church_id', churchId)
            .not('church_id', 'is', null)
            .not('birth_date', 'is', null)
            .eq('status', 'ativo');

        if (error) throw error;
        const list = data || [];

        // Filter by month in JavaScript since Supabase doesn't support EXTRACT in filters
        return list.filter(member => {
            if (!member.birth_date) return false;
            const birthMonth = new Date(member.birth_date).getMonth() + 1;
            return birthMonth === currentMonth;
        });
    },

    /**
     * Get member statistics
     */
    async getStatistics() {
        const { data, error } = await supabase
            .from('member_statistics')
            .select('*')
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Upload member photo
     */
    async uploadPhoto(memberId: string, file: File) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${memberId}-${Date.now()}.${fileExt}`;
        const filePath = `members/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(filePath);

        // Update member with photo URL
        await this.update(memberId, { photo_url: publicUrl });

        return publicUrl;
    },
    /**
     * Add member to ministry
     */
    async addToMinistry(memberId: string, ministryId: string) {
        const { error } = await supabase
            .from('ministry_members')
            .upsert({
                member_id: memberId,
                ministry_id: ministryId,
            }, {
                onConflict: 'member_id,ministry_id'
            });

        if (error) throw error;
    },
};
