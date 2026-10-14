import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  BankAccount,
  ChartCategory,
  CostCenter,
  AdminArea,
  TransactionType,
  TransactionStatus,
  financialManagementService,
  DEFAULT_BANK_ACCOUNTS,
  DEFAULT_CHART_CATEGORIES,
  DEFAULT_COST_CENTROS,
  DEFAULT_ADMIN_AREAS,
} from '@/services/financial-management.service';
import { useToast } from '@/hooks/use-toast';
import {
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightLeft,
  Upload,
  FileText,
  X,
  Loader2,
  Calendar,
  Layers,
  Repeat
} from 'lucide-react';
import { parseCurrency } from '@/utils/currencyUtils';
import { CurrencyInput } from '@/components/financial/CurrencyInput';

interface NewTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchId: string;
  accounts: BankAccount[];
  chartCategories: ChartCategory[];
  costCenters: CostCenter[];
  adminAreas: AdminArea[];
  onSuccess: () => void;
}

export function NewTransactionModal({
  open,
  onOpenChange,
  churchId,
  accounts,
  chartCategories,
  costCenters,
  adminAreas,
  onSuccess,
}: NewTransactionModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Safe fallbacks to guarantee arrays are never empty
  const safeAccounts = useMemo(
    () => (accounts && accounts.length > 0 ? accounts : DEFAULT_BANK_ACCOUNTS),
    [accounts]
  );
  const safeChartCategories = useMemo(
    () => (chartCategories && chartCategories.length > 0 ? chartCategories : DEFAULT_CHART_CATEGORIES),
    [chartCategories]
  );
  const safeCostCenters = useMemo(
    () => (costCenters && costCenters.length > 0 ? costCenters : DEFAULT_COST_CENTROS),
    [costCenters]
  );
  const safeAdminAreas = useMemo(
    () => (adminAreas && adminAreas.length > 0 ? adminAreas : DEFAULT_ADMIN_AREAS),
    [adminAreas]
  );

  // Form states
  const [type, setType] = useState<TransactionType>('entrada');
  const [status, setStatus] = useState<TransactionStatus>('realizado');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(DEFAULT_CHART_CATEGORIES[0]?.name || 'Dízimos');
  const [accountId, setAccountId] = useState(safeAccounts[0]?.id || '');
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const [costCenter, setCostCenter] = useState(safeCostCenters[0]?.name || '');
  const [adminArea, setAdminArea] = useState(safeAdminAreas[0]?.name || '');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('PIX');

  // Parcelamento & Recorrência
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [isRecurrent, setIsRecurrent] = useState(false);
  const [recurrentFrequency, setRecurrentFrequency] = useState<'semanal' | 'mensal' | 'anual'>('mensal');
  const [recurrentTimes, setRecurrentTimes] = useState(12);

  // Comprovante
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  // Categorias filtradas pelo tipo atual (suporta flexivelmente receita/entrada e despesa/saida)
  const availableCategories = useMemo(() => {
    const isReceita = (t?: string) => {
      if (!t) return false;
      const s = String(t).toLowerCase().trim();
      return s === 'receita' || s === 'entrada' || s.includes('receit') || s.includes('entrad');
    };
    const isDespesa = (t?: string) => {
      if (!t) return false;
      const s = String(t).toLowerCase().trim();
      return s === 'despesa' || s === 'saida' || s.includes('desp') || s.includes('said');
    };

    const filtered = safeChartCategories.filter((c) =>
      type === 'transferencia' ? true : type === 'entrada' ? isReceita(c.type) : isDespesa(c.type)
    );

    if (filtered.length > 0) return filtered;

    const fallback = DEFAULT_CHART_CATEGORIES.filter((c) =>
      type === 'transferencia' ? true : type === 'entrada' ? isReceita(c.type) : isDespesa(c.type)
    );
    return fallback.length > 0 ? fallback : DEFAULT_CHART_CATEGORIES;
  }, [safeChartCategories, type]);

  // Agrupamento de categorias para Select com cabeçalhos organizados
  const groupedCategories = useMemo(() => {
    const groups: Record<string, ChartCategory[]> = {};
    for (const cat of availableCategories) {
      const g = cat.group || (cat.type === 'receita' ? 'Receitas Eclesiásticas' : 'Despesas Operacionais');
      if (!groups[g]) groups[g] = [];
      groups[g].push(cat);
    }
    return groups;
  }, [availableCategories]);

  // Sincronizar campos padrão ao abrir o modal ou alternar tipo
  useEffect(() => {
    if (open) {
      if (!accountId || !safeAccounts.some((a) => a.id === accountId)) {
        setAccountId(safeAccounts[0]?.id || 'conta-caixa');
      }
      if (!costCenter || !safeCostCenters.some((c) => c.name === costCenter)) {
        setCostCenter(safeCostCenters[0]?.name || 'Culto Geral / Eclesiástico');
      }
      if (!adminArea || !safeAdminAreas.some((a) => a.name === adminArea)) {
        setAdminArea(safeAdminAreas[0]?.name || 'Tesouraria & Finanças');
      }
      if (type === 'transferencia') {
        setCategory('Transferência entre Contas');
        if (!destinationAccountId) {
          const dest = safeAccounts.find((a) => a.id !== (accountId || safeAccounts[0]?.id));
          if (dest) setDestinationAccountId(dest.id);
        }
      } else if (!category || !availableCategories.some((c) => c.name === category)) {
        if (availableCategories.length > 0) {
          setCategory(availableCategories[0].name);
        }
      }
    }
  }, [open, type, safeAccounts, safeCostCenters, safeAdminAreas, availableCategories, category]);

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'transferencia') {
      setCategory('Transferência entre Contas');
      const other = safeAccounts.find((a) => a.id !== accountId);
      if (other) setDestinationAccountId(other.id);
    } else {
      const isReceita = (t?: string) => {
        if (!t) return false;
        const s = String(t).toLowerCase().trim();
        return s === 'receita' || s === 'entrada' || s.includes('receit') || s.includes('entrad');
      };
      const isDespesa = (t?: string) => {
        if (!t) return false;
        const s = String(t).toLowerCase().trim();
        return s === 'despesa' || s === 'saida' || s.includes('desp') || s.includes('said');
      };
      const matching = safeChartCategories.filter((c) =>
        newType === 'entrada' ? isReceita(c.type) : isDespesa(c.type)
      );
      if (matching.length > 0) {
        setCategory(matching[0].name);
      } else {
        const fallback = DEFAULT_CHART_CATEGORIES.filter((c) =>
          newType === 'entrada' ? isReceita(c.type) : isDespesa(c.type)
        );
        setCategory(fallback[0]?.name || (newType === 'entrada' ? 'Dízimos' : 'Prebendas e Honorários Pastorais'));
      }
    }
  };

  const parseAmount = (val: string): number => {
    return parseCurrency(val);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'Selecione um arquivo de até 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setReceiptFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseAmount(amountStr);

    if (amount <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    const finalAccountId = accountId || safeAccounts[0]?.id || 'conta-caixa';
    const finalCategory =
      type === 'transferencia'
        ? 'Transferência entre Contas'
        : (category || availableCategories[0]?.name || (type === 'entrada' ? 'Dízimos' : 'Outras Despesas'));
    const finalCostCenter = costCenter || safeCostCenters[0]?.name || 'Culto Geral / Eclesiástico';
    const finalAdminArea = adminArea || safeAdminAreas[0]?.name || 'Tesouraria & Finanças';

    if (type === 'transferencia' && (!destinationAccountId || destinationAccountId === finalAccountId)) {
      toast({
        title: 'Conta de destino inválida',
        description: 'Escolha uma conta de destino diferente da conta de origem.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const effectiveChurchId = churchId || 'default-church';

      await financialManagementService.createTransaction(effectiveChurchId, {
        type,
        status,
        amount,
        date: date || new Date().toISOString().split('T')[0],
        category: finalCategory,
        cost_center: finalCostCenter,
        admin_area: finalAdminArea,
        account_id: finalAccountId,
        destination_account_id: type === 'transferencia' ? destinationAccountId : undefined,
        description,
        payment_method: paymentMethod,
        receipt_url: receiptPreview,
        receipt_filename: receiptFile ? receiptFile.name : null,
        installments: isInstallment ? installmentsCount : undefined,
        recurrent: isRecurrent,
        recurrent_frequency: recurrentFrequency,
        recurrent_times: recurrentTimes,
      });

      toast({
        title: 'Lançamento registrado!',
        description: isInstallment
          ? `${installmentsCount} parcelas geradas com sucesso.`
          : isRecurrent
          ? `${recurrentTimes} repetições programadas com sucesso.`
          : 'Transação adicionada com sucesso.',
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Falha ao registrar lançamento.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmountStr('');
    setDescription('');
    setCategory(availableCategories[0]?.name || (type === 'entrada' ? 'Dízimos' : 'Prebendas e Honorários Pastorais'));
    setReceiptFile(null);
    setReceiptPreview(null);
    setIsInstallment(false);
    setIsRecurrent(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <DollarSign className="h-5 w-5 text-primary" />
            Novo Lançamento Financeiro
          </DialogTitle>
          <DialogDescription>
            Registre entradas, saídas, transferências bancárias, parcelamentos ou receitas/despesas planejadas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Seletor de Tipo */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-xl">
            <button
              type="button"
              onClick={() => handleTypeChange('entrada')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                type === 'entrada'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowUpCircle className="h-4 w-4" />
              Entrada
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('saida')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                type === 'saida'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowDownCircle className="h-4 w-4" />
              Saída
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('transferencia')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                type === 'transferencia'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowRightLeft className="h-4 w-4" />
              Transferência
            </button>
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <CurrencyInput
                label="Valor Total (R$) *"
                value={amountStr}
                onChange={(_, raw) => setAmountStr(raw)}
                placeholder="Ex: 10 mil, 100 mil, 1 milhão, 10.000..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Data do Lançamento *
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Situação: Realizado vs Planejado */}
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-xl border border-border/50">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Status da Operação</Label>
              <p className="text-xs text-muted-foreground">
                {status === 'realizado'
                  ? 'Efetivado no caixa/banco (já pago ou recebido)'
                  : 'Previsto / Planejado (projeção para o fluxo de caixa)'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={status === 'realizado' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatus('realizado')}
                className="h-8 text-xs"
              >
                Realizado
              </Button>
              <Button
                type="button"
                variant={status === 'planejado' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setStatus('planejado')}
                className="h-8 text-xs border-dashed"
              >
                Planejado
              </Button>
            </div>
          </div>

          {/* Contas Bancárias (Origem e Destino) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                {type === 'transferencia' ? 'Conta de Origem (Sai de) *' : 'Conta Bancária / Caixa *'}
              </Label>
              <Select value={accountId || safeAccounts[0]?.id} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta..." />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {safeAccounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name} ({acc.bank_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {type === 'transferencia' ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider">
                  Conta de Destino (Entra em) *
                </Label>
                <Select value={destinationAccountId} onValueChange={setDestinationAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta de destino..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[280px]">
                    {safeAccounts
                      .filter((acc) => acc.id !== (accountId || safeAccounts[0]?.id))
                      .map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name} ({acc.bank_name})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider">
                  Categoria (Plano de Contas) *
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {Object.entries(groupedCategories).map(([groupName, cats]) => (
                      <SelectGroup key={groupName}>
                        <SelectLabel className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider py-1 bg-muted/40 px-2 rounded">
                          {groupName}
                        </SelectLabel>
                        {cats.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name} className="py-2 pl-3">
                            <span className="font-mono text-xs opacity-60 mr-1.5">{cat.code}</span>
                            <span>{cat.name}</span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Centro de Custo e Área Administrativa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Centro de Custo
              </Label>
              <Select value={costCenter || safeCostCenters[0]?.name} onValueChange={setCostCenter}>
                <SelectTrigger>
                  <SelectValue placeholder="Centro de Custo..." />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {safeCostCenters.map((cc) => (
                    <SelectItem key={cc.id} value={cc.name}>
                      {cc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Área Administrativa
              </Label>
              <Select value={adminArea || safeAdminAreas[0]?.name} onValueChange={setAdminArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Área..." />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  {safeAdminAreas.map((aa) => (
                    <SelectItem key={aa.id} value={aa.name}>
                      {aa.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Forma de Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Forma de Pagamento
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Dinheiro em Espécie">Dinheiro em Espécie</SelectItem>
                  <SelectItem value="Transferência / TED">Transferência Bancária</SelectItem>
                  <SelectItem value="Boleto Bancário">Boleto Bancário</SelectItem>
                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider">
                Descrição / Favorecido
              </Label>
              <Input
                placeholder="Ex: Fornecedor de som, Dízimo anônimo, Oferta missionária..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Parcelamento e Recorrência (Para Saídas ou Entradas Não-transferência) */}
          {type !== 'transferencia' && (
            <div className="p-3 bg-muted/30 rounded-xl border border-border/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="installment-mode"
                    checked={isInstallment}
                    onCheckedChange={(c) => {
                      setIsInstallment(c);
                      if (c) setIsRecurrent(false);
                    }}
                  />
                  <Label htmlFor="installment-mode" className="text-xs font-medium cursor-pointer">
                    Lançamento Parcelado (ex: compras, obras)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="recurrent-mode"
                    checked={isRecurrent}
                    onCheckedChange={(c) => {
                      setIsRecurrent(c);
                      if (c) setIsInstallment(false);
                    }}
                  />
                  <Label htmlFor="recurrent-mode" className="text-xs font-medium cursor-pointer">
                    Lançamento Recorrente (fixo mensal)
                  </Label>
                </div>
              </div>

              {isInstallment && (
                <div className="flex items-center gap-3 pt-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-xs">Número de parcelas:</span>
                  <Input
                    type="number"
                    min="2"
                    max="48"
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(parseInt(e.target.value) || 2)}
                    className="w-20 h-8 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">
                    Gera {installmentsCount} lançamentos mensais automáticos.
                  </span>
                </div>
              )}

              {isRecurrent && (
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Repeat className="h-4 w-4 text-primary" />
                  <span className="text-xs">Repetir:</span>
                  <Select
                    value={recurrentFrequency}
                    onValueChange={(v: any) => setRecurrentFrequency(v)}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>

                  <span className="text-xs">por</span>
                  <Input
                    type="number"
                    min="2"
                    max="60"
                    value={recurrentTimes}
                    onChange={(e) => setRecurrentTimes(parseInt(e.target.value) || 12)}
                    className="w-20 h-8 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">vezes</span>
                </div>
              )}
            </div>
          )}

          {/* Anexo de Comprovante / Nota Fiscal */}
          <div className="p-3 bg-muted/20 border border-border/40 rounded-xl space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>Comprovante / Nota Fiscal / Recibo</span>
              {receiptFile && (
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null);
                    setReceiptPreview(null);
                  }}
                  className="text-xs text-red-500 hover:underline flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Remover anexo
                </button>
              )}
            </Label>

            {receiptFile ? (
              <div className="flex items-center gap-3 p-2 bg-background rounded-lg border border-border">
                <FileText className="h-6 w-6 text-primary" />
                <div className="flex-1 truncate text-xs">
                  <p className="font-medium truncate">{receiptFile.name}</p>
                  <p className="text-muted-foreground">{(receiptFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-lg p-3 text-center hover:bg-muted/30 transition-colors">
                <input
                  type="file"
                  id="receipt-file-input"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="receipt-file-input"
                  className="cursor-pointer flex flex-col items-center gap-1"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Clique para anexar arquivo (PDF, JPG, PNG até 5MB)
                  </span>
                </label>
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={
                type === 'entrada'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : type === 'saida'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {type === 'transferencia' ? 'Efetivar Transferência' : 'Salvar Lançamento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
