import {
  Users, Heart, User, Zap, Star, Baby, HandHelping,
  Music, Palette, Video, Globe, Church, Trash2, UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ministry } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const iconMap: Record<string, React.ElementType> = {
  Users, Heart, User, Zap, Star, Baby, HandHelping, Music, Palette, Video, Globe, Church, UserPlus
};

interface MinistryCardProps {
  ministry: Ministry;
  onDelete?: (id: string) => void;
  onAddMember?: (ministry: Ministry) => void;
}

export function MinistryCard({ ministry, onDelete, onAddMember }: MinistryCardProps) {
  const Icon = iconMap[ministry.icon] || Church;
  const { user } = useAuth();
  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'secretario' || user?.role === 'pastor' || user?.role === 'lider_ministerio';

  return (
    <Card
      className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group border-primary/10 overflow-hidden bg-card"
      onClick={() => onAddMember && onAddMember(ministry)}
    >
      <div className="h-1.5 bg-primary" />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="rounded-xl bg-primary/10 p-2.5 group-hover:bg-primary/20 transition-colors">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex gap-1">
            {isAdmin && onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-all rounded-full"
                title="Excluir Ministério"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Deseja realmente excluir o ministério ${ministry.name}?`)) {
                    onDelete(ministry.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{ministry.name}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4">{ministry.description || "Nenhuma descrição informada."}</p>

        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4 text-primary/60" />
              <span className="font-medium truncate max-w-[120px]">{ministry.leader}</span>
            </div>
            <div className="flex items-center gap-1 font-bold text-primary bg-primary/5 px-2 py-1 rounded-md">
              <Users className="h-3.5 w-3.5" />
              {ministry.memberCount}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Engajamento</span>
              <span>85%</span>
            </div>
            <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[85%] rounded-full" />
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs font-semibold group-hover:bg-primary group-hover:text-white transition-all border-primary/20"
          >
            Gerenciar Ministério
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
