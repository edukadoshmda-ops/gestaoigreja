import { useState, useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { membersService } from '@/services/members.service';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function GrowthChart() {
  const { churchId, user } = useAuth();
  const effectiveChurchId = churchId ?? user?.churchId;
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!effectiveChurchId) {
        setLoading(false);
        return;
      }

      try {
        const members = await membersService.getAll(effectiveChurchId);
        const last6Months = Array.from({ length: 6 }).map((_, i) => {
          const date = subMonths(new Date(), 5 - i);
          return {
            month: format(date, 'MMM', { locale: ptBR }),
            fullName: format(date, 'MMMM', { locale: ptBR }),
            start: startOfMonth(date),
            end: endOfMonth(date),
            count: 0
          };
        });

        // Group members by month
        (members || []).forEach((m: any) => {
          const createdAt = new Date(m.created_at || m.createdAt);
          last6Months.forEach(monthRange => {
            if (isWithinInterval(createdAt, { start: monthRange.start, end: monthRange.end })) {
              monthRange.count++;
            }
          });
        });

        // Calculate cumulative growth
        let cumulative = 0;
        const chartData = last6Months.map(m => {
          cumulative += m.count;
          return {
            name: m.month,
            label: m.fullName,
            membros: cumulative,
            novos: m.count
          };
        });

        setData(chartData);
      } catch (error) {
        console.error('Error loading growth data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [effectiveChurchId]);

  if (loading) {
    return (
      <Card className="bg-card border-primary/10 h-[350px]">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-primary/10 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Crescimento da Igreja
        </CardTitle>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Total</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-400" />
            <span>Novos</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorMembros" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorNovos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid hsl(var(--border))',
                  backgroundColor: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="membros" 
                stroke="#2563eb" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorMembros)" 
              />
              <Area 
                type="monotone" 
                dataKey="novos" 
                stroke="#f97316" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorNovos)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
