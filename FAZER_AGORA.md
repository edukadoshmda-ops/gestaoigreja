# O que fazer para as dicas automáticas funcionarem

## 1. Supabase (você faz)

1. Abra o **Supabase** → seu projeto → **SQL Editor**
2. Copie todo o conteúdo do arquivo `supabase/SETUP_DICAS_AUTOMATICAS.sql`
3. Cole no editor e clique em **Run**
4. Confira se aparece "Success" (sucesso)

---

## 2. Resend (você faz)

1. Acesse **resend.com** → **Chaves de API**
2. Crie uma chave com nome: `dicas` (sem hífen, sem espaço)
3. Copie o valor completo (começa com `re_`)
4. No Resend → **Público** → adicione o e-mail que vai receber as dicas (obrigatório para testes com `onboarding@resend.dev`)

---

## 3. Vercel (você faz)

1. Acesse **vercel.com** → seu projeto
2. **Settings** → **Environment Variables**
3. Adicione estas variáveis (uma por uma):

| Nome | Valor |
|------|-------|
| `RESEND_API_KEY` | Cole a chave do Resend |
| `SUPABASE_URL` | URL do seu projeto Supabase (ex: https://xxx.supabase.co) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service_role do Supabase (Settings → API) |

4. Salve e faça **Redeploy** (Deployments → ⋮ no último deploy → Redeploy)

---

## 4. Testar

Depois do deploy:

1. Abra no navegador: `https://seu-app.vercel.app/testar-dicas.html`
2. Confirme a URL do app
3. Clique em **"Enviar dicas agora"**
4. Veja o resultado na tela e verifique o e-mail (e spam)

---

## Resumo

- **SQL** → 1 arquivo só: `SETUP_DICAS_AUTOMATICAS.sql`
- **Resend** → chave + e-mail em Público
- **Vercel** → 3 variáveis de ambiente + redeploy
