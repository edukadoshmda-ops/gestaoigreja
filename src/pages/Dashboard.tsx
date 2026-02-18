import type { ElementType } from 'react';
import type { UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';
import {
  Church,
  MapPin,
  Heart,
  FileText,
  BarChart3,
  Upload,
  DollarSign,
  Calendar,
  HandHeart,
  QrCode,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DailyVerse } from '@/components/DailyVerse';
import { BirthdayCard } from '@/components/BirthdayCard';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface QuickActionDef {
  icon: ElementType;
  label: string;
  href: string;
  roles: UserRole[];
}

const quickActionsList: QuickActionDef[] = [
  { icon: Church, label: 'Ministérios', href: '/ministerios', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
  { icon: MapPin, label: 'Células', href: '/celulas', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
  { icon: Heart, label: 'Discipulado', href: '/discipulado', roles: ['admin', 'pastor', 'secretario', 'lider_celula', 'superadmin'] },
  { icon: FileText, label: 'Secretaria', href: '/secretaria', roles: ['admin', 'pastor', 'secretario', 'superadmin'] },
  { icon: BarChart3, label: 'Relatórios', href: '/relatorios', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'lider_celula', 'lider_ministerio', 'superadmin'] },
  { icon: Upload, label: 'Uploads e Atas', href: '/uploads', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
  { icon: DollarSign, label: 'Caixa Diário', href: '/caixa-diario', roles: ['admin', 'pastor', 'tesoureiro', 'superadmin'] },
  { icon: Calendar, label: 'Eventos', href: '/eventos', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
  { icon: HandHeart, label: 'Solicitações de Oração', href: '/solicitacoes-oracao', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
  { icon: QrCode, label: 'PIX e QR Code', href: '/pix-donacoes', roles: ['admin', 'pastor', 'secretario', 'tesoureiro', 'membro', 'lider_celula', 'lider_ministerio', 'aluno', 'congregado', 'superadmin'] },
];

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const visibleActions = quickActionsList.filter((a) => user && a.roles.includes(user.role));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Olá, {user?.name ? user.name.split(' ')[0] : 'Bem-vindo'}!</h1>
          <p className="text-muted-foreground">Bem-vindo ao painel de gestão</p>
        </div>
      </div>

      {/* Verse and Birthdays */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DailyVerse />
        <BirthdayCard />
      </div>

      <Card className="bg-white border-primary/10 shadow-lg mt-4 sm:mt-6">
        <CardContent className="px-4 py-6 pb-8 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6">
            {visibleActions.map((action) => (
              <QuickAction key={action.href} icon={action.icon} label={action.label} href={action.href} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAction({ icon: Icon, label, href }: { icon: ElementType; label: string; href: string }) {
  const navigate = useNavigate();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(href);
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center gap-4 p-8 sm:p-6 rounded-2xl bg-white hover:bg-primary/5 border-2 border-primary/10 hover:border-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-xl group shadow-md cursor-pointer"
    >
      <div className="p-4 rounded-xl bg-primary group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
        <Icon className="h-8 w-8 sm:h-6 sm:w-6 text-primary-foreground" />
      </div>
      <span className="text-base sm:text-sm font-black text-center text-foreground group-hover:text-primary transition-colors">{label}</span>
    </button>
  );
}
