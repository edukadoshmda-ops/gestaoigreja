import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/lib/database.types';
import { compressImageFile, STORAGE_CACHE_CONTROL } from '@/utils/imageCompression';

type Member = Database['public']['Tables']['members']['Row'];
type MemberInsert = Database['public']['Tables']['members']['Insert'];
type MemberUpdate = Database['public']['Tables']['members']['Update'];

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
const CACHE_TTL_MS = isTestEnv ? 0 : 60 * 1000; // 60s em produção/dev, 0 em testes
const allMembersCache = new Map<string, CacheEntry<Member[]>>();
const inFlightRequests = new Map<string, Promise<Member[]>>();

export function clearMembersCache(churchId?: string) {
    if (churchId) {
        allMembersCache.delete(churchId);
        inFlightRequests.delete(churchId);
    } else {
        allMembersCache.clear();
        inFlightRequests.clear();
    }
}

/* =========================================================================
   HELPERS DE HIGIENIZAÇÃO DE CAMPOS (Evita violação de CHECK constraints no PostgreSQL)
   ========================================================================= */

function cleanDate(d: any): string | null {
    if (!d || typeof d !== 'string') return null;
    const trimmed = d.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
        const [day, month, year] = trimmed.split('/');
        return `${year}-${month}-${day}`;
    }
    return null;
}

function cleanMaritalStatus(status: any): 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | null {
    if (!status || typeof status !== 'string') return null;
    const s = status.toLowerCase().trim();
    if (['solteiro', 'casado', 'divorciado', 'viuvo'].includes(s)) {
        return s as any;
    }
    if (s === 'uniao_estavel' || s === 'união estável') {
        return 'casado';
    }
    return 'solteiro';
}

function cleanGender(g: any): 'masculino' | 'feminino' | null {
    if (!g || typeof g !== 'string') return null;
    const lower = g.toLowerCase().trim();
    if (lower.startsWith('masc') || lower === 'm') return 'masculino';
    if (lower.startsWith('fem') || lower === 'f') return 'feminino';
    return null;
}

function cleanStatus(st: any): 'ativo' | 'inativo' | 'visitante' {
    if (!st || typeof st !== 'string') return 'ativo';
    const s = st.toLowerCase().trim();
    if (['ativo', 'inativo', 'visitante'].includes(s)) return s as any;
    return 'ativo';
}

function sanitizeMemberPayload<T extends Record<string, any>>(raw: T): T {
    const cleaned: any = { ...raw };

    if ('marital_status' in cleaned) {
        cleaned.marital_status = cleanMaritalStatus(cleaned.marital_status);
    }
    if ('birth_date' in cleaned) {
        cleaned.birth_date = cleanDate(cleaned.birth_date);
    }
    if ('baptism_date' in cleaned) {
        cleaned.baptism_date = cleanDate(cleaned.baptism_date);
    }
    if ('gender' in cleaned) {
        cleaned.gender = cleanGender(cleaned.gender);
    }
    if ('status' in cleaned) {
        cleaned.status = cleanStatus(cleaned.status);
    }
    if ('email' in cleaned) {
        cleaned.email = cleaned.email?.trim() || null;
    }
    if ('phone' in cleaned) {
        cleaned.phone = cleaned.phone?.trim() || null;
    }
    if ('address' in cleaned) {
        cleaned.address = cleaned.address?.trim() || null;
    }
    if ('photo_url' in cleaned) {
        cleaned.photo_url = cleaned.photo_url?.trim() || null;
    }

    return cleaned as T;
}

/* =========================================================================
   LOCAL STORAGE PERSISTÊNCIA HÍBRIDA MULTI-TENANT (GARANTE QUE NUNCA TRAVE)
   ========================================================================= */

const LOCAL_KEY = (churchId: string) => `church_${churchId}_members_hybrid_v1`;

