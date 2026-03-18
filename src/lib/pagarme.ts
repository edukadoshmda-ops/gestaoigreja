/**
 * Helpers para chamar as funções serverless (/api/*) relacionadas à Stone/Pagar.me.
 * Importante: NUNCA chame a API da Pagar.me direto do frontend (chave secreta).
 */

import { supabase } from '@/lib/supabaseClient';

type JsonRecord = Record<string, unknown>;

async function getBearerToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function postApi<T>(path: string, body: JsonRecord): Promise<T> {
  const token = await getBearerToken();

  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === 'object' && 'error' in data && (data as any).error) ||
      'Erro na API';
    throw new Error(`${msg}${data?.detail ? `: ${data.detail}` : ''}`);
  }

  return data as T;
}

export async function criarContaStone(params: {
  church_id?: string;
  nome: string;
  cnpj: string;
}) {
  return postApi('/api/criar-conta-stone', params);
}

export async function criarPagamentoStone(params: {
  church_id?: string;
  cnpj?: string;
  member_id?: string;
  amount: number;
  type: string;
  description?: string;
  pagarme_payload?: JsonRecord;
}) {
  return postApi('/api/criar-pagamento-stone', params);
}

