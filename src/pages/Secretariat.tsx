import { useState, useEffect } from 'react';
import { FileText, Award, Send, Baby, Users, Loader2, Download, Trash2, CreditCard, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { membersService } from '@/services/members.service';
import { documentsService, ChurchDocument } from '@/services/documents.service';
import { Member } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function Secretariat() {
    useDocumentTitle('Secretaria');
    const [activeTab, setActiveTab] = useState('minutes');
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();

    // Permissão: Admin, Pastor, Secretário e SuperAdmin podem editar
    const canEdit = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'secretario' || user?.role === 'superadmin';

    const handlePrint = () => {
        window.print();
    };

    // Carrega membros ao montar o componente
    useEffect(() => {
        loadMembers();
    }, []);

    async function loadMembers() {
        try {
            setError(null);
            setLoading(true);
            const data = await membersService.getAll();

            const mappedMembers: Member[] = (data || []).map((m: any) => {
                try {
                    return {
                        id: m.id,
                        name: m.name || 'Sem Nome',
                        email: m.email || '',
                        phone: m.phone || '',
                        birthDate: m.birth_date || '',
                        baptismDate: m.baptism_date || '',
                        role: m.church_role || 'Membro',
                        address: m.address || '',
                        photoUrl: m.photo_url || '',
                        category: m.status === 'visitante' ? 'congregado' : 'membro',
                        createdAt: m.created_at || new Date().toISOString(),
                    };
                } catch (e) {
                    return null;
                }
            }).filter((m: any) => m !== null) as Member[];
            setMembers(mappedMembers);
<<<<<<< Current (Your changes)
        } catch (error) {
            console.error('Secretariat Error:', error);
=======
        } catch (err: any) {
            console.error('Secretariat Error:', err);
            setMembers([]);
            const msg = err?.message || '';
            const isSessionOrPerm = /session|permission|RLS|401|403|PGRST/i.test(msg) || msg.includes('fetch');
            setError(isSessionOrPerm ? 'Sessão expirada ou sem permissão.' : (msg || 'Não foi possível carregar.'));
>>>>>>> Incoming (Background Agent changes)
            toast({
                title: 'Erro ao carregar secretaria',
                description: 'Verifique se você tem as permissões necessárias.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    }

    if (error && members.length === 0 && !loading) {
        return (
            <div className="max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => loadMembers()}>Tentar novamente</Button>
            </div>
        );
    }
    if (loading && members.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div translate="no">
                    <h1 className="text-3xl font-bold tracking-tight"><span>Secretaria</span></h1>
                    <p className="text-muted-foreground">
                        <span>Gestão de documentos e certificados oficiais</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handlePrint} className="gap-2">
                        <Download className="h-4 w-4" />
                        Baixar PDF / Imprimir
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto print:hidden" translate="no">
                    <TabsTrigger value="minutes" className="gap-2 py-3 text-[1.75rem] md:text-sm">
                        <FileText className="h-8 w-8 md:h-4 md:w-4" />
                        <span>Atas</span>
                    </TabsTrigger>
                    <TabsTrigger value="baptism" className="gap-2 py-3 text-[1.75rem] md:text-sm">
                        <Award className="h-8 w-8 md:h-4 md:w-4" />
                        <span>Batismo</span>
                    </TabsTrigger>
                    <TabsTrigger value="transfer" className="gap-2 py-3 text-[1.75rem] md:text-sm">
                        <Send className="h-8 w-8 md:h-4 md:w-4" />
                        <span>Transferência</span>
                    </TabsTrigger>
                    <TabsTrigger value="dedication" className="gap-2 py-3 text-[1.75rem] md:text-sm">
                        <Baby className="h-8 w-8 md:h-4 md:w-4" />
                        <span>Apresentação</span>
                    </TabsTrigger>
                    <TabsTrigger value="roll" className="gap-2 py-3 text-[1.75rem] md:text-sm">
                        <Users className="h-8 w-8 md:h-4 md:w-4" />
                        <span>Rol</span>
                    </TabsTrigger>
                    <TabsTrigger value="documents" className="gap-2 py-3 text-[1.75rem] md:text-sm">
                        <FileText className="h-8 w-8 md:h-4 md:w-4" />
                        <span>Salvos</span>
                    </TabsTrigger>
                    <TabsTrigger value="idcard" className="gap-2 py-3 text-[1.75rem] md:text-sm">
                        <CreditCard className="h-8 w-8 md:h-4 md:w-4" />
                        <span>Carteirinha</span>
                    </TabsTrigger>
                </TabsList>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        body * { visibility: hidden; }
                        .print-content, .print-content * { visibility: visible; }
                        .print-content { 
                            position: absolute; 
                            left: 0; 
                            top: 0; 
                            width: 100%; 
                            padding: 0;
                            margin: 0;
                        }
                        .print-hidden { display: none !important; }
                    }
                `}} />

                <div className="bg-white dark:bg-card p-8 rounded-lg shadow-sm print:shadow-none min-h-[600px] print:p-0 text-foreground print-content">
                    <TabsContent value="minutes" className="mt-0 space-y-6">
                        <MinutesTemplate canEdit={canEdit} />
                    </TabsContent>

                    <TabsContent value="baptism" className="mt-0 space-y-6">
                        <BaptismCertificate members={members} canEdit={canEdit} />
                    </TabsContent>

                    <TabsContent value="transfer" className="mt-0 space-y-6">
                        <TransferLetter members={members} canEdit={canEdit} />
                    </TabsContent>

                    <TabsContent value="dedication" className="mt-0 space-y-6">
                        <BabyDedicationCertificate members={members} canEdit={canEdit} />
                    </TabsContent>

                    <TabsContent value="roll" className="mt-0 space-y-6">
                        {loading ? (
                            <div className="flex justify-center p-8 print:hidden">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <MembersRoll members={members} />
                        )}
                    </TabsContent>

                    <TabsContent value="documents" className="mt-0 space-y-6">
                        <SavedDocumentsList canEdit={canEdit} />
                    </TabsContent>

                    <TabsContent value="idcard" className="mt-0 space-y-6">
                        <MemberIdCardTemplate members={members} canEdit={canEdit} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

function MinutesTemplate({ canEdit }: { canEdit: boolean }) {
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [clearConfirm, setClearConfirm] = useState(false);
    const { toast } = useToast();

    const handleClear = () => setClearConfirm(true);
    const executeClear = () => {
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setTitle('');
        setContent('');
        toast({ title: 'Formulário limpo' });
    };

    const handleSave = async () => {
        if (!title || !content) {
            toast({ title: 'Atenção', description: 'Preencha o título e o conteúdo.', variant: 'destructive' });
            return;
        }
        try {
            setSaving(true);
            await documentsService.create({
                title,
                description: content,
                category: 'minutes',
                file_url: 'text://' + content.slice(0, 100), // Marker for text documents
                file_type: 'text/plain'
            });
            toast({ title: 'Sucesso', description: 'Ata salva com sucesso!' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro ao salvar', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6" translate="no">
            <div className="flex items-center justify-between border-b pb-6 mb-6">
                <div className="flex-1 text-center">
                    <h2 className="text-2xl font-bold uppercase"><span>Ata de Reunião</span></h2>
                    <p className="text-muted-foreground print:hidden"><span>Preencha os dados abaixo para gerar o documento</span></p>
                </div>
                <div className="flex gap-2 print:hidden flex-shrink-0">
                    {canEdit && (
                        <>
                            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="gap-2">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Salvar
                            </Button>
                            <Button variant="destructive" size="icon" onClick={handleClear} title="Limpar Formulário">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <ConfirmDialog open={clearConfirm} onOpenChange={setClearConfirm} title="Limpar formulário" description="Tem certeza que deseja limpar todo o formulário?" onConfirm={executeClear} confirmLabel="Limpar" variant="destructive" />
                        </>
                    )}
                </div>
            </div>

            <div className="grid gap-4 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label><span>Data da Reunião</span></Label>
                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="space-y-2">
                        <Label><span>Título/Assunto</span></Label>
                        <Input placeholder="Ex: Reunião de Obreiros" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!canEdit} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label><span>Conteúdo da Ata</span></Label>
                    <Textarea
                        placeholder="Descreva o que foi discutido e decidido..."
                        className="min-h-[300px]"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={!canEdit}
                    />
                </div>
            </div>

            <div className="hidden print:block space-y-6 font-serif text-black">
                <div className="text-center mb-8">
                    <h3 className="text-xl font-bold">{title || 'Título da Ata'}</h3>
                    <p className="text-sm text-gray-600">
                        Realizada em {date ? format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '___/___/___'}
                    </p>
                </div>
                <div className="whitespace-pre-wrap text-justify leading-relaxed">
                    {content || 'Conteúdo da ata aparecerá aqui...'}
                </div>
                <div className="mt-20 pt-8 border-t border-black w-64 mx-auto text-center">
                    <p>Secretário(a)</p>
                </div>
            </div>
        </div>
    );
}

function BaptismCertificate({ members, canEdit }: { members: Member[], canEdit: boolean }) {
    const [name, setName] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [location, setLocation] = useState('');
    const [pastorPresidente, setPastorPresidente] = useState('');
    const [pastorCelebrante, setPastorCelebrante] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [saving, setSaving] = useState(false);
    const [clearConfirm, setClearConfirm] = useState(false);
    const { toast } = useToast();

    const handleClear = () => setClearConfirm(true);
    const executeClear = () => {
        setName('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setLocation('');
        setPastorPresidente('');
        setPastorCelebrante('');
        setSelectedMemberId('');
        toast({ title: 'Formulário limpo' });
    };

    const handleSave = async () => {
        if (!name) {
            toast({ title: 'Atenção', description: 'Preencha o nome do batizando.', variant: 'destructive' });
            return;
        }
        try {
            setSaving(true);
            const dateStr = date ? format(new Date(date), "dd/MM/yyyy") : '___/___/_____';
            const content = `CERTIFICADO DE BATISMO NAS ÁGUAS\n\nCertificamos que ${name} foi batizado(a) nas águas em nome do Pai, do Filho e do Espírito Santo, conforme mandamento do Senhor Jesus Cristo, escrito no evangelho de Mateus 28:19.\n\nData: ${dateStr}\nLocal: ${location || '___________________________'}\n\nPastor Presidente: ${pastorPresidente || '_________________'}\nPastor Celebrante: ${pastorCelebrante || '_________________'}`;

            await documentsService.create({
                title: `Certificado de Batismo - ${name}`,
                description: content,
                category: 'baptism',
                file_url: 'text://' + name,
                file_type: 'text/plain'
            });
            toast({ title: 'Sucesso', description: 'Certificado salvo!' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro ao salvar', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const dateFormatted = date ? format(new Date(date), "dd / MM / yyyy") : '____ / ____ / ______';

    return (
        <div className="space-y-6" translate="no">
            <div className="flex items-center justify-between border-b pb-6 mb-6">
                <div className="flex-1 text-center">
                    <h2 className="text-2xl font-bold"><span>Certificado de Batismo nas Águas</span></h2>
                </div>
                <div className="flex gap-2 print:hidden flex-shrink-0">
                    {canEdit && (
                        <>
                            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="gap-2">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Salvar
                            </Button>
                            <Button variant="destructive" size="icon" onClick={handleClear} title="Limpar Formulário">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <ConfirmDialog open={clearConfirm} onOpenChange={setClearConfirm} title="Limpar formulário" description="Tem certeza que deseja limpar o formulário?" onConfirm={executeClear} confirmLabel="Limpar" variant="destructive" />
                        </>
                    )}
                </div>
            </div>

            <div className="grid gap-4 print:hidden max-w-2xl mx-auto bg-muted/20 p-6 rounded-xl border border-primary/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label><span>Selecionar Membro</span></Label>
                        <Select value={selectedMemberId} disabled={!canEdit} onValueChange={(val) => {
                            setSelectedMemberId(val);
                            const m = members.find(x => x.id === val);
                            if (m) setName(m.name);
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Busque um membro..." />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label><span>Nome do(a) Batizando(a)</span></Label>
                        <Input placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="space-y-2">
                        <Label><span>Data</span></Label>
                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="space-y-2">
                        <Label><span>Local</span></Label>
                        <Input placeholder="Local da cerimônia" value={location} onChange={(e) => setLocation(e.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="space-y-2">
                        <Label><span>Pastor Presidente</span></Label>
                        <Input placeholder="Nome do Pastor Presidente" value={pastorPresidente} onChange={(e) => setPastorPresidente(e.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="space-y-2">
                        <Label><span>Pastor Celebrante</span></Label>
                        <Input placeholder="Nome do Pastor Celebrante" value={pastorCelebrante} onChange={(e) => setPastorCelebrante(e.target.value)} disabled={!canEdit} />
                    </div>
                </div>
            </div>

            {/* Certificado A4 paisagem - borda #1F4E79 */}
            <div
                className="mx-auto max-w-[11.69in] min-h-[8.27in] p-8 md:p-12 bg-white text-black shadow-xl rounded print:shadow-none print:max-w-none"
                style={{ border: '3pt solid #1F4E79' }}
            >
                <div className="flex flex-col items-center justify-center text-center space-y-4 min-h-[7in]">
                    <h1 className="text-3xl md:text-4xl font-bold uppercase" style={{ color: '#1F4E79' }}>
                        Certificado de Batismo nas Águas
                    </h1>
                    <p className="text-lg">Certificamos que</p>
                    <div className="border-b-2 border-black w-full max-w-md pb-1">
                        <p className="text-xl md:text-2xl font-bold">{name || '______________________________________________'}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">Nome do(a) Batizando(a)</p>
                    <p className="text-base md:text-lg leading-relaxed max-w-2xl px-4">
                        foi batizado(a) nas águas em nome do Pai, do Filho e do Espírito Santo,
                        conforme mandamento do Senhor Jesus Cristo, escrito no evangelho de Mateus 28:19.
                    </p>
                    <div className="space-y-2 pt-4">
                        <p className="text-base">Data: {dateFormatted}</p>
                        <p className="text-base">Local: {location || '___________________________________________'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-12 w-full max-w-xl pt-12">
                        <div className="text-center">
                            <div className="border-t-2 border-black pt-2 mt-16">
                                <p className="font-bold text-sm">{pastorPresidente || '_________________________________________'}</p>
                                <p className="text-sm">Pastor Presidente</p>
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="border-t-2 border-black pt-2 mt-16">
                                <p className="font-bold text-sm">{pastorCelebrante || '_________________________________________'}</p>
                                <p className="text-sm">Pastor Celebrante</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function TransferLetter({ members, canEdit }: { members: Member[], canEdit: boolean }) {
    const [name, setName] = useState('');
    const [destination, setDestination] = useState('');
    const [origin, setOrigin] = useState('Igreja Comunidade Cristã');
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [saving, setSaving] = useState(false);
    const [clearConfirm, setClearConfirm] = useState(false);
    const { toast } = useToast();

    const handleClear = () => setClearConfirm(true);
    const executeClear = () => {
        setName('');
        setDestination('');
        setSelectedMemberId('');
        toast({ title: 'Formulário limpo' });
    };

    const handleSave = async () => {
        if (!name || !destination) {
            toast({ title: 'Atenção', description: 'Preencha o nome e o destino.', variant: 'destructive' });
            return;
        }
        try {
            setSaving(true);
            const content = `CARTA DE TRANSFERÊNCIA\n\nCertificamos que o(a) irmão(ã) ${name} é membro desta igreja (${origin}), estando em plena comunhão. Recomendamos o(a) mesmo(a) à igreja ${destination}.`;

            await documentsService.create({
                title: `Carta de Transferência - ${name}`,
                description: content,
                category: 'transfer',
                file_url: 'text://' + name,
                file_type: 'text/plain'
            });
            toast({ title: 'Sucesso', description: 'Documento salvo!' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro ao salvar', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-6 mb-6">
                <div className="flex-1 text-center">
                    <h2 className="text-2xl font-bold">Carta de Transferência</h2>
                </div>
                <div className="flex gap-2 print:hidden flex-shrink-0">
                    {canEdit && (
                        <>
                            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="gap-2">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Salvar
                            </Button>
                            <Button variant="destructive" size="icon" onClick={handleClear} title="Limpar Formulário">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <ConfirmDialog open={clearConfirm} onOpenChange={setClearConfirm} title="Limpar formulário" description="Tem certeza que deseja limpar o formulário?" onConfirm={executeClear} confirmLabel="Limpar" variant="destructive" />
                        </>
                    )}
                </div>
            </div>

            <div className="grid gap-4 print:hidden max-w-2xl mx-auto bg-muted/20 p-6 rounded-xl border border-primary/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label><span>Selecionar Membro</span></Label>
                        <Select value={selectedMemberId} disabled={!canEdit} onValueChange={(val) => {
                            setSelectedMemberId(val);
                            const m = members.find(x => x.id === val);
                            if (m) setName(m.name);
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Busque um membro..." />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label><span>Nome do Membro</span></Label>
                        <Input placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="space-y-2">
                        <Label><span>Igreja de Origem</span></Label>
                        <Input placeholder="Nossa Igreja" value={origin} onChange={(e) => setOrigin(e.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="space-y-2">
                        <Label><span>Igreja de Destino</span></Label>
                        <Input placeholder="Nome da igreja de destino" value={destination} onChange={(e) => setDestination(e.target.value)} disabled={!canEdit} />
                    </div>
                </div>
            </div>

            <div className="flex flex-col max-w-2xl mx-auto font-serif leading-relaxed text-justify space-y-6 mt-12 text-black bg-white p-12 shadow-xl rounded-lg print:shadow-none print:p-0">
                <h1 className="text-2xl font-bold text-center uppercase mb-12">Carta de Transferência</h1>

                <p>A quem possa interessar,</p>

                <p>
                    Certificamos que o(a) irmão(ã) <strong>{name || '____________________'}</strong> é membro desta igreja (<strong>{origin}</strong>),
                    estando em plena comunhão e sem nada que desabone sua conduta cristã até a presente data.
                </p>

                <p>
                    Atendendo ao seu pedido, recomendamos o(a) referido(a) irmão(ã) à <strong>{destination || '____________________'}</strong>,
                    solicitando que o(a) recebam no Senhor e lhe concedam os privilégios da comunhão cristã.
                </p>

                <p>
                    Após sua recepção, pedimos a gentileza de nos comunicar para que possamos dar baixa em nosso rol de membros.
                </p>

                <p className="text-right mt-12">
                    {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}.
                </p>

                <div className="mt-24 pt-4 border-t border-black w-64 mx-auto text-center">
                    <p>Pastor Responsável</p>
                </div>
            </div>
        </div>
    );
}

function BabyDedicationCertificate({ members, canEdit }: { members: Member[], canEdit: boolean }) {
    const [childName, setChildName] = useState('');
    const [childBirthDate, setChildBirthDate] = useState('');
    const [parentsName, setParentsName] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [saving, setSaving] = useState(false);
    const [clearConfirm, setClearConfirm] = useState(false);
    const { toast } = useToast();

    const handleClear = () => setClearConfirm(true);
    const executeClear = () => {
        setChildName('');
        setChildBirthDate('');
        setParentsName('');
        setSelectedMemberId('');
        setDate(format(new Date(), 'yyyy-MM-dd'));
        toast({ title: 'Formulário limpo' });
    };

    const handleSave = async () => {
        if (!childName || !parentsName) {
            toast({ title: 'Atenção', description: 'Preencha o nome da criança e dos pais.', variant: 'destructive' });
            return;
        }
        try {
            setSaving(true);
            const content = `CERTIFICADO DE APRESENTAÇÃO\n\nCertificamos que a criança ${childName}, nascida em ${childBirthDate ? format(new Date(childBirthDate), 'dd/MM/yyyy') : '___/___/___'}, filho(a) de ${parentsName}, foi apresentada ao Senhor em ${format(new Date(date), 'dd/MM/yyyy')}.`;

            await documentsService.create({
                title: `Apresentação - ${childName}`,
                description: content,
                category: 'dedication',
                file_url: 'text://' + childName,
                file_type: 'text/plain'
            });
            toast({ title: 'Sucesso', description: 'Certificado salvo!' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Erro ao salvar', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6" translate="no">
            <div className="flex items-center justify-between border-b pb-6 mb-6">
                <div className="flex-1 text-center">
                    <h2 className="text-2xl font-bold"><span>Certificado de Apresentação de Crianças</span></h2>
                </div>
                <div className="flex gap-2 print:hidden flex-shrink-0">
                    {canEdit && (
                        <>
                            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving} className="gap-2">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Salvar
                            </Button>
                            <Button variant="destructive" size="icon" onClick={handleClear} title="Limpar Formulário">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            <ConfirmDialog open={clearConfirm} onOpenChange={setClearConfirm} title="Limpar formulário" description="Tem certeza que deseja limpar o formulário?" onConfirm={executeClear} confirmLabel="Limpar" variant="destructive" />
                        </>
                    )}
                </div>
            </div>

            <div className="grid gap-4 print:hidden max-w-2xl mx-auto bg-muted/20 p-6 rounded-xl border border-primary/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label><span>Selecionar Pais (Membros)</span></Label>
                        <Select value={selectedMemberId} disabled={!canEdit} onValueChange={(val) => {
                            setSelectedMemberId(val);
                            const m = members.find(x => x.id === val);
                            if (m) setParentsName(m.name);
                        }}>
                            <SelectTrigger>
                                <SelectValue placeholder="Busque um responsável..." />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Nome da Criança</Label>
                        <Input placeholder="Nome completo" value={childName} onChange={(e) => setChildName(e.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="space-y-2">
                        <Label>Data de Nasc. da Criança</Label>
                        <Input type="date" value={childBirthDate} onChange={(e) => setChildBirthDate(e.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="space-y-2">
                        <Label>Nome dos Pais</Label>
                        <Input placeholder="Nome dos pais" value={parentsName} onChange={(e) => setParentsName(e.target.value)} disabled={!canEdit} />
                    </div>
                    <div className="space-y-2">
                        <Label>Data da Apresentação</Label>
                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={!canEdit} />
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center min-h-[600px] border-4 border-dotted border-blue-200 p-12 text-center font-serif bg-blue-50/10 text-black shadow-xl rounded-lg max-w-4xl mx-auto mt-6 print:shadow-none print:mt-0 print:bg-transparent">
                <div className="space-y-8">
                    <Baby className="h-16 w-16 mx-auto text-blue-300" />
                    <h1 className="text-3xl font-bold uppercase tracking-widest text-gray-800"><span>Certificado de Apresentação</span></h1>
                    <p className="text-xl italic">Certificamos que a criança</p>

                    <h2 className="text-4xl font-bold text-blue-600 font-script px-8">
                        {childName || 'Nome da Criança'}
                    </h2>

                    <p className="text-lg">
                        Nascida em {childBirthDate ? format(new Date(childBirthDate), 'dd/MM/yyyy') : '___/___/___'}
                    </p>

                    <p className="text-lg">Filho(a) de</p>
                    <h3 className="text-2xl font-semibold border-b border-gray-300 pb-1 px-4 inline-block">
                        {parentsName || 'Nome dos Pais'}
                    </h3>

                    <p className="text-xl leading-relaxed max-w-2xl mx-auto mt-6">
                        Foi apresentada ao Senhor nesta igreja, conforme o exemplo bíblico,
                        sendo consagrada a Deus para uma vida abençoada.
                    </p>

                    <p className="text-lg mt-8 text-gray-600">
                        "Educa a criança no caminho em que deve andar; e até quando envelhecer não se desviará dele." (Provérbios 22:6)
                    </p>

                    <p className="text-md mt-4">
                        Em {date ? format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : '___/___/___'}
                    </p>

                    <div className="flex justify-center w-full mt-20">
                        <div className="border-t border-black pt-2 px-12">
                            <p>Pastor Celebrante</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MembersRoll({ members }: { members: Member[] }) {
    const [filter, setFilter] = useState('');

    const filtered = members.filter(m =>
        m.name.toLowerCase().includes(filter.toLowerCase()) ||
        m.category.toLowerCase().includes(filter.toLowerCase())
    );

    // Separar membros e congregados
    const membrosCount = filtered.filter(m => m.category === 'membro').length;
    const congregadosCount = filtered.filter(m => m.category === 'congregado').length;

    return (
        <div className="space-y-6" translate="no">
            <div className="text-center space-y-2 border-b pb-6 mb-6">
                <h2 className="text-2xl font-bold"><span>Rol de Membros e Congregados</span></h2>

                {/* Estatísticas */}
                <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <div className="text-left">
                            <p className="text-xs text-muted-foreground">Membros</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{membrosCount}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div className="text-left">
                            <p className="text-xs text-muted-foreground">Congregados</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{congregadosCount}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-lg">
                        <Users className="h-5 w-5 text-primary" />
                        <div className="text-left">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-2xl font-bold text-primary">{filtered.length}</p>
                        </div>
                    </div>
                </div>
                <div className="flex justify-center mt-4 print:hidden">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={async () => {
                            try {
                                await documentsService.create({
                                    title: `Rol de Membros - ${format(new Date(), 'dd/MM/yyyy')}`,
                                    description: `Snapshot do rol de membros com ${membrosCount} membros e ${congregadosCount} congregados.`,
                                    category: 'roll',
                                    file_url: 'text://roll-snapshot',
                                    file_type: 'text/plain'
                                });
                                toast({ title: 'Sucesso', description: 'Snapshot do Rol salvo!' });
                            } catch (error) {
                                toast({ title: 'Erro ao salvar', variant: 'destructive' });
                            }
                        }}
                    >
                        <Send className="h-4 w-4" />
                        Salvar Snapshot do Rol
                    </Button>
                </div>
            </div>

            <div className="print:hidden mb-4">
                <Input
                    placeholder="Buscar por nome..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            <div className="print:block">
                <div className="hidden print:block text-center mb-8">
                    <h1 className="text-2xl font-bold uppercase text-black">Rol Geral de Membros e Congregados</h1>
                    <p className="text-sm text-gray-500">Gerado em {format(new Date(), "dd/MM/yyyy", { locale: ptBR })}</p>
                    <div className="flex justify-center gap-8 mt-4 text-sm text-black">
                        <span>✓ Membros: {membrosCount}</span>
                        <span>✓ Congregados: {congregadosCount}</span>
                        <span>✓ Total: {filtered.length}</span>
                    </div>
                </div>

                <div className="overflow-x-auto min-w-0 print:overflow-visible">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome Completo</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium"><span>{member.name}</span></TableCell>
                                <TableCell><span>{member.phone}</span></TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`capitalize ${member.category === 'membro'
                                        ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
                                        : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                                        }`}>
                                        <span>{member.category}</span>
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </div>
            </div>
        </div>
    );
}

function MemberIdCardTemplate({ members, canEdit }: { members: Member[], canEdit: boolean }) {
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        birthDate: '',
        baptismDate: '',
        role: 'Membro',
        cnpj: '00.000.000/0001-00',
        churchAddress: 'Av. Principal, 1000 - Centro',
        churchName: 'Igreja Comunidade Cristã'
    });
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const roles = [
        'Pastor',
        'Pastora',
        'Diácono',
        'Diaconisa',
        'Evangelista',
        'Líder de Célula',
        'Líder de Ministério',
        'Secretário',
        'Secretária',
        'Tesoureiro',
        'Tesoureira',
        'Membro'
    ];

    const selectedMember = members.find(m => m.id === selectedMemberId);

    useEffect(() => {
        if (selectedMember) {
            setFormData(prev => ({
                ...prev,
                name: selectedMember.name,
                birthDate: selectedMember.birthDate,
                baptismDate: selectedMember.baptismDate || '',
                role: selectedMember.role || 'Membro'
            }));
        }
    }, [selectedMemberId]);

    const handleClear = () => {
        setSelectedMemberId('');
        setFormData({
            name: '',
            birthDate: '',
            baptismDate: '',
            role: 'Membro',
            cnpj: '00.000.000/0001-00',
            churchAddress: 'Av. Principal, 1000 - Centro',
            churchName: 'Igreja Comunidade Cristã'
        });
    };

    const handlePrintCard = () => {
        window.print();
    };

    return (
        <div className="space-y-8">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 0; size: auto; }
                    body * { visibility: hidden; }
                    .id-card-print-container, .id-card-print-container * { visibility: visible; }
                    .id-card-print-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        gap: 20px !important;
                        padding-top: 20px !important;
                        background: white !important;
                    }
                    .id-card-print-piece {
                        width: 8.6cm !important;
                        height: 5.4cm !important;
                        min-width: 8.6cm !important;
                        min-height: 5.4cm !important;
                        border: 1px solid #000 !important;
                        page-break-inside: avoid;
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}} />
            <div className="flex items-center justify-between border-b pb-6 mb-6">
                <div className="flex-1 text-center">
                    <h2 className="text-2xl font-bold uppercase"><span>Carteira de Membro</span></h2>
                    <p className="text-muted-foreground print:hidden"><span>Selecione um membro para gerar a credencial</span></p>
                </div>
                <div className="flex gap-2 print:hidden items-center">
                    {selectedMemberId && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                disabled={saving}
                                onClick={async () => {
                                    try {
                                        setSaving(true);
                                        await documentsService.create({
                                            title: `Credencial - ${formData.name}`,
                                            description: `Credencial emitida para ${formData.name} com cargo ${formData.role}.`,
                                            category: 'credential',
                                            file_url: 'text://' + formData.name,
                                            file_type: 'text/plain'
                                        });
                                        toast({ title: 'Sucesso', description: 'Credencial salva!' });
                                    } catch (error) {
                                        toast({ title: 'Erro ao salvar', variant: 'destructive' });
                                    } finally {
                                        setSaving(false);
                                    }
                                }}
                            >
                                <Send className="h-4 w-4" />
                                Salvar
                            </Button>
                            <Button
                                variant="default"
                                className="bg-primary hover:bg-primary/90 gap-2"
                                onClick={handlePrintCard}
                            >
                                <Download className="h-4 w-4" />
                                Baixar / Imprimir Carteirinha
                            </Button>
                        </>
                    )}
                    {canEdit && (
                        <Button variant="destructive" size="icon" onClick={handleClear} className="print:hidden flex-shrink-0" title="Limpar">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-6 print:hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Selecionar Membro</Label>
                        <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Busque um membro..." />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Função/Cargo</Label>
                        <Select
                            value={formData.role}
                            onValueChange={(v) => setFormData({ ...formData, role: v })}
                            disabled={!selectedMemberId}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map(r => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Nome Completo</Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            disabled={!selectedMemberId}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>CNPJ da Igreja</Label>
                        <Input
                            value={formData.cnpj}
                            onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Data de Nascimento</Label>
                        <Input
                            type="date"
                            value={formData.birthDate}
                            onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                            disabled={!selectedMemberId}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Data de Batismo</Label>
                        <Input
                            type="date"
                            value={formData.baptismDate}
                            onChange={e => setFormData({ ...formData, baptismDate: e.target.value })}
                            disabled={!selectedMemberId}
                        />
                    </div>
                </div>
            </div>

            {/* Credencial Preview/Print */}
            <div className="flex flex-col items-center gap-12 py-8 bg-muted/20 rounded-xl print:bg-transparent print:p-0 id-card-print-container">
                {/* Frente */}
                <div className="w-[400px] h-[250px] bg-white border-2 border-primary/20 rounded-xl overflow-hidden shadow-xl print:shadow-none flex relative text-black text-left id-card-print-piece">
                    <div className="w-1/3 bg-primary/5 border-r p-4 flex flex-col items-center justify-center gap-3">
                        <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center border-2 border-primary/10 overflow-hidden">
                            {selectedMember?.photoUrl ? (
                                <img src={selectedMember.photoUrl} className="w-full h-full object-cover" />
                            ) : (
                                <Users className="h-12 w-12 text-muted-foreground/30" />
                            )}
                        </div>
                        <div className="text-[10px] font-bold uppercase text-primary text-center leading-tight">
                            Credencial Oficial
                        </div>
                    </div>
                    <div className="w-2/3 p-4 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="space-y-0.5">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider"><span>Nome do Membro</span></h4>
                                <p className="text-sm font-black uppercase text-primary leading-tight line-clamp-2"><span>{formData.name || 'NOME EXEMPLO'}</span></p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="space-y-0.5 text-left">
                                <h4 className="text-[8px] font-bold text-muted-foreground uppercase"><span>Nascimento</span></h4>
                                <p className="text-[10px] font-bold"><span>{formData.birthDate ? format(new Date(formData.birthDate), 'dd/MM/yyyy') : '--/--/----'}</span></p>
                            </div>
                            <div className="space-y-0.5 text-left">
                                <h4 className="text-[8px] font-bold text-muted-foreground uppercase"><span>Batismo</span></h4>
                                <p className="text-[10px] font-bold"><span>{formData.baptismDate ? format(new Date(formData.baptismDate), 'dd/MM/yyyy') : '--/--/----'}</span></p>
                            </div>
                        </div>

                        <div className="mt-2 p-2 bg-primary/10 rounded border border-primary/20 text-left">
                            <h4 className="text-[8px] font-bold text-primary uppercase">Função Eclesiástica</h4>
                            <p className="text-xs font-black uppercase tracking-wide">{formData.role}</p>
                        </div>

                        <div className="mt-4 flex flex-col items-center">
                            <div className="w-32 border-t border-black/30"></div>
                            <p className="text-[8px] uppercase font-bold mt-1">Portador(a)</p>
                        </div>
                    </div>
                </div>

                {/* Verso */}
                <div className="w-[400px] h-[250px] bg-white border-2 border-primary/20 rounded-xl overflow-hidden shadow-xl print:shadow-none flex flex-col items-center p-4 relative text-black text-center id-card-print-piece">
                    <div className="w-full flex justify-center mb-2">
                        <div className="h-10 w-auto">
                            <div className="text-xs font-black uppercase tracking-tighter text-primary">{formData.churchName}</div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase">CNPJ: {formData.cnpj}</p>
                        <p className="text-[9px] text-muted-foreground leading-tight">{formData.churchAddress}</p>
                    </div>

                    <div className="flex-1 w-full flex flex-col justify-center gap-6 mt-4">
                        <div className="flex flex-col items-center">
                            <div className="w-48 border-t border-black/40"></div>
                            <p className="text-[9px] font-bold uppercase mt-1">Pastor Presidente</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-40 border-t border-black/40"></div>
                            <p className="text-[9px] font-bold uppercase mt-1">Secretaria Geral</p>
                        </div>
                    </div>

                    <div className="w-full mt-4 text-[8px] text-muted-foreground uppercase font-medium">
                        Esta credencial é de uso pessoal e intransferível.
                    </div>
                </div>
            </div>
        </div>
    );
}

function SavedDocumentsList({ canEdit }: { canEdit: boolean }) {
    const [docs, setDocs] = useState<ChurchDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingDoc, setViewingDoc] = useState<ChurchDocument | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<ChurchDocument | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadDocs();
    }, []);

    async function loadDocs() {
        try {
            setLoading(true);
            const data = await documentsService.getAll();
            setDocs(data || []);
        } catch (error) {
            console.error('Error loading docs:', error);
            toast({ title: 'Erro', description: 'Erro ao carregar documentos.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }

    const handleDelete = (doc: ChurchDocument) => setDeleteConfirm(doc);
    async function executeDelete() {
        if (!deleteConfirm) return;
        try {
            await documentsService.delete(deleteConfirm.id, deleteConfirm.file_url);
            setDeleteConfirm(null);
            toast({ title: 'Sucesso', description: 'Documento excluído.' });
            loadDocs();
        } catch (error) {
            console.error('Error deleting doc:', error);
            toast({ title: 'Erro', description: 'Erro ao excluir documento.', variant: 'destructive' });
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6" translate="no">
            <ConfirmDialog
                open={!!deleteConfirm}
                onOpenChange={(o) => !o && setDeleteConfirm(null)}
                title="Excluir documento"
                description={deleteConfirm ? `Tem certeza que deseja excluir "${deleteConfirm.title}"?` : ''}
                onConfirm={executeDelete}
                confirmLabel="Excluir"
                variant="destructive"
            />
            <h2 className="text-2xl font-bold border-b pb-4"><span>Documentos Salvos</span></h2>
            {docs.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">
                    <span>Nenhum documento salvo encontrado.</span>
                </div>
            ) : (
                <div className="overflow-x-auto min-w-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><span>Título</span></TableHead>
                            <TableHead><span>Categoria</span></TableHead>
                            <TableHead><span>Data</span></TableHead>
                            <TableHead className="text-right"><span>Ações</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {docs.map((doc) => (
                            <TableRow key={doc.id}>
                                <TableCell className="font-medium"><span>{doc.title}</span></TableCell>
                                <TableCell><Badge variant="outline" className="capitalize"><span>{doc.category}</span></Badge></TableCell>
                                <TableCell>
                                    <span>
                                        {(() => {
                                            try {
                                                return format(new Date(doc.created_at), 'dd/MM/yyyy');
                                            } catch (e) {
                                                return '--/--/----';
                                            }
                                        })()}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    {doc.file_url.startsWith('text://') ? (
                                        <Button variant="ghost" size="icon" onClick={() => setViewingDoc(doc)}>
                                            <Search className="h-4 w-4" />
                                        </Button>
                                    ) : (
                                        <Button variant="ghost" size="icon" asChild>
                                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    )}
                                    {canEdit && (
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(doc)} className="text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </div>
            )}

            <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
                <DialogContent className="w-screen h-screen sm:w-[95vw] sm:max-w-3xl sm:h-auto sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6 rounded-none sm:rounded-lg">
                    <DialogHeader>
                        <DialogTitle>{viewingDoc?.title}</DialogTitle>
                        <DialogDescription>
                            Documento gerado em {viewingDoc && format(new Date(viewingDoc.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 p-6 bg-muted/30 rounded-lg whitespace-pre-wrap font-serif text-lg leading-relaxed">
                        {viewingDoc?.description}
                    </div>
                    <div className="flex justify-end gap-2 mt-4 print:hidden">
                        <Button onClick={() => window.print()} className="gap-2">
                            <Download className="h-4 w-4" />
                            Imprimir
                        </Button>
                        <Button variant="outline" onClick={() => setViewingDoc(null)}>
                            Fechar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
