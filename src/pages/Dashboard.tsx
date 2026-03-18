import { useState, useEffect } from 'react';
import type { ElementType } from 'react';
import type { UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import {
  MapPin,
  FileText,
  BarChart3,
  Upload,
  DollarSign,
  CreditCard,
  Calendar,
  HandHeart,
  HeartHandshake,
  Landmark,
  UserRound,
  Shield,
  HelpCircle,
  GraduationCap,
  Users,
  Copy,
  Mail,
  Package,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DailyVerse } from '@/components/DailyVerse';
import { BirthdayCard } from '@/components/BirthdayCard';
import { DashboardCustomizer } from '@/components/DashboardCustomizer';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  getDashboardConfig,
  saveDashboardConfig,
  type DashboardConfig,
  type DashboardWidgetId,
} from '@/lib/dashboardConfig';
import { SUBSCRIPTION_PIX } from '@/lib/subscriptionConfig';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface QuickActionDef {
  icon?: ElementType | null;
  label: string;
  href: string;
  roles: UserRole[];
}

const quickActionsList: QuickActionDef[] = [
  { icon: Users, label: 'Ministérios', href: '/ministerios', roles: ['admin', 'pastor', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin'] },
  { icon: MapPin, label: 'Células', href: '/celulas', roles: ['admin', 'pastor', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin'] },
  { icon: FileText, label: 'Secretaria', href: '/secretaria', roles: ['pastor', 'secretario', 'superadmin'] },
  { icon: BarChart3, label: 'Relatórios', href: '/relatorios', roles: ['admin', 'pastor', 'secretario', 'lider_ministerio', 'superadmin'] },
  { icon: Upload, label: 'Uploads e Atas', href: '/uploads', roles: ['admin', 'pastor', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
  { icon: GraduationCap, label: 'Escolas', href: '/escolas', roles: ['admin', 'pastor', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
  { icon: HeartHandshake, label: 'Discipulado', href: '/discipulado', roles: ['admin', 'pastor', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin'] },
  { icon: DollarSign, label: 'Caixa Diário', href: '/caixa-diario', roles: ['pastor', 'tesoureiro', 'superadmin'] },
  { icon: Calendar, label: 'Eventos', href: '/eventos', roles: ['admin', 'pastor', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
  { icon: HandHeart, label: 'Solicitações de Oração', href: '/solicitacoes-oracao', roles: ['admin', 'pastor', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
  { icon: CreditCard, label: 'Doar dízimos e ofertas', href: '/pix-donacoes', roles: ['admin', 'pastor', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
  { icon: Landmark, label: 'Página Institucional', href: '/institucional', roles: ['admin', 'pastor', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
  { icon: UserRound, label: 'Pastores', href: '/pastores', roles: ['admin', 'pastor', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
  { icon: Shield, label: 'Privacidade e LGPD', href: '/privacidade', roles: ['admin', 'pastor', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
  { icon: Package, label: 'Patrimonial', href: '/patrimonio', roles: ['admin', 'pastor', 'superadmin', 'diretor_patrimonio'] },
  { icon: HelpCircle, label: 'Como Acessar', href: '/como-acessar', roles: ['admin', 'pastor', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin'] },
];

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const { toast } = useToast();
  const showPixNotice = ['pastor', 'secretario', 'tesoureiro'].includes(user?.role ?? '');
  const [config, setConfig] = useState<DashboardConfig>(() =>
    getDashboardConfig(user?.id, user?.role)
  );

  useEffect(() => {
    setConfig(getDashboardConfig(user?.id, user?.role));
  }, [user?.id, user?.role]);

  // Tesoureiro, secretário e diretor de patrimônio veem todos os ícones; permissões são mantidas nas rotas
  const rolesQueVeemTodos = ['tesoureiro', 'secretario', 'diretor_patrimonio'];
  const visibleActions = user && rolesQueVeemTodos.includes(user.role ?? '')
    ? quickActionsList
    : quickActionsList.filter((a) => user && a.roles.includes(user.role));

  const orderedWidgets = config.widgetOrder.filter((id) => config.visibleWidgets.includes(id));

  return (
    <div className="space-y-6" data-dashboard-root>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Olá, {user?.name ? user.name.split(' ')[0] : 'Bem-vindo'}!
          </h1>
          <p className="text-muted-foreground">Bem-vindo ao painel de gestão</p>
        </div>
        <DashboardCustomizer
          userId={user?.id}
          config={config}
          onConfigChange={(c) => {
            setConfig(c);
            if (user?.id) saveDashboardConfig(user.id, c);
          }}
        />
      </div>

      {/* Widgets configuráveis */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {orderedWidgets.includes('verse') && (
          <div data-widget-verse>
            <DailyVerse />
          </div>
        )}
        {orderedWidgets.includes('birthdays') && (
          <div data-widget-birthdays>
            <BirthdayCard />
          </div>
        )}
        {showPixNotice && (
          <Card className="xl:col-span-2 border-primary/30 bg-primary/5 shadow-lg" data-widget-pix-mensalidade>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="p-3 rounded-xl bg-primary/20">
                    <CreditCard className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Mensalidade da plataforma</h3>
                    <p className="text-sm text-muted-foreground">Pague via PIX e envie o comprovante</p>
                  </div>
                </div>
                <div className="flex-1 grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p><strong>Chave PIX:</strong> <span className="font-mono bg-muted px-2 py-1 rounded">{SUBSCRIPTION_PIX.pixKey}</span>
                      <Button variant="ghost" size="sm" className="h-7 ml-2" onClick={() => { navigator.clipboard?.writeText(SUBSCRIPTION_PIX.pixKey); toast({ title: 'Chave PIX copiada!', duration: 2000 }); }}>
                        <Copy className="h-4 w-4 mr-1" /> Copiar
                      </Button>
                    </p>
                    <p><strong>Banco:</strong> {SUBSCRIPTION_PIX.holderName} · {SUBSCRIPTION_PIX.bank}</p>
                  </div>
                  <div className="space-y-1">
                    <p><strong>Envie o comprovante para:</strong></p>
                    <a href={`mailto:${SUBSCRIPTION_PIX.receiptEmail}?subject=Comprovante%20PIX%20-%20Mensalidade`} className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
                      <Mail className="h-4 w-4" />
                      {SUBSCRIPTION_PIX.receiptEmail}
                    </a>
                    <p className="text-xs text-muted-foreground">Informe o nome da igreja no PIX antes de pagar.</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">50 primeiras igrejas: R$ {SUBSCRIPTION_PIX.promoPrice}/mês · Demais: R$ {SUBSCRIPTION_PIX.fullPrice}/mês</p>
            </CardContent>
          </Card>
        )}
      </div>

      {orderedWidgets.includes('quick_actions') && (
        <Card className="bg-white dark:bg-card border-primary/10 shadow-lg mt-4 sm:mt-6" data-widget-actions>
          <CardContent className="px-4 py-6 pb-8 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
              {visibleActions.map((action) => (
                <QuickAction key={action.href} icon={action.icon} label={action.label} href={action.href} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuickAction({ icon: Icon, label, href }: { icon?: ElementType | null; label: string; href: string }) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(href);
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center gap-4 p-8 sm:p-6 rounded-2xl bg-white dark:bg-card hover:bg-primary/5 border-2 border-primary/10 hover:border-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-xl group shadow-md cursor-pointer"
    >
      {Icon && (
        <div className="p-4 rounded-xl bg-primary group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
          <Icon className="h-8 w-8 sm:h-6 sm:w-6 text-primary-foreground" />
        </div>
      )}
      <span className="text-base sm:text-sm font-black text-center text-foreground group-hover:text-primary transition-colors">
        {label}
      </span>
    </button>
  );
}
