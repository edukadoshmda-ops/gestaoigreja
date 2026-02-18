import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Church,
  FileText,
  DollarSign,
  Calendar,
  Shield,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/contexts/AuthContext';
import { APP_NAME } from '@/lib/constants';

const features = [
  {
    icon: Users,
    title: 'Membros e Congregados',
    description: 'Cadastro completo de membros com categorias, fotos e histórico.',
  },
  {
    icon: Church,
    title: 'Ministérios e Células',
    description: 'Organize ministérios, células e relatórios de frequência.',
  },
  {
    icon: FileText,
    title: 'Secretaria e Documentos',
    description: 'Certificados, transferências, rol e carteirinha de membros.',
  },
  {
    icon: DollarSign,
    title: 'Caixa Diário',
    description: 'Controle financeiro com entradas, saídas e relatórios.',
  },
  {
    icon: Calendar,
    title: 'Eventos e Escalas',
    description: 'Agenda de eventos, escalas de culto e confirmação online.',
  },
  {
    icon: Shield,
    title: 'Multi-igreja',
    description: 'Painel administrativo para gestão de várias congregações.',
  },
];

export default function Landing() {
  useDocumentTitle(`${APP_NAME} - Gestão para sua igreja`);
  const { isAuthenticated } = useAuth();

  // Força o tema laranja nas páginas públicas
  useEffect(() => {
    // Aplica imediatamente o tema laranja
    document.documentElement.setAttribute('data-theme', 'fe-radiante');
    document.body.setAttribute('data-theme', 'fe-radiante');
    
    // Cleanup: restaura o tema do usuário apenas se estiver navegando para área autenticada
    return () => {
      // Só restaura se não estiver indo para outra página pública
      const path = window.location.pathname;
      const publicPages = ['/', '/login', '/checkout', '/hotmart-success'];
      if (!publicPages.includes(path)) {
        const savedTheme = localStorage.getItem('church_theme') || 'fe-radiante';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.body.setAttribute('data-theme', savedTheme);
      }
    };
  }, []);

  if (isAuthenticated) {
    return null; // Será redirecionado pelo App.tsx
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Logo size="sm" showText={true} />
          <Link to="/login">
            <Button variant="ghost" className="font-semibold">
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-primary mb-4">
            Gestão completa para sua igreja
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Membros, ministérios, financeiro, eventos e documentos oficiais em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/checkout">
              <Button size="lg" className="gap-2 text-lg px-8 h-14 shadow-lg shadow-primary/25">
                Começar agora
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="#planos">
              <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                Ver planos
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Tudo que sua igreja precisa
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-xl border bg-card hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="planos" className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Planos acessíveis
        </h2>
        <div className="max-w-md mx-auto">
          <div className="relative p-8 rounded-2xl border-2 border-primary bg-card shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
              Recomendado
            </div>
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">Plano Mensal</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Ideal para igrejas que querem começar
              </p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-black text-primary">R$ 150</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {[
                'Membros e congregados ilimitados',
                'Ministérios e células',
                'Caixa diário e relatórios',
                'Eventos e escalas',
                'Documentos oficiais (atas, relatórios etc.)',
                'Suporte por e-mail',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm">
                  <Check className="h-5 w-5 text-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/checkout" className="block">
              <Button className="w-full h-12 text-base font-semibold" size="lg">
                Assinar agora e começar
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Ao assinar, você será redirecionado para criar sua conta e acessar o app.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center p-8 rounded-2xl bg-primary/10 border border-primary/20">
          <h2 className="text-2xl font-bold mb-4">Pronto para simplificar a gestão da sua igreja?</h2>
          <p className="text-muted-foreground mb-6">
            Comece hoje mesmo. Sem burocracia. Sua igreja merece o melhor.
          </p>
          <Link to="/login">
            <Button size="lg" className="gap-2 text-base px-8">
              Acessar o app
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {APP_NAME}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
