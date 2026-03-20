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
  { text: 'Sede fortes e corajosos. Não temais, nem vos espanteis, porque o Senhor teu Deus é contigo.', reference: 'Deuteronômio 31:6' },
  { text: 'Deleita-te no Senhor, e ele satisfará os desejos do teu coração.', reference: 'Salmos 37:4' },
  { text: 'Porque sou eu que conheço os planos que tenho a vosso respeito, diz o Senhor; planos de paz e não de mal, para vos dar um futuro e uma esperança.', reference: 'Jeremias 29:11' },
  { text: 'E sabemos que todas as coisas contribuem juntamente para o bem daqueles que amam a Deus.', reference: 'Romanos 8:28' },
  { text: 'Não me envergonho do evangelho, porque é o poder de Deus para a salvação de todo aquele que crê.', reference: 'Romanos 1:16' },
  { text: 'Não andeis ansiosos por coisa alguma; antes em tudo apresentai as vossas petições a Deus em oração.', reference: 'Filipenses 4:6' },
  { text: 'Sede, pois, imitadores de Deus, como filhos amados.', reference: 'Efésios 5:1' },
  { text: 'A graça do Senhor Jesus Cristo seja com o vosso espírito.', reference: 'Filipenses 4:23' },
  { text: 'Não vos conformeis com este século, mas transformai-vos pela renovação da vossa mente.', reference: 'Romanos 12:2' },
  { text: 'O Senhor te guardará de todo o mal; ele guardará a tua alma.', reference: 'Salmos 121:7' },
  { text: 'Vinde a mim, todos os que estais cansados e sobrecarregados, e eu vos aliviarei.', reference: 'Mateus 11:28' },
  { text: 'O amor é paciente, é benigno; o amor não arde em ciúmes, não se vangloria, não se ensoberbece.', reference: '1 Coríntios 13:4' },
  { text: 'Porque, pela graça sois salvos, mediante a fé; e isso não vem de vós; é dom de Deus.', reference: 'Efésios 2:8' },
  { text: 'O coração do homem planeja o seu caminho, mas o Senhor lhe dirige os passos.', reference: 'Provérbios 16:9' },
  { text: 'Tende bom ânimo; eu venci o mundo.', reference: 'João 16:33' },
  { text: 'Bem-aventurados os mansos, porque eles herdarão a terra.', reference: 'Mateus 5:5' },
  { text: 'Deus é o nosso refúgio e força, socorro bem presente nas tribulações.', reference: 'Salmos 46:1' },
  { text: 'Quem habita no esconderijo do Altíssimo, à sombra do Onipotente descansará.', reference: 'Salmos 91:1' },
  { text: 'Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus.', reference: 'Isaías 41:10' },
  { text: 'Pedi e dar-se-vos-á; buscai e achareis; batei e abrir-se-vos-á.', reference: 'Mateus 7:7' },
  { text: 'Porque o Senhor é bom; a sua misericórdia dura para sempre, e a sua fidelidade de geração em geração.', reference: 'Salmos 100:5' },
  { text: 'Alegrem-se sempre no Senhor! Digo novamente: Alegrem-se!', reference: 'Filipenses 4:4' },
  { text: 'Criou Deus o homem à sua imagem, à imagem de Deus o criou; homem e mulher os criou.', reference: 'Gênesis 1:27' },
  { text: 'Porque o Senhor teu Deus está contigo; ele te fortalecerá, te ajudará e te susterá com a sua destra fiel.', reference: 'Isaías 41:10' },
  { text: 'Bendize, ó minha alma, ao Senhor, e tudo o que há em mim bendiga o seu santo nome.', reference: 'Salmos 103:1' },
  { text: 'O início da sabedoria é o temor do Senhor; bom entendimento têm todos os que praticam os seus mandamentos.', reference: 'Salmos 111:10' },
  { text: 'A palavra do Senhor é reta, e tudo o que ele faz é com fidelidade.', reference: 'Salmos 33:4' },
  { text: 'Lâmpada para os meus pés é a tua palavra e luz para o meu caminho.', reference: 'Salmos 119:105' },
  { text: 'Mas eu vos digo que ameis os vossos inimigos e oreis pelos que vos perseguem.', reference: 'Mateus 5:44' },
  { text: 'Porque o filho do homem veio buscar e salvar o perdido.', reference: 'Lucas 19:10' },
  { text: 'O Espírito do Senhor está sobre mim porque me ungiu para proclamar boas novas aos pobres.', reference: 'Lucas 4:18' },
  { text: 'Eu sou o caminho, e a verdade, e a vida; ninguém vem ao Pai senão por mim.', reference: 'João 14:6' },
  { text: 'Mas a quem vencer darei que se assente comigo no meu trono.', reference: 'Apocalipse 3:21' },
  { text: 'Glória a Deus nas alturas, e paz na terra aos homens por ele amados.', reference: 'Lucas 2:14' },
  { text: 'Assim, pois, todos vós sois filhos de Deus pela fé em Cristo Jesus.', reference: 'Gálatas 3:26' },
  { text: 'A paz de Deus, que excede todo o entendimento, guardará os vossos corações e os vossos pensamentos em Cristo Jesus.', reference: 'Filipenses 4:7' },
  { text: 'E tudo o que pedirdes em meu nome, isso farei, para que o Pai seja glorificado no Filho.', reference: 'João 14:13' },
  { text: 'Bom é o Senhor para os que esperam nele, para a alma que o busca.', reference: 'Lamentações 3:25' },
  { text: 'Havendo, pois, paz com Deus por nosso Senhor Jesus Cristo.', reference: 'Romanos 5:1' },
  { text: 'Seja a vossa luz brilhar diante dos homens, para que vejam as vossas boas obras e glorifiquem o Pai.', reference: 'Mateus 5:16' },
  { text: 'O Senhor é compassivo e piedoso, tardio em irar-se e grande em misericórdia.', reference: 'Salmos 103:8' },
  { text: 'Porque, se confessares com a tua boca que Jesus é Senhor e creres no teu coração que Deus o ressuscitou, serás salvo.', reference: 'Romanos 10:9' },
  { text: 'Ensina a criança no caminho em que deve andar; e, até quando envelhecer, não se desviará dele.', reference: 'Provérbios 22:6' },
  { text: 'O justo viverá pela fé.', reference: 'Romanos 1:17' },
  { text: 'Deus é Espírito, e importa que os que o adoram o adorem em espírito e em verdade.', reference: 'João 4:24' },
  { text: 'Nada façais por contenda ou por vanglória, mas por humildade; cada um considere os outros superiores a si mesmo.', reference: 'Filipenses 2:3' },
  { text: 'Amai-vos uns aos outros com amor fraternal, preferindo-vos em honra uns aos outros.', reference: 'Romanos 12:10' },
  { text: 'A misericórdia do Senhor dura desde a eternidade até à eternidade sobre os que o temem.', reference: 'Salmos 103:17' },
  { text: 'Porque onde estiverem dois ou três reunidos em meu nome, ali estou no meio deles.', reference: 'Mateus 18:20' },
  { text: 'Enquanto temos tempo, façamos o bem a todos, especialmente aos da família da fé.', reference: 'Gálatas 6:10' },
  { text: 'O Senhor é clemente e misericordioso, tardio em irar-se e grande em benignidade.', reference: 'Salmos 145:8' },
  { text: 'Buscai primeiro o reino de Deus e a sua justiça, e todas essas coisas vos serão acrescentadas.', reference: 'Mateus 6:33' },
  { text: 'Porque nele vivemos, e nos movemos e existimos.', reference: 'Atos 17:28' },
  { text: 'Mas, por causa do seu grande amor por nós, Deus, que é rico em misericórdia, nos deu vida com Cristo.', reference: 'Efésios 2:4-5' },
  { text: 'Porque o Senhor não rejeita para sempre. Mas, quando aflige, também se compadece.', reference: 'Lamentações 3:31-32' },
  { text: 'A fé é a certeza daquilo que esperamos e a prova das coisas que não vemos.', reference: 'Hebreus 11:1' },
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
  // Usa o dia do ano (1-365) como índice, garantindo versículo diferente a cada dia
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = dayOfYear % dailyVerses.length;
  return dailyVerses[index];
}
