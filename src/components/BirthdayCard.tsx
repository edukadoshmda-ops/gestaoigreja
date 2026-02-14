import { useState, useEffect } from 'react';
import { Cake, PartyPopper, MessageSquare, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { membersService } from '@/services/members.service';
import { Button } from '@/components/ui/button';

export function BirthdayCard() {
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBirthdays() {
      try {
        const data = await membersService.getAll();
        const today = new Date();
        const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const filtered = (data || []).filter((m: any) => {
          if (!m.birth_date) return false;
          return m.birth_date.includes(todayStr);
        });

        setBirthdays(filtered);
      } catch (error) {
        console.error('Erro ao carregar aniversariantes:', error);
      } finally {
        setLoading(false);
      }
    }
    loadBirthdays();
  }, []);

  if (loading) {
    return (
      <Card className="bg-white border-primary/10 shadow-lg h-full">
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (birthdays.length === 0) {
    return (
      <Card className="bg-white border-primary/10 shadow-lg h-full">
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
    <Card className="bg-white border-primary/20 shadow-lg border-l-4 border-l-primary animate-in fade-in slide-in-from-bottom-2 duration-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PartyPopper className="h-5 w-5 text-primary animate-bounce" />
            Aniversariantes do Dia
          </div>
          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Destaque</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {birthdays.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-2 bg-primary/5 p-3 rounded-xl border border-primary/10 hover:border-primary/30 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
                  <Cake className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground">{member.name}</p>
                  <p className="text-[10px] text-muted-foreground">Celebrando hoje! 🎉</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-green-600 hover:bg-green-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                title="Enviar Parabéns personalizado"
                onClick={() => {
                  const text = `Olá ${member.name.split(' ')[0]}, Graça e Paz! Passando para te desejar um feliz aniversário! 🎉 Que o Senhor te abençoe ricamente neste novo ano de vida, com muita saúde, paz e alegria no Espírito Santo. Parabéns!`;
                  const cleanPhone = (member.phone || '').replace(/\D/g, '');
                  const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                  window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(text)}`, '_blank');
                }}
              >
                <MessageSquare className="h-5 w-5" />
              </Button>
            </div>
          ))}
          <p className="text-xs text-primary font-semibold mt-4 text-center italic">
            "Este é o dia que o Senhor fez; regozijemo-nos e alegremo-nos nele."
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
