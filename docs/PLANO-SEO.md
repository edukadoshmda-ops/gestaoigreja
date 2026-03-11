# Plano de SEO — Gestão Igreja

## Objetivo
Atrair igrejas e pastores buscando soluções de gestão, organização e tecnologia para ministérios. Conteúdo educativo em formato blog, com palavras-chave direcionadas e CTAs para cadastro trial/assinatura.

---

## 1. Estrutura de Categorias e Pilares de Conteúdo

| Categoria | Foco de Long-tail | Público |
|-----------|-------------------|---------|
| **Gestão de membros e visitantes** | cadastro de membros igreja, controle de frequência, ficha de visitante | Pastores, secretários |
| **Finanças e dízimos** | controle de dízimos, relatório financeiro igreja, planejamento orçamentário | Tesoureiros, pastores |
| **Eventos e cultos** | escala de culto, organização de eventos igreja, check-in de presença | Pastores, líderes |
| **Comunicação e tecnologia** | app para igreja, boletim digital, WhatsApp pastoral | Pastores, líderes |
| **Crescimento da igreja** | discipulado, células, estratégias crescimento | Pastores, líderes |
| **Dicas e tutoriais** | migração digital, como usar software igreja | Pastores, admins |

---

## 2. URLs e Rotas

- `/blog` — lista de artigos, filtro por categoria
- `/blog/:slug` — artigo individual (ex: `/blog/gestao-de-membros-igreja`)

---

## 3. Palavras-chave (Principais)

### Alta intenção (pronto para converter)
- software gestão igreja
- sistema de gestão para igrejas
- app para igreja evangélica
- controle de dízimos igreja
- cadastro de membros igreja
- escala de culto online

### Média intenção (educativo + CTA)
- como organizar membros da igreja
- relatório financeiro igreja
- aplicativo para igreja
- gestão de células e ministérios
- boletim digital igreja

### Long-tail (baixa concorrência, alta especificidade)
- como cadastrar visitantes na igreja
- controle de frequência membros igreja
- planejamento orçamentário igreja evangélica
- migração digital igreja
- app de confirmação de escala culto

---

## 4. Meta Tags e SEO Técnico

| Página | Title | Description (≤155 chars) |
|--------|-------|---------------------------|
| Blog | Blog Gestão Igreja — Dicas para pastores e líderes | Dicas práticas de gestão, finanças, membros e tecnologia para igrejas. Artigos para pastores e líderes. |
| Categoria | [Categoria] — Blog Gestão Igreja | Artigos sobre [categoria] para igrejas e pastores. Dicas práticas e tutoriais. |
| Artigo | [Título] — Blog Gestão Igreja | [Meta descrição do artigo, 130-155 caracteres] |

### Outros
- `canonical` em cada URL
- `robots` meta adequado (index, follow nas páginas públicas)
- `og:image` para compartilhamento social
- Sitemap `sitemap.xml` incluindo `/blog` e `/blog/:slug`
- Schema.org `Article` em artigos individuais

---

## 5. Estrutura de Artigo (Template)

1. **Título H1** — incluir palavra-chave principal
2. **Introdução** — 2-3 frases, problema + promessa de solução
3. **Conteúdo** — H2/H3, listas, parágrafos curtos (2-4 linhas)
4. **CTA** — “Experimente grátis por 30 dias” ou “Conheça o Gestão Igreja”
5. **Conclusão** — resumo e CTA final

Comprimento sugerido: **800-1500 palavras** por artigo.

---

## 6. Artigos Iniciais (Sugestão)

### Categoria: Gestão de membros
1. Como organizar o cadastro de membros da sua igreja
2. Ficha de visitante: modelo e boas práticas
3. Controle de frequência: por que e como fazer

### Categoria: Finanças
4. Controle de dízimos e ofertas: 5 passos essenciais
5. Relatório financeiro para igreja: o que incluir
6. Planejamento orçamentário em igrejas evangélicas

### Categoria: Eventos e cultos
7. Escala de culto: como montar e enviar confirmação
8. Organização de eventos na igreja: checklists e dicas
9. Check-in e presença em cultos: benefícios da tecnologia

### Categoria: Comunicação
10. Boletim digital para igreja: vantagens e como começar
11. App para igreja: o que considerar na escolha
12. WhatsApp pastoral: boas práticas de comunicação

### Categoria: Crescimento
13. Discipulado: como acompanhar e medir
14. Gestão de células e ministérios
15. Estratégias de crescimento saudável da igreja

### Categoria: Dicas
16. Migração digital na igreja: por onde começar
17. LGPD e igrejas: o que você precisa saber
18. Integração de ferramentas na gestão da igreja

---

## 7. Links Internos e CTAs

- Cada artigo deve linkar para **2-4 artigos relacionados** (mesma ou outra categoria)
- Cada artigo deve ter **1 CTA principal** (Testar grátis / Cadastrar igreja trial)
- Sidebar ou rodapé do blog: link para Landing e Cadastro Trial

---

## 8. Medição

- **Google Search Console** — consultas, impressões, cliques
- **Google Analytics** — páginas vistas, tempo na página, taxas de conversão
- Metas: aumento de sessões orgânicas, cadastros trial e assinaturas vindos do blog

---

## 9. Implementação Técnica (App atual)

- [x] Plano documentado
- [ ] Rotas `/blog` e `/blog/:slug`
- [ ] Página Blog com categorias
- [ ] Página Artigo com conteúdo e meta
- [ ] Dados dos artigos em `src/lib/seoArticles.ts`
- [ ] Link “Blog” no footer/header da Landing
- [ ] Sitemap dinâmico (ou estático com artigos)
- [ ] Schema Article (JSON-LD)