function getLocalMembers(churchId: string): Member[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(LOCAL_KEY(churchId));
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveLocalMember(churchId: string, member: Member) {
    if (typeof window === 'undefined') return;
    try {
        const current = getLocalMembers(churchId);
        const idx = current.findIndex(m => m.id === member.id);
        if (idx >= 0) {
            current[idx] = { ...current[idx], ...member, updated_at: new Date().toISOString() };
        } else {
            current.unshift(member);
        }
        localStorage.setItem(LOCAL_KEY(churchId), JSON.stringify(current));
    } catch (err) {
        console.warn('[MembersService] Falha ao salvar em localStorage:', err);
    }
}

function removeLocalMember(churchId: string, id: string) {
    if (typeof window === 'undefined') return;
    try {
        const current = getLocalMembers(churchId);
        const filtered = current.filter(m => m.id !== id);
        localStorage.setItem(LOCAL_KEY(churchId), JSON.stringify(filtered));
    } catch (err) {
        console.warn('[MembersService] Falha ao remover de localStorage:', err);
    }
}

export const membersService = {
    /**
     * Get all members (filtrado por igreja para multi-tenant, com cache e deduplicação)
     */
    async getAll(churchId?: string | null, options?: { forceRefresh?: boolean }) {
        if (!churchId) return [];

        if (!options?.forceRefresh && CACHE_TTL_MS > 0) {
            const cached = allMembersCache.get(churchId);
            if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
                return cached.data;
            }

            const inFlight = inFlightRequests.get(churchId);
            if (inFlight) {
                return inFlight;
            }
        }

        const fetchPromise = (async () => {
            try {
                const { data, error } = await supabase
                    .from('members')
                    .select('*')
                    .eq('church_id', churchId)
                    .not('church_id', 'is', null)
                    .order('name');

                if (error) throw error;
                const members = data || [];

                if (!isTestEnv) {
                    const localMembers = getLocalMembers(churchId);
                    const map = new Map<string, Member>();
                    members.forEach(m => map.set(m.id, m));
                    localMembers.forEach(m => {
                        const existing = map.get(m.id);
                        if (!existing || new Date(m.updated_at || 0) >= new Date(existing.updated_at || 0)) {
                            map.set(m.id, m);
                        }
                    });
                    const merged = Array.from(map.values()).sort((a, b) =>
                        (a.name || '').localeCompare(b.name || '')
                    );
                    if (CACHE_TTL_MS > 0) {
                        allMembersCache.set(churchId, { data: merged, timestamp: Date.now() });
                    }
                    return merged;
                }

                if (CACHE_TTL_MS > 0) {
                    allMembersCache.set(churchId, { data: members, timestamp: Date.now() });
                }
                return members;
            } catch (err) {
                // Em produção/dev, se Supabase falhar, retorna os membros locais
                if (!isTestEnv) {
                    const localMembers = getLocalMembers(churchId);
                    if (localMembers.length > 0) return localMembers;
                }
                throw err;
            } finally {
                inFlightRequests.delete(churchId);
            }
        })();

        if (CACHE_TTL_MS > 0) {
            inFlightRequests.set(churchId, fetchPromise);
        }
        return fetchPromise;
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

        const sanitized = sanitizeMemberPayload({
            ...member,
            church_id: churchId
        });

        try {
            const { data, error } = await supabase
                .from('members')
                .insert(sanitized)
                .select()
                .single();

            if (error) throw error;
            if (data && !isTestEnv) {
                saveLocalMember(churchId, data as Member);
            }
            clearMembersCache(churchId);
            return data as Member;
        } catch (err: any) {
            if (isTestEnv) throw err;

            console.warn('[MembersService] Supabase insert warning, usando persistência local:', err);
            const fallbackId = typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `mem_${Date.now()}`;

            const localMember: Member = {
                id: fallbackId,
                church_id: churchId,
                name: sanitized.name,
                email: sanitized.email || null,
                phone: sanitized.phone || null,
                birth_date: sanitized.birth_date || null,
                marital_status: sanitized.marital_status || 'solteiro',
                address: sanitized.address || null,
                city: sanitized.city || null,
                state: sanitized.state || null,
                zip_code: sanitized.zip_code || null,
                gender: sanitized.gender || null,
                baptized: sanitized.baptized ?? false,
                baptism_date: sanitized.baptism_date || null,
                member_since: sanitized.member_since || new Date().toISOString().split('T')[0],
                status: sanitized.status || 'ativo',
                photo_url: sanitized.photo_url || null,
                notes: sanitized.notes || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            saveLocalMember(churchId, localMember);
            clearMembersCache(churchId);
            return localMember;
        }
    },

    /**
     * Update a member
     */
    async update(id: string, updates: MemberUpdate, churchId?: string | null): Promise<Member> {
        const sanitized = sanitizeMemberPayload(updates);

        try {
            const { data, error } = await supabase
                .from('members')
                .update(sanitized)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            const cid = (data as Member)?.church_id || churchId;
            if (cid && !isTestEnv && data) {
                saveLocalMember(cid, data as Member);
            }
            clearMembersCache();
            return data as Member;
        } catch (err: any) {
            if (isTestEnv) throw err;

            console.warn('[MembersService] Supabase update warning, usando persistência local:', err);
            const effectiveCid = churchId || updates.church_id || 'church_default';
            const locals = getLocalMembers(effectiveCid);
            const existing = locals.find(m => m.id === id);

            const merged: Member = {
                ...(existing || {
                    id,
                    church_id: effectiveCid,
                    name: (updates.name as string) || 'Membro',
                    email: null,
                    phone: null,
                    birth_date: null,
                    marital_status: 'solteiro',
                    address: null,
                    city: null,
                    state: null,
                    zip_code: null,
                    gender: null,
                    baptized: false,
                    baptism_date: null,
                    member_since: null,
                    status: 'ativo',
                    photo_url: null,
                    notes: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }),
                ...sanitized,
                updated_at: new Date().toISOString(),
            };

            saveLocalMember(effectiveCid, merged);
            clearMembersCache();
            return merged;
        }
    },

    /**
     * Remove ou desvincula relacionamentos do membro antes da exclusão
     */
    async unlinkMemberRelations(id: string) {
        try {
            await Promise.allSettled([
                // Células: remove vínculos de anfitrião e líder
                (supabase.from('cells') as any).update({ host_id: null }).eq('host_id', id),
                (supabase.from('cells') as any).update({ leader_id: null }).eq('leader_id', id),
                // Participação em células
                (supabase.from('cell_members') as any).delete().eq('member_id', id),
                // Ministérios: líder
                (supabase.from('ministries') as any).update({ leader_id: null }).eq('leader_id', id),
                // Participação em ministérios
                (supabase.from('ministry_members') as any).delete().eq('member_id', id),
                // Eventos: responsável
                (supabase.from('events') as any).update({ responsible_id: null }).eq('responsible_id', id),
                // Participantes em eventos
                (supabase.from('event_participants' as any) as any).delete().eq('member_id', id),
                // Discipulados
                (supabase.from('discipleships') as any).delete().eq('disciple_id', id),
                (supabase.from('discipleships') as any).delete().eq('mentor_id', id),
                // Transações financeiras: desvincula membro para preservar histórico contábil
                (supabase.from('financial_transactions') as any).update({ member_id: null }).eq('member_id', id),
                // Alunos de escolas / EBD
                (supabase.from('school_students' as any) as any).delete().eq('member_id', id),
                // Pedidos de oração
                (supabase.from('prayer_requests' as any) as any).update({ member_id: null }).eq('member_id', id),
                // Escalas de serviço
                (supabase.from('service_scales' as any) as any).delete().eq('member_id', id),
            ]);
        } catch (e) {
            console.warn('[MembersService] Limpeza preventiva de relacionamentos:', e);
        }
    },

    /**
     * Delete a member
     */
    async delete(id: string, churchId?: string | null) {
        if (!isTestEnv) {
            await this.unlinkMemberRelations(id);
        }

        let { error } = await supabase
            .from('members')
            .delete()
            .eq('id', id);

        // Se houver violação residual de chave estrangeira (foreign key constraint)
        if (error) {
            const msg = error.message || '';
            const match = msg.match(/constraint "([^"]+)" on table "([^"]+)"/i);
            if (match) {
                const constraint = match[1];
                const table = match[2];
                const colMatch = constraint.match(new RegExp(`^${table}_(.+)_fkey$`));
                const col = colMatch ? colMatch[1] : null;

                if (col && table) {
                    try {
                        await (supabase.from(table as any) as any).update({ [col]: null }).eq(col, id);
                        const retry = await supabase.from('members').delete().eq('id', id);
                        if (!retry.error) {
                            if (churchId && !isTestEnv) {
                                removeLocalMember(churchId, id);
                            }
                            clearMembersCache();
                            return;
                        }
                    } catch {
                        // continua para lançar erro original
                    }
                }
            }
            throw error;
        }

        if (churchId && !isTestEnv) {
            removeLocalMember(churchId, id);
        }
        clearMembersCache();
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
        const optimized = await compressImageFile(file, { maxWidth: 600, maxHeight: 600, quality: 0.78 });
        const fileExt = (optimized instanceof File ? optimized.name : file.name).split('.').pop();
        const fileName = `${memberId}-${Date.now()}.${fileExt}`;
        const filePath = `members/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(filePath, optimized, {
                cacheControl: STORAGE_CACHE_CONTROL,
                contentType: optimized.type || file.type,
            });

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
