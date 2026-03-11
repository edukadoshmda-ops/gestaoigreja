import { supabase } from '@/lib/supabaseClient';
import { churchesService } from './churches.service';

const HOTMART_CHECKOUT_URL = import.meta.env.VITE_HOTMART_CHECKOUT_URL || 'https://pay.hotmart.com/O104666619F?bid=1772219819580';
const STORAGE_KEY = 'trial_church_form_data';

export function getTrialFormData(): TrialChurchFormData | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TrialChurchFormData;
  } catch {
    return null;
  }
}

export function clearTrialFormData(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export type TrialChurchFormData = {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  cep: string;
  city: string;
  state: string;
  pastorName: string;
  pastorPhone: string;
  logoUrl: string;
};

export type TrialInfo = {
  isTrial: boolean;
  trialStartedAt?: string | null;
  nextDueAt?: string | null;
  daysLeft?: number;
  isExpired?: boolean;
  institutionalCompleted?: boolean;
};

export const trialService = {
  /** Quantidade de vagas restantes para trial (100 - atual) */
  TRIAL_LIMIT: 100,

  /** Verificar se ainda há vagas para trial */
  async canStartTrial(): Promise<{ allowed: boolean; count: number }> {
    try {
      const { data, error } = await (supabase as any).rpc('count_trial_churches');
      if (error) return { allowed: true, count: 0 };
      const count = typeof data === 'number' ? data : (data ?? 0);
      return { allowed: count < this.TRIAL_LIMIT, count };
    } catch {
      return { allowed: true, count: 0 };
    }
  },

  /** Obter info do trial da igreja do usuário */
  async getTrialInfo(churchId: string | undefined): Promise<TrialInfo> {
    if (!churchId) return { isTrial: false };
    try {
      const { data, error } = await (supabase as any).rpc('get_trial_info', { p_church_id: churchId });
      if (error) return { isTrial: false };
      if (!data || typeof data !== 'object') return { isTrial: false };
      const d = Array.isArray(data) ? data[0] : data;
      return { isTrial: !!d?.isTrial, ...d } as TrialInfo;
    } catch {
      return { isTrial: false };
    }
  },

  /** Marcar página institucional como preenchida */
  async setInstitutionalCompleted(churchId: string): Promise<void> {
    const { error } = await (supabase as any).rpc('set_institutional_completed', { p_church_id: churchId });
    if (error) throw error;
  },

  /** Salvar lead e expirar trial (chamado quando trial expira) */
  async saveLeadAndExpire(churchId: string): Promise<void> {
    const { error } = await (supabase as any).rpc('save_trial_lead_and_expire', { p_church_id: churchId });
    if (error) throw error;
  },

  /** Criar igreja trial e assinatura (chamado após signup de usuário trial) */
  async createTrialChurchForUser(adminEmail: string, adminName: string): Promise<string> {
    const { allowed } = await this.canStartTrial();
    if (!allowed) {
      throw new Error(`Limite de ${this.TRIAL_LIMIT} igrejas em teste atingido. Tente novamente em breve ou assine o plano.`);
    }
    const formData = getTrialFormData();
    const slug = `igreja-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const name = formData?.name?.trim() || 'Nova Igreja';
    const church = await churchesService.create({
      name,
      slug,
      logo_url: formData?.logoUrl || null,
      president_name: formData?.pastorName || null,
      address: formData?.address || null,
      phone: formData?.phone || null,
      email: formData?.email || null,
      whatsapp: formData?.whatsapp || null,
    } as any);
    const churchId = (church as any).id;
    if (!churchId) throw new Error('Falha ao criar igreja de teste.');
    await (supabase as any).rpc('create_trial_subscription_for_church', { p_church_id: churchId });
    if (formData) {
      const updates: Record<string, unknown> = {};
      if (formData.cnpj) updates.cnpj = formData.cnpj;
      if (formData.cep) updates.cep = formData.cep;
      if (formData.city) updates.city = formData.city;
      if (formData.state) updates.state = formData.state;
      if (formData.pastorPhone) updates.pastor_phone = formData.pastorPhone;
      if (Object.keys(updates).length > 0) {
        try {
          await churchesService.update(churchId, updates as any);
        } catch {}
      }
      clearTrialFormData();
    }
    return churchId;
  },

  /** URL da página de venda (Hotmart) */
  getSalesUrl(): string {
    return HOTMART_CHECKOUT_URL;
  },
};
