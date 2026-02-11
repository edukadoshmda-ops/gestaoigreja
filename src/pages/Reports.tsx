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
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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

// Configurações e Utilitários
const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

export default function Reports() {
  const [selectedTab, setSelectedTab] = useState('saude');
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
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

  const { toast } = useToast();
  const { user } = useAuth();
  const canDownload = user?.role && !['aluno', 'membro', 'congregado'].includes(user.role);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      setLoading(true);

      // --- Financial Data ---
      const finSummary = await financialService.getSummary();
      const rawTransactions = await financialService.getTransactionsForPeriod(6);

      // Process monthly data including breakdown
      const processedFinData = finSummary.map((f: any) => {
        // Find transactions for this month to calculate tithes/offerings
        const monthTransactions = rawTransactions.filter(t => t.date.startsWith(f.month));
        const tithes = monthTransactions
          .filter(t => t.category === 'Dízimos')
          .reduce((sum, t) => sum + t.amount, 0);
        const offerings = monthTransactions
          .filter(t => t.category.includes('Ofertas'))
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          month: formatMonth(f.month),
          income: Number(f.total_income) || 0,
          expenses: Number(f.total_expenses) || 0,
          tithes,
          offerings,
        };
      }).reverse(); // Most recent last in chart

      setFinancialData(processedFinData);

      // Process Expense Categories (Last 6 months)
      const expenseMap = new Map<string, number>();
      rawTransactions
        .filter(t => t.type === 'saida')
        .forEach(t => {
          const current = expenseMap.get(t.category) || 0;
          expenseMap.set(t.category, current + t.amount);
        });
      
      const expenseChartData = Array.from(expenseMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5 categories
      
      setExpenseCategories(expenseChartData);


      // --- Church Health Data ---
      const stats = await membersService.getStatistics();
      const activeCells = await cellsService.getActive();
      const activeMinistries = await ministriesService.getActive();

      // Calculate attendance from cell reports
      const allReports = await cellsService.getAllReports();
      const attendanceByMonthMap = new Map();

      if (allReports && allReports.length > 0) {
        allReports.forEach((report: any) => {
          const date = new Date(report.date);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const monthLabel = date.toLocaleString('pt-BR', { month: 'short' });
          
          const current = attendanceByMonthMap.get(monthKey) || { 
            total: 0, adults: 0, youth: 0, children: 0, month: monthLabel 
          };
          
          attendanceByMonthMap.set(monthKey, {
            total: current.total + report.members_present + report.visitors,
            adults: current.adults + report.members_present, // Approximation
            youth: current.youth,
            children: current.children,
            month: monthLabel
          });
        });
      }

      const attendanceData = Array.from(attendanceByMonthMap.values())
        .sort((a: any, b: any) => a.month.localeCompare(b.month)) // This sort might need better logic if crossing years
        .slice(-6); 

      setChurchHealthData({
        attendance: attendanceData.length > 0 ? attendanceData : [{ month: 'Sem dados', total: 0, adults: 0, youth: 0, children: 0 }],
        newMembers: stats?.total_members || 0,
        baptisms: stats?.baptized_members || 0,
        conversions: 0,
        activeCells: activeCells?.length || 0,
        activeMinistries: activeMinistries?.length || 0,
      });

      // --- Ministries Data ---
      const ministries = activeMinistries || [];
      const mappedMinistries = await Promise.all(ministries.map(async (m: any) => {
        const count = await ministriesService.getMemberCount(m.id);
        return {
          name: m.name,
          members: count,
          activities: 0,
          engagement: 85, // Placeholder
        };
      }));
      setMinistriesData(mappedMinistries);

      // --- Spiritual Growth Data ---
      const discStats = await discipleshipService.getStatistics();
      setSpiritualGrowthData({
        bibleStudy: attendanceData.map((a: any) => ({ month: a.month, participants: a.total })),
        prayerMeetings: [],
        discipleship: discStats || { active: 0, completed: 0, inProgress: 0 },
      });

    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados dos relatórios.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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
        dataToExport = churchHealthData.attendance.map((a: any) => ({
          Mês: a.month,
          Total: a.total,
          Adultos: a.adults,
          Jovens: a.youth,
          Crianças: a.children
        }));
        fileName = "relatorio_saude_igreja.csv";
        break;
      case 'financeiro':
        dataToExport = financialData.map(f => ({
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
        dataToExport = ministriesData.map(m => ({
          Ministério: m.name,
          Membros: m.members,
          Atividades: m.activities,
          Engajamento: `${m.engagement}%`
        }));
        fileName = "relatorio_ministerios.csv";
        break;
      case 'crescimento':
        dataToExport = spiritualGrowthData.bibleStudy.map((b: any, i: number) => ({
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

  const totalIncome = financialData.reduce((sum, d) => sum + d.income, 0);
  const totalExpenses = financialData.reduce((sum, d) => sum + d.expenses, 0);
  const balance = totalIncome - totalExpenses;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Relatórios Padrão
          </h1>
          <p className="text-muted-foreground mt-1">
            Análises completas da saúde e crescimento da igreja
          </p>
        </div>
        {canDownload && (
          <Button
            onClick={handleExport}
            className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg transition-all"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatórios
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="saude" className="gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden sm:inline">Saúde da Igreja</span>
            <span className="sm:hidden">Saúde</span>
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

// Church Health Report Component
function ChurchHealthReport({ data }: { data: any }) {
  const latestAttendance = data.attendance[data.attendance.length - 1] || { total: 0 };
  const previousAttendance = data.attendance[data.attendance.length - 2] || { total: 0 };
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
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
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
            <p className="text-3xl font-bold text-primary">{data.newMembers}</p>
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
            <p className="text-3xl font-bold text-primary">{data.baptisms}</p>
            <p className="text-xs text-muted-foreground mt-1">Últimos 6 meses</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Conversões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{data.conversions}</p>
            <p className="text-xs text-muted-foreground mt-1">Últimos 6 meses</p>
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
          <CardDescription>Distribuição por faixa etária</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.attendance}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <ChartLegend content={<ChartLegendContent />} />
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
              <span className="text-4xl font-bold text-primary">{data.activeCells}</span>
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
              <span className="text-4xl font-bold text-primary">{data.activeMinistries}</span>
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

// Financial Report Component
function FinancialReport({ data, totalIncome, totalExpenses, balance, chartConfig, expenseCategories }: any) {
  return (
    <>
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
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <LineChart data={data}>
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
            {expenseCategories.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {expenseCategories.map((entry: any, index: number) => (
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
          <div className="overflow-x-auto">
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
                {data.map((row: any) => (
                  <tr key={row.month} className="border-b hover:bg-primary/5 transition-colors">
                    <td className="py-3 px-4 font-medium">{row.month}</td>
                    <td className="py-3 px-4 text-right">R$ {row.tithes.toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-4 text-right">R$ {row.offerings.toLocaleString('pt-BR')}</td>
                    <td className="py-3 px-4 text-right text-primary font-semibold">
                      R$ {row.income.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-right text-destructive">
                      R$ {row.expenses.toLocaleString('pt-BR')}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold ${row.income - row.expenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {(row.income - row.expenses).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))}
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
            <p className="text-3xl font-bold text-primary">{data.length}</p>
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
              {data.length > 0 ? (data.reduce((sum, m) => sum + m.engagement, 0) / data.length).toFixed(0) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ministries List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((ministry) => (
          <Card key={ministry.name} className="border-primary/10 shadow-lg hover:shadow-xl transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Church className="h-5 w-5 text-primary" />
                  {ministry.name}
                </CardTitle>
                <Badge className="bg-gradient-to-r from-primary to-secondary text-white">
                  {ministry.engagement}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Membros</p>
                  <p className="text-2xl font-bold text-primary">{ministry.members}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Atividades</p>
                  <p className="text-2xl font-bold text-primary">{ministry.activities}</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Engajamento</span>
                  <span className="text-sm font-bold">{ministry.engagement}%</span>
                </div>
                <Progress value={ministry.engagement} className="h-2" />
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
            <p className="text-3xl font-bold text-primary">{data.discipleship.active}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.discipleship.inProgress} em andamento
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
            <p className="text-3xl font-bold text-green-600">{data.discipleship.completed}</p>
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
              {data.discipleship.active > 0 ? ((data.discipleship.completed / data.discipleship.active) * 100).toFixed(0) : 0}%
            </p>
            <Progress
              value={data.discipleship.active > 0 ? (data.discipleship.completed / data.discipleship.active) * 100 : 0}
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
                <LineChart data={data.bibleStudy}>
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
                <LineChart data={data.prayerMeetings}>
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
                <span className="font-bold text-primary">{data.discipleship.inProgress}</span>
              </div>
              <Progress
                value={data.discipleship.active > 0 ? (data.discipleship.inProgress / data.discipleship.active) * 100 : 0}
                className="h-3"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Concluídos</span>
                <span className="font-bold text-green-600">{data.discipleship.completed}</span>
              </div>
              <Progress
                value={data.discipleship.active > 0 ? (data.discipleship.completed / data.discipleship.active) * 100 : 0}
                className="h-3 [&>div]:bg-green-600"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
