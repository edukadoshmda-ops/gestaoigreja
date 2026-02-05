# 🗄️ Integração Supabase - Flock Care Central

## 📋 Visão Geral

Este documento descreve a arquitetura e implementação da integração com Supabase no Flock Care Central.

---

## 🏗️ Arquitetura

```
src/
├── lib/
│   ├── supabase.ts          # Cliente Supabase configurado
│   └── database.types.ts     # Tipos TypeScript do banco
│
├── services/
│   ├── auth.service.ts       # Serviço de autenticação
│   ├── members.service.ts    # CRUD de membros
│   ├── events.service.ts     # CRUD de eventos
│   ├── ministries.service.ts # CRUD de ministérios
│   ├── cells.service.ts      # CRUD de células
│   └── financial.service.ts  # CRUD financeiro
│
└── hooks/
    └── useAuth.ts            # Hook de autenticação (a criar)

supabase/
└── schema.sql                # Schema completo do banco
```

---

## 📊 Schema do Banco de Dados

### Tabelas Principais:

#### 1. **profiles** (Usuários)
- Estende `auth.users` do Supabase
- Armazena informações adicionais do usuário
- Campos: id, email, name, role, phone, avatar_url

#### 2. **members** (Membros da Igreja)
- Cadastro completo de membros
- Campos: name, email, phone, birth_date, address, status, etc.
- Relacionamentos: ministries, cells, events

#### 3. **ministries** (Ministérios)
- Gerenciamento de ministérios
- Campos: name, description, leader_id, color, icon
- Relacionamento many-to-many com members

#### 4. **cells** (Células/Grupos Pequenos)
- Gerenciamento de células
- Campos: name, leader_id, host_id, meeting_day, address
- Relacionamento many-to-many com members
- Tabela de relatórios: cell_reports

#### 5. **events** (Eventos)
- Gerenciamento de eventos e cultos
- Campos: title, type, date, time, location, status
- Tabelas relacionadas: event_checklists, service_scales

#### 6. **financial_transactions** (Finanças)
- Controle financeiro completo
- Campos: type, category, amount, date, description
- View: financial_summary (relatórios)

#### 7. **discipleships** (Discipulado)
- Acompanhamento de discipulado
- Campos: disciple_id, mentor_id, start_date, status
- Tabela relacionada: discipleship_meetings

#### 8. **notifications** (Notificações)
- Sistema de notificações
- Campos: user_id, title, message, type, read

---

## 🔐 Segurança (RLS)

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado com políticas específicas:

#### Políticas de Leitura:
- **Membros**: Todos os usuários autenticados podem visualizar
- **Finanças**: Apenas admin e tesoureiro
- **Notificações**: Apenas o próprio usuário

#### Políticas de Escrita:
- **Membros**: Admin e secretário podem criar/editar
- **Finanças**: Admin e tesoureiro podem gerenciar
- **Eventos**: Admin e secretário podem gerenciar

#### Políticas de Exclusão:
- **Membros**: Apenas admin
- **Finanças**: Apenas admin
- **Eventos**: Apenas admin

---

## 🛠️ Serviços Implementados

### 1. **authService** (`auth.service.ts`)

```typescript
import { authService } from '@/services/auth.service';

// Sign up
await authService.signUp({
  email: 'user@example.com',
  password: 'senha123',
  name: 'Nome do Usuário',
  role: 'membro'
});

// Sign in
await authService.signIn({
  email: 'user@example.com',
  password: 'senha123'
});

// Sign out
await authService.signOut();

// Get profile
const profile = await authService.getProfile();
```

### 2. **membersService** (`members.service.ts`)

```typescript
import { membersService } from '@/services/members.service';

// Listar todos
const members = await membersService.getAll();

// Listar ativos
const activeMembers = await membersService.getActive();

// Buscar por ID
const member = await membersService.getById('uuid');

// Criar
const newMember = await membersService.create({
  name: 'João Silva',
  email: 'joao@example.com',
  status: 'ativo'
});

// Atualizar
await membersService.update('uuid', { phone: '(11) 99999-9999' });

// Deletar
await membersService.delete('uuid');

// Buscar
const results = await membersService.search('João');

// Aniversariantes do mês
const birthdays = await membersService.getBirthdaysThisMonth();

// Estatísticas
const stats = await membersService.getStatistics();
```

### 3. **eventsService** (`events.service.ts`)

