import { useState, useEffect } from 'react';
import { Plus, Loader2, GraduationCap, Users, Trash2, ClipboardList, FileSpreadsheet, Search, UserPlus } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { PageBreadcrumbs } from '@/components/PageBreadcrumbs';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { schoolsService, type School, type SchoolStudent, type SchoolReport } from '@/services/schools.service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ExcelMinistriesDashboardButton } from '@/components/ExcelMinistriesDashboardButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { membersService } from '@/services/members.service';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StudentToAdd {
  name: string;
  email: string;
  phone: string;
}

export default function Schools() {
  useDocumentTitle('Escolas');
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);
  const [schoolStudents, setSchoolStudents] = useState<Record<string, SchoolStudent[]>>({});
  const [schoolReports, setSchoolReports] = useState<Record<string, SchoolReport[]>>({});
  const [newSchool, setNewSchool] = useState({ name: '', description: '' });
  const [studentsToAdd, setStudentsToAdd] = useState<StudentToAdd[]>([]);
  const [currentStudent, setCurrentStudent] = useState<StudentToAdd>({ name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string } | null>(null);
  const { toast } = useToast();
  const { user, churchId } = useAuth();
  const { canEditSchools, canDownloadReports } = usePermissions();
  const effectiveChurchId = churchId ?? user?.churchId;

  const canCreate = canEditSchools;

  useEffect(() => {
    loadSchools();
  }, [effectiveChurchId]);

  async function loadSchools() {
    try {
      setLoading(true);
      const data = await schoolsService.getAll(effectiveChurchId);
      setSchools(data);
    } catch (err: any) {
      console.error('Erro ao carregar escolas:', err);
      setSchools([]);
      toast({ title: 'Erro', description: 'Não foi possível carregar as escolas.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function loadStudents(schoolId: string) {
    try {
      const data = await schoolsService.getStudents(schoolId);
      console.log('Alunos carregados para', schoolId, ':', data);
      setSchoolStudents((prev) => ({ ...prev, [schoolId]: data || [] }));
    } catch (err) {
      console.error('Erro ao carregar alunos:', err);
    }
  }

  async function loadReports(schoolId: string) {
    try {
      const data = await schoolsService.getReports(schoolId);
      setSchoolReports((prev) => ({ ...prev, [schoolId]: data }));
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
    }
  }

  const handleAddStudentToList = () => {
    if (!currentStudent.name.trim()) return;
    setStudentsToAdd((prev) => [...prev, { ...currentStudent }]);
    setCurrentStudent({ name: '', email: '', phone: '' });
  };

  const handleRemoveStudentFromList = (index: number) => {
    setStudentsToAdd((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateSchool = async () => {
    if (!newSchool.name.trim()) {
      toast({ title: 'Nome obrigatório', description: 'Digite o nome da escola.', variant: 'destructive' });
      return;
    }
    if (!effectiveChurchId) {
      toast({ title: 'Erro', description: 'ID da igreja não encontrado. Faça login novamente.', variant: 'destructive' });
      console.error('effectiveChurchId is null:', { churchId, userChurchId: user?.churchId });
      return;
    }
    try {
      setSaving(true);
      console.log('Criando escola:', { name: newSchool.name.trim(), churchId: effectiveChurchId });
      const school = await schoolsService.create(
        { name: newSchool.name.trim(), description: newSchool.description.trim() || undefined },
        effectiveChurchId
      );
      console.log('Escola criada:', school);
      for (const s of studentsToAdd) {
        if (s.name.trim()) {
          await schoolsService.addStudent(school.id, {
            name: s.name.trim(),
            email: s.email.trim() || undefined,
            phone: s.phone.trim() || undefined,
          });
        }
      }
      setNewSchool({ name: '', description: '' });
      setStudentsToAdd([]);
      setCurrentStudent({ name: '', email: '', phone: '' });
      setDialogOpen(false);
      loadSchools();
      toast({
        title: 'Escola criada!',
        description: `${school.name}${studentsToAdd.length ? ` com ${studentsToAdd.length} aluno(s)` : ''} foi adicionada com sucesso.`,
      });
    } catch (err: any) {
      console.error('Erro ao criar escola:', err);
      toast({
        title: 'Erro ao criar',
        description: err.message || 'Ocorreu um problema.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddStudentToSchool = async (schoolId: string, student: { name: string; email?: string; phone?: string }) => {
    try {
      await schoolsService.addStudent(schoolId, student);
      loadStudents(schoolId);
      toast({ title: 'Aluno adicionado!', description: `${student.name} foi inscrito.` });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Não foi possível adicionar.', variant: 'destructive' });
    }
  };

  const handleRemoveStudent = async (schoolId: string, studentId: string) => {
    try {
      await schoolsService.removeStudent(studentId);
      loadStudents(schoolId);
      toast({ title: 'Aluno removido' });
    } catch (err) {
      toast({ title: 'Erro ao remover', variant: 'destructive' });
    }
  };

  const handleDeleteSchool = async (id: string) => {
    try {
      await schoolsService.delete(id);
      loadSchools();
      toast({ title: 'Escola removida' });
      setDeleteConfirm(null);
    } catch (err) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' });
    }
  };

  const toggleExpand = (schoolId: string) => {
    if (expandedSchool === schoolId) {
      setExpandedSchool(null);
    } else {
      setExpandedSchool(schoolId);
      if (!schoolStudents[schoolId]) loadStudents(schoolId);
      if (!schoolReports[schoolId]) loadReports(schoolId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageBreadcrumbs />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumbs />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            Escolas
          </h1>
          <p className="text-muted-foreground mt-1">Gerencie escolas (Bíblica, Líderes, etc.) e seus alunos.</p>
        </div>
        <div className="flex gap-2">
          {canDownloadReports && <ExcelMinistriesDashboardButton />}
          {canCreate && (
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar nova escola
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => (
          <Card key={school.id} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-lg">{school.name}</h3>
                  {school.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{school.description}</p>
                  )}
                </div>
                {canCreate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteConfirm({ open: true, id: school.id, name: school.name })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => toggleExpand(school.id)}
              >
                <Users className="h-4 w-4" />
                {expandedSchool === school.id ? 'Ocultar detalhes' : 'Ver alunos e relatórios'}
              </Button>
              {expandedSchool === school.id && (
                <Tabs defaultValue="alunos" className="mt-4">
                  <TabsList className="flex w-full justify-start overflow-x-auto overflow-y-hidden h-auto p-1 scrollbar-hide snap-x">
                    <TabsTrigger value="alunos" className="gap-1 shrink-0 snap-start">
                      <Users className="h-3 w-3" /> Alunos
                    </TabsTrigger>
                    <TabsTrigger value="relatorios" className="gap-1 shrink-0 snap-start">
                      <ClipboardList className="h-3 w-3" /> Relatórios
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="alunos" className="space-y-2 mt-2">
                    {schoolStudents[school.id]?.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-xl border bg-muted/40 px-3 py-2 text-sm"
                      >
                        <div>
                          <span className="font-medium">{s.name}</span>
                          {s.email && <span className="text-muted-foreground ml-2">({s.email})</span>}
                        </div>
                        {canCreate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleRemoveStudent(school.id, s.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {(!schoolStudents[school.id] || schoolStudents[school.id].length === 0) && (
                      <p className="text-sm text-muted-foreground py-2">Nenhum aluno inscrito.</p>
                    )}
                    {canCreate && (
                      <AddStudentInline schoolId={school.id} onAdd={() => loadStudents(school.id)} />
                    )}
                  </TabsContent>
                  <TabsContent value="relatorios" className="mt-2 space-y-3">
                    <SchoolReportsSection
                      schoolId={school.id}
                      reports={schoolReports[school.id] || []}
                      canCreate={canCreate}
                      onLoad={() => loadReports(school.id)}
                      onRemoveReport={async (id) => {
                        await schoolsService.removeReport(id);
                        loadReports(school.id);
                        toast({ title: 'Relatório excluído' });
                      }}
                    />
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {schools.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma escola cadastrada</h3>
          <p className="text-muted-foreground mb-4">Crie a primeira escola e adicione alunos.</p>
          {canCreate && (
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Criar nova escola
            </Button>
          )}
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar nova escola</DialogTitle>
            <DialogDescription>Preencha o nome e adicione alunos (opcional).</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome da escola</Label>
              <Input
                id="name"
                placeholder="Ex: Escola Bíblica Dominical"
                value={newSchool.name}
                onChange={(e) => setNewSchool((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="desc">Descrição (opcional)</Label>
              <Textarea
                id="desc"
                placeholder="Breve descrição..."
                value={newSchool.description}
                onChange={(e) => setNewSchool((s) => ({ ...s, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div>
              <Label>Adicionar alunos</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Nome"
                  value={currentStudent.name}
                  onChange={(e) => setCurrentStudent((s) => ({ ...s, name: e.target.value }))}
                />
                <Input
                  placeholder="E-mail"
                  value={currentStudent.email}
                  onChange={(e) => setCurrentStudent((s) => ({ ...s, email: e.target.value }))}
                />
                <Input
                  placeholder="Telefone"
                  value={currentStudent.phone}
                  onChange={(e) => setCurrentStudent((s) => ({ ...s, phone: e.target.value }))}
                />
                <Button type="button" variant="outline" size="icon" onClick={handleAddStudentToList} title="Adicionar à lista">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {studentsToAdd.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {studentsToAdd.map((s, i) => (
                    <li key={i} className="flex items-center justify-between text-sm py-1 px-2 rounded bg-muted/50">
                      <span>{s.name}{s.email && ` (${s.email})`}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleRemoveStudentFromList(i)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button type="button" onClick={handleCreateSchool} disabled={saving || !newSchool.name.trim()} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar escola
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deleteConfirm && (
        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => !open && setDeleteConfirm(null)}
          title="Excluir escola"
          description={`Tem certeza que deseja excluir "${deleteConfirm.name}"? Os alunos vinculados também serão removidos.`}
          onConfirm={() => handleDeleteSchool(deleteConfirm.id)}
        />
      )}
    </div>
  );
}

function SchoolReportsSection({
  schoolId,
  reports,
  canCreate,
  onLoad,
  onRemoveReport,
}: {
  schoolId: string;
  reports: SchoolReport[];
  canCreate: boolean;
  onLoad: () => void;
  onRemoveReport: (id: string) => Promise<void>;
}) {
  return (
    <div className="space-y-3">
      {reports.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">Nenhum relatório registrado.</p>
      )}
      {reports.map((r) => (
        <div
          key={r.id}
          className="flex items-start justify-between gap-2 rounded-xl border bg-muted/30 px-3 py-2 text-sm"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">
                {new Date(r.report_date + 'T12:00:00').toLocaleDateString('pt-BR')}
              </span>
              <span className="text-muted-foreground">
                {r.num_present} presente{r.num_present !== 1 ? 's' : ''}
                {r.num_visitors != null && r.num_visitors > 0 && ` • ${r.num_visitors} visitante(s)`}
              </span>
            </div>
            {r.subject && <p className="mt-0.5 text-foreground">{r.subject}</p>}
            {r.notes && <p className="mt-0.5 text-muted-foreground text-xs">{r.notes}</p>}
          </div>
          {canCreate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive"
              onClick={() => onRemoveReport(r.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      {canCreate && <AddReportInline schoolId={schoolId} onAdd={onLoad} />}
    </div>
  );
}

function AddReportInline({ schoolId, onAdd }: { schoolId: string; onAdd: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [subject, setSubject] = useState('');
  const [numPresent, setNumPresent] = useState(0);
  const [numVisitors, setNumVisitors] = useState(0);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAdd = async () => {
    try {
      setLoading(true);
      await schoolsService.addReport(schoolId, {
        report_date: date,
        subject: subject.trim() || undefined,
        num_present: numPresent,
        num_visitors: numVisitors || undefined,
        notes: notes.trim() || undefined,
      });
      setSubject('');
      setNumPresent(0);
      setNumVisitors(0);
      setNotes('');
      onAdd();
      toast({ title: 'Relatório adicionado!' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-dashed p-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Novo relatório</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Data</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8" />
        </div>
        <div>
          <Label className="text-xs">Presentes</Label>
          <Input
            type="number"
            min={0}
            value={numPresent}
            onChange={(e) => setNumPresent(parseInt(e.target.value) || 0)}
            className="h-8"
          />
        </div>
        <div>
          <Label className="text-xs">Visitantes</Label>
          <Input
            type="number"
            min={0}
            value={numVisitors}
            onChange={(e) => setNumVisitors(parseInt(e.target.value) || 0)}
            className="h-8"
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">Assunto</Label>
        <Input
          placeholder="Ex: Lição 5 - O amor de Deus"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="h-8"
        />
      </div>
      <div>
        <Label className="text-xs">Observações</Label>
        <Input
          placeholder="Opcional"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="h-8"
        />
      </div>
      <Button size="sm" onClick={handleAdd} disabled={loading} className="gap-1">
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
        Adicionar relatório
      </Button>
    </div>
  );
}

function AddStudentInline({ schoolId, onAdd }: { schoolId: string; onAdd: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);
  const { toast } = useToast();
  const { user, churchId } = useAuth();
  const effectiveChurchId = churchId ?? user?.churchId;

  const handleAdd = async () => {
    console.log('handleAdd chamado', { name, email, phone, schoolId });
    if (!name.trim()) {
      toast({ title: 'Nome obrigatório', description: 'Digite o nome do aluno.', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      console.log('Adicionando aluno:', { schoolId, name: name.trim(), email, phone });
      const addedName = name.trim();
      await schoolsService.addStudent(schoolId, { name: addedName, email: email.trim() || undefined, phone: phone.trim() || undefined });
      console.log('Aluno adicionado com sucesso');
      setName('');
      setEmail('');
      setPhone('');
      await onAdd();
      toast({ title: 'Aluno adicionado!', description: addedName });
    } catch (err: any) {
      console.error('Erro ao adicionar aluno:', err);
      toast({ title: 'Erro ao adicionar', description: err.message || 'Verifique o console para mais detalhes.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const loadMembers = async () => {
    try {
      setLoadingMembers(true);
      const data = await membersService.getAll(effectiveChurchId);
      setMembers(data || []);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de membros.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const openMemberDialog = () => {
    setMemberDialogOpen(true);
    loadMembers();
  };

  const selectMember = (member: any) => {
    setName(member.name);
    setEmail(member.email || '');
    setPhone(member.phone || '');
    setMemberDialogOpen(false);
    setSearch('');
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-2">
        <div className="flex flex-1 min-w-[120px] gap-1">
          <Input
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={openMemberDialog}
            title="Buscar membro"
            className="shrink-0"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Input placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyDown} className="w-[140px]" />
        <Input placeholder="Telefone" value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={handleKeyDown} className="w-[140px]" />
        <Button type="button" size="sm" onClick={handleAdd} disabled={loading || !name.trim()} className="gap-1">
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Adicionar
        </Button>
      </div>

      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Selecionar Membro</DialogTitle>
            <DialogDescription>
              Escolha um membro da igreja para adicionar à escola.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[300px] pr-4">
              {loadingMembers ? (
                <div className="flex flex-col items-center justify-center h-full py-8 space-y-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center text-muted-foreground">
                  <p>Nenhum membro encontrado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => selectMember(member)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border">
                          <AvatarImage src={member.photo_url} />
                          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.email || member.phone || 'Sem contato'}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 rounded-full hover:bg-primary hover:text-primary-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectMember(member);
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberDialogOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
