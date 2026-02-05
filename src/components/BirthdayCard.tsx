import { Cake, PartyPopper } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTodayBirthdays, mockMembers } from '@/data/mockData';

export function BirthdayCard() {
  const birthdays = getTodayBirthdays(mockMembers);

  if (birthdays.length === 0) {
    return (
      <Card className="border-muted">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Cake className="h-5 w-5 text-primary" />
            Aniversariantes do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Nenhum aniversariante hoje</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-accent to-accent/50 border-primary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <PartyPopper className="h-5 w-5 text-primary" />
          Aniversariantes do Dia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {birthdays.map((member) => (
            <div key={member.id} className="flex items-center gap-2">
              <Cake className="h-4 w-4 text-primary" />
              <span className="font-medium">{member.name}</span>
            </div>
          ))}
          <p className="text-sm text-primary font-medium mt-3">
            🎉 Parabéns! Que Deus abençoe seu novo ano de vida!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
