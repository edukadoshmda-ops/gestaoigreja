# Como colocar as variáveis no Netlify (passo a passo)

## Opção 1: Importar de uma vez (recomendado)

1. Acesse: **https://app.netlify.com** → clique no site **gest-church**.
2. Menu da esquerda: **Site configuration** (Configuração do projeto).
3. Clique em **Environment variables** (Variáveis ambientais).
4. Procure um destes botões/links no topo da página:
   - **"Import from .env"**
   - **"Import from a file"**
   - **"Bulk edit"** ou **"Edit in bulk"**
   - **"Options"** (ou três pontinhos ⋮) ao lado de "Environment variables" → **Import**
5. Se aparecer **"Import from .env"** ou **"Bulk edit"**:
   - Cole exatamente estas duas linhas (troque `SUA_CHAVE_ANON_AQUI` pela chave do Supabase):

   ```
   VITE_SUPABASE_URL=https://amgpwwdhqtoaxkrvakzg.supabase.co
   VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_AQUI
   ```

   - Clique em **Import** / **Save**.

---

## Opção 2: Adicionar uma por uma

1. **Site configuration** → **Environment variables**.
2. No topo da lista de variáveis, procure:
   - **"Add a variable"** ou **"Add variable"**
   - Ou um botão **"New variable"** / **"Create variable"**
3. Ao clicar, deve abrir um painel/modal. No **topo** desse painel costuma estar:
   - Um campo **"Key"** ou **"Variable name"** → digite: `VITE_SUPABASE_URL`
   - Um campo **"Value"** ou **"Secret"** → cole: `https://amgpwwdhqtoaxkrvakzg.supabase.co`
4. Salve. Repita para a segunda variável:
   - Key: `VITE_SUPABASE_ANON_KEY`
   - Value: (cole a chave anon do Supabase)

---

## Opção 3: Pelo Netlify CLI (mais fácil)

Na pasta do projeto (onde está o `package.json`):

**Passo 1 – Vincular o site**
- Rode: `npx netlify link`
- Se pedir login: `npx netlify login`
- Quando pedir o site, escolha pelo **número** da lista o que for o **gest-church** (ou o que usa gest-church.netlify.app).
- Se **gest-church não aparecer na lista**: no painel Netlify, abra o site gest-church → **Site configuration** → **General** → em **Site information** copie o **Site ID**. No terminal rode:  
  `npx netlify link --id COLE_O_SITE_ID_AQUI`

**Passo 2 – Enviar as variáveis**
- Rode: `npm run netlify:env`  
  (isso lê o arquivo `netlify-env-import.txt` e define as variáveis no Netlify.)

**Passo 3 – Novo deploy**
- No Netlify: **Deploys** → **Trigger deploy**.
