# Plano: E-mails e WhatsApp automáticos com dicas do app

## Objetivo
Enviar dicas automáticas sobre como usar o Gestão Igreja para pastores e administradores por **e-mail** e **WhatsApp**, em sequência programada (ex: 1 dica por semana).

---

## O que já existe

### Banco de dados (após executar os scripts)
- **`app_tips`** — Dicas (título, conteúdo, canal: email/whatsapp/both)
- **`app_tip_deliveries`** — Controle de envios (quem já recebeu qual dica)
- **`app_tip_preferences`** — Preferências por igreja (opt-in e frequência)

### Seed
- **`supabase/seed_app_tips.sql`** — 9 dicas iniciais já inseridas

---

## 1. E-mail automático

### Opções recomendadas

| Serviço | Custo | Integração |
|---------|-------|------------|
| **Resend** | Grátis até 3k/mês | API REST simples |
| **SendGrid** | Grátis até 100/dia | API REST |
| **Supabase Auth SMTP** | Já configurado para auth | Limite de uso interno |

### Implementação com Resend + Supabase Edge Function

1. **Criar conta no Resend** (resend.com) e pegar a API Key.

2. **Supabase Edge Function** (exemplo em `supabase/functions/send-tips-email/`):

```typescript
// supabase/functions/send-tips-email/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'https://esm.sh/resend@2';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // 1. Buscar dicas não enviadas (próxima da fila)
  // 2. Buscar usuários com email (auth.users) que ainda não receberam
  // 3. Enviar via Resend
  // 4. Registrar em app_tip_deliveries

  const { data } = await resend.emails.send({
    from: 'Gestão Igreja <dicas@app.gestaoigreja.com.br>',
    to: 'usuario@email.com',
    subject: `Dica: ${titulo}`,
    html: conteudo
  });

  return new Response(JSON.stringify({ ok: true, id: data?.id }));
});
```

3. **Agendar execução** (ex: 1x por semana):
   - **Vercel Cron** (se o app estiver na Vercel): criar `api/cron/send-tips.ts` e chamar a Edge Function
   - **Supabase pg_cron** (disponível em projetos Pro): agendar chamada HTTP à Edge Function
   - **GitHub Actions** ou **cron-job.org**: chamada HTTP semanal

4. **Variáveis de ambiente** (Supabase Edge Functions):
   - `RESEND_API_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (já existe)
   - `SUPABASE_URL` (já existe)

---

## 2. WhatsApp automático

### Opções

| Opção | Custo | Observação |
|-------|-------|------------|
| **WhatsApp Business API (Meta)** | Pago, aprovação | Oficial, mais caro e burocrático |
| **Evolution API** (self-hosted) | Grátis | Open source, precisa hospedar |
| **Z-API** | Pago | API brasileira, simples |
| **Twilio** | Pago | Global, confiável |

### Limitação atual
O app hoje usa apenas `wa.me` (abre o WhatsApp com mensagem pronta; o usuário clica para enviar). Para **envio automático**, é obrigatório usar uma API que envie mensagens sem intervenção do usuário.

### Passos com Z-API (exemplo)
1. Contratar plano em z-api.io
2. Conectar um número de WhatsApp
3. Chamar a API REST para enviar mensagem:

```bash
curl -X POST "https://api.z-api.io/instances/XXX/token/YYY/send-text" \
  -H "Content-Type: application/json" \
  -d '{"phone": "5591999999999", "message": "Olá! Dica do Gestão Igreja: ..."}'
```

4. Criar Edge Function ou backend que, no cron, busca usuários com `phone` em `profiles`, verifica `app_tip_deliveries` e chama a API do Z-API.

### Dados necessários
- **E-mail**: `auth.users.email` (via service role)
- **Telefone**: `profiles.phone` (precisa estar preenchido)

---

## 3. Fluxo sugerido

1. **Opt-in**: Na primeira vez que o pastor/admin acessa, exibir modal:  
   "Deseja receber dicas por e-mail e WhatsApp?" → gravar em `app_tip_preferences`.
2. **Cron semanal**: Toda segunda-feira, 9h, rodar a função que:
   - Busca igrejas com `email_enabled` ou `whatsapp_enabled`
   - Para cada igreja, pega admins/pastores com email/telefone
   - Busca a próxima dica não enviada (por `sort_order`)
   - Envia e insere em `app_tip_deliveries`
3. **Respeitar opt-out**: Se o usuário desativar, não enviar mais.

---

## 4. Scripts SQL a executar (ordem)

1. `supabase/app_tips_schema.sql`
2. `supabase/seed_app_tips.sql`
3. `supabase/get_users_for_tips_rpc.sql`

## 5. API Vercel e Cron (implementado)

- **`api/send-tips.ts`** — Função serverless que envia dicas por e-mail via Resend.
- **Cron** em `vercel.json`: toda segunda às 12h (0 12 * * 1).

### Variáveis na Vercel (Settings → Environment Variables)
- `RESEND_API_KEY` — Chave da API Resend
- `SUPABASE_URL` — URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (Settings → API)
- `CRON_SECRET` (opcional) — Se definido, a rota exige `Authorization: Bearer <CRON_SECRET>`

### Testar manualmente
```bash
curl -X POST https://seu-dominio.vercel.app/api/send-tips
```

---

## 5. Tela de preferências no app (opcional)

Criar em **Configurações** ou **Como Acessar**:

- Toggle "Receber dicas por e-mail"
- Toggle "Receber dicas por WhatsApp"
- Seletor de frequência: semanal / quinzenal

Salvar em `app_tip_preferences` (por `church_id`).

---

## Resumo de custos estimados

| Item | Custo |
|------|-------|
| Resend (e-mail) | Grátis até 3.000/mês |
| Z-API ou Evolution (WhatsApp) | ~R$ 50–150/mês ou self-hosted |
| Vercel Cron / cron-job.org | Grátis |

---

**Próximo passo:** implementar a Edge Function `send-tips-email` e configurar um cron semanal para acioná-la.
