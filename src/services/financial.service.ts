import { supabase } from '@/lib/supabaseClient';

/* =========================
   TIPOS
========================= */

export interface Transaction {
  id: string;
  type: 'entrada' | 'saida';
  category: string;
  amount: number;
  description: string | null;
  date: string;
  created_at: string;
  receipt_url?: string | null;
  receipt_filename?: string | null;
}

export interface CreateFinancialTransactionDTO {
  type: 'entrada' | 'saida';
  category: string;
  amount: number;
  description?: string | null;
  date: string; // YYYY-MM-DD
  receipt_url?: string | null;
  receipt_filename?: string | null;
  requireRemote?: boolean;
}

export interface FinancialSummary {
  month: string;
  total_income: number;
  total_expenses: number;
  balance: number;
}

/* =========================
   SERVIÇO
========================= */

const isValidUUID = (id?: string | null): boolean =>
  !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

const LOCAL_TX_KEY = (churchId?: string | null) =>
  `church_financial_transactions_${churchId || 'default'}`;

function getLocalTransactions(churchId?: string | null): Transaction[] {
  try {
    const raw = localStorage.getItem(LOCAL_TX_KEY(churchId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalTransaction(tx: Transaction, churchId?: string | null) {
  try {
    const list = getLocalTransactions(churchId);
    const idx = list.findIndex((t) => t.id === tx.id);
    if (idx >= 0) {
      list[idx] = tx;
    } else {
      list.unshift(tx);
    }
    localStorage.setItem(LOCAL_TX_KEY(churchId), JSON.stringify(list));
  } catch (err) {
    console.warn('Erro ao salvar transação local:', err);
  }
}

function removeLocalTransaction(id: string) {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('church_financial_transactions_')) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const list: Transaction[] = JSON.parse(raw);
          const filtered = list.filter((t) => t.id !== id);
          if (filtered.length !== list.length) {
            localStorage.setItem(key, JSON.stringify(filtered));
          }
        }
      }
    }
  } catch (err) {
    console.warn('Erro ao remover transação local:', err);
  }
}

async function create(data: CreateFinancialTransactionDTO, churchId: string): Promise<Transaction> {
  console.log('Criando transação:', { data, churchId });

  const hasValidUUID = isValidUUID(churchId);
  if (data.requireRemote && !hasValidUUID) {
    throw new Error('Não foi possível anexar um comprovante ao lançamento: a igreja não está sincronizada com a nuvem.');
  }

  if (hasValidUUID) {
    try {
      const insertData = {
        type: data.type,
        category: data.category,
        amount: data.amount,
        description: data.description ?? null,
        date: data.date,
        church_id: churchId,
        receipt_url: data.receipt_url ?? null,
        ...(data.receipt_filename !== undefined ? { receipt_filename: data.receipt_filename } : {}),
      };

      const { data: result, error } = await supabase
        .from('financial_transactions')
        .insert(insertData)
        .select()
        .single();

      if (!error && result) {
        console.log('Transação criada no Supabase:', result);
        saveLocalTransaction(result, churchId);
        return result;
      }
      console.warn('Supabase insert falhou, usando persistência local:', error);
      if (data.receipt_url?.startsWith('gdrive:')) {
        throw new Error(error?.message || 'Não foi possível salvar a referência do comprovante na nuvem.');
      }
      if (data.requireRemote) throw new Error(error?.message || 'Não foi possível sincronizar o lançamento com a nuvem.');
    } catch (err) {
      if (data.receipt_url?.startsWith('gdrive:') || data.requireRemote) throw err;
      console.warn('Exceção no Supabase, usando persistência local:', err);
    }
  }

  // Fallback seguro em armazenamento local
  const localTx: Transaction = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type: data.type,
    category: data.category,
    amount: data.amount,
    description: data.description ?? null,
    date: data.date,
    created_at: new Date().toISOString(),
    receipt_url: data.receipt_url ?? null,
    receipt_filename: data.receipt_filename ?? null,
  };

  saveLocalTransaction(localTx, churchId);
  console.log('Transação salva localmente:', localTx);
  return localTx;
}

