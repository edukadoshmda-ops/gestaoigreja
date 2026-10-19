import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/lib/database.types';

export type Church = Database['public']['Tables']['churches']['Row'];
export type ChurchInsert = Database['public']['Tables']['churches']['Insert'];
export type ChurchUpdate = Database['public']['Tables']['churches']['Update'];

const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
const CHURCH_CACHE_TTL_MS = isTestEnv ? 0 : 2 * 60 * 1000;
const churchByIdCache = new Map<string, { data: Church | null; timestamp: number }>();
const churchBySlugCache = new Map<string, { data: Church | null; timestamp: number }>();

export function clearChurchesCache() {
    churchByIdCache.clear();
    churchBySlugCache.clear();
}

export const churchesService = {
    /**
     * Lista todas as igrejas da plataforma (Acesso SuperAdmin)
     */
    async getAll() {
        const { data, error } = await supabase
            .from('churches')
            .select('*')
            .order('name');

        if (error) throw error;
        return data;
    },

    /**
     * Obtém detalhes de uma igreja específica
     */
    async getById(id: string) {
        if (CHURCH_CACHE_TTL_MS > 0) {
            const cached = churchByIdCache.get(id);
            if (cached && Date.now() - cached.timestamp < CHURCH_CACHE_TTL_MS) {
                return cached.data;
            }
        }

        const { data, error } = await supabase
            .from('churches')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        if (CHURCH_CACHE_TTL_MS > 0 && data) {
            churchByIdCache.set(id, { data, timestamp: Date.now() });
        }
        return data;
    },

    /**
     * Obtém detalhes de uma igreja pelo slug ou id (usado para Multi-tenant e links diretos)
     */
    async getBySlug(slug: string) {
        const decoded = decodeURIComponent(slug).trim();
        if (CHURCH_CACHE_TTL_MS > 0) {
            const cached = churchBySlugCache.get(decoded);
            if (cached && Date.now() - cached.timestamp < CHURCH_CACHE_TTL_MS) {
                return cached.data;
            }
        }

        const { data, error } = await supabase
            .from('churches')
            .select('*')
            .eq('slug', decoded)
            .maybeSingle();

        if (!data) {
            // Tenta também por ID se for UUID ou ID único
            try {
                const { data: byId } = await supabase
                    .from('churches')
                    .select('*')
                    .eq('id', decoded)
                    .maybeSingle();
                if (byId) {
                    if (CHURCH_CACHE_TTL_MS > 0) {
                        churchBySlugCache.set(decoded, { data: byId, timestamp: Date.now() });
                        churchByIdCache.set(byId.id, { data: byId, timestamp: Date.now() });
                    }
                    return byId;
                }
            } catch {}
        }

        if (error && !data) throw error;
        if (CHURCH_CACHE_TTL_MS > 0 && data) {
            churchBySlugCache.set(decoded, { data, timestamp: Date.now() });
            churchByIdCache.set(data.id, { data, timestamp: Date.now() });
        }
        return data;
    },

    /**
     * Cria um novo tenant (Igreja) com um admin inicial opcional
     */
    /**
     * Cria igreja via checkout (chamada após confirmação de pagamento)
     * Usa RPC create_church_from_checkout se existir
     */
    async createFromCheckout(churchName: string, churchSlug: string, adminEmail?: string, transactionId?: string) {
        try {
            const { data, error } = await (supabase as any).rpc('create_church_from_checkout', {
                church_name: churchName,
                church_slug: churchSlug,
                admin_email: adminEmail || null,
                external_transaction_id: transactionId || null,
            });
            if (!error && data) {
                const { data: created } = await supabase.from('churches').select('*').eq('id', data).single();
                clearChurchesCache();
                return created;
            }
            throw error;
        } catch (e) {
            console.warn('RPC create_church_from_checkout falhou, tentando insert direto:', e);
        }
        return this.create({ name: churchName, slug: churchSlug, adminEmail });
    },

    async create(church: ChurchInsert & { adminEmail?: string }) {
        const insertPayload: Record<string, unknown> = {
            name: church.name,
            slug: church.slug,
        };
        if (church.logo_url !== undefined) insertPayload.logo_url = church.logo_url ?? null;

        if (church.adminEmail?.trim()) {
            const { data, error } = await supabase.rpc('create_church_with_admin', {
                church_name: church.name,
                church_slug: church.slug,
                admin_email: church.adminEmail.trim()
            });
            if (!error) {
                clearChurchesCache();
                return data;
            }
            // Se RPC falhar (ex: função não existe ou profiles.email inexistente),
            // tenta inserir só a igreja para não bloquear o cadastro
            console.warn('create_church_with_admin falhou, tentando insert direto:', error.message);
        }

        const { data, error } = await (supabase.from('churches') as any)
            .insert(insertPayload as any)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error(`O slug "${church.slug}" já está em uso. Escolha outro (ex: igreja-da-cidade).`);
            }
            if (error.message) throw new Error(error.message);
            throw error;
        }
        clearChurchesCache();
        return data;
    },

    /**
     * Atualiza uma igreja existente
     */
    async update(id: string, updates: ChurchUpdate) {
        const { data, error } = await (supabase.from('churches') as any)
            .update(updates as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        clearChurchesCache();
        return data;
    },

    /**
     * Deleta um tenant (Ação crítica)
     */
    async delete(id: string) {
        const { error } = await supabase
            .from('churches')
            .delete()
            .eq('id', id);

        if (error) throw error;
        clearChurchesCache();
    },

    /**
     * Estatísticas Globais para o Painel Root
     */
    async getGlobalStats() {
        // Total de igrejas
        const { count: churchCount } = await supabase
            .from('churches')
            .select('*', { count: 'exact', head: true });

        // Total de membros (Across all tenants)
        const { count: memberCount } = await supabase
            .from('members')
            .select('*', { count: 'exact', head: true });

        // Total de usuários ativos
        const { count: userCount } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        return {
            totalChurches: churchCount || 0,
            totalMembers: memberCount || 0,
            totalUsers: userCount || 0
        };
    },

    /** Capacidade máxima da plataforma */
    MAX_CHURCHES: 100,

    /**
     * Relatório consolidado: membros por igreja
     */
    async getChurchReport() {
        const { data: churches } = await supabase.from('churches').select('id, name, slug, created_at').order('name');
        if (!churches?.length) return [];

        const report: { churchId: string; churchName: string; slug: string; memberCount: number; userCount: number; createdAt: string }[] = [];
        for (const c of churches) {
            const { count: mCount } = await supabase
                .from('members')
                .select('*', { count: 'exact', head: true })
                .eq('church_id', c.id);
            const { count: uCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('church_id', c.id);
            report.push({
                churchId: c.id,
                churchName: c.name,
                slug: c.slug,
                memberCount: mCount || 0,
                userCount: uCount || 0,
                createdAt: c.created_at
            });
        }
        return report;
    },

    /**
     * Lista assinaturas/mensalidades (usa church_subscriptions se existir, senão estima)
     */
    async getSubscriptions() {
        try {
            await this.syncSubscriptionStatus();
            const { data: subs, error } = await (supabase as any)
                .from('church_subscriptions')
                .select('*, churches(name, slug)')
                .order('next_due_at');
            if (!error && subs?.length) return subs;
        } catch {
            /* table may not exist */
        }
        // Fallback: usa churches e estima próxima mensalidade (dia 10 do mês)
        const { data: churches } = await supabase.from('churches').select('id, name, slug, created_at').order('name');
        if (!churches) return [];
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 10);
        return churches.map((c: any) => ({
            church_id: c.id,
            status: 'ativa',
            plan_amount: 150,
            next_due_at: nextMonth.toISOString().slice(0, 10),
            churches: { name: c.name, slug: c.slug }
        }));
    },

    /** Sincroniza status (inadimplente dia 10, suspensa dia 15) */
    async syncSubscriptionStatus() {
        try {
            await (supabase as any).rpc('sync_subscription_status');
        } catch { /* RPC pode não existir */ }
    },

    /** Suspender serviço manualmente */
    async suspendChurchSubscription(churchId: string) {
        const { error } = await (supabase as any).rpc('suspend_church_subscription', { p_church_id: churchId });
        if (error) throw error;
    },

    /** Retomar serviço */
    async resumeChurchSubscription(churchId: string) {
        const { error } = await (supabase as any).rpc('resume_church_subscription', { p_church_id: churchId });
        if (error) throw error;
    },

    /** Registrar pagamento (volta ativa, vencimento 30 dias após assinatura + 5 dias tolerância) */
    async registerPayment(churchId: string) {
        const { error } = await (supabase as any).rpc('register_payment_church', { p_church_id: churchId });
        if (error) throw error;
    },

    /** Cancelar/excluir assinatura */
    async cancelChurchSubscription(churchId: string) {
        const { error } = await (supabase as any).rpc('cancel_church_subscription', { p_church_id: churchId });
        if (error) throw error;
    },

    /** Histórico de pagamentos de uma igreja (para SuperAdmin) */
    async getChurchSubscriptionPayments(churchId: string): Promise<{ paid_at: string; amount: number; registered_by_name: string; source: string }[]> {
        try {
            const { data, error } = await (supabase as any).rpc('get_church_subscription_payments', { p_church_id: churchId });
            if (!error && data?.length) return data;
        } catch { }
        return [];
    },

    /** Status da assinatura da igreja do usuário (para bloqueio) */
    async getMyChurchSubscriptionStatus(): Promise<{ status: string; blocked: boolean; asaas_customer_id?: string }> {
        try {
            const { data, error } = await (supabase as any).rpc('get_my_church_subscription_status');
            if (error) return { status: 'ativa', blocked: false };
            const row = Array.isArray(data) ? data[0] : data;
            if (row && typeof row === 'object' && 'status' in row) {
                return row as { status: string; blocked: boolean; asaas_customer_id?: string };
            }
        } catch { }
        return { status: 'ativa', blocked: false };
    },
};
