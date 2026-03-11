/**
 * Artigos do blog para SEO - estrutura para atrair igrejas e pastores
 */

export type ArticleCategory =
  | 'membros'
  | 'financas'
  | 'eventos'
  | 'comunicacao'
  | 'crescimento'
  | 'dicas';

export interface ArticleMeta {
  slug: string;
  title: string;
  description: string;
  category: ArticleCategory;
  publishedAt: string;
  readTime: number;
  keywords: string[];
}

export const CATEGORIES: Record<
  ArticleCategory,
  { label: string; description: string }
> = {
  membros: {
    label: 'Gestão de membros e visitantes',
    description: 'Cadastro, frequência, ficha de visitante',
  },
  financas: {
    label: 'Finanças e dízimos',
    description: 'Controle, relatórios, planejamento',
  },
  eventos: {
    label: 'Eventos e cultos',
    description: 'Escalas, presenças, organização',
  },
  comunicacao: {
    label: 'Comunicação e tecnologia',
    description: 'Apps, boletins, mensagens',
  },
  crescimento: {
    label: 'Crescimento da igreja',
    description: 'Discipulado, células, estratégias',
  },
  dicas: {
    label: 'Dicas e tutoriais',
    description: 'Guias práticos e migração digital',
  },
};

export const ARTICLES: ArticleMeta[] = [
  {
    slug: 'como-organizar-cadastro-membros-igreja',
    title: 'Como organizar o cadastro de membros da sua igreja',
    description:
      'Passo a passo para manter um cadastro organizado de membros e congregados. Dicas práticas para pastores e secretários.',
    category: 'membros',
    publishedAt: '2025-01-15',
    readTime: 5,
    keywords: ['cadastro de membros', 'gestão de igreja', 'organização'],
  },
  {
    slug: 'ficha-visitante-modelo-boas-praticas',
    title: 'Ficha de visitante: modelo e boas práticas',
    description:
      'Aprenda a criar e usar uma ficha de visitante eficiente para acompanhar novos frequentadores da igreja.',
    category: 'membros',
    publishedAt: '2025-01-20',
    readTime: 4,
    keywords: ['ficha de visitante', 'visitantes igreja', 'acolhida'],
  },
  {
    slug: 'controle-frequencia-membros-por-que-como',
    title: 'Controle de frequência: por que e como fazer',
    description:
      'Entenda a importância do controle de frequência e como implementar na sua igreja.',
    category: 'membros',
    publishedAt: '2025-01-25',
    readTime: 5,
    keywords: ['controle de frequência', 'presença culto', 'engajamento'],
  },
  {
    slug: 'controle-dizimos-ofertas-5-passos',
    title: 'Controle de dízimos e ofertas: 5 passos essenciais',
    description:
      'Como organizar o controle financeiro de dízimos e ofertas na sua igreja com transparência.',
    category: 'financas',
    publishedAt: '2025-02-01',
    readTime: 6,
    keywords: ['controle de dízimos', 'ofertas', 'finanças igreja'],
  },
  {
    slug: 'relatorio-financeiro-igreja-o-que-incluir',
    title: 'Relatório financeiro para igreja: o que incluir',
    description:
      'Guia completo do que deve constar em um relatório financeiro transparente para igrejas.',
    category: 'financas',
    publishedAt: '2025-02-05',
    readTime: 6,
    keywords: ['relatório financeiro', 'transparência', 'tesouraria'],
  },
  {
    slug: 'planejamento-orcamentario-igrejas-evangelicas',
    title: 'Planejamento orçamentário em igrejas evangélicas',
    description:
      'Dicas para elaborar e acompanhar o orçamento da igreja ao longo do ano.',
    category: 'financas',
    publishedAt: '2025-02-10',
    readTime: 5,
    keywords: ['orçamento igreja', 'planejamento financeiro', 'gestão'],
  },
  {
    slug: 'escala-culto-como-montar-confirmacao',
    title: 'Escala de culto: como montar e enviar confirmação',
    description:
      'Aprenda a montar escalas de culto e usar confirmação online para reduzir faltas.',
    category: 'eventos',
    publishedAt: '2025-02-15',
    readTime: 5,
    keywords: ['escala de culto', 'confirmação online', 'organização'],
  },
  {
    slug: 'organizacao-eventos-igreja-checklists',
    title: 'Organização de eventos na igreja: checklists e dicas',
    description:
      'Checklists e dicas práticas para organizar eventos e cultos especiais.',
    category: 'eventos',
    publishedAt: '2025-02-20',
    readTime: 6,
    keywords: ['eventos igreja', 'organização', 'checklist'],
  },
  {
    slug: 'check-in-presenca-cultos-tecnologia',
    title: 'Check-in e presença em cultos: benefícios da tecnologia',
    description:
      'Como a tecnologia pode facilitar o registro de presença e engajar a congregação.',
    category: 'eventos',
    publishedAt: '2025-02-25',
    readTime: 4,
    keywords: ['check-in', 'presença', 'app igreja'],
  },
  {
    slug: 'boletim-digital-igreja-vantagens',
    title: 'Boletim digital para igreja: vantagens e como começar',
    description:
      'Por que migrar para o boletim digital e como implementar na sua igreja.',
    category: 'comunicacao',
    publishedAt: '2025-03-01',
    readTime: 5,
    keywords: ['boletim digital', 'comunicação', 'tecnologia'],
  },
  {
    slug: 'app-para-igreja-o-que-considerar',
    title: 'App para igreja: o que considerar na escolha',
    description:
      'Critérios importantes para escolher um aplicativo ou sistema de gestão para sua igreja.',
    category: 'comunicacao',
    publishedAt: '2025-03-05',
    readTime: 5,
    keywords: ['app igreja', 'software gestão', 'tecnologia'],
  },
  {
    slug: 'whatsapp-pastoral-boas-praticas',
    title: 'WhatsApp pastoral: boas práticas de comunicação',
    description:
      'Como usar o WhatsApp de forma profissional e eficiente na comunicação pastoral.',
    category: 'comunicacao',
    publishedAt: '2025-03-10',
    readTime: 4,
    keywords: ['WhatsApp', 'comunicação', 'pastor'],
  },
  {
    slug: 'discipulado-como-acompanhar-medir',
    title: 'Discipulado: como acompanhar e medir',
    description:
      'Ferramentas e práticas para acompanhar processos de discipulado na igreja.',
    category: 'crescimento',
    publishedAt: '2025-03-15',
    readTime: 6,
    keywords: ['discipulado', 'crescimento', 'acompanhamento'],
  },
  {
    slug: 'gestao-celulas-ministerios',
    title: 'Gestão de células e ministérios',
    description:
      'Como organizar células e ministérios para melhor engajamento e acompanhamento.',
    category: 'crescimento',
    publishedAt: '2025-03-20',
    readTime: 5,
    keywords: ['células', 'ministérios', 'gestão'],
  },
  {
    slug: 'estrategias-crescimento-saudavel-igreja',
    title: 'Estratégias de crescimento saudável da igreja',
    description:
      'Princípios e práticas para um crescimento saudável e sustentável.',
    category: 'crescimento',
    publishedAt: '2025-03-25',
    readTime: 6,
    keywords: ['crescimento igreja', 'estratégias', 'saudável'],
  },
  {
    slug: 'migracao-digital-igreja-por-onde-comecar',
    title: 'Migração digital na igreja: por onde começar',
    description:
      'Guia inicial para pastores que desejam digitalizar processos da igreja.',
    category: 'dicas',
    publishedAt: '2025-04-01',
    readTime: 5,
    keywords: ['migração digital', 'tecnologia', 'igreja'],
  },
  {
    slug: 'lgpd-igrejas-o-que-saber',
    title: 'LGPD e igrejas: o que você precisa saber',
    description:
      'Noções básicas de LGPD aplicadas ao contexto de igrejas e tratamento de dados.',
    category: 'dicas',
    publishedAt: '2025-04-05',
    readTime: 6,
    keywords: ['LGPD', 'privacidade', 'dados'],
  },
  {
    slug: 'integracao-ferramentas-gestao-igreja',
    title: 'Integração de ferramentas na gestão da igreja',
    description:
      'Como integrar diferentes ferramentas e sistemas para uma gestão mais eficiente.',
    category: 'dicas',
    publishedAt: '2025-04-10',
    readTime: 5,
    keywords: ['integração', 'ferramentas', 'gestão'],
  },
];

export function getArticleBySlug(slug: string): ArticleMeta | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function getArticlesByCategory(
  category: ArticleCategory
): ArticleMeta[] {
  return ARTICLES.filter((a) => a.category === category);
}

export function getRelatedArticles(
  currentSlug: string,
  category: ArticleCategory,
  limit = 3
): ArticleMeta[] {
  return ARTICLES.filter((a) => a.slug !== currentSlug && a.category === category)
    .slice(0, limit);
}
