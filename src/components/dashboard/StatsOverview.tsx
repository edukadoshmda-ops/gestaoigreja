import { useState, useEffect } from 'react';
import { Users, MapPin, Calendar, UserPlus, TrendingUp, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { membersService } from '@/services/members.service';
import { cellsService } from '@/services/cells.service';
import { eventsService } from '@/services/events.service';

interface StatsData {
  totalMembers: number;
  totalCells: number;
  upcomingEvents: number;
  newConverts: number;
  loading: boolean;
}

export function StatsOverview() {
  const { churchId, user } = useAuth();
  const effectiveChurchId = churchId ?? user?.churchId;
  const [stats, setStats] = useState<StatsData>({
    totalMembers: 0,
    totalCells: 0,
    upcomingEvents: 0,
    newConverts: 0,
    loading: true,
  });

  useEffect(() => {
    async function loadStats() {
      if (!effectiveChurchId) {
        setStats((s) => ({ ...s, loading: false }));
        return;
      }

      try {
        const [members, cells, events] = await Promise.all([
          membersService.getAll(effectiveChurchId),
          cellsService.getAll(effectiveChurchId),
          eventsService.getAll(effectiveChurchId),
        ]);

        const today = new Date();
        const upcoming = (events || []).filter((e: any) => {
          if (!e.date && !e.event_date) return false;
          const eventDate = new Date(e.date || e.event_date);
          return eventDate >= today;
        });

        const visitantes = (members || []).filter((m: any) => m.status === 'visitante');

        setStats({
          totalMembers: members?.length || 0,
          totalCells: cells?.length || 0,
          upcomingEvents: upcoming.length,
          newConverts: visitantes.length,
          loading: false,
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        setStats((s) => ({ ...s, loading: false }));
      }
    }

    loadStats();
  }, [effectiveChurchId]);

  const statCards = [
    {
      icon: Users,
      label: 'Total de Membros',
      value: stats.totalMembers,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50 dark:bg-blue-950/60',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: MapPin,
      label: 'Células Ativas',
      value: stats.totalCells,
      color: 'bg-green-500',
      lightColor: 'bg-green-50 dark:bg-green-950/60',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      icon: Calendar,
      label: 'Eventos Próximos',
      value: stats.upcomingEvents,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50 dark:bg-purple-950/60',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      icon: UserPlus,
      label: 'Novos Convertidos',
      value: stats.newConverts,
      color: 'bg-orange-500',
      lightColor: 'bg-orange-50 dark:bg-orange-950/60',
      textColor: 'text-orange-600 dark:text-orange-400',
    },
  ];

  if (stats.loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-card border-primary/10">
            <CardContent className="p-6 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => (
        <Card
          key={stat.label}
          className="bg-card border-primary/10 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
              <div className={`${stat.lightColor} p-3 rounded-xl`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
