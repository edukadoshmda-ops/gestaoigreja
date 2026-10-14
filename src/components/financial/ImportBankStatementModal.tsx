import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Building2,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  X,
  Info,
} from 'lucide-react';
import {
  BankAccount,
  financialManagementService,
  DEFAULT_CHART_CATEGORIES,
} from '@/services/financial-management.service';
import {
  parseBankStatementFile,
  StatementParseResult,
  ParsedStatementTransaction,
} from '@/utils/bankStatementParser';
import { formatCurrencyBRL } from '@/utils/currencyUtils';
import { useToast } from '@/hooks/use-toast';

interface ImportBankStatementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchId: string;
  accounts: BankAccount[];
  initialAccountId?: string;
  onSuccess: () => void;
}

export function ImportBankStatementModal({
  open,
  onOpenChange,
  churchId,
  accounts,
  initialAccountId,
  onSuccess,
}: ImportBankStatementModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    initialAccountId || (accounts[0]?.id ?? '')
  );
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parseResult, setParseResult] = useState<StatementParseResult | null>(null);
  const [transactions, setTransactions] = useState<ParsedStatementTransaction[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sincronizar conta selecionada caso mude via prop
  React.useEffect(() => {
    if (initialAccountId) {
      setSelectedAccountId(initialAccountId);
    } else if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [initialAccountId, accounts]);

  const handleReset = () => {
    setFile(null);
    setParseResult(null);
    setTransactions([]);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const processFile = async (selectedFile: File) => {
    setErrorMessage(null);
    setFile(selectedFile);
    setParsing(true);

    try {
      const result = await parseBankStatementFile(selectedFile);
      if (result.transactions.length === 0) {
        throw new Error('Nenhuma transação válida encontrada no arquivo fornecido.');
      }
      setParseResult(result);
      setTransactions(result.transactions);
      toast({
        title: 'Extrato Processado!',
        description: `${result.transactions.length} lançamentos identificados no formato ${result.format}.`,
      });
    } catch (err: any) {
      console.error('Erro ao processar extrato bancário:', err);
      setErrorMessage(err.message || 'Falha ao ler o arquivo de extrato.');
      setFile(null);
      setParseResult(null);
      setTransactions([]);
    } finally {
      setParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    setTransactions((prev) => prev.map((t) => ({ ...t, selected: checked })));
  };

  const toggleTransaction = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const updateTransactionCategory = (id: string, category: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, suggestedCategory: category } : t))
    );
  };

  const selectedTransactions = transactions.filter((t) => t.selected);
  const selectedIncome = selectedTransactions
    .filter((t) => t.type === 'entrada')
    .reduce((s, t) => s + t.amount, 0);
  const selectedExpense = selectedTransactions
    .filter((t) => t.type === 'saida')
    .reduce((s, t) => s + t.amount, 0);

  const targetAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  const handleImportConfirm = async () => {
    if (selectedTransactions.length === 0) {
      toast({
        title: 'Nenhum lançamento selecionado',
        description: 'Selecione ao menos uma transação para importar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setImporting(true);
      let successCount = 0;

      for (const t of selectedTransactions) {
        await financialManagementService.createTransaction(churchId, {
          type: t.type,
          status: 'realizado',
          amount: t.amount,
          date: t.date,
          category: t.suggestedCategory || (t.type === 'entrada' ? 'Dízimos' : 'Utilidades e Manutenção'),
          account_id: targetAccount.id,
          description: `${t.description}${t.documentNumber ? ` [Doc: ${t.documentNumber}]` : ''}`.trim(),
          payment_method: t.description.toUpperCase().includes('PIX')
            ? 'pix'
            : t.description.toUpperCase().includes('TED') || t.description.toUpperCase().includes('DOC')
            ? 'transferencia'
            : 'cartao_debito',
        });
        successCount++;
      }

      toast({
        title: '🎉 Extrato Importado com Sucesso!',
        description: `${successCount} transações lançadas na conta "${targetAccount.name}". Entradas: R$ ${formatCurrencyBRL(selectedIncome)} | Saídas: R$ ${formatCurrencyBRL(selectedExpense)}.`,
      });

      handleClose();
      onSuccess();
    } catch (err: any) {
      console.error('Erro ao importar lançamentos do extrato:', err);
      toast({
        title: 'Erro na importação',
        description: err.message || 'Falha ao salvar as transações importadas.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen sm:w-[95vw] sm:max-w-4xl sm:h-auto sm:max-h-[90vh] overflow-hidden flex flex-col p-4 sm:p-6 rounded-2xl">
        <DialogHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Importar Extrato Bancário</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Conciliação automática via leitura inteligente de extratos bancários
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
          {/* Seletor de Conta Bancária Destino */}
          <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <Label className="text-xs font-semibold">Conta / Caixa de Destino:</Label>
            </div>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-full sm:w-[280px] h-9 text-xs font-medium">
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id} className="text-xs">
                    {acc.name} ({acc.bank_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Destaque Claro dos Formatos Aceitos pelo Aplicativo */}
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Formatos Aceitos pelo App:
              </span>
              <span className="text-[11px] text-muted-foreground">Todos os bancos brasileiros</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="p-2.5 bg-background rounded-lg border border-emerald-500/20 shadow-sm flex items-start gap-2">
                <Badge className="bg-emerald-600 text-white font-mono text-[10px]">.OFX</Badge>
                <div>
                  <strong className="text-xs block text-foreground">Extrato Bancário Oficial</strong>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Padrão de todos os bancos (Itaú, BB, Bradesco, Caixa, Nubank, Inter, etc.)
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-background rounded-lg border border-blue-500/20 shadow-sm flex items-start gap-2">
                <Badge className="bg-blue-600 text-white font-mono text-[10px]">.XLSX / .XLS</Badge>
                <div>
                  <strong className="text-xs block text-foreground">Planilha Excel</strong>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Planilhas exportadas do Internet Banking com data, descrição e valor
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-background rounded-lg border border-amber-500/20 shadow-sm flex items-start gap-2">
                <Badge className="bg-amber-600 text-white font-mono text-[10px]">.CSV / .TXT</Badge>
                <div>
                  <strong className="text-xs block text-foreground">Texto Tabulado</strong>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    Arquivo de texto separado por vírgula ou ponto-e-vírgula
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                <strong>Atenção sobre PDF:</strong> Extratos em PDF são apenas impressões visuais e não contêm dados estruturados. Para importar, acesse o aplicativo do seu banco pelo computador e clique em <em>"Salvar como OFX"</em> ou <em>"Exportar para Excel/CSV"</em>.
              </span>
            </div>
          </div>

          {/* Área de Upload / Drag & Drop */}
          {!parseResult && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-border hover:border-emerald-500/50 rounded-2xl p-6 sm:p-8 text-center transition-colors bg-card hover:bg-muted/20 cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".ofx,.csv,.xlsx,.xls,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3">
                {parsing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
              </div>
              <p className="text-sm font-semibold text-foreground">
                {parsing ? 'Lendo e analisando extrato...' : 'Arraste o arquivo do extrato ou clique para selecionar'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Formatos suportados: <strong>.OFX</strong>, <strong>.XLSX</strong>, <strong>.XLS</strong> ou <strong>.CSV</strong>
              </p>
            </div>
          )}

          {/* Mensagem de Erro */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">Não foi possível importar este arquivo:</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setErrorMessage(null)} className="h-6 w-6">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Resultado do Parser & Preview Interativo */}
          {parseResult && (
            <div className="space-y-3">
              {/* Card Resumo do Arquivo Carregado */}
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs uppercase bg-background">
                    {parseResult.format}
                  </Badge>
                  <span className="text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-[300px]">
                    {file?.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Período: <strong>{parseResult.periodStart || '-'}</strong> até <strong>{parseResult.periodEnd || '-'}</strong>
                  </span>
                  <Button variant="outline" size="sm" onClick={handleReset} className="h-7 text-xs">
                    Trocar arquivo
                  </Button>
                </div>
              </div>

              {/* Indicadores de Seleção */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-card border border-border/60">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Selecionados
                  </span>
                  <strong className="text-base font-bold text-foreground">
                    {selectedTransactions.length} de {transactions.length}
                  </strong>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] uppercase font-semibold text-emerald-700 dark:text-emerald-400 block">
                    Total Entradas (+)
                  </span>
                  <strong className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    R$ {formatCurrencyBRL(selectedIncome)}
                  </strong>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <span className="text-[10px] uppercase font-semibold text-rose-700 dark:text-rose-400 block">
                    Total Saídas (-)
                  </span>
                  <strong className="text-base font-bold text-rose-600 dark:text-rose-400">
                    R$ {formatCurrencyBRL(selectedExpense)}
                  </strong>
                </div>
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-[10px] uppercase font-semibold text-primary block">
                    Saldo do Lote
                  </span>
                  <strong
                    className={`text-base font-bold ${
                      selectedIncome - selectedExpense >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    R$ {formatCurrencyBRL(selectedIncome - selectedExpense)}
                  </strong>
                </div>
              </div>

              {/* Tabela de Lançamentos */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="bg-muted/80 px-3 py-2 border-b border-border flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedTransactions.length === transactions.length}
                      onCheckedChange={(c) => toggleSelectAll(!!c)}
                    />
                    <span>Marcar Todos</span>
                  </div>
                  <span className="text-muted-foreground">
                    Revise as categorias sugeridas antes de importar
                  </span>
                </div>

                <div className="max-h-[320px] overflow-y-auto divide-y divide-border/50">
                  {transactions.map((t) => (
                    <div
                      key={t.id}
                      className={`p-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors ${
                        t.selected ? 'bg-card' : 'bg-muted/20 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Checkbox
                          checked={t.selected}
                          onCheckedChange={() => toggleTransaction(t.id)}
                        />
                        <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                          {t.date.split('-').reverse().join('/')}
                        </span>
                        {t.type === 'entrada' ? (
                          <ArrowUpCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-rose-600 shrink-0" />
                        )}
                        <span className="font-medium text-foreground truncate max-w-[220px] sm:max-w-[280px]" title={t.description}>
                          {t.description}
                        </span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pl-6 sm:pl-0">
                        {/* Seletor de Categoria */}
                        <Select
                          value={t.suggestedCategory}
                          onValueChange={(val) => updateTransactionCategory(t.id, val)}
                        >
                          <SelectTrigger className="h-7 w-[160px] sm:w-[190px] text-[11px] truncate">
                            <SelectValue placeholder="Categoria" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[220px]">
                            {DEFAULT_CHART_CATEGORIES.filter(
                              (c) => (t.type === 'entrada' ? c.type === 'receita' : c.type === 'despesa')
                            ).map((cat) => (
                              <SelectItem key={cat.id} value={cat.name} className="text-xs">
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <span
                          className={`font-mono font-bold text-xs shrink-0 min-w-[85px] text-right ${
                            t.type === 'entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {t.type === 'entrada' ? '+' : '-'} R$ {formatCurrencyBRL(t.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button variant="outline" onClick={handleClose} disabled={importing} className="w-full sm:w-auto text-xs">
            Cancelar
          </Button>
          <Button
            onClick={handleImportConfirm}
            disabled={!parseResult || selectedTransactions.length === 0 || importing}
            className="w-full sm:w-auto text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Lançando transações no sistema...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Importar {selectedTransactions.length} Lançamentos para {targetAccount.name}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
