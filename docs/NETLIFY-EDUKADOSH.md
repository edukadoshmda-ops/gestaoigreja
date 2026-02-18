# Deploy no Netlify — edukadoshmda-ops/gestaoigreja

## URL em produção
**https://gestchurch.netlify.app**

---

## Passo a passo

### 1. Acesse o Netlify
Abra: **https://app.netlify.com/teams/edukadosh-mda/projects**

### 2. Adicionar novo site
- Clique em **"Add new site"** ou **"Add site"**
- Escolha **"Import an existing project"**

### 3. Conectar ao GitHub
- Clique em **"Deploy with GitHub"** (ou **"Import from Git"** → **GitHub**)
- Se pedir, autorize o Netlify a acessar sua conta GitHub
- Procure e selecione o repositório: **edukadoshmda-ops/gestaoigreja**

### 4. Configurações do build
O arquivo `netlify.toml` na raiz do projeto já define:
- **Build command:** `npm run build`
- **Publish directory:** `dist`

Se o Netlify não detectar, preencha manualmente:
- **Branch to deploy:** `main`
- **Build command:** `npm run build`
- **Publish directory:** `dist`

### 5. Variáveis de ambiente (obrigatório)
Antes de fazer o deploy, clique em **"Add environment variables"** e adicione:

| Nome                    | Valor                                      |
|-------------------------|--------------------------------------------|
| `VITE_SUPABASE_URL`     | `https://amgpwwdhqtoaxkrvakzg.supabase.co` |
| `VITE_SUPABASE_ANON_KEY`| (sua chave anon do Supabase)               |

Para pegar a chave: **Supabase** → seu projeto → **Settings** → **API** → **anon public**

### 6. Deploy
- Clique em **"Deploy site"** ou **"Deploy edukadoshmda-ops/gestaoigreja"**
- Aguarde o build terminar

### 7. URL do site
Depois do deploy, a URL será algo como:
- `https://nome-aleatorio.netlify.app`

Para mudar o nome: **Site settings** → **Domain management** → **Change site name** (ex: `gestaoigreja` → `gestaoigreja.netlify.app`)
