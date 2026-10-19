import { useState, useEffect } from 'react';
import { UserPlus, ChevronRight, Loader2, Phone, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { membersService } from '@/services/members.service';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Convert {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  status: string;
}

export function RecentConverts() {
  const navigate = useNavigate();
  const { churchId, user } = useAuth();
  const effectiveChurchId = churchId ?? user?.churchId;
  const [converts, setConverts] = useState<Convert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConverts() {
      if (!effectiveChurchId) {
        setLoading(false);
        return;
      }

      try {
        const data = await membersService.getAll(effectiveChurchId);
        const visitantes = (data || [])
          .filter((m: any) => m.status === 'visitante')
          .sort((a: any, b: any) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
          })
          .slice(0, 5)
          .map((m: any) => ({
            id: m.id,
            name: m.name || 'Sem Nome',
            phone: m.phone || '',
            createdAt: m.created_at,
            status: m.status,
          }));

        setConverts(visitantes);
      } catch (error) {
        console.error('Erro ao carregar convertidos:', error);
      } finally {
        setLoading(false);
      }
    }

    loadConverts();
  }, [effectiveChurchId]);

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yy', { locale: ptBR });
    } catch {
      return '--/--';
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

  if (converts.length === 0) {
    return (
      <Card className="bg-card border-primary/10 h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Novos Convertidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum convertido registrado</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate('/consolidacao')}
              className="mt-2"
            >
              Cadastrar convertido
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
            <UserPlus className="h-5 w-5 text-primary" />
            Novos Convertidos
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/consolidacao')}
            className="h-8 gap-1 text-primary"
          >
            Ver todos
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {converts.map((convert) => (
          <div
            key={convert.id}
            onClick={() => navigate('/consolidacao')}
            className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-primary/5 cursor-pointer transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center shrink-0">
              <UserPlus className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                  {convert.name}
                </p>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Novo
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {convert.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {convert.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(convert.createdAt)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
