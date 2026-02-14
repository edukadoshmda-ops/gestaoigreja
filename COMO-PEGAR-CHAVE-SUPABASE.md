# Como pegar a chave do Supabase (para o login funcionar)

Siga estes passos. No final você só cola a chave no arquivo `.env.local`.

---

## Passo 1 – Abrir o projeto no Supabase

1. Acesse: **https://supabase.com/dashboard**
2. Faça login se precisar.
3. Clique no projeto da sua igreja (o que usa a URL `amgpwwdhqtoaxkrvakzg.supabase.co`).

---

## Passo 2 – Abrir a página de API

1. No menu da esquerda, clique no **ícone de engrenagem** (Settings).
2. Clique em **API** (ou "Project API").
3. Na página que abrir, você verá uma seção **Project API keys**.

---

## Passo 3 – Copiar a chave "anon" (public)

1. Procure a chave chamada **anon** ou **anon public**.
2. Ao lado dela tem um botão **Copy** (ou ícone de copiar).
3. Clique para copiar. A chave é longa e começa com algo como `eyJhbG...`.

---

## Passo 4 – Criar o arquivo .env.local (se ainda não existir)

1. No terminal, na pasta do projeto, rode:
   ```bash
   npm run setup:env
   ```
   Isso cria o arquivo `.env.local` a partir do `.env.example`.

## Passo 5 – Colar a chave no projeto

1. Abra o arquivo **`.env.local`** na raiz do projeto (junto do `package.json`).
2. Na linha:
   ```env
   VITE_SUPABASE_ANON_KEY=COLE_SUA_CHAVE_AQUI
   ```
   **Apague** `COLE_SUA_CHAVE_AQUI` e **cole** a chave que você copiou. Não deixe espaço antes nem depois do `=`.
3. Salve o arquivo (Ctrl+S).

Exemplo (sua chave será diferente):
```env
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...
```

---

## Passo 6 – Reiniciar o app

1. Se o `npm run dev` estiver rodando, pare com **Ctrl+C** no terminal.
2. Rode de novo: **`npm run dev`**.
3. Abra o site de novo e tente fazer login.

Se ainda der erro, confira se não sobrou espaço na linha do `VITE_SUPABASE_ANON_KEY` e se a chave está completa.
