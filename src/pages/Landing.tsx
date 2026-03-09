import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Church, FileText, DollarSign, Calendar, Shield, Check, ArrowRight, Download, Menu, Lock, Key, Home,
  Clock, Heart, Smartphone, BookOpen, PenTool, BarChart, FileBox, LogIn, LayoutDashboard, Fingerprint, Video, UserCog, Link as LinkIcon, Edit, UserPlus, Gift, Send, Phone, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Logo } from '@/components/Logo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/contexts/AuthContext';
import { useInstallPWA } from '@/hooks/useInstallPWA';
import { APP_NAME } from '@/lib/constants';
import { motion } from 'framer-motion';

const HOTMART_CHECKOUT_URL = import.meta.env.VITE_HOTMART_CHECKOUT_URL || 'https://pay.hotmart.com/O104666619F?bid=1772219819580';

/** ID do vídeo YouTube para a página de vendas. Use VITE_LANDING_VIDEO_ID no .env para trocar. */
const LANDING_VIDEO_ID = import.meta.env.VITE_LANDING_VIDEO_ID || 'tg6745ZFLVw';

const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const features = [
  { icon: LayoutDashboard, title: 'Dashboard (Painel)', description: 'Visão geral do dia: versículo, aniversariantes e ações rápidas.' },
  { icon: Users, title: 'Membros e Congregados', description: 'Cadastro completo com foto, categorias e histórico. Buscas e filtros rápidos.' },
  { icon: Church, title: 'Ministérios e Células', description: 'Organize ministérios e células, cadastre líderes e acompanhe frequências.' },
  { icon: Send, title: 'Boletins e Avisos', description: 'Envie avisos gerais para a igreja e crie/publique boletins oficiais.' },
  { icon: BookOpen, title: 'Planos de Leitura', description: 'Configure e acompanhe planos de leitura bíblica para engajar a congregação.' },
  { icon: LinkIcon, title: 'Redes Sociais', description: 'Cadastre e centralize os links oficiais de todas as redes sociais da igreja.' },
  { icon: Gift, title: 'PIX e QR Code', description: 'Configure PIX e QR Code de forma simples para doações, ofertas e dízimos.' },
  { icon: Home, title: 'Página Institucional', description: 'Personalize logo, nome e pastor presidente exibidos na página da igreja.' },
  { icon: UserCog, title: 'Pastores', description: 'Cadastre os pastores com nome, foto e um texto inspirador de apresentação.' },
  { icon: Shield, title: 'Privacidade e LGPD', description: 'Configure preferência de dados e permita a alteração ou redefinição rápida de senha.' },
  { icon: FileText, title: 'Secretaria', description: 'Documentos oficiais: gere certificados, transferências, atas de rol e carteirinhas.' },
  { icon: DollarSign, title: 'Caixa Diário', description: 'Controle de entradas, saídas e relatórios (para administradores e tesoureiros).' },
  { icon: Calendar, title: 'Eventos e Escalas', description: 'Agenda completa, escalas de culto e ferramenta de confirmação online.' },
  { icon: BarChart, title: 'Relatórios', description: 'Geração de dados estatísticos de membros, finanças, células e ministérios.' },
  { icon: FileBox, title: 'Uploads e Atas', description: 'Envie documentos e organize por categorias: atas, estudos, transferências.' },
  { icon: Heart, title: 'Solicitação de Oração', description: 'Ambiente para registrar novos pedidos de oração que chegam da congregação.' },
  { icon: Users, title: 'Discipulado', description: 'Acompanhe de perto processos de discipulado (aberto para líderes e pastores).' },
  { icon: Check, title: 'Confirmar Escala', description: 'Link mobile/email para os escalados confirmarem presença no culto ou evento.' },
];

const profiles = [
  { role: 'Administrador', access: 'Acesso total: membros, finanças, configurações e mais.' },
  { role: 'Pastor', access: 'Dashboard, membros, ministérios, secretaria, relatórios.' },
  { role: 'Secretário', access: 'Membros, documentação e boletins.' },
  { role: 'Tesoureiro', access: 'Caixa diário e relatórios financeiros completos.' },
  { role: 'Líder de Célula', access: 'Membros da célula, discipulado e relatórios.' },
  { role: 'Líder de Ministério', access: 'Membros do respectivo ministério, relatórios.' },
  { role: 'Membro / Congreg.', access: 'Página pessoal, avisos, confirmação de escala, doação Pix.' },
];

