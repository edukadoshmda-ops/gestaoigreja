# 🚀 Guia de Configuração do Supabase

## 📋 Índice
1. [Criar Projeto Supabase](#criar-projeto-supabase)
2. [Configurar Banco de Dados](#configurar-banco-de-dados)
3. [Configurar Variáveis de Ambiente](#configurar-variáveis-de-ambiente)
4. [Configurar Storage](#configurar-storage)
5. [Testar Conexão](#testar-conexão)
6. [Migrar Dados](#migrar-dados)

---

## 1. Criar Projeto Supabase

### Passo 1: Criar Conta
1. Acesse [https://supabase.com](https://supabase.com)
2. Clique em **"Start your project"**
3. Faça login com GitHub, Google ou Email

### Passo 2: Criar Novo Projeto
1. Clique em **"New Project"**
2. Preencha as informações:
   - **Name**: `flock-care-central` (ou nome de sua preferência)
   - **Database Password**: Crie uma senha forte e **SALVE-A**
   - **Region**: Escolha a região mais próxima (ex: `South America (São Paulo)`)
   - **Pricing Plan**: Free (para começar)
3. Clique em **"Create new project"**
4. Aguarde 2-3 minutos para o projeto ser criado

---

## 2. Configurar Banco de Dados

### Passo 1: Acessar SQL Editor
1. No painel do Supabase, clique em **"SQL Editor"** no menu lateral
2. Clique em **"New query"**

### Passo 2: Executar Schema
1. Abra o arquivo `supabase/schema.sql` deste projeto
2. Copie **TODO** o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** (ou pressione `Ctrl + Enter`)
5. Aguarde a execução (pode levar 1-2 minutos)
6. Você deve ver a mensagem: **"Success. No rows returned"**

### Passo 3: Verificar Tabelas
1. Clique em **"Table Editor"** no menu lateral
2. Você deve ver todas as tabelas criadas:
   - ✅ profiles
   - ✅ members
   - ✅ ministries
   - ✅ cells
   - ✅ events
   - ✅ financial_transactions
   - ✅ discipleships
   - ✅ notifications
   - E outras...

---

## 3. Configurar Variáveis de Ambiente

### Passo 1: Obter Credenciais
1. No painel do Supabase, clique em **"Settings"** (ícone de engrenagem)
2. Clique em **"API"**
3. Você verá:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Passo 2: Criar Arquivo .env.local
1. Na raiz do projeto, crie o arquivo `.env.local`
2. Adicione as seguintes linhas:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

3. Substitua os valores pelas suas credenciais
4. **IMPORTANTE**: Nunca commite este arquivo no Git!

### Passo 3: Verificar .gitignore
Certifique-se de que `.env.local` está no `.gitignore`:

```gitignore
# Environment variables
.env.local
.env.*.local
```

---

## 4. Configurar Storage

### Passo 1: Criar Buckets
1. No painel do Supabase, clique em **"Storage"**
2. Clique em **"Create a new bucket"**
3. Crie os seguintes buckets:

#### Bucket: photos
- **Name**: `photos`
- **Public**: ✅ Sim
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/*`

#### Bucket: documents
- **Name**: `documents`
- **Public**: ✅ Sim
- **File size limit**: 10 MB
- **Allowed MIME types**: `application/pdf, image/*`

### Passo 2: Configurar Políticas de Storage
Para cada bucket, adicione as seguintes políticas:

#### Policy: Public Read
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos');
```

#### Policy: Authenticated Upload
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'photos');
```

Repita para o bucket `documents`.

---

## 5. Testar Conexão

### Passo 1: Reiniciar Servidor de Desenvolvimento
```bash
# Pare o servidor (Ctrl + C)
# Inicie novamente
npm run dev
```

### Passo 2: Verificar Console
Abra o navegador e verifique o console (F12). Não deve haver erros de conexão.

### Passo 3: Testar Autenticação
1. Acesse a página de login
2. Tente criar uma nova conta
3. Verifique se o usuário foi criado em:
   - Supabase → Authentication → Users

---

## 6. Migrar Dados

### Opção A: Dados de Exemplo (Recomendado para Teste)

Execute o seguinte SQL no SQL Editor:

```sql
-- Inserir membros de exemplo
INSERT INTO public.members (name, email, phone, status, baptized) VALUES
  ('João Silva', 'joao@example.com', '(11) 98765-4321', 'ativo', true),
  ('Maria Santos', 'maria@example.com', '(11) 98765-4322', 'ativo', true),
  ('Pedro Oliveira', 'pedro@example.com', '(11) 98765-4323', 'ativo', false);

-- Inserir ministérios de exemplo
INSERT INTO public.ministries (name, description, active) VALUES
  ('Louvor', 'Ministério de louvor e adoração', true),
  ('Intercessão', 'Ministério de oração e intercessão', true),
  ('Crianças', 'Ministério infantil', true);

-- Inserir eventos de exemplo
INSERT INTO public.events (title, type, date, time, location, status) VALUES
  ('Culto de Celebração', 'culto', '2026-02-09', '19:00', 'Templo Principal', 'confirmado'),
  ('Reunião de Liderança', 'reuniao', '2026-02-15', '14:00', 'Sala de Reuniões', 'planejado');
```

### Opção B: Importar Dados Existentes

Se você tem dados em CSV ou JSON:

1. No Supabase, vá em **Table Editor**
2. Selecione a tabela
3. Clique em **"Insert"** → **"Import data from CSV"**
4. Faça upload do arquivo
5. Mapeie as colunas
6. Clique em **"Import"**

---

## 🔐 Segurança

### Checklist de Segurança:
- ✅ `.env.local` está no `.gitignore`
- ✅ Nunca compartilhe suas chaves
- ✅ Use RLS (Row Level Security) - já configurado no schema
- ✅ Mantenha o Supabase atualizado
- ✅ Use HTTPS em produção

### Políticas RLS Importantes:
O schema já inclui políticas de segurança, mas você pode adicionar mais:

```sql
-- Exemplo: Apenas admins podem deletar membros
CREATE POLICY "Only admins can delete members"
ON public.members FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
```

---

## 🧪 Testes

### Testar CRUD de Membros:
```typescript
import { membersService } from '@/services/members.service';

// Criar
const member = await membersService.create({
  name: 'Teste',
  email: 'teste@example.com',
  status: 'ativo'
});

// Listar
const members = await membersService.getAll();

// Atualizar
await membersService.update(member.id, { phone: '(11) 99999-9999' });

// Deletar
await membersService.delete(member.id);
```

---

## 📊 Monitoramento

### Verificar Uso:
1. Supabase → **Settings** → **Usage**
2. Monitore:
   - Database size
   - Storage
   - Bandwidth
   - API requests

### Limites do Plano Free:
- 500 MB de banco de dados
- 1 GB de storage
- 2 GB de bandwidth/mês
- 50.000 usuários autenticados

---

## 🆘 Troubleshooting

### Erro: "Missing Supabase environment variables"
**Solução**: Verifique se `.env.local` existe e tem as variáveis corretas.

### Erro: "Invalid API key"
**Solução**: Verifique se copiou a chave correta do painel do Supabase.

### Erro: "Row Level Security policy violation"
**Solução**: Verifique se o usuário está autenticado e tem permissão.

### Erro: "relation does not exist"
**Solução**: Execute o schema.sql novamente no SQL Editor.

---

## 📚 Recursos Adicionais

- [Documentação Oficial do Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage](https://supabase.com/docs/guides/storage)

---

## ✅ Checklist Final

Antes de ir para produção:

- [ ] Schema do banco aplicado
- [ ] Variáveis de ambiente configuradas
- [ ] Storage buckets criados
- [ ] Políticas RLS configuradas
- [ ] Dados de teste inseridos
- [ ] Autenticação testada
- [ ] CRUD testado em todos os módulos
- [ ] Backup configurado
- [ ] Monitoramento ativo

---

**🎉 Configuração Completa!**

Agora você está pronto para usar o Flock Care Central com Supabase!

Se precisar de ajuda, consulte a documentação ou abra uma issue no GitHub.
