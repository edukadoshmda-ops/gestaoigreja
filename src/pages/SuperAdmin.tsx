import { useState, useEffect } from 'react';
import {
    Building2,
    Users,
    UserCheck,
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    ExternalLink,
    ShieldCheck,
    TrendingUp,
    Loader2,
    BarChart3,
    DollarSign,
    AlertCircle,
    Pause,
    Play,
    Banknote,
    XCircle,
    History,
    Copy,
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/contexts/AuthContext';
import { churchesService, Church } from '@/services/churches.service';
import { SUBSCRIPTION_PIX } from '@/lib/subscriptionConfig';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MAX_CHURCHES = 100;

type TabValue = 'gestao' | 'relatorios' | 'usuarios' | 'mensalidades';

export default function SuperAdmin() {
    useDocumentTitle('Painel Root - 100 Igrejas');
    const navigate = useNavigate();
    const { switchChurch } = useAuth();
    const [loading, setLoading] = useState(true);
    const [loadingReports, setLoadingReports] = useState(false);
    const [loadingSubs, setLoadingSubs] = useState(false);
    const [churches, setChurches] = useState<Church[]>([]);
    const [report, setReport] = useState<{ churchId: string; churchName: string; slug: string; memberCount: number; createdAt: string }[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalChurches: 0, totalMembers: 0, totalUsers: 0 });
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingChurch, setEditingChurch] = useState<Church | null>(null);
    const [activeTab, setActiveTab] = useState<TabValue>('gestao');
    const { toast } = useToast();

    const [formData, setFormData] = useState({ name: '', slug: '', adminEmail: '' });
    const [submitting, setSubmitting] = useState(false);
    const [actionChurchId, setActionChurchId] = useState<string | null>(null);
    const [excludeConfirm, setExcludeConfirm] = useState<{ churchId: string; name: string } | null>(null);
    const [removeChurchConfirm, setRemoveChurchConfirm] = useState<{ id: string; name: string } | null>(null);
    const [historyDialog, setHistoryDialog] = useState<{ churchId: string; churchName: string } | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<{ paid_at: string; amount: number; registered_by_name: string; source: string }[]>([]);

    useEffect(() => {
        loadData();
        loadSubscriptions(); // Carrega assinaturas para ter dados na aba Gestão também
    }, []);

    useEffect(() => {
        if (activeTab === 'relatorios') loadReports();
        if (activeTab === 'mensalidades') loadSubscriptions();
    }, [activeTab]);

    useEffect(() => {
        if (historyDialog) {
            churchesService.getChurchSubscriptionPayments(historyDialog.churchId).then(setPaymentHistory);
        }
    }, [historyDialog]);

    async function loadData() {
        try {
            setLoading(true);
            const [churchesData, statsData] = await Promise.all([
                churchesService.getAll(),
                churchesService.getGlobalStats()
            ]);
            setChurches(churchesData || []);
            setStats(statsData);
        } catch (error) {
            console.error('Erro ao carregar dados root:', error);
            toast({ title: 'Erro', description: 'Não foi possível carregar as informações do painel root.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }

    async function loadReports() {
        try {
            setLoadingReports(true);
            const data = await churchesService.getChurchReport();
            setReport(data);
        } catch (e) {
            toast({ title: 'Erro', description: 'Não foi possível carregar relatórios.', variant: 'destructive' });
        } finally {
            setLoadingReports(false);
        }
    }

    async function loadSubscriptions() {
        try {
            setLoadingSubs(true);
            const data = await churchesService.getSubscriptions();
            setSubscriptions(data);
        } catch (e) {
            toast({ title: 'Erro', description: 'Não foi possível carregar mensalidades.', variant: 'destructive' });
        } finally {
            setLoadingSubs(false);
        }
    }

    async function handleSubscriptionAction(
        churchId: string,
        churchName: string,
        action: 'suspend' | 'resume' | 'registerPayment' | 'exclude'
    ) {
        setActionChurchId(churchId);
        try {
            if (action === 'suspend') {
                await churchesService.suspendChurchSubscription(churchId);
                toast({ title: 'Serviço suspenso', description: `${churchName} — acesso interrompido.` });
            } else if (action === 'resume') {
                await churchesService.resumeChurchSubscription(churchId);
                toast({ title: 'Serviço retomado', description: `${churchName} — acesso liberado.` });
            } else if (action === 'registerPayment') {
                await churchesService.registerPayment(churchId);
                toast({ title: 'Pagamento registrado', description: `${churchName} — sistema ativo até o próximo vencimento.` });
                if (historyDialog?.churchId === churchId) {
                    churchesService.getChurchSubscriptionPayments(churchId).then(setPaymentHistory);
                }
            } else if (action === 'exclude') {
                await churchesService.cancelChurchSubscription(churchId);
                toast({ title: 'Assinatura cancelada', description: `${churchName} — assinatura excluída.` });
                setExcludeConfirm(null);
            }
            loadSubscriptions();
        } catch (e: any) {
            toast({ title: 'Erro', description: e?.message ?? 'Não foi possível executar a ação.', variant: 'destructive' });
        } finally {
            setActionChurchId(null);
        }
    }

    const handleOpenDialog = (church?: Church) => {
        if (church) {
            setEditingChurch(church);
            setFormData({ name: church.name, slug: church.slug, adminEmail: '' });
        } else {
            setEditingChurch(null);
            setFormData({ name: '', slug: '', adminEmail: '' });
        }
        setIsDialogOpen(true);
    };

    const handleRemoveChurch = async () => {
        if (!removeChurchConfirm) return;
        try {
            await churchesService.delete(removeChurchConfirm.id);
            toast({ title: 'Igreja removida', description: `"${removeChurchConfirm.name}" foi excluída da plataforma.` });
            setRemoveChurchConfirm(null);
            loadData();
        } catch (e: any) {
            toast({ title: 'Erro', description: e?.message ?? 'Não foi possível remover a igreja.', variant: 'destructive' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (stats.totalChurches >= MAX_CHURCHES && !editingChurch) {
            toast({ title: 'Limite atingido', description: `A plataforma suporta até ${MAX_CHURCHES} igrejas.`, variant: 'destructive' });
            return;
        }
        try {
            setSubmitting(true);
            if (editingChurch) {
                await churchesService.update(editingChurch.id, formData);
                toast({ title: 'Sucesso', description: 'Igreja atualizada com sucesso.' });
            } else {
                await churchesService.create(formData);
                toast({ title: 'Sucesso', description: 'Nova igreja cadastrada com sucesso.' });
            }
            setIsDialogOpen(false);
            loadData();
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'Ocorreu um problema ao salvar as informações.';
            toast({ title: 'Erro', description: msg, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredChurches = churches.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) || c.slug.toLowerCase().includes(search.toLowerCase())
    );

    const atLimit = stats.totalChurches >= MAX_CHURCHES;
    const canAddChurch = !atLimit;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">
                        Painel Super Admin — 100 Igrejas
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Gestão centralizada, relatórios consolidados e acompanhamento de mensalidades (R$ 150/mês).
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} disabled={!canAddChurch} className="gap-2 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" /> Nova Igreja
                </Button>
            </div>

            {atLimit && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        Limite de {MAX_CHURCHES} igrejas atingido. Novas igrejas podem se cadastrar pela página de vendas após assinatura.
                    </p>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
                    {[1, 2, 3, 4].map(i => <Card key={i} className="h-32 bg-muted/20" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="relative overflow-hidden group border-none shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-primary" /> Igrejas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.totalChurches} <span className="text-lg font-normal text-muted-foreground">/ {MAX_CHURCHES}</span></div>
                            <p className="text-xs text-muted-foreground mt-1">Capacidade da plataforma</p>
                        </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden group border-none shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Users className="h-4 w-4 text-purple-500" /> Membros Totais
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.totalMembers.toLocaleString('pt-BR')}</div>
                            <p className="text-xs text-muted-foreground mt-1">Soma de todas as congregações</p>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden group border-none shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-emerald-500" /> Usuários Ativos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.totalUsers}</div>
                            <p className="text-xs text-muted-foreground mt-1">Contas vinculadas</p>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden group border-none shadow-md">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-blue-500" /> Receita Mensal
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">R$ {(stats.totalChurches * 150).toLocaleString('pt-BR')}</div>
                            <p className="text-xs text-muted-foreground mt-1">R$ 150/igreja × {stats.totalChurches} igrejas</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
                <TabsList className="grid w-full grid-cols-4 max-w-2xl">
                    <TabsTrigger value="gestao" className="gap-2">
                        <Building2 className="h-4 w-4" /> Gestão
                    </TabsTrigger>
                    <TabsTrigger value="relatorios" className="gap-2">
                        <BarChart3 className="h-4 w-4" /> Relatórios
                    </TabsTrigger>
                    <TabsTrigger value="usuarios" className="gap-2">
                        <UserCheck className="h-4 w-4" /> Usuários
                    </TabsTrigger>
                    <TabsTrigger value="mensalidades" className="gap-2">
                        <DollarSign className="h-4 w-4" /> Mensalidades
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="gestao" className="mt-6">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Lista de Igrejas</CardTitle>
                                    <CardDescription>Gerencie as igrejas cadastradas. Novas igrejas se cadastram pela página de vendas.</CardDescription>
                                </div>
                                <div className="relative w-full md:w-72">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Buscar por nome ou slug..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                                    <p className="text-muted-foreground">Carregando igrejas...</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto min-w-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead>Igreja</TableHead>
                                                <TableHead>Slug</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Criado em</TableHead>
                                                <TableHead className="text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredChurches.map((church) => (
                                                <TableRow key={church.id} className="group transition-colors">
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                <Building2 className="h-5 w-5 text-primary" />
                                                            </div>
                                                            <span className="font-semibold">{church.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <code className="px-2 py-1 bg-muted rounded text-xs font-mono">{church.slug}</code>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400">Ativa</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {format(new Date(church.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-56">
                                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem onClick={() => handleOpenDialog(church)}>
                                                                    <Edit className="mr-2 h-4 w-4" /> Editar
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => { switchChurch(church.id, church.name); navigate('/dashboard'); }}>
                                                                    <ExternalLink className="mr-2 h-4 w-4" /> Acessar Painel
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => handleSubscriptionAction(church.id, church.name, 'registerPayment')}
                                                                    disabled={actionChurchId === church.id}
                                                                >
                                                                    {actionChurchId === church.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Banknote className="mr-2 h-4 w-4" />}
                                                                    Confirmar pagamento
                                                                </DropdownMenuItem>
                                                                {(() => {
                                                                    const sub = subscriptions.find((s) => (s.church_id ?? s.churchId) === church.id);
                                                                    const status = sub?.status ?? 'ativa';
                                                                    const isActive = status === 'ativa' || status === 'trial';
                                                                    const isSuspended = status === 'suspensa' || status === 'inadimplente';
                                                                    if (isActive) return (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleSubscriptionAction(church.id, church.name, 'suspend')}
                                                                        disabled={actionChurchId === church.id}
                                                                    >
                                                                        {actionChurchId === church.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pause className="mr-2 h-4 w-4" />}
                                                                        Desativar serviço
                                                                    </DropdownMenuItem>
                                                                );
                                                                    if (isSuspended) return (
                                                                    <DropdownMenuItem
                                                                        onClick={() => handleSubscriptionAction(church.id, church.name, 'resume')}
                                                                        disabled={actionChurchId === church.id}
                                                                    >
                                                                        {actionChurchId === church.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                                                        Ativar serviço
                                                                    </DropdownMenuItem>
                                                                    );
                                                                    return null;
                                                                })()}
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => setRemoveChurchConfirm({ id: church.id, name: church.name })}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Remover Igreja
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredChurches.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhuma igreja encontrada.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="relatorios" className="mt-6">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle>Relatório Consolidado</CardTitle>
                            <CardDescription>Membros e usuários por igreja.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingReports ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead>Igreja</TableHead>
                                                <TableHead>Slug</TableHead>
                                                <TableHead className="text-right">Membros</TableHead>
                                                <TableHead>Criado em</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {report.map((r) => (
                                                <TableRow key={r.churchId}>
                                                    <TableCell className="font-medium">{r.churchName}</TableCell>
                                                    <TableCell><code className="text-xs">{r.slug}</code></TableCell>
                                                    <TableCell className="text-right">{r.memberCount}</TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">
                                                        {format(new Date(r.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {report.length === 0 && !loadingReports && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Nenhum dado encontrado.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="usuarios" className="mt-6">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle>Usuários Ativos</CardTitle>
                            <CardDescription>Gerencie as contas vinculadas à plataforma.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-full mb-4">
                                <UserCheck className="h-10 w-10 text-emerald-500" />
                            </div>
                            <h3 className="text-lg font-medium">Contas Vinculadas</h3>
                            <p className="text-muted-foreground max-w-sm mt-2">
                                Esta aba está limpa e pronta para receber a gestão de usuários.
                            </p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="mensalidades" className="mt-6">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle>Acompanhamento de Mensalidades</CardTitle>
                            <CardDescription>7 dias grátis para testar. Hotmart vende o app. Mensalidades via PIX direto. 50 primeiras igrejas: R$ 75/mês. Demais: R$ 150/mês. Vencimento 30 dias + 5 de tolerância; após isso, suspensão.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Card className="border-primary/30 bg-primary/5">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <DollarSign className="h-5 w-5" />
                                        Pagamento via PIX (mensalidades)
                                    </CardTitle>
                                    <CardDescription>
                                        Instruções para as igrejas: 1) Informe o nome da igreja no PIX antes de pagar. 2) Envie o comprovante para gestaoigreja@gmail.com. Após receber, registre o pagamento no botão abaixo.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm">
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <p><strong>Chave PIX (CNPJ):</strong> <span className="font-mono bg-muted px-2 py-1 rounded">{SUBSCRIPTION_PIX.cnpj}</span>
                                            <Button variant="ghost" size="sm" className="ml-2 h-7" onClick={() => { navigator.clipboard?.writeText(SUBSCRIPTION_PIX.pixKey); toast({ title: 'Chave PIX copiada!', duration: 2000 }); }}>
                                                <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                                            </Button>
                                            </p>
                                            <p><strong>Titular:</strong> {SUBSCRIPTION_PIX.holderName}</p>
                                            <p><strong>Banco:</strong> {SUBSCRIPTION_PIX.bankId} {SUBSCRIPTION_PIX.bank}</p>
                                            <p><strong>Agência / Conta:</strong> {SUBSCRIPTION_PIX.agency} / {SUBSCRIPTION_PIX.account}</p>
                                            <p><strong>CNPJ:</strong> {SUBSCRIPTION_PIX.cnpj}</p>
                                        </div>
                                        <div className="text-muted-foreground border-l pl-6 border-primary/10">
                                            <p className="font-bold text-foreground mb-2">Resumo de Assinatura:</p>
                                            <p>• {SUBSCRIPTION_PIX.promoSlots} primeiras igrejas: R$ {SUBSCRIPTION_PIX.promoPrice}/mês</p>
                                            <p>• Demais igrejas: R$ {SUBSCRIPTION_PIX.fullPrice}/mês</p>
                                            <p className="mt-4 text-[11px]">As igrejas veem esses dados no Dashboard e devem enviar o comprovante para ativação manual ou via webhook.</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            {loadingSubs ? (
                                <div className="flex items-center justify-center py-20">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead>Igreja</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Valor</TableHead>
                                                <TableHead>Próximo vencimento</TableHead>
                                                <TableHead>Último pagamento</TableHead>
                                                <TableHead className="text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {subscriptions.map((sub) => {
                                                const churchName = sub.churches?.name ?? sub.church_name ?? '—';
                                                const churchId = sub.church_id ?? sub.churchId;
                                                const status = sub.status ?? 'ativa';
                                                const nextDue = sub.next_due_at ?? sub.nextDueAt;
                                                const isActive = status === 'ativa' || status === 'trial';
                                                const isSuspended = status === 'suspensa' || status === 'inadimplente';
                                                const isCanceled = status === 'cancelada';
                                                const loading = actionChurchId === churchId;
                                                const statusLabel = status === 'ativa' ? 'Adimplente' : status === 'inadimplente' ? 'Inadimplente' : status === 'suspensa' ? 'Suspensa' : status === 'cancelada' ? 'Cancelada' : status;
                                                return (
                                                    <TableRow key={churchId ?? sub.id ?? Math.random()}>
                                                        <TableCell className="font-medium">{churchName}</TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={isSuspended || isCanceled ? 'destructive' : 'outline'}
                                                                className={isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}>
                                                                {statusLabel}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold">R$ {(sub.plan_amount ?? 150).toFixed(2)}</TableCell>
                                                        <TableCell className="text-muted-foreground text-sm">
                                                            {nextDue ? format(new Date(nextDue), "dd 'de' MMM, yyyy", { locale: ptBR }) : '—'}
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-sm">
                                                            {sub.last_payment_at ? format(new Date(sub.last_payment_at), "dd/MM/yyyy", { locale: ptBR }) : '—'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {churchId && (
                                                                <div className="flex items-center justify-end gap-1">
                                                                    <Button variant="ghost" size="sm" onClick={() => { switchChurch(churchId, churchName); navigate('/dashboard'); }} title="Acessar igreja">
                                                                        <ExternalLink className="h-4 w-4" />
                                                                    </Button>
                                                                    {!isCanceled && (
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button variant="ghost" size="sm" disabled={loading}>
                                                                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end">
                                                                                <DropdownMenuLabel>Ações manuais</DropdownMenuLabel>
                                                                                <DropdownMenuSeparator />
                                                                                <DropdownMenuItem onClick={() => setHistoryDialog({ churchId, churchName })} disabled={loading}>
                                                                                    <History className="h-4 w-4 mr-2" />
                                                                                    Ver histórico de pagamentos
                                                                                </DropdownMenuItem>
                                                                                <DropdownMenuSeparator />
                                                                                <DropdownMenuItem onClick={() => handleSubscriptionAction(churchId, churchName, 'registerPayment')} disabled={loading}>
                                                                                    <Banknote className="h-4 w-4 mr-2" />
                                                                                    Registrar pagamento
                                                                                </DropdownMenuItem>
                                                                                {isActive && (
                                                                                    <DropdownMenuItem onClick={() => handleSubscriptionAction(churchId, churchName, 'suspend')} disabled={loading}>
                                                                                        <Pause className="h-4 w-4 mr-2" />
                                                                                        Suspender
                                                                                    </DropdownMenuItem>
                                                                                )}
                                                                                {isSuspended && (
                                                                                    <DropdownMenuItem onClick={() => handleSubscriptionAction(churchId, churchName, 'resume')} disabled={loading}>
                                                                                        <Play className="h-4 w-4 mr-2" />
                                                                                        Retomar serviço
                                                                                    </DropdownMenuItem>
                                                                                )}
                                                                                <DropdownMenuSeparator />
                                                                                <DropdownMenuItem onClick={() => setExcludeConfirm({ churchId, name: churchName })} disabled={loading} className="text-destructive focus:text-destructive">
                                                                                    <XCircle className="h-4 w-4 mr-2" />
                                                                                    Excluir / Cancelar assinatura
                                                                                </DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            {subscriptions.length === 0 && !loadingSubs && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                        Execute o script <code className="text-xs">supabase/church_subscriptions.sql</code> no Supabase para habilitar o acompanhamento automático.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="w-screen h-screen sm:w-[95vw] sm:max-w-[425px] sm:h-auto overflow-y-auto p-4 sm:p-6 rounded-none sm:rounded-lg">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingChurch ? 'Editar Igreja' : 'Cadastrar Nova Igreja'}</DialogTitle>
                            <DialogDescription>
                                Configure os dados básicos da igreja. Igrejas também podem se cadastrar automaticamente pela página de vendas.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nome da Igreja</label>
                                <Input required placeholder="Ex: Igreja Central" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Slug / URL Amigável</label>
                                <Input required placeholder="Ex: igreja-central" value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} />
                                <p className="text-[10px] text-muted-foreground">Identificador único. Não pode repetir.</p>
                            </div>
                            {!editingChurch && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">E-mail do Administrador Inicial</label>
                                    <Input type="email" placeholder="Ex: pastor@igreja.com" value={formData.adminEmail}
                                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })} />
                                    <p className="text-[10px] text-muted-foreground">Se existir, será vinculado como Admin.</p>
                                </div>
                            )}
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex gap-3 border border-amber-200 dark:border-amber-900">
                                <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
                                <p className="text-xs text-amber-800 dark:text-amber-400">
                                    Plataforma para até {MAX_CHURCHES} igrejas. Novas igrejas podem se cadastrar pela página de vendas e pagamento (R$ 150/mês).
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {editingChurch ? 'Salvar' : 'Criar Igreja'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!excludeConfirm}
                onOpenChange={(o) => !o && setExcludeConfirm(null)}
                title="Excluir / Cancelar assinatura"
                description={excludeConfirm ? `Tem certeza que deseja cancelar a assinatura de "${excludeConfirm.name}"? O serviço será interrompido.` : ''}
                onConfirm={() => excludeConfirm && handleSubscriptionAction(excludeConfirm.churchId, excludeConfirm.name, 'exclude')}
                confirmLabel="Sim, cancelar"
                variant="destructive"
            />

            <ConfirmDialog
                open={!!removeChurchConfirm}
                onOpenChange={(o) => !o && setRemoveChurchConfirm(null)}
                title="Remover Igreja"
                description={removeChurchConfirm ? `Tem certeza que deseja remover "${removeChurchConfirm.name}" da plataforma? Esta ação é irreversível e excluirá a igreja e seus dados vinculados.` : ''}
                onConfirm={handleRemoveChurch}
                confirmLabel="Sim, remover"
                variant="destructive"
            />

            <Dialog open={!!historyDialog} onOpenChange={(o) => !o && setHistoryDialog(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Histórico de pagamentos</DialogTitle>
                        <DialogDescription>
                            {historyDialog ? `${historyDialog.churchName} — quem pagou e quando` : ''}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto">
                        {paymentHistory.length === 0 ? (
                            <p className="text-muted-foreground text-sm py-4 text-center">Nenhum pagamento registrado ainda.</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                        <TableHead>Registrado por</TableHead>
                                        <TableHead>Origem</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paymentHistory.map((p, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-sm">{p.paid_at ? format(new Date(p.paid_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '—'}</TableCell>
                                            <TableCell className="text-right font-medium">R$ {Number(p.amount).toFixed(2)}</TableCell>
                                            <TableCell className="text-sm">{p.registered_by_name || '—'}</TableCell>
                                            <TableCell className="text-sm capitalize">{p.source === 'manual' ? 'Manual' : p.source}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
