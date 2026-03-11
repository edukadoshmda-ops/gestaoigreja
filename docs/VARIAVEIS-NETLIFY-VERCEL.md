# Variáveis de ambiente no Netlify e na Vercel

O app precisa de **VITE_SUPABASE_URL** e **VITE_SUPABASE_ANON_KEY** para conectar ao Supabase. No deploy (Netlify ou Vercel), isso é configurado no **painel do serviço**, não no `.env.local`.

---

## Netlify (gest-church.netlify.app)

1. Acesse **https://app.netlify.com** e faça login.
2. Clique no site **gest-church** (ou no nome do seu projeto).
3. No menu: **Site configuration** (ou **Site settings**) → **Environment variables**.
4. Clique em **Add a variable** (ou **Add environment variable**).
5. Adicione duas variáveis:

   | Nome                    | Valor                                                                 |
   |-------------------------|-----------------------------------------------------------------------|
   | `VITE_SUPABASE_URL`     | `https://amgpwwdhqtoaxkrvakzg.supabase.co` (ou a URL do seu projeto)  |
   | `VITE_SUPABASE_ANON_KEY`| A chave **anon public** do Supabase (Settings > API no painel)        |

6. Salve.
7. **Redeploy:** em **Deploys**, abra o menu do último deploy → **Trigger deploy** → **Deploy site** (ou faça um novo push no GitHub).

Depois do redeploy, a tela de login deve conectar ao Supabase e o erro sumir.

---

## Vercel

1. Acesse **https://vercel.com** → seu projeto.
2. **Settings** → **Environment Variables**.
3. Adicione:
   - `VITE_SUPABASE_URL` = URL do projeto Supabase
   - `VITE_SUPABASE_ANON_KEY` = chave anon (Settings > API no Supabase)
   - `RESEND_API_KEY` = chave da API Resend (para dicas por e-mail)
   - `SUPABASE_SERVICE_ROLE_KEY` = chave service_role do Supabase (para o cron de dicas)
   - `CRON_SECRET` (opcional) = senha para proteger a rota /api/send-tips
4. Salve e faça um **Redeploy** no último deploy (menu ⋮ → Redeploy).

### Dicas automáticas por e-mail
O cron chama `/api/send-tips` toda segunda às 12h. Certifique-se de ter executado os scripts SQL:
`app_tips_schema.sql`, `seed_app_tips.sql`, `get_users_for_tips_rpc.sql`.

---

## Onde pegar a chave no Supabase

1. **https://supabase.com/dashboard** → seu projeto.
2. **Settings** (engrenagem) → **API**.
3. Em **Project API keys**, copie a chave **anon** (anon public).

Use a **mesma** URL e a **mesma** chave no Netlify e na Vercel (e no `.env.local` no seu PC).
