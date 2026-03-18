import {
  HelpCircle,
  LogIn,
  Menu,
  Copy,
  LayoutDashboard,
  Users,
  BookOpen,
  Send,
  CreditCard,
  Landmark,
  UserRound,
  Shield,
  FileText,
  DollarSign,
  Calendar,
  BarChart3,
  Upload,
  HandHeart,
  MapPin,
  CheckCircle2,
  Camera,
  Palette,
  ChevronLeft,
  KeyRound,
  Smartphone,
  Mail,
  Phone,
  Share2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SUBSCRIPTION_PIX } from '@/lib/subscriptionConfig';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard (Painel)',
    items: ['Visão geral do dia: versículo, aniversariantes e ações rápidas.', 'Acesso direto a Células, Secretaria, Relatórios e mais.'],
  },
  {
    icon: Users,
    title: 'Membros e Congregados',
    items: ['Cadastro completo com foto, categorias e histórico.', 'Adicione membros e congregados.', 'Edite dados e altere categorias.', 'Faça buscas e filtros.'],
  },
  {
    icon: MapPin,
    title: 'Células',
    items: ['Organize células.', 'Cadastre líderes e participantes.', 'Acompanhe relatórios de frequência.'],
  },
  {
    icon: Send,
    title: 'Boletins e Avisos',
    items: ['Envie avisos para a igreja.', 'Crie e publique boletins.'],
  },
  {
    icon: BookOpen,
    title: 'Planos de Leitura',
    items: ['Configure e acompanhe planos de leitura bíblica.'],
  },
  {
    icon: Share2,
    title: 'Redes Sociais',
    items: ['Cadastre os links das redes sociais da igreja.'],
  },
  {
    icon: CreditCard,
    title: 'Doar dízimos e ofertas',
    items: ['Todos os usuários podem visualizar.', 'Apenas o tesoureiro pode editar e configurar PIX e QR Code para doações e ofertas.'],
  },
  {
    icon: Landmark,
    title: 'Página Institucional',
    items: ['Personalize logo, nome da igreja e presidente.', 'Informações exibidas na página pública da igreja.'],
  },
  {
    icon: UserRound,
    title: 'Pastores',
    items: ['Cadastre pastores com foto e texto de apresentação.'],
  },
  {
    icon: Shield,
    title: 'Privacidade e LGPD',
    items: ['Configure suas preferências de privacidade.', 'Altere sua senha.'],
  },
  {
    icon: FileText,
    title: 'Secretaria',
    items: ['Documentos oficiais: certificados, transferências, ata de rol, carteirinha.'],
  },
  {
    icon: DollarSign,
    title: 'Caixa Diário',
    items: ['Controle entradas e saídas financeiras.', 'Gere relatórios de movimentação.', 'Disponível para administradores e tesoureiros.'],
  },
  {
    icon: Calendar,
    title: 'Eventos',
    items: ['Agenda de eventos e escalas de culto.', 'Confirmação online de presença.'],
  },
  {
    icon: BarChart3,
    title: 'Relatórios',
    items: ['Relatórios de membros, finanças e células.'],
  },
  {
    icon: Upload,
    title: 'Uploads e Atas',
    items: [
      'Todos os membros podem visualizar.',
      'Estudos: pastores editam.',
      'Financeiro: tesoureiro edita.',
      'Atas, Fotos, Vídeos: secretaria edita.',
    ],
  },
  {
    icon: HandHeart,
    title: 'Solicitações de Oração',
    items: ['Registre e acompanhe pedidos de oração.'],
  },
  {
    icon: CheckCircle2,
    title: 'Confirmar escala',
    items: ['Link para membros confirmarem presença em escalas de culto.', 'Receba o link pelo celular ou e-mail e confirme sua participação.'],
  },
];

