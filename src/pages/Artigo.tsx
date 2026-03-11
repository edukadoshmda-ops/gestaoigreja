import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Loader2 } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/button';
import {
  getArticleBySlug,
  getRelatedArticles,
  CATEGORIES,
  type ArticleCategory,
  type ArticleMeta,
} from '@/lib/seoArticles';
import { fetchBlogArticleBySlug, type BlogArticle } from '@/services/blog.service';
import NotFound from './NotFound';

const CTA_BOX = (
  <div className="not-prose my-8 rounded-xl border bg-primary/5 p-6">
    <p className="text-foreground">
      Teste grátis nosso sistema de gestão de igreja e organize seus membros, dízimos e eventos em
      um só lugar.{' '}
      <Link to="/cadastro-igreja-trial" className="font-semibold text-primary hover:underline">
        Clique aqui para começar.
      </Link>
    </p>
    <div className="mt-4">
      <Link to="/cadastro-igreja-trial">
        <Button size="lg" className="gap-2">
          Testar grátis por 30 dias
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </Button>
      </Link>
    </div>
  </div>
);

function RelatedLinks({ articles }: { articles: ArticleMeta[] }) {
  if (articles.length === 0) return null;
  return (
    <aside className="mt-12 border-t pt-8 not-prose">
      <h3 className="text-lg font-semibold text-foreground">Leia também</h3>
      <ul className="mt-4 space-y-3">
        {articles.map((r) => (
          <li key={r.slug}>
            <Link to={`/blog/${r.slug}`} className="text-primary hover:underline">
              Veja também nosso artigo sobre {r.title.toLowerCase()}.
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function PlaceholderContent({ related }: { related: ArticleMeta[] }) {
  return (
    <>
      <p className="lead text-lg text-muted-foreground">
        Este artigo traz dicas práticas para pastores e líderes que desejam melhorar a gestão da igreja.
        Em breve, conteúdo completo será publicado aqui.
      </p>
      <h2>O que você pode fazer agora</h2>
      <p>
        Enquanto preparamos o conteúdo detalhado, experimente o Gestão Igreja — sistema completo para
        igrejas, com cadastro de membros, controle financeiro, eventos e boletins.
      </p>
      {CTA_BOX}
      <RelatedLinks articles={related} />
    </>
  );
}

export default function Artigo() {
  const { slug } = useParams<{ slug: string }>();
  const [dbArticle, setDbArticle] = useState<BlogArticle | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const staticMeta = slug ? getArticleBySlug(slug) : undefined;

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchBlogArticleBySlug(slug).then((data) => {
      setDbArticle(data ?? null);
      setLoading(false);
    });
  }, [slug]);

  const article: ArticleMeta | undefined = dbArticle
    ? {
        slug: dbArticle.slug,
        title: dbArticle.title,
        description: dbArticle.description,
        category: dbArticle.category as ArticleCategory,
        publishedAt: dbArticle.published_at,
        readTime: dbArticle.read_time,
        keywords: [],
      }
    : staticMeta;

  if (!article) return <NotFound />;

  useDocumentTitle(article.title);
  const cat = CATEGORIES[article.category];
  const related = getRelatedArticles(slug!, article.category, 3);

  const content = dbArticle?.content?.trim();
  const showPlaceholder = !content;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto max-w-3xl px-4 py-8">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao blog
          </Link>
          <span className="mt-4 inline-block text-xs font-medium text-primary">
            {cat.label}
          </span>
          <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
            {article.title}
          </h1>
          <p className="mt-2 text-muted-foreground">{article.description}</p>
          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {article.readTime} min de leitura
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(article.publishedAt).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </header>

      <article className="container mx-auto max-w-3xl px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {showPlaceholder ? (
              <PlaceholderContent related={related} />
            ) : (
              <>
                <div dangerouslySetInnerHTML={{ __html: content! }} />
                <RelatedLinks articles={related} />
                <div className="not-prose mt-8 rounded-xl border bg-primary/5 p-6">
                  <p className="text-foreground">
                    Teste grátis nosso sistema de gestão de igreja e organize seus membros, dízimos e
                    eventos em um só lugar.{' '}
                    <Link
                      to="/cadastro-igreja-trial"
                      className="font-semibold text-primary hover:underline"
                    >
                      Clique aqui para começar.
                    </Link>
                  </p>
                  <div className="mt-4">
                    <Link to="/cadastro-igreja-trial">
                      <Button size="lg" className="gap-2">
                        Testar grátis por 30 dias
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </article>

      <footer className="border-t py-8">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <Link to="/" className="text-primary hover:underline font-medium">
            Teste grátis nosso sistema de gestão de igreja e organize seus membros, dízimos e eventos
            em um só lugar. Clique aqui para começar →
          </Link>
        </div>
      </footer>
    </div>
  );
}
