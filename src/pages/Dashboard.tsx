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
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { UpcomingEvents } from '@/components/dashboard/UpcomingEvents';
import { RecentConverts } from '@/components/dashboard/RecentConverts';
import { FinanceSummary } from '@/components/dashboard/FinanceSummary';
import { GrowthChart } from '@/components/dashboard/GrowthChart';
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
import { SystemStatusBanner } from '@/components/SystemStatusBanner';

interface QuickActionDef {
  icon?: ElementType | null;
  label: string;
  href: string;
  roles: UserRole[];
  color: string;
}

const quickActionsList: QuickActionDef[] = [
  { icon: Users, label: 'Ministérios', href: '/ministerios', roles: ['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio'], color: '#8B5CF6' },
  { icon: MapPin, label: 'Células', href: '/celulas', roles: ['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio'], color: '#F43F5E' },
  { icon: FileText, label: 'Secretaria', href: '/secretaria', roles: ['pastor', 'pastor_admin', 'secretario', 'superadmin'], color: '#2563EB' },
  { icon: BarChart3, label: 'Relatórios', href: '/relatorios', roles: ['admin', 'pastor', 'pastor_admin', 'secretario', 'lider_ministerio', 'superadmin'], color: '#D97706' },
  { icon: Upload, label: 'Uploads e Atas', href: '/uploads', roles: ['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'], color: '#0891B2' },
  { icon: GraduationCap, label: 'Escolas', href: '/escolas', roles: ['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio'], color: '#F97316' },
  { icon: HeartHandshake, label: 'Discipulado', href: '/discipulado', roles: ['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio'], color: '#EC4899' },
  { icon: DollarSign, label: 'Gestão Financeira', href: '/caixa-diario', roles: ['admin', 'pastor', 'pastor_admin', 'secretario', 'tesoureiro', 'superadmin'], color: '#10B981' },
  { icon: Calendar, label: 'Eventos', href: '/eventos', roles: ['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'], color: '#7C3AED' },
  { icon: HandHeart, label: 'Solicitações de Oração', href: '/solicitacoes-oracao', roles: ['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio'], color: '#059669' },
  { icon: CreditCard, label: 'Contas e PIX Igreja', href: '/pix-donacoes', roles: ['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio'], color: '#84CC16' },
  { icon: Landmark, label: 'Página Institucional', href: '/institucional', roles: ['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio'], color: '#475569' },
  { icon: UserRound, label: 'Pastores', href: '/pastores', roles: ['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'], color: '#0EA5E9' },
  { icon: Shield, label: 'Privacidade e LGPD', href: '/privacidade', roles: ['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio'], color: '#DC2626' },
  { icon: Package, label: 'Patrimonial', href: '/patrimonio', roles: ['admin', 'pastor', 'pastor_admin', 'secretario', 'superadmin', 'diretor_patrimonio', 'tesoureiro'], color: '#B45309' },
  { icon: HelpCircle, label: 'Como Acessar', href: '/como-acessar', roles: ['admin', 'pastor', 'pastor_admin', 'secretario', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'tesoureiro', 'superadmin', 'diretor_patrimonio'], color: '#64748B' },
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

  // Filtra ações baseado nas permissões reais de cada role
  const visibleActions = user
    ? quickActionsList.filter((a) => a.roles.includes(user.role))
    : [];

  const orderedWidgets = config.widgetOrder.filter((id) => config.visibleWidgets.includes(id));

  return (
    <div className="space-y-6" data-dashboard-root>
      <SystemStatusBanner />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl font-bold tracking-tight text-foreground">
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

      {/* Estatísticas Gerais - Sempre visíveis */}
      <StatsOverview />

      <div className="grid grid-cols-1 gap-4">
        <GrowthChart />
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
      </div>

      {orderedWidgets.includes('quick_actions') && (
        <Card className="bg-white dark:bg-card border-primary/10 shadow-lg mt-4 sm:mt-6" data-widget-actions>
          <CardContent className="px-4 py-6 pb-8 sm:px-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
              {visibleActions.map((action) => (
                <QuickAction 
                  key={action.href} 
                  icon={action.icon} 
                  label={action.label} 
                  href={action.href} 
                  color={action.color}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Widgets de dados - Sempre visíveis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <UpcomingEvents />
        <RecentConverts />
        {['pastor', 'tesoureiro', 'secretario', 'superadmin'].includes(user?.role ?? '') && (
          <FinanceSummary />
        )}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, href, color }: { icon?: ElementType | null; label: string; href: string; color: string }) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(href);
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center gap-4 p-8 sm:p-6 rounded-2xl bg-white dark:bg-card hover:bg-muted/50 border-2 border-primary/5 hover:border-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-xl group shadow-md cursor-pointer relative overflow-hidden"
    >
      {/* Background Glow Effect on Hover */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none"
        style={{ backgroundColor: color }}
      />

      {Icon && (
        <div 
          className="p-4 rounded-xl transition-all duration-500 shadow-lg group-hover:scale-110 group-hover:rotate-3"
          style={{ 
            backgroundColor: color,
            boxShadow: `0 8px 16px -4px ${color}40`
          }}
        >
          <Icon className="h-8 w-8 sm:h-6 sm:w-6 text-white" />
        </div>
      )}
      <span 
        className="text-base sm:text-sm font-black text-center text-foreground transition-colors duration-300"
        style={{ color: 'inherit' }}
      >
        <span className="group-hover:opacity-80" style={{ color: color }}>
          {label}
        </span>
      </span>
    </button>
  );
}
