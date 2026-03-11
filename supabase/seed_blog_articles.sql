-- Seed dos artigos do blog (metadados iniciais)
-- Execute após blog_articles.sql
-- content pode ser preenchido depois pelo painel ou direto no Supabase

INSERT INTO blog_articles (slug, title, description, category, read_time, published_at)
VALUES
  ('como-organizar-cadastro-membros-igreja', 'Como organizar o cadastro de membros da sua igreja', 'Passo a passo para manter um cadastro organizado de membros e congregados. Dicas práticas para pastores e secretários.', 'membros', 5, '2025-01-15'),
  ('ficha-visitante-modelo-boas-praticas', 'Ficha de visitante: modelo e boas práticas', 'Aprenda a criar e usar uma ficha de visitante eficiente para acompanhar novos frequentadores da igreja.', 'membros', 4, '2025-01-20'),
  ('controle-frequencia-membros-por-que-como', 'Controle de frequência: por que e como fazer', 'Entenda a importância do controle de frequência e como implementar na sua igreja.', 'membros', 5, '2025-01-25'),
  ('controle-dizimos-ofertas-5-passos', 'Controle de dízimos e ofertas: 5 passos essenciais', 'Como organizar o controle financeiro de dízimos e ofertas na sua igreja com transparência.', 'financas', 6, '2025-02-01'),
  ('relatorio-financeiro-igreja-o-que-incluir', 'Relatório financeiro para igreja: o que incluir', 'Guia completo do que deve constar em um relatório financeiro transparente para igrejas.', 'financas', 6, '2025-02-05'),
  ('planejamento-orcamentario-igrejas-evangelicas', 'Planejamento orçamentário em igrejas evangélicas', 'Dicas para elaborar e acompanhar o orçamento da igreja ao longo do ano.', 'financas', 5, '2025-02-10'),
  ('escala-culto-como-montar-confirmacao', 'Escala de culto: como montar e enviar confirmação', 'Aprenda a montar escalas de culto e usar confirmação online para reduzir faltas.', 'eventos', 5, '2025-02-15'),
  ('organizacao-eventos-igreja-checklists', 'Organização de eventos na igreja: checklists e dicas', 'Checklists e dicas práticas para organizar eventos e cultos especiais.', 'eventos', 6, '2025-02-20'),
  ('check-in-presenca-cultos-tecnologia', 'Check-in e presença em cultos: benefícios da tecnologia', 'Como a tecnologia pode facilitar o registro de presença e engajar a congregação.', 'eventos', 4, '2025-02-25'),
  ('boletim-digital-igreja-vantagens', 'Boletim digital para igreja: vantagens e como começar', 'Por que migrar para o boletim digital e como implementar na sua igreja.', 'comunicacao', 5, '2025-03-01'),
  ('app-para-igreja-o-que-considerar', 'App para igreja: o que considerar na escolha', 'Critérios importantes para escolher um aplicativo ou sistema de gestão para sua igreja.', 'comunicacao', 5, '2025-03-05'),
  ('whatsapp-pastoral-boas-praticas', 'WhatsApp pastoral: boas práticas de comunicação', 'Como usar o WhatsApp de forma profissional e eficiente na comunicação pastoral.', 'comunicacao', 4, '2025-03-10'),
  ('discipulado-como-acompanhar-medir', 'Discipulado: como acompanhar e medir', 'Ferramentas e práticas para acompanhar processos de discipulado na igreja.', 'crescimento', 6, '2025-03-15'),
  ('gestao-celulas-ministerios', 'Gestão de células e ministérios', 'Como organizar células e ministérios para melhor engajamento e acompanhamento.', 'crescimento', 5, '2025-03-20'),
  ('estrategias-crescimento-saudavel-igreja', 'Estratégias de crescimento saudável da igreja', 'Princípios e práticas para um crescimento saudável e sustentável.', 'crescimento', 6, '2025-03-25'),
  ('migracao-digital-igreja-por-onde-comecar', 'Migração digital na igreja: por onde começar', 'Guia inicial para pastores que desejam digitalizar processos da igreja.', 'dicas', 5, '2025-04-01'),
  ('lgpd-igrejas-o-que-saber', 'LGPD e igrejas: o que você precisa saber', 'Noções básicas de LGPD aplicadas ao contexto de igrejas e tratamento de dados.', 'dicas', 6, '2025-04-05'),
  ('integracao-ferramentas-gestao-igreja', 'Integração de ferramentas na gestão da igreja', 'Como integrar diferentes ferramentas e sistemas para uma gestão mais eficiente.', 'dicas', 5, '2025-04-10')
ON CONFLICT (slug) DO NOTHING;
