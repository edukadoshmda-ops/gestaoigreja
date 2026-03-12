# n8n: Telegram + Email (fallback) para Dicas

Este guia usa o SQL de `supabase/telegram_tips_setup.sql`.

## Variaveis de ambiente no n8n

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`
- Credenciais de e-mail (SMTP ou provider)

---

## Workflow A: Vincular Telegram com token seguro

Objetivo: ligar `chat_id` do Telegram ao usuario certo, sem depender de username.

### Nos

1. **Telegram Trigger**
   - Recebe qualquer mensagem do bot.

2. **Switch (roteamento por comando)**
   - Caso 1: texto inicia com `/start`
   - Caso 2: texto inicia com `CONECTAR `
   - Default: ajuda/uso

3. **Telegram SendMessage (resposta /start)**
   - Texto:
     - "No app, gere seu codigo e envie: CONECTAR ABCD1234"

4. **Function (extrair token + chat_id)**
   - Entrada esperada: `CONECTAR ABCD1234`
   - Saida:
     - `token`
     - `chat_id` (de `message.chat.id`)

5. **HTTP Request (Supabase RPC consume_telegram_link_token)**
   - Method: `POST`
   - URL: `{{$env.SUPABASE_URL}}/rest/v1/rpc/consume_telegram_link_token`
   - Headers:
     - `apikey: {{$env.SUPABASE_SERVICE_ROLE_KEY}}`
     - `Authorization: Bearer {{$env.SUPABASE_SERVICE_ROLE_KEY}}`
     - `Content-Type: application/json`
   - Body:
```json
{
  "p_token": "={{$json.token}}",
  "p_chat_id": "={{$json.chat_id}}"
}
```

6. **IF (sucesso?)**
   - Condicao: `={{$json[0].success === true}}`

7. **Telegram SendMessage (sucesso)**
   - "Telegram vinculado com sucesso ao seu perfil."

8. **Telegram SendMessage (erro)**
   - "Token invalido ou expirado. Gere um novo codigo no app."

---

## Workflow B: Envio automatico de dicas (Telegram -> fallback Email)

Objetivo: enviar a proxima dica sem repetir por usuario/canal.

### Nos

1. **Cron**
   - Ex.: todo dia as 09:00.

2. **HTTP Request (RPC get_users_for_tips_channels)**
   - Method: `POST`
   - URL: `{{$env.SUPABASE_URL}}/rest/v1/rpc/get_users_for_tips_channels`
   - Headers: mesmos do Workflow A
   - Body: `{}`

3. **Split In Batches**
   - Batch size: `1`

4. **IF (pode enviar Telegram?)**
   - `telegram_enabled = true`
   - `telegram_chat_id` preenchido

5. **HTTP Request (RPC get_next_tip_for_user - whatsapp canal)**
   - Method: `POST`
   - URL: `{{$env.SUPABASE_URL}}/rest/v1/rpc/get_next_tip_for_user`
   - Body:
```json
{
  "p_user_id": "={{$json.user_id}}",
  "p_channel": "whatsapp"
}
```

6. **IF (encontrou dica para Telegram?)**
   - Condicao: tamanho do array > 0

7. **HTTP Request (Telegram sendMessage)**
   - Method: `POST`
   - URL: `https://api.telegram.org/bot{{$env.TELEGRAM_BOT_TOKEN}}/sendMessage`
   - `Continue On Fail`: `true`
   - Body:
```json
{
  "chat_id": "={{$json.telegram_chat_id}}",
  "text": "={{'📌 ' + $json.title + '\\n\\n' + ($json.content_short || 'Abra o app para ver a dica completa.')}}"
}
```

8. **IF (Telegram sucesso?)**
   - Condicao: `={{$json.ok === true}}`
   - Se true: log `sent` em `app_tip_deliveries` com `channel = whatsapp`
   - Se false: seguir para fallback por email

9. **HTTP Request (RPC get_next_tip_for_user - email canal)**
   - Method: `POST`
   - URL: `{{$env.SUPABASE_URL}}/rest/v1/rpc/get_next_tip_for_user`
   - Body:
```json
{
  "p_user_id": "={{$json.user_id}}",
  "p_channel": "email"
}
```

10. **IF (encontrou dica para email?)**
    - Condicao: tamanho do array > 0

11. **Send Email**
    - To: `={{$json.user_email}}`
    - Subject: `={{'Dica do Gestao Igreja: ' + $json.title}}`
    - Message: `={{$json.content_short || $json.content}}`
    - `Continue On Fail`: `true`

12. **HTTP Request (log em app_tip_deliveries)**
    - Method: `POST`
    - URL: `{{$env.SUPABASE_URL}}/rest/v1/app_tip_deliveries`
    - Headers:
      - `apikey`, `Authorization`
      - `Content-Type: application/json`
      - `Prefer: return=minimal`
    - Body exemplo:
```json
{
  "tip_id": "={{$json.tip_id}}",
  "user_id": "={{$json.user_id}}",
  "church_id": "={{$json.church_id}}",
  "channel": "email",
  "status": "sent",
  "error_message": null
}
```

---

## Recomendacoes de producao

- Ative retentativa para erro transitivo (429, timeout, 5xx): 2 min e 10 min.
- Nao retente erro definitivo (chat invalido, email invalido).
- Registre `status = failed` com `error_message` quando ocorrer falha.
- Mantenha Telegram como canal principal de baixo custo e e-mail como fallback.

---

## Checklist final

- [ ] Rodou `telegram_tips_setup.sql` sem erro
- [ ] Bot criado no Telegram e token configurado
- [ ] Workflow A ativo e testado com `CONECTAR <TOKEN>`
- [ ] Workflow B executado manualmente com sucesso
- [ ] Entradas de log aparecendo em `app_tip_deliveries`

