-- Blog articles: conteúdo dinâmico para SEO (público, leitura anônima)

CREATE TABLE IF NOT EXISTS blog_articles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'membros', 'financas', 'eventos', 'comunicacao', 'crescimento', 'dicas'
  )),
  content TEXT,
  read_time INTEGER DEFAULT 5,
  published_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blog_articles_slug ON blog_articles(slug);
CREATE INDEX IF NOT EXISTS idx_blog_articles_category ON blog_articles(category);
CREATE INDEX IF NOT EXISTS idx_blog_articles_published_at ON blog_articles(published_at DESC);

ALTER TABLE blog_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Blog público: leitura para todos" ON blog_articles;
CREATE POLICY "Blog público: leitura para todos" ON blog_articles
  FOR SELECT USING (true);

-- Apenas superadmin pode inserir/atualizar (via service_role ou função admin)
DROP POLICY IF EXISTS "SuperAdmin pode gerenciar blog" ON blog_articles;
CREATE POLICY "SuperAdmin pode gerenciar blog" ON blog_articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin')
  );
