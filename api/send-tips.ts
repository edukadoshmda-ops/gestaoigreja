/**
 * Vercel Serverless Function: envia dicas por e-mail
 * Acionar via: POST /api/send-tips
 * Cron: configure em vercel.json (ex: semanal)
 *
 * Variáveis de ambiente na Vercel:
 * - RESEND_API_KEY
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - CRON_SECRET (opcional, para proteger a rota)
 */

import { createClient } from '@supabase/supabase-js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;
const APP_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.VITE_APP_URL || 'https://gestaoigreja.vercel.app';

export const config = {
  maxDuration: 60,
};

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
  const json = (obj: object) => new Response(JSON.stringify(obj), { status: 200, headers });
  const jsonErr = (obj: object, status: number) => new Response(JSON.stringify(obj), { status, headers });

  if (req.method !== 'POST') {
    return jsonErr({ error: 'Method not allowed' }, 405);
  }

  if (CRON_SECRET) {
    const authHeader = req.headers.get('authorization');
    const secret = authHeader?.replace('Bearer ', '');
    if (secret !== CRON_SECRET) {
      return jsonErr({ error: 'Unauthorized' }, 401);
    }
  }

  if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return jsonErr({
      error: 'Variáveis faltando',
      detail: 'RESEND_API_KEY, SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas na Vercel',
    }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data: users, error: usersError } = await (supabase as any).rpc(
      'get_users_for_email_tips'
    );

    if (usersError || !users?.length) {
      return json({
        ok: true,
        sent: 0,
        message: usersError ? usersError.message : 'Nenhum usuário para enviar',
      });
    }

    const { data: tips, error: tipsError } = await supabase
      .from('app_tips')
      .select('*')
      .eq('active', true)
      .in('channel', ['email', 'both'])
      .order('sort_order', { ascending: true });

    if (tipsError || !tips?.length) {
      return json({ ok: true, sent: 0, message: 'Nenhuma dica ativa' });
    }

    let sent = 0;

    for (const row of users) {
      const { user_id, user_email, church_id } = row;
      if (!user_email) continue;

      const { data: delivered } = await supabase
        .from('app_tip_deliveries')
        .select('tip_id')
        .eq('user_id', user_id)
        .eq('channel', 'email');

      const deliveredIds = new Set((delivered || []).map((d) => d.tip_id));
      const nextTip = tips.find((t) => !deliveredIds.has(t.id));
      if (!nextTip) continue;

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333">
  <h2 style="color:#2563eb">Dica: ${escapeHtml(nextTip.title)}</h2>
  <div style="line-height:1.6">${nextTip.content}</div>
  <p style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;font-size:14px;color:#666">
    <a href="${APP_URL}/como-acessar" style="color:#2563eb">Acesse o app</a> para mais recursos.
  </p>
  <p style="font-size:12px;color:#999">Gestão Igreja — Dicas automáticas</p>
</body>
</html>`;

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Gestão Igreja <onboarding@resend.dev>',
          to: user_email,
          subject: `Dica: ${nextTip.title}`,
          html,
        }),
      });

      const result = await res.json();

      await supabase.from('app_tip_deliveries').upsert(
        {
          tip_id: nextTip.id,
          user_id,
          church_id,
          channel: 'email',
          status: res.ok ? 'sent' : 'failed',
          error_message: res.ok ? null : JSON.stringify(result),
        },
        { onConflict: 'tip_id,user_id,channel' }
      );

      if (res.ok) sent++;
    }

    return json({ ok: true, sent, total: users.length });
  } catch (err: any) {
    return jsonErr({
      error: err?.message || 'Erro ao enviar dicas',
    }, 500);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
