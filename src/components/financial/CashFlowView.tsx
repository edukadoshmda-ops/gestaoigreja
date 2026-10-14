import React, { useState, useMemo } from 'react';
import {
  BankAccount,
  FinancialTransactionExtended,
  financialManagementService,
  DEFAULT_CHART_CATEGORIES,
  DEFAULT_COST_CENTROS,
  DEFAULT_ADMIN_AREAS,
} from '@/services/financial-management.service';
import { ExcelFinancialDashboardReport } from './ExcelFinancialDashboardReport';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  Eye,
  SlidersHorizontal,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseCurrency, formatCurrencyBRL } from '@/utils/currencyUtils';

interface CashFlowViewProps {
  churchId: string;
  accounts: BankAccount[];
  transactions: FinancialTransactionExtended[];
  onRefresh: () => void;
  onOpenNewTransaction: () => void;
}

export function CashFlowView({
  churchId,
  accounts,
  transactions,
  onRefresh,
  onOpenNewTransaction,
}: CashFlowViewProps) {
  // Period filter: diário, semanal, mensal
  const [periodType, setPeriodType] = useState<'diario' | 'semanal' | 'mensal'>('diario');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  
  // Toggle: Planejado vs Realizado em 1 clique
  const [mode, setMode] = useState<'realizado' | 'previsto'>('previsto');

  // Simulações temporárias do usuário
  const [simulations, setSimulations] = useState<Array<{ id: string; name: string; type: 'receita' | 'despesa'; amount: number; date: string }>>(() =>
    financialManagementService.getSimulations(churchId)
  );
  const [simName, setSimName] = useState('');
  const [simType, setSimType] = useState<'receita' | 'despesa'>('receita');
  const [simAmount, setSimAmount] = useState('');
  const [simDate, setSimDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Formata moeda BRL
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // Contas filtradas
  const activeAccounts = accounts.filter((a) => a.is_active);
  const targetAccounts = selectedAccountId === 'all'
    ? activeAccounts
    : activeAccounts.filter((a) => a.id === selectedAccountId);

  // Saldo real inicial consolidado (obtido diretamente das contas reais sem precisar de lançamentos retroativos)
  const initialRealBalance = targetAccounts.reduce(
    (sum, a) => sum + (Number(a.initial_balance) || 0),
    0
  );

  // Adicionar simulação
  const handleAddSimulation = () => {
    const num = parseCurrency(simAmount);
    if (!simName || num <= 0) return;

    financialManagementService.addSimulation(churchId, {
      name: simName,
      type: simType,
      amount: num,
      date: simDate,
    });
    setSimulations(financialManagementService.getSimulations(churchId));
    setSimName('');
    setSimAmount('');
  };

  const handleRemoveSimulation = (id: string) => {
    financialManagementService.removeSimulation(churchId, id);
    setSimulations(financialManagementService.getSimulations(churchId));
  };

  // Processar transações para o fluxo
  const chartData = useMemo(() => {
    // Transações aplicáveis
    let filteredTxs = transactions.filter((t) => {
      if (selectedAccountId !== 'all' && t.account_id !== selectedAccountId) return false;
      if (mode === 'realizado' && t.status === 'planejado') return false;
      return true;
    });

    // Se no modo previsto, incluir simulações
    let extraItems: Array<{ type: 'receita' | 'despesa'; amount: number; date: string }> = [];
    if (mode === 'previsto') {
      extraItems = simulations.map((s) => ({
        type: s.type,
        amount: s.amount,
        date: s.date,
      }));
    }

    // Gerar buckets de datas dependendo do periodType
    const today = new Date();
    const rows: Array<{
      periodKey: string;
      label: string;
      income: number;
      expense: number;
      net: number;
      accumulatedBalance: number;
    }> = [];

    let runningBalance = initialRealBalance;

    if (periodType === 'diario') {
      // Próximos 15 dias e últimos 7 dias (22 dias totais)
      const startDate = addDays(today, -7);
      const endDate = addDays(today, 15);
      const days = eachDayOfInterval({ start: startDate, end: endDate });

      days.forEach((day) => {
        const dStr = format(day, 'yyyy-MM-dd');
        const dayTxs = filteredTxs.filter((t) => t.date === dStr);
        const daySims = extraItems.filter((s) => s.date === dStr);

        const inc =
          dayTxs.filter((t) => t.type === 'entrada').reduce((sum, t) => sum + t.amount, 0) +
          daySims.filter((s) => s.type === 'receita').reduce((sum, s) => sum + s.amount, 0);

        const exp =
          dayTxs.filter((t) => t.type === 'saida').reduce((sum, t) => sum + t.amount, 0) +
          daySims.filter((s) => s.type === 'despesa').reduce((sum, s) => sum + s.amount, 0);

        const net = inc - exp;
        runningBalance += net;

        rows.push({
          periodKey: dStr,
          label: format(day, 'dd/MM (EEE)', { locale: ptBR }),
          income: inc,
          expense: exp,
          net,
          accumulatedBalance: runningBalance,
        });
      });
    } else if (periodType === 'semanal') {
      // 8 semanas (2 passadas e 6 futuras)
      for (let i = -2; i <= 6; i++) {
        const refDate = addDays(today, i * 7);
        const sWeek = startOfWeek(refDate, { weekStartsOn: 0 });
        const eWeek = endOfWeek(refDate, { weekStartsOn: 0 });
        const sStr = format(sWeek, 'yyyy-MM-dd');
        const eStr = format(eWeek, 'yyyy-MM-dd');

        const weekTxs = filteredTxs.filter((t) => t.date >= sStr && t.date <= eStr);
        const weekSims = extraItems.filter((s) => s.date >= sStr && s.date <= eStr);

        const inc =
          weekTxs.filter((t) => t.type === 'entrada').reduce((sum, t) => sum + t.amount, 0) +
          weekSims.filter((s) => s.type === 'receita').reduce((sum, s) => sum + s.amount, 0);

        const exp =
          weekTxs.filter((t) => t.type === 'saida').reduce((sum, t) => sum + t.amount, 0) +
          weekSims.filter((s) => s.type === 'despesa').reduce((sum, s) => sum + s.amount, 0);

        const net = inc - exp;
        runningBalance += net;

        rows.push({
          periodKey: sStr,
          label: `${format(sWeek, 'dd/MM')} a ${format(eWeek, 'dd/MM')}`,
          income: inc,
          expense: exp,
          net,
          accumulatedBalance: runningBalance,
        });
      }
    } else {
      // Mensal: 6 meses (2 passados e 4 futuros)
      for (let i = -2; i <= 4; i++) {
        const refMonth = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const sMonth = startOfMonth(refMonth);
        const eMonth = endOfMonth(refMonth);
        const sStr = format(sMonth, 'yyyy-MM-dd');
        const eStr = format(eMonth, 'yyyy-MM-dd');

        const monthTxs = filteredTxs.filter((t) => t.date >= sStr && t.date <= eStr);
        const monthSims = extraItems.filter((s) => s.date >= sStr && s.date <= eStr);

        const inc =
          monthTxs.filter((t) => t.type === 'entrada').reduce((sum, t) => sum + t.amount, 0) +
          monthSims.filter((s) => s.type === 'receita').reduce((sum, s) => sum + s.amount, 0);

        const exp =
          monthTxs.filter((t) => t.type === 'saida').reduce((sum, t) => sum + t.amount, 0) +
          monthSims.filter((s) => s.type === 'despesa').reduce((sum, s) => sum + s.amount, 0);

        const net = inc - exp;
        runningBalance += net;

        rows.push({
          periodKey: sStr,
          label: format(sMonth, 'MMM/yy', { locale: ptBR }),
          income: inc,
          expense: exp,
          net,
          accumulatedBalance: runningBalance,
        });
      }
    }

    return rows;
  }, [transactions, simulations, mode, periodType, selectedAccountId, initialRealBalance]);

  // Totais do período analisado
  const totalIncomes = chartData.reduce((sum, r) => sum + r.income, 0);
  const totalExpenses = chartData.reduce((sum, r) => sum + r.expense, 0);
  const finalProjectedBalance = chartData.length > 0
    ? chartData[chartData.length - 1].accumulatedBalance
    : initialRealBalance;

  return (
    <div className="space-y-6">
      {/* Barra de Controles do Fluxo de Caixa */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-card rounded-2xl border border-border shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Alternador de Período */}
          <div className="flex items-center p-1 bg-muted rounded-xl">
            <Button
              type="button"
              variant={periodType === 'diario' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriodType('diario')}
              className="text-xs h-8"
            >
              Diário
            </Button>
            <Button
              type="button"
              variant={periodType === 'semanal' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriodType('semanal')}
              className="text-xs h-8"
            >
              Semanal
            </Button>
            <Button
              type="button"
              variant={periodType === 'mensal' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriodType('mensal')}
              className="text-xs h-8"
            >
              Mensal
            </Button>
          </div>

          {/* Filtro por Conta Bancária */}
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <SelectValue placeholder="Todas as Contas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🏦 Todas as Contas (Consolidado)</SelectItem>
              {activeAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Toggle com 1 Clique: Realizado vs Previsto */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-muted/80 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setMode('realizado')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'realizado'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Realizado
            </button>
            <button
              type="button"
              onClick={() => setMode('previsto')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === 'previsto'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              Previsto & Simulações
            </button>
          </div>

          <ExcelFinancialDashboardReport
            transactions={transactions}
            accounts={accounts}
            chartCategories={DEFAULT_CHART_CATEGORIES}
            costCenters={DEFAULT_COST_CENTROS}
            adminAreas={DEFAULT_ADMIN_AREAS}
            className="h-9 text-xs"
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSimulating(!isSimulating)}
            className={`h-9 text-xs gap-1.5 ${isSimulating ? 'border-primary text-primary bg-primary/5' : ''}`}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            Simulador "E se?"
          </Button>

          <Button size="sm" onClick={onOpenNewTransaction} className="h-9 text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Cards de Métricas do Fluxo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold flex items-center justify-between">
              <span>Saldo Real Inicial</span>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-foreground">
              {fmt(initialRealBalance)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Posição real cadastrada nas contas hoje (sem retroativos).
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-emerald-600 flex items-center justify-between">
              <span>Entradas Projetadas</span>
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              {fmt(totalIncomes)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Receitas no período selecionado ({mode === 'previsto' ? 'Previsto' : 'Realizado'}).
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-rose-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-rose-600 flex items-center justify-between">
              <span>Saídas Projetadas</span>
              <ArrowDownRight className="h-4 w-4 text-rose-600" />
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600">
              {fmt(totalExpenses)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              Despesas programadas ou pagas no período.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-primary/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase font-semibold text-primary flex items-center justify-between">
              <span>Saldo Final Projetado</span>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardDescription>
            <CardTitle
              className={`text-2xl font-bold ${
                finalProjectedBalance >= 0 ? 'text-primary' : 'text-rose-600'
              }`}
            >
              {fmt(finalProjectedBalance)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              {finalProjectedBalance >= 0 ? 'Superávit estimado em caixa' : 'Alerta de déficit projetado'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Painel do Simulador "E Se?" (Quando aberto) */}
      {isSimulating && (
        <Card className="rounded-2xl border-amber-500/30 bg-amber-500/5 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h3 className="font-semibold text-sm">Simulador de Hipóteses Financeiras ("E se?")</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              As simulações afetam a curva de fluxo de caixa em tempo real sem alterar os lançamentos oficiais.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <Input
              placeholder="Ex: Oferta especial de missões, Reforma da pintura..."
              value={simName}
              onChange={(e) => setSimName(e.target.value)}
              className="sm:col-span-2 text-xs"
            />
            <Select value={simType} onValueChange={(v: any) => setSimType(v)}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receita">Receita Simutada (+)</SelectItem>
                <SelectItem value="despesa">Despesa Simulada (-)</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Valor (ex: 10 mil, 100 mil, 1 milhão, 10.000)"
              value={simAmount}
              onChange={(e) => setSimAmount(e.target.value)}
              className="text-xs font-semibold"
            />
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={simDate}
                onChange={(e) => setSimDate(e.target.value)}
                className="text-xs"
              />
              <Button size="sm" onClick={handleAddSimulation} className="shrink-0 text-xs">
                <Plus className="h-4 w-4 mr-1" /> Simular
              </Button>
            </div>
          </div>

          {simulations.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-500/20">
              <span className="text-xs font-semibold text-muted-foreground py-1">
                Simulações Ativas:
              </span>
              {simulations.map((s) => (
                <Badge
                  key={s.id}
                  variant="outline"
                  className={`text-xs gap-1.5 py-1 px-2.5 ${
                    s.type === 'receita'
                      ? 'border-emerald-500/40 text-emerald-600 bg-emerald-500/10'
                      : 'border-rose-500/40 text-rose-600 bg-rose-500/10'
                  }`}
                >
                  <span>
                    {s.name}: {s.type === 'receita' ? '+' : '-'}{fmt(s.amount)} ({format(parseISO(s.date), 'dd/MM')})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSimulation(s.id)}
                    className="hover:text-foreground ml-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Gráfico Principal do Fluxo de Caixa */}
      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>Evolução do Saldo Acumulado & Movimentações</span>
            <Badge variant="secondary" className="text-xs font-normal">
              Modo: {mode === 'previsto' ? 'Previsto / Simulado' : 'Apenas Realizado'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Projeção contínua de caixa por {periodType}. Saldo real calculado na ponta sem necessidade de lançamentos retroativos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="label" tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip
                  formatter={(val: any) => [fmt(val), '']}
                  labelFormatter={(lbl) => `Período: ${lbl}`}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="accumulatedBalance"
                  name="Saldo Acumulado (R$)"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#balanceGradient)"
                />
                <Bar dataKey="income" name="Entradas (R$)" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Saídas (R$)" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Resumo do Fluxo */}
      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Demonstrativo Periódico do Fluxo de Caixa
          </CardTitle>
          <CardDescription>
            Visão linha a linha das entradas, saídas e saldo residual no encerramento de cada {periodType}.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wider">
                <th className="py-2.5 px-3">Período</th>
                <th className="py-2.5 px-3 text-right">Entradas (R$)</th>
                <th className="py-2.5 px-3 text-right">Saídas (R$)</th>
                <th className="py-2.5 px-3 text-right">Resultado do Período</th>
                <th className="py-2.5 px-3 text-right">Saldo Acumulado</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, idx) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-muted/40 transition-colors">
                  <td className="py-2 px-3 font-medium text-foreground">{row.label}</td>
                  <td className="py-2 px-3 text-right text-emerald-600 font-semibold">
                    {row.income > 0 ? `+${fmt(row.income)}` : 'R$ 0,00'}
                  </td>
                  <td className="py-2 px-3 text-right text-rose-600 font-semibold">
                    {row.expense > 0 ? `-${fmt(row.expense)}` : 'R$ 0,00'}
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-bold ${
                      row.net >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {fmt(row.net)}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-foreground">
                    {fmt(row.accumulatedBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
