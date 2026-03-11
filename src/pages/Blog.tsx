import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { FileText, ArrowRight, Clock, Loader2 } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/button';
import {
  ARTICLES,
  CATEGORIES,
  type ArticleCategory,
  type ArticleMeta,
} from '@/lib/seoArticles';
import { fetchBlogArticles, type BlogArticle } from '@/services/blog.service';

function normalizeArticle(a: BlogArticle): ArticleMeta {
  return {
    slug: a.slug,
    title: a.title,
    description: a.description,
    category: a.category as ArticleCategory,
    publishedAt: a.published_at,
    readTime: a.read_time,
    keywords: [],
  };
}

function ArticleCard({ article }: { article: ArticleMeta }) {
  const cat = CATEGORIES[article.category];
  return (
    <Link
      to={`/blog/${article.slug}`}
      className="group block rounded-xl border bg-card p-5 transition hover:border-primary/50 hover:shadow-md"
    >
      <span className="text-xs font-medium text-primary">{cat.label}</span>
      <h3 className="mt-1 text-lg font-semibold text-foreground group-hover:text-primary transition">
        {article.title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
        {article.description}
      </p>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        {article.readTime} min
      </div>
      <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition">
        Ler artigo
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

export default function Blog() {
  useDocumentTitle('Blog — Dicas para pastores e líderes');
  const [searchParams] = useSearchParams();
  const category = (searchParams.get('categoria') || 'all') as ArticleCategory | 'all';

  const [articles, setArticles] = useState<ArticleMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const cat = category === 'all' || !category ? undefined : (category as ArticleCategory);
    fetchBlogArticles(cat).then((data) => {
      if (data.length > 0) {
        setArticles(data.map(normalizeArticle));
      } else {
        const filtered =
          category === 'all' || !category
            ? ARTICLES
            : ARTICLES.filter((a) => a.category === category);
        setArticles(filtered);
      }
      setLoading(false);
    });
  }, [category]);

  const filtered = articles;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto max-w-4xl px-4 py-12">
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition"
          >
            ← Voltar ao site
          </Link>
          <h1 className="mt-4 flex items-center gap-2 text-2xl font-bold text-foreground sm:text-3xl">
            <FileText className="h-8 w-8 text-primary" />
            Blog Gestão Igreja
          </h1>
          <p className="mt-2 text-muted-foreground">
            Dicas práticas de gestão, finanças, membros e tecnologia para igrejas.
            Conteúdo para pastores e líderes.
          </p>
        </div>
        <div className="container mx-auto max-w-4xl px-4 pb-4">
          <nav className="flex flex-wrap gap-2">
            <Link to="/blog">
              <Button variant={category === 'all' ? 'default' : 'outline'} size="sm">
                Todos
              </Button>
            </Link>
            {(Object.keys(CATEGORIES) as ArticleCategory[]).map((cat) => (
              <Link key={cat} to={`/blog?categoria=${cat}`}>
                <Button variant={category === cat ? 'default' : 'outline'} size="sm">
                  {CATEGORIES[cat].label}
                </Button>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
              {filtered.map((article) => (
                <ArticleCard key={article.slug} article={article} />
              ))}
            </div>
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                Nenhum artigo nesta categoria.
              </p>
            )}
          </>
        )}
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <Link to="/" className="text-primary hover:underline font-medium">
            Conheça o Gestão Igreja e teste grátis por 30 dias →
          </Link>
        </div>
      </footer>
    </div>
  );
}
