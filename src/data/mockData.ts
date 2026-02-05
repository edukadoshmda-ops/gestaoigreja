import { Member, Ministry, BibleVerse } from '@/types';

export const mockMembers: Member[] = [
  {
    id: '1',
    name: 'João Pedro Silva',
    birthDate: '1985-01-22',
    address: 'Rua das Flores, 123 - Centro',
    email: 'joao.silva@email.com',
    phone: '(11) 99999-1111',
    ministries: ['louvor', 'celulas'],
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'Maria Santos Oliveira',
    birthDate: '1990-03-15',
    address: 'Av. Brasil, 456 - Jardim América',
    email: 'maria.oliveira@email.com',
    phone: '(11) 99999-2222',
    ministries: ['mulheres', 'missoes'],
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    name: 'Carlos Eduardo Lima',
    birthDate: '1978-07-08',
    address: 'Rua São Paulo, 789 - Vila Nova',
    email: 'carlos.lima@email.com',
    phone: '(11) 99999-3333',
    ministries: ['diaconos', 'homens'],
    createdAt: '2024-01-10',
  },
  {
    id: '4',
    name: 'Ana Paula Ferreira',
    birthDate: '2000-01-22',
    address: 'Rua das Palmeiras, 321 - Liberdade',
    email: 'ana.ferreira@email.com',
    phone: '(11) 99999-4444',
    ministries: ['jovens', 'midia'],
    createdAt: '2024-03-05',
  },
  {
    id: '5',
    name: 'Pedro Henrique Costa',
    birthDate: '2008-05-12',
    address: 'Av. Paulista, 1000 - Bela Vista',
    email: 'pedro.costa@email.com',
    phone: '(11) 99999-5555',
    ministries: ['adolescentes'],
    createdAt: '2024-02-15',
  },
];

export const mockMinistries: Ministry[] = [
  { id: 'celulas', name: 'Células', description: 'Grupos de comunhão e estudo bíblico', icon: 'Users', memberCount: 45 },
  { id: 'terceira-idade', name: 'Terceira Idade', description: 'Ministério para idosos', icon: 'Heart', memberCount: 28 },
  { id: 'homens', name: 'Homens', description: 'Ministério masculino', icon: 'User', memberCount: 52 },
  { id: 'mulheres', name: 'Mulheres', description: 'Ministério feminino', icon: 'User', memberCount: 68 },
  { id: 'jovens', name: 'Jovens', description: 'Ministério de jovens (18-30 anos)', icon: 'Zap', memberCount: 35 },
  { id: 'adolescentes', name: 'Adolescentes', description: 'Ministério teen (12-17 anos)', icon: 'Star', memberCount: 22 },
  { id: 'criancas', name: 'Crianças', description: 'Ministério infantil', icon: 'Baby', memberCount: 40 },
  { id: 'diaconos', name: 'Diáconos', description: 'Serviço e apoio à igreja', icon: 'HandHelping', memberCount: 15 },
  { id: 'louvor', name: 'Louvor', description: 'Ministério de música e adoração', icon: 'Music', memberCount: 18 },
  { id: 'artes', name: 'Artes', description: 'Dança, teatro e expressão artística', icon: 'Palette', memberCount: 12 },
  { id: 'midia', name: 'Mídia', description: 'Som, imagem e transmissões', icon: 'Video', memberCount: 8 },
  { id: 'missoes', name: 'Missões', description: 'Evangelismo e ação social', icon: 'Globe', memberCount: 25 },
];

export const dailyVerses: BibleVerse[] = [
  { text: 'Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.', reference: 'João 3:16' },
  { text: 'O Senhor é o meu pastor; nada me faltará.', reference: 'Salmos 23:1' },
  { text: 'Tudo posso naquele que me fortalece.', reference: 'Filipenses 4:13' },
  { text: 'Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento.', reference: 'Provérbios 3:5' },
  { text: 'Mas os que esperam no Senhor renovarão as suas forças, subirão com asas como águias.', reference: 'Isaías 40:31' },
];

export function getTodayBirthdays(members: Member[]): Member[] {
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();
  
  return members.filter(member => {
    const birthDate = new Date(member.birthDate);
    return birthDate.getMonth() + 1 === todayMonth && birthDate.getDate() === todayDay;
  });
}

export function getDailyVerse(): BibleVerse {
  const today = new Date();
  const index = today.getDate() % dailyVerses.length;
  return dailyVerses[index];
}
