import React, { useState, useMemo } from 'react';
import {
  FinancialTransactionExtended,
  BankAccount,
  ChartCategory,
  CostCenter,
  AdminArea,
  financialManagementService,
  TransactionType,
  TransactionStatus,
} from '@/services/financial-management.service';
import { ExcelFinancialDashboardReport } from './ExcelFinancialDashboardReport';
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
import { Label } from '@/components/ui/label';
import { CurrencyInput } from './CurrencyInput';
import {
  Search,
  Filter,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Paperclip,
  Trash2,
  Pencil,
  Loader2,
  Download,
  Plus,
  FileSpreadsheet,
  Layers,
  Repeat,
  Wallet,
  ExternalLink,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { googleDriveService } from '@/services/googleDrive.service';

const getXLSX = () => {
  const mod: any = XLSX;
  if (mod?.utils?.book_new) return mod;
  if (mod?.default?.utils?.book_new) return mod.default;
  return mod;
};

interface TransactionsGridViewProps {
  churchId: string;
  transactions: FinancialTransactionExtended[];
  accounts: BankAccount[];
  chartCategories: ChartCategory[];
  costCenters: CostCenter[];
  adminAreas: AdminArea[];
  onRefresh: () => void;
  onOpenNewTransaction: () => void;
}

export function TransactionsGridView({
  churchId,
  transactions,
  accounts,
  chartCategories,
  costCenters,
  adminAreas,
  onRefresh,
  onOpenNewTransaction,
}: TransactionsGridViewProps) {
  const { toast } = useToast();

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [costCenterFilter, setCostCenterFilter] = useState<string>('all');
  const [adminAreaFilter, setAdminAreaFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Agrupamento para totalizações
  const [groupBy, setGroupBy] = useState<'none' | 'type' | 'account' | 'cost_center' | 'admin_area'>('none');

  // Preview de comprovante
  const [previewReceipt, setPreviewReceipt] = useState<{ url: string; filename?: string; isImage?: boolean } | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(1);

  // Estados para Edição de Lançamento
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransactionExtended | null>(null);
  const [editType, setEditType] = useState<TransactionType>('entrada');
  const [editDate, setEditDate] = useState<string>('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editCategory, setEditCategory] = useState<string>('');
  const [editAccountId, setEditAccountId] = useState<string>('');
  const [editCostCenter, setEditCostCenter] = useState<string>('');
  const [editAdminArea, setEditAdminArea] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editStatus, setEditStatus] = useState<TransactionStatus>('realizado');
  const [editPaymentMethod, setEditPaymentMethod] = useState<string>('Dinheiro / PIX');
  const [editReceiptUrl, setEditReceiptUrl] = useState<string | null>(null);
  const [editReceiptFilename, setEditReceiptFilename] = useState<string | null>(null);
  const [editReceiptFile, setEditReceiptFile] = useState<File | null>(null);
  const [editSaving, setEditSaving] = useState<boolean>(false);

  const editAvailableCategories = useMemo(() => {
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

    const filtered = chartCategories.filter((c) =>
      editType === 'transferencia' ? true : editType === 'entrada' ? isReceita(c.type) : isDespesa(c.type)
    );

    return filtered.length > 0 ? filtered : chartCategories;
  }, [chartCategories, editType]);

  const handleStartEdit = (t: FinancialTransactionExtended) => {
    setEditingTransaction(t);
    setEditType(t.type);
    setEditDate(t.date ? t.date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setEditAmount(t.amount || 0);
    setEditCategory(t.category || '');
    setEditAccountId(t.account_id || accounts[0]?.id || 'conta-caixa');
    setEditCostCenter(t.cost_center || costCenters[0]?.name || 'Culto Geral / Eclesiástico');
    setEditAdminArea(t.admin_area || adminAreas[0]?.name || 'Tesouraria & Finanças');
    setEditDescription(t.description || '');
    setEditStatus(t.status || 'realizado');
    setEditPaymentMethod(t.payment_method || 'PIX');
    setEditReceiptUrl(t.receipt_url || null);
    setEditReceiptFilename(t.receipt_filename || null);
    setEditReceiptFile(null);
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Selecione um arquivo de até 5MB.', variant: 'destructive' });
      return;
    }
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ title: 'Formato não aceito', description: 'Use um arquivo PDF, JPG, PNG ou WebP.', variant: 'destructive' });
      return;
    }
    setEditReceiptFile(file);
    setEditReceiptFilename(file.name);
  };

  const openReceipt = async (receiptUrl: string, filename?: string) => {
    try {
      const preview = await googleDriveService.createPreviewUrl(churchId, receiptUrl);
      setPreviewReceipt({ url: preview.url, filename, isImage: preview.isImage });
    } catch (error) {
      toast({
        title: 'Não foi possível abrir o comprovante',
        description: error instanceof Error ? error.message : 'Verifique a conexão com o Google Drive.',
        variant: 'destructive',
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTransaction) return;
    if (editAmount <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor maior que zero.',
        variant: 'destructive',
      });
      return;
    }

    setEditSaving(true);
    try {
      let receiptUrl = editReceiptUrl;
      let receiptFilename = editReceiptFilename;
      if (editReceiptFile) {
        if (editingTransaction.id.startsWith('tx-')) {
          throw new Error('Este lançamento está somente neste navegador e não pode ser vinculado a um arquivo na nuvem.');
        }
        const status = await googleDriveService.getStatus(churchId);
        if (!status.connected) throw new Error('Conecte o Google Drive da igreja na aba Comprovantes antes de anexar arquivos.');
        receiptUrl = await googleDriveService.upload(churchId, editReceiptFile);
        receiptFilename = editReceiptFile.name;
      }
      const selectedAccount = accounts.find((a) => a.id === editAccountId);
      await financialManagementService.updateTransaction(churchId, editingTransaction.id, {
        type: editType,
        status: editStatus,
        amount: editAmount,
        date: editDate,
        category: editCategory,
        cost_center: editCostCenter,
        admin_area: editAdminArea,
        account_id: editAccountId,
        account_name: selectedAccount?.name || editingTransaction.account_name,
        description: editDescription,
        payment_method: editPaymentMethod,
        ...(editReceiptFile || editReceiptUrl !== editingTransaction.receipt_url
          ? { receipt_url: receiptUrl, receipt_filename: receiptFilename }
          : {}),
      });

      toast({
        title: 'Lançamento atualizado!',
        description: 'As alterações foram salvas com sucesso.',
      });
      setEditingTransaction(null);
      setEditReceiptFile(null);
      onRefresh();
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar',
        description: err?.message || 'Falha ao salvar alterações.',
        variant: 'destructive',
      });
    } finally {
      setEditSaving(false);
    }
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // Filtragem dos dados
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (accountFilter !== 'all' && t.account_id !== accountFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (costCenterFilter !== 'all' && t.cost_center !== costCenterFilter) return false;
      if (adminAreaFilter !== 'all' && t.admin_area !== adminAreaFilter) return false;
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const descMatch = (t.description || '').toLowerCase().includes(q);
        const catMatch = (t.category || '').toLowerCase().includes(q);
        const accMatch = (t.account_name || '').toLowerCase().includes(q);
        const amountMatch = t.amount.toString().includes(q);
        if (!descMatch && !catMatch && !accMatch && !amountMatch) return false;
      }

      return true;
    });
  }, [
    transactions,
    searchTerm,
    typeFilter,
    accountFilter,
    statusFilter,
    costCenterFilter,
    adminAreaFilter,
    startDate,
    endDate,
  ]);

  // Totalizações dinâmicas
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let transfers = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === 'entrada') income += t.amount;
      else if (t.type === 'saida') expense += t.amount;
      else if (t.type === 'transferencia') transfers += t.amount;
    });

    return {
      income,
      expense,
      net: income - expense,
      transfers,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Agrupamentos dinâmicos
  const groupedData = useMemo(() => {
    if (groupBy === 'none') return null;

    const map: Record<string, { totalIncome: number; totalExpense: number; items: FinancialTransactionExtended[] }> = {};

    filteredTransactions.forEach((t) => {
      let key = 'Outros';
      if (groupBy === 'type') {
        key = t.type === 'entrada' ? 'Entradas' : t.type === 'saida' ? 'Saídas' : 'Transferências';
      } else if (groupBy === 'account') {
        key = t.account_name || 'Sem Conta Definida';
      } else if (groupBy === 'cost_center') {
        key = t.cost_center || 'Sem Centro de Custo';
      } else if (groupBy === 'admin_area') {
        key = t.admin_area || 'Sem Área Administrativa';
      }

      if (!map[key]) {
        map[key] = { totalIncome: 0, totalExpense: 0, items: [] };
      }

      if (t.type === 'entrada') map[key].totalIncome += t.amount;
      if (t.type === 'saida') map[key].totalExpense += t.amount;
      map[key].items.push(t);
    });

    return map;
  }, [filteredTransactions, groupBy]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta transação?')) return;
    try {
      await financialManagementService.deleteTransaction(churchId, id);
      toast({ title: 'Lançamento excluído com sucesso.' });
      onRefresh();
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' });
    }
  };

  const handleToggleReconcile = async (t: FinancialTransactionExtended) => {
    try {
      await financialManagementService.toggleReconciled(churchId, t.id, !t.is_reconciled);
      toast({
        title: !t.is_reconciled ? 'Lançamento Conciliado!' : 'Conciliação removida.',
      });
      onRefresh();
    } catch (err: any) {
      toast({ title: 'Erro ao conciliar', description: err.message, variant: 'destructive' });
    }
  };

  const handleExportExcel = () => {
    try {
      const xlsx = getXLSX();
      const rows = filteredTransactions.map((t) => ({
        Data: t.date,
        Tipo: t.type.toUpperCase(),
        Status: t.status.toUpperCase(),
        Categoria: t.category,
        Valor: t.amount,
        'Conta Bancária': t.account_name || '',
        'Centro de Custo': t.cost_center || '',
        'Área Administrativa': t.admin_area || '',
        'Forma Pagamento': t.payment_method || '',
        Descrição: t.description || '',
        Conciliado: t.is_reconciled ? 'SIM' : 'NÃO',
      }));

      const ws = xlsx.utils.json_to_sheet(rows);

      // Congelamento de cabeçalho na linha 1
      ws['!views'] = [{ state: 'frozen', ySplit: 1, xSplit: 0, topLeftCell: 'A2' }];
      ws['!freeze'] = { state: 'frozen', ySplit: 1, xSplit: 0, topLeftCell: 'A2' };

      // Largura de colunas
      ws['!cols'] = [
        { wch: 12 }, // Data
        { wch: 12 }, // Tipo
        { wch: 14 }, // Status
        { wch: 28 }, // Categoria
        { wch: 15 }, // Valor
        { wch: 22 }, // Conta
        { wch: 22 }, // Centro de Custo
        { wch: 22 }, // Área Adm
        { wch: 18 }, // Forma Pagamento
        { wch: 35 }, // Descrição
        { wch: 14 }, // Conciliado
      ];

      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Lançamentos');

      const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      });
      const filename = `Lancamentos_Financeiros_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      saveAs(blob, filename);

      toast({
        title: '📊 Planilha Exportada!',
        description: 'Lançamentos financeiros exportados com sucesso.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao exportar',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de Totalizações Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Entradas Filtradas</p>
            <p className="text-2xl font-bold text-emerald-600">{fmt(totals.income)}</p>
          </div>
          <ArrowUpCircle className="h-8 w-8 text-emerald-500/80" />
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Saídas Filtradas</p>
            <p className="text-2xl font-bold text-rose-600">{fmt(totals.expense)}</p>
          </div>
          <ArrowDownCircle className="h-8 w-8 text-rose-500/80" />
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Resultado Líquido</p>
            <p className={`text-2xl font-bold ${totals.net >= 0 ? 'text-primary' : 'text-rose-600'}`}>
              {fmt(totals.net)}
            </p>
          </div>
          <Wallet className="h-8 w-8 text-primary/80" />
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Total de Registros</p>
            <p className="text-2xl font-bold text-foreground">{totals.count} lançamentos</p>
          </div>
          <FileSpreadsheet className="h-8 w-8 text-muted-foreground/80" />
        </div>
      </div>

      {/* Barra de Filtros e Visualizações */}
      <Card className="rounded-2xl border-border">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição, categoria, favorecido ou conta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            {/* Ações: Exportar Dashboard PRO, Simples e Novo Lançamento */}
            <div className="flex flex-wrap items-center gap-2">
              <ExcelFinancialDashboardReport
                transactions={filteredTransactions}
                accounts={accounts}
                chartCategories={chartCategories}
                costCenters={costCenters}
                adminAreas={adminAreas}
                className="h-9 text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="h-9 text-xs gap-1.5"
                title="Exportar apenas os lançamentos filtrados desta grade"
              >
                <Download className="h-3.5 w-3.5" />
                Tabela Simples
              </Button>
              <Button size="sm" onClick={onOpenNewTransaction} className="h-9 text-xs gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Novo Lançamento
              </Button>
            </div>
          </div>

          {/* Filtros em Linha */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-1 border-t border-border/50">
            {/* Tipo */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="saida">Saídas</SelectItem>
                <SelectItem value="transferencia">Transferências</SelectItem>
              </SelectContent>
            </Select>

            {/* Conta */}
            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Conta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Contas</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status (Realizado x Planejado) */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Realizado & Planejado</SelectItem>
                <SelectItem value="realizado">Apenas Realizados</SelectItem>
                <SelectItem value="planejado">Apenas Planejados</SelectItem>
              </SelectContent>
            </Select>

            {/* Centro de Custo */}
            <Select value={costCenterFilter} onValueChange={setCostCenterFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Centro de Custo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Centros Custo</SelectItem>
                {costCenters.map((cc) => (
                  <SelectItem key={cc.id} value={cc.name}>
                    {cc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Agrupamento */}
            <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
              <SelectTrigger className="h-8 text-xs bg-muted/40 font-medium">
                <SelectValue placeholder="Totalizar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Visualização Direta (Sem grupo)</SelectItem>
                <SelectItem value="type">Totalizar por Tipo (R/D)</SelectItem>
                <SelectItem value="account">Totalizar por Conta Bancária</SelectItem>
                <SelectItem value="cost_center">Totalizar por Centro de Custo</SelectItem>
                <SelectItem value="admin_area">Totalizar por Área Administrativa</SelectItem>
              </SelectContent>
            </Select>

            {/* Limpar filtros */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setAccountFilter('all');
                setStatusFilter('all');
                setCostCenterFilter('all');
                setAdminAreaFilter('all');
                setStartDate('');
                setEndDate('');
                setGroupBy('none');
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grade de Lançamentos */}
      <Card className="rounded-2xl border-border">
        <CardContent className="p-0 overflow-x-auto">
          {groupedData ? (
            /* Visualização Agrupada e Totalizada */
            <div className="space-y-6 p-4">
              {Object.entries(groupedData).map(([groupTitle, groupInfo]) => (
                <div key={groupTitle} className="space-y-2 border border-border rounded-xl p-3 bg-muted/10">
                  <div className="flex flex-wrap items-center justify-between pb-2 border-b border-border">
                    <span className="font-bold text-sm text-foreground">{groupTitle}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-emerald-600 font-semibold">
                        Entradas: {fmt(groupInfo.totalIncome)}
                      </span>
                      <span className="text-rose-600 font-semibold">
                        Saídas: {fmt(groupInfo.totalExpense)}
                      </span>
                      <span className="font-bold">
                        Saldo: {fmt(groupInfo.totalIncome - groupInfo.totalExpense)}
                      </span>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow className="text-xs">
                        <TableHead className="w-24">Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Conta</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead className="text-right">Valor (R$)</TableHead>
                        <TableHead className="text-right w-20">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupInfo.items.map((t) => (
                        <TableRow key={t.id} className="text-xs hover:bg-muted/30">
                          <TableCell>{format(parseISO(t.date), 'dd/MM/yyyy')}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                t.type === 'entrada'
                                  ? 'border-emerald-500 text-emerald-600'
                                  : t.type === 'saida'
                                  ? 'border-rose-500 text-rose-600'
                                  : 'border-blue-500 text-blue-600'
                              }
                            >
                              {t.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{t.category}</TableCell>
                          <TableCell>{t.account_name}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{t.description || '-'}</TableCell>
                          <TableCell
                            className={`text-right font-bold ${
                              t.type === 'entrada' ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {fmt(t.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleStartEdit(t)}
                                className="h-7 w-7 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                title="Editar lançamento"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(t.id)}
                                className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                title="Excluir lançamento"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          ) : (
            /* Visualização em Grade Única */
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="w-24">Data</TableHead>
                  <TableHead className="w-24">Tipo</TableHead>
                  <TableHead>Categoria / Plano</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead>Descrição / Favorecido</TableHead>
                  <TableHead className="text-center w-20">Status</TableHead>
                  <TableHead className="text-center w-16">Anexo</TableHead>
                  <TableHead className="text-right">Valor (R$)</TableHead>
                  <TableHead className="text-right w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-muted-foreground text-xs">
                      Nenhum lançamento encontrado com os filtros atuais.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((t) => (
                    <TableRow key={t.id} className="text-xs hover:bg-muted/30">
                      <TableCell className="font-medium">
                        {format(parseISO(t.date), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {t.type === 'entrada' && (
                            <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-600" />
                          )}
                          {t.type === 'saida' && (
                            <ArrowDownCircle className="h-3.5 w-3.5 text-rose-600" />
                          )}
                          {t.type === 'transferencia' && (
                            <ArrowRightLeft className="h-3.5 w-3.5 text-blue-600" />
                          )}
                          <span className="capitalize">{t.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {t.category}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.account_name}
                      </TableCell>
                      <TableCell>
                        <span className="text-[11px] bg-muted px-2 py-0.5 rounded-md">
                          {t.cost_center || 'Geral'}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <div className="flex items-center gap-1">
                          <span className="truncate">{t.description || '-'}</span>
                          {t.installment_current && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">
                              {t.installment_current}/{t.installment_total}
                            </Badge>
                          )}
                          {t.recurrent && (
                            <span title="Recorrente">
                              <Repeat className="h-3 w-3 text-muted-foreground shrink-0" />
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleReconcile(t)}
                          title="Clique para conciliar/desconciliar"
                          className="inline-flex items-center"
                        >
                          {t.status === 'realizado' ? (
                            t.is_reconciled ? (
                              <Badge className="bg-emerald-600/15 text-emerald-600 border-emerald-500/30 text-[10px] gap-1 hover:bg-emerald-600/25">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Pago
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30 gap-1">
                                Não Conciliado
                              </Badge>
                            )
                          ) : (
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <Clock className="h-2.5 w-2.5" /> Previsto
                            </Badge>
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="text-center">
                        {t.receipt_url ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void openReceipt(t.receipt_url!, t.receipt_filename || undefined)}
                            className="h-6 w-6 text-primary hover:text-primary/80"
                            title="Ver comprovante anexado"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold ${
                          t.type === 'entrada'
                            ? 'text-emerald-600'
                            : t.type === 'saida'
                            ? 'text-rose-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {fmt(t.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartEdit(t)}
                            className="h-7 w-7 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                            title="Editar lançamento"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(t.id)}
                            className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Pré-visualização de Comprovante (Aumentado em +100% com Zoom) */}
      <Dialog
        open={!!previewReceipt}
        onOpenChange={(o) => {
          if (!o) {
            if (previewReceipt?.url.startsWith('blob:')) URL.revokeObjectURL(previewReceipt.url);
            setPreviewReceipt(null);
            setPreviewZoom(1);
          }
        }}
      >
        <DialogContent className="w-[96vw] max-w-6xl max-h-[94vh] flex flex-col p-4 sm:p-6 rounded-2xl overflow-hidden">
          <DialogHeader className="pb-3 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                <Paperclip className="h-5 w-5 text-primary" />
                Comprovante Anexado
              </DialogTitle>

              {previewReceipt?.url && (
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
                    <a href={previewReceipt.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" /> Abrir Original
                    </a>
                  </Button>
                  <Button asChild size="sm" className="h-8 text-xs gap-1.5 bg-primary">
                    <a href={previewReceipt.url} download="comprovante" target="_blank" rel="noopener noreferrer">
                      <Download className="h-3.5 w-3.5" /> Baixar
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-2 sm:p-4 flex items-center justify-center bg-muted/20 rounded-xl border border-border/50 my-2 min-h-[450px]">
            {previewReceipt?.isImage ||
            previewReceipt?.url?.startsWith('data:image') ||
            previewReceipt?.url?.includes('.png') ||
            previewReceipt?.url?.includes('.jpg') ||
            previewReceipt?.url?.includes('.jpeg') ||
            previewReceipt?.url?.includes('.webp') ||
            previewReceipt?.url?.includes('image') ? (
              <div
                className="transition-transform duration-200 flex items-center justify-center"
                style={{ transform: `scale(${previewZoom})`, transformOrigin: 'center center' }}
              >
                <img
                  src={previewReceipt.url}
                  alt="Comprovante"
                  className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
                />
              </div>
            ) : (
              <div className="p-10 text-center space-y-4">
                <FileSpreadsheet className="h-20 w-20 mx-auto text-primary/70" />
                <p className="text-base font-semibold">Documento em PDF ou arquivo anexado</p>
                <p className="text-xs text-muted-foreground">{previewReceipt?.filename || 'Documento comprobatório'}</p>
                <div className="flex gap-2 justify-center pt-2">
                  <Button asChild size="default" className="gap-2">
                    <a href={previewReceipt?.url} target="_blank" rel="noopener noreferrer" download>
                      <Download className="h-4 w-4" /> Baixar Documento Completo
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Lançamento */}
      <Dialog open={!!editingTransaction} onOpenChange={(o) => !o && setEditingTransaction(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Pencil className="h-5 w-5 text-emerald-600" />
              Editar Lançamento Financeiro
            </DialogTitle>
            <DialogDescription>
              Altere os dados da transação para recalcular o fluxo de caixa e atualizar os relatórios contábeis.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tipo: Entrada, Saída, Transferência */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tipo de Movimentação</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={editType === 'entrada' ? 'default' : 'outline'}
                  className={`h-9 text-xs font-medium gap-1.5 ${
                    editType === 'entrada' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''
                  }`}
                  onClick={() => setEditType('entrada')}
                >
                  <ArrowUpCircle className="h-3.5 w-3.5" /> Entrada
                </Button>
                <Button
                  type="button"
                  variant={editType === 'saida' ? 'default' : 'outline'}
                  className={`h-9 text-xs font-medium gap-1.5 ${
                    editType === 'saida' ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''
                  }`}
                  onClick={() => setEditType('saida')}
                >
                  <ArrowDownCircle className="h-3.5 w-3.5" /> Saída
                </Button>
                <Button
                  type="button"
                  variant={editType === 'transferencia' ? 'default' : 'outline'}
                  className={`h-9 text-xs font-medium gap-1.5 ${
                    editType === 'transferencia' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''
                  }`}
                  onClick={() => setEditType('transferencia')}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" /> Transferência
                </Button>
              </div>
            </div>

            {/* Linha 1: Valor e Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <CurrencyInput
                  label="Valor (R$)"
                  value={editAmount}
                  onChange={(numericVal) => setEditAmount(numericVal)}
                  showPresets={false}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Data</Label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            </div>

            {/* Linha 2: Categoria e Conta Bancária */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Categoria / Plano de Contas</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Selecione a categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    {editAvailableCategories.map((c) => (
                      <SelectItem key={c.id} value={c.name} className="text-xs">
                        {c.code ? `${c.code} - ` : ''}{c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Conta Bancária</Label>
                <Select value={editAccountId} onValueChange={setEditAccountId}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Selecione a conta..." />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="text-xs">
                        {a.name} ({a.bank_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 3: Centro de Custo e Área Administrativa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Centro de Custo</Label>
                <Select value={editCostCenter} onValueChange={setEditCostCenter}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Selecione o centro de custo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {costCenters.map((cc) => (
                      <SelectItem key={cc.id} value={cc.name} className="text-xs">
                        {cc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Área Administrativa</Label>
                <Select value={editAdminArea} onValueChange={setEditAdminArea}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Selecione a área..." />
                  </SelectTrigger>
                  <SelectContent>
                    {adminAreas.map((aa) => (
                      <SelectItem key={aa.id} value={aa.name} className="text-xs">
                        {aa.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 4: Descrição e Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold">Descrição / Favorecido</Label>
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Ex: Oferta de gratidão, pagamento fornecedor..."
                  className="h-10 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Status</Label>
                <Select value={editStatus} onValueChange={(v: any) => setEditStatus(v)}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realizado" className="text-xs">Realizado / Pago</SelectItem>
                    <SelectItem value="previsto" className="text-xs">Previsto / Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Linha 5: Forma de Pagamento e Anexo de Comprovante */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Forma de Pagamento</Label>
                <Select value={editPaymentMethod} onValueChange={setEditPaymentMethod}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX" className="text-xs">PIX</SelectItem>
                    <SelectItem value="Dinheiro" className="text-xs">Dinheiro em Espécie</SelectItem>
                    <SelectItem value="Cartão de Débito" className="text-xs">Cartão de Débito</SelectItem>
                    <SelectItem value="Cartão de Crédito" className="text-xs">Cartão de Crédito</SelectItem>
                    <SelectItem value="Transferência Bancária" className="text-xs">Transferência (TED/DOC)</SelectItem>
                    <SelectItem value="Boleto Bancário" className="text-xs">Boleto Bancário</SelectItem>
                    <SelectItem value="Cheque" className="text-xs">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Comprovante / Anexo</Label>
                {editReceiptUrl ? (
                  <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/40 text-xs">
                    <span className="truncate max-w-[180px] font-medium text-emerald-600">
                      {editReceiptFilename || 'Comprovante Anexado'}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditReceiptUrl(null);
                        setEditReceiptFilename(null);
                      }}
                      className="h-6 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      Remover
                    </Button>
                  </div>
                ) : (
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleReceiptFileChange}
                    className="h-10 text-xs cursor-pointer"
                  />
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingTransaction(null)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveEdit}
              disabled={editSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
            >
              {editSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              )}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