const roles = [
  { role: 'Administrador', desc: 'Acesso total: membros, finanças, configurações, etc.' },
  { role: 'Pastor', desc: 'Dashboard, membros, secretaria, relatórios, uploads Estudos' },
  { role: 'Secretário', desc: 'Membros, documentação, boletins, uploads Atas/Fotos/Vídeos' },
  { role: 'Tesoureiro', desc: 'Caixa diário, relatórios financeiros, Doar dízimos e ofertas, uploads Financeiro' },
  { role: 'Líder de Célula', desc: 'Membros da célula, relatórios' },
  { role: 'Líder de Ministério', desc: 'Membros do ministério, relatórios' },
  { role: 'Membro/Congregado', desc: 'Sua página, avisos, escala, visualização de PIX e Uploads e Atas' },
];

const tips = [
  { icon: Camera, text: 'Clique na sua foto na lateral esquerda (menu) para trocar o avatar.' },
  { icon: Palette, text: 'Use o seletor de temas para escolher cores da interface.' },
  { icon: ChevronLeft, text: 'Clique na seta para recolher ou expandir o menu lateral.' },
  { icon: KeyRound, text: 'Na tela de login, use "Esqueci minha senha".' },
  { icon: Smartphone, text: 'No celular, adicione o app à tela inicial para usar como aplicativo (PWA).' },
];

const steps = [
  'Acesse o endereço do app no navegador ou instale como PWA no celular.',
  'Na tela inicial, clique em **Entrar** e faça login com e-mail e senha.',
  'Sem conta? Peça ao administrador da igreja para cadastrar você.',
  'Use o **Dashboard** para ver versículo, aniversariantes e ações rápidas.',
  'Cadastre membros e congregados em **Membros e Congregados** (com foto e categorias).',
  'Organize células e cadastre líderes e participantes.',
  'Envie boletins e avisos para a igreja.',
  'Visualize ou configure a chave PIX da igreja em **Doar dízimos e ofertas** (todos visualizam; apenas tesoureiro edita).',
  'Personalize logo e dados da igreja em **Página Institucional**.',
  'Cadastre pastores com foto em **Pastores**.',
  'Controle entradas e saídas em **Caixa Diário** (administradores e tesoureiros).',
  'Gerencie eventos e escalas de culto em **Eventos**.',
  'Gere relatórios de membros, finanças e células em **Relatórios**.',
  'Envie ou visualize documentos e atas em **Uploads e Atas** (Estudos: pastores; Financeiro: tesoureiro; Atas/Fotos/Vídeos: secretaria; todos visualizam).',
  'Troque sua foto de perfil clicando no avatar no menu; altere a senha em **Privacidade e LGPD**.',
];

