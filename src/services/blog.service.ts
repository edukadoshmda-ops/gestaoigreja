import { supabase } from '@/lib/supabaseClient';
import type { ArticleCategory } from '@/lib/seoArticles';

export interface BlogArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: ArticleCategory;
  content: string | null;
  read_time: number;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export async function fetchBlogArticles(category?: ArticleCategory): Promise<BlogArticle[]> {
  let query = supabase
    .from('blog_articles')
    .select('*')
    .order('published_at', { ascending: false });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.warn('[blog.service] Erro ao buscar artigos:', error);
    return [];
  }

  return (data || []) as BlogArticle[];
}

export async function fetchBlogArticleBySlug(slug: string): Promise<BlogArticle | null> {
  const { data, error } = await supabase
    .from('blog_articles')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.warn('[blog.service] Erro ao buscar artigo:', error);
    return null;
  }

  return data as BlogArticle | null;
}
