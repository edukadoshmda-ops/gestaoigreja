# Integração com Hotmart

Este guia explica como integrar o App Gestão Igreja com a plataforma Hotmart para vendas.

## 📋 Passo a Passo

### 1. Criar Produto na Hotmart

1. **Acesse o Painel Hotmart**
   - Entre em: https://app.hotmart.com/
   - Vá em "Produtos" > "Criar Produto"

2. **Configurações do Produto**
   - **Nome**: "App Gestão Igreja - Sistema de Gestão Completo"
   - **Tipo**: Produto Digital / Software/SaaS
   - **Preço**: R$ 150,00 (mensalidade recorrente)
   - **Descrição**: Use o conteúdo da página de vendas (`Landing.tsx`)
   - **Imagens**: Use screenshots do app
   - **Categoria**: Software / Gestão / Religião

3. **Configurar Assinatura Recorrente**
   - Tipo: Assinatura Mensal
   - Valor: R$ 150,00
   - Período: Mensal (cobrança todo dia 10)

4. **Página de Vendas**
   - Use a URL da sua landing page: `https://seu-dominio.com/`
   - Ou configure uma página específica na Hotmart

### 2. Configurar Webhook da Hotmart

1. **No Painel Hotmart**
   - Vá em "Configurações" > "Webhooks"
   - Adicione uma nova URL de webhook: `https://seu-dominio.com/api/hotmart/webhook`
   - Eventos para escutar:
     - `PURCHASE_APPROVED` (compra aprovada)
     - `PURCHASE_BILLET_PRINTED` (boleto gerado)
     - `PURCHASE_CANCELLED` (compra cancelada)
     - `PURCHASE_CHARGEBACK` (chargeback)
     - `PURCHASE_COMPLETE` (compra completa)
     - `PURCHASE_DELAYED` (pagamento atrasado)
     - `PURCHASE_EXPIRED` (compra expirada)
     - `PURCHASE_PROTESTED` (boleto protestado)
     - `PURCHASE_REFUNDED` (reembolso)

2. **Token de Segurança**
   - Gere um token secreto na Hotmart
   - Salve em `.env.local` como `VITE_HOTMART_SECRET_TOKEN`

### 3. Integração no Código

#### 3.1. Criar Rota de Webhook (Backend)

Você precisará criar um endpoint no backend (Supabase Edge Functions ou servidor Node.js) para receber os webhooks da Hotmart.

**Exemplo com Supabase Edge Function:**

```typescript
// supabase/functions/hotmart-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const HOTMART_SECRET = Deno.env.get('HOTMART_SECRET_TOKEN')

serve(async (req) => {
  try {
    // Verificar token de segurança
    const token = req.headers.get('x-hotmart-hottok')
    if (token !== HOTMART_SECRET) {
      return new Response('Unauthorized', { status: 401 })
    }

    const payload = await req.json()
    const { event, data } = payload

    // Processar evento de compra aprovada
    if (event === 'PURCHASE_APPROVED' || event === 'PURCHASE_COMPLETE') {
      const { buyer, product, purchase } = data
      
      // Criar igreja no sistema
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Extrair dados do comprador
      const churchName = purchase?.user?.name || 'Igreja Nova'
      const adminEmail = buyer?.email
      const hotmartTransactionId = purchase?.transaction

      // Criar igreja via RPC
      const { data: church, error } = await supabase.rpc('create_church_from_checkout', {
        church_name: churchName,
        church_slug: churchName.toLowerCase().replace(/\s+/g, '-'),
        admin_email: adminEmail,
        hotmart_transaction_id: hotmartTransactionId
      })

      if (error) {
        console.error('Erro ao criar igreja:', error)
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ success: true, church }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Processar cancelamento/reembolso
    if (event === 'PURCHASE_CANCELLED' || event === 'PURCHASE_REFUNDED') {
      // Desativar assinatura da igreja
      // Implementar lógica de cancelamento
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

#### 3.2. Atualizar Tabela de Churches

Adicione campos para rastrear a integração com Hotmart:

```sql
-- Adicionar campos na tabela churches
ALTER TABLE churches
ADD COLUMN IF NOT EXISTS hotmart_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS hotmart_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS hotmart_buyer_email TEXT;

