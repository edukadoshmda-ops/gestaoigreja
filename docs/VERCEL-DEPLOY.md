# Corrigir erro ENOENT no Vercel — Passo a passo

## Erro: `ENOENT: não foi possível ler package.json`

Siga estes passos **na ordem**:

---

### Passo 1: Abrir o Vercel
1. Acesse: **https://vercel.com**
2. Faça login
3. Clique no seu projeto (gestao-igreja ou gest-o.igreja)

---

### Passo 2: Ir em Settings
1. Clique na aba **Settings** (Configurações) no topo da página

---

### Passo 3: Encontrar Root Directory
O **Root Directory** pode estar em um destes lugares (a interface do Vercel pode variar):

**Opção A — Build and Deployment:**
1. Na coluna da **esquerda**, procure por **"Build and Deployment"** ou **"Build & Development"**
2. Clique nele
3. Role a página para baixo até ver **"Root Directory"** ou **"Code Directory"**

**Opção B — General:**
1. Na coluna da esquerda, clique em **"General"**
2. Role até a seção **"Build and development settings"** ou **"Root Directory"**

**O que fazer quando encontrar:**
- **APAGUE** qualquer coisa que estiver no campo Root Directory (deixe vazio)
- Clique em **Save** (Salvar)

> ⚠️ O campo Root Directory **precisa estar vazio**. Se tiver qualquer caminho, o Vercel procura na pasta errada.

---

### Passo 4: Framework Preset — IMPORTANTE
Se o erro for **"vitepress: command not found"**, o Framework está errado:
1. Em **Build and Deployment**, procure **Framework Preset**
2. Mude de **VitePress** para **Vite** (não é VitePress!)
3. Salve

### Passo 5: Conferir Build Settings
No mesmo lugar (Build and Deployment), confirme:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Em **Root Directory** (se aparecer aqui também), deixe **vazio**
4. Clique em **Save** se houver alterações

---

### Passo 6: Fazer novo deploy
1. Clique na aba **Deployments** no topo
2. No último deploy (o primeiro da lista), clique nos **três pontinhos** (⋯)
3. Clique em **Redeploy**
4. **Marque** a opção: **Clear build cache and redeploy**
5. Clique em **Redeploy**

---

### Passo 7: Variáveis de ambiente (se der erro de Supabase)
1. Em **Settings** → **Environment Variables**
2. Adicione:
   - **Name:** `VITE_SUPABASE_URL`  
     **Value:** `https://amgpwwdhqtoaxkrvakzg.supabase.co`
   - **Name:** `VITE_SUPABASE_ANON_KEY`  
     **Value:** (sua chave anon do Supabase — painel Supabase → Settings → API)

---

---

## Se não encontrar Root Directory — solução alternativa

Se a opção Root Directory não aparecer, tente **reimportar o projeto**:

1. Acesse **https://vercel.com/new**
2. Em **Import Git Repository**, escolha **seminariosebitam-dot/gest-o.igreja**
3. Antes de clicar em **Deploy**, verifique:
   - **Root Directory:** deixe **vazio** (não preencha nada)
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Clique em **Deploy**

5. Adicione as variáveis de ambiente (Settings → Environment Variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

---

Se ainda der erro, envie a mensagem de erro completa.
