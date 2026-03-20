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
          <Card className="xl:col-span-2 border-primary/30 bg-primary/5 shadow-lg overflow-hidden" data-widget-pix-mensalidade>
            <CardContent className="p-0">
              <div className="bg-primary/10 px-6 py-4 border-b border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-primary" />
                  <h3 className="font-bold text-lg">Pagamento via PIX (mensalidades)</h3>
                </div>
                <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                  Assinatura Ativa
                </Badge>
              </div>

              <div className="p-6">
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Instructions & Bank Data */}
                  <div className="lg:col-span-3 space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-bold text-sm flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Dados para Depósito/PIX
                        </h4>
                        <div className="space-y-2 p-4 rounded-xl bg-white dark:bg-card border border-primary/5 shadow-sm text-sm">
                          <p className="flex justify-between items-center group">
                            <span className="text-muted-foreground">Chave PIX (CNPJ):</span>
                            <span className="font-bold flex items-center gap-2">
                              {SUBSCRIPTION_PIX.cnpj}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  navigator.clipboard?.writeText(SUBSCRIPTION_PIX.pixKey);
                                  toast({ title: 'Chave copiada!', duration: 2000 });
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-muted-foreground">Titular:</span>
                            <span className="font-bold">{SUBSCRIPTION_PIX.holderName}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-muted-foreground">Banco:</span>
                            <span className="font-bold">{SUBSCRIPTION_PIX.bankId} {SUBSCRIPTION_PIX.bank}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-muted-foreground">Agência / Conta:</span>
                            <span className="font-bold">{SUBSCRIPTION_PIX.agency} / {SUBSCRIPTION_PIX.account}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-muted-foreground">CNPJ:</span>
                            <span className="font-bold">{SUBSCRIPTION_PIX.cnpj}</span>
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-bold text-sm flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          Instruções
                        </h4>
                        <div className="space-y-3 text-sm text-muted-foreground">
                          <div className="flex gap-3">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">1</span>
                            <p>Informe o <strong>nome da igreja</strong> no campo de mensagem do PIX.</p>
                          </div>
                          <div className="flex gap-3">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">2</span>
                            <p>Envie o comprovante para <a href={`mailto:${SUBSCRIPTION_PIX.receiptEmail}`} className="text-primary font-bold hover:underline">{SUBSCRIPTION_PIX.receiptEmail}</a>.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button className="flex-1 gap-2 shadow-lg shadow-primary/20 h-11" onClick={() => navigate('/caixa-diario')}>
                        <DollarSign className="h-4 w-4" />
                        Registrar pagamento
                      </Button>
                      <Button variant="outline" className="flex-1 gap-2 h-11" onClick={() => window.open(`https://wa.me/5591993837093?text=Olá,%20gostaria%20de%20enviar%20o%20comprovante%20da%20mensalidade%20do%20app`, '_blank')}>
                        Falar com suporte
                      </Button>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-center text-muted-foreground mt-8 border-t border-primary/10 pt-4 italic">
                  Promoção ativa: Primeiras {SUBSCRIPTION_PIX.promoSlots} igrejas pagam R$ {SUBSCRIPTION_PIX.promoPrice},00/mês vitalício. Demais igrejas R$ {SUBSCRIPTION_PIX.fullPrice},00/mês.
                </p>
              </div>
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
        <div className="p-4 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
          <Icon className="h-8 w-8 sm:h-6 sm:w-6 text-primary" />
        </div>
      )}
      <span className="text-base sm:text-sm font-black text-center text-primary transition-colors">
        {label}
      </span>
    </button>
  );
}
