import { useState, useEffect } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  RefreshCw,
  Plus,
  Calendar,
  CheckCircle2,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  readingPlansService,
  ReadingPlan,
  ReadingPlanDay,
  ReadingPlanProgress,
  ReadingPlanCompletion,
} from '@/services/readingPlans.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { EmptyState } from '@/components/EmptyState';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ReadingPlans() {
  useDocumentTitle('Planos de Leitura');
  const { user, churchId, viewingChurch } = useAuth();
  const { toast } = useToast();
  const effectiveChurchId = viewingChurch?.id ?? churchId ?? user?.churchId;
  const canManage = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'secretario' || user?.role === 'superadmin';

  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<ReadingPlan | null>(null);
  const [days, setDays] = useState<ReadingPlanDay[]>([]);
  const [progress, setProgress] = useState<ReadingPlanProgress | null>(null);
  const [completions, setCompletions] = useState<ReadingPlanCompletion[]>([]);
  const [currentDayNum, setCurrentDayNum] = useState(1);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({ name: '', description: '', total_days: 365 });
  const [creating, setCreating] = useState(false);
  const [addDayOpen, setAddDayOpen] = useState(false);
  const [newDay, setNewDay] = useState({ day_number: 1, title: '', reference: '', content: '' });
  const [addingDay, setAddingDay] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);

  useEffect(() => {
    loadingPlans();
  }, [effectiveChurchId]);

  function isTableMissingError(err: any): boolean {
    const msg = err?.message || '';
    return /reading_plans|schema cache|does not exist|not found/i.test(msg);
  }

  async function loadingPlans() {
    setLoading(true);
    setSetupRequired(false);
    try {
      const data = await readingPlansService.list(effectiveChurchId);
      setPlans(data);
    } catch (e: any) {
      if (isTableMissingError(e)) {
        setSetupRequired(true);
      } else {
        toast({ title: 'Erro ao carregar planos', description: e?.message, variant: 'destructive' });
      }
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }

  async function openPlan(plan: ReadingPlan) {
    setSelectedPlan(plan);
    setLoadingPlan(true);
    try {
      const [daysData, prog, compl] = await Promise.all([
        readingPlansService.getDays(plan.id),
        user ? readingPlansService.getProgress(user.id, plan.id) : Promise.resolve(null),
        user ? readingPlansService.getCompletions(user.id, plan.id).catch(() => []) : Promise.resolve([]),
      ]);
      setDays(daysData);
      setProgress(prog);
      setCompletions(compl);
      setCurrentDayNum(prog?.current_day ?? 1);
    } catch (e: any) {
      toast({ title: 'Erro ao carregar', description: e?.message, variant: 'destructive' });
    } finally {
      setLoadingPlan(false);
    }
  }

  async function startPlan(plan: ReadingPlan) {
    if (!user) return;
    try {
      const prog = await readingPlansService.startPlan(user.id, plan.id);
      setProgress(prog);
      setCurrentDayNum(1);
      toast({ title: 'Plano iniciado!', description: 'Boa leitura.' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message, variant: 'destructive' });
    }
  }

  async function advanceDay() {
    if (!selectedPlan || !user || !progress) return;
    const dayToMark = progress.current_day;
    try {
      await readingPlansService.markDayCompleted(user.id, selectedPlan.id, dayToMark);
      const next = Math.min(dayToMark + 1, selectedPlan.total_days);
      setProgress({ ...progress, current_day: next, last_read_at: new Date().toISOString() });
      setCurrentDayNum(next);
      setCompletions((prev) => [
        { user_id: user.id, plan_id: selectedPlan.id, day_number: dayToMark, completed_at: new Date().toISOString() },
        ...prev.filter((c) => c.day_number !== dayToMark),
      ]);
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message, variant: 'destructive' });
    }
  }

  const currentDay = days.find((d) => d.day_number === currentDayNum);
  const hasDays = days.length > 0;

  // Concluídos: da tabela completions ou estimativa por current_day (fallback)
  const completedCount = completions.length || (progress ? Math.max(0, progress.current_day - 1) : 0);

  async function handleAddDay() {
    if (!selectedPlan || !newDay.reference.trim()) {
      toast({ title: 'Preencha a referência', variant: 'destructive' });
      return;
    }
    setAddingDay(true);
    try {
      await readingPlansService.addDay(selectedPlan.id, {
        day_number: newDay.day_number,
        title: newDay.title.trim() || undefined,
        reference: newDay.reference.trim(),
        content: newDay.content.trim() || undefined,
      });
      toast({ title: 'Dia adicionado!' });
      setAddDayOpen(false);
      const daysData = await readingPlansService.getDays(selectedPlan.id);
      setDays(daysData);
      const next = daysData.length > 0 ? Math.max(...daysData.map((d) => d.day_number)) + 1 : 1;
      setNewDay({ day_number: next, title: '', reference: '', content: '' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message, variant: 'destructive' });
    } finally {
      setAddingDay(false);
    }
  }

  function openAddDay() {
    const nextDay = days.length > 0
      ? Math.max(...days.map((d) => d.day_number)) + 1
      : 1;
    setNewDay({
      day_number: nextDay,
      title: '',
      reference: '',
      content: '',
    });
    setAddDayOpen(true);
  }

  async function handleCreatePlan() {
    if (!newPlan.name.trim() || newPlan.total_days < 1) {
      toast({ title: 'Preencha nome e dias', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const plan = await readingPlansService.createPlan(effectiveChurchId ?? null, {
        name: newPlan.name.trim(),
        description: newPlan.description.trim() || undefined,
        total_days: newPlan.total_days,
      });
      toast({ title: 'Plano criado!', description: 'Adicione os dias de leitura.' });
      setCreateOpen(false);
      setNewPlan({ name: '', description: '', total_days: 365 });
      await loadingPlans();
      openPlan(plan);
    } catch (e: any) {
      toast({ title: 'Erro ao criar', description: e?.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planos de Leitura Diária</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe planos bíblicos e devocionais dia a dia. Registro de conclusão e progresso.
          </p>
        </div>
        {canManage && !setupRequired && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo plano
          </Button>
        )}
      </div>

      {!selectedPlan ? (
        loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : setupRequired ? (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
            <CardHeader>
              <CardTitle className="text-lg">Configure o banco de dados</CardTitle>
              <CardDescription>
                As tabelas de planos de leitura ainda não existem no Supabase. Execute o script abaixo no SQL Editor do painel Supabase.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Abra o painel do Supabase → SQL Editor</li>
                <li>Cole o conteúdo do arquivo <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">supabase/reading_plans.sql</code></li>
                <li>Execute a query (Run)</li>
                <li>Recarregue esta página</li>
              </ol>
              <Button variant="outline" onClick={loadingPlans}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </CardContent>
          </Card>
        ) : plans.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Nenhum plano disponível"
            description="Sua igreja ainda não criou planos de leitura. Peça a um administrador para adicionar."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => openPlan(plan)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {plan.total_days} dias
                    </span>
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.description && (
                    <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Button variant="ghost" onClick={() => setSelectedPlan(null)}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            {canManage && (
              <Button variant="outline" onClick={openAddDay}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar dia
              </Button>
            )}
          </div>

          {loadingPlan ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !hasDays ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Este plano ainda não tem dias configurados. Um administrador precisa adicionar as leituras.
                </p>
              </CardContent>
            </Card>
          ) : (
              <>
              {!progress && user && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="py-4 flex items-center justify-between gap-4">
                    <p className="text-sm">Inicie o plano para acompanhar seu progresso.</p>
                    <Button onClick={() => startPlan(selectedPlan!)}>
                      <Play className="h-4 w-4 mr-2" />
                      Iniciar plano
                    </Button>
                  </CardContent>
                </Card>
              )}

              {progress && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Registro de conclusão e progresso
                    </CardTitle>
                    <CardDescription>
                      {completedCount} de {selectedPlan?.total_days} dias concluídos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Progress
                        value={selectedPlan ? Math.round((completedCount / selectedPlan.total_days) * 100) : 0}
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        {Math.round((completedCount / (selectedPlan?.total_days ?? 1)) * 100)}% concluído
                      </p>
                    </div>
                    {completions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Últimas conclusões</p>
                        <div className="flex flex-wrap gap-2">
                          {completions.slice(0, 10).map((c) => (
                            <span
                              key={`${c.plan_id}-${c.day_number}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Dia {c.day_number} • {format(new Date(c.completed_at), "dd/MM", { locale: ptBR })}
                            </span>
                          ))}
                          {completions.length > 10 && (
                            <span className="text-xs text-muted-foreground">+{completions.length - 10} mais</span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Dia {currentDayNum} de {selectedPlan?.total_days}
                    </CardTitle>
                    {progress && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentDayNum <= 1}
                          onClick={() => setCurrentDayNum((d) => Math.max(1, d - 1))}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentDayNum >= (selectedPlan?.total_days ?? 1)}
                          onClick={() => {
                            if (currentDayNum < (selectedPlan?.total_days ?? 1)) {
                              setCurrentDayNum((d) => d + 1);
                              if (progress && user && currentDayNum === progress.current_day) {
                                advanceDay();
                              }
                            }
                          }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        {progress && currentDayNum === progress.current_day && (
                          <Button size="sm" onClick={advanceDay}>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Marcar como lido
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentDay ? (
                    <>
                      {currentDay.title && (
                        <h3 className="font-semibold text-lg">{currentDay.title}</h3>
                      )}
                      <p className="text-2xl font-bold text-primary">{currentDay.reference}</p>
                      {currentDay.content && (
                        <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">
                          {currentDay.content}
                        </div>
                      )}
                      {!currentDay.content && (
                        <p className="text-sm text-muted-foreground italic">
                          Leia {currentDay.reference} na sua Bíblia.
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Dia {currentDayNum} ainda não configurado.</p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      <Dialog open={addDayOpen} onOpenChange={setAddDayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar dia de leitura</DialogTitle>
            <DialogDescription>
              Dia {newDay.day_number} de {selectedPlan?.total_days}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Número do dia</Label>
              <Input
                type="number"
                min={1}
                max={selectedPlan?.total_days ?? 365}
                value={newDay.day_number}
                onChange={(e) =>
                  setNewDay((d) => ({ ...d, day_number: parseInt(e.target.value) || 1 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Título (opcional)</Label>
              <Input
                placeholder="Ex: Criação"
                value={newDay.title}
                onChange={(e) => setNewDay((d) => ({ ...d, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Referência *</Label>
              <Input
                placeholder="Ex: Gênesis 1-3"
                value={newDay.reference}
                onChange={(e) => setNewDay((d) => ({ ...d, reference: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Reflexão ou conteúdo (opcional)</Label>
              <Textarea
                placeholder="Texto de apoio ou reflexão"
                value={newDay.content}
                onChange={(e) => setNewDay((d) => ({ ...d, content: e.target.value }))}
                rows={4}
              />
            </div>
            <Button onClick={handleAddDay} disabled={addingDay} className="w-full">
              {addingDay ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo plano de leitura</DialogTitle>
            <DialogDescription>
              Crie um plano e depois adicione os dias com referências e reflexões.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Bíblia em 1 ano"
                value={newPlan.name}
                onChange={(e) => setNewPlan((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Breve descrição do plano"
                value={newPlan.description}
                onChange={(e) => setNewPlan((p) => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Total de dias</Label>
              <Input
                type="number"
                min={1}
                value={newPlan.total_days}
                onChange={(e) =>
                  setNewPlan((p) => ({ ...p, total_days: parseInt(e.target.value) || 1 }))
                }
              />
            </div>
            <Button onClick={handleCreatePlan} disabled={creating} className="w-full">
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Criar plano
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
