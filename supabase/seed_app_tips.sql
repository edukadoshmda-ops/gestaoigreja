-- Seed de dicas do app (como usar o Gestão Igreja)
-- Execute após app_tips_schema.sql

INSERT INTO app_tips (title, content, content_short, channel, sort_order) VALUES
('Bem-vindo ao Gestão Igreja', 
'<h2>Olá! Bem-vindo ao Gestão Igreja</h2><p>Use o <strong>Dashboard</strong> para ver o resumo do dia: versículo, aniversariantes e ações rápidas. Comece cadastrando os membros em <strong>Membros e Congregados</strong> para aproveitar ao máximo o sistema.</p><p>Dúvidas? Acesse o menu <strong>Como Acessar</strong> ou entre em contato conosco.</p>',
'Comece pelo Dashboard e cadastre os membros. Use "Como Acessar" para dúvidas.',
'both', 1),

('Cadastro de membros: dica rápida',
'<h2>Dica: Cadastro de membros</h2><p>Em <strong>Membros</strong>, cadastre nome, telefone, e-mail e categoria (membro/congregado). Adicione foto para facilitar a identificação. Use as <strong>buscas e filtros</strong> para encontrar rapidamente quem precisa.</p><p>💡 Mantenha o telefone atualizado — ele é usado para WhatsApp e confirmação de escalas.</p>',
'Cadastre nome, telefone e categoria. Mantenha o telefone atualizado para escalas.',
'both', 2),

('Como usar o Caixa Diário',
'<h2>Caixa Diário: controle financeiro</h2><p>Em <strong>Caixa Diário</strong>, registre entradas (dízimos, ofertas) e saídas com categoria. Gere relatórios por período. O tesoureiro e pastores têm acesso total.</p><p>💡 Dica: Feche o caixa diariamente para manter os relatórios organizados.</p>',
'Registre entradas e saídas, use categorias. Feche o caixa diariamente.',
'email', 3),

('Escala de culto e confirmação',
'<h2>Escala de culto: confirmação online</h2><p>Em <strong>Eventos</strong>, crie o evento, adicione a escala e envie o link de confirmação pelo WhatsApp. Os escalados clicam no link e confirmam presença.</p><p>💡 Use o botão "Enviar via WhatsApp" na escala para abrir a conversa com a mensagem já pronta.</p>',
'Crie evento, adicione escala e envie link de confirmação pelo WhatsApp.',
'both', 4),

('Boletins e avisos',
'<h2>Boletins e Avisos</h2><p>Em <strong>Boletins</strong>, crie avisos e boletins. Envie para toda a igreja ou apenas para líderes. Os membros veem as notificações no app.</p><p>Use o ícone de sino no topo para acessar suas notificações.</p>',
'Crie avisos e boletins. Envie para toda a igreja ou só líderes.',
'email', 5),

('PIX e doações',
'<h2>Configure o PIX para doações</h2><p>Em <strong>PIX e Doações</strong>, cadastre a chave PIX da igreja. Um QR Code será gerado automaticamente para os membros fazerem ofertas e dízimos pelo celular.</p>',
'Cadastre a chave PIX e gere o QR Code para doações.',
'email', 6),

('Planos de leitura bíblica',
'<h2>Planos de Leitura</h2><p>Em <strong>Planos de Leitura</strong>, crie planos (ex: 30 dias em Provérbios). Os membros marcam o progresso e você acompanha quem está engajado.</p>',
'Crie planos e acompanhe o progresso dos membros.',
'email', 7),

('Solicitações de oração',
'<h2>Solicitações de Oração</h2><p>Qualquer membro pode registrar um pedido de oração em <strong>Solicitações de Oração</strong>. Pastores e admins podem gerenciar e ver quem já orou.</p>',
'Membros registram pedidos. Pastores organizam e acompanham.',
'whatsapp', 8),

('Instale o app no celular (PWA)',
'<h2>Instale o Gestão Igreja no celular</h2><p>Abra o app no navegador do celular e toque em <strong>Instalar</strong> ou <strong>Adicionar à tela inicial</strong>. O app funcionará como um aplicativo nativo, com ícone na tela.</p>',
'Adicione à tela inicial: abra no navegador e toque em Instalar.',
'both', 9)
ON CONFLICT (title) DO NOTHING;