const PurchaseCard = ({ timeLeft }: { timeLeft: number }) => (
  <div className="max-w-xl mx-auto p-1 rounded-2xl bg-gradient-to-r from-primary via-cyan-400 to-primary p-[2px] animate-shimmer shadow-2xl backdrop-blur-sm">
    <div className="bg-background/95 rounded-xl p-6 md:p-8">
      <div className="flex flex-col items-center gap-4 mb-6">
        <div className="text-4xl font-mono font-black tabular-nums text-cyan-600 drop-shadow-md">
          {formatTime(timeLeft)}
        </div>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest text-center">
          Tempo estipulado para compra com desconto. Agarre a oportunidade!
        </p>
        <p className="text-2xl font-bold text-foreground">
          Por apenas <span className="text-primary">R$ 75,00</span>/mês
          <span className="text-sm font-normal text-muted-foreground ml-2 line-through">R$ 150,00</span>
        </p>
      </div>

      <a href={HOTMART_CHECKOUT_URL} target="_blank" rel="noopener noreferrer" className="w-full block">
        <Button
          size="lg"
          className="w-full text-sm sm:text-base md:text-lg min-h-[52px] sm:min-h-[56px] md:h-16 rounded-xl font-bold gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 group transition-all duration-300 hover:scale-[1.02] flex items-center justify-center flex-wrap overflow-hidden bg-blue-900 hover:bg-blue-800 text-white border-0"
        >
          <span className="text-center leading-tight break-words max-w-full">Assinar com 50% OFF por R$ 75,00/mês</span>
          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 ml-0.5 group-hover:translate-x-1 transition-transform" />
        </Button>
      </a>
    </div>
  </div>
);

