import { supabase } from '@/lib/supabaseClient';

export interface ReadingPlan {
  id: string;
  church_id: string | null;
  name: string;
  description: string | null;
  total_days: number;
  cover_image_url: string | null;
  created_at: string;
}

export interface ReadingPlanDay {
  id: string;
  plan_id: string;
  day_number: number;
  title: string | null;
  reference: string;
  content: string | null;
  created_at: string;
}

export interface ReadingPlanProgress {
  user_id: string;
  plan_id: string;
  current_day: number;
  started_at: string;
  last_read_at: string;
}

export interface ReadingPlanCompletion {
  user_id: string;
  plan_id: string;
  day_number: number;
  completed_at: string;
}

export const readingPlansService = {
  async list(churchId: string | undefined): Promise<ReadingPlan[]> {
    let query = supabase
      .from('reading_plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (churchId) {
      query = query.or(`church_id.eq.${churchId},church_id.is.null`);
    } else {
      query = query.is('church_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ReadingPlan[];
  },

  async getById(id: string): Promise<ReadingPlan | null> {
    const { data, error } = await supabase
      .from('reading_plans')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as ReadingPlan;
  },

  async getDays(planId: string): Promise<ReadingPlanDay[]> {
    const { data, error } = await supabase
      .from('reading_plan_days')
      .select('*')
      .eq('plan_id', planId)
      .order('day_number');

    if (error) throw error;
    return (data || []) as ReadingPlanDay[];
  },

  async getDay(planId: string, dayNumber: number): Promise<ReadingPlanDay | null> {
    const { data, error } = await supabase
      .from('reading_plan_days')
      .select('*')
      .eq('plan_id', planId)
      .eq('day_number', dayNumber)
      .single();

    if (error || !data) return null;
    return data as ReadingPlanDay;
  },

  async getProgress(userId: string, planId: string): Promise<ReadingPlanProgress | null> {
    const { data, error } = await supabase
      .from('reading_plan_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_id', planId)
      .single();

    if (error || !data) return null;
    return data as ReadingPlanProgress;
  },

  async startPlan(userId: string, planId: string): Promise<ReadingPlanProgress | null> {
    const { data, error } = await supabase
      .from('reading_plan_progress')
      .upsert(
        { user_id: userId, plan_id: planId, current_day: 1, last_read_at: new Date().toISOString() },
        { onConflict: 'user_id,plan_id' }
      )
      .select()
      .single();

    if (error) throw error;
    return data as ReadingPlanProgress;
  },

  async updateProgress(userId: string, planId: string, currentDay: number): Promise<void> {
    const { error } = await supabase
      .from('reading_plan_progress')
      .upsert(
        {
          user_id: userId,
          plan_id: planId,
          current_day: currentDay,
          last_read_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,plan_id' }
      );

    if (error) throw error;
  },

  /** Marca um dia como concluído e avança o progresso */
  async markDayCompleted(userId: string, planId: string, dayNumber: number): Promise<void> {
    const nextDay = dayNumber + 1;

    const { error: err1 } = await supabase.from('reading_plan_completions').upsert(
      {
        user_id: userId,
        plan_id: planId,
        day_number: dayNumber,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,plan_id,day_number' }
    );
    if (err1) {
      // Tabela completions pode não existir ainda; avança o progresso mesmo assim
      console.warn('reading_plan_completions:', err1.message);
    }

    await this.updateProgress(userId, planId, nextDay);
  },

  async getCompletions(userId: string, planId: string): Promise<ReadingPlanCompletion[]> {
    const { data, error } = await supabase
      .from('reading_plan_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_id', planId)
      .order('day_number', { ascending: false });

    if (error) throw error;
    return (data || []) as ReadingPlanCompletion[];
  },

  async createPlan(
    churchId: string | null,
    plan: { name: string; description?: string; total_days: number }
  ): Promise<ReadingPlan> {
    const { data, error } = await supabase
      .from('reading_plans')
      .insert({
        church_id: churchId,
        name: plan.name,
        description: plan.description || null,
        total_days: plan.total_days,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ReadingPlan;
  },

  async addDay(
    planId: string,
    day: { day_number: number; title?: string; reference: string; content?: string }
  ): Promise<ReadingPlanDay> {
    const { data, error } = await supabase
      .from('reading_plan_days')
      .insert({
        plan_id: planId,
        day_number: day.day_number,
        title: day.title || null,
        reference: day.reference,
        content: day.content || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ReadingPlanDay;
  },

  async deletePlan(id: string): Promise<void> {
    const { error } = await supabase.from('reading_plans').delete().eq('id', id);
    if (error) throw error;
  },
};
