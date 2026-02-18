import { supabase } from '@/lib/supabaseClient';

export type BroadcastType = 'aviso' | 'boletim' | 'devocional';

export interface SendBroadcastParams {
  churchId: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error';
  link?: string | null;
  /** Canal exclusivo: envia apenas para líderes (admin, pastor, secretario, lider_celula, lider_ministerio) */
  leadersOnly?: boolean;
}

export const broadcastsService = {
  /** Envia boletim/aviso/devocional para todos os usuários da igreja */
  async send(params: SendBroadcastParams): Promise<{ success: boolean; count: number; message: string }> {
    const { data, error } = await (supabase as any).rpc('send_broadcast', {
      p_church_id: params.churchId,
      p_title: params.title,
      p_message: params.message,
      p_type: params.type ?? 'info',
      p_link: params.link ?? null,
      p_leaders_only: params.leadersOnly ?? false,
    });

    if (error) throw error;
    return data;
  },

  /** Conta quantos perfis receberão o envio */
  async getRecipientCount(churchId: string, leadersOnly = false): Promise<number> {
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', churchId);

    if (leadersOnly) {
      query = query.in('role', ['admin', 'pastor', 'secretario', 'lider_celula', 'lider_ministerio']);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  },
};
