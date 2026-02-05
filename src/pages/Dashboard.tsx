import { Users, Church, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar } from '@/components/Sidebar';
import { DailyVerse } from '@/components/DailyVerse';
import { BirthdayCard } from '@/components/BirthdayCard';
import { SocialLinks } from '@/components/SocialLinks';
import { mockMembers, mockMinistries } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';

const stats = [
  { label: 'Total de Membros', value: mockMembers.length.toString(), icon: Users, color: 'text-primary' },
  { label: 'Ministérios Ativos', value: mockMinistries.length.toString(), icon: Church, color: 'text-primary' },
  { label: 'Células', value: '12', icon: Calendar, color: 'text-primary' },
  { label: 'Crescimento', value: '+15%', icon: TrendingUp, color: 'text-primary' },
];

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Olá, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground">Bem-vindo ao painel de gestão</p>
        </div>
        <SocialLinks />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Verse and Birthdays */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <DailyVerse />
        <BirthdayCard />
      </div>

      {/* Quick Actions */}
      <Card className="border-primary/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <QuickAction icon={Users} label="Novo Membro" href="/membros" />
            <QuickAction icon={Church} label="Ministérios" href="/ministerios" />
            <QuickAction icon={Calendar} label="Relatório Célula" href="/celulas" />
            <QuickAction icon={TrendingUp} label="Financeiro" href="/relatorios" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAction({ icon: Icon, label, href }: { icon: React.ElementType; label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center gap-3 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 border border-primary/10 hover:border-primary/30 transition-all duration-300 hover:scale-105 hover:shadow-lg group"
    >
      <div className="p-3 rounded-lg bg-gradient-to-br from-primary to-secondary group-hover:scale-110 transition-transform">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <span className="text-sm font-semibold text-center">{label}</span>
    </a>
  );
}
