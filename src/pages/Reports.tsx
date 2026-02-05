import { useState } from 'react';
import {
  FileText,
  DollarSign,
  TrendingUp,
  Download,
  Heart,
  Users,
  Church,
  BookOpen,
  Calendar,
  Target,
  Award,
  Activity,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
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
  Legend,
  Tooltip
} from 'recharts';

// Mock Data
const financialData = [
  { month: 'Jan', income: 15000, expenses: 8500, tithes: 12000, offerings: 3000 },
  { month: 'Fev', income: 18200, expenses: 9100, tithes: 14500, offerings: 3700 },
  { month: 'Mar', income: 16800, expenses: 8800, tithes: 13400, offerings: 3400 },
  { month: 'Abr', income: 19500, expenses: 9500, tithes: 15600, offerings: 3900 },
  { month: 'Mai', income: 21000, expenses: 10200, tithes: 16800, offerings: 4200 },
  { month: 'Jun', income: 17500, expenses: 9800, tithes: 14000, offerings: 3500 },
];

const churchHealthData = {
  attendance: [
    { month: 'Jan', total: 245, adults: 180, youth: 45, children: 20 },
    { month: 'Fev', total: 268, adults: 195, youth: 50, children: 23 },
    { month: 'Mar', total: 252, adults: 185, youth: 47, children: 20 },
    { month: 'Abr', total: 280, adults: 205, youth: 52, children: 23 },
    { month: 'Mai', total: 295, adults: 215, youth: 55, children: 25 },
    { month: 'Jun', total: 310, adults: 225, youth: 60, children: 25 },
  ],
  newMembers: 15,
  baptisms: 8,
  conversions: 12,
  activeCells: 12,
  activeMinistries: 8,
};

const ministriesData = [
  { name: 'Louvor', members: 25, activities: 12, engagement: 92 },
  { name: 'Intercessão', members: 18, activities: 8, engagement: 88 },
  { name: 'Crianças', members: 15, activities: 10, engagement: 85 },
  { name: 'Jovens', members: 30, activities: 15, engagement: 90 },
  { name: 'Mídia', members: 12, activities: 20, engagement: 95 },
  { name: 'Recepção', members: 20, activities: 18, engagement: 87 },
];

const spiritualGrowthData = {
  bibleStudy: [
    { month: 'Jan', participants: 85 },
    { month: 'Fev', participants: 92 },
    { month: 'Mar', participants: 88 },
    { month: 'Abr', participants: 95 },
    { month: 'Mai', participants: 102 },
    { month: 'Jun', participants: 110 },
  ],
  prayerMeetings: [
    { month: 'Jan', participants: 65 },
    { month: 'Fev', participants: 70 },
    { month: 'Mar', participants: 68 },
    { month: 'Abr', participants: 75 },
    { month: 'Mai', participants: 80 },
    { month: 'Jun', participants: 85 },
  ],
  discipleship: {
    active: 45,
    completed: 12,
    inProgress: 33,
  },
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#8884d8', '#82ca9d', '#ffc658', '#ff8042'];

export default function Reports() {
  const [selectedTab, setSelectedTab] = useState('saude');

  const totalIncome = financialData.reduce((sum, d) => sum + d.income, 0);
  const totalExpenses = financialData.reduce((sum, d) => sum + d.expenses, 0);
  const balance = totalIncome - totalExpenses;

  const chartConfig = {
    income: { label: 'Entradas', color: 'hsl(var(--primary))' },
    expenses: { label: 'Saídas', color: 'hsl(var(--destructive))' },
    tithes: { label: 'Dízimos', color: 'hsl(var(--primary))' },
    offerings: { label: 'Ofertas', color: 'hsl(var(--secondary))' },
  };

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
        <Button className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg transition-all">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatórios
        </Button>
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
function ChurchHealthReport({ data }: { data: typeof churchHealthData }) {
  const latestAttendance = data.attendance[data.attendance.length - 1];
  const previousAttendance = data.attendance[data.attendance.length - 2];
  const growthRate = ((latestAttendance.total - previousAttendance.total) / previousAttendance.total * 100).toFixed(1);

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
              <span className="text-green-600 font-semibold">+{growthRate}%</span> vs mês anterior
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
                <Legend />
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
function FinancialReport({ data, totalIncome, totalExpenses, balance, chartConfig }: any) {
  const expenseCategories = [
    { name: 'Pessoal', value: 35000 },
    { name: 'Infraestrutura', value: 15000 },
    { name: 'Missões', value: 8000 },
    { name: 'Eventos', value: 5000 },
  ];

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Entradas Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              R$ {totalIncome.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Últimos 6 meses</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Saídas Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">
              R$ {totalExpenses.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Últimos 6 meses</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Saldo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              R$ {balance.toLocaleString('pt-BR')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Superávit acumulado</p>
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
                  stroke="var(--color-income)"
                  strokeWidth={3}
                  dot={{ fill: 'var(--color-income)', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
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
              Distribuição de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                    {expenseCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
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
                    <td className="py-3 px-4 text-right font-bold text-green-600">
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
function MinistriesReport({ data }: { data: typeof ministriesData }) {
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
              Total de Membros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {data.reduce((sum, m) => sum + m.members, 0)}
            </p>
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
              {(data.reduce((sum, m) => sum + m.engagement, 0) / data.length).toFixed(0)}%
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
function SpiritualGrowthReport({ data }: { data: typeof spiritualGrowthData }) {
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
              {((data.discipleship.completed / data.discipleship.active) * 100).toFixed(0)}%
            </p>
            <Progress
              value={(data.discipleship.completed / data.discipleship.active) * 100}
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
                value={(data.discipleship.inProgress / data.discipleship.active) * 100}
                className="h-3"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Concluídos</span>
                <span className="font-bold text-green-600">{data.discipleship.completed}</span>
              </div>
              <Progress
                value={(data.discipleship.completed / data.discipleship.active) * 100}
                className="h-3 [&>div]:bg-green-600"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}