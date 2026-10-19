import { useState, useEffect } from 'react';
import { Plus, Loader2, Trash2, Save, Users, Calendar, FileText, UserCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Separator } from "@/components/ui/separator";
import { Sidebar } from '@/components/Sidebar';
import { MinistryCard } from '@/components/MinistryCard';
import { AddMemberDialog } from '@/components/AddMemberDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ministriesService } from '@/services/ministries.service';
import { membersService } from '@/services/members.service';
import { Ministry, Member } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePermissions } from '@/hooks/usePermissions';
import { ExcelMinistriesDashboardButton } from '@/components/ExcelMinistriesDashboardButton';
import { parseMinistryReport, formatMinistryReport, getTodayDateString } from '@/utils/ministriesReportHelper';
export default function Ministries() {
  useDocumentTitle('Ministérios');
  const [ministries, setMinistries] = useState<Ministry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newMinistry, setNewMinistry] = useState({ name: '', description: '', leaderId: '' });
  const [members, setMembers] = useState<Member[]>([]);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user, churchId } = useAuth();
  const { canEditMinistries, canDownloadReports } = usePermissions();
  const effectiveChurchId = churchId ?? user?.churchId;
  const canCreate = canEditMinistries;

  useEffect(() => {
    loadMinistries();
    loadMembers();
  }, [effectiveChurchId]);

  async function loadMembers() {
    try {
      const data = await membersService.getAll(effectiveChurchId);
      setMembers(data as any || []);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
    }
  }

  async function loadMinistries() {
    try {
      setError(null);
      setLoading(true);
      const data = await ministriesService.getActive();

      const mappedMinistries = await Promise.all((data || []).map(async (m: any) => {
        const count = await ministriesService.getMemberCount(m.id);
        const rep = parseMinistryReport(m.monthly_activity_report);
        return {
          id: m.id,
          churchId: m.church_id || '',
          name: m.name,
          description: m.description || '',
          leader: m.leader?.name || 'Sem líder',
          icon: m.icon || 'Church',
          memberCount: count,
          meetingsCount: m.meetings_count ?? 0,
          monthlyActivityReport: rep.notes,
          visitorsCount: m.visitors_count ?? rep.visitorsCount,
          membersPresentCount: m.members_present_count ?? rep.membersPresentCount,
          meetingDate: m.meeting_date ?? rep.meetingDate,
        };
      }));

      setMinistries(mappedMinistries);
    } catch (err: any) {
      console.error('Erro ao carregar ministérios:', err);
      setMinistries([]);
      const msg = err?.message || '';
      const isSessionOrPerm = /session|permission|RLS|401|403|PGRST/i.test(msg) || msg.includes('fetch');
      setError(isSessionOrPerm ? 'Sessão expirada ou sem permissão.' : (msg || 'Não foi possível carregar.'));
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os ministérios.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleCreateMinistry = async () => {
    if (!newMinistry.name) return;

    try {
      if (!user?.churchId) throw new Error('Igreja não identificada.');

      await ministriesService.create({
        name: newMinistry.name,
        description: newMinistry.description,
        leader_id: newMinistry.leaderId || null,
        icon: 'Church',
        active: true,
      }, user.churchId);

      setNewMinistry({ name: '', description: '', leaderId: '' });
      setDialogOpen(false);
      loadMinistries();

      toast({
        title: 'Ministério criado!',
        description: `${newMinistry.name} foi adicionado com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao criar',
        description: error.message || 'Ocorreu um problema ao cadastrar o ministério.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMinistry = async (id: string) => {
    try {
      await ministriesService.delete(id);
      loadMinistries();
      toast({
        title: 'Ministério removido',
        description: 'O registro foi excluído com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível remover o ministério.',
        variant: 'destructive',
      });
    }
  };

  if (error && ministries.length === 0 && !loading) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => loadMinistries()}>Tentar novamente</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="bg-card p-8 rounded-3xl border border-primary/20 mb-8 overflow-hidden relative group shadow-sm w-full">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl transition-colors duration-500" />
          <div className="relative">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary">Ministérios</h1>
            <p className="text-muted-foreground mt-2 text-lg max-w-2xl">
              Gerencie a atuação da igreja em diferentes frentes, designando equipes e acompanhando o crescimento de cada departamento.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {canCreate && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:shadow-lg transition-all rounded-full h-12 w-12 p-0 sm:w-auto sm:px-4 sm:rounded-xl" title="Novo Ministério">
                  <Plus className="h-6 w-6 sm:mr-2" />
                  <span className="hidden sm:inline">Novo Ministério</span>
                </Button>
              </DialogTrigger>
            <DialogContent className="w-screen h-screen sm:w-[95vw] sm:max-w-lg sm:h-auto sm:max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-xl">
              <DialogHeader>
                <DialogTitle>Criar Ministério</DialogTitle>
                <DialogDescription>
                  Adicione um novo ministério à igreja
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="ministry-name">Nome</Label>
                  <Input
                    id="ministry-name"
                    value={newMinistry.name}
                    onChange={(e) => setNewMinistry({ ...newMinistry, name: e.target.value })}
                    placeholder="Ex: Casais"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ministry-desc">Descrição</Label>
                  <Input
                    id="ministry-desc"
                    value={newMinistry.description}
                    onChange={(e) => setNewMinistry({ ...newMinistry, description: e.target.value })}
                    placeholder="Breve descrição do ministério"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ministry-leader">Líder</Label>
                  <Select
                    value={newMinistry.leaderId}
                    onValueChange={(value) => setNewMinistry({ ...newMinistry, leaderId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o líder" />
                    </SelectTrigger>
                    <SelectContent
                      className="z-[99999] max-h-[300px] overflow-y-auto"
                      side="bottom"
                      sideOffset={4}
                      avoidCollisions={true}
                    >
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateMinistry}>Criar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
          {canDownloadReports && (
            <div className="flex flex-wrap items-center gap-2">
              <ExcelMinistriesDashboardButton />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {ministries.map((ministry) => (
          <MinistryCard
            key={ministry.id}
            ministry={ministry}
            onDelete={handleDeleteMinistry}
            onAddMember={(m) => {
              setSelectedMinistry(m);
              setAddMemberOpen(true);
            }}
          />
        ))}
      </div>

      {selectedMinistry && (
        <MinistryDetailsDialog
          open={addMemberOpen}
          onOpenChange={setAddMemberOpen}
          ministry={selectedMinistry}
          onSuccess={loadMinistries}
        />
      )}
    </div>
  );
}

// Sub-component for Details
function MinistryDetailsDialog({ open, onOpenChange, ministry, onSuccess }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministry: Ministry;
  onSuccess: () => void;
}) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [addingMember, setAddingMember] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [removeMemberConfirm, setRemoveMemberConfirm] = useState<{ open: boolean; memberId: string }>({ open: false, memberId: '' });
  const [meetingsCount, setMeetingsCount] = useState<number>(0);
  const [monthlyReport, setMonthlyReport] = useState('');
  const [visitorsCount, setVisitorsCount] = useState<number>(0);
  const [membersPresentCount, setMembersPresentCount] = useState<number>(0);
  const [meetingDate, setMeetingDate] = useState<string>(getTodayDateString());
  const { toast } = useToast();
  const { churchId, user } = useAuth();
  const { canEditMinistries } = usePermissions();
  const effectiveChurchId = churchId ?? user?.churchId;
  const canEdit = canEditMinistries;

  useEffect(() => {
    if (open) {
      setMeetingsCount(ministry.meetingsCount ?? 0);
      setMonthlyReport(ministry.monthlyActivityReport ?? '');
      setVisitorsCount(ministry.visitorsCount ?? 0);
      setMembersPresentCount(ministry.membersPresentCount ?? 0);
      setMeetingDate(ministry.meetingDate || getTodayDateString());
      loadDetails();
    }
  }, [
    open,
    ministry.id,
    ministry.meetingsCount,
    ministry.monthlyActivityReport,
    ministry.visitorsCount,
    ministry.membersPresentCount,
    ministry.meetingDate,
  ]);

  async function loadDetails() {
    try {
      setLoading(true);
      const [minMembers, membersList] = await Promise.all([
        ministriesService.getMembers(ministry.id),
        membersService.getAll(effectiveChurchId)
      ]);
      setMembers(minMembers || []);
      setAllMembers(membersList as any || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddPerson = async (memberId: string) => {
    try {
      setAddingMember(true);
      await ministriesService.addMember(ministry.id, memberId);
      toast({ title: 'Sucesso', description: 'Membro adicionado ao ministério.' });
      loadDetails();
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemovePerson = (memberId: string) => setRemoveMemberConfirm({ open: true, memberId });
  const executeRemoveMember = async () => {
    const { memberId } = removeMemberConfirm;
    try {
      await ministriesService.removeMember(ministry.id, memberId);
      setRemoveMemberConfirm(prev => ({ ...prev, open: false }));
      toast({ title: 'Removido', description: 'Membro removido do ministério.' });
      loadDetails();
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const handleSaveReport = async () => {
    try {
      setSavingReport(true);
      const combinedReport = formatMinistryReport(monthlyReport, {
        visitorsCount,
        membersPresentCount,
        meetingDate,
      });

      await ministriesService.update(ministry.id, {
        meetings_count: meetingsCount,
        monthly_activity_report: combinedReport || null,
      });
      toast({ title: 'Salvo!', description: 'Relatório, presença e dados de atividade atualizados com sucesso.' });
      onSuccess();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setSavingReport(false);
    }
  };

  return (
    <>
      <ConfirmDialog open={removeMemberConfirm.open} onOpenChange={(o) => setRemoveMemberConfirm(prev => ({ ...prev, open: o }))} title="Remover membro" description="Deseja remover este membro do ministério?" onConfirm={executeRemoveMember} confirmLabel="Remover" variant="destructive" />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-screen h-screen sm:w-[95vw] sm:max-w-2xl sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              {ministry.name}
            </DialogTitle>
            <DialogDescription>{ministry.description}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 sm:p-4 flex items-center gap-3">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Participantes</p>
                  <p className="text-xl sm:text-2xl font-bold text-primary">{members.length}</p>
                </div>
              </div>
              <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 sm:p-4 flex items-center gap-3">
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Reuniões (mês)</p>
                  <p className="text-xl sm:text-2xl font-bold text-primary">{meetingsCount}</p>
                </div>
              </div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 sm:p-4 flex items-center gap-3">
                <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Presentes</p>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">{membersPresentCount}</p>
                </div>
              </div>
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 sm:p-4 flex items-center gap-3">
                <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Visitantes</p>
                  <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">{visitorsCount}</p>
                </div>
              </div>
            </div>

            {(canEdit || monthlyReport || meetingsCount > 0 || visitorsCount > 0 || membersPresentCount > 0) && (
              <>
                <Separator />
                <div className="space-y-4">
                  <Label className="text-lg font-bold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Relatório da Atividade Mensal
                  </Label>
                  {canEdit ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="meeting-date" className="flex items-center gap-1.5 font-medium">
                            <Calendar className="h-4 w-4 text-primary" />
                            Data da reunião
                          </Label>
                          <Input
                            id="meeting-date"
                            type="date"
                            value={meetingDate}
                            onChange={(e) => setMeetingDate(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="meetings-count" className="flex items-center gap-1.5 font-medium">
                            <Calendar className="h-4 w-4 text-primary" />
                            Número de reuniões (mês)
                          </Label>
                          <Input
                            id="meetings-count"
                            type="number"
                            min={0}
                            value={meetingsCount}
                            onChange={(e) => setMeetingsCount(Math.max(0, parseInt(e.target.value) || 0))}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="members-present" className="flex items-center gap-1.5 font-medium">
                            <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            Número de membros presentes
                          </Label>
                          <Input
                            id="members-present"
                            type="number"
                            min={0}
                            value={membersPresentCount}
                            onChange={(e) => setMembersPresentCount(Math.max(0, parseInt(e.target.value) || 0))}
                            placeholder="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="visitors-count" className="flex items-center gap-1.5 font-medium">
                            <UserPlus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            Número de visitantes
                          </Label>
                          <Input
                            id="visitors-count"
                            type="number"
                            min={0}
                            value={visitorsCount}
                            onChange={(e) => setVisitorsCount(Math.max(0, parseInt(e.target.value) || 0))}
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="monthly-report" className="flex items-center gap-1.5 font-medium">
                          <FileText className="h-4 w-4 text-primary" />
                          Relatório (atividades realizadas / observações)
                        </Label>
                        <Textarea
                          id="monthly-report"
                          value={monthlyReport}
                          onChange={(e) => setMonthlyReport(e.target.value)}
                          placeholder="Descreva as atividades realizadas no mês, metas e observações..."
                          rows={4}
                          className="resize-none"
                        />
                      </div>
                      <Button onClick={handleSaveReport} disabled={savingReport} className="gap-2">
                        {savingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Salvar relatório
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-muted/50 p-4 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs block">Data da reunião:</span>
                          <strong className="text-foreground">{meetingDate || 'Não informada'}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Reuniões no mês:</span>
                          <strong className="text-foreground">{meetingsCount}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Membros presentes:</span>
                          <strong className="text-emerald-600 dark:text-emerald-400">{membersPresentCount}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs block">Visitantes:</span>
                          <strong className="text-amber-600 dark:text-amber-400">{visitorsCount}</strong>
                        </div>
                      </div>
                      {monthlyReport && (
                        <div className="pt-2 border-t border-border/40">
                          <span className="text-muted-foreground text-xs block mb-1">Atividades realizadas:</span>
                          <p className="text-sm whitespace-pre-wrap">{monthlyReport}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Separator />
              </>
            )}

            <div className="space-y-4">
              <Label className="text-lg font-bold">Participantes ({members.length})</Label>
              <div className="grid gap-2">
                {members.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                    Nenhum membro cadastrado neste ministério.
                  </p>
                ) : (
                  members.map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                          {m.member?.name?.[0]}
                        </div>
                        <div>
                          <p className="font-bold">{m.member?.name}</p>
                          <p className="text-xs text-muted-foreground">{m.role || 'Membro'}</p>
                        </div>
                      </div>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemovePerson(m.member_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {canEdit && (
              <>
                <Separator />

                <div className="space-y-4">
                  <Label className="text-lg font-bold">Adicionar Membro</Label>
                  <div className="flex gap-2">
                    <Select onValueChange={handleAddPerson} disabled={addingMember}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Selecione um membro para adicionar..." />
                      </SelectTrigger>
                      <SelectContent
                        className="z-[99999] max-h-[300px] overflow-y-auto"
                        side="bottom"
                        sideOffset={4}
                        avoidCollisions={true}
                      >
                        {allMembers
                          .filter(am => !members.some(m => m.member_id === am.id))
                          .map(m => (
                            <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
