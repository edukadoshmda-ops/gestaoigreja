import { useState, useEffect } from 'react';
import { Search, Loader2, UserPlus, Check, Trash2, Users } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { membersService } from '@/services/members.service';
import { cellsService } from '@/services/cells.service';
import { ministriesService } from '@/services/ministries.service';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface AddMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    targetId: string;
    targetName: string;
    type: 'cell' | 'ministry';
    onSuccess?: () => void;
}

export function AddMemberDialog({
    open,
    onOpenChange,
    targetId,
    targetName,
    type,
    onSuccess
}: AddMemberDialogProps) {
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<any[]>([]);
    const [currentMembers, setCurrentMembers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [processing, setProcessing] = useState<string | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();

    // Permissions check
    const canManage = (user?.role === 'admin' || user?.role === 'secretario' || user?.role === 'pastor' ||
        (type === 'cell' && (user?.role === 'lider_celula')) ||
        (type === 'ministry' && (user?.role === 'lider_ministerio'))) && user?.role !== 'tesoureiro';

    useEffect(() => {
        if (open) {
            loadMembers();
            loadCurrentMembers();
        }
    }, [open, targetId]);

    async function loadMembers() {
        try {
            setLoading(true);
            const data = await membersService.getAll();
            setMembers(data || []);
        } catch (error) {
            console.error('Erro ao carregar pessoas:', error);
            toast({
                title: 'Erro',
                description: 'Não foi possível carregar a lista de pessoas.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }

    async function loadCurrentMembers() {
        try {
            let data;
            if (type === 'cell') {
                data = await cellsService.getMembers(targetId);
            } else {
                data = await ministriesService.getMembers(targetId);
            }
            setCurrentMembers(data || []);
        } catch (error) {
            console.error('Erro ao carregar membros atuais:', error);
        }
    }

    const handleAdd = async (memberId: string, memberName: string) => {
        if (!canManage) {
            toast({
                title: 'Acesso negado',
                description: 'Você não tem permissão para adicionar membros.',
                variant: 'destructive',
            });
            return;
        }

        try {
            setProcessing(memberId);
            if (type === 'cell') {
                await cellsService.addMember(targetId, memberId);
            } else {
                await ministriesService.addMember(targetId, memberId);
            }

            toast({
                title: 'Sucesso!',
                description: `${memberName} foi adicionado com sucesso.`,
            });

            loadCurrentMembers();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            const isDuplicate = error.message?.includes('duplicate key') || error.code === '23505';
            toast({
                title: isDuplicate ? 'Já cadastrado' : 'Erro ao adicionar',
                description: isDuplicate
                    ? `${memberName} já faz parte deste grupo.`
                    : 'Ocorreu um problema ao tentar adicionar a pessoa.',
                variant: isDuplicate ? 'default' : 'destructive',
            });
        } finally {
            setProcessing(null);
        }
    };

    const handleRemove = async (memberId: string, memberName: string) => {
        if (!canManage) {
            toast({
                title: 'Acesso negado',
                description: 'Você não tem permissão para remover membros.',
                variant: 'destructive',
            });
            return;
        }

        if (!confirm(`Deseja remover ${memberName} de ${targetName}?`)) return;

        try {
            setProcessing(memberId);
            if (type === 'cell') {
                await cellsService.removeMember(targetId, memberId);
            } else {
                await ministriesService.removeMember(targetId, memberId);
            }

            toast({
                title: 'Removido',
                description: `${memberName} foi removido do grupo.`,
            });

            loadCurrentMembers();
            if (onSuccess) onSuccess();
        } catch (error) {
            toast({
                title: 'Erro ao remover',
                description: 'Não foi possível remover a pessoa do grupo.',
                variant: 'destructive',
            });
        } finally {
            setProcessing(null);
        }
    };

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-screen h-screen sm:w-[95vw] sm:max-w-md sm:h-auto sm:max-h-[90vh] overflow-hidden gap-0 p-0 rounded-none sm:rounded-lg sm:p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Gerenciar Membros</DialogTitle>
                    <DialogDescription>
                        {targetName}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 pt-2 space-y-4">
                    <Tabs defaultValue="current" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="current">Membros ({currentMembers.length})</TabsTrigger>
                            <TabsTrigger value="add">Adicionar Novo</TabsTrigger>
                        </TabsList>

                        <TabsContent value="add" className="space-y-4 mt-0">
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
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center h-full py-8 space-y-2">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        <p className="text-sm text-muted-foreground">Carregando...</p>
                                    </div>
                                ) : filteredMembers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-8 text-center text-muted-foreground">
                                        <p>Nenhuma pessoa encontrada.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredMembers.map((member) => (
                                            <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted group transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border">
                                                        <AvatarImage src={member.photo_url} />
                                                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{member.name}</p>
                                                        <p className="text-xs text-muted-foreground capitalize">
                                                            {member.status === 'visitante' ? 'congregado' : 'membro'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 rounded-full group-hover:bg-primary group-hover:text-primary-foreground"
                                                    onClick={() => handleAdd(member.id, member.name)}
                                                    disabled={processing === member.id || !canManage}
                                                >
                                                    {processing === member.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="current" className="space-y-4 mt-0">
                            <ScrollArea className="h-[350px] pr-4">
                                {currentMembers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-12 text-center text-muted-foreground">
                                        <Users className="h-12 w-12 mb-2 opacity-20" />
                                        <p>Nenhum membro vinculado ainda.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {currentMembers.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9 border">
                                                        <AvatarImage src={item.member?.photo_url} />
                                                        <AvatarFallback>{item.member?.name?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{item.member?.name}</p>
                                                        <p className="text-xs text-muted-foreground capitalize">
                                                            {item.member?.status === 'visitante' ? 'congregado' : 'membro'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleRemove(item.member_id, item.member?.name)}
                                                    disabled={processing === item.member_id || !canManage}
                                                >
                                                    {processing === item.member_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
}
