# Configuração de Email no Supabase

## Problema: "Email not confirmed"

Se você está vendo a mensagem **"Email not confirmed"** ao tentar fazer login, significa que o Supabase está exigindo confirmação de email para novos usuários.

## Solução: Desabilitar Confirmação de Email (Desenvolvimento)

Para permitir login imediato sem confirmação de email, siga estes passos:

### 1. Acesse o Dashboard do Supabase
1. Vá para [https://supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto

### 2. Desabilite a Confirmação de Email
1. No menu lateral, clique em **Authentication**
2. Clique em **Settings** (ou **Configurações**)
3. Role até a seção **"Email Confirmations"** ou **"Auth"**
4. **Desligue** a opção **"Enable email confirmations"** ou **"Confirm email"**
5. Clique em **Save** (Salvar)

### 3. Configure Email Confirmations (Alternativa mais segura)

Se você quer manter a confirmação de email ATIVADA mas permitir acesso em desenvolvimento:

1. Em **Authentication** → **Settings**
2. Em **"Email Confirmation"**, configure:
   - **Enable email confirmations**: OFF (para desenvolvimento)
   - **Enable email confirmations**: ON (para produção, com servidor SMTP configurado)

### 4. Servidor SMTP (Opcional - Para Produção)

Para produção, você deve configurar um servidor SMTP para enviar emails de confirmação:

1. Em **Authentication** → **Settings** → **SMTP Settings**
2. Configure:
   - **Host**: seu servidor SMTP (ex: smtp.gmail.com)
   - **Port**: 587 ou 465
   - **Username**: seu email
   - **Password**: senha do email
   - **Sender email**: email que enviará as confirmações
   - **Sender name**: Nome que aparecerá no email

### 5. Teste o Login

Após fazer as alterações:
1. Recarregue a página do app
2. Tente fazer login novamente
3. Agora deve funcionar sem pedir confirmação de email

## Importante para Produção

⚠️ **ATENÇÃO**: Desabilitar a confirmação de email é útil para desenvolvimento e testes, mas **NÃO É RECOMENDADO PARA PRODUÇÃO**.

Em produção:
- ✅ Mantenha a confirmação de email ATIVADA
- ✅ Configure um servidor SMTP adequado
- ✅ Use templates de email personalizados
- ✅ Implemente fluxo de confirmação de email adequado

## Alternativa: Auto-confirmação via SQL

Se você preferir, pode confirmar emails manualmente via SQL no Supabase:

1. Vá em **SQL Editor** no dashboard do Supabase
2. Execute este comando:

```sql
-- Confirmar o email de um usuário específico
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'seu-email@exemplo.com';
```

Ou para confirmar TODOS os usuários (apenas desenvolvimento!):

```sql
-- CUIDADO: Isso confirma TODOS os emails!
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;
```

## Verificar Status

Para verificar se um email foi confirmado:

```sql
SELECT email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'seu-email@exemplo.com';
```

---

**Última atualização**: 2026-02-12
