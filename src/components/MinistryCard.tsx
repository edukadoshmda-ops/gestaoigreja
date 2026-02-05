import {
  Users, Heart, User, Zap, Star, Baby, HandHelping,
  Music, Palette, Video, Globe, Church
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ministry } from '@/types';

const iconMap: Record<string, React.ElementType> = {
  Users, Heart, User, Zap, Star, Baby, HandHelping, Music, Palette, Video, Globe, Church,
};

interface MinistryCardProps {
  ministry: Ministry;
}

export function MinistryCard({ ministry }: MinistryCardProps) {
  const Icon = iconMap[ministry.icon] || Church;

  return (
    <Card className="hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="rounded-full bg-primary/10 p-3">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <Badge variant="secondary">{ministry.memberCount} membros</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-lg mb-1">{ministry.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{ministry.description}</p>
      </CardContent>
    </Card>
  );
}
