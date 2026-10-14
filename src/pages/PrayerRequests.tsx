import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  HandHeart,
  Send,
  Loader2,
  Heart,
  Trash2,
  Church,
  Phone,
  User,
  Calendar,
  Tag,
  ClipboardList,
  CheckCircle,
  MessageSquare,
  Sparkles,
  PartyPopper,
  Quote,
  Search,
  Pencil,
  Clock,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  prayerRequestsService,
  PrayerRequest,
} from '@/services/prayerRequests.service';
import { churchesService } from '@/services/churches.service';
import { membersService } from '@/services/members.service';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePermissions } from '@/hooks/usePermissions';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ConfirmDialog';

const CATEGORY_CONFIG: Record<string, { label: string; badgeClass: string }> = {
  saude: {
    label: 'Saúde',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
  },
  familia: {
    label: 'Família',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  financeiro: {
    label: 'Financeiro',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  },
  espiritual: {
    label: 'Espiritual',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  outros: {
    label: 'Outros',
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
};

export default function PrayerRequests() {
  useDocumentTitle('Solicitações e Testemunhos de Oração');
  const { user, churchId, viewingChurch, switchChurch } = useAuth();
  const { toast } = useToast();
  const { canDeletePrayerRequests } = usePermissions();
  const effectiveChurchId = viewingChurch?.id ?? churchId ?? user?.churchId;
  const canEdit = canDeletePrayerRequests;
  const isSuperAdmin = user?.role === 'superadmin';

  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [setupRequired, setSetupRequired] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<PrayerRequest | null>(null);
  const [churches, setChurches] = useState<{ id: string; name: string }[]>([]);

  // Navegação e Modos
  const [activeTab, setActiveTab] = useState<'pedidos' | 'testemunhos'>('pedidos');
  const [formMode, setFormMode] = useState<'pedido' | 'testemunho'>('pedido');

  // Campos do formulário
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [requesterName, setRequesterName] = useState('');
  const [contact, setContact] = useState('');
  const [category, setCategory] = useState<'saude' | 'familia' | 'financeiro' | 'espiritual' | 'outros'>('outros');
  const [assignedTo, setAssignedTo] = useState('');
  const [assignedToName, setAssignedToName] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [testimony, setTestimony] = useState('');
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);

  // Filtros de busca
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [statusFilter, setStatusFilter] = useState('todos');

  // Modal para Adicionar / Editar Testemunho
  const [testimonyModalOpen, setTestimonyModalOpen] = useState(false);
  const [selectedRequestForTestimony, setSelectedRequestForTestimony] = useState<PrayerRequest | null>(null);
  const [testimonyInput, setTestimonyInput] = useState('');
  const [savingTestimony, setSavingTestimony] = useState(false);

  // Modal para Novo Testemunho no Mural
  const [newTestimonySelectId, setNewTestimonySelectId] = useState<string>('novo');
  const [directTestimonyTitle, setDirectTestimonyTitle] = useState('');

  const loadRequests = useCallback(async () => {
    if (!effectiveChurchId) return;
    setLoading(true);
    setSetupRequired(false);
    try {
      const data = await prayerRequestsService.list(effectiveChurchId);
      setRequests(data);
    } catch (e: any) {
      if (/prayer_requests|schema cache|does not exist/i.test(e?.message || '')) {
        setSetupRequired(true);
      } else {
        toast({ title: 'Erro ao carregar', description: e?.message, variant: 'destructive' });
      }
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveChurchId, toast]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (isSuperAdmin && !effectiveChurchId) {
      churchesService.getAll().then((list: any[]) => {
        setChurches(list.map((c) => ({ id: c.id, name: c.name || c.slug || 'Igreja' })));
      }).catch(() => setChurches([]));
    }
  }, [isSuperAdmin, effectiveChurchId]);

  // Carregar membros para o select de responsável
  useEffect(() => {
    if (!effectiveChurchId) return;
    membersService.getAll()
      .then((list: any[]) => {
        setMembers(list.map((m) => ({ id: m.id, name: m.name })).sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(() => setMembers([]));
  }, [effectiveChurchId]);

  // Subscrição Realtime
  useEffect(() => {
    if (!effectiveChurchId) return;

    const unsubscribe = prayerRequestsService.subscribe(
      effectiveChurchId,
      (newRequest) => {
        setRequests((prev) => [newRequest, ...prev.filter((r) => r.id !== newRequest.id)]);
      },
      (updated) => {
        setRequests((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r))
        );
      }
    );

    return unsubscribe;
  }, [effectiveChurchId]);

  // Contadores e métricas
  const totalCount = requests.length;
  const answeredRequests = useMemo(() => {
    return requests.filter((r) => !!r.testimony?.trim() || r.status === 'respondido');
  }, [requests]);
  const answeredCount = answeredRequests.length;
  const pendingCount = totalCount - answeredCount;

  // Filtragem dos pedidos na Aba de Pedidos
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (categoryFilter !== 'todas' && r.category !== categoryFilter) return false;
      if (statusFilter !== 'todos') {
        const isAnswered = !!r.testimony?.trim() || r.status === 'respondido';
        if (statusFilter === 'respondido' && !isAnswered) return false;
        if (statusFilter === 'em_oracao' && r.status !== 'em_oracao') return false;
        if (statusFilter === 'pendente' && (isAnswered || r.status === 'em_oracao')) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const contentMatch = (r.content || '').toLowerCase().includes(q);
        const nameMatch = (r.requester_name || '').toLowerCase().includes(q);
        const testMatch = (r.testimony || '').toLowerCase().includes(q);
        if (!contentMatch && !nameMatch && !testMatch) return false;
      }
      return true;
    });
  }, [requests, categoryFilter, statusFilter, searchQuery]);

  // Filtragem dos testemunhos no Mural de Testemunhos
  const filteredTestimonies = useMemo(() => {
    return answeredRequests.filter((r) => {
      if (categoryFilter !== 'todas' && r.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const contentMatch = (r.content || '').toLowerCase().includes(q);
        const nameMatch = (r.requester_name || '').toLowerCase().includes(q);
        const testMatch = (r.testimony || '').toLowerCase().includes(q);
        if (!contentMatch && !nameMatch && !testMatch) return false;
      }
      return true;
    });
  }, [answeredRequests, categoryFilter, searchQuery]);

  // Envio de novo pedido ou testemunho direto
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveChurchId || !content.trim()) {
      toast({
        title: formMode === 'testemunho' ? 'Descreva o testemunho ou pedido' : 'Digite sua solicitação',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const selectedMember = members.find((m) => m.id === assignedTo);
      const isTestimonyMode = formMode === 'testemunho';
      const finalTestimony = isTestimonyMode
        ? (testimony.trim() || content.trim())
        : (testimony.trim() || undefined);

      const newReq = await prayerRequestsService.create(effectiveChurchId, {
        content: content.trim(),
        isAnonymous: isAnonymous,
        requesterName: isAnonymous ? undefined : (requesterName || user?.name),
        contact: isAnonymous ? undefined : contact,
        category: category,
        assignedTo: assignedTo || undefined,
        assignedToName: selectedMember?.name,
        returnDate: returnDate || undefined,
        testimony: finalTestimony,
        status: (isTestimonyMode || finalTestimony) ? 'respondido' : 'pendente',
      });

      setRequests((prev) => [newReq, ...prev]);

      // Limpar formulário
      setContent('');
      setRequesterName('');
      setContact('');
      setCategory('outros');
      setAssignedTo('');
      setAssignedToName('');
      setReturnDate('');
      setTestimony('');
      setIsAnonymous(false);
      setFormMode('pedido');

      if (isTestimonyMode) {
        toast({
          title: '🎉 Glória a Deus!',
          description: 'Seu testemunho de resposta de oração foi publicado no Mural!',
        });
        setActiveTab('testemunhos');
      } else {
        toast({
          title: 'Enviado!',
          description: 'Sua solicitação de oração foi publicada com sucesso.',
        });
      }
    } catch (e: any) {
      toast({ title: 'Erro ao enviar', description: e?.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }

  // Interação "Orei"
  async function handlePrayed(id: string) {
    try {
      await prayerRequestsService.incrementPrayed(id);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, prayed_count: (r.prayed_count || 0) + 1 } : r))
      );
      toast({
        title: '🙏 Oração registrada!',
        description: 'Você se uniu em oração por esta solicitação.',
      });
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message, variant: 'destructive' });
    }
  }

  // Interação "Glória a Deus!" no Mural de Testemunhos
  async function handleCelebrate(id: string) {
    try {
      await prayerRequestsService.incrementPrayed(id);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, prayed_count: (r.prayed_count || 0) + 1 } : r))
      );
      toast({
        title: '🙌 Glória a Deus!',
        description: 'Você celebrou esta vitória com toda a igreja!',
      });
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message, variant: 'destructive' });
    }
  }

  // Mudança rápida de Status (para líderes/pastores ou solicitantes)
  async function handleStatusChange(id: string, newStatus: 'pendente' | 'em_oracao' | 'respondido') {
    try {
      const req = requests.find((r) => r.id === id);
      if (!req) return;

      if (newStatus === 'respondido' && !req.testimony) {
        // Se marcar como respondido e ainda não tiver testemunho, abre modal para relatar!
        openTestimonyModal(req);
        return;
      }

      const updated = await prayerRequestsService.update(id, {
        status: newStatus,
        answered_at: newStatus === 'respondido' ? (req.answered_at || new Date().toISOString()) : null,
      });

      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
      toast({
        title: 'Status atualizado',
        description: `O pedido agora está como "${newStatus === 'respondido' ? 'Respondido' : newStatus === 'em_oracao' ? 'Em Intercessão' : 'Pendente'}".`,
      });
    } catch (e: any) {
      toast({ title: 'Erro ao alterar status', description: e?.message, variant: 'destructive' });
    }
  }

  // Abrir modal de testemunho para um pedido
  function openTestimonyModal(req?: PrayerRequest) {
    if (req) {
      setSelectedRequestForTestimony(req);
      setTestimonyInput(req.testimony || '');
      setNewTestimonySelectId(req.id);
      setDirectTestimonyTitle('');
    } else {
      setSelectedRequestForTestimony(null);
      setTestimonyInput('');
      setNewTestimonySelectId('novo');
      setDirectTestimonyTitle('');
    }
    setTestimonyModalOpen(true);
  }

  // Salvar testemunho do modal
  async function handleSaveTestimony() {
    if (!effectiveChurchId) return;
    if (!testimonyInput.trim()) {
      toast({
        title: 'Digite o testemunho',
        description: 'Por favor, compartilhe o relato de como Deus respondeu à oração.',
        variant: 'destructive',
      });
      return;
    }

    setSavingTestimony(true);
    try {
      if (selectedRequestForTestimony) {
        // Atualizando testemunho de pedido existente
        const updated = await prayerRequestsService.update(selectedRequestForTestimony.id, {
          testimony: testimonyInput.trim(),
          status: 'respondido',
          answered_at: selectedRequestForTestimony.answered_at || new Date().toISOString(),
        });

        setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        toast({
          title: '🎉 Glória a Deus!',
          description: 'O testemunho da resposta de oração foi registrado no Mural!',
        });
        setTestimonyModalOpen(false);
      } else if (newTestimonySelectId !== 'novo') {
        // Vinculando a um pedido selecionado
        const targetReq = requests.find((r) => r.id === newTestimonySelectId);
        if (targetReq) {
          const updated = await prayerRequestsService.update(targetReq.id, {
            testimony: testimonyInput.trim(),
            status: 'respondido',
            answered_at: new Date().toISOString(),
          });
          setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
          toast({
            title: '🎉 Glória a Deus!',
            description: 'O testemunho foi registrado com sucesso.',
          });
          setTestimonyModalOpen(false);
        }
      } else {
        // Criando novo testemunho direto
        const newReq = await prayerRequestsService.create(effectiveChurchId, {
          content: directTestimonyTitle.trim() || 'Oração respondida pelo Senhor',
          isAnonymous: isAnonymous,
          requesterName: isAnonymous ? undefined : (requesterName || user?.name),
          category: category,
          testimony: testimonyInput.trim(),
          status: 'respondido',
          answeredAt: new Date().toISOString(),
        });
        setRequests((prev) => [newReq, ...prev]);
        toast({
          title: '🎉 Glória a Deus!',
          description: 'Seu novo testemunho foi publicado no Mural de Respostas!',
        });
        setTestimonyModalOpen(false);
        setDirectTestimonyTitle('');
        setTestimonyInput('');
      }
      setActiveTab('testemunhos');
    } catch (e: any) {
      toast({ title: 'Erro ao salvar testemunho', description: e?.message, variant: 'destructive' });
    } finally {
      setSavingTestimony(false);
    }
  }

  // Excluir solicitação
  async function handleDelete() {
    if (!deleteConfirm) return;
    try {
      await prayerRequestsService.delete(deleteConfirm.id);
      setRequests((prev) => prev.filter((r) => r.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      toast({ title: 'Removido', description: 'Registro excluído com sucesso.' });
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message, variant: 'destructive' });
    }
  }

  if (!effectiveChurchId) {
    if (isSuperAdmin && churches.length > 0) {
      return (
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Solicitações de Oração</h1>
            <p className="text-muted-foreground mt-1">Selecione uma igreja para ver e gerenciar os pedidos de oração.</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Church className="h-5 w-5" />
                Selecionar igreja
              </CardTitle>
              <CardDescription>Escolha a igreja para acessar as solicitações de oração.</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                onValueChange={(val) => {
                  const ch = churches.find((c) => c.id === val);
                  if (ch) switchChurch(val, ch.name);
                }}
              >
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Escolha uma igreja..." />
                </SelectTrigger>
                <SelectContent>
                  {churches.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      {ch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <HandHeart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Selecione uma igreja</h2>
        <p className="text-muted-foreground">É necessário ter uma igreja vinculada para acessar as solicitações de oração.</p>
        {isSuperAdmin && churches.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">Nenhuma igreja cadastrada no momento.</p>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Cabeçalho Principal */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 border border-primary/15 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-primary to-emerald-600 text-white shadow-md">
              <HandHeart className="h-8 w-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Solicitações de Oração</h1>
                <Badge variant="outline" className="hidden sm:inline-flex bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 gap-1 text-xs">
                  <Sparkles className="h-3 w-3" /> Respostas & Milagres
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                Envie pedidos, ore pelas necessidades e celebre os testemunhos de respostas na nossa igreja.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Métricas / Resumo de Fé */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border border-border/60 bg-card/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total de Pedidos</p>
              <h3 className="text-2xl font-bold mt-1 text-foreground">{totalCount}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-card/60 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Em Intercessão</p>
              <h3 className="text-2xl font-bold mt-1 text-sky-600 dark:text-sky-400">{pendingCount}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400">
              <HandHeart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-emerald-300/60 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs cursor-pointer hover:border-emerald-500 transition-all"
              onClick={() => setActiveTab('testemunhos')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Orações Respondidas</p>
                <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold mt-1 text-emerald-700 dark:text-emerald-400">{answeredCount}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              <PartyPopper className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {setupRequired ? (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="text-lg">Configure o banco de dados</CardTitle>
            <CardDescription>
              Execute o script <code className="text-xs">supabase/prayer_requests.sql</code> no SQL Editor do Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={loadRequests}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Navegação por Abas */
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full space-y-6">
          <TabsList className="grid grid-cols-2 w-full max-w-lg mx-auto h-12 p-1.5 bg-muted/70 rounded-2xl shadow-inner">
            <TabsTrigger
              value="pedidos"
              className="flex items-center gap-2 text-sm font-semibold rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <HandHeart className="h-4 w-4" />
              <span>Pedidos de Oração</span>
              <Badge variant="secondary" className="ml-1 text-xs px-2 py-0">
                {pendingCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="testemunhos"
              className="flex items-center gap-2 text-sm font-semibold rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white shadow-sm"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Mural de Testemunhos</span>
              <Badge
                variant="outline"
                className="ml-1 text-xs px-2 py-0 border-emerald-300 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              >
                {answeredCount}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* ======================================================== */}
          {/* ABA 1: PEDIDOS DE ORAÇÃO                                  */}
          {/* ======================================================== */}
          <TabsContent value="pedidos" className="space-y-6">
            {/* Card de Nova Solicitação */}
            <Card className="rounded-2xl shadow-xs border-border/80">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      {formMode === 'pedido' ? (
                        <>
                          <HandHeart className="h-5 w-5 text-primary" />
                          Nova Solicitação de Oração
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          Compartilhar Testemunho de Resposta
                        </>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {formMode === 'pedido'
                        ? 'Compartilhe sua necessidade para que a igreja se una em intercessão.'
                        : 'Celebre a resposta que Deus concedeu ao seu clamor ou ao de um irmão.'}
                    </CardDescription>
                  </div>

                  {/* Alternador de Modo no Formulário */}
                  <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl self-start sm:self-auto">
                    <Button
                      type="button"
                      size="sm"
                      variant={formMode === 'pedido' ? 'default' : 'ghost'}
                      className="h-8 text-xs rounded-lg"
                      onClick={() => setFormMode('pedido')}
                    >
                      <HandHeart className="h-3.5 w-3.5 mr-1" /> Pedido
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={formMode === 'testemunho' ? 'default' : 'ghost'}
                      className={`h-8 text-xs rounded-lg ${formMode === 'testemunho' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                      onClick={() => setFormMode('testemunho')}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-300" /> Testemunho
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Linha 1: Solicitante e Contato */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="requesterName" className="flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {formMode === 'testemunho' ? 'Nome de quem testemunha' : 'Solicitante'}
                      </Label>
                      <Input
                        id="requesterName"
                        placeholder="Nome completo"
                        value={requesterName}
                        onChange={(e) => setRequesterName(e.target.value)}
                        disabled={isAnonymous}
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact" className="flex items-center gap-2 text-sm font-medium">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        Contato (opcional)
                      </Label>
                      <Input
                        id="contact"
                        placeholder="Telefone ou WhatsApp"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                        disabled={isAnonymous}
                        className="h-10 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Linha 2: Categoria, Responsável e Data de Retorno */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category" className="flex items-center gap-2 text-sm font-medium">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        Categoria
                      </Label>
                      <Select value={category} onValueChange={(val) => setCategory(val as any)}>
                        <SelectTrigger id="category" className="h-10 rounded-xl">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="saude">Saúde & Cura</SelectItem>
                          <SelectItem value="familia">Família & Casamento</SelectItem>
                          <SelectItem value="financeiro">Financeiro & Emprego</SelectItem>
                          <SelectItem value="espiritual">Espiritual & Salvação</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formMode === 'pedido' ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="assignedTo" className="flex items-center gap-2 text-sm font-medium">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            Intercessor / Responsável
                          </Label>
                          <Select value={assignedTo} onValueChange={(val) => setAssignedTo(val)}>
                            <SelectTrigger id="assignedTo" className="h-10 rounded-xl">
                              <SelectValue placeholder="Selecione um líder..." />
                            </SelectTrigger>
                            <SelectContent>
                              {members.length === 0 ? (
                                <div className="p-3 text-xs text-muted-foreground text-center">
                                  Nenhum membro cadastrado
                                </div>
                              ) : (
                                members.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="returnDate" className="flex items-center gap-2 text-sm font-medium">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            Data de Retorno
                          </Label>
                          <Input
                            id="returnDate"
                            type="date"
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            className="h-10 rounded-xl"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="sm:col-span-2 space-y-2">
                        <Label className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                          <Sparkles className="h-4 w-4" />
                          Ambiente de Testemunho
                        </Label>
                        <div className="h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center px-3 text-xs text-emerald-800 dark:text-emerald-300">
                          Este testemunho será destacado no Mural de Testemunhos como oração respondida.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pedido de Oração */}
                  <div className="space-y-2">
                    <Label htmlFor="content" className="flex items-center gap-2 text-sm font-medium">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      {formMode === 'testemunho' ? 'Motivo da Oração que Deus Respondeu' : 'Pedido de Oração'}
                    </Label>
                    <Textarea
                      id="content"
                      placeholder={
                        formMode === 'testemunho'
                          ? 'Ex: Oração pela saúde de um familiar, aprovação em concurso, restauração do matrimônio...'
                          : 'Descreva seu pedido de oração em detalhes para que possamos clamar juntos...'
                      }
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={3}
                      className="resize-y rounded-xl"
                      maxLength={1000}
                    />
                  </div>

                  {/* Testemunho / Resposta */}
                  {formMode === 'testemunho' ? (
                    <div className="space-y-2 p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300/60 dark:border-emerald-800">
                      <Label htmlFor="testimony" className="flex items-center gap-2 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                        <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Relato do Testemunho (Como Deus agiu?)
                      </Label>
                      <Textarea
                        id="testimony"
                        placeholder="Compartilhe com gratidão o milagre, cura, livramento ou resposta concedida pelo Senhor..."
                        value={testimony}
                        onChange={(e) => setTestimony(e.target.value)}
                        rows={4}
                        className="resize-y rounded-xl bg-background"
                        maxLength={1000}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="testimony" className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <ClipboardList className="h-4 w-4" />
                        Testemunho prévio (se a oração já tiver resposta)
                      </Label>
                      <Textarea
                        id="testimony"
                        placeholder="Se esta oração já começou a ser respondida, relate aqui (opcional)..."
                        value={testimony}
                        onChange={(e) => setTestimony(e.target.value)}
                        rows={2}
                        className="resize-y rounded-xl"
                        maxLength={500}
                      />
                    </div>
                  )}

                  {/* Checkbox Anônimo */}
                  <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl">
                    <Checkbox
                      id="anonymous"
                      checked={isAnonymous}
                      onCheckedChange={(c) => setIsAnonymous(!!c)}
                    />
                    <Label htmlFor="anonymous" className="text-sm cursor-pointer text-muted-foreground">
                      Publicar como anônimo (ocultar solicitante e contato)
                    </Label>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      type="submit"
                      disabled={sending || !content.trim()}
                      className={`w-full sm:w-auto rounded-xl px-6 ${
                        formMode === 'testemunho' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                      }`}
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : formMode === 'testemunho' ? (
                        <Sparkles className="h-4 w-4 mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {formMode === 'testemunho' ? 'Publicar Testemunho no Mural' : 'Enviar Pedido de Oração'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Lista de Pedidos de Oração com Filtros */}
            <Card className="rounded-2xl shadow-xs border-border/80">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">Pedidos de Oração</CardTitle>
                    <CardDescription>
                      Novas solicitações aparecem automaticamente em tempo real.
                    </CardDescription>
                  </div>
                </div>

                {/* Barra de Filtros e Busca */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou pedido..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 rounded-xl text-sm"
                    />
                  </div>

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-9 rounded-xl text-sm">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as categorias</SelectItem>
                      <SelectItem value="saude">Saúde & Cura</SelectItem>
                      <SelectItem value="familia">Família</SelectItem>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                      <SelectItem value="espiritual">Espiritual</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 rounded-xl text-sm">
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os status</SelectItem>
                      <SelectItem value="pendente">Em aberto (Pendentes)</SelectItem>
                      <SelectItem value="em_oracao">Em intercessão</SelectItem>
                      <SelectItem value="respondido">Respondidas ✨</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Carregando pedidos de oração...</p>
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <EmptyState
                    icon={HandHeart}
                    title="Nenhuma solicitação encontrada"
                    description={
                      searchQuery || categoryFilter !== 'todas' || statusFilter !== 'todos'
                        ? 'Nenhum pedido corresponde aos filtros aplicados.'
                        : 'Seja o primeiro a compartilhar um pedido de oração.'
                    }
                  />
                ) : (
                  <ScrollArea className="h-[520px] pr-4">
                    <div className="space-y-4">
                      {filteredRequests.map((req) => {
                        const hasTestimony = !!req.testimony?.trim() || req.status === 'respondido';
                        const catConfig = CATEGORY_CONFIG[req.category || 'outros'] || CATEGORY_CONFIG.outros;

                        return (
                          <div
                            key={req.id}
                            className={`p-5 rounded-2xl border transition-all ${
                              hasTestimony
                                ? 'border-emerald-300/70 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10 hover:border-emerald-400'
                                : 'border-border/80 bg-card hover:border-primary/40'
                            }`}
                          >
                            {/* Cabeçalho do Card */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-border/50">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className={`text-xs ${catConfig.badgeClass}`}>
                                  {catConfig.label}
                                </Badge>

                                {hasTestimony ? (
                                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs">
                                    <Sparkles className="h-3 w-3 text-amber-300" /> Oração Respondida
                                  </Badge>
                                ) : req.status === 'em_oracao' ? (
                                  <Badge variant="outline" className="bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border-sky-300 gap-1 text-xs">
                                    <Clock className="h-3 w-3" /> Em Intercessão
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-300 text-xs">
                                    Pendente
                                  </Badge>
                                )}
                              </div>

                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: ptBR })}
                              </span>
                            </div>

                            {/* Conteúdo do Pedido */}
                            <p className="text-foreground text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal">
                              {req.content}
                            </p>

                            {/* Detalhes extras se houver (Intercessor ou Data Retorno) */}
                            {(req.assigned_to_name || req.return_date) && (
                              <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 text-xs text-muted-foreground">
                                {req.assigned_to_name && (
                                  <span className="inline-flex items-center gap-1">
                                    <User className="h-3.5 w-3.5" /> Intercessor: {req.assigned_to_name}
                                  </span>
                                )}
                                {req.return_date && (
                                  <span className="inline-flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" /> Retorno:{' '}
                                    {format(new Date(req.return_date), 'dd/MM/yyyy')}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Bloco de Testemunho se Existir */}
                            {req.testimony && req.testimony.trim() && (
                              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-100/60 to-teal-50/60 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-300/80 dark:border-emerald-800">
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                    Testemunho da Resposta de Deus:
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-900"
                                    onClick={() => openTestimonyModal(req)}
                                  >
                                    <Pencil className="h-3 w-3 mr-1" /> Editar
                                  </Button>
                                </div>
                                <p className="text-sm text-foreground/90 italic whitespace-pre-wrap">
                                  "{req.testimony}"
                                </p>
                              </div>
                            )}

                            {/* Rodapé e Ações */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-border/50">
                              <span className="text-xs text-muted-foreground font-medium">
                                Por: {req.is_anonymous ? 'Anônimo' : req.requester_name || 'Usuário'}
                                {req.contact && !req.is_anonymous && ` • ${req.contact}`}
                              </span>

                              <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
                                {/* Botão Orei */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-primary hover:text-primary hover:bg-primary/10 h-8 gap-1.5 text-xs rounded-xl"
                                  onClick={() => handlePrayed(req.id)}
                                >
                                  <Heart className={`h-4 w-4 ${req.prayed_count > 0 ? 'fill-primary' : ''}`} />
                                  <span>{req.prayed_count > 0 ? `${req.prayed_count} Orei` : 'Orei'}</span>
                                </Button>

                                {/* Botão para Dar Testemunho se não tiver */}
                                {!req.testimony && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8 rounded-xl border-emerald-300 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 gap-1"
                                    onClick={() => openTestimonyModal(req)}
                                  >
                                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                    <span>Dar Testemunho</span>
                                  </Button>
                                )}

                                {/* Seletor Rápido de Status (para líderes/pastores) */}
                                {canEdit && (
                                  <Select
                                    value={req.status || (req.testimony ? 'respondido' : 'pendente')}
                                    onValueChange={(val: any) => handleStatusChange(req.id, val)}
                                  >
                                    <SelectTrigger className="h-8 w-[115px] text-xs rounded-xl border-border/60">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pendente">Pendente</SelectItem>
                                      <SelectItem value="em_oracao">Em oração</SelectItem>
                                      <SelectItem value="respondido">Respondido ✨</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}

                                {/* Botão Excluir */}
                                {canEdit && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0 rounded-xl"
                                    onClick={() => setDeleteConfirm(req)}
                                    title="Excluir pedido"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ======================================================== */}
          {/* ABA 2: MURAL DE TESTEMUNHOS (AMBIENTE DEDICADO)          */}
          {/* ======================================================== */}
          <TabsContent value="testemunhos" className="space-y-6">
            {/* Banner Celebrativo do Mural */}
            <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-primary p-6 text-white shadow-md relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 opacity-15 pointer-events-none">
                <Sparkles className="w-64 h-64 text-white" />
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold">
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                    Mural de Respostas & Milagres
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Mural de Testemunhos
                  </h2>
                  <p className="text-emerald-50 text-sm leading-relaxed">
                    “Vinde, e ouvi, todos os que temeis a Deus, e eu contarei o que ele tem feito à minha alma.”
                    <span className="block text-xs text-emerald-200 mt-0.5">— Salmos 66:16</span>
                  </p>
                </div>

                <Button
                  onClick={() => openTestimonyModal()}
                  className="bg-white text-emerald-900 hover:bg-white/90 shadow-lg rounded-xl font-semibold gap-2 self-start sm:self-center"
                >
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Compartilhar Testemunho
                </Button>
              </div>
            </div>

            {/* Filtros do Mural */}
            <Card className="rounded-2xl shadow-xs border-border/80">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar testemunhos e respostas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-10 rounded-xl text-sm"
                    />
                  </div>

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="h-10 rounded-xl text-sm">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as categorias</SelectItem>
                      <SelectItem value="saude">Saúde & Cura</SelectItem>
                      <SelectItem value="familia">Família</SelectItem>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                      <SelectItem value="espiritual">Espiritual</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Grade de Testemunhos */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-sm text-muted-foreground">Carregando testemunhos...</p>
              </div>
            ) : filteredTestimonies.length === 0 ? (
              <Card className="rounded-2xl border-dashed border-2 p-8 text-center bg-card/60">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 w-fit mx-auto">
                    <PartyPopper className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">O Mural de Testemunhos está pronto!</h3>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Quando Deus responder à sua oração, compartilhe aqui para inspirar a fé de todos os irmãos.
                    </p>
                  </div>
                  <Button
                    onClick={() => openTestimonyModal()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2"
                  >
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    Publicar o Primeiro Testemunho
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredTestimonies.map((item) => {
                  const catConfig = CATEGORY_CONFIG[item.category || 'outros'] || CATEGORY_CONFIG.outros;
                  const displayTestimony = item.testimony || item.content;
                  const originalPrayer = item.testimony ? item.content : null;

                  return (
                    <Card
                      key={item.id}
                      className="rounded-2xl border-emerald-300/60 dark:border-emerald-800/60 bg-gradient-to-br from-card via-card to-emerald-50/20 dark:to-emerald-950/10 shadow-xs hover:shadow-md transition-all overflow-hidden"
                    >
                      <CardContent className="p-6 space-y-4">
                        {/* Header do Testemunho */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs px-2.5 py-0.5 shadow-xs">
                              <Sparkles className="h-3 w-3 text-amber-300" /> Oração Respondida por Deus
                            </Badge>
                            <Badge variant="outline" className={`text-xs ${catConfig.badgeClass}`}>
                              {catConfig.label}
                            </Badge>
                          </div>

                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>

                        {/* Citação do Testemunho em Destaque */}
                        <div className="relative pl-6 pr-2 py-2">
                          <Quote className="absolute left-0 top-1 h-5 w-5 text-emerald-500/50" />
                          <p className="text-base sm:text-lg font-medium text-foreground leading-relaxed italic">
                            "{displayTestimony}"
                          </p>
                        </div>

                        {/* Pedido Original (se houver distinção) */}
                        {originalPrayer && originalPrayer !== displayTestimony && (
                          <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground space-y-1">
                            <span className="font-semibold text-foreground/80 flex items-center gap-1">
                              <HandHeart className="h-3 w-3 text-primary" /> Clamor que foi atendido:
                            </span>
                            <p className="line-clamp-2">{originalPrayer}</p>
                          </div>
                        )}

                        {/* Rodapé e Interações de Celebração */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/50">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                              {item.is_anonymous ? 'A' : (item.requester_name?.[0] || 'U').toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground">
                                {item.is_anonymous ? 'Irmão(ã) em Cristo (Anônimo)' : item.requester_name || 'Membro da Igreja'}
                              </p>
                              <p className="text-[10px] text-muted-foreground">Testemunho de vitória e gratidão</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Botão Glória a Deus! */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-xl border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 gap-1.5 h-9"
                              onClick={() => handleCelebrate(item.id)}
                            >
                              <PartyPopper className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              <span className="font-semibold">Glória a Deus! 🙌</span>
                              {item.prayed_count > 0 && (
                                <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
                                  {item.prayed_count}
                                </Badge>
                              )}
                            </Button>

                            {/* Editar Testemunho */}
                            {(canEdit || user?.id === item.requester_id) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 rounded-xl text-muted-foreground hover:text-foreground"
                                onClick={() => openTestimonyModal(item)}
                                title="Editar testemunho"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}

                            {/* Excluir se tiver permissão */}
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 rounded-xl text-destructive hover:bg-destructive/10"
                                onClick={() => setDeleteConfirm(item)}
                                title="Excluir do mural"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* ======================================================== */}
      {/* MODAL DEDICADO: REGISTRAR / EDITAR TESTEMUNHO DE RESPOSTA */}
      {/* ======================================================== */}
      <Dialog open={testimonyModalOpen} onOpenChange={setTestimonyModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-emerald-700 dark:text-emerald-400">
              <Sparkles className="h-5 w-5 text-amber-400" />
              {selectedRequestForTestimony ? 'Registrar Resposta de Oração' : 'Compartilhar Novo Testemunho'}
            </DialogTitle>
            <DialogDescription>
              Compartilhe como Deus ouviu e respondeu ao clamor. Seu relato edifica e fortalece a fé de toda a igreja!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Se foi aberto diretamente do mural sem pedido pré-selecionado */}
            {!selectedRequestForTestimony && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase">
                    Vincular a um pedido existente da igreja:
                  </Label>
                  <Select value={newTestimonySelectId} onValueChange={setNewTestimonySelectId}>
                    <SelectTrigger className="h-10 rounded-xl text-sm">
                      <SelectValue placeholder="Selecione um pedido ou novo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="novo">+ Criar Novo Testemunho Independente</SelectItem>
                      {requests
                        .filter((r) => !r.testimony)
                        .slice(0, 15)
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.requester_name || 'Anônimo'} - {r.content.substring(0, 45)}...
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {newTestimonySelectId === 'novo' && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Motivo / Título do Testemunho</Label>
                    <Input
                      placeholder="Ex: Cura de enfermidade, aprovação, provisão financeira..."
                      value={directTestimonyTitle}
                      onChange={(e) => setDirectTestimonyTitle(e.target.value)}
                      className="rounded-xl h-10"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Contexto do Pedido Existente */}
            {selectedRequestForTestimony && (
              <div className="p-3.5 rounded-xl bg-muted/50 border border-border/70 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <HandHeart className="h-3.5 w-3.5 text-primary" /> Pedido original:
                </span>
                <p className="text-sm text-foreground italic">"{selectedRequestForTestimony.content}"</p>
                <p className="text-[11px] text-muted-foreground">
                  Solicitado por: {selectedRequestForTestimony.is_anonymous ? 'Anônimo' : selectedRequestForTestimony.requester_name || 'Usuário'}
                </p>
              </div>
            )}

            {/* Campo do Testemunho */}
            <div className="space-y-2">
              <Label htmlFor="testimonyInput" className="text-sm font-semibold flex items-center gap-1.5">
                <Quote className="h-4 w-4 text-emerald-600" />
                Como Deus respondeu a esta oração?
              </Label>
              <Textarea
                id="testimonyInput"
                placeholder="Conte em detalhes a bênção, a cura, a resposta do Senhor, o livramento ou provisão alcançada..."
                value={testimonyInput}
                onChange={(e) => setTestimonyInput(e.target.value)}
                rows={5}
                className="resize-y rounded-xl"
                maxLength={1000}
              />
              <p className="text-right text-[11px] text-muted-foreground">
                {testimonyInput.length}/1000 caracteres
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setTestimonyModalOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTestimony}
              disabled={savingTestimony || !testimonyInput.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1.5"
            >
              {savingTestimony ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1 text-amber-300" />
              )}
              Publicar no Mural de Testemunhos ✨
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação de Exclusão */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(o) => !o && setDeleteConfirm(null)}
        title="Excluir registro de oração"
        description={
          deleteConfirm
            ? `Tem certeza que deseja excluir esta solicitação permanentemente?`
            : ''
        }
        onConfirm={handleDelete}
        confirmLabel="Sim, excluir"
        variant="destructive"
      />
    </div>
  );
}
