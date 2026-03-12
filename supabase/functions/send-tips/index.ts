/**
 * Supabase Edge Function: envia dicas por e-mail
 * URL: /functions/v1/send-tips
 *
 * Secrets no Supabase: RESEND_API_KEY (e opcionalmente CRON_SECRET)
 * Acionar via: POST com Authorization: Bearer <CRON_SECRET>
 * Cron externo: cron-job.org, GitHub Actions, etc.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const json = (obj: object, status = 200) =>
    new Response(JSON.stringify(obj), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const CRON_SECRET = Deno.env.get("CRON_SECRET");
  if (CRON_SECRET) {
    const auth = req.headers.get("authorization");
    const token = auth?.replace("Bearer ", "");
    if (token !== CRON_SECRET) {
      return json({ error: "Unauthorized" }, 401);
    }
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const APP_URL =
    Deno.env.get("APP_URL") || "https://church-gest-oficial.vercel.app";

  if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(
      {
        error: "Variáveis faltando",
        detail:
          "RESEND_API_KEY e SUPABASE_* configurados no Supabase (Settings > Edge Functions > Secrets)",
      },
      500
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: users, error: usersError } = await supabase.rpc(
      "get_users_for_email_tips"
    );

    if (usersError || !users?.length) {
      return json({
        ok: true,
        sent: 0,
        message: usersError ? usersError.message : "Nenhum usuário para enviar",
      });
    }

    const { data: tips, error: tipsError } = await supabase
      .from("app_tips")
      .select("*")
      .eq("active", true)
      .in("channel", ["email", "both"])
      .order("sort_order", { ascending: true });

    if (tipsError || !tips?.length) {
      return json({ ok: true, sent: 0, message: "Nenhuma dica ativa" });
    }

    let sent = 0;

    for (const row of users) {
      const { user_id, user_email, church_id } = row;
      if (!user_email) continue;

      const { data: delivered } = await supabase
        .from("app_tip_deliveries")
        .select("tip_id")
        .eq("user_id", user_id)
        .eq("channel", "email");

      const deliveredIds = new Set((delivered || []).map((d: { tip_id: string }) => d.tip_id));
      const nextTip = tips.find((t: { id: string }) => !deliveredIds.has(t.id));
      if (!nextTip) continue;

      const html = `<!DOCTYPE html>
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

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Gestão Igreja <onboarding@resend.dev>",
          to: user_email,
          subject: `Dica: ${nextTip.title}`,
          html,
        }),
      });

      const result = await res.json();

      await supabase.from("app_tip_deliveries").upsert(
        {
          tip_id: nextTip.id,
          user_id,
          church_id,
          channel: "email",
          status: res.ok ? "sent" : "failed",
          error_message: res.ok ? null : JSON.stringify(result),
        },
        { onConflict: "tip_id,user_id,channel" }
      );

      if (res.ok) sent++;
    }

    return json({ ok: true, sent, total: users.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao enviar dicas";
    return json({ error: message }, 500);
  }
});
