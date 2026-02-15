import { useState, useEffect } from 'react';
import { MapPin, Users, Calendar, FileText, Plus, Trash2, Loader2, UserPlus, Info, Home, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cellsService } from '@/services/cells.service';
import { membersService } from '@/services/members.service';
import { Member } from '@/types';

interface Cell {
  id: string;
  name: string;
  leader: string;
  host: string;
  address: string;
  meetingDay: string;
  memberCount: number;
}

export default function Cells() {
  const [cells, setCells] = useState<Cell[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [newCell, setNewCell] = useState({
    name: '',
    address: '',
    meetingDay: '',
    leaderId: '',
    hostId: ''
  });

  const { toast } = useToast();
  const { user } = useAuth();

  const canReport = user?.role === 'superadmin' || (user?.role !== 'aluno' && user?.role !== 'membro' && user?.role !== 'congregado' && user?.role !== 'tesoureiro');
  const isAdmin = user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'secretario' || user?.role === 'pastor' || user?.role === 'lider_celula';

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [cellsData, membersData] = await Promise.all([
        cellsService.getActive(),
        membersService.getAll()
      ]);

      const mappedCells = await Promise.all((cellsData || []).map(async (c: any) => {
        const count = await cellsService.getMemberCount(c.id);
        return {
          id: c.id,
          name: c.name,
          leader: c.leader?.name || 'Sem líder',
          host: c.host?.name || 'Sem anfitrião',
          address: c.address || 'Sem endereço',
          meetingDay: c.meeting_day || 'A definir',
          memberCount: count,
        };
      }));

      setCells(mappedCells);
      setMembers(membersData as any || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as informações.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleCreateCell = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user?.churchId) throw new Error('Igreja não identificada.');

      await cellsService.create({
        name: newCell.name,
        address: newCell.address,
        meeting_day: newCell.meetingDay,
        leader_id: newCell.leaderId || null,
        host_id: newCell.hostId || null,
        active: true,
      }, user.churchId);
      setCreateOpen(false);
      setNewCell({ name: '', address: '', meetingDay: '', leaderId: '', hostId: '' });
      loadData();
      toast({ title: 'Célula criada!', description: 'A nova célula foi cadastrada com sucesso.' });
    } catch (error: any) {
      toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteCell = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir a célula ${name}?`)) return;
    try {
      await cellsService.delete(id);
      loadData();
      toast({ title: 'Célula excluída', description: 'O registro foi removido com sucesso.' });
    } catch (error) {
      toast({ title: 'Erro ao excluir', description: 'Não foi possível remover a célula.', variant: 'destructive' });
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);

    try {
      if (!user?.churchId || !selectedCell) throw new Error('Informações incompletas.');

      const reportData = {
        cell_id: selectedCell.id,
        date: formData.get('date'),
        members_present: attendance.length,
        visitors: Number(formData.get('visitors')),
        study_topic: formData.get('study'),
        notes: `Chamada: ${attendance.length} presentes. \nObservações: ${formData.get('notes')}`
      };

      await cellsService.createReport(reportData, user.churchId);

      setReportOpen(false);
      setSelectedCell(null);
      setAttendance([]);

      toast({ title: 'Relatório enviado!', description: 'O relatório foi registrado com sucesso.' });
    } catch (error: any) {
      toast({ title: 'Erro ao enviar', description: error.message, variant: 'destructive' });
    }
  };

  const [attendance, setAttendance] = useState<string[]>([]);
  const [membersInCell, setMembersInCell] = useState<any[]>([]);

  useEffect(() => {
    if (reportOpen && selectedCell) {
      cellsService.getMembers(selectedCell.id).then(setMembersInCell);
    }
  }, [reportOpen, selectedCell]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Premium */}
      <div className="bg-white p-8 rounded-3xl border border-primary/20 overflow-hidden relative group shadow-sm">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl transition-colors duration-500" />
        <div className="relative">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary">Multiplicação & Células</h1>
          <p className="text-muted-foreground mt-2 text-lg max-w-2xl">
            Acompanhe o crescimento da igreja através dos pequenos grupos. Gerencie líderes, anfitriões e relatórios de frequência.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-3">
          <div className="bg-white border border-primary/20 p-2 rounded-lg shadow-sm">
            <Home className="h-5 w-5 text-primary" />
          </div>
          <p className="font-semibold text-lg">{cells.length} Células Ativas</p>
        </div>
        {isAdmin && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:shadow-lg transition-all rounded-full h-12 w-12 p-0 sm:w-auto sm:px-4 sm:rounded-xl" title="Nova Célula">
                <Plus className="h-6 w-6 sm:mr-2" />
                <span className="hidden sm:inline">Nova Célula</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-screen h-screen sm:w-[95vw] sm:max-w-md sm:h-auto sm:max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-none sm:rounded-lg">
              <form onSubmit={handleCreateCell}>
                <DialogHeader>
                  <DialogTitle>Cadastrar Nova Célula</DialogTitle>
                  <DialogDescription>Inicie um novo grupo de comunhão</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="cell-name">Nome da Célula</Label>
                    <Input id="cell-name" value={newCell.name} onChange={(e) => setNewCell({ ...newCell, name: e.target.value })} required placeholder="Ex: Célua Peniel" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cell-address">Endereço da Reunião</Label>
                    <Input id="cell-address" value={newCell.address} onChange={(e) => setNewCell({ ...newCell, address: e.target.value })} required placeholder="Rua, Número, Bairro" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cell-day">Dia da Semana</Label>
                    <Input id="cell-day" value={newCell.meetingDay} onChange={(e) => setNewCell({ ...newCell, meetingDay: e.target.value })} placeholder="Ex: Quinta-feira às 20:00" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Líder</Label>
                      <Select value={newCell.leaderId} onValueChange={(v) => setNewCell({ ...newCell, leaderId: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Anfitrião</Label>
                      <Select value={newCell.hostId} onValueChange={(v) => setNewCell({ ...newCell, hostId: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
                  <Button type="submit">Cadastrar Célula</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cells.map((cell) => (
          <Card
            key={cell.id}
            className="hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group border-primary/10 overflow-hidden bg-card"
            onClick={() => {
              setSelectedCell(cell);
              setDetailsOpen(true);
            }}
          >
            <div className="h-1.5 bg-primary" />
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-secondary/10 p-2.5 group-hover:bg-secondary/20 transition-colors">
                  <Home className="h-6 w-6 text-secondary" />
                </div>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-all rounded-full"
                    title="Excluir Célula"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCell(cell.id, cell.name);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{cell.name}</CardTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {cell.address}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary/60" />
                  <span className="font-medium">Líder: {cell.leader}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-primary/60" />
                  <span>{cell.meetingDay}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10 text-primary font-bold">
                  <Users className="h-4 w-4" />
                  {cell.memberCount} membros
                </div>
                {canReport && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs group-hover:bg-primary group-hover:text-white transition-all gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCell(cell);
                      setReportOpen(true);
                    }}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Relatório
                  </Button>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span>Frequência Média</span>
                  <span>92%</span>
                </div>
                <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[92%] rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Relatório de Reunião Dialog */}
      {selectedCell && reportOpen && (
        <Dialog open={reportOpen} onOpenChange={setReportOpen}>
          <DialogContent className="w-screen h-screen sm:w-[95vw] sm:max-w-md sm:h-auto sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-none sm:rounded-lg">
            <form onSubmit={handleSubmitReport}>
              <DialogHeader>
                <DialogTitle>Relatório de Reunião - {selectedCell.name}</DialogTitle>
                <DialogDescription>Digite os números reais da última reunião</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-2">
                  <Label>Data da Reunião</Label>
                  <Input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Chamada (Marque os presentes)
                  </Label>
                  <div className="grid gap-2 border rounded-xl p-3 bg-muted/5 max-h-48 overflow-y-auto">
                    {membersInCell.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhum membro vinculado a esta célula.</p>
                    ) : (
                      membersInCell.map((m: any) => (
                        <div key={m.member?.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/10">
                          <input
                            type="checkbox"
                            id={`m-${m.member?.id}`}
                            className="w-4 h-4 rounded border-primary/30 text-primary focus:ring-primary"
                            checked={attendance.includes(m.member?.id)}
                            onChange={(e) => {
                              if (e.target.checked) setAttendance([...attendance, m.member?.id]);
                              else setAttendance(attendance.filter(id => id !== m.member?.id));
                            }}
                          />
                          <label htmlFor={`m-${m.member?.id}`} className="text-sm font-medium cursor-pointer flex-1">
                            {m.member?.name}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Membros Presentes</Label>
                    <Input name="members" type="number" min="0" value={attendance.length} readOnly className="bg-muted" />
                    <p className="text-[10px] text-muted-foreground">Calculado automaticamente pela chamada</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Visitantes</Label>
                    <Input name="visitors" type="number" min="0" required placeholder="0" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tema Estudado</Label>
                  <Input name="study" placeholder="Ex: Santidade ao Senhor" required />
                </div>
                <div className="space-y-2">
                  <Label>Observações / Pedidos de Oração</Label>
                  <Textarea name="notes" placeholder="Algum evento especial ou testemunho?" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setReportOpen(false)}>Cancelar</Button>
                <Button type="submit">Enviar Dados</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Detalhes da Célula e Gestão de Membros */}
      {selectedCell && detailsOpen && (
        <CellDetailsDialog
          open={detailsOpen}
          onOpenChange={(v) => {
            setDetailsOpen(v);
            if (!v) setSelectedCell(null);
          }}
          cell={selectedCell}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}

function CellDetailsDialog({ open, onOpenChange, cell, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cell: Cell;
  onSuccess: () => void;
}) {
  const [members, setMembers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) loadDetails();
  }, [open, cell.id]);

  async function loadDetails() {
    try {
      setLoading(true);
      const [cellMembers, membersList, allReports] = await Promise.all([
        cellsService.getMembers(cell.id),
        membersService.getAll(),
        cellsService.getAllReports()
      ]);
      setMembers(cellMembers || []);
      setAllMembers(membersList as any || []);
      setReports((allReports || []).filter((r: any) => r.cell_id === cell.id));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddPerson = async (memberId: string) => {
    try {
      setAddingMember(true);
      await cellsService.addMember(cell.id, memberId);
      toast({ title: 'Sucesso', description: 'Membro adicionado à célula.' });
      loadDetails();
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemovePerson = async (memberId: string) => {
    if (!confirm('Deseja remover este membro da célula?')) return;
    try {
      await cellsService.removeMember(cell.id, memberId);
      toast({ title: 'Removido', description: 'Membro removido da célula.' });
      loadDetails();
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen sm:w-[95vw] sm:max-w-2xl sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 rounded-none sm:rounded-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-primary">
                {cell.name}
              </DialogTitle>
              <DialogDescription>{cell.address}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          <div className="space-y-4">
            <Label className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Membros Integrados ({members.length})
            </Label>
            <div className="grid gap-2">
              {members.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                  Nenhum membro vinculado a esta célula.
                </p>
              ) : (
                members.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary">
                        {m.member?.name?.[0]}
                      </div>
                      <div>
                        <p className="font-bold">{m.member?.name}</p>
                        <p className="text-xs text-muted-foreground">{m.member?.phone || 'Sem telefone'}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemovePerson(m.member_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Histórico de Relatórios
            </Label>
            <div className="space-y-3">
              {reports.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground text-sm">Nenhum relatório enviado ainda.</p>
              ) : (
                reports.map((r: any) => (
                  <div key={r.id} className="p-4 rounded-xl bg-muted/30 border text-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold">{new Date(r.date).toLocaleDateString('pt-BR')}</span>
                      <Badge variant="secondary">{r.members_present} Membros | {r.visitors} Visitantes</Badge>
                    </div>
                    <p className="font-medium text-primary">Tema: {r.study_topic}</p>
                    {r.notes && <p className="text-xs text-muted-foreground line-clamp-2">{r.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label className="text-lg font-bold">Adicionar Novo Membro</Label>
            <Select onValueChange={handleAddPerson} disabled={addingMember}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Busque por nome ou e-mail..." />
              </SelectTrigger>
              <SelectContent>
                {allMembers
                  .filter(am => !members.some(m => m.member_id === am.id))
                  .map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground italic">* O membro selecionado passará a fazer parte das estatísticas de frequência desta célula.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Fechar Detalhes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
