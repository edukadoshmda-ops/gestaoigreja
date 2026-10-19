import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, ChevronRight, Loader2, CalendarDays } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { eventsService } from '@/services/events.service';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Event {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description?: string;
}

export function UpcomingEvents() {
  const navigate = useNavigate();
  const { churchId, user } = useAuth();
  const effectiveChurchId = churchId ?? user?.churchId;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      if (!effectiveChurchId) {
        setLoading(false);
        return;
      }

      try {
        const data = await eventsService.getAll(effectiveChurchId);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = (data || [])
          .filter((e: any) => {
            const eventDate = new Date(e.date || e.event_date);
            return eventDate >= today;
          })
          .sort((a: any, b: any) => {
            return new Date(a.date || a.event_date).getTime() - new Date(b.date || b.event_date).getTime();
          })
          .slice(0, 5)
          .map((e: any) => ({
            id: e.id,
            title: e.title || e.name || 'Evento',
            date: e.date || e.event_date,
            time: e.time || e.event_time,
            location: e.location,
            description: e.description,
          }));

        setEvents(upcoming);
      } catch (error) {
        console.error('Erro ao carregar eventos:', error);
      } finally {
        setLoading(false);
      }
    }

    loadEvents();
  }, [effectiveChurchId]);

  const formatEventDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return {
        day: format(date, 'dd', { locale: ptBR }),
        month: format(date, 'MMM', { locale: ptBR }),
        weekday: format(date, 'EEE', { locale: ptBR }),
      };
    } catch {
      return { day: '--', month: '---', weekday: '---' };
    }
  };

  if (loading) {
    return (
      <Card className="bg-card border-primary/10 h-full">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="bg-card border-primary/10 h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Próximos Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum evento próximo</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate('/eventos')}
              className="mt-2"
            >
              Criar evento
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-primary/10 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Próximos Eventos
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/eventos')}
            className="h-8 gap-1 text-primary"
          >
            Ver todos
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event) => {
          const dateInfo = formatEventDate(event.date);
          return (
            <div
              key={event.id}
              onClick={() => navigate('/eventos')}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-primary/5 cursor-pointer transition-colors group"
            >
              <div className="flex flex-col items-center justify-center w-14 h-14 bg-primary/10 rounded-xl shrink-0">
                <span className="text-xs font-medium text-primary uppercase">{dateInfo.month}</span>
                <span className="text-xl font-bold text-foreground">{dateInfo.day}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                  {event.title}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  {event.time && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {event.time}
                    </span>
                  )}
                  {event.location && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3" />
                      {event.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
