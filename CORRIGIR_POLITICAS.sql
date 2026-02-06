-- =====================================================
-- FIX SUPABASE POLICIES (DOCUMENTS & STORAGE)
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Políticas para a tabela 'documents'
-- Remover qualquer política existente
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.documents;
DROP POLICY IF EXISTS "Permitir inserção para todos" ON public.documents;
DROP POLICY IF EXISTS "Permitir exclusão para todos" ON public.documents;

-- Criar novas políticas abertas para teste (depois podemos restringir)
CREATE POLICY "Permitir leitura para todos" ON public.documents
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para todos" ON public.documents
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir exclusão para todos" ON public.documents
    FOR DELETE USING (true);

-- 2. Configurar o Storage (Arquivos)
-- Primeiro, garantir que o bucket existe (caso não tenha criado manualmente)
INSERT INTO storage.buckets (id, name, public)
VALUES ('church-documents', 'church-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao Storage
DROP POLICY IF EXISTS "Arquivos públicos para leitura" ON storage.objects;
DROP POLICY IF EXISTS "Arquivos públicos para upload" ON storage.objects;
DROP POLICY IF EXISTS "Arquivos públicos para exclusão" ON storage.objects;

CREATE POLICY "Arquivos públicos para leitura" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'church-documents');

CREATE POLICY "Arquivos públicos para upload" ON storage.objects
    FOR INSERT TO public WITH CHECK (bucket_id = 'church-documents');

CREATE POLICY "Arquivos públicos para exclusão" ON storage.objects
    FOR DELETE TO public USING (bucket_id = 'church-documents');
