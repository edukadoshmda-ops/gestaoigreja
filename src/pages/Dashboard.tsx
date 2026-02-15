import { useState, useEffect } from 'react';
import { Users, Church, Calendar, TrendingUp, Loader2, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sidebar } from '@/components/Sidebar';
import { DailyVerse } from '@/components/DailyVerse';
import { BirthdayCard } from '@/components/BirthdayCard';
import { ministriesService } from '@/services/ministries.service';
import { cellsService } from '@/services/cells.service';
import { useAuth } from '@/contexts/AuthContext';
import { membersService } from '@/services/members.service';

export default function Dashboard() {
  const { user } = useAuth();
  const [counts, setCounts] = useState({ ministries: 0, cells: 0, members: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [ministries, cells, members] = await Promise.all([
          ministriesService.getActive(),
          cellsService.getActive(),
          membersService.getAll()
        ]);
        setCounts({
          ministries: ministries?.length || 0,
          cells: cells?.length || 0,
          members: members?.length || 0
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const stats = [
    { label: 'Total de Membros', value: loading ? '...' : counts.members.toString(), icon: Users, color: 'text-primary' },
    { label: 'Ministérios Ativos', value: loading ? '...' : counts.ministries.toString(), icon: Church, color: 'text-primary' },
    { label: 'Células', value: loading ? '...' : counts.cells.toString(), icon: Calendar, color: 'text-primary' },
    { label: 'Crescimento', value: 'Sustentável', icon: TrendingUp, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Olá, {user?.name ? user.name.split(' ')[0] : 'Bem-vindo'}!</h1>
          <p className="text-muted-foreground">Bem-vindo ao painel de gestão</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-white border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className="p-2 rounded-lg bg-white border border-primary/20 shadow-sm">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {loading && stat.label !== 'Crescimento' ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <p className="text-3xl font-black text-primary">{stat.value}</p>
              )}
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
      {user?.role !== 'aluno' && user?.role !== 'membro' && user?.role !== 'congregado' && (
        <Card className="bg-white border-primary/10 shadow-lg mt-4 sm:mt-6">
          <CardHeader className="px-5 py-4 sm:px-6">
            <CardTitle className="text-xl sm:text-2xl font-black text-primary">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-8 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
              {user?.role !== 'tesoureiro' && (
                <QuickAction icon={Users} label="Novo Membro" href="/membros" />
              )}
              <QuickAction icon={Church} label="Ministérios" href="/ministerios" />
              {user?.role !== 'tesoureiro' && (
                <QuickAction icon={Calendar} label="Relatório Célula" href="/celulas" />
              )}
              <QuickAction icon={TrendingUp} label="Financeiro" href="/relatorios" />
              <QuickAction
                icon={MessageSquare}
                label="WhatsApp"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.open('https://web.whatsapp.com/', '_blank');
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function QuickAction({ icon: Icon, label, href, onClick }: { icon: React.ElementType; label: string; href: string; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="flex flex-col items-center gap-4 p-8 sm:p-6 rounded-2xl bg-white hover:bg-primary/5 border-2 border-primary/10 hover:border-primary/40 transition-all duration-300 hover:scale-105 hover:shadow-xl group shadow-md"
    >
      <div className="p-4 rounded-xl bg-primary group-hover:scale-110 transition-transform shadow-lg shadow-primary/20">
        <Icon className="h-8 w-8 sm:h-6 sm:w-6 text-primary-foreground" />
      </div>
      <span className="text-base sm:text-sm font-black text-center text-foreground group-hover:text-primary transition-colors">{label}</span>
    </a>
  );
}
