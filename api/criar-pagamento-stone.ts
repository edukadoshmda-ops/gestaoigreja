/**
 * Vercel Serverless Function: cria pagamento na Stone/Pagar.me e registra em public.payments
 * Acionar via: POST /api/criar-pagamento-stone
 *
 * Variáveis de ambiente na Vercel:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - SUPABASE_ANON_KEY (recomendado, para validar o usuário via JWT)
 *
 * - STONE_API_KEY (ou PAGARME_API_KEY)
 * - STONE_BASE_URL (opcional) ex: https://api.pagar.me/core/v5
 *
 * Segurança:
 * - Recomendado enviar Authorization: Bearer <supabase_access_token>
 * - Alternativa: x-api-key = STONE_ADMIN_SECRET
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

type CreatePaymentBody = {
  church_id?: string;
  cnpj?: string;
  member_id?: string;
  amount: number; // em reais (ex: 10.50)
  type: string; // dizimo | oferta | mensalidade | evento | outro
  description?: string;

  /**
   * Atalho: cria um pedido PIX simples (recomendado para começar).
   * Você pode também mandar "pagarme_payload" para controle total.
   */
  method?: 'pix' | 'boleto' | 'card';

  /**
   * Se enviado, vai direto para API da Pagar.me/Stone (ordens/charges).
   * Útil quando você já souber o payload correto e quiser controlar tudo.
   */
  pagarme_payload?: Record<string, unknown>;
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

  let body: CreatePaymentBody;
  try {
    body = (await req.json()) as CreatePaymentBody;
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  const churchId = body?.church_id?.trim();
  const cnpj = body?.cnpj?.trim();
  const memberId = body?.member_id?.trim() || null;
  const amount = Number(body?.amount);
  const type = body?.type?.trim();
  const description = body?.description?.trim() || null;
  const method = body?.method || 'pix';

  if (!churchId && !cnpj) return json({ error: 'Envie church_id ou cnpj' }, 400);
  if (!Number.isFinite(amount) || amount <= 0) return json({ error: 'amount inválido' }, 400);
  if (!type) return json({ error: 'type é obrigatório' }, 400);

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

  // 1) Carrega a igreja e o recipient
  const { data: church, error: churchErr } = await (supabaseAdmin as any)
    .from('churches')
    .select('id, name, slug, cnpj, stone_mode, stone_api_key, stone_recipient_id')
    .match(churchId ? { id: churchId } : { cnpj })
    .maybeSingle();

  if (churchErr) return json({ error: 'Erro ao buscar igreja', detail: churchErr.message }, 500);
  if (!church) return json({ error: 'Igreja não encontrada' }, 404);

  const stoneModeRaw = String(church.stone_mode || 'marketplace').toLowerCase();
  const stoneMode = stoneModeRaw === 'direct' ? 'direct' : 'marketplace';
  const isDirect = stoneMode === 'direct';

  if (!isDirect && !church.stone_recipient_id) {
    return json(
      { error: 'Igreja sem stone_recipient_id', detail: 'Crie a conta Stone primeiro' },
      400
    );
  }

  if (isDirect && !church.stone_api_key) {
    return json(
      {
        error: 'Igreja sem stone_api_key',
        detail: 'Configure a chave da Stone/Pagar.me para usar o modo direct',
      },
      400
    );
  }

  const amountCents = Math.round(amount * 100);

  // 2) Cria pagamento na Stone/Pagar.me
  const basePayload =
    body.pagarme_payload && typeof body.pagarme_payload === 'object'
      ? body.pagarme_payload
      : isDirect
        ? buildSimplePixOrderDirect({
            amountCents,
            description: description || `${type} - ${church.name}`,
          })
        : buildSimplePixOrderMarketplace({
            amountCents,
            description: description || `${type} - ${church.name}`,
            recipientId: church.stone_recipient_id,
          });

  const finalPayload = isDirect ? basePayload : ensureMarketplaceSplit(basePayload, church.stone_recipient_id, amountCents);

  const pagarme = await createStonePayment({
    baseUrl: STONE_BASE_URL,
    apiKey: isDirect ? church.stone_api_key : STONE_API_KEY,
    payload: finalPayload,
  });

  if (!pagarme.ok) {
    return json({ error: 'Falha ao criar pagamento', detail: pagarme.detail }, 502);
  }

  // 3) Registra em public.payments
  const providerPaymentId = pagarme.providerPaymentId;
  const checkoutUrl = pagarme.checkoutUrl || null;
  const qrCode = pagarme.qrCode || null;
  const qrCodeUrl = pagarme.qrCodeUrl || null;

  const { data: paymentRow, error: payErr } = await (supabaseAdmin as any)
    .from('payments')
    .insert({
      church_id: church.id,
      member_id: memberId,
      amount,
      currency: 'BRL',
      status: 'pending',
      description,
      provider: 'pagarme',
      provider_payment_id: providerPaymentId,
      provider_checkout_url: checkoutUrl,
      type,
      metadata: {
        method,
        pagarme: pagarme.raw,
        qr_code: qrCode,
        qr_code_url: qrCodeUrl,
      },
    })
    .select('*')
    .maybeSingle();

  if (payErr) {
    return json({ error: 'Falha ao registrar no Supabase', detail: payErr.message }, 500);
  }

  // 4) (Opcional) Registra também em public.doacoes quando for doação/dízimo/oferta
  // Mantemos a tabela "doacoes" como módulo de doações; payments continua sendo o ledger do gateway.
  if (type === 'doacao' || type === 'dizimo' || type === 'oferta') {
    try {
      await (supabaseAdmin as any).from('doacoes').insert({
        church_id: church.id,
        user_id: authed.userId ?? null,
        payment_id: paymentRow?.id ?? null,
        gateway_id: providerPaymentId,
        valor: amount,
        status: 'pending',
      });
    } catch {
      // Não bloqueia o pagamento se a tabela não existir ainda
    }
  }

  return json({
    ok: true,
    church: { id: church.id, name: church.name, slug: church.slug },
    payment: paymentRow,
    provider: 'pagarme',
    checkout_url: checkoutUrl,
    qr_code: qrCode,
    qr_code_url: qrCodeUrl,
  });
}

