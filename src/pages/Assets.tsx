import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, Pencil, Trash2, ShieldAlert, Image as ImageIcon, Wrench, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { assetsService } from '@/services/assets.service';
import { Asset, AssetSource, AssetStatus } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AssetMaintenanceModal } from '@/components/AssetMaintenanceModal';
import { ExcelPatrimonyReportButton } from '@/components/ExcelPatrimonyReport';
import { ExcelAdministrativeDashboardButton } from '@/components/ExcelAdministrativeDashboardButton';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';

// Formatadores de moeda brasileira
const formatCurrencyInput = (value: string): string => {
    const numericValue = value.replace(/[^\d]/g, '');
    if (!numericValue) return '';
    
    const cents = parseInt(numericValue, 10);
    const formatted = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(cents / 100);
    
    return formatted;
};

const parseCurrencyInput = (value: string): string => {
    if (!value) return '';
    return value.replace(/[^\d,]/g, '').replace(',', '.');
};

export default function Assets() {
    const { user } = useAuth();
    const { canEditAssets } = usePermissions();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

    const canEdit = canEditAssets;

    const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
    const [maintenanceAsset, setMaintenanceAsset] = useState<Asset | null>(null);

    // Form states
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState<AssetStatus>('ativo');
    const [value, setValue] = useState('');
    const [location, setLocation] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [acquisitionDate, setAcquisitionDate] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [qrCode, setQrCode] = useState('');

    const [source, setSource] = useState<AssetSource>('compra');
    const [donorName, setDonorName] = useState('');
    const [donationDate, setDonationDate] = useState('');
    const [documentRef, setDocumentRef] = useState('');

    const [depreciationEnabled, setDepreciationEnabled] = useState(false);
    const [usefulLifeYears, setUsefulLifeYears] = useState('');
    const [depreciationRate, setDepreciationRate] = useState('');
    const [residualValue, setResidualValue] = useState('');
    const [depreciationStartDate, setDepreciationStartDate] = useState('');

    const [maintenanceIntervalMonths, setMaintenanceIntervalMonths] = useState('');
    const [nextMaintenanceDate, setNextMaintenanceDate] = useState('');

    const [openMaintenanceAfterSave, setOpenMaintenanceAfterSave] = useState(false);

    const { data: assets = [], isLoading } = useQuery({
        queryKey: ['assets'],
        queryFn: () => assetsService.getAssets(),
    });

    const createMutation = useMutation({
        mutationFn: assetsService.createAsset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            toast.success('Patrimônio cadastrado com sucesso!');
            setIsModalOpen(false);
            resetForm();
        },
        onError: (error) => toast.error('Erro ao cadastrar patrimônio: ' + error.message),
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: string; asset: Partial<Asset> }) => assetsService.updateAsset(data.id, data.asset),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            toast.success('Patrimônio atualizado com sucesso!');
            setIsModalOpen(false);
            resetForm();
        },
        onError: (error) => toast.error('Erro ao atualizar patrimônio: ' + error.message),
    });

    const deleteMutation = useMutation({
        mutationFn: assetsService.deleteAsset,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['assets'] });
            toast.success('Patrimônio removido com sucesso!');
        },
        onError: (error) => toast.error('Erro ao remover patrimônio: ' + error.message),
    });

    const filteredAssets = assets.filter(
        (a) =>
            a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            a.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const resetForm = () => {
        setEditingAsset(null);
        setName('');
        setDescription('');
        setCategory('');
        setStatus('ativo');
        setValue('');
        setLocation('');
        setSerialNumber('');
        setAcquisitionDate('');
        setPhotoUrl('');
        setQrCode('');
        setSource('compra');
        setDonorName('');
        setDonationDate('');
        setDocumentRef('');
        setDepreciationEnabled(false);
        setUsefulLifeYears('');
        setDepreciationRate('');
        setResidualValue('');
        setDepreciationStartDate('');
        setMaintenanceIntervalMonths('');
        setNextMaintenanceDate('');
        setOpenMaintenanceAfterSave(false);
    };

    const openEdit = (asset: Asset) => {
        setEditingAsset(asset);
        setName(asset.name);
        setCategory(asset.category || '');
        setStatus(asset.status);
        setValue(asset.value ? Math.round(asset.value * 100).toString() : '');
        setLocation(asset.location || '');
        setDescription(asset.description || '');
        setSerialNumber(asset.serialNumber || '');
        setAcquisitionDate(asset.acquisitionDate || '');
        setPhotoUrl(asset.photoUrl || '');
        setQrCode(asset.qrCode || '');

        setSource(asset.source || 'compra');
        setDonorName(asset.donorName || '');
        setDonationDate(asset.donationDate || '');
        setDocumentRef(asset.documentRef || '');

        setDepreciationEnabled(!!asset.depreciationEnabled);
        setUsefulLifeYears(asset.usefulLifeYears !== undefined && asset.usefulLifeYears !== null ? String(asset.usefulLifeYears) : '');
        setDepreciationRate(asset.depreciationRate !== undefined && asset.depreciationRate !== null ? String(asset.depreciationRate) : '');
        setResidualValue(asset.residualValue !== undefined && asset.residualValue !== null ? Math.round(asset.residualValue * 100).toString() : '');
        setDepreciationStartDate(asset.depreciationStartDate || asset.acquisitionDate || '');

        setMaintenanceIntervalMonths(asset.maintenanceIntervalMonths !== undefined && asset.maintenanceIntervalMonths !== null ? String(asset.maintenanceIntervalMonths) : '');
        setNextMaintenanceDate(asset.nextMaintenanceDate || '');
        setOpenMaintenanceAfterSave(false);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!name.trim()) {
            toast.error('O nome do bem é obrigatório.');
            return;
        }

        const payload: Partial<Asset> = {
            name,
            description: description || undefined,
            category,
            status,
            location,
            value: value ? parseFloat(value) / 100 : undefined,
            serialNumber: serialNumber || undefined,
            acquisitionDate: acquisitionDate || undefined,
            photoUrl: photoUrl || undefined,
            qrCode: qrCode || undefined,

            source: source || undefined,
            donorName: source === 'doacao' ? (donorName || undefined) : undefined,
            donationDate: source === 'doacao' ? (donationDate || undefined) : undefined,
            documentRef: documentRef || undefined,

            depreciationEnabled,
            depreciationMethod: depreciationEnabled ? 'linear' : undefined,
            depreciationStartDate: depreciationEnabled ? (depreciationStartDate || acquisitionDate || undefined) : undefined,
            usefulLifeYears: depreciationEnabled && usefulLifeYears ? parseInt(usefulLifeYears, 10) : undefined,
            depreciationRate: depreciationEnabled && depreciationRate ? parseFloat(depreciationRate) : undefined,
            residualValue: depreciationEnabled && residualValue ? parseFloat(residualValue) / 100 : undefined,

            maintenanceIntervalMonths: maintenanceIntervalMonths ? parseInt(maintenanceIntervalMonths, 10) : undefined,
            nextMaintenanceDate: nextMaintenanceDate || undefined,
        };

        if (editingAsset) {
            updateMutation.mutate(
                { id: editingAsset.id, asset: payload },
                {
                    onSuccess: (_data) => {
                        if (openMaintenanceAfterSave) {
                            setMaintenanceAsset(editingAsset);
                            setIsMaintenanceOpen(true);
                        }
                    }
                } as any
            );
        } else {
            createMutation.mutate(payload, {
                onSuccess: (created) => {
                    if (openMaintenanceAfterSave) {
                        setMaintenanceAsset(created);
                        setIsMaintenanceOpen(true);
                    }
                }
            });
        }
    };

    const computeDepreciationPreview = () => {
        const initial = value ? parseFloat(value) / 100 : undefined;
        if (!depreciationEnabled || !initial || Number.isNaN(initial)) return null;
        const start = (depreciationStartDate || acquisitionDate) ? new Date(depreciationStartDate || acquisitionDate) : null;
        if (!start || Number.isNaN(start.getTime())) return null;
        const now = new Date();
        const years = Math.max(0, (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        const residual = residualValue ? parseFloat(residualValue) / 100 : 0;
        const rate = depreciationRate ? (parseFloat(depreciationRate) / 100) : null;
        const life = usefulLifeYears ? parseFloat(usefulLifeYears) : null;

        let depreciated: number | null = null;
        if (rate !== null && !Number.isNaN(rate) && rate > 0) {
            depreciated = initial * Math.pow(1 - rate, years);
        } else if (life !== null && !Number.isNaN(life) && life > 0) {
            const annual = (initial - residual) / life;
            depreciated = initial - (annual * years);
        }
        if (depreciated === null || Number.isNaN(depreciated)) return null;
        const floored = Math.max(residual, depreciated);
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(floored);
    };

    const getStatusColor = (st: AssetStatus) => {
        switch (st) {
            case 'ativo': return 'bg-green-100 text-green-800 border-green-200';
            case 'inativo': return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'em_manutencao': return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    const formatCurrency = (val?: number) => {
        if (val === undefined || val === null) return '-';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const handleDownloadExcel = () => {
        try {
            const link = document.createElement('a');
            link.href = '/planilha-patrimonio.xlsx';
            link.download = 'Planilha_Patrimonio_EXPERT.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success('Download iniciado! Planilha de Patrimônio sendo baixada.');
        } catch (error) {
            toast.error('Erro no download. Não foi possível baixar a planilha.');
        }
    };

    return (
        <div className="p-4 md:p-8 md:pt-4 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Package className="w-8 h-8 text-primary" />
                        Patrimônio
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestão de ativos, equipamentos e imóveis da igreja.
                    </p>
                </div>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="w-full sm:w-auto gap-2">
                    <Plus className="w-4 h-4" />
                    Novo Bem
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Input
                    placeholder="Buscar patrimônio ou categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                />
                <ExcelAdministrativeDashboardButton />
            </div>

            {isLoading ? (
                <div className="text-center py-10 text-muted-foreground">Carregando patrimônios...</div>
            ) : filteredAssets.length === 0 ? (
                <div className="text-center py-10 bg-card rounded-xl border border-border">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                    <h3 className="text-lg font-medium text-foreground">Nenhum bem patrimonial encontrado</h3>
                    <p className="text-muted-foreground mt-1">Clique em "Novo Bem" para cadastrar o primeiro.</p>
                </div>
            ) : (
                <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Identificação</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Local</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAssets.map((asset) => (
                                    <TableRow key={asset.id} className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="font-medium text-foreground">{asset.name}</div>
                                            {asset.createdAt && (
                                                <div className="text-xs text-muted-foreground">Reg: {format(new Date(asset.createdAt), 'dd/MM/yyyy')}</div>
                                            )}
                                            {(asset.nextMaintenanceDate || asset.depreciationEnabled) && (
                                                <div className="mt-1 text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                                                    {asset.nextMaintenanceDate && (
                                                        <span>Próx. manutenção: {format(new Date(asset.nextMaintenanceDate), 'dd/MM/yyyy')}</span>
                                                    )}
                                                    {asset.depreciationEnabled && (
                                                        <span>Depreciação: ativa</span>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>{asset.category || '-'}</TableCell>
                                        <TableCell>{asset.location || '-'}</TableCell>
                                        <TableCell className="font-medium">{formatCurrency(asset.value)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getStatusColor(asset.status)}>
                                                {asset.status === 'em_manutencao' ? 'Em Manutenção' : asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(asset)}>
                                                    <Pencil className="w-4 h-4 text-blue-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Excluir"
                                                    onClick={() => {
                                                        if (window.confirm(`Deseja realmente excluir "${asset.name}"?`)) {
                                                            deleteMutation.mutate(asset.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Manutenções"
                                                    onClick={() => {
                                                        setMaintenanceAsset(asset);
                                                        setIsMaintenanceOpen(true);
                                                    }}
                                                >
                                                    <Wrench className="w-4 h-4 text-orange-600" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )
            }

            {/* Modal - Cadastro de Patrimônio */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[720px] max-h-[90vh] overflow-hidden flex flex-col p-0">
                    <DialogHeader>
                        <div className="px-6 pt-6">
                            <DialogTitle>{editingAsset ? 'Editar bem patrimonial' : 'Cadastrar novo bem'}</DialogTitle>
                        </div>
                    </DialogHeader>

                    <div className="px-6 pb-4">
                        <Tabs defaultValue="basico" className="w-full">
                            <TabsList className="flex w-full justify-start overflow-x-auto overflow-y-hidden h-auto gap-1 p-1 scrollbar-hide snap-x">
                                <TabsTrigger value="basico" className="shrink-0 snap-start">Básico</TabsTrigger>
                                <TabsTrigger value="financeiro" className="shrink-0 snap-start">Financeiro</TabsTrigger>
                                <TabsTrigger value="manutencao" className="shrink-0 snap-start">Manutenção</TabsTrigger>
                                <TabsTrigger value="avancado" className="shrink-0 snap-start">Avançado</TabsTrigger>
                            </TabsList>
                            <Separator className="mt-4" />

                            <div className="flex-1 overflow-y-auto max-h-[calc(90vh-220px)] pr-1 mt-4">
                                <TabsContent value="basico" className="mt-0">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Nome do Bem *</label>
                                            <Input
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Ex: Mesa de Som Digital, Veículo Van, etc."
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Descrição / Observações</label>
                                            <Textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                placeholder="Detalhes, estado, acessórios, observações..."
                                                className="min-h-[90px]"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Categoria</label>
                                                <Input
                                                    value={category}
                                                    onChange={(e) => setCategory(e.target.value)}
                                                    placeholder="Ex: Eletrônicos, Imóveis"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Localização / Setor</label>
                                                <Input
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value)}
                                                    placeholder="Ex: Templo Principal"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Situação</label>
                                                <select
                                                    value={status}
                                                    onChange={(e) => setStatus(e.target.value as AssetStatus)}
                                                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="ativo">Ativo</option>
                                                    <option value="inativo">Inativo</option>
                                                    <option value="em_manutencao">Em Manutenção</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Data de Aquisição</label>
                                                <Input
                                                    type="date"
                                                    value={acquisitionDate}
                                                    onChange={(e) => setAcquisitionDate(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="financeiro" className="mt-0">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Valor Estimado</label>
                                                <Input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={value ? formatCurrencyInput(value) : ''}
                                                    onChange={(e) => {
                                                        const rawValue = e.target.value.replace(/[^\d]/g, '');
                                                        setValue(rawValue);
                                                    }}
                                                    placeholder="R$ 0,00"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Documento / Nota / Ref.</label>
                                                <Input
                                                    value={documentRef}
                                                    onChange={(e) => setDocumentRef(e.target.value)}
                                                    placeholder="Ex: NF 1234, Termo..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium">Depreciação</p>
                                                <p className="text-xs text-muted-foreground">Ative apenas quando quiser controlar perda de valor ao longo do tempo.</p>
                                            </div>
                                            <label className="flex items-center gap-2 text-sm shrink-0">
                                                <input
                                                    type="checkbox"
                                                    checked={depreciationEnabled}
                                                    onChange={(e) => setDepreciationEnabled(e.target.checked)}
                                                />
                                                Ativar
                                            </label>
                                        </div>

                                        {depreciationEnabled && (
                                            <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Início da Depreciação</label>
                                                        <Input
                                                            type="date"
                                                            value={depreciationStartDate}
                                                            onChange={(e) => setDepreciationStartDate(e.target.value)}
                                                        />
                                                        <p className="text-[11px] text-muted-foreground">Se vazio, usa a data de aquisição.</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Valor Residual</label>
                                                        <Input
                                                            type="text"
                                                            inputMode="numeric"
                                                            value={residualValue ? formatCurrencyInput(residualValue) : ''}
                                                            onChange={(e) => {
                                                                const rawValue = e.target.value.replace(/[^\d]/g, '');
                                                                setResidualValue(rawValue);
                                                            }}
                                                            placeholder="R$ 0,00"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Vida útil (anos)</label>
                                                        <Input
                                                            type="number"
                                                            value={usefulLifeYears}
                                                            onChange={(e) => setUsefulLifeYears(e.target.value)}
                                                            placeholder="Ex: 5"
                                                        />
                                                        <p className="text-[11px] text-muted-foreground">Opção A (linear por vida útil).</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Taxa (% ao ano)</label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={depreciationRate}
                                                            onChange={(e) => setDepreciationRate(e.target.value)}
                                                            placeholder="Ex: 10"
                                                        />
                                                        <p className="text-[11px] text-muted-foreground">Opção B (percentual ao ano).</p>
                                                    </div>
                                                </div>

                                                {computeDepreciationPreview() && (
                                                    <div className="text-xs bg-background border border-border rounded-xl p-3">
                                                        <span className="font-medium">Valor estimado hoje:</span> {computeDepreciationPreview()}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="manutencao" className="mt-0">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Intervalo (meses)</label>
                                                <Input
                                                    type="number"
                                                    value={maintenanceIntervalMonths}
                                                    onChange={(e) => setMaintenanceIntervalMonths(e.target.value)}
                                                    placeholder="Ex: 6"
                                                />
                                                <p className="text-[11px] text-muted-foreground">Para lembrete de manutenção preventiva.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Próxima manutenção</label>
                                                <Input
                                                    type="date"
                                                    value={nextMaintenanceDate}
                                                    onChange={(e) => setNextMaintenanceDate(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={openMaintenanceAfterSave}
                                                onChange={(e) => setOpenMaintenanceAfterSave(e.target.checked)}
                                            />
                                            Após salvar, abrir registro de manutenção
                                        </label>
                                    </div>
                                </TabsContent>

                                <TabsContent value="avancado" className="mt-0">
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Número de Série</label>
                                                <Input
                                                    value={serialNumber}
                                                    onChange={(e) => setSerialNumber(e.target.value)}
                                                    placeholder="Ex: SN12345"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Origem</label>
                                                <select
                                                    value={source}
                                                    onChange={(e) => setSource(e.target.value as AssetSource)}
                                                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                >
                                                    <option value="compra">Compra</option>
                                                    <option value="doacao">Doação</option>
                                                    <option value="comodato">Comodato</option>
                                                    <option value="outro">Outro</option>
                                                </select>
                                            </div>
                                        </div>

                                        {source === 'doacao' && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Doador</label>
                                                    <Input
                                                        value={donorName}
                                                        onChange={(e) => setDonorName(e.target.value)}
                                                        placeholder="Nome do doador"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Data da Doação</label>
                                                    <Input
                                                        type="date"
                                                        value={donationDate}
                                                        onChange={(e) => setDonationDate(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Foto (URL)</label>
                                                <Input
                                                    value={photoUrl}
                                                    onChange={(e) => setPhotoUrl(e.target.value)}
                                                    placeholder="https://..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">QR Code (texto)</label>
                                                <Input
                                                    value={qrCode}
                                                    onChange={(e) => setQrCode(e.target.value)}
                                                    placeholder="Código/identificador"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </div>

                    <div className="px-6 py-4 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                            {editingAsset ? 'Atualizar' : 'Salvar Cadastro'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <AssetMaintenanceModal
                isOpen={isMaintenanceOpen}
                onClose={() => setIsMaintenanceOpen(false)}
                asset={maintenanceAsset}
            />
        </div >
    );
}
