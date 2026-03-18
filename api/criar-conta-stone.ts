/**
 * Vercel Serverless Function: cria "recipient" na Stone/Pagar.me e salva em churches.stone_recipient_id
 * Acionar via: POST /api/criar-conta-stone
 *
 * Variáveis de ambiente na Vercel:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - SUPABASE_ANON_KEY (recomendado, para validar o usuário via JWT)
 *
 * - STONE_API_KEY (ou PAGARME_API_KEY)
 * - STONE_BASE_URL (opcional) ex: https://api.pagar.me/core/v5
 * - STONE_WEBHOOK_SECRET (opcional, se quiser usar em outros endpoints)
 *
 * Segurança:
 * - Recomendado enviar Authorization: Bearer <supabase_access_token>
 * - Alternativa (fallback): x-api-key: <STONE_ADMIN_SECRET>
 *   e definir STONE_ADMIN_SECRET na Vercel.
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 60,
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const STONE_API_KEY = process.env.STONE_API_KEY || process.env.PAGARME_API_KEY;
const STONE_BASE_URL = process.env.STONE_BASE_URL || 'https://api.pagar.me/core/v5';
const STONE_ADMIN_SECRET = process.env.STONE_ADMIN_SECRET;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

type CreateRecipientBody = {
  /**
   * Preferido: atualiza a igreja pelo ID
   * (mais seguro e evita CNPJ duplicado/formatado diferente)
   */
  church_id?: string;
  /**
   * Alternativa: atualiza a igreja pelo CNPJ (requer coluna churches.cnpj)
   */
  cnpj?: string;
  /**
   * Atalho: envie só nome + cnpj e o endpoint monta o payload do recipient.
   */
  nome?: string;
  /**
   * Opcional: se quiser controle total, envie o payload completo do recipient.
   * Se vier, ele tem prioridade sobre nome/cnpj.
   */
  recipient?: Record<string, unknown>;
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
  const json = (obj: object, status = 200) =>
    new Response(JSON.stringify(obj), { status, headers });

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return json(
      {
        error: 'Variáveis faltando',
        detail: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas',
      },
      500
    );
  }

  if (!STONE_API_KEY) {
    return json(
      {
        error: 'Variáveis faltando',
        detail: 'STONE_API_KEY (ou PAGARME_API_KEY) não configurada',
      },
      500
    );
  }

  let body: CreateRecipientBody;
  try {
    body = (await req.json()) as CreateRecipientBody;
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  const churchId = body?.church_id?.trim();
  const cnpj = body?.cnpj?.trim();
  const nome = body?.nome?.trim();

  if (!churchId && !cnpj) {
    return json({ error: 'Envie church_id ou cnpj' }, 400);
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const authHeader = req.headers.get('authorization') || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const apiKey = req.headers.get('x-api-key') || '';

  const authed = await assertAuthorized({
    jwt,
    apiKey,
    churchId: churchId || null,
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    adminSecret: STONE_ADMIN_SECRET,
  });

  if (!authed.ok) return json({ error: 'Unauthorized', detail: authed.detail }, 401);

  const recipientPayload =
    body.recipient && typeof body.recipient === 'object'
      ? body.recipient
      : buildRecipientFromNomeCnpj({ nome, cnpj });

  if (!recipientPayload) {
    return json(
      { error: 'Envie recipient ou (nome + cnpj)' },
      400
    );
  }

  // 1) Cria recipient na Stone/Pagar.me
  const recipientCreated = await createStoneRecipient({
    baseUrl: STONE_BASE_URL,
    apiKey: STONE_API_KEY,
    payload: recipientPayload,
  });

  if (!recipientCreated.ok) {
    return json(
      { error: 'Falha ao criar recipient', detail: recipientCreated.detail },
      502
    );
  }

  const stoneRecipientId = recipientCreated.recipientId;

  // 2) Salva stone_recipient_id na igreja
  const updateQuery = (supabaseAdmin as any)
    .from('churches')
    .update({ stone_recipient_id: stoneRecipientId, stone_status: 'active' });

  const { data: updated, error: updErr } = await (churchId
    ? updateQuery.eq('id', churchId)
    : updateQuery.eq('cnpj', cnpj)
  )
    .select('id, name, slug, cnpj, stone_recipient_id')
    .maybeSingle();

  if (updErr) {
    return json({ error: 'Falha ao salvar no Supabase', detail: updErr.message }, 500);
  }

  return json({
    ok: true,
    church: updated,
    stone_recipient_id: stoneRecipientId,
  });
}

function buildRecipientFromNomeCnpj(params: {
  nome?: string;
  cnpj?: string;
}): Record<string, unknown> | null {
  if (!params?.nome || !params?.cnpj) return null;
  return {
    name: params.nome,
    document: params.cnpj,
    type: 'company',
  };
}

async function createStoneRecipient(params: {
  baseUrl: string;
  apiKey: string;
  payload: Record<string, unknown>;
}): Promise<{ ok: true; recipientId: string } | { ok: false; detail: any }> {
  const url = `${params.baseUrl.replace(/\/$/, '')}/recipients`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Pagar.me/Stone costuma aceitar Basic auth com api_key como usuário.
      Authorization: `Basic ${Buffer.from(`${params.apiKey}:`).toString('base64')}`,
    },
    body: JSON.stringify(params.payload),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    return { ok: false, detail: { status: res.status, data } };
  }

  const recipientId = data?.id || data?.recipient?.id;
  if (!recipientId) {
    return { ok: false, detail: { message: 'Resposta sem id', data } };
  }

  return { ok: true, recipientId: String(recipientId) };
}

async function assertAuthorized(params: {
  jwt: string;
  apiKey: string;
  churchId: string | null;
  supabaseUrl: string;
  supabaseAnonKey?: string;
  adminSecret?: string;
}): Promise<{ ok: true } | { ok: false; detail: string }> {
  // Fallback via segredo fixo (útil para chamadas internas/admin)
  if (params.adminSecret && params.apiKey && params.apiKey === params.adminSecret) {
    return { ok: true };
  }

  // Validação via JWT do Supabase (recomendado)
  if (!params.jwt) return { ok: false, detail: 'Missing bearer token' };
  if (!params.supabaseAnonKey) return { ok: false, detail: 'Missing SUPABASE_ANON_KEY' };

  const supabaseUser = createClient(params.supabaseUrl, params.supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${params.jwt}` },
    },
  });

  const { data, error } = await supabaseUser.auth.getUser();
  if (error || !data?.user?.id) return { ok: false, detail: 'Invalid token' };

  // Se veio churchId, reforça permissão checando se o usuário é admin da igreja.
  // (Se não veio, assume que quem chamou tem o segredo x-api-key ou vai rodar sem esse vínculo.)
  if (!params.churchId) return { ok: true };

  const { data: profile, error: profErr } = await (supabaseUser as any)
    .from('profiles')
    .select('id, church_id, role')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profErr || !profile) return { ok: false, detail: 'Perfil não encontrado' };
  if (profile.church_id !== params.churchId) return { ok: false, detail: 'Igreja não autorizada' };
  if (!['admin', 'pastor', 'tesoureiro', 'superadmin', 'secretario'].includes(profile.role)) {
    return { ok: false, detail: 'Sem permissão' };
  }

  return { ok: true };
}

