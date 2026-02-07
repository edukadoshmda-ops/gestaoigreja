# Gestão Igreja — deploy

Instruções rápidas para publicar o projeto no GitHub, Vercel e Supabase.

Passos principais

1. Criar repositório no GitHub e enviar o código:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<seu-usuario>/<seu-repo>.git
   git push -u origin main
   ```

2. Configurar Secrets no GitHub (Settings > Secrets):
   - `VERCEL_TOKEN` — token pessoal Vercel (para deploy via CLI)
   - `SUPABASE_DB_URL` — string de conexão Postgres do Supabase (ex: postgres://...)

3. Deploy no Vercel
   - Conectar repositório no painel do Vercel (recomendado) ou usar o workflow GitHub Actions (`.github/workflows/deploy_vercel.yml`) que chama o `vercel` CLI com `VERCEL_TOKEN`.
   - No Vercel, adicionar variáveis de ambiente usadas pela app (ex.: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc.).

4. Criar projeto Supabase
   - No painel do Supabase, criar um novo projeto.
   - Copiar a string de conexão Postgres (Settings → Database → Connection string) e salvar como `SUPABASE_DB_URL` secret no GitHub.
   - Opcional: copiar `anon` e `service_role` keys para as variáveis de ambiente do Vercel.

5. Aplicar schema no Supabase
   - Pode-se rodar localmente:

   ```bash
   psql "$SUPABASE_DB_URL" -f supabase/schema.sql
   ```

   - Ou usar o workflow GitHub Actions `Push Supabase schema` (manual dispatch) que lerá `supabase/schema.sql` e aplicará ao banco apontado por `SUPABASE_DB_URL`.

Observações
- Os workflows adicionados:
  - `.github/workflows/ci.yml` — instala dependências, roda testes e build.
  - `.github/workflows/deploy_vercel.yml` — deploy via Vercel CLI (requere `VERCEL_TOKEN`).
  - `.github/workflows/supabase_db.yml` — aplica `supabase/schema.sql` ao DB (requere `SUPABASE_DB_URL`).

- Antes de rodar o deploy automático, valide localmente com `npm run build` e que as variáveis de ambiente estão corretas no Vercel.

Se quiser, eu posso:
- criar o repositório remoto no GitHub (você precisará fornecer um token ou autorizar),
- executar o primeiro push por você,
- ou configurar e disparar os workflows (necessário adicionar secrets no GitHub).
# gest-o.igreja
