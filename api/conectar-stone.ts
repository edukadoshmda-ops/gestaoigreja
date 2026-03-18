/**
 * Vercel Serverless Function: conecta Stone (modo direct) para uma igreja
 * Endpoint: POST /api/conectar-stone
 *
 * Salva em public.churches:
 * - stone_mode = 'direct'
 * - stone_api_key = <api_key>
 *
 * Segurança:
 * - Recomendado enviar Authorization: Bearer <supabase_access_token>
 * - Alternativa (admin/fallback): x-api-key: <STONE_ADMIN_SECRET>
 *
 * Variáveis de ambiente:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - SUPABASE_ANON_KEY (para validar JWT)
 * - STONE_ADMIN_SECRET (opcional)
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 60,
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const STONE_ADMIN_SECRET = process.env.STONE_ADMIN_SECRET;
const STONE_BASE_URL = process.env.STONE_BASE_URL || 'https://api.pagar.me/core/v5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

type ConnectStoneBody = {
  igreja_id?: string;
  church_id?: string;
  api_key?: string;
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

  let body: ConnectStoneBody;
  try {
    body = (await req.json()) as ConnectStoneBody;
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  const churchId = String(body?.church_id || body?.igreja_id || '').trim();
  const apiKeyChurch = String(body?.api_key || '').trim();

  if (!churchId) return json({ error: 'church_id (ou igreja_id) é obrigatório' }, 400);
  if (!apiKeyChurch) return json({ error: 'api_key é obrigatório' }, 400);

  const authHeader = req.headers.get('authorization') || '';
  const jwt = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  const apiKey = req.headers.get('x-api-key') || '';

  const authed = await assertAuthorized({
    jwt,
    apiKey,
    churchId,
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    adminSecret: STONE_ADMIN_SECRET,
  });
  if (!authed.ok) return json({ error: 'Unauthorized', detail: authed.detail }, 401);

  // Valida a API Key antes de salvar (Stone/Pagar.me Basic Auth)
  const keyOk = await validateStoneApiKey({
    baseUrl: STONE_BASE_URL,
    apiKey: apiKeyChurch,
  });
  if (!keyOk.ok) {
    return json({ error: 'API Key inválida', detail: keyOk.detail }, 400);
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: updated, error } = await (supabaseAdmin as any)
    .from('churches')
    .update({
      stone_mode: 'direct',
      stone_api_key: apiKeyChurch,
    })
    .eq('id', churchId)
    .select('id, name, slug, stone_mode, stone_recipient_id, stone_status')
    .maybeSingle();

  if (error) return json({ error: 'Falha ao salvar no Supabase', detail: error.message }, 500);

  return json({
    ok: true,
    church: updated,
  });
}

async function validateStoneApiKey(params: {
  baseUrl: string;
  apiKey: string;
}): Promise<{ ok: true } | { ok: false; detail: any }> {
  // Usamos um GET simples em /orders com paginação mínima só para validar credenciais.
  // Se a chave for inválida, a API costuma responder 401/403.
  const url = `${params.baseUrl.replace(/\/$/, '')}/orders?page=1&size=1`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${Buffer.from(`${params.apiKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.ok) return { ok: true };

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { ok: false, detail: { status: res.status, data } };
}

async function assertAuthorized(params: {
  jwt: string;
  apiKey: string;
  churchId: string;
  supabaseUrl: string;
  supabaseAnonKey?: string;
  adminSecret?: string;
}): Promise<{ ok: true } | { ok: false; detail: string }> {
  if (params.adminSecret && params.apiKey && params.apiKey === params.adminSecret) {
    return { ok: true };
  }

  if (!params.jwt) return { ok: false, detail: 'Missing bearer token' };
  if (!params.supabaseAnonKey) return { ok: false, detail: 'Missing SUPABASE_ANON_KEY' };

  const supabaseUser = createClient(params.supabaseUrl, params.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${params.jwt}` } },
  });

  const { data, error } = await supabaseUser.auth.getUser();
  if (error || !data?.user?.id) return { ok: false, detail: 'Invalid token' };

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