export default function ComoAcessar() {
  useDocumentTitle('Como Acessar o App');
  const { toast } = useToast();
  const { user } = useAuth();
  const showPixMensalidade = ['pastor', 'secretario', 'tesoureiro'].includes(user?.role ?? '');

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <HelpCircle className="h-8 w-8 text-primary" />
          Como acessar o app
        </h1>
        <p className="text-muted-foreground mt-1">
          Guia completo do Gest Church — Gestão de Excelência
        </p>
      </div>

      <Card className="border-none shadow-lg overflow-hidden">
        <div className="h-2 bg-primary/20 w-full" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <LogIn className="h-5 w-5 text-primary" />
            Passos para acessar
          </CardTitle>
          <CardDescription>
            Siga estes passos para entrar no aplicativo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>Acesse o endereço do app no navegador (ou instale como PWA no celular).</li>
            <li>Na tela inicial, clique em <strong className="text-foreground">Entrar</strong>.</li>
            <li>Faça login com seu <strong className="text-foreground">e-mail</strong> e <strong className="text-foreground">senha</strong>.</li>
            <li>Se ainda não tem conta, peça ao administrador da igreja para cadastrar você.</li>
          </ol>
          <p className="text-sm text-muted-foreground pt-2">
            Após o login, você verá o menu lateral com as opções disponíveis conforme seu perfil (Administrador, Pastor, Secretário, Tesoureiro, Membro, Líder de Célula, Líder de Ministério, etc.).
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg overflow-hidden">
        <div className="h-2 bg-primary/20 w-full" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Menu className="h-5 w-5 text-primary" />
            Funcionalidades principais
          </CardTitle>
          <CardDescription>
            Visão geral do que o app oferece
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card/50 p-4 space-y-2"
              >
                <h3 className="font-semibold flex items-center gap-2">
                  <f.icon className="h-4 w-4 text-primary shrink-0" />
                  {f.title}
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  {f.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg overflow-hidden">
        <div className="h-2 bg-primary/20 w-full" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-5 w-5 text-primary" />
            Perfis e permissões
          </CardTitle>
          <CardDescription>
            O que cada perfil pode fazer no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Perfil</th>
                  <th className="text-left py-3 px-4 font-semibold">O que pode fazer</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((r) => (
                  <tr key={r.role} className="border-b border-border/50">
                    <td className="py-3 px-4 font-medium">{r.role}</td>
                    <td className="py-3 px-4 text-muted-foreground">{r.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg overflow-hidden">
        <div className="h-2 bg-primary/20 w-full" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <HelpCircle className="h-5 w-5 text-primary" />
            Dicas de uso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {tips.map((t, i) => (
              <li key={i} className="flex items-start gap-3">
                <t.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{t.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="border-none shadow-lg overflow-hidden">
        <div className="h-2 bg-primary/20 w-full" />
        <CardHeader>
          <CardTitle className="text-xl">Resumo rápido — 15 passos</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            {steps.map((s, i) => (
              <li key={i}>
                {s.split(/\*\*(.+?)\*\*/g).map((part, j) =>
                  j % 2 === 1 ? <strong key={j} className="text-foreground">{part}</strong> : part
                )}
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {showPixMensalidade && (
        <Card className="border-none shadow-lg overflow-hidden">
          <div className="h-2 bg-emerald-500/30 w-full" />
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Mensalidade da plataforma (PIX)
            </CardTitle>
            <CardDescription>
              Hotmart vende o app. As mensalidades são pagas via PIX. 1) Informe o nome da igreja no PIX antes de pagar. 2) Envie o comprovante para gestaoigreja@gmail.com
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Chave PIX:</strong> <span className="font-mono bg-muted px-2 py-1 rounded">{SUBSCRIPTION_PIX.pixKey}</span>
              <Button variant="ghost" size="sm" className="ml-2 h-7" onClick={() => { navigator.clipboard?.writeText(SUBSCRIPTION_PIX.pixKey); toast({ title: 'Chave PIX copiada!', duration: 2000 }); }}>
                <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
              </Button>
            </p>
            <p><strong>Titular:</strong> {SUBSCRIPTION_PIX.holderName} · {SUBSCRIPTION_PIX.bank}</p>
            <p className="text-sm text-muted-foreground">50 primeiras igrejas: R$ {SUBSCRIPTION_PIX.promoPrice}/mês · Demais: R$ {SUBSCRIPTION_PIX.fullPrice}/mês</p>
            <p className="text-sm pt-2">
              Envie o comprovante para{' '}
              <a href={`mailto:${SUBSCRIPTION_PIX.receiptEmail}?subject=Comprovante%20PIX%20-%20Mensalidade%20-%20[Nome%20da%20Igreja]`} className="text-primary underline font-medium">
                {SUBSCRIPTION_PIX.receiptEmail}
              </a>
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-lg overflow-hidden bg-primary/5 border-primary/20">
        <div className="h-2 bg-primary w-full" />
        <CardHeader>
          <CardTitle className="text-xl">Suporte</CardTitle>
          <CardDescription>
            Em caso de dúvidas ou problemas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            Entre em contato com o administrador da sua igreja ou pelo suporte:
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="mailto:edukadoshmda@gmail.com"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Mail className="h-4 w-4" />
              edukadoshmda@gmail.com
            </a>
            <a
              href="tel:+5591993837093"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              <Phone className="h-4 w-4" />
              (91) 99383-7093
            </a>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground italic">
        Gestão Igreja — Gestão de Excelência
      </p>
    </div>
  );
}