function buildSimplePixOrderMarketplace(params: {
  amountCents: number;
  description: string;
  recipientId: string;
}): Record<string, unknown> {
  // Payload no formato que você passou:
  // items[] + payments[] e split[] no topo.
  // Observação: em alguns setups o "split" pode ficar dentro do payments[0];
  // aqui mantemos exatamente como o seu exemplo para você avançar.
  return {
    items: [
      {
        amount: params.amountCents,
        description: params.description,
        quantity: 1,
      },
    ],
    payments: [
      {
        payment_method: 'pix',
        pix: {
          expires_in: 3600,
        },
      },
    ],
    split: [
      {
        recipient_id: params.recipientId,
        amount: params.amountCents,
      },
    ],
  };
}

function buildSimplePixOrderDirect(params: {
  amountCents: number;
  description: string;
}): Record<string, unknown> {
  return {
    items: [
      {
        amount: params.amountCents,
        description: params.description,
        quantity: 1,
      },
    ],
    payments: [
      {
        payment_method: 'pix',
        pix: {
          expires_in: 3600,
        },
      },
    ],
  };
}

function ensureMarketplaceSplit(payload: Record<string, unknown>, recipientId: string, amountCents: number): Record<string, unknown> {
  // Se o payload já trouxe split (top-level ou dentro de payments[0]), não mexe.
  const anyPayload: any = payload as any;
  if (Array.isArray(anyPayload?.split) && anyPayload.split.length > 0) return payload;
  if (Array.isArray(anyPayload?.payments) && anyPayload.payments.length > 0) {
    const p0 = anyPayload.payments[0];
    if (Array.isArray(p0?.split) && p0.split.length > 0) return payload;
  }

  return {
    ...payload,
    split: [
      {
        recipient_id: recipientId,
        amount: amountCents,
      },
    ],
  };
}

async function createStonePayment(params: {
  baseUrl: string;
  apiKey: string;
  payload: Record<string, unknown>;
}): Promise<
  | {
      ok: true;
      providerPaymentId: string;
      checkoutUrl?: string | null;
      raw: any;
      qrCode: string | null;
      qrCodeUrl: string | null;
    }
  | { ok: false; detail: any }
> {
  // Em muitas integrações, cria-se uma "order".
  // Se sua conta estiver configurada diferente (charge direto, checkout link, etc.),
  // você pode trocar o endpoint mantendo a assinatura do retorno.
  const url = `${params.baseUrl.replace(/\/$/, '')}/orders`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
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

  if (!res.ok) return { ok: false, detail: { status: res.status, data } };

  // Tentativas de extrair um id útil para rastrear no webhook:
  const providerPaymentId =
    data?.id ||
    data?.order?.id ||
    data?.charges?.[0]?.id ||
    data?.payments?.[0]?.id;

  const checkoutUrl =
    data?.checkout_url ||
    data?.checkout?.url ||
    data?.charges?.[0]?.last_transaction?.url;

  const lastTx = data?.charges?.[0]?.last_transaction;
  const qrCode: string | null = lastTx?.qr_code ?? null;
  const qrCodeUrl: string | null = lastTx?.qr_code_url ?? null;

  if (!providerPaymentId) {
    return { ok: false, detail: { message: 'Resposta sem id do pagamento/pedido', data } };
  }

  return {
    ok: true,
    providerPaymentId: String(providerPaymentId),
    checkoutUrl: checkoutUrl ? String(checkoutUrl) : null,
    raw: data,
    qrCode,
    qrCodeUrl,
  };
}

async function assertAuthorized(params: {
  jwt: string;
  apiKey: string;
  churchId: string | null;
  supabaseUrl: string;
  supabaseAnonKey?: string;
  adminSecret?: string;
}): Promise<{ ok: true; userId?: string | null } | { ok: false; detail: string }> {
  if (params.adminSecret && params.apiKey && params.apiKey === params.adminSecret) {
    return { ok: true, userId: null };
  }

  if (!params.jwt) return { ok: false, detail: 'Missing bearer token' };
  if (!params.supabaseAnonKey) return { ok: false, detail: 'Missing SUPABASE_ANON_KEY' };

  const supabaseUser = createClient(params.supabaseUrl, params.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${params.jwt}` } },
  });

  const { data, error } = await supabaseUser.auth.getUser();
  if (error || !data?.user?.id) return { ok: false, detail: 'Invalid token' };

  if (!params.churchId) return { ok: true, userId: data.user.id };

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

  return { ok: true, userId: data.user.id };
}

