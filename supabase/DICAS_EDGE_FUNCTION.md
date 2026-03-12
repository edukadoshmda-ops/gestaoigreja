# Dicas por E-mail — Supabase Edge Function

Envio de dicas automáticas via **Supabase Edge Function**, sem depender da Vercel.

## 1. Deploy da função

```bash
# Instale o Supabase CLI se ainda não tiver: https://supabase.com/docs/guides/cli
npm install -g supabase

# Login
supabase login

# No diretório do projeto (raiz)
supabase link   # vincula ao seu projeto Supabase

# Configurar secrets
supabase secrets set RESEND_API_KEY=re_xxxxx
# Opcional: proteger com token
supabase secrets set CRON_SECRET=seu_token_secreto
# Opcional: URL do app (padrão: church-gest-oficial.vercel.app)
supabase secrets set APP_URL=https://church-gest-oficial.vercel.app

# Deploy
supabase functions deploy send-tips
```

## 2. URL da função

Após o deploy:
```
https://SEU_PROJETO.supabase.co/functions/v1/send-tips
```

Substitua `SEU_PROJETO` pelo ID do projeto no painel Supabase (Settings → API → Project URL).

## 3. Testar

1. Acesse `https://seu-app.vercel.app/testar-dicas.html` (ou abra `public/testar-dicas.html` localmente)
2. Em **URL do endpoint**, coloque: `https://SEU_PROJETO.supabase.co/functions/v1/send-tips`
3. Se configurou `CRON_SECRET`, preencha o campo **Token**
4. Clique em **Enviar dicas agora**

## 4. Agendar (cron)

### cron-job.org (gratuito)

1. Crie conta em [cron-job.org](https://cron-job.org)
2. Novo cron job:
   - **URL:** `https://SEU_PROJETO.supabase.co/functions/v1/send-tips`
   - **Método:** POST
   - **Headers:** `Authorization: Bearer SEU_CRON_SECRET` (se usar)
   - **Frequência:** ex. Segunda 9h (0 9 * * 1)

### GitHub Actions

Exemplo em `.github/workflows/send-tips-cron.yml`:

```yaml
name: Enviar dicas por e-mail
on:
  schedule:
    - cron: '0 12 * * 1'  # Segunda 12h UTC
  workflow_dispatch:
jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST "https://SEU_PROJETO.supabase.co/functions/v1/send-tips" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
        env:
          CRON_SECRET: ${{ secrets.CRON_SECRET }}
```

## 5. Pré-requisitos no Supabase

- Tabelas `app_tips`, `app_tip_deliveries`, `app_tip_preferences` (veja `app_tips_schema.sql`)
- RPC `get_users_for_email_tips` (veja `get_users_for_tips_rpc.sql`)
- Algumas dicas em `app_tips` com `active = true` e `channel IN ('email','both')`