```typescript
import { eventsService } from '@/services/events.service';

// Listar todos
const events = await eventsService.getAll();

// Próximos eventos
const upcoming = await eventsService.getUpcoming();

// Por tipo
const cultos = await eventsService.getByType('culto');

// Por período
const events = await eventsService.getByDateRange('2026-01-01', '2026-12-31');

// Criar
const event = await eventsService.create({
  title: 'Culto de Celebração',
  type: 'culto',
  date: '2026-02-09',
  time: '19:00',
  location: 'Templo Principal',
  status: 'confirmado'
});

// Checklists
const checklists = await eventsService.getChecklists('event-uuid');
await eventsService.addChecklistItem('event-uuid', 'Preparar som');
await eventsService.toggleChecklistItem('checklist-uuid', true);

// Escalas de serviço
const scale = await eventsService.getServiceScale('event-uuid');
await eventsService.addToServiceScale('event-uuid', 'member-uuid', 'Pregador');
await eventsService.confirmServiceScale('scale-uuid', true);
```

### 4. **ministriesService** (`ministries.service.ts`)

```typescript
import { ministriesService } from '@/services/ministries.service';

// Listar todos
const ministries = await ministriesService.getAll();

// Criar
const ministry = await ministriesService.create({
  name: 'Louvor',
  description: 'Ministério de louvor e adoração',
  active: true
});

// Membros do ministério
const members = await ministriesService.getMembers('ministry-uuid');
await ministriesService.addMember('ministry-uuid', 'member-uuid', 'Cantor');
await ministriesService.removeMember('ministry-uuid', 'member-uuid');

// Contagem
const count = await ministriesService.getMemberCount('ministry-uuid');
```

### 5. **cellsService** (`cells.service.ts`)

```typescript
import { cellsService } from '@/services/cells.service';

// Listar todas
const cells = await cellsService.getAll();

// Criar
const cell = await cellsService.create({
  name: 'Célula Centro',
  meeting_day: 'Quarta-feira',
  meeting_time: '19:30',
  active: true
});

// Membros da célula
const members = await cellsService.getMembers('cell-uuid');
await cellsService.addMember('cell-uuid', 'member-uuid');

// Relatórios
const reports = await cellsService.getReports('cell-uuid');
await cellsService.createReport({
  cell_id: 'cell-uuid',
  date: '2026-02-05',
  attendance: 15,
  visitors: 2,
  conversions: 1
});
```

### 6. **financialService** (`financial.service.ts`)

```typescript
import { financialService } from '@/services/financial.service';

// Listar transações
const transactions = await financialService.getAll();

// Por período
const monthly = await financialService.getByDateRange('2026-02-01', '2026-02-28');

// Criar transação
const transaction = await financialService.create({
  type: 'entrada',
  category: 'Dízimos',
  amount: 1500.00,
  date: '2026-02-05',
  description: 'Dízimo - João Silva'
});

// Relatórios
const summary = await financialService.getSummary();
const income = await financialService.getTotalIncome('2026-01-01', '2026-12-31');
const expenses = await financialService.getTotalExpenses('2026-01-01', '2026-12-31');
const balance = await financialService.getBalance('2026-01-01', '2026-12-31');

// Categorias
const categories = await financialService.getCategories();
```

---

## 🔄 Migração de Dados Mock para Supabase

### Passo a Passo:

1. **Configure o Supabase** seguindo o guia `SUPABASE_SETUP.md`

2. **Atualize os componentes** para usar os serviços:

```typescript
// ANTES (mock data)
const [members, setMembers] = useState(mockMembers);

// DEPOIS (Supabase)
import { membersService } from '@/services/members.service';
import { useQuery } from '@tanstack/react-query';

const { data: members, isLoading } = useQuery({
  queryKey: ['members'],
  queryFn: () => membersService.getAll()
});
```

3. **Use React Query** para cache e sincronização:

```typescript
// Criar membro
const createMutation = useMutation({
  mutationFn: membersService.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['members'] });
  }
});

// Atualizar membro
const updateMutation = useMutation({
  mutationFn: ({ id, data }) => membersService.update(id, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['members'] });
  }
});
```

---

## 🎣 Hooks Personalizados (Próximo Passo)

### useAuth Hook:

```typescript
// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { authService } from '@/services/auth.service';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getSession().then(session => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = authService.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

---

## 📦 Dependências

```json
{
  "@supabase/supabase-js": "^2.x.x",
  "@tanstack/react-query": "^5.x.x"
}
```

---

## 🧪 Testes

### Testar Conexão:

```typescript
import { supabase } from '@/lib/supabase';

// Verificar conexão
const { data, error } = await supabase.from('members').select('count');
console.log('Conexão OK:', !error);
```

---

## 📚 Próximos Passos

1. ✅ Criar hooks personalizados (useAuth, useMembers, etc.)
2. ✅ Atualizar componentes para usar Supabase
3. ✅ Implementar real-time subscriptions
4. ✅ Adicionar tratamento de erros
5. ✅ Implementar loading states
6. ✅ Adicionar validações
7. ✅ Testes unitários

---

## 🆘 Suporte

- [Documentação Supabase](https://supabase.com/docs)
- [Guia de Setup](./SUPABASE_SETUP.md)
- [Schema SQL](../supabase/schema.sql)

---

**🎉 Integração Supabase Completa!**
