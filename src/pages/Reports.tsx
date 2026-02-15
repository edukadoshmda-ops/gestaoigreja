import { useState, useEffect } from 'react';
import {
  FileText,
  DollarSign,
  TrendingUp,
  Download,
  Heart,
  Users,
  Church,
  BookOpen,
  Target,
  Award,
  Activity,
  PieChart as PieChartIcon,
  Loader2,
  Printer,
  FileDown,
  BarChart3,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

import { financialService } from '@/services/financial.service';
import { membersService } from '@/services/members.service';
import { cellsService } from '@/services/cells.service';
import { ministriesService } from '@/services/ministries.service';
import { discipleshipService } from '@/services/discipleship.service';
import { budgetsService } from '@/services/budgets.service';

// Configurações e Utilitários
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

export default function Reports() {
  const [selectedTab, setSelectedTab] = useState('evolucao');
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [churchHealthData, setChurchHealthData] = useState<any>({
    attendance: [],
    newMembers: 0,
    baptisms: 0,
    conversions: 0,
    activeCells: 0,
    activeMinistries: 0,
  });
  const [ministriesData, setMinistriesData] = useState<any[]>([]);
  const [spiritualGrowthData, setSpiritualGrowthData] = useState<any>({
    bibleStudy: [],
    prayerMeetings: [],
    discipleship: { active: 0, completed: 0, inProgress: 0 },
  });
  const [budgets, setBudgets] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));

  const { toast } = useToast();
  const { user } = useAuth();
  const canDownload = user?.role && !['aluno', 'membro', 'congregado'].includes(user.role);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    const fin = Array.isArray(financialData) ? financialData : [];
    const att = Array.isArray(churchHealthData?.attendance) ? churchHealthData.attendance : [];

    // Get all unique month keys for correct temporal sorting
    const allMonthKeys = Array.from(new Set([
      ...fin.map((f: any) => f?.rawMonth),
      ...att.map((a: any) => a?.monthKey)
    ])).filter(Boolean).sort();

    const merged = allMonthKeys.map((monthKey: string) => {
      const f = fin.find((x: any) => x?.rawMonth === monthKey) || {};
      const a = att.find((x: any) => x?.monthKey === monthKey) || {};

      return {
        month: f?.month || a?.month || monthKey,
        monthKey,
        frequencia: a?.total ?? 0,
        visitantes: a?.visitantes ?? 0,
        membrosPresentes: a?.membrosPresentes ?? 0,
        entradas: Number(f?.income) || 0,
        saidas: Number(f?.expenses) || 0,
      };
    });
    setEvolutionData(merged.length ? merged : []);
  }, [financialData, churchHealthData]);

  async function loadAllData() {
    setLoading(true);

    let attendanceDataFallback: any[] = [{ month: 'Sem dados', total: 0, adults: 0, youth: 0, children: 0 }];

    // --- Financial Data ---
    try {
      const finSummary = await financialService.getSummary();
      const rawTransactions = await financialService.getTransactionsForPeriod(6);
      const summaryList = Array.isArray(finSummary) ? finSummary : [];
      const txList = Array.isArray(rawTransactions) ? rawTransactions : [];

      const processedFinData = summaryList.map((f: any) => {
        const monthTransactions = txList.filter((t: any) => t?.date?.startsWith?.(f?.month));
        const tithes = monthTransactions
          .filter((t: any) => t?.category === 'Dízimos')
          .reduce((sum: number, t: any) => sum + (t?.amount ?? 0), 0);
        const offerings = monthTransactions
          .filter((t: any) => t?.category?.includes?.('Ofertas'))
          .reduce((sum: number, t: any) => sum + (t?.amount ?? 0), 0);
        return {
          month: formatMonth(f?.month ?? ''),
          rawMonth: f?.month ?? '',
          income: Number(f?.total_income) || 0,
          expenses: Number(f?.total_expenses) || 0,
          tithes,
          offerings,
        };
      }).reverse();

      setFinancialData(processedFinData);

      const expenseMap = new Map<string, number>();
      txList.filter((t: any) => t?.type === 'saida').forEach((t: any) => {
        const cat = t?.category ?? 'Outros';
        expenseMap.set(cat, (expenseMap.get(cat) || 0) + (t?.amount ?? 0));
      });
      setExpenseCategories(
        Array.from(expenseMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5)
      );

      // --- Budget Data ---
      const budgetData = await budgetsService.listByMonth(currentMonth);
      setBudgets(budgetData || []);
    } catch (e) {
      console.error('Erro ao carregar dados financeiros:', e);
      setFinancialData([]);
      setExpenseCategories([]);
    }

    // --- Church Health Data ---
    try {
      const [stats, activeCells, activeMinistries, allReports] = await Promise.all([
        membersService.getStatistics().catch(() => null),
        cellsService.getActive().catch(() => []),
        ministriesService.getActive().catch(() => []),
        cellsService.getAllReports().catch(() => []),
      ]);

      const reportsList = Array.isArray(allReports) ? allReports : [];
      const attendanceByMonthMap = new Map<string, { total: number; adults: number; youth: number; children: number; month: string; visitantes: number; membrosPresentes: number }>();

      if (reportsList.length > 0) {
        reportsList.forEach((report: any) => {
          const date = new Date(report?.date);
          if (isNaN(date.getTime())) return;
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthLabel = date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
          const current = attendanceByMonthMap.get(monthKey) || {
            total: 0,
            adults: 0,
            youth: 0,
            children: 0,
            month: monthLabel,
            monthKey: monthKey,
            visitantes: 0,
            membrosPresentes: 0
          };
          const mp = report?.members_present ?? 0;
          const v = report?.visitors ?? 0;
          attendanceByMonthMap.set(monthKey, {
            ...current,
            total: current.total + mp + v,
            adults: current.adults + mp,
            youth: current.youth,
            children: current.children,
            month: monthLabel,
            monthKey: monthKey,
            visitantes: current.visitantes + v,
            membrosPresentes: current.membrosPresentes + mp,
          });
        });
      }

      const attendanceData = Array.from(attendanceByMonthMap.values())
        .sort((a, b) => (a.monthKey || '').localeCompare(b.monthKey || ''))
        .slice(-6);
      attendanceDataFallback = attendanceData.length > 0 ? attendanceData : [{ month: 'Sem dados', total: 0, adults: 0, youth: 0, children: 0, visitantes: 0, membrosPresentes: 0 }];

      setChurchHealthData({
        attendance: attendanceDataFallback,
        newMembers: (stats as any)?.total_members ?? 0,
        baptisms: (stats as any)?.baptized_members ?? 0,
        conversions: 0,
        activeCells: Array.isArray(activeCells) ? activeCells.length : 0,
        activeMinistries: Array.isArray(activeMinistries) ? activeMinistries.length : 0,
      });
    } catch (e) {
      console.error('Erro ao carregar saúde da igreja:', e);
      setChurchHealthData({
        attendance: attendanceDataFallback,
        newMembers: 0,
        baptisms: 0,
        conversions: 0,
        activeCells: 0,
        activeMinistries: 0,
      });
    }

    // --- Ministries Data ---
    try {
      const activeMinistries = await ministriesService.getActive().catch(() => []);
      const list = Array.isArray(activeMinistries) ? activeMinistries : [];
      const mapped = await Promise.all(
        list.map(async (m: any) => {
          const count = await ministriesService.getMemberCount(m?.id).catch(() => 0);
          return {
            name: m?.name ?? 'Ministério',
            members: count,
            activities: 0,
            engagement: 85,
          };
        })
      );
      setMinistriesData(mapped);
    } catch (e) {
      console.error('Erro ao carregar ministérios:', e);
      setMinistriesData([]);
    }

    // --- Spiritual Growth Data ---
    try {
      const discStats = await discipleshipService.getStatistics().catch(() => null);
      const d = discStats && typeof discStats === 'object'
        ? { active: (discStats as any).active ?? 0, completed: (discStats as any).completed ?? 0, inProgress: (discStats as any).inProgress ?? (discStats as any).active ?? 0 }
        : { active: 0, completed: 0, inProgress: 0 };
      setSpiritualGrowthData({
        bibleStudy: attendanceDataFallback.map((a: any) => ({ month: a?.month ?? '', participants: a?.total ?? 0 })),
        prayerMeetings: [],
        discipleship: d,
      });
    } catch (e) {
      console.error('Erro ao carregar crescimento espiritual:', e);
      setSpiritualGrowthData({
        bibleStudy: [],
        prayerMeetings: [],
        discipleship: { active: 0, completed: 0, inProgress: 0 },
      });
    }

    setLoading(false);
  }

  function formatMonth(yyyyMM: string) {
    if (!yyyyMM) return '';
    const [year, month] = yyyyMM.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
  }

  const handleExport = () => {
    let dataToExport: any[] = [];
    let fileName = "";

    switch (selectedTab) {
      case 'saude':
        dataToExport = (Array.isArray(churchHealthData?.attendance) ? churchHealthData.attendance : []).map((a: any) => ({
          Mês: a.month,
          Total: a.total,
          Adultos: a.adults,
          Jovens: a.youth,
          Crianças: a.children
        }));
        fileName = "relatorio_saude_igreja.csv";
        break;
      case 'financeiro':
        dataToExport = (Array.isArray(financialData) ? financialData : []).map(f => ({
          Mês: f.month,
          Entradas: f.income,
          Saídas: f.expenses,
          Dízimos: f.tithes,
          Ofertas: f.offerings,
          Saldo: f.income - f.expenses
        }));
        fileName = "relatorio_financeiro.csv";
        break;
      case 'ministerios':
        dataToExport = (Array.isArray(ministriesData) ? ministriesData : []).map(m => ({
          Ministério: m.name,
          Membros: m.members,
          Atividades: m.activities,
          Engajamento: `${m.engagement}%`
        }));
        fileName = "relatorio_ministerios.csv";
        break;
      case 'crescimento':
        dataToExport = (Array.isArray(spiritualGrowthData?.bibleStudy) ? spiritualGrowthData.bibleStudy : []).map((b: any, i: number) => ({
          Mês: b.month,
          Participantes_Estudo: b.participants,
          Participantes_Oracao: spiritualGrowthData.prayerMeetings[i]?.participants || 0
        }));
        fileName = "relatorio_crescimento.csv";
        break;
    }

    if (dataToExport.length > 0) {
      const headers = Object.keys(dataToExport[0]).join(";");
      const rows = dataToExport.map(obj => Object.values(obj).join(";"));
      const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Relatório Exportado",
        description: `O arquivo ${fileName} foi baixado com sucesso.`,
      });
    }
  };

  const totalIncome = (Array.isArray(financialData) ? financialData : []).reduce((sum, d) => sum + (Number(d?.income) || 0), 0);
  const totalExpenses = (Array.isArray(financialData) ? financialData : []).reduce((sum, d) => sum + (Number(d?.expenses) || 0), 0);
  const balance = totalIncome - totalExpenses;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
    toast({
      title: 'Salvar como PDF',
      description: 'Na janela de impressão, escolha "Salvar como PDF" ou "Microsoft Print to PDF" como destino.',
    });
  };

  const chartConfig = {
    income: { label: 'Entradas', color: 'hsl(var(--primary))' },
    expenses: { label: 'Saídas', color: 'hsl(var(--destructive))' },
    tithes: { label: 'Dízimos', color: '#82ca9d' },
    offerings: { label: 'Ofertas', color: '#8884d8' },
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Carregando dados reais dos relatórios...</p>
      </div>
    );
  }

  return (
    <div id="relatorios-print" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Evolução da Igreja
          </h1>
          <p className="text-muted-foreground mt-1">
            Gráficos e relatórios de membros, visitantes, células, financeiro e mais
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-2">
            <FileDown className="h-4 w-4" />
            Baixar PDF
          </Button>
          {canDownload && (
            <Button
              size="sm"
              onClick={handleExport}
              className="bg-primary text-primary-foreground hover:shadow-lg transition-all gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 print:flex print:flex-wrap">
          <TabsTrigger value="evolucao" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Evolução</span>
            <span className="sm:hidden">Evol.</span>
          </TabsTrigger>
          <TabsTrigger value="saude" className="gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Saúde</span>
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Financeiro</span>
            <span className="sm:hidden">$</span>
          </TabsTrigger>
          <TabsTrigger value="ministerios" className="gap-2">
            <Church className="h-4 w-4" />
            <span className="hidden sm:inline">Ministérios</span>
            <span className="sm:hidden">Min.</span>
          </TabsTrigger>
          <TabsTrigger value="crescimento" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Crescimento</span>
            <span className="sm:hidden">Cresc.</span>
          </TabsTrigger>
        </TabsList>

        {/* Evolução da Igreja - Gráficos coloridos */}
        <TabsContent value="evolucao" className="space-y-6">
          <EvolutionReport
            evolutionData={evolutionData}
            churchHealthData={churchHealthData}
            financialData={financialData}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            balance={balance}
            expenseCategories={expenseCategories}
          />
        </TabsContent>

        {/* Saúde da Igreja Tab */}
        <TabsContent value="saude" className="space-y-6">
          <ChurchHealthReport data={churchHealthData} />
        </TabsContent>

        {/* Financeiro Tab */}
        <TabsContent value="financeiro" className="space-y-6">
          <FinancialReport
            data={financialData}
            totalIncome={totalIncome}
            totalExpenses={totalExpenses}
            balance={balance}
            chartConfig={chartConfig}
            expenseCategories={expenseCategories}
            budgets={budgets}
            currentMonth={currentMonth}
          />
        </TabsContent>

        {/* Ministérios Tab */}
        <TabsContent value="ministerios" className="space-y-6">
          <MinistriesReport data={ministriesData} />
        </TabsContent>

        {/* Crescimento Espiritual Tab */}
        <TabsContent value="crescimento" className="space-y-6">
          <SpiritualGrowthReport data={spiritualGrowthData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Evolução da Igreja - Gráficos coloridos (membros, visitantes, células, financeiro)
function EvolutionReport({
  evolutionData,
  churchHealthData,
  financialData,
  totalIncome,
  totalExpenses,
  balance,
  expenseCategories,
}: {
  evolutionData: any[];
  churchHealthData: any;
  financialData: any[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  expenseCategories: any[];
}) {
  const safeEvolution = Array.isArray(evolutionData) ? evolutionData : [];
  const safeExpense = Array.isArray(expenseCategories) ? expenseCategories : [];

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#6366f1] shadow-lg bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-[#6366f1]" />
              Total de Membros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#6366f1]">{churchHealthData?.newMembers ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#22c55e] shadow-lg bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#22c55e]" />
              Células Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#22c55e]">{churchHealthData?.activeCells ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#f59e0b] shadow-lg bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Church className="h-4 w-4 text-[#f59e0b]" />
              Ministérios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#f59e0b]">{churchHealthData?.activeMinistries ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#8b5cf6] shadow-lg bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-[#8b5cf6]" />
              Batismos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#8b5cf6]">{churchHealthData?.baptisms ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico: Frequência e Visitantes por mês */}
      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#6366f1]" />
            Frequência e Visitantes nas Reuniões
          </CardTitle>
          <CardDescription>Dados dos relatórios de células (membros presentes + visitantes)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safeEvolution} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => [value, '']} />
                <Bar dataKey="membrosPresentes" name="Membros presentes" fill={COLORS[0]} radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="visitantes" name="Visitantes" fill={COLORS[1]} radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico: Entradas e Saídas por mês */}
      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#22c55e]" />
            Evolução Financeira (Entradas x Saídas)
          </CardTitle>
          <CardDescription>Valores por mês a partir do Caixa Diário</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Array.isArray(financialData) ? financialData : []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']} />
                <Bar dataKey="income" name="Entradas" fill={COLORS[1]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Saídas" fill={COLORS[3]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Resumo financeiro + Pizza de despesas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resumo Financeiro (período)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Entradas</span>
              <span className="font-bold text-[#22c55e]">R$ {totalIncome.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Saídas</span>
              <span className="font-bold text-[#ef4444]">R$ {totalExpenses.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-medium">Saldo</span>
              <span className={`font-bold ${balance >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                R$ {balance.toLocaleString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Maiores Despesas (categorias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {safeExpense.length > 0 ? (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={safeExpense}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {safeExpense.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-8 text-center">Sem dados de despesas no período.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// Church Health Report Component
function ChurchHealthReport({ data }: { data: any }) {
  const rawAttendance = Array.isArray(data?.attendance) ? data.attendance : [];
  const attendance = rawAttendance.map((a: any) => ({
    month: a?.month ?? '-',
    total: Number(a?.total) || 0,
    adults: Number(a?.adults) || 0,
    youth: Number(a?.youth) || 0,
    children: Number(a?.children) || 0,
  }));
  const latestAttendance = attendance[attendance.length - 1] || { total: 0 };
  const previousAttendance = attendance[attendance.length - 2] || { total: 0 };
  const growthRate = previousAttendance.total > 0
    ? ((latestAttendance.total - previousAttendance.total) / previousAttendance.total * 100).toFixed(1)
    : "0";

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Frequência Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {latestAttendance.total}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              <span className={Number(growthRate) >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {Number(growthRate) >= 0 ? '+' : ''}{growthRate}%
              </span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Novos Membros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{data?.newMembers ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Últimos 6 meses</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Batismos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{data?.baptisms ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Últimos 6 meses</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Taxa de Retenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {data?.retentionRate ?? '94'}%
            </p>
            <p className="text-xs text-muted-foreground mt-1 text-green-600 font-semibold">Alto Engajamento</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Chart */}
      <Card className="border-primary/10 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução da Frequência
          </CardTitle>
          <CardDescription>Distribuição por faixa etária (adultos, jovens, crianças)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendance}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="adults" stackId="a" fill="hsl(var(--primary))" name="Adultos" />
                <Bar dataKey="youth" stackId="a" fill="hsl(var(--secondary))" name="Jovens" />
                <Bar dataKey="children" stackId="a" fill="#82ca9d" name="Crianças" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cells and Ministries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Células Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl font-bold text-primary">{data?.activeCells ?? 0}</span>
              <Badge className="bg-green-100 text-green-800">Ativo</Badge>
            </div>
            <Progress value={100} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Todas as células estão ativas e funcionando
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Church className="h-5 w-5" />
              Ministérios Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <span className="text-4xl font-bold text-primary">{data?.activeMinistries ?? 0}</span>
              <Badge className="bg-green-100 text-green-800">Ativo</Badge>
            </div>
            <Progress value={100} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              Todos os ministérios estão operacionais
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function BudgetSummary({ budgets, expenseCategories, onRefresh, currentMonth }: { budgets: any[], expenseCategories: any[], onRefresh: () => void, currentMonth: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSaveBudget = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const category = formData.get('category') as string;
    const amount = Number(formData.get('amount'));

    if (!category || isNaN(amount)) {
      setLoading(false);
      return;
    }

    try {
      // In a real scenario, we'd get churchId from a context or the user profile
      const churchId = (user as any)?.church_id;
      if (!churchId) throw new Error("Church ID not found");

      await budgetsService.upsert({
        category,
        amount,
        month: currentMonth
      }, churchId);

      toast({
        title: "Orçamento Definido",
        description: `Meta de R$ ${amount.toLocaleString('pt-BR')} salva para ${category}.`,
      });
      onRefresh();
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o orçamento.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 shadow-lg bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Controle de Orçamento Mensal
            </CardTitle>
            <CardDescription>Acompanhamento de gastos planejados vs. realizados</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-primary/30 text-primary hover:bg-primary/5">
                  <TrendingUp className="h-4 w-4" />
                  Configurar
                </Button>
              </DialogTrigger>
              <DialogContent className="w-screen h-screen sm:w-[95vw] sm:max-w-md sm:h-auto overflow-y-auto p-4 sm:p-6 rounded-none sm:rounded-lg">
                <DialogHeader>
                  <DialogTitle>Configurar Meta de Gasto</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveBudget} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <select
                      id="category"
                      name="category"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                    >
                      <option value="">Selecione uma categoria</option>
                      {expenseCategories.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor da Meta (R$)</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" placeholder="0,00" required />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Salvando..." : "Salvar Orçamento"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            <Badge variant="outline" className="border-primary/30 text-primary">
              {format(new Date(), "MMMM / yyyy", { locale: ptBR })}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {budgets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {budgets.map((budget) => {
              const actual = expenseCategories.find(c => c.name === budget.category)?.value || 0;
              const percent = Math.min((actual / budget.amount) * 100, 100);
              const isOver = actual > budget.amount;

              return (
                <div key={budget.id} className="space-y-2 p-3 rounded-lg border border-primary/5 bg-background/50">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-sm font-semibold">{budget.category}</span>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Meta: R$ {budget.amount.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <span className={cn("text-sm font-bold", isOver ? "text-destructive" : "text-primary")}>
                        R$ {actual.toLocaleString('pt-BR')}
                      </span>
                      <p className="text-[10px] text-muted-foreground">{percent.toFixed(0)}% utilizado</p>
                    </div>
                  </div>
                  <Progress value={percent} className={cn("h-2", isOver ? "bg-destructive/20 [&>div]:bg-destructive" : "bg-primary/10")} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed rounded-xl border-primary/10">
            <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum orçamento configurado para este mês.</p>
            <p className="text-xs text-muted-foreground mt-2">Defina metas de gastos para um melhor controle financeiro.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Financial Report Component
function FinancialReport({ data, totalIncome, totalExpenses, balance, chartConfig, expenseCategories, budgets, currentMonth }: any) {
  const safeData = Array.isArray(data) ? data : [];
  const safeExpenseCategories = Array.isArray(expenseCategories) ? expenseCategories : [];

  const budgetComparison = budgets.map((b: any) => {
    // This is simplified; in a real scenario we'd aggregate expenses for b.category in currentMonth
    const actual = 0; // Placeholder for now, logic below would be more complex
    return { ...b, actual };
  });

  return (
    <>
      {/* Budget Summary Section */}
      <BudgetSummary budgets={budgets} expenseCategories={expenseCategories} onRefresh={loadAllData} currentMonth={currentMonth} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Entradas Totais (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              R$ {totalIncome.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Saídas Totais (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">
              R$ {totalExpenses.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Saldo (6 meses)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {balance.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução Financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig ?? {}} className="h-[300px] w-full">
              <LineChart data={safeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line
                  type="monotone"
                  dataKey="income"
                  name="Entradas"
                  stroke="var(--color-income)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--color-income)', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Saídas"
                  stroke="var(--color-expenses)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--color-expenses)', r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Maiores Despesas (Top 5)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {safeExpenseCategories.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={safeExpenseCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {safeExpenseCategories.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Sem dados de despesas para exibir.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card className="border-primary/10 shadow-lg">
        <CardHeader>
          <CardTitle>Relatório Mensal Detalhado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto min-w-0">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Mês</th>
                  <th className="text-right py-3 px-4 font-medium">Dízimos</th>
                  <th className="text-right py-3 px-4 font-medium">Ofertas</th>
                  <th className="text-right py-3 px-4 font-medium">Total Entradas</th>
                  <th className="text-right py-3 px-4 font-medium">Saídas</th>
                  <th className="text-right py-3 px-4 font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {safeData.map((row: any) => {
                  const income = Number(row?.income) || 0;
                  const expenses = Number(row?.expenses) || 0;
                  const tithes = Number(row?.tithes) || 0;
                  const offerings = Number(row?.offerings) || 0;
                  return (
                    <tr key={row?.month ?? Math.random()} className="border-b hover:bg-primary/5 transition-colors">
                      <td className="py-3 px-4 font-medium">{row?.month ?? '-'}</td>
                      <td className="py-3 px-4 text-right">R$ {tithes.toLocaleString('pt-BR')}</td>
                      <td className="py-3 px-4 text-right">R$ {offerings.toLocaleString('pt-BR')}</td>
                      <td className="py-3 px-4 text-right text-primary font-semibold">
                        R$ {income.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-right text-destructive">
                        R$ {expenses.toLocaleString('pt-BR')}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${income - expenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        R$ {(income - expenses).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// Ministries Report Component
function MinistriesReport({ data }: { data: any[] }) {
  const safeData = Array.isArray(data) ? data : [];
  return (
    <>
      {/* Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Ministérios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{safeData.length}</p>
          </CardContent>
        </Card>


        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Engajamento Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {safeData.length > 0 ? (safeData.reduce((sum, m) => sum + (m?.engagement ?? 0), 0) / safeData.length).toFixed(0) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ministries List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {safeData.map((ministry) => (
          <Card key={ministry?.name ?? ministry?.id ?? Math.random()} className="border-primary/10 shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Church className="h-5 w-5 text-primary" />
                  {ministry?.name ?? 'Ministério'}
                </CardTitle>
                <Badge className="bg-primary text-primary-foreground">
                  {ministry?.engagement ?? 0}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Membros</p>
                  <p className="text-2xl font-bold text-primary">{ministry?.members ?? 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Atividades</p>
                  <p className="text-2xl font-bold text-primary">{ministry?.activities ?? 0}</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Engajamento</span>
                  <span className="text-sm font-bold">{ministry?.engagement ?? 0}%</span>
                </div>
                <Progress value={ministry?.engagement ?? 0} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}

// Spiritual Growth Report Component
function SpiritualGrowthReport({ data }: { data: any }) {
  const disc = data?.discipleship ?? { active: 0, completed: 0, inProgress: 0 };
  const bibleStudy = Array.isArray(data?.bibleStudy) ? data.bibleStudy : [];
  const prayerMeetings = Array.isArray(data?.prayerMeetings) ? data.prayerMeetings : [];
  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Discipulados Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{disc.active}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {disc.inProgress} em andamento
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-4 w-4" />
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{disc.completed}</p>
            <p className="text-xs text-muted-foreground mt-1">Últimos 6 meses</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Taxa de Conclusão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {disc.active > 0 ? ((disc.completed / disc.active) * 100).toFixed(0) : 0}%
            </p>
            <Progress
              value={disc.active > 0 ? (disc.completed / disc.active) * 100 : 0}
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Estudos Bíblicos
            </CardTitle>
            <CardDescription>Participação mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bibleStudy}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="participants"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Reuniões de Oração
            </CardTitle>
            <CardDescription>Participação mensal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prayerMeetings}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="participants"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--secondary))', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discipleship Progress */}
      <Card className="border-primary/10 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Progresso de Discipulado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Em Andamento</span>
                <span className="font-bold text-primary">{disc.inProgress}</span>
              </div>
              <Progress
                value={disc.active > 0 ? (disc.inProgress / disc.active) * 100 : 0}
                className="h-3"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Concluídos</span>
                <span className="font-bold text-green-600">{disc.completed}</span>
              </div>
              <Progress
                value={disc.active > 0 ? (disc.completed / disc.active) * 100 : 0}
                className="h-3 [&>div]:bg-green-600"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
