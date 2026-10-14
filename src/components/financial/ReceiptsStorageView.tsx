import React, { useState, useMemo, useEffect } from 'react';
import {
  FinancialTransactionExtended,
  financialManagementService,
} from '@/services/financial-management.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CloudUpload,
  FileText,
  Download,
  Search,
  Calendar,
  Filter,
  Eye,
  Paperclip,
  CheckCircle2,
  ExternalLink,
  FolderArchive,
  Image as ImageIcon,
  Loader2,
  ZoomIn,
  ZoomOut,
  HardDrive,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { googleDriveService } from '@/services/googleDrive.service';

interface ReceiptsStorageViewProps {
  churchId: string;
  transactions: FinancialTransactionExtended[];
  onRefresh: () => void;
  onOpenNewTransaction: () => void;
}

export function ReceiptsStorageView({
  churchId,
  transactions,
  onRefresh,
  onOpenNewTransaction,
}: ReceiptsStorageViewProps) {
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState<{
    url: string;
    isImage?: boolean;
    filename?: string;
    description?: string;
    amount?: number;
    date?: string;
  } | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [driveEmail, setDriveEmail] = useState<string | null>(null);
  const [driveLoading, setDriveLoading] = useState(true);
  const [connectingDrive, setConnectingDrive] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<{ done: number; total: number } | null>(null);

  const localLegacyReceipts = useMemo(
    () => transactions.filter((transaction) => transaction.receipt_url?.startsWith('data:')),
    [transactions]
  );

  useEffect(() => {
    let active = true;
    setDriveLoading(true);
    googleDriveService.getStatus(churchId)
      .then((status) => {
        if (active) setDriveEmail(status.email);
      })
      .catch((error) => {
        if (active) {
          setDriveEmail(null);
          toast({
            title: 'Não foi possível verificar o Google Drive',
            description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
            variant: 'destructive',
          });
        }
      })
      .finally(() => {
        if (active) setDriveLoading(false);
      });
    return () => {
      active = false;
    };
  }, [churchId, toast]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('googleDrive');
    if (!result) return;
    if (result === 'connected') {
      toast({ title: 'Google Drive conectado', description: 'Os novos comprovantes serão salvos no Drive desta igreja.' });
      googleDriveService.getStatus(churchId)
        .then((status) => setDriveEmail(status.email))
        .catch((error) => toast({
          title: 'Conexão concluída, mas não foi possível confirmar o estado',
          description: error instanceof Error ? error.message : 'Atualize a página para verificar.',
          variant: 'destructive',
        }));
    } else {
      toast({
        title: 'Não foi possível conectar ao Google Drive',
        description: params.get('message') || 'A autorização não foi concluída.',
        variant: 'destructive',
      });
    }
    params.delete('googleDrive');
    params.delete('message');
    const query = params.toString();
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`
    );
  }, [churchId, toast]);

  const handleConnectDrive = async () => {
    setConnectingDrive(true);
    try {
      await googleDriveService.beginConnection(churchId, window.location.pathname);
    } catch (error) {
      setConnectingDrive(false);
      toast({
        title: 'Não foi possível iniciar a conexão',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const migrateLocalReceipts = async () => {
    if (!driveEmail || migrationProgress) return;
    const sources = new Map<string, string>();
    const failures: string[] = [];
    let migrated = 0;
    setMigrationProgress({ done: 0, total: localLegacyReceipts.length });

    for (let index = 0; index < localLegacyReceipts.length; index += 1) {
      const transaction = localLegacyReceipts[index];
      const dataUrl = transaction.receipt_url!;
      try {
        if (transaction.id.startsWith('tx-')) {
          throw new Error('O lançamento existe apenas neste navegador e não pode ser sincronizado.');
        }

        let driveReceipt = sources.get(dataUrl);
        if (!driveReceipt) {
          const match = /^data:([^;,]+);base64,(.+)$/s.exec(dataUrl);
          if (!match) throw new Error('Formato local de comprovante não reconhecido.');
          const binary = atob(match[2]);
          const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
          if (bytes.length > 5 * 1024 * 1024) throw new Error('O arquivo ultrapassa o limite de 5 MB.');
          const file = new File(
            [bytes],
            transaction.receipt_filename || `comprovante-${transaction.id}`,
            { type: match[1] }
          );
          driveReceipt = await googleDriveService.upload(churchId, file);
          sources.set(dataUrl, driveReceipt);
        }

        await financialManagementService.updateTransaction(churchId, transaction.id, {
          receipt_url: driveReceipt,
          receipt_filename: transaction.receipt_filename || 'Comprovante',
        });
        migrated += 1;
      } catch (error) {
        console.error(`Falha ao migrar comprovante da transação ${transaction.id}:`, error);
        failures.push(error instanceof Error ? error.message : 'Falha inesperada ao migrar um comprovante.');
      } finally {
        setMigrationProgress({ done: index + 1, total: localLegacyReceipts.length });
      }
    }

    setMigrationProgress(null);
    onRefresh();
    if (failures.length) {
      toast({
        title: `${migrated} de ${localLegacyReceipts.length} comprovantes migrados`,
        description: `Falhas: ${failures.length}. ${failures[0]}`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Comprovantes migrados',
        description: `${migrated} comprovantes deste navegador agora estão no Drive da igreja.`,
      });
    }
  };

  const openReceipt = async (transaction: FinancialTransactionExtended) => {
    if (!transaction.receipt_url) return;
    try {
      const preview = await googleDriveService.createPreviewUrl(churchId, transaction.receipt_url);
      setSelectedReceipt({
        url: preview.url,
        isImage: preview.isImage,
        filename: transaction.receipt_filename || undefined,
        description: transaction.description || undefined,
        amount: transaction.amount,
        date: transaction.date,
      });
    } catch (error) {
      toast({
        title: 'Não foi possível abrir o comprovante',
        description: error instanceof Error ? error.message : 'Verifique a conexão com o Google Drive.',
        variant: 'destructive',
      });
    }
  };

  const downloadReceipt = async (transaction: FinancialTransactionExtended) => {
    if (!transaction.receipt_url) return;
    try {
      const preview = await googleDriveService.createPreviewUrl(churchId, transaction.receipt_url);
      const link = document.createElement('a');
      link.href = preview.url;
      link.download = transaction.receipt_filename || 'comprovante';
      document.body.appendChild(link);
      link.click();
      link.remove();
      if (preview.url.startsWith('blob:')) window.setTimeout(() => URL.revokeObjectURL(preview.url), 1000);
    } catch (error) {
      toast({
        title: 'Não foi possível baixar o comprovante',
        description: error instanceof Error ? error.message : 'Verifique a conexão com o Google Drive.',
        variant: 'destructive',
      });
    }
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // Transações que possuem comprovante anexado
  const transactionsWithReceipts = useMemo(() => {
    return transactions.filter((t) => !!t.receipt_url);
  }, [transactions]);

  // Transações sem comprovante (para controle do contador)
  const transactionsWithoutReceipts = useMemo(() => {
    return transactions.filter((t) => !t.receipt_url && t.type === 'saida');
  }, [transactions]);

  // Aplicar filtros
  const filteredReceipts = useMemo(() => {
    return transactionsWithReceipts.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false;
      if (filterMonth !== 'all') {
        const m = t.date.substring(5, 7);
        if (m !== filterMonth) return false;
      }
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        const fn = (t.receipt_filename || '').toLowerCase();
        if (!desc.includes(q) && !cat.includes(q) && !fn.includes(q)) return false;
      }
      return true;
    });
  }, [transactionsWithReceipts, filterMonth, filterType, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Banner de Documentos e Notas Fiscais */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <CloudUpload className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">
              Central de Comprovantes & Notas Fiscais na Nuvem
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Comprovantes privados no Google Drive institucional, acessíveis à equipe autorizada da igreja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {driveEmail ? (
            <Badge variant="outline" className="gap-1.5">
              <HardDrive className="h-3.5 w-3.5" /> Drive: {driveEmail}
            </Badge>
          ) : (
            <Button
              variant="outline"
              onClick={handleConnectDrive}
              disabled={driveLoading || connectingDrive}
              className="text-xs gap-1.5"
            >
              {connectingDrive ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDrive className="h-4 w-4" />}
              Conectar Google Drive da igreja
            </Button>
          )}
          <Button onClick={onOpenNewTransaction} className="text-xs gap-1.5">
            <Paperclip className="h-4 w-4" /> Anexar em Novo Lançamento
          </Button>
        </div>
      </div>

      {!driveEmail && !driveLoading && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Conecte o Drive institucional da igreja para que os novos comprovantes sejam armazenados na nuvem e compartilhados com a equipe autorizada.
        </p>
      )}
      {driveEmail && localLegacyReceipts.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="text-xs text-muted-foreground">
            Há {localLegacyReceipts.length} comprovante(s) antigo(s) guardado(s) somente neste navegador.
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={!!migrationProgress}
            onClick={() => void migrateLocalReceipts()}
            className="shrink-0 text-xs"
          >
            {migrationProgress ? (
              <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Migrando {migrationProgress.done}/{migrationProgress.total}</>
            ) : 'Migrar para o Google Drive'}
          </Button>
        </div>
      )}

      {/* Cards de Status Documental */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border bg-card">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
              <span>Comprovantes Arquivados</span>
              <FolderArchive className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-primary">
              {transactionsWithReceipts.length} arquivos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              {driveEmail
                ? localLegacyReceipts.length
                  ? 'No Drive e arquivos antigos deste navegador'
                  : 'No Drive institucional conectado'
                : 'Inclui arquivos locais deste navegador'}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-emerald-600 uppercase flex items-center justify-between">
              <span>Valor Total Comprovado</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              {fmt(transactionsWithReceipts.reduce((sum, t) => sum + t.amount, 0))}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">Notas e recibos vinculados a transações</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-amber-600 uppercase flex items-center justify-between">
              <span>Saídas Pendentes de Anexo</span>
              <FileText className="h-4 w-4 text-amber-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-600">
              {transactionsWithoutReceipts.length} despesas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">Pagamentos sem comprovante anexado</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros da Galeria */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição, fornecedor ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Mês */}
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Meses</SelectItem>
              <SelectItem value="01">Janeiro</SelectItem>
              <SelectItem value="02">Fevereiro</SelectItem>
              <SelectItem value="03">Março</SelectItem>
              <SelectItem value="04">Abril</SelectItem>
              <SelectItem value="05">Maio</SelectItem>
              <SelectItem value="06">Junho</SelectItem>
              <SelectItem value="07">Julho</SelectItem>
              <SelectItem value="08">Agosto</SelectItem>
              <SelectItem value="09">Setembro</SelectItem>
              <SelectItem value="10">Outubro</SelectItem>
              <SelectItem value="11">Novembro</SelectItem>
              <SelectItem value="12">Dezembro</SelectItem>
            </SelectContent>
          </Select>

          {/* Tipo */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tipos</SelectItem>
              <SelectItem value="saida">Despesas</SelectItem>
              <SelectItem value="entrada">Receitas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Galeria de Comprovantes */}
      {filteredReceipts.length === 0 ? (
        <Card className="rounded-2xl border-dashed border-2 border-border p-12 text-center space-y-3">
          <CloudUpload className="h-12 w-12 mx-auto text-muted-foreground/60" />
          <h3 className="font-semibold text-base">Nenhum comprovante encontrado</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Ao cadastrar lançamentos de saídas ou entradas no sistema, anexe a foto ou PDF da nota fiscal, recibo ou cupom para que fique guardado aqui automaticamente.
          </p>
          <Button onClick={onOpenNewTransaction} size="sm" className="text-xs">
            <Paperclip className="h-3.5 w-3.5 mr-1.5" /> Anexar Comprovante Agora
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredReceipts.map((t) => {
            const isImage = !googleDriveService.isDriveReceipt(t.receipt_url) && (
              t.receipt_url?.startsWith('data:image') ||
              t.receipt_url?.endsWith('.png') ||
              t.receipt_url?.endsWith('.jpg') ||
              t.receipt_url?.endsWith('.jpeg')
            );

            return (
              <Card
                key={t.id}
                className="rounded-2xl border-border overflow-hidden hover:shadow-md transition-shadow group flex flex-col justify-between"
              >
                {/* Preview Thumbnail */}
                <div
                  onClick={() => void openReceipt(t)}
                  className="h-36 bg-muted/60 relative cursor-pointer overflow-hidden flex items-center justify-center border-b border-border"
                >
                  {isImage ? (
                    <img
                      src={t.receipt_url!}
                      alt={t.receipt_filename || 'Comprovante'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="text-center p-4 space-y-2">
                      <FileText className="h-10 w-10 mx-auto text-primary/70" />
                      <span className="text-[11px] font-medium text-foreground block truncate max-w-[180px]">
                        {t.receipt_filename || 'Documento PDF'}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-2 right-2">
                    <Badge
                      className={
                        t.type === 'entrada'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }
                    >
                      {t.type === 'entrada' ? 'Entrada' : 'Despesa'}
                    </Badge>
                  </div>
                </div>

                {/* Detalhes do Lançamento */}
                <CardContent className="p-3 space-y-2 flex-1">
                  <div>
                    <p className="text-xs font-bold text-foreground truncate">
                      {t.description || t.category}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{t.category}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                    <span className="text-muted-foreground">
                      {format(parseISO(t.date), 'dd/MM/yyyy')}
                    </span>
                    <span
                      className={`font-bold ${
                        t.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {fmt(t.amount)}
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void openReceipt(t)}
                      className="w-full text-xs h-7 gap-1"
                    >
                      <Eye className="h-3 w-3" /> Visualizar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => void downloadReceipt(t)}
                      aria-label="Baixar comprovante"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Exibição do Comprovante */}
      {/* Modal de Exibição do Comprovante (Aumentado em +100% com Zoom) */}
      <Dialog
        open={!!selectedReceipt}
        onOpenChange={(o) => {
          if (!o) {
            if (selectedReceipt?.url.startsWith('blob:')) URL.revokeObjectURL(selectedReceipt.url);
            setSelectedReceipt(null);
            setPreviewZoom(1);
          }
        }}
      >
        <DialogContent className="w-[96vw] max-w-6xl max-h-[94vh] flex flex-col p-4 sm:p-6 rounded-2xl overflow-hidden">
          <DialogHeader className="pb-3 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                <Paperclip className="h-5 w-5 text-primary" />
                <span>{selectedReceipt?.filename || 'Comprovante Anexado'}</span>
                {selectedReceipt?.amount && (
                  <span className="text-emerald-600 text-sm font-bold ml-2">
                    ({fmt(selectedReceipt.amount)})
                  </span>
                )}
              </DialogTitle>

              {selectedReceipt?.url && (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Controles de Zoom */}
                  <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setPreviewZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                      title="Diminuir Zoom"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </Button>
                    <span className="text-[11px] font-mono px-1 font-semibold min-w-[42px] text-center">
                      {Math.round(previewZoom * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setPreviewZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                      title="Aumentar Zoom (+100%)"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </Button>
                    {previewZoom !== 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[10px] px-1.5"
                        onClick={() => setPreviewZoom(1)}
                      >
                        Reset
                      </Button>
                    )}
                  </div>

                  <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                    <a href={selectedReceipt.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" /> Abrir Original
                    </a>
                  </Button>
                  <Button asChild size="sm" className="h-8 text-xs gap-1.5 bg-primary">
                    <a href={selectedReceipt.url} download="comprovante" target="_blank" rel="noopener noreferrer">
                      <Download className="h-3.5 w-3.5" /> Baixar
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-muted/20 rounded-xl border border-border/50 my-2 min-h-[450px]">
            {selectedReceipt?.isImage ||
            selectedReceipt?.url?.startsWith('data:image') ||
            selectedReceipt?.url?.endsWith('.png') ||
            selectedReceipt?.url?.endsWith('.jpg') ||
            selectedReceipt?.url?.endsWith('.jpeg') ||
            selectedReceipt?.url?.endsWith('.webp') ||
            selectedReceipt?.url?.includes('image') ? (
              <div
                className="transition-transform duration-200 flex items-center justify-center"
                style={{ transform: `scale(${previewZoom})`, transformOrigin: 'center center' }}
              >
                <img
                  src={selectedReceipt.url}
                  alt="Comprovante"
                  className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
                />
              </div>
            ) : (
              <div className="p-10 text-center space-y-4 bg-muted/20 rounded-xl border border-border">
                <FileText className="h-20 w-20 mx-auto text-primary" />
                <div>
                  <p className="font-semibold text-base">Documento Digital / PDF</p>
                  <p className="text-xs text-muted-foreground">{selectedReceipt?.filename}</p>
                </div>
                <Button asChild size="default">
                  <a href={selectedReceipt?.url} download target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" /> Baixar Arquivo
                  </a>
                </Button>
              </div>
            )}
          </div>

          {selectedReceipt?.description && (
            <p className="text-xs text-muted-foreground px-2">
              <strong>Descrição da transação:</strong> {selectedReceipt.description}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