-- Criar índice para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_churches_hotmart_transaction 
ON churches(hotmart_transaction_id);
```

#### 3.3. Atualizar RPC Function

Modifique a função `create_church_from_checkout` para aceitar dados da Hotmart:

```sql
CREATE OR REPLACE FUNCTION create_church_from_checkout(
  church_name TEXT,
  church_slug TEXT,
  admin_email TEXT DEFAULT NULL,
  hotmart_transaction_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_church_id UUID;
  new_admin_id UUID;
BEGIN
  -- Verificar limite de 100 igrejas
  IF (SELECT COUNT(*) FROM churches) >= 100 THEN
    RAISE EXCEPTION 'Limite de 100 igrejas atingido';
  END IF;

  -- Criar igreja
  INSERT INTO churches (name, slug, hotmart_transaction_id, hotmart_buyer_email)
  VALUES (church_name, church_slug, hotmart_transaction_id, admin_email)
  RETURNING id INTO new_church_id;

  -- Criar assinatura
  INSERT INTO church_subscriptions (church_id, status, plan_amount)
  VALUES (new_church_id, 'ativa', 150.00);

  -- Se admin_email fornecido, vincular usuário existente
  IF admin_email IS NOT NULL THEN
    SELECT id INTO new_admin_id FROM auth.users WHERE email = admin_email LIMIT 1;
    
    IF new_admin_id IS NOT NULL THEN
      UPDATE profiles 
      SET church_id = new_church_id, role = 'admin'
      WHERE id = new_admin_id;
    END IF;
  END IF;

  RETURN json_build_object(
    'church_id', new_church_id,
    'church_name', church_name,
    'slug', church_slug
  );
END;
$$;
```

### 4. Atualizar Página de Checkout

Modifique `Checkout.tsx` para redirecionar para a Hotmart:

```typescript
// Adicionar botão de compra via Hotmart
const HOTMART_CHECKOUT_URL = 'https://pay.hotmart.com/SEU_PRODUTO_ID';

// No componente Checkout, adicionar opção:
<Button 
  onClick={() => window.location.href = HOTMART_CHECKOUT_URL}
  className="w-full"
>
  Comprar na Hotmart
</Button>
```

### 5. Página de Sucesso

Crie uma página para receber o redirecionamento da Hotmart após a compra:

```typescript
// src/pages/HotmartSuccess.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function HotmartSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const transaction = searchParams.get('transaction');
    const email = searchParams.get('email');

    if (transaction && email) {
      // Aguardar webhook processar a compra
      setTimeout(() => {
        setLoading(false);
        navigate('/login', { 
          state: { 
            message: 'Compra confirmada! Faça login com seu e-mail para acessar o app.',
            email 
          } 
        });
      }, 3000);
    } else {
      navigate('/');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processando sua compra...</h1>
        <p className="text-muted-foreground">
          Aguarde enquanto configuramos sua conta.
        </p>
      </div>
    </div>
  );
}
```

### 6. Variáveis de Ambiente

Adicione no `.env.local`:

```env
VITE_HOTMART_SECRET_TOKEN=seu_token_secreto_aqui
VITE_HOTMART_PRODUCT_ID=seu_produto_id_aqui
VITE_HOTMART_CHECKOUT_URL=https://pay.hotmart.com/SEU_PRODUTO_ID
```

## 🔐 Segurança

1. **Sempre valide o token do webhook** antes de processar
2. **Use HTTPS** para todas as URLs de webhook
3. **Valide os dados** recebidos da Hotmart
4. **Implemente rate limiting** no endpoint de webhook
5. **Log todas as transações** para auditoria

## 📊 Monitoramento

1. Configure alertas para falhas no webhook
2. Monitore criação de igrejas após compras
3. Acompanhe cancelamentos e reembolsos
4. Verifique assinaturas ativas mensalmente

## 🧪 Testes

1. Use o ambiente sandbox da Hotmart para testes
2. Teste todos os eventos de webhook
3. Valide criação de igreja após compra
4. Teste cancelamento e reembolso

## 📚 Documentação Hotmart

- Webhooks: https://developers.hotmart.com/docs/pt-BR/webhooks/
- API: https://developers.hotmart.com/docs/pt-BR/api/
- Suporte: https://atendimento.hotmart.com/

## ✅ Checklist de Implementação

- [ ] Produto criado na Hotmart
- [ ] Webhook configurado na Hotmart
- [ ] Endpoint de webhook criado no backend
- [ ] Tabela `churches` atualizada com campos Hotmart
- [ ] RPC function atualizada
- [ ] Página de checkout atualizada
- [ ] Página de sucesso criada
- [ ] Variáveis de ambiente configuradas
- [ ] Testes realizados
- [ ] Monitoramento configurado
