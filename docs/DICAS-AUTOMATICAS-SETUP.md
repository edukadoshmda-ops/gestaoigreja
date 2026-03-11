# Setup: Dicas automáticas por e-mail

## 1. Banco de dados (Supabase)

No SQL Editor do Supabase, execute nesta ordem:

1. `supabase/app_tips_schema.sql`
2. `supabase/seed_app_tips.sql`
3. `supabase/get_users_for_tips_rpc.sql`

## 2. Variáveis na Vercel

Em **Settings → Environment Variables**, adicione:

| Variável | Descrição |
|----------|-----------|
| `RESEND_API_KEY` | Chave da API Resend (resend.com → API Keys) |
| `SUPABASE_URL` | URL do projeto (ex: https://xxx.supabase.co) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (Supabase → Settings → API) |
| `CRON_SECRET` | (Opcional) Senha para proteger POST /api/send-tips |

## 3. Cron

O cron está em `vercel.json`: **toda segunda às 12h** (`0 12 * * 1`).

## 4. Preferências no app

Em **Como Acessar**, admins/pastores/secretários veem os toggles:
- Dicas por e-mail
- Dicas por WhatsApp (em breve)

## 5. Testar manualmente

```bash
curl -X POST https://seu-dominio.vercel.app/api/send-tips
```

Se definiu `CRON_SECRET`:
```bash
curl -X POST https://seu-dominio.vercel.app/api/send-tips \
  -H "Authorization: Bearer SEU_CRON_SECRET"
```

## 6. E-mail de teste (Resend)

O domínio padrão `onboarding@resend.dev` só envia para e-mails **verificados** na conta Resend. Para produção, adicione e verifique seu domínio em resend.com → Domains.
