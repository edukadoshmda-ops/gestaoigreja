import React, { useState, useMemo } from 'react';
import {
  FinancialTransactionExtended,
  BankAccount,
  AdminArea,
  DEFAULT_CHART_CATEGORIES,
} from '@/services/financial-management.service';
import { ExcelFinancialDashboardReport } from './ExcelFinancialDashboardReport';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Layers,
  Building,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  BarChart3,
  DollarSign,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const getXLSX = () => {
  const mod: any = XLSX;
  if (mod?.utils?.book_new) return mod;
  if (mod?.default?.utils?.book_new) return mod.default;
  return mod;
};

interface FinancialReportsViewProps {
  churchName?: string;
  transactions: FinancialTransactionExtended[];
  accounts: BankAccount[];
  costCenters: CostCenter[];
  adminAreas: AdminArea[];
}

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export function FinancialReportsView({
  churchName = 'Igreja Local',
  transactions,
  accounts,
  costCenters,
  adminAreas,
}: FinancialReportsViewProps) {
  // Filtro de ano e mês
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('all');
  const [selectedAdminArea, setSelectedAdminArea] = useState<string>('all');

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  // Filtrar transações para o relatório
  const filteredTxs = useMemo(() => {
    return transactions.filter((t) => {
      const year = t.date.substring(0, 4);
      const month = t.date.substring(5, 7);

      if (selectedYear !== 'all' && year !== selectedYear) return false;
      if (selectedMonth !== 'all' && month !== selectedMonth) return false;
      if (selectedCostCenter !== 'all' && t.cost_center !== selectedCostCenter) return false;
      if (selectedAdminArea !== 'all' && t.admin_area !== selectedAdminArea) return false;

      return true;
    });
  }, [transactions, selectedYear, selectedMonth, selectedCostCenter, selectedAdminArea]);

  // Cálculos de Resumo Anual / Mensal
  const { totalIncome, totalExpense, netResult } = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTxs.forEach((t) => {
      if (t.type === 'entrada') income += t.amount;
      if (t.type === 'saida') expense += t.amount;
    });
    return { totalIncome: income, totalExpense: expense, netResult: income - expense };
  }, [filteredTxs]);

  // De onde vieram os recursos (Origem das Receitas por Categoria)
  const incomeOriginData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTxs.filter((t) => t.type === 'entrada').forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTxs]);

  // Onde foram gastos os recursos (Destino das Despesas por Categoria)
  const expenseDestData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTxs.filter((t) => t.type === 'saida').forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTxs]);

  // Gastos por Centro de Custo
  const costCenterData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTxs.filter((t) => t.type === 'saida').forEach((t) => {
      const cc = t.cost_center || 'Geral / Não Especificado';
      map[cc] = (map[cc] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTxs]);

  // Gastos por Área Administrativa
  const adminAreaData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTxs.filter((t) => t.type === 'saida').forEach((t) => {
      const area = t.admin_area || 'Geral';
      map[area] = (map[area] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTxs]);

  // Evolução Mensal do Ano
  const monthlyEvolution = useMemo(() => {
    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    return months.map((m, idx) => {
      const monthTxs = transactions.filter((t) => {
        const year = t.date.substring(0, 4);
        const month = t.date.substring(5, 7);
        return year === (selectedYear === 'all' ? currentYear : selectedYear) && month === m;
      });

      const inc = monthTxs.filter((t) => t.type === 'entrada').reduce((sum, t) => sum + t.amount, 0);
      const exp = monthTxs.filter((t) => t.type === 'saida').reduce((sum, t) => sum + t.amount, 0);

      return {
        month: monthNames[idx],
        Entradas: inc,
        Saídas: exp,
        Superávit: inc - exp,
      };
    });
  }, [transactions, selectedYear, currentYear]);

  // Exportar Excel
  const handleExportExcel = () => {
    try {
      const xlsx = getXLSX();
      const wb = xlsx.utils.book_new();

      // 1. Resumo
      const resumoData = [
        { Indicador: 'Igreja', Valor: churchName },
        { Indicador: 'Período', Valor: `${selectedMonth !== 'all' ? `Mês ${selectedMonth}/` : ''}${selectedYear}` },
        { Indicador: 'Total de Receitas (R$)', Valor: totalIncome },
        { Indicador: 'Total de Despesas (R$)', Valor: totalExpense },
        { Indicador: 'Resultado Líquido (Superávit/Déficit)', Valor: netResult },
      ];
      const wsResumo = xlsx.utils.json_to_sheet(resumoData);
      wsResumo['!views'] = [{ state: 'frozen', ySplit: 1, xSplit: 0, topLeftCell: 'A2' }];
      wsResumo['!freeze'] = { state: 'frozen', ySplit: 1, xSplit: 0, topLeftCell: 'A2' };
      wsResumo['!cols'] = [{ wch: 38 }, { wch: 25 }];
      xlsx.utils.book_append_sheet(wb, wsResumo, 'Resumo Geral');

      // 2. Por Categorias
      const catData = expenseDestData.map((e) => ({ Categoria: e.name, 'Valor Gasto (R$)': e.value }));
      const wsCat = xlsx.utils.json_to_sheet(catData);
      wsCat['!views'] = [{ state: 'frozen', ySplit: 1, xSplit: 0, topLeftCell: 'A2' }];
      wsCat['!freeze'] = { state: 'frozen', ySplit: 1, xSplit: 0, topLeftCell: 'A2' };
      wsCat['!cols'] = [{ wch: 35 }, { wch: 20 }];
      xlsx.utils.book_append_sheet(wb, wsCat, 'Gastos por Categoria');

      // 3. Por Centro de Custo
      const ccData = costCenterData.map((c) => ({ 'Centro de Custo': c.name, 'Total Gasto (R$)': c.value }));
      const wsCC = xlsx.utils.json_to_sheet(ccData);
      wsCC['!views'] = [{ state: 'frozen', ySplit: 1, xSplit: 0, topLeftCell: 'A2' }];
      wsCC['!freeze'] = { state: 'frozen', ySplit: 1, xSplit: 0, topLeftCell: 'A2' };
      wsCC['!cols'] = [{ wch: 35 }, { wch: 20 }];
      xlsx.utils.book_append_sheet(wb, wsCC, 'Por Centro de Custo');

      const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      });
      const filename = `Relatorio_Financeiro_${churchName.replace(/\s+/g, '_')}_${selectedYear}.xlsx`;
      saveAs(blob, filename);
    } catch (err: any) {
      console.error('Erro ao exportar relatório:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros do Relatório */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          {/* Ano */}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-28 h-8 text-xs font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Anos</SelectItem>
              <SelectItem value="2027">2027</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>

          {/* Mês */}
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Ano Inteiro</SelectItem>
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

          {/* Centro de Custo */}
          <Select value={selectedCostCenter} onValueChange={setSelectedCostCenter}>
            <SelectTrigger className="w-44 h-8 text-xs">
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

          {/* Área Administrativa */}
          <Select value={selectedAdminArea} onValueChange={setSelectedAdminArea}>
            <SelectTrigger className="w-44 h-8 text-xs">
              <SelectValue placeholder="Área Administrativa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Áreas</SelectItem>
              {adminAreas.map((aa) => (
                <SelectItem key={aa.id} value={aa.name}>
                  {aa.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Botões Exportar e Imprimir */}
        <div className="flex flex-wrap items-center gap-2">
          <ExcelFinancialDashboardReport
            churchName={churchName}
            transactions={filteredTransactions}
            accounts={accounts}
            chartCategories={DEFAULT_CHART_CATEGORIES}
            costCenters={costCenters}
            adminAreas={adminAreas}
            className="h-8 text-xs"
          />
          <Button variant="outline" size="sm" onClick={handlePrint} className="h-8 text-xs gap-1.5">
            <Printer className="h-3.5 w-3.5" /> PDF / Imprimir
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="h-8 text-xs gap-1.5" title="Exportar tabela de totais">
            <Download className="h-3.5 w-3.5" /> Planilha Rápida
          </Button>
        </div>
      </div>

      {/* Cabeçalho de Impressão */}
      <div className="hidden print:block text-center border-b pb-4 mb-4">
        <h1 className="text-2xl font-bold">{churchName}</h1>
        <p className="text-sm text-muted-foreground">
          Relatório Financeiro e Demonstrativo de Recursos - Período:{' '}
          {selectedMonth !== 'all' ? `Mês ${selectedMonth}/` : ''}
          {selectedYear}
        </p>
      </div>

      {/* Cards de Resumo Executivo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-emerald-600 uppercase">
              Receitas Totais Arrecadadas
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">{fmt(totalIncome)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">Origem em dízimos, ofertas e doações</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-rose-500/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-rose-600 uppercase">
              Despesas Totais Realizadas
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-rose-600">{fmt(totalExpense)}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">Manutenção, ministérios e utilidades</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-primary/5">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold text-primary uppercase">
              Resultado Líquido (Superávit / Déficit)
            </CardDescription>
            <CardTitle
              className={`text-2xl font-bold ${netResult >= 0 ? 'text-primary' : 'text-rose-600'}`}
            >
              {fmt(netResult)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              {netResult >= 0 ? 'Superávit no período analisado' : 'Atenção: despesas superaram receitas'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução Mês a Mês */}
      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Evolução Comparativa Anual (Receitas vs Despesas)
          </CardTitle>
          <CardDescription>
            Acompanhe o desempenho mês a mês de arrecadação e execução orçamentária do ano de {selectedYear}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyEvolution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                <XAxis dataKey="month" tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip
                  formatter={(val: any) => [fmt(val), '']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--background)',
                  }}
                />
                <Legend />
                <Bar dataKey="Entradas" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saídas" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos de "De onde vieram" e "Onde foram gastos" */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* De onde vieram os recursos */}
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-emerald-600" />
              De Onde Vieram os Recursos (Receitas)
            </CardTitle>
            <CardDescription>Distribuição percentual por categoria de arrecadação.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeOriginData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                  >
                    {incomeOriginData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val: any) => [fmt(val), '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto text-xs pr-2">
              {incomeOriginData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-border/40">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="font-semibold text-foreground shrink-0">{fmt(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Onde foram gastos os recursos */}
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-rose-600" />
              Onde Foram Gastos os Recursos (Despesas)
            </CardTitle>
            <CardDescription>Distribuição percentual por categoria de desembolso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseDestData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    labelLine={false}
                  >
                    {expenseDestData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val: any) => [fmt(val), '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto text-xs pr-2">
              {expenseDestData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 border-b border-border/40">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <span className="font-semibold text-foreground shrink-0">{fmt(item.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise por Centro de Custo e Área Administrativa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Gastos por Centro de Custo
            </CardTitle>
            <CardDescription>Quais departamentos ou projetos consumiram mais recursos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              {costCenterData.map((c, idx) => {
                const pct = totalExpense > 0 ? (c.value / totalExpense) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span>{c.name}</span>
                      <span>{fmt(c.value)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Gastos por Área Administrativa
            </CardTitle>
            <CardDescription>Alocação de recursos por diretoria ou conselho.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              {adminAreaData.map((a, idx) => {
                const pct = totalExpense > 0 ? (a.value / totalExpense) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span>{a.name}</span>
                      <span>{fmt(a.value)} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
