# Painel Super Admin — 100 Igrejas

## Visão geral

O **Painel Super Admin** permite gerenciar até **100 igrejas** na plataforma, com:

- **Gestão** — Lista e edição de igrejas (tenants)
- **Relatórios** — Visão consolidada (membros e usuários por igreja)
- **Mensalidades** — Acompanhamento de assinaturas (R$ 150/mês por igreja)

As igrejas podem se cadastrar sozinhas pela **página de vendas** (Checkout): após o pagamento, a igreja é criada automaticamente e o admin faz login para acessar o app.

## Como acessar o Painel Super Admin

1. Faça login com um usuário que tenha a role **SuperAdmin**.
2. No menu lateral, clique em **Painel Root** (ícone Shield).
3. Você verá o painel com abas: **Gestão**, **Relatórios** e **Mensalidades**.

## Abas do painel

### Gestão
- Lista de todas as igrejas
- Busca por nome ou slug
- Editar igreja, acessar painel da igreja ou suspender
- Botão **Nova Igreja** (desabilitado quando o limite de 100 igrejas for atingido)

### Relatórios
- Relatório consolidado com: igreja, slug, quantidade de membros, quantidade de usuários, data de criação
- Permite ter uma visão geral do uso da plataforma por igreja

### Mensalidades
- Acompanhamento de mensalidades (R$ 150/mês)
- Status: Adimplente, Inadimplente, Cancelada
- Próximo vencimento (dia 10 de cada mês)
- Para habilitar o acompanhamento automático, execute o script `supabase/church_subscriptions.sql` no Supabase.

## Cadastro automático de igrejas

1. Usuário acessa a página de vendas (Landing).
2. Clica em **Começar agora** e vai para o Checkout.
3. Preenche: **nome da igreja**, **identificador (slug)**, **e-mail do administrador**.
4. Preenche dados do cartão e confirma o pagamento.
5. A igreja é criada automaticamente via RPC `create_church_from_checkout`.
6. Redirecionamento para login. O admin faz login e acessa o painel da igreja.

**Requisito:** Execute o script `supabase/church_subscriptions.sql` no Supabase para criar a função `create_church_from_checkout` e permitir o cadastro de igrejas pela página de vendas.

## Como acessar uma igreja cadastrada

1. No Painel Root, aba **Gestão**, localize a igreja na lista.
2. Clique no botão de ações (⋮).
3. Selecione **Acessar Painel**.
4. O sistema troca o contexto para essa igreja e redireciona para o **Dashboard**.

## Banner "Visualizando como [Igreja]"

Enquanto estiver visualizando uma igreja no modo Root:

- Um **banner amarelo** aparece no topo da tela.
- Clique em **Voltar ao Painel Root** para sair e retornar ao painel administrativo.

## Ambiente técnico

- **switchChurch(churchId, churchName)** — Define o contexto da igreja.
- **exitChurchView()** — Remove o contexto e retorna ao modo Root.
- **Rota:** `/superadmin` (apenas role `superadmin`).
