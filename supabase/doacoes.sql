-- Tabela de doações (dízimos/ofertas) vinculada a payments (Stone/Pagar.me)
-- Use em conjunto com o webhook /api/webhook-pagarme para atualizar status automaticamente.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.doacoes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  church_id uuid NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  gateway_id text, -- id do pedido/charge no provedor (ex: provider_payment_id)
  valor numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'canceled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS doacoes_church_id_idx ON public.doacoes(church_id);
CREATE INDEX IF NOT EXISTS doacoes_user_id_idx ON public.doacoes(user_id);
CREATE INDEX IF NOT EXISTS doacoes_payment_id_idx ON public.doacoes(payment_id);
CREATE INDEX IF NOT EXISTS doacoes_gateway_id_idx ON public.doacoes(gateway_id);

-- RLS
ALTER TABLE public.doacoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_doacoes" ON public.doacoes;
CREATE POLICY "tenant_isolation_doacoes" ON public.doacoes FOR ALL
  USING (church_id = get_my_church_id() OR get_my_role() = 'superadmin')
  WITH CHECK (auth.uid() IS NOT NULL AND (church_id = get_my_church_id() OR get_my_role() = 'superadmin'));

