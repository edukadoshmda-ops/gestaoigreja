import { BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getDailyVerse } from '@/data/mockData';

export function DailyVerse() {
  const verse = getDailyVerse();

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/20 p-2">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">Versículo do Dia</p>
            <p className="text-foreground italic">"{verse.text}"</p>
            <p className="text-sm font-semibold text-primary mt-2">{verse.reference}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
