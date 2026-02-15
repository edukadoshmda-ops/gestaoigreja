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
    Loader2
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
    DialogTrigger,
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
import { useToast } from '@/hooks/use-toast';
import { churchesService, Church } from '@/services/churches.service';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function SuperAdmin() {
    const [loading, setLoading] = useState(true);
    const [churches, setChurches] = useState<Church[]>([]);
    const [stats, setStats] = useState({ totalChurches: 0, totalMembers: 0, totalUsers: 0 });
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingChurch, setEditingChurch] = useState<Church | null>(null);
    const { toast } = useToast();

    // Form State
    const [formData, setFormData] = useState({ name: '', slug: '', adminEmail: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

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
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar as informações do painel root.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    const handleOpenDialog = (church?: Church) => {
        if (church) {
            setEditingChurch(church);
            setFormData({ name: church.name, slug: church.slug });
        } else {
            setEditingChurch(null);
            setFormData({ name: '', slug: '', adminEmail: '' });
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
        } catch (error) {
            console.error('Erro ao salvar igreja:', error);
            toast({
                title: 'Erro',
                description: 'Ocorreu um problema ao salvar as informações.',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredChurches = churches.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary">
                        Painel Administrativo Root
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Gestão centralizada de tenants e monitoramento global da plataforma.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()} className="gap-2 shadow-lg shadow-primary/20">
                    <Plus className="h-4 w-4" /> Nova Igreja
                </Button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="h-32 bg-muted/20" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="relative overflow-hidden group border-none shadow-md bg-white dark:bg-slate-900">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Building2 className="h-20 w-20 text-blue-500" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-blue-500" /> Total de Igrejas
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.totalChurches}</div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-emerald-500" /> +1 este mês
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden group border-none shadow-md bg-white dark:bg-slate-900">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Users className="h-20 w-20 text-purple-500" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Users className="h-4 w-4 text-purple-500" /> Membros Totais
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.totalMembers}</div>
                            <p className="text-xs text-muted-foreground mt-1">Soma de todas as congregações</p>
                        </CardContent>
                    </Card>

                    <Card className="relative overflow-hidden group border-none shadow-md bg-white dark:bg-slate-900">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <UserCheck className="h-20 w-20 text-emerald-500" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-emerald-500" /> Usuários Ativos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.totalUsers}</div>
                            <p className="text-xs text-muted-foreground mt-1">Contas vinculadas via Profile</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card className="border-none shadow-md">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Lista de Tenants</CardTitle>
                            <CardDescription>Visualize e gerencie as configurações de cada igreja.</CardDescription>
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nome ou slug..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                            <p className="text-muted-foreground">Carregando tenants...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto min-w-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead>Igreja</TableHead>
                                    <TableHead>Slug / URL</TableHead>
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
                                                <div className="h-10 w-10 rounded-lg bg-white border border-primary/20 flex items-center justify-center">
                                                    <Building2 className="h-5 w-5 text-primary" />
                                                </div>
                                                <span className="font-semibold">{church.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                                                {church.slug}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400">
                                                Ativa
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(church.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56">
                                                    <DropdownMenuLabel>Ações Administrativas</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleOpenDialog(church)}>
                                                        <Edit className="mr-2 h-4 w-4" /> Editar Configurações
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem>
                                                        <ExternalLink className="mr-2 h-4 w-4" /> Acessar Painel
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Suspender Acesso
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredChurches.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            Nenhuma igreja encontrada.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="w-screen h-screen sm:w-[95vw] sm:max-w-[425px] sm:h-auto overflow-y-auto p-4 sm:p-6 rounded-none sm:rounded-lg">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>{editingChurch ? 'Editar Igreja' : 'Cadastrar Nova Igreja'}</DialogTitle>
                            <DialogDescription>
                                Configure os dados básicos da igreja para o provisionamento imediato.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nome da Igreja</label>
                                <Input
                                    required
                                    placeholder="Ex: Igreja Central"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Slug / URL Amigável</label>
                                <Input
                                    required
                                    placeholder="Ex: igreja-central"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    Identificador único usado para subdomínios e rotas.
                                </p>
                            </div>
                            {!editingChurch && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">E-mail do Administrador Inicial</label>
                                    <Input
                                        type="email"
                                        placeholder="Ex: pastor@igreja.com"
                                        value={formData.adminEmail}
                                        onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                    />
                                    <p className="text-[10px] text-muted-foreground">
                                        Se o usuário já existir, ele será vinculado a esta igreja com cargo Admin.
                                    </p>
                                </div>
                            )}
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex gap-3 border border-amber-200 dark:border-amber-900">
                                <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
                                <p className="text-xs text-amber-800 dark:text-amber-400">
                                    Ao criar uma igreja, o sistema prepara automaticamente o ambiente RLS isolado para este novo tenant.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {editingChurch ? 'Salvar Alterações' : 'Criar Igreja'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
