import { useState } from 'react';
import { MapPin, Users, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sidebar } from '@/components/Sidebar';
import { useToast } from '@/hooks/use-toast';

interface Cell {
  id: string;
  name: string;
  leader: string;
  address: string;
  meetingDay: string;
  memberCount: number;
}

const mockCells: Cell[] = [
  { id: '1', name: 'Célula Família', leader: 'João Silva', address: 'Rua das Flores, 123', meetingDay: 'Quarta-feira', memberCount: 12 },
  { id: '2', name: 'Célula Jovens', leader: 'Maria Santos', address: 'Av. Brasil, 456', meetingDay: 'Sexta-feira', memberCount: 15 },
  { id: '3', name: 'Célula Centro', leader: 'Carlos Lima', address: 'Rua São Paulo, 789', meetingDay: 'Terça-feira', memberCount: 8 },
];

export default function Cells() {
  const [cells] = useState<Cell[]>(mockCells);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const { toast } = useToast();

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setReportOpen(false);
    setSelectedCell(null);
    toast({
      title: 'Relatório enviado!',
      description: 'O relatório da célula foi registrado com sucesso.',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Células</h1>
        <p className="text-muted-foreground">
          Gerencie as células e seus relatórios
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cells.map((cell) => (
          <Card key={cell.id} className="hover:shadow-lg transition-shadow border-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{cell.name}</span>
                <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {cell.memberCount}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>Líder: {cell.leader}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{cell.address}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{cell.meetingDay}</span>
              </div>
              <Dialog open={reportOpen && selectedCell?.id === cell.id} onOpenChange={(open) => {
                setReportOpen(open);
                if (!open) setSelectedCell(null);
              }}>
                <DialogTrigger asChild>
                  <Button
                    className="w-full mt-2"
                    variant="outline"
                    onClick={() => setSelectedCell(cell)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Novo Relatório
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <form onSubmit={handleSubmitReport}>
                    <DialogHeader>
                      <DialogTitle>Relatório de Reunião</DialogTitle>
                      <DialogDescription>
                        Registre os detalhes da reunião da célula
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">Data da Reunião</Label>
                        <Input id="date" type="date" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="members">Membros Presentes</Label>
                          <Input id="members" type="number" min="0" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="visitors">Visitantes</Label>
                          <Input id="visitors" type="number" min="0" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="study">Tema do Estudo</Label>
                        <Input id="study" placeholder="Ex: O Sermão do Monte" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Observações</Label>
                        <Textarea id="notes" placeholder="Notas adicionais sobre a reuniã..." />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setReportOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit">Enviar Relatório</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
