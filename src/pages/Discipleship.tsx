import { useState, useEffect } from 'react';
import {
    Heart, Users, Calendar, Plus, Search,
    ChevronRight, Loader2, CheckCircle2, XCircle, Clock,
    UserPlus, MessageSquare, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { discipleshipService } from '@/services/discipleship.service';
import { membersService } from '@/services/members.service';
import { Member } from '@/types';
import { EmptyState } from '@/components/EmptyState';

export default function Discipleship() {
    useDocumentTitle('Discipulado');
    const [discipleships, setDiscipleships] = useState<any[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
    const [stats, setStats] = useState({ active: 0, completed: 0, total: 0 });
    const [error, setError] = useState<string | null>(null);

    const { user, churchId } = useAuth();
    const effectiveChurchId = churchId ?? user?.churchId;
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, [effectiveChurchId]);

    async function loadData() {
        try {
            setError(null);
            setLoading(true);
            const [dsData, membersData, statsData] = await Promise.all([
                discipleshipService.getAll(),
                membersService.getAll(effectiveChurchId),
                discipleshipService.getStatistics().catch(() => ({ active: 0, completed: 0, total: 0 }))
            ]);

            setDiscipleships(dsData || []);
            setMembers(membersData as any || []);
            setStats(statsData as any);
        } catch (err: any) {
            console.error('Error loading data:', err);
            setDiscipleships([]);
            setMembers([]);
            const msg = err?.message || '';
            const isSessionOrPerm = /session|permission|RLS|401|403|PGRST/i.test(msg) || msg.includes('fetch');
            setError(isSessionOrPerm ? 'Sessão expirada ou sem permissão.' : (msg || 'Não foi possível carregar.'));
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar os dados de discipulado.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    const handleCreateDiscipleship = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        try {
            if (!user?.churchId) throw new Error('Igreja não identificada.');

            await discipleshipService.create({
                disciple_id: formData.get('disciple_id'),
                mentor_id: formData.get('mentor_id'),
                start_date: formData.get('start_date'),
                status: 'em_andamento',
                notes: formData.get('notes'),
            }, user.churchId);

            setIsNewDialogOpen(false);
            loadData();
            toast({ title: 'Discipulado iniciado!', description: 'O novo vínculo de discipulado foi criado.' });
        } catch (error: any) {
            toast({ title: 'Erro ao iniciar', description: error.message, variant: 'destructive' });
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await discipleshipService.update(id, {
                status,
                end_date: status !== 'em_andamento' ? new Date().toISOString().split('T')[0] : null
            });
            loadData();
            toast({ title: 'Status atualizado', description: `O discipulado foi marcado como ${status.replace('_', ' ')}.` });
        } catch (error: any) {
            toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
        }
    };

    const GROWTH_STAGES: { id: string; label: string; icon?: React.ComponentType<{ className?: string }> }[] = [
        { id: 'batismo', label: 'Batismo' },
        { id: 'curso', label: 'Curso de Membro', icon: Info },
        { id: 'encontro', label: 'Encontro', icon: Users },
        { id: 'escola', label: 'Escola de Líderes', icon: ChevronRight },
        { id: 'lider', label: 'Líder de Célula', icon: CheckCircle2 }
    ];

    const getGrowthTrack = (notes: string | null) => {
        if (!notes) return [];
        const match = notes.match(/\[TRACK\]:(.*)\[\/TRACK\]/);
        if (match) {
            try { return JSON.parse(match[1]); } catch (e) { return []; }
        }
        return [];
    };

    const handleToggleStage = async (ds: any, stageId: string) => {
        const currentTrack = getGrowthTrack(ds.notes);
        let newTrack;
        if (currentTrack.includes(stageId)) {
            newTrack = currentTrack.filter((id: string) => id !== stageId);
        } else {
            newTrack = [...currentTrack, stageId];
        }

        const cleanNotes = (ds.notes || '').replace(/\[TRACK\]:.*\[\/TRACK\]/, '').trim();
        const newNotes = `[TRACK]:${JSON.stringify(newTrack)}[/TRACK] ${cleanNotes}`;

        try {
            await discipleshipService.update(ds.id, { notes: newNotes });
            loadData();
            toast({ title: 'Progresso salvo!', description: 'A trilha de crescimento foi atualizada.' });
        } catch (error: any) {
            toast({ title: 'Erro ao salvar progresso', description: error.message, variant: 'destructive' });
        }
    };

    if (error && discipleships.length === 0 && !loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12">
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => loadData()}>Tentar novamente</Button>
            </div>
        );
    }
    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header Premium */}
            <div className="bg-white p-8 rounded-3xl border border-primary/20 overflow-hidden relative group shadow-sm">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-40 h-40 bg-primary/5 rounded-full blur-3xl transition-colors duration-500" />
                <div className="relative">
                    <h1 className="text-4xl font-extrabold tracking-tight text-primary">Cuidado & Discipulado</h1>
                    <p className="text-muted-foreground mt-2 text-lg max-w-2xl">
                        Acompanhe o amadurecimento espiritual dos membros através do relacionamento 1-para-1.
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
                <Card className="bg-card border-primary/10">
                    <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Em Andamento</p>
                            <h3 className="text-3xl font-bold text-primary">{stats.active}</h3>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Clock className="h-6 w-6 text-primary" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-green-500/10">
                    <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                            <h3 className="text-3xl font-bold text-green-600">{stats.completed}</h3>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-2xl">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-secondary/10">
                    <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Histórico</p>
                            <h3 className="text-3xl font-bold text-secondary">{stats.total}</h3>
                        </div>
                        <div className="p-3 bg-secondary/10 rounded-2xl">
                            <Users className="h-6 w-6 text-secondary" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-between items-center px-2">
                <h2 className="text-xl font-bold">Acompanhamento Ativo</h2>
                <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-primary-foreground hover:shadow-lg transition-all">
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Discipulado
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="w-screen h-screen sm:w-[95vw] sm:max-w-md sm:h-auto sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-none sm:rounded-lg">
                        <form onSubmit={handleCreateDiscipleship}>
                            <DialogHeader>
                                <DialogTitle>Iniciar Novo Discipulado</DialogTitle>
                                <DialogDescription>Conecte um mentor a um novo discípulo</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Mentor (Quem cuida)</Label>
                                    <Select name="mentor_id" required>
                                        <SelectTrigger><SelectValue placeholder="Selecione o mentor..." /></SelectTrigger>
                                        <SelectContent>
                                            {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Discípulo (Quem é cuidado)</Label>
                                    <Select name="disciple_id" required>
                                        <SelectTrigger><SelectValue placeholder="Selecione o discípulo..." /></SelectTrigger>
                                        <SelectContent>
                                            {members.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Data de Início</Label>
                                    <Input name="start_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Observações Iniciais</Label>
                                    <Textarea name="notes" placeholder="Algum foco específico para este acompanhamento?" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsNewDialogOpen(false)}>Cancelar</Button>
                                <Button type="submit">Começar Juntos</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Grid de Discipulados */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-2">
                {discipleships.length === 0 ? (
                    <div className="col-span-full">
                        <EmptyState
                            icon={Heart}
                            title="Nenhum discipulado ativo"
                            description="Inicie hoje mesmo o acompanhamento de novos membros!"
                            actionLabel="Iniciar discipulado"
                            onAction={() => setIsNewDialogOpen(true)}
                        />
                    </div>
                ) : (
                    discipleships.map((ds) => (
                        <Card key={ds.id} className="overflow-hidden border-primary/5 hover:border-primary/20 transition-all shadow-sm hover:shadow-xl group">
                            <CardContent className="p-0">
                                <div className="flex flex-col sm:flex-row h-full">
                                    {/* Mentor Section */}
                                    <div className="p-6 flex-1 bg-primary/5 relative">
                                        <Badge className="absolute top-4 left-4 bg-primary/20 text-primary border-none text-[10px] font-bold uppercase">Mentor</Badge>
                                        <div className="flex flex-col items-center text-center mt-4">
                                            <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/30 mb-3 overflow-hidden">
                                                {ds.mentor?.photo_url ? (
                                                    <img src={ds.mentor.photo_url} alt={ds.mentor.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Users className="w-full h-full p-4 text-primary" />
                                                )}
                                            </div>
                                            <p className="font-bold text-lg">{ds.mentor?.name}</p>
                                        </div>
                                    </div>

                                    {/* Connecting Arrow/Heart */}
                                    <div className="flex items-center justify-center p-2 sm:p-0">
                                        <div className="bg-background border-2 border-primary/10 rounded-full p-2 z-10 shadow-sm group-hover:scale-125 transition-transform">
                                            <Heart className="h-5 w-5 text-primary fill-primary/10" />
                                        </div>
                                    </div>

                                    {/* Disciple Section */}
                                    <div className="p-6 flex-1 bg-secondary/5 relative text-right flex flex-col items-end">
                                        <Badge className="absolute top-4 right-4 bg-secondary/20 text-secondary border-none text-[10px] font-bold uppercase">Discípulo</Badge>
                                        <div className="flex flex-col items-center text-center mt-4 w-full">
                                            <div className="w-16 h-16 rounded-full bg-secondary/20 border-2 border-secondary/30 mb-3 overflow-hidden">
                                                {ds.disciple?.photo_url ? (
                                                    <img src={ds.disciple.photo_url} alt={ds.disciple.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Users className="w-full h-full p-4 text-secondary" />
                                                )}
                                            </div>
                                            <p className="font-bold text-lg">{ds.disciple?.name}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Growth Track Section */}
                                <div className="px-6 py-4 bg-white border-t border-b">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Trilha de Crescimento</p>
                                    <div className="flex flex-wrap gap-2">
                                        {GROWTH_STAGES.map((stage) => {
                                            const isCompleted = getGrowthTrack(ds.notes).includes(stage.id);
                                            return (
                                                <button
                                                    key={stage.id}
                                                    disabled={ds.status !== 'em_andamento'}
                                                    onClick={() => handleToggleStage(ds, stage.id)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${isCompleted
                                                            ? 'bg-green-500 text-white border-green-600 shadow-md scale-105'
                                                            : 'bg-muted/50 text-muted-foreground border-transparent hover:border-primary/20 hover:bg-muted'
                                                        }`}
                                                >
                                                    {stage.icon && <stage.icon className={`h-3 w-3 ${isCompleted ? 'text-white' : 'text-muted-foreground/50'}`} />}
                                                    {stage.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Footer and Controls */}
                                <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Início: {new Date(ds.start_date).toLocaleDateString()}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {ds.status === 'em_andamento' ? (
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 text-xs border-green-500/20 hover:bg-green-500 hover:text-white"
                                                    onClick={() => handleUpdateStatus(ds.id, 'concluido')}
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                                    Concluir
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 text-xs text-muted-foreground hover:text-destructive"
                                                    onClick={() => handleUpdateStatus(ds.id, 'cancelado')}
                                                >
                                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                                    Cancelar
                                                </Button>
                                            </div>
                                        ) : (
                                            <Badge variant={ds.status === 'concluido' ? 'default' : 'secondary'} className="capitalize">
                                                {ds.status === 'concluido' ? 'Concluído' : 'Cancelado'}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
