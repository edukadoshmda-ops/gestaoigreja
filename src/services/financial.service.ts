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
}

export interface CreateFinancialTransactionDTO {
  type: 'entrada' | 'saida';
  category: string;
  amount: number;
  description?: string | null;
  date: string; // YYYY-MM-DD
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

async function create(data: CreateFinancialTransactionDTO) {
  const { error } = await supabase
    .from('financial_transactions')
    .insert({
      type: data.type,
      category: data.category,
      amount: data.amount,
      description: data.description ?? null,
      date: data.date,
    });

  if (error) {
    console.error('Erro Supabase (create):', error);
    throw error;
  }
}

async function list(startDate?: Date, endDate?: Date): Promise<Transaction[]> {
  let query = supabase
    .from('financial_transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (startDate && endDate) {
    query = query
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Erro Supabase (list):', error);
    throw error;
  }

  return data ?? [];
}

async function remove(id: string) {
  const { error } = await supabase
    .from('financial_transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro Supabase (delete):', error);
    throw error;
  }
}

async function getSummary(): Promise<FinancialSummary[]> {
  const { data, error } = await supabase
    .from('financial_summary')
    .select('*')
    .order('month', { ascending: false })
    .limit(12);

  if (error) {
    console.error('Erro ao carregar resumo financeiro:', error);
    return [];
  }

  return data ?? [];
}

// Function to get transactions for detailed reporting (e.g. breakdown by category for a period)
async function getTransactionsForPeriod(monthsBack: number = 6): Promise<Transaction[]> {
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - monthsBack, 1);
  
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true });

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
  delete: remove,
  getSummary,
  getTransactionsForPeriod
};
