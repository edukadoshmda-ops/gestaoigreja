-- Permitir que a liderança da própria igreja atualize a linha em public.churches
-- Necessário para telas como "Doar dízimos e ofertas" (PIX / Stone) funcionarem sem ser superadmin.

ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "churches_update_own_church" ON public.churches;
CREATE POLICY "churches_update_own_church" ON public.churches
FOR UPDATE
USING (
  id = get_my_church_id()
  AND get_my_role() IN ('admin', 'pastor', 'secretario', 'tesoureiro', 'superadmin')
)
WITH CHECK (
  id = get_my_church_id()
  AND get_my_role() IN ('admin', 'pastor', 'secretario', 'tesoureiro', 'superadmin')
);

