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
    AlertCircle
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MAX_CHURCHES = 100;

type TabValue = 'gestao' | 'relatorios' | 'mensalidades';

export default function SuperAdmin() {
    useDocumentTitle('Painel Root - 100 Igrejas');
    const navigate = useNavigate();
    const { switchChurch } = useAuth();
    const [loading, setLoading] = useState(true);
    const [loadingReports, setLoadingReports] = useState(false);
    const [loadingSubs, setLoadingSubs] = useState(false);
    const [churches, setChurches] = useState<Church[]>([]);
    const [report, setReport] = useState<{ churchId: string; churchName: string; slug: string; memberCount: number; userCount: number; createdAt: string }[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [stats, setStats] = useState({ totalChurches: 0, totalMembers: 0, totalUsers: 0 });
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingChurch, setEditingChurch] = useState<Church | null>(null);
    const [activeTab, setActiveTab] = useState<TabValue>('gestao');
    const { toast } = useToast();

    const [formData, setFormData] = useState({ name: '', slug: '', adminEmail: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (activeTab === 'relatorios') loadReports();
        if (activeTab === 'mensalidades') loadSubscriptions();
    }, [activeTab]);

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
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="gestao" className="gap-2">
                        <Building2 className="h-4 w-4" /> Gestão
                    </TabsTrigger>
                    <TabsTrigger value="relatorios" className="gap-2">
                        <BarChart3 className="h-4 w-4" /> Relatórios
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
                                                                <DropdownMenuItem className="text-destructive">
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Suspender
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
                                                <TableHead className="text-right">Usuários</TableHead>
                                                <TableHead>Criado em</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {report.map((r) => (
                                                <TableRow key={r.churchId}>
                                                    <TableCell className="font-medium">{r.churchName}</TableCell>
                                                    <TableCell><code className="text-xs">{r.slug}</code></TableCell>
                                                    <TableCell className="text-right">{r.memberCount}</TableCell>
                                                    <TableCell className="text-right">{r.userCount}</TableCell>
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

                <TabsContent value="mensalidades" className="mt-6">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle>Acompanhamento de Mensalidades</CardTitle>
                            <CardDescription>R$ 150/mês por igreja. Vencimento dia 10 de cada mês.</CardDescription>
                        </CardHeader>
                        <CardContent>
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
                                                <TableHead className="text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {subscriptions.map((sub) => {
                                                const churchName = sub.churches?.name ?? sub.church_name ?? '—';
                                                const churchId = sub.church_id ?? sub.churchId;
                                                const status = sub.status ?? 'ativa';
                                                const nextDue = sub.next_due_at ?? sub.nextDueAt;
                                                return (
                                                    <TableRow key={churchId ?? sub.id ?? Math.random()}>
                                                        <TableCell className="font-medium">{churchName}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={status === 'inadimplente' ? 'destructive' : 'outline'}
                                                                className={status === 'ativa' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}>
                                                                {status === 'ativa' ? 'Adimplente' : status === 'inadimplente' ? 'Inadimplente' : status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right font-semibold">R$ {(sub.plan_amount ?? 150).toFixed(2)}</TableCell>
                                                        <TableCell className="text-muted-foreground text-sm">
                                                            {nextDue ? format(new Date(nextDue), "dd 'de' MMM, yyyy", { locale: ptBR }) : '—'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {churchId && (
                                                                <Button variant="ghost" size="sm" onClick={() => { switchChurch(churchId, churchName); navigate('/dashboard'); }}>
                                                                    <ExternalLink className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                            {subscriptions.length === 0 && !loadingSubs && (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
        </div>
    );
}
