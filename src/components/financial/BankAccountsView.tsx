import React, { useState } from 'react';
import {
  BankAccount,
  FinancialTransactionExtended,
  AccountType,
  financialManagementService,
  DEFAULT_CHART_CATEGORIES,
  DEFAULT_COST_CENTROS,
  DEFAULT_ADMIN_AREAS,
} from '@/services/financial-management.service';
import { ExcelFinancialDashboardReport } from './ExcelFinancialDashboardReport';
import { ImportBankStatementModal } from './ImportBankStatementModal';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { parseCurrency, formatCurrencyBRL } from '@/utils/currencyUtils';
import { CurrencyInput } from '@/components/financial/CurrencyInput';

interface BankAccountsViewProps {
  churchId: string;
  accounts: BankAccount[];
  transactions: FinancialTransactionExtended[];
  onRefresh: () => void;
}

export function BankAccountsView({
  churchId,
  accounts,
  transactions,
  onRefresh,
}: BankAccountsViewProps) {
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('corrente');
  const [accountNumber, setAccountNumber] = useState('');
  const [initialBalanceStr, setInitialBalanceStr] = useState('');
  const [balanceDate, setBalanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [color, setColor] = useState('#3B82F6');

  // Modal de Conciliação Rápida
  const [reconcileModalAccount, setReconcileModalAccount] = useState<BankAccount | null>(null);
  const [realBankBalanceStr, setRealBankBalanceStr] = useState('');

  // Modal de Importação de Extrato Bancário (OFX, Excel, CSV)
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importTargetAccountId, setImportTargetAccountId] = useState<string | undefined>(undefined);

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // Cálculos de saldo de cada conta
  const { accountBalances, totalBalance } = financialManagementService.calculateAccountBalances(
    accounts,
    transactions,
    false // apenas realizados para conciliação contábil real
  );

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'caixa':
        return <Wallet className="h-5 w-5 text-emerald-500" />;
      case 'poupanca':
        return <PiggyBank className="h-5 w-5 text-purple-500" />;
      case 'aplicacao':
        return <TrendingUp className="h-5 w-5 text-amber-500" />;
      case 'cartao_credito':
        return <CreditCard className="h-5 w-5 text-rose-500" />;
      default:
        return <Building2 className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAccountTypeName = (type: AccountType) => {
    switch (type) {
      case 'caixa':
        return 'Caixa Físico (Dinheiro)';
      case 'poupanca':
        return 'Conta Poupança';
      case 'aplicacao':
        return 'Aplicação / Fundo de Reserva';
      case 'cartao_credito':
        return 'Cartão de Crédito';
      default:
        return 'Conta Corrente Bancária';
    }
  };

  const openNewModal = () => {
    setEditingAccount(null);
    setName('');
    setBankName('');
    setAccountType('corrente');
    setAccountNumber('');
    setInitialBalanceStr('');
    setBalanceDate(new Date().toISOString().split('T')[0]);
    setColor('#3B82F6');
    setModalOpen(true);
  };

  const openEditModal = (acc: BankAccount) => {
    setEditingAccount(acc);
    setName(acc.name);
    setBankName(acc.bank_name);
    setAccountType(acc.account_type);
    setAccountNumber(acc.account_number || '');
    setInitialBalanceStr(acc.initial_balance > 0 ? formatCurrencyBRL(acc.initial_balance) : '0,00');
    setBalanceDate(acc.balance_date || new Date().toISOString().split('T')[0]);
    setColor(acc.color || '#3B82F6');
    setModalOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const num = parseCurrency(initialBalanceStr);

    financialManagementService.saveAccount(churchId, {
      id: editingAccount ? editingAccount.id : undefined,
      name,
      bank_name: bankName || 'Instituição Financeira',
      account_type: accountType,
      account_number: accountNumber,
      initial_balance: num,
      balance_date: balanceDate,
      color,
      is_active: true,
    });

    toast({
      title: editingAccount ? 'Conta atualizada' : 'Conta cadastrada com sucesso',
    });
    setModalOpen(false);
    onRefresh();
  };

  const handleDeleteAccount = (id: string) => {
    if (accounts.length <= 1) {
      toast({
        title: 'Operação não permitida',
        description: 'Você precisa manter ao menos uma conta bancária/caixa ativa.',
        variant: 'destructive',
      });
      return;
    }

    if (!window.confirm('Tem certeza que deseja remover esta conta bancária?')) return;
    financialManagementService.deleteAccount(churchId, id);
    toast({ title: 'Conta removida com sucesso.' });
    onRefresh();
  };

  const handleConfirmReconcile = () => {
    if (!reconcileModalAccount) return;
    const realVal = parseCurrency(realBankBalanceStr);
    const systemVal = accountBalances[reconcileModalAccount.id]?.current || 0;
    const diff = realVal - systemVal;

    if (Math.abs(diff) < 0.01) {
      toast({
        title: 'Conciliação Concluída!',
        description: 'O saldo contábil do sistema e o saldo do banco estão 100% alinhados (Diferença: R$ 0,00).',
      });
      setReconcileModalAccount(null);
    } else {
      // Ajustar saldo inicial para eliminar a diferença sem lançamentos retroativos
      if (
        window.confirm(
          `Há uma diferença de ${fmt(diff)}. Deseja ajustar o saldo base da conta para ${fmt(
            realVal
          )} e conciliar sem precisar de lançamentos retroativos?`
        )
      ) {
        financialManagementService.saveAccount(churchId, {
          ...reconcileModalAccount,
          initial_balance: (reconcileModalAccount.initial_balance || 0) + diff,
          balance_date: new Date().toISOString().split('T')[0],
        });
        toast({
          title: 'Saldo Ajustado!',
          description: 'A diferença foi eliminada e a conta está conciliada com sucesso.',
        });
        setReconcileModalAccount(null);
        onRefresh();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner de Saldo Geral das Contas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-card to-muted border border-border shadow-sm">
        <div>
          <p className="text-xs uppercase font-semibold text-muted-foreground">
            Saldo Total Consolidado em Caixa & Bancos
          </p>
          <h2 className="text-3xl font-extrabold text-foreground mt-0.5">{fmt(totalBalance)}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Soma de {accounts.length} contas ativas da igreja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              setImportTargetAccountId(accounts[0]?.id);
              setImportModalOpen(true);
            }}
            className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold"
            title="Importar extrato bancário nos formatos OFX, Excel (.xlsx/.xls) ou CSV"
          >
            <Upload className="h-4 w-4" /> Importar Extrato Bancário
          </Button>
          <ExcelFinancialDashboardReport
            transactions={transactions}
            accounts={accounts}
            chartCategories={DEFAULT_CHART_CATEGORIES}
            costCenters={DEFAULT_COST_CENTROS}
            adminAreas={DEFAULT_ADMIN_AREAS}
            className="h-9 text-xs"
          />
          <Button onClick={openNewModal} className="gap-2 text-xs">
            <Plus className="h-4 w-4" /> Nova Conta / Cartão
          </Button>
        </div>
      </div>

      {/* Grid de Contas Bancárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const bal = accountBalances[acc.id] || { current: 0, income: 0, expense: 0 };
          return (
            <Card key={acc.id} className="rounded-2xl border-border hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2.5 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${acc.color}15`, color: acc.color }}
                    >
                      {getAccountIcon(acc.account_type)}
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold">{acc.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {acc.bank_name} • {getAccountTypeName(acc.account_type)}
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditModal(acc)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteAccount(acc.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-1">
                <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                    Saldo Atual no Sistema
                  </span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-foreground">{fmt(bal.current)}</span>
                    <Badge variant="outline" className="text-[10px]">
                      Ativa
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1 border-t border-border/50">
                  <div>
                    <span>Entradas Registradas:</span>
                    <p className="font-semibold text-emerald-600">+{fmt(bal.income)}</p>
                  </div>
                  <div>
                    <span>Saídas Registradas:</span>
                    <p className="font-semibold text-rose-600">-{fmt(bal.expense)}</p>
                  </div>
                </div>

                {acc.account_number && (
                  <p className="text-[11px] text-muted-foreground truncate">
                    Identificação: {acc.account_number}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImportTargetAccountId(acc.id);
                      setImportModalOpen(true);
                    }}
                    className="w-full text-xs gap-1.5 border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 font-medium"
                    title="Importar extrato OFX, Excel ou CSV para esta conta"
                  >
                    <Upload className="h-3.5 w-3.5 text-emerald-600" />
                    Importar Extrato
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setReconcileModalAccount(acc);
                      setRealBankBalanceStr(bal.current.toFixed(2));
                    }}
                    className="w-full text-xs gap-1.5 font-medium"
                    title="Ajustar saldo real do banco"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    Conciliação
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de Nova/Editar Conta */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {editingAccount ? 'Editar Conta Bancária' : 'Nova Conta Bancária / Caixa'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveAccount} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nome da Conta *</Label>
              <Input
                placeholder="Ex: Banco do Brasil - CC Principal, Caixa Recepção..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tipo de Conta</Label>
                <Select value={accountType} onValueChange={(v: any) => setAccountType(v)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corrente">Conta Corrente</SelectItem>
                    <SelectItem value="poupanca">Poupança</SelectItem>
                    <SelectItem value="aplicacao">Aplicação / Investimento</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                    <SelectItem value="caixa">Caixa Físico (Dinheiro)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Instituição / Banco</Label>
                <Input
                  placeholder="Ex: Bradesco, Itaú, Nubank..."
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Agência / Conta / Chave</Label>
                <Input
                  placeholder="Ag: 0001 / CC: 12345-6"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>

              <div>
                <CurrencyInput
                  label="Saldo Real Inicial (R$)"
                  value={initialBalanceStr}
                  onChange={(_, raw) => setInitialBalanceStr(raw)}
                  placeholder="Ex: 10 mil, 100 mil, 1 milhão, 10.000..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Data do Saldo Inicial</Label>
              <Input
                type="date"
                value={balanceDate}
                onChange={(e) => setBalanceDate(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Conta</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Conciliação Bancária */}
      <Dialog
        open={!!reconcileModalAccount}
        onOpenChange={(o) => !o && setReconcileModalAccount(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Conciliação de Saldo: {reconcileModalAccount?.name}
            </DialogTitle>
          </DialogHeader>

          {reconcileModalAccount && (
            <div className="space-y-4 pt-2">
              <div className="p-3 bg-muted rounded-xl space-y-1">
                <span className="text-xs text-muted-foreground">Saldo Atual Registrado no Sistema:</span>
                <p className="text-xl font-bold text-foreground">
                  {fmt(accountBalances[reconcileModalAccount.id]?.current || 0)}
                </p>
              </div>

              <div>
                <CurrencyInput
                  label="Saldo Real no Extrato do Banco Hoje (R$)"
                  value={realBankBalanceStr}
                  onChange={(_, raw) => setRealBankBalanceStr(raw)}
                  placeholder="Informe o saldo real exato..."
                />
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Se houver diferença, você pode ajustar o saldo real com 1 clique sem precisar criar lançamentos retroativos.
                </p>
              </div>

              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs text-emerald-700 dark:text-emerald-400">
                    Ou importe o extrato em <strong>OFX, Excel ou CSV</strong>:
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const accId = reconcileModalAccount.id;
                    setReconcileModalAccount(null);
                    setImportTargetAccountId(accId);
                    setImportModalOpen(true);
                  }}
                  className="h-7 text-xs border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 font-semibold"
                >
                  Importar Extrato
                </Button>
              </div>

              <DialogFooter className="pt-3">
                <Button variant="outline" onClick={() => setReconcileModalAccount(null)}>
                  Fechar
                </Button>
                <Button onClick={handleConfirmReconcile} className="gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Conciliar Saldo
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Ambiente de Importação de Extrato Bancário */}
      <ImportBankStatementModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        churchId={churchId}
        accounts={accounts}
        initialAccountId={importTargetAccountId}
        onSuccess={onRefresh}
      />
    </div>
  );
}
