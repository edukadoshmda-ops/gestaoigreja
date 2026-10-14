import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { FileText, Send, Users, Loader2, Download, Trash2, CreditCard, Search, Plus, Minus, FileSpreadsheet, Upload, Church } from 'lucide-react';
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
import SecretaryMonthlyReportExcel from '@/components/SecretaryMonthlyReportExcel';
import { ExcelMembersButton } from '@/components/ExcelMembersReport';
import { ImportMembersModal } from '@/components/ImportMembersModal';
import { ExcelAdministrativeDashboardButton } from '@/components/ExcelAdministrativeDashboardButton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePermissions } from '@/hooks/usePermissions';
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
import { EmptyState } from '@/components/EmptyState';
import { cn } from '@/lib/utils';
import { DEFAULT_CHURCH_NAME, DEFAULT_CNPJ } from '@/lib/constants';
import { maskCNPJ } from '@/lib/masks';
import { MemberIdCard } from '@/components/MemberIdCard';
import { extractExtendedFields } from '@/lib/memberUtils';
import { useTenant, globalChurchLogo, globalChurchName } from '@/hooks/useTenant';
import { churchesService } from '@/services/churches.service';

export default function Secretariat() {
    useDocumentTitle('Secretaria');
    const [activeTab, setActiveTab] = useState('minutes');
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();
    const { user, churchId, viewingChurch } = useAuth();
    const { canEditSecretariat } = usePermissions();
    const { tenant } = useTenant();
    const effectiveChurchId = viewingChurch?.id || churchId || user?.churchId;

    const [churchData, setChurchData] = useState({
        name: tenant?.name || viewingChurch?.name || globalChurchName || DEFAULT_CHURCH_NAME,
        logoUrl: tenant?.logo_url || globalChurchLogo || '',
        address: tenant?.address || 'Av. Principal, 1000 - Centro',
        cnpj: (tenant as any)?.cnpj || DEFAULT_CNPJ,
        presidentName: tenant?.president_name || 'Pastor Presidente',
    });

    useEffect(() => {
        if (tenant) {
            setChurchData(prev => ({
                ...prev,
                name: tenant.name || prev.name,
                logoUrl: tenant.logo_url || prev.logoUrl,
                address: tenant.address || prev.address,
                cnpj: (tenant as any).cnpj || prev.cnpj,
                presidentName: tenant.president_name || prev.presidentName,
            }));
        }
        if (effectiveChurchId) {
            churchesService.getById(effectiveChurchId).then((c: any) => {
                if (c) {
                    setChurchData(prev => ({
                        ...prev,
                        name: c.name || prev.name,
                        logoUrl: c.logo_url || prev.logoUrl,
                        address: c.address || prev.address,
                        cnpj: c.cnpj || prev.cnpj,
                        presidentName: c.president_name || prev.presidentName,
                    }));
                }
            }).catch(() => {});
        } else if (!tenant) {
            churchesService.getAll().then((list: any[]) => {
                const c = list?.[0];
                if (c) {
                    setChurchData(prev => ({
                        ...prev,
                        name: c.name || prev.name,
                        logoUrl: c.logo_url || prev.logoUrl,
                        address: c.address || prev.address,
                        cnpj: c.cnpj || prev.cnpj,
                        presidentName: c.president_name || prev.presidentName,
                    }));
                }
            }).catch(() => {});
        }
    }, [effectiveChurchId, tenant, viewingChurch?.id, viewingChurch?.name]);

    useEffect(() => {
        const handleBranding = (e: any) => {
            const detail = e.detail;
            if (detail) {
                setChurchData(prev => ({
                    ...prev,
                    name: detail.name || prev.name,
                    logoUrl: detail.logo || prev.logoUrl,
                }));
            }
        };
        const handleLogo = (e: any) => {
            if (e.detail) {
                setChurchData(prev => ({ ...prev, logoUrl: e.detail }));
            }
        };
        window.addEventListener('churchBrandingUpdated', handleBranding);
        window.addEventListener('churchLogoUpdated', handleLogo);
        return () => {
            window.removeEventListener('churchBrandingUpdated', handleBranding);
            window.removeEventListener('churchLogoUpdated', handleLogo);
        };
    }, []);

    // Permissão: Pastor, Secretário e SuperAdmin podem editar
    const canEdit = canEditSecretariat;

    const handlePrint = () => {
        window.print();
    };

    // Carrega membros ao montar o componente
    useEffect(() => {
        loadMembers();
    }, [effectiveChurchId]);

    async function loadMembers() {
        try {
            setError(null);
            setLoading(true);
            const data = await membersService.getAll(effectiveChurchId);

            const mappedMembers: Member[] = (data || []).map((m: any) => {
                try {
                    const ext = extractExtendedFields(m);
                    return {
                        id: m.id,
                        churchId: m.church_id || '',
                        name: m.name || 'Sem Nome',
                        email: m.email || '',
                        phone: m.phone || '',
                        birthDate: m.birth_date || '',
                        baptismDate: m.baptism_date || '',
                        role: m.church_role || ext.role || 'Membro',
                        address: m.address || '',
                        photoUrl: m.photo_url || '',
                        category: m.status === 'visitante' ? 'congregado' : 'membro',
                        createdAt: m.created_at || new Date().toISOString(),
                        notes: m.notes,
                        ...ext,
                    } as Member;
                } catch (e) {
                    return null;
                }
            }).filter((m: any) => m !== null) as Member[];
            setMembers(mappedMembers);
        } catch (err: any) {
            console.error('Secretariat Error:', err);
            setMembers([]);
            const msg = err?.message || '';
            const isApiKey = /invalid api key|invalid.*key|api key/i.test(msg);
            const isSessionOrPerm = /session|permission|RLS|401|403|PGRST/i.test(msg) || msg.includes('fetch');
            let displayMsg = msg || 'Não foi possível carregar.';
            if (isApiKey) {
                displayMsg = 'Chave do Supabase inválida ou não configurada. Crie o arquivo .env.local na raiz do projeto com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (painel Supabase → Settings → API) e reinicie o servidor.';
            } else if (isSessionOrPerm) {
                displayMsg = 'Sessão expirada ou sem permissão.';
            }
            setError(displayMsg);
            toast({
                title: 'Erro ao carregar secretaria',
                description: isApiKey ? 'Configure o Supabase no .env.local' : 'Verifique se você tem as permissões necessárias.',
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
                {canEdit && (
                    <div className="flex flex-wrap items-center gap-2">
                        <ExcelAdministrativeDashboardButton />
                        <Button onClick={handlePrint} className="gap-2">
                            <Download className="h-4 w-4" />
                            Baixar PDF / Imprimir
                        </Button>
                    </div>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="flex w-full justify-start overflow-x-auto overflow-y-hidden h-auto gap-2 p-1 scrollbar-hide snap-x print:hidden" translate="no">
                    <TabsTrigger value="minutes" className="gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-sm shrink-0 snap-start">
                        <FileText className="h-5 w-5 shrink-0 md:h-5 md:w-5" />
                        <span className="truncate min-w-0">Atas</span>
                    </TabsTrigger>
                    <TabsTrigger value="transfer" className="gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-sm shrink-0 snap-start">
                        <Send className="h-5 w-5 shrink-0 md:h-5 md:w-5" />
                        <span className="truncate min-w-0">Transferência</span>
                    </TabsTrigger>
                    <TabsTrigger value="roll" className="gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-sm shrink-0 snap-start">
                        <Users className="h-5 w-5 shrink-0 md:h-5 md:w-5" />
                        <span className="truncate min-w-0">Rol</span>
                    </TabsTrigger>
                    <TabsTrigger value="idcard" className="gap-1.5 sm:gap-2 py-2.5 sm:py-3 text-sm shrink-0 snap-start">
                        <CreditCard className="h-5 w-5 shrink-0 md:h-5 md:w-5" />
                        <span className="truncate min-w-0">Carteirinha</span>
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

                <div className="bg-white dark:bg-card p-8 rounded-xl shadow-sm print:shadow-none min-h-[600px] print:p-0 text-foreground print-content">
                    <TabsContent value="minutes" className="mt-0 space-y-6">
                        <MinutesTemplate canEdit={canEdit} churchName={churchData.name} churchLogo={churchData.logoUrl} />
                    </TabsContent>

                    <TabsContent value="transfer" className="mt-0 space-y-6">
                        <TransferLetter members={members} canEdit={canEdit} churchName={churchData.name} churchLogo={churchData.logoUrl} pastorName={churchData.presidentName} />
                    </TabsContent>

                    <TabsContent value="roll" className="mt-0 space-y-6">
                        {loading ? (
                            <div className="flex justify-center p-8 print:hidden">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <MembersRoll members={members} canEdit={canEdit} onRefresh={loadMembers} churchName={churchData.name} churchLogo={churchData.logoUrl} />
                        )}
                    </TabsContent>

                    <TabsContent value="idcard" className="mt-0 space-y-6">
                        <MemberIdCardTemplate members={members} canEdit={canEdit} defaultChurchData={churchData} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

function MinutesTemplate({ canEdit, churchName, churchLogo }: { canEdit: boolean; churchName?: string; churchLogo?: string }) {
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
                <div className="flex flex-col items-center justify-center mb-6 text-center">
                    {churchLogo ? (
                        <img src={churchLogo} alt={churchName || 'Logo da Igreja'} className="max-h-20 max-w-[200px] object-contain mb-2" />
                    ) : (
                        <div className="w-14 h-14 rounded-full border border-black/80 flex items-center justify-center mb-2">
                            <Church className="w-7 h-7 text-black" />
                        </div>
                    )}
                    {churchName && (
                        <h4 className="text-base font-bold uppercase tracking-wider text-black">{churchName}</h4>
                    )}
                </div>
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

function TransferLetter({
    members,
    canEdit,
    churchName,
    churchLogo,
    pastorName
}: {
    members: Member[];
    canEdit: boolean;
    churchName?: string;
    churchLogo?: string;
    pastorName?: string;
}) {
    const [name, setName] = useState('');
    const [destination, setDestination] = useState('');
    const [origin, setOrigin] = useState(churchName || 'Igreja Comunidade Cristã');
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [saving, setSaving] = useState(false);
    const [clearConfirm, setClearConfirm] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (churchName) {
            setOrigin(churchName);
        }
    }, [churchName]);

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

            <div className="flex flex-col max-w-2xl mx-auto font-serif leading-relaxed text-justify space-y-6 mt-12 text-black bg-white p-12 shadow-xl rounded-xl print:shadow-none print:p-0">
                <div className="flex flex-col items-center justify-center mb-6 text-center">
                    {churchLogo ? (
                        <img
                            src={churchLogo}
                            alt={origin || churchName || 'Logo da Igreja'}
                            className="max-h-24 max-w-[220px] object-contain mb-3"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full border-2 border-black/80 flex items-center justify-center mb-3">
                            <Church className="w-8 h-8 text-black" />
                        </div>
                    )}
                    <h2 className="text-xl font-bold uppercase tracking-wider text-black">
                        {origin || churchName || 'Nome da Igreja'}
                    </h2>
                </div>
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
                    <p>{pastorName || 'Pastor Responsável'}</p>
                </div>
            </div>
        </div>
    );
}

function MembersRoll({
    members,
    canEdit = true,
    onRefresh,
    churchName,
    churchLogo
}: {
    members: Member[];
    canEdit?: boolean;
    onRefresh?: () => void;
    churchName?: string;
    churchLogo?: string;
}) {
    const [filter, setFilter] = useState('');
    const [importModalOpen, setImportModalOpen] = useState(false);
    const { toast } = useToast();

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
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                        <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <div className="text-left">
                            <p className="text-xs text-muted-foreground">Membros</p>
                            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{membrosCount}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div className="text-left">
                            <p className="text-xs text-muted-foreground">Congregados</p>
                            <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{congregadosCount}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl">
                        <Users className="h-5 w-5 text-primary" />
                        <div className="text-left">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-2xl font-bold text-primary">{filtered.length}</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-5 print:hidden">
                    <ExcelMembersButton />
                    {canEdit && (
                        <Button
                            variant="outline"
                            onClick={() => setImportModalOpen(true)}
                            className="gap-2 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold"
                        >
                            <Upload className="h-4 w-4 text-emerald-600" />
                            Importar Planilha Excel
                        </Button>
                    )}
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

                <ImportMembersModal
                    open={importModalOpen}
                    onOpenChange={setImportModalOpen}
                    onSuccess={() => {
                        if (onRefresh) onRefresh();
                    }}
                />
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
                    <div className="flex flex-col items-center justify-center mb-4 text-center">
                        {churchLogo ? (
                            <img src={churchLogo} alt={churchName || 'Logo da Igreja'} className="max-h-20 max-w-[200px] object-contain mb-2" />
                        ) : (
                            <div className="w-14 h-14 rounded-full border border-black/80 flex items-center justify-center mb-2">
                                <Church className="w-7 h-7 text-black" />
                            </div>
                        )}
                        {churchName && (
                            <h3 className="text-base font-bold uppercase tracking-wider text-black">{churchName}</h3>
                        )}
                    </div>
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

function MemberIdCardTemplate({
    members,
    canEdit,
    defaultChurchData
}: {
    members: Member[];
    canEdit: boolean;
    defaultChurchData?: {
        name: string;
        logoUrl?: string;
        address: string;
        cnpj: string;
        presidentName: string;
    };
}) {
    const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id || '');
    const [cnpj, setCnpj] = useState(defaultChurchData?.cnpj || DEFAULT_CNPJ);
    const [churchName, setChurchName] = useState(defaultChurchData?.name || DEFAULT_CHURCH_NAME);
    const [pastorName, setPastorName] = useState(defaultChurchData?.presidentName || 'Pastor Presidente');
    const [churchAddress, setChurchAddress] = useState(defaultChurchData?.address || 'Av. Principal, 1000 - Centro');
    const [churchLogo, setChurchLogo] = useState(defaultChurchData?.logoUrl || '');
    const [saving, setSaving] = useState(false);
    const { churchId, viewingChurch, user } = useAuth();
    const effectiveChurchId = viewingChurch?.id ?? churchId ?? user?.churchId;
    const { toast } = useToast();

    useEffect(() => {
        if (!selectedMemberId && members.length > 0) {
            setSelectedMemberId(members[0].id);
        }
    }, [members, selectedMemberId]);

    useEffect(() => {
        if (defaultChurchData) {
            if (defaultChurchData.name) setChurchName(defaultChurchData.name);
            if (defaultChurchData.cnpj) setCnpj(defaultChurchData.cnpj);
            if (defaultChurchData.address) setChurchAddress(defaultChurchData.address);
            if (defaultChurchData.presidentName) setPastorName(defaultChurchData.presidentName);
            if (defaultChurchData.logoUrl) setChurchLogo(defaultChurchData.logoUrl);
        }
    }, [defaultChurchData]);

    const selectedMember = members.find(m => m.id === selectedMemberId) || members[0];

    return (
        <div className="space-y-6">
            <div className="bg-card p-5 rounded-2xl border shadow-sm space-y-4 print:hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b">
                    <div>
                        <h3 className="font-bold text-base flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-primary" />
                            <span>Emissão e Personalização de Carteirinhas</span>
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Selecione um membro da igreja para visualizar e customizar sua credencial oficial.
                        </p>
                    </div>
                    {selectedMember && canEdit && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            disabled={saving}
                            onClick={async () => {
                                try {
                                    setSaving(true);
                                    await documentsService.create({
                                        title: `Credencial - ${selectedMember.name}`,
                                        description: `Credencial emitida para ${selectedMember.name} com cargo ${selectedMember.role || 'Membro'}.`,
                                        category: 'credential',
                                        file_url: 'text://' + selectedMember.name,
                                        file_type: 'text/plain'
                                    });
                                    toast({ title: 'Sucesso', description: 'Credencial registrada no histórico de documentos!' });
                                } catch (error) {
                                    toast({ title: 'Erro ao salvar', variant: 'destructive' });
                                } finally {
                                    setSaving(false);
                                }
                            }}
                        >
                            <Send className="h-4 w-4" />
                            Registrar Documento
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                    <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase">
                            Membro Selecionado
                        </Label>
                        <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                            <SelectTrigger className="h-9 font-medium">
                                <SelectValue placeholder="Selecione um membro..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-72">
                                {members.map(m => (
                                    <SelectItem key={m.id} value={m.id}>
                                        <div className="flex items-center gap-2">
                                            <span>{m.prefix ? `${m.prefix} ` : ''}{m.name}</span>
                                            {m.role && <span className="text-[10px] text-muted-foreground">({m.role})</span>}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase">
                            Nome da Igreja
                        </Label>
                        <Input
                            value={churchName}
                            onChange={e => setChurchName(e.target.value)}
                            className="h-9 text-xs"
                            placeholder="Nome oficial"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-muted-foreground uppercase">
                            CNPJ da Igreja
                        </Label>
                        <Input
                            value={cnpj}
                            onChange={e => setCnpj(maskCNPJ(e.target.value))}
                            className="h-9 text-xs font-mono"
                            placeholder="00.000.000/0001-00"
                        />
                    </div>
                </div>
            </div>

            {selectedMember ? (
                <MemberIdCard
                    member={selectedMember}
                    churchName={churchName}
                    churchLogo={churchLogo}
                    pastorName={pastorName}
                    cnpj={cnpj}
                    churchAddress={churchAddress}
                    onUpdateMember={(updated) => {
                        setMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, ...updated } : m));
                    }}
                />
            ) : (
                <div className="text-center py-16 bg-muted/20 rounded-2xl border border-dashed">
                    <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <h3 className="font-bold text-base">Nenhum membro selecionado</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                        Cadastre membros na aba de Membros ou selecione um membro cadastrado no campo acima para gerar e personalizar a credencial.
                    </p>
                </div>
            )}
        </div>
    );
}

function SavedDocumentsList({ canEdit }: { canEdit: boolean }) {
    const { churchId, viewingChurch, user } = useAuth();
    const effectiveChurchId = viewingChurch?.id ?? churchId ?? user?.churchId;
    const [docs, setDocs] = useState<ChurchDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewingDoc, setViewingDoc] = useState<ChurchDocument | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<ChurchDocument | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadDocs();
    }, [effectiveChurchId]);

    async function loadDocs() {
        try {
            setLoading(true);
            const data = await documentsService.getAll(effectiveChurchId);
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
                <EmptyState
                    icon={FileText}
                    title="Nenhum documento salvo"
                    description="Os documentos que você salvar aparecerão aqui."
                />
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
                <DialogContent className="w-screen h-screen sm:w-[95vw] sm:max-w-3xl sm:h-auto sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6 rounded-xl">
                    <DialogHeader>
                        <DialogTitle>{viewingDoc?.title}</DialogTitle>
                        <DialogDescription>
                            Documento gerado em {viewingDoc && format(new Date(viewingDoc.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 p-6 bg-muted/30 rounded-xl whitespace-pre-wrap font-serif text-lg leading-relaxed">
                        {viewingDoc?.description}
                    </div>
                    <div className="flex justify-end gap-2 mt-4 print:hidden">
                        {canEdit && (
                            <Button onClick={() => window.print()} className="gap-2">
                                <Download className="h-4 w-4" />
                                Imprimir
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setViewingDoc(null)}>
                            Fechar
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