async function list(startDate?: Date, endDate?: Date, churchId?: string | null): Promise<Transaction[]> {
  const localList = getLocalTransactions(churchId);
  const hasValidUUID = isValidUUID(churchId);

  let supabaseList: Transaction[] = [];

  if (hasValidUUID) {
    try {
      let query = supabase
        .from('financial_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      query = query.eq('church_id', churchId!);

      if (startDate && endDate) {
        query = query
          .gte('date', startDate.toISOString().split('T')[0])
          .lte('date', endDate.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (!error && data) {
        supabaseList = data;
      } else if (error) {
        console.warn('Aviso Supabase (list):', error.message);
      }
    } catch (err) {
      console.warn('Exceção Supabase (list):', err);
    }
  }

  // Mesclar transações locais e do Supabase sem duplicar por ID
  const map = new Map<string, Transaction>();
  supabaseList.forEach((t) => map.set(t.id, t));
  localList.forEach((t) => {
    if (!map.has(t.id)) {
      map.set(t.id, t);
    }
  });

  const merged = Array.from(map.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  if (startDate && endDate) {
    const sStr = startDate.toISOString().split('T')[0];
    const eStr = endDate.toISOString().split('T')[0];
    return merged.filter((t) => t.date >= sStr && t.date <= eStr);
  }

  return merged;
}

async function remove(id: string) {
  removeLocalTransaction(id);

  if (!id.startsWith('tx-')) {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('Aviso Supabase (delete):', error.message);
      }
    } catch (err) {
      console.warn('Exceção Supabase (delete):', err);
    }
  }
}

async function update(id: string, data: Partial<CreateFinancialTransactionDTO>, churchId?: string | null) {
  const updatingReceipt = data.receipt_url !== undefined || data.receipt_filename !== undefined;
  const persistRemote = async () => {
    const updates: Record<string, unknown> = {};
    if (data.type !== undefined) updates.type = data.type;
    if (data.category !== undefined) updates.category = data.category;
    if (data.amount !== undefined) updates.amount = data.amount;
    if (data.description !== undefined) updates.description = data.description;
    if (data.date !== undefined) updates.date = data.date;
    if (data.receipt_url !== undefined) updates.receipt_url = data.receipt_url;
    if (data.receipt_filename !== undefined) updates.receipt_filename = data.receipt_filename;
    const { error } = await (supabase.from('financial_transactions') as any)
      .update(updates as any)
      .eq('id', id);
    if (error && updatingReceipt) throw error;
  };

  if (!id.startsWith('tx-') && updatingReceipt) {
    await persistRemote();
  }

  try {
    const localList = getLocalTransactions(churchId);
    const idx = localList.findIndex((t) => t.id === id);
    if (idx >= 0) {
      localList[idx] = { ...localList[idx], ...data } as Transaction;
      saveLocalTransaction(localList[idx], churchId);
    }
  } catch (e) {
    console.warn('Erro ao atualizar localmente:', e);
  }

  if (!id.startsWith('tx-')) {
    try {
      if (!updatingReceipt) await persistRemote();
    } catch (err) {
      if (updatingReceipt) throw err;
      console.warn('Exceção Supabase (update):', err);
    }
  }
}

async function getSummary(churchId?: string | null): Promise<FinancialSummary[]> {
  let query = supabase
    .from('financial_summary')
    .select('*')
    .order('month', { ascending: false })
    .limit(12);

  if (churchId) {
    query = query.eq('church_id', churchId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao carregar resumo financeiro:', error);
    return [];
  }

  return data ?? [];
}

// Function to get transactions for detailed reporting (e.g. breakdown by category for a period)
async function getTransactionsForPeriod(monthsBack: number = 6, churchId?: string | null): Promise<Transaction[]> {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);

  let query = supabase
    .from('financial_transactions')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

  if (churchId) {
    query = query.eq('church_id', churchId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao carregar transações para relatório:', error);
    return [];
  }

  return data ?? [];
}

/* =========================
   EXPORT
========================= */

export const financialService = {
  create,
  list,
  update,
  delete: remove,
  getSummary,
  getTransactionsForPeriod
};