export default function Landing() {
  useDocumentTitle(`${APP_NAME} — Gestão de Excelência`);
  const { isAuthenticated } = useAuth();
  const { canInstall, install, isInstalled } = useInstallPWA();
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  const handleInstallClick = async () => {
    if (canInstall) {
      await install();
    } else {
      setShowInstallHelp(true);
    }
  };

  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'oceano-profundo');
    document.body.setAttribute('data-theme', 'oceano-profundo');

    const timer = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0)), 1000);

    return () => {
      clearInterval(timer);
      const path = window.location.pathname;
      const publicPages = ['/', '/login', '/checkout', '/hotmart-success'];
      if (!publicPages.includes(path)) {
        const savedTheme = localStorage.getItem('church_theme') || 'fe-radiante';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.body.setAttribute('data-theme', savedTheme);
      }
    };
  }, []);

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      {/* Header — logo, Entrar e Instalar SEMPRE visíveis (mobile, tablet, desktop) */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl border-primary/20 safe-area-padding">
        <div className="w-full max-w-2xl mx-auto flex flex-row justify-between items-center gap-1 px-2 sm:px-4 py-2 min-h-[48px] sm:min-h-[56px]">
          <div className="flex-shrink-0 min-w-0 overflow-visible sm:max-w-none">
            <div className="scale-[0.55] sm:scale-[0.7] md:scale-75 lg:scale-85 origin-left overflow-visible">
              <Logo size="sm" showText={false} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-1 flex-shrink-0">
            {!isInstalled && (
              <Button variant="outline" size="sm" className="inline-flex gap-1.5 shrink-0 text-xs sm:text-sm" onClick={handleInstallClick}>
                <Download className="h-4 w-4 shrink-0" />
                <span>Instalar App</span>
              </Button>
            )}
            <Link to="/login" className="shrink-0">
              <Button variant="default" className="font-semibold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg shadow-primary/20 text-xs sm:text-sm gap-1.5 whitespace-nowrap">
                <LogIn className="h-4 w-4 shrink-0" />
                <span>Entrar</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <Dialog open={showInstallHelp} onOpenChange={setShowInstallHelp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Instalar no celular</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-2">
                {isIOS ? (
                  <>
                    <p><strong>No Safari:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Toque no ícone <strong>Compartilhar</strong> (seta para cima) na barra inferior</li>
                      <li>Role e toque em <strong>Adicionar à Tela de Início</strong></li>
                      <li>Toque em <strong>Adicionar</strong></li>
                    </ol>
                  </>
                ) : (
                  <>
                    <p><strong>No Chrome ou Edge:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Toque no menu <strong>⋮</strong> (três pontos) no canto superior direito</li>
                      <li>Selecione <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong></li>
                    </ol>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Hero — título limpo, sem sobreposição */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background pt-6 sm:pt-8 pb-24 border-b border-primary/10">
        <div className="container px-4 mx-auto text-center z-10 relative">

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-1.5 px-2 py-1 sm:px-4 sm:py-2 rounded-full bg-blue-900 border border-blue-800 text-white font-bold mb-6 sm:mb-8 text-[10px] sm:text-sm text-center justify-center mx-auto whitespace-nowrap sm:whitespace-normal"
          >
            <Gift className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse shrink-0" />
            7 dias grátis para testar · 50 primeiras assinaturas: 50% de Desconto!
          </motion.div>

          <h1 className="text-[2rem] sm:text-[2.5rem] md:text-[3rem] font-black mb-4 sm:mb-6 max-w-4xl mx-auto leading-[1.15] tracking-tighter">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-cyan-400 to-blue-500 drop-shadow-sm">
              Gestão de Excelência
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12">
            O hub definitivo para simplificar a administração e engajar a sua congregação. Tudo o que você precisa em um único App.
          </p>

          <PurchaseCard timeLeft={timeLeft} />
        </div>

        {/* Background decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full opacity-50 pointer-events-none -z-10" />
      </section>

      {/* Vídeo de apresentação */}
      {LANDING_VIDEO_ID && (
        <section className="py-16 md:py-24 bg-muted/30 border-b border-primary/10">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
                <Video className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-3">
                Veja o app em ação
              </h2>
              <p className="text-lg text-muted-foreground">
                Assista ao vídeo e descubra como o Gestão Igreja facilita o dia a dia da sua igreja.
              </p>
            </div>
            <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-primary/20 bg-black aspect-video">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${LANDING_VIDEO_ID}?rel=0`}
                title="Gestão Igreja - Apresentação"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </section>
      )}

      {/* Como Acessar O App */}
      <section className="py-24 bg-card/30 relative overflow-hidden">
        {/* Background glow sutil */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-8 items-center">

            {/* Coluna da Esquerda (Chamada principal) */}
            <div className="lg:col-span-5 text-center lg:text-left relative z-10">
              <div className="inline-flex items-center justify-center p-3 bg-background border border-border shadow-sm rounded-xl mb-6 group-hover:border-primary/50 transition-colors">
                <Fingerprint className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-black mb-4 tracking-tight leading-[1.1]">
                Simplicidade em cada <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">acesso.</span>
              </h2>
              <p className="text-base lg:text-lg text-muted-foreground leading-relaxed mb-6">
                Desenvolvido para ser extremamente fluido. Acesse relatórios, dízimos e cadastros de membros em quatro passos simples, de qualquer dispositivo, a qualquer momento.
              </p>
            </div>

            {/* Coluna da Direita (Steps Verticais) */}
            <div className="lg:col-span-6 lg:col-start-7 relative z-10">
              {/* Timeline Line */}
              <div className="absolute left-[1.35rem] lg:left-[1.75rem] top-4 bottom-4 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent hidden sm:block" />

              <div className="space-y-10 relative">
                {[
                  { num: "01", title: "Conexão Inicial", text: "Acesse nossa plataforma via navegador ou adicione-a como um aplicativo na tela inicial do seu celular (PWA)." },
                  { num: "02", title: "Área de Trabalho", text: <>Na vitrine inicial, navegue até o canto superior para clicar de forma segura em <strong className="text-foreground">Entrar</strong> e iniciar sua rotina.</> },
                  { num: "03", title: "Autenticação", text: "Use seu E-mail corporativo ou pessoal autorizado juntamente com sua senha criptografada." },
                  { num: "04", title: "Sem cadastro?", text: "Acione os administradores (liderança da sua igreja) para realizar sua matrícula na plataforma Gestão Igreja." },
                ].map((step, idx) => (
                  <div key={idx} className="relative flex flex-col sm:flex-row gap-4 sm:gap-6 lg:gap-8 items-start group cursor-default">
                    <div className="relative z-10 flex flex-col items-center shrink-0">
                      <div className="w-11 h-11 lg:w-14 lg:h-14 rounded-full bg-background border-[3px] border-primary/20 flex items-center justify-center shadow-sm group-hover:border-primary group-hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-300">
                        <span className="text-sm lg:text-base font-black text-primary group-hover:scale-110 transition-transform">{step.num}</span>
                      </div>
                    </div>
                    <div className="pt-1 sm:pt-1.5 lg:pt-3 text-center sm:text-left">
                      <h4 className="text-xl lg:text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">{step.title}</h4>
                      <p className="text-muted-foreground text-base leading-relaxed tracking-wide max-w-lg mx-auto sm:mx-0">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="mt-12 relative overflow-hidden bg-white text-slate-900 p-5 md:p-8 rounded-[1.5rem] border border-primary/20 flex flex-col items-center text-center shadow-xl transition-transform hover:scale-[1.01] duration-700 group mx-auto md:max-w-3xl">
            {/* Blurs laranjas minimalistas no fundo branco */}
            <div className="absolute -top-40 -right-40 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-primary/20 transition-colors duration-700"></div>
            <div className="absolute -bottom-40 -left-40 w-64 h-64 bg-cyan-400/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-cyan-400/20 transition-colors duration-700"></div>

            <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
              <div className="p-3 bg-primary/10 backdrop-blur-xl rounded-full mb-4 shadow-sm border border-primary/30 group-hover:rotate-12 transition-transform duration-500">
                <Menu className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl md:text-3xl font-black mb-4 tracking-tighter text-primary drop-shadow-sm">
                Menu Inteligente e Personalizado
              </h3>
              <p className="text-base md:text-lg text-slate-700 leading-relaxed font-medium mb-6 max-w-xl">
                Após o login, você tem acesso <strong className="text-primary underline underline-offset-4 decoration-cyan-500 decoration-2">exclusivo e direcionado</strong>.
              </p>

              <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-6">
                {['Administrador', 'Pastor', 'Secretário', 'Tesoureiro', 'Líder', 'Membro'].map(role => (
                  <span key={role} className="bg-primary/5 hover:bg-primary/10 backdrop-blur-md px-3 py-1.5 rounded-full text-primary text-xs md:text-sm font-bold transition-colors border border-primary/20 shadow-sm cursor-default">
                    {role}
                  </span>
                ))}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl backdrop-blur-sm border border-slate-200 shadow-inner max-w-lg">
                <p className="text-base md:text-lg text-slate-800 italic font-medium leading-relaxed">
                  "Tudo o que você não precisa some da sua tela, deixando a sua visão totalmente limpa e focada apenas no que é útil!"
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section className="py-24 container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          Funcionalidades Principais
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card p-6 rounded-xl border border-border/60 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all group"
            >
              <div className="p-3 bg-primary/10 rounded-lg w-max mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <item.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
              </div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.description}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 sm:mt-20">
          <PurchaseCard timeLeft={timeLeft} />
        </div>
      </section>

      {/* Perfis e Permissoes */}
      <section className="relative py-16 bg-white text-slate-900 overflow-hidden">
        {/* Fundo decorativo sutil */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="text-center mb-10 md:mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-4 border border-primary/20 backdrop-blur-sm">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-4 tracking-tighter text-slate-900">
              Perfis e Permissões
            </h2>
            <p className="text-base text-slate-600 max-w-xl mx-auto font-medium">
              Sistema de acesso ciber-seguro e adaptável. Cada membro desfruta de uma experiência exclusiva, enxergando apenas a sua área de atuação.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {profiles.map((p, idx) => (
              <motion.div
                key={p.role}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                className={`group relative bg-white p-5 rounded-xl border overflow-hidden hover:-translate-y-1 transition-all duration-300 shadow-md hover:shadow-xl hover:shadow-primary/20 ${idx === 0
                  ? 'md:col-span-2 lg:col-span-3 border-primary/30 bg-gradient-to-br from-cyan-50 to-white'
                  : 'border-slate-200 hover:border-primary/50'
                  }`}
              >
                {/* Glow decorativo de fundo no hover */}
                <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-primary/10 rounded-full blur-[30px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* Linha de destaque lateral */}
                <div className="absolute top-5 left-0 w-1 h-8 bg-primary rounded-r-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="flex flex-col h-full pl-2 relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(6,182,212,0.4)]" />
                    <h3 className={`font-bold tracking-tight text-primary ${idx === 0 ? 'text-xl md:text-2xl' : 'text-lg'} transition-colors duration-300`}>
                      {p.role}
                    </h3>
                  </div>
                  <p className={`text-slate-600 leading-relaxed font-medium ${idx === 0 ? 'text-base' : 'text-sm'}`}>
                    {p.access}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dicas de Uso */}
      <section className="py-24 bg-card/50">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-12">Dicas de Uso Exclusivas</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex gap-4 p-5 rounded-2xl bg-background border shadow-sm">
              <div className="p-3 rounded-full bg-primary/10 h-max"><UserPlus className="w-6 h-6 text-primary" /></div>
              <div>
                <h4 className="font-bold mb-1">Foto de perfil</h4>
                <p className="text-muted-foreground text-sm">Clique na sua foto na lateral esquerda (menu) para trocar o avatar.</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-background border shadow-sm">
              <div className="p-3 rounded-full bg-primary/10 h-max"><Edit className="w-6 h-6 text-primary" /></div>
              <div>
                <h4 className="font-bold mb-1">Tema Visual</h4>
                <p className="text-muted-foreground text-sm">Use o seletor de temas para escolher cores que agradam sua interface.</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-background border shadow-sm">
              <div className="p-3 rounded-full bg-primary/10 h-max"><Menu className="w-6 h-6 text-primary" /></div>
              <div>
                <h4 className="font-bold mb-1">Menu Recolhido</h4>
                <p className="text-muted-foreground text-sm">Clique na seta ao lado do menu para recolher ou expandir a barra lateral de atalhos.</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl bg-background border shadow-sm">
              <div className="p-3 rounded-full bg-primary/10 h-max"><Key className="w-6 h-6 text-primary" /></div>
              <div>
                <h4 className="font-bold mb-1">Esqueci minha senha</h4>
                <p className="text-muted-foreground text-sm">Na própria tela de login, clique na opção segura de redefinição.</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 rounded-2xl md:col-span-2 bg-gradient-to-r from-background to-primary/5 border border-primary/20 shadow-sm">
              <div className="p-3 rounded-full bg-primary/10 h-max"><Smartphone className="w-6 h-6 text-primary" /></div>
              <div>
                <h4 className="font-bold mb-1">Aplicativo PWA</h4>
                <p className="text-muted-foreground text-sm">No seu celular (Android ou iOS via Safari), adicione o sistema à tela inicial para usá-lo como um aplicativo nativo completo.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perguntas Frequentes (FAQ) */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Dúvidas Frequentes</h2>
            <p className="text-muted-foreground text-lg">
              Tudo o que você precisa saber para tomar a melhor decisão para a sua congregação.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Por que investir em um aplicativo exclusivo para nossa igreja?",
                a: "Para organizar informações de forma eficaz, otimizar a comunicação interna, fortalecer o engajamento espiritual dos irmãos da igreja durante a semana, e facilitar contribuições (PIX e dízimos) de qualquer lugar. Cansou de papéis e planilhas confusas? Com este app você unifica relatórios e informações."
              },
              {
                q: "Quem tem acesso aos dados da igreja e aos relatórios financeiros?",
                a: "Somente quem possuir a permissão adequada no seu perfil. Administradores e tesoureiros terão acesso à área financeira, enquanto pastores e líderes de célula visualizam o necessário para a operação deles. Os dados de cada igreja ficam isolados e são visíveis apenas pela liderança."
              },
              {
                q: "Como o App lida com a privacidade e à LGPD?",
                a: "A plataforma possui um módulo embutido para tratar Privacidade & LGPD, onde o usuário detém acesso à edição de suas credenciais, além de uma política transparente do uso seguro de suas fotos e dados pessoais, aderindo às normas de proteção. Informações confidenciais são restritas a cargos administrativos."
              },
              {
                q: "Se eu tiver alguma dúvida na hora de instalar, tenho suporte?",
                a: "Sim! Se você assinar ou se precisar de orientação extra para implantar na sua igreja, você terá contato pelo telefone e por e-mail, como exibido no rodapé da página. E melhor: todos os recursos vêm de fácil interatividade e muito intuitivos."
              },
              {
                q: "Funciona tanto em iPhone quanto via Android?",
                a: "Sim, através do formato PWA (Progressive Web App). Basta acessar a URL com o navegador do seu celular (Safari ou Chrome), e um botão de 'Instalar App' irá aparecer para salvar nos aplicativos nativos da tela inicial de qualquer membro!"
              }
            ].map((faq, i) => (
              <details key={i} className="group bg-card border shadow-sm rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 font-bold hover:bg-muted/50 transition-colors">
                  <span className="text-lg">{faq.q}</span>
                  <span className="relative flex shrink-0 items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary group-open:bg-primary group-open:text-primary-foreground transition-all">
                    <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="p-5 pt-0 text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-20 pt-10 border-t border-border/50">
          <PurchaseCard timeLeft={timeLeft} />
        </div>
      </section>

      {/* CTA final and Footer */}
      <footer className="border-t border-primary/20 bg-background pt-16 pb-8">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Em caso de dúvidas ou problemas</h2>
            <p className="text-muted-foreground mb-8">
              Pode ficar tranquilo. Nosso time de apoio e os administradores da sua igreja estão sempre disponíveis.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 text-center">
              <a href="tel:+5591993837093" className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl transition-colors">
                <Phone className="w-5 h-5" />
                (91) 99383-7093
              </a>
              <a href="mailto:edukadoshmda@gmail.com" className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl transition-colors">
                <Mail className="w-5 h-5" />
                edukadoshmda@gmail.com
              </a>
            </div>
          </div>

          <div className="w-full h-px bg-border/50 mb-8" />

          <Logo size="sm" showText={true} className="justify-center opacity-70 mb-4" />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Gestão Igreja. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
