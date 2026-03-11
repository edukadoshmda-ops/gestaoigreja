import { supabase } from '@/lib/supabaseClient';

export interface AppTipPreferences {
  id: string;
  church_id: string;
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  frequency: 'daily' | 'weekly' | 'biweekly';
  updated_at: string;
}

export async function getAppTipPreferences(churchId: string): Promise<AppTipPreferences | null> {
  const { data, error } = await supabase
    .from('app_tip_preferences')
    .select('*')
    .eq('church_id', churchId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as AppTipPreferences | null;
}

export async function upsertAppTipPreferences(
  churchId: string,
  updates: Partial<Pick<AppTipPreferences, 'email_enabled' | 'whatsapp_enabled' | 'frequency'>>
): Promise<AppTipPreferences> {
  const { data, error } = await (supabase
    .from('app_tip_preferences') as any)
    .upsert(
      {
        church_id: churchId,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'church_id' }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as AppTipPreferences;
}
