# Deploy no Netlify (além da Vercel)

A **Vercel continua ativa**; este guia só adiciona a opção de publicar o mesmo projeto na **Netlify**.

## Por que os dois?

- **Vercel**: já configurado, link atual (ex.: gestao-igreja-steel-three.vercel.app).
- **Netlify**: segundo ambiente, mesmo repositório GitHub. Útil para backup ou outro domínio.

## Passos no Netlify

1. Acesse **https://www.netlify.com** e faça login.
2. **Add new site** → **Import an existing project**.
3. Conecte o **GitHub** e escolha o repositório **gest-o.igreja** (ou o nome atual do repo).
4. O Netlify usa o arquivo **netlify.toml** na raiz:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Em **Environment variables** (opcional), adicione as mesmas do Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Clique em **Deploy site**.

Depois do deploy, você terá uma URL tipo `nome-aleatorio.netlify.app`. Pode trocar o nome em **Site settings** → **Domain management** → **Change site name**.

A Vercel não é desativada; os dois ambientes coexistem.
