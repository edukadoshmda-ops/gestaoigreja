/**
 * Vercel Serverless Function: webhook Stone/Pagar.me
 * Endpoint: POST /api/webhook-pagarme
 *
 * Atualiza public.payments conforme status vindo do provedor.
 *
 * Variáveis de ambiente na Vercel:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 *
 * - PAGARME_WEBHOOK_SECRET (recomendado) ou STONE_WEBHOOK_SECRET
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 60,
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

const WEBHOOK_SECRET = process.env.PAGARME_WEBHOOK_SECRET || process.env.STONE_WEBHOOK_SECRET;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

  const rawBody = await req.text();

  if (WEBHOOK_SECRET) {
    const signature =
      req.headers.get('x-hub-signature') ||
      req.headers.get('x-pagarme-signature') ||
      '';

    const ok = validateWebhookSignature({
      rawBody,
      signature,
      secret: WEBHOOK_SECRET,
    });

    if (!ok) return json({ error: 'invalid signature' }, 401);
  }

  let event: any;
  try {
    event = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return json({ error: 'invalid json' }, 400);
  }

  // Ex.: "charge.paid"
  const eventType = typeof event?.type === 'string' ? event.type : null;

  // Tentativas de extrair id/status em formatos diferentes de payload
  // Na Pagar.me, muitas vezes o webhook vem com event.data (charge/order).
  const providerPaymentId =
    event?.data?.id ||
    event?.data?.charge?.id ||
    event?.data?.order?.id ||
    event?.id ||
    null;

  const providerStatus =
    event?.data?.status ||
    event?.data?.charge?.status ||
    event?.data?.order?.status ||
    event?.status ||
    null;

  // Id interno da doação/pagamento, caso tenha sido enviado em metadata.doacao_id
  const donationId =
    event?.data?.metadata?.doacao_id ||
    event?.data?.charge?.metadata?.doacao_id ||
    null;

  if (!providerPaymentId) {
    return json({ error: 'missing provider payment id' }, 400);
  }

  const newStatus =
    mapProviderStatusFromEventType(eventType) ?? mapProviderStatus(providerStatus);

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const updatePayload: Record<string, any> = {
    status: newStatus ?? 'pending',
    stone_status: providerStatus ? String(providerStatus) : null,
    metadata: {
      ...(event ? { pagarme_webhook: event } : {}),
      ...(eventType ? { pagarme_event_type: eventType } : {}),
    },
  };

  const baseQuery = (supabaseAdmin as any).from('payments').update(updatePayload);

  const query = donationId
    ? baseQuery.eq('id', String(donationId))
    : baseQuery
        .eq('provider', 'pagarme')
        .eq('provider_payment_id', String(providerPaymentId));

  const { data: updated, error } = await query
    .select('id, status, provider_payment_id')
    .maybeSingle();

  if (error) {
    return json({ error: 'db update failed', detail: error.message }, 500);
  }

  // Também atualiza status em public.doacoes (se existir)
  try {
    const doacoesUpdate = (supabaseAdmin as any).from('doacoes').update({
      status: newStatus ?? 'pending',
      updated_at: new Date().toISOString(),
    });

    // Preferir vínculo por payment_id (id interno em payments), fallback por gateway_id (id do provedor)
    if (updated?.id) {
      await doacoesUpdate.eq('payment_id', String(updated.id));
    } else {
      await doacoesUpdate.eq('gateway_id', String(providerPaymentId));
    }
  } catch {
    // tabela pode não existir ainda
  }

  return json({ received: true, updated });
}

function mapProviderStatus(providerStatus: any): string | null {
  const s = String(providerStatus || '').toLowerCase();
  if (!s) return null;

  // Mapeamento genérico (ajuste conforme nomenclatura real)
  if (['paid', 'captured', 'success', 'succeeded'].includes(s)) return 'paid';
  if (['failed', 'refused', 'canceled', 'cancelled', 'voided'].includes(s)) return 'failed';
  if (['refunded', 'chargeback'].includes(s)) return 'refunded';
  return 'pending';
}

function mapProviderStatusFromEventType(eventType: string | null): string | null {
  const t = String(eventType || '').toLowerCase();
  if (!t) return null;

  // Formato comum: "charge.paid"
  if (t === 'charge.paid' || t === 'payment.paid') return 'paid';
  if (t === 'charge.failed' || t === 'payment.failed') return 'failed';
  if (t === 'charge.canceled' || t === 'payment.canceled') return 'failed';
  if (t === 'charge.refunded' || t === 'payment.refunded') return 'refunded';

  return null;
}

function validateWebhookSignature(params: {
  rawBody: string;
  signature: string;
  secret: string;
}): boolean {
  // TODO: implementar validação oficial (HMAC/sha) conforme documentação da Pagar.me/Stone.
  // Por enquanto, se o secret existir, exige que a signature venha preenchida.
  // Quando você me mandar o formato do header/algoritmo, eu implemento certinho.
  return Boolean(params.secret && params.signature);
}

