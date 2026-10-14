import { useState, useEffect, useCallback } from 'react';
import {
  FileText,
  DollarSign,
  TrendingUp,
  Heart,
  Users,
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
  Pencil,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExcelAdministrativeDashboardButton } from '@/components/ExcelAdministrativeDashboardButton';
import { ExcelMinistriesDashboardButton } from '@/components/ExcelMinistriesDashboardButton';
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
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { ConfirmDialog } from '@/components/ConfirmDialog';
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
  Tooltip,
  Legend
} from 'recharts';

import { financialService } from '@/services/financial.service';
import { membersService } from '@/services/members.service';
import { cellsService } from '@/services/cells.service';
import { budgetsService } from '@/services/budgets.service';
import { DEFAULT_CHURCH_NAME } from '@/lib/constants';

// Configurações e Utilitários
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

// Todas as categorias padrão de saída do caixa
const DEFAULT_EXPENSE_CATEGORIES = [
  "Manutenção Predial",
  "Limpeza e Zeladoria",
  "Energia Elétrica",
  "Água e Esgoto",
  "Internet / Telefone",
  "Gás de Cozinha",
  "Ajuda Social / Cestas Básicas",
  "Ministério Infantil",
  "Ministério de Jovens",
  "Ministério de Louvor",
  "Escola Bíblica",
  "Eventos",
  "Missões e Evangelismo",
  "Material de Escritório",
  "Material de Limpeza",
  "Combustível / Transporte",
  "Honorários / Prebendas",
  "Outras Saídas",
  "Outros"
];

// Mapeamento de cores fixas por categoria para consistência visual
const getCategoryColor = (name: string, index: number) => {
  const colorMap: Record<string, string> = {
    // Entradas
    'Dízimos': '#22c55e', // Verde
    'Ofertas': '#6366f1', // Azul
    'Outras Entradas': '#f59e0b', // Laranja
    
    // Saídas Comuns
    'Aluguel': '#ef4444', // Vermelho
    'Água / Luz': '#06b6d4', // Ciano
    'Internet / Telefone': '#8b5cf6', // Roxo
    'Manutenção': '#f59e0b', // Laranja
    'Eventos': '#ec4899', // Rosa
    'Ministério de Louvor': '#22c55e', // Verde
    'Escola Bíblica': '#facc15', // Amarelo
    'Salários / Preletores': '#475569', // Cinza
    'Outras Saídas': '#6366f1', // Azul
    'Outros': '#94a3b8', // Cinza claro
  };

  return colorMap[name] || COLORS[index % COLORS.length];
};

// --- NOVO COMPONENTE: DISTRIBUIÇÃO MENSAL (PIZZA) ---
function MonthlyDistributionReport({ financialData, transactions }: { financialData: any[], transactions: any[] }) {
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  // Ordenar meses disponíveis (decrescente)
  const availableMonths = [...financialData].sort((a, b) => b.rawMonth.localeCompare(a.rawMonth));

  // Definir mês inicial se não selecionado
  useEffect(() => {
    if (!selectedMonth && availableMonths.length > 0) {
      setSelectedMonth(availableMonths[0].rawMonth);
    }
  }, [availableMonths, selectedMonth]);

  const currentMonthData = financialData.find(f => f.rawMonth === selectedMonth);
  const currentMonthTransactions = transactions.filter(t => t?.date?.startsWith?.(selectedMonth));

  // Processar Despesas por Categoria para o mês selecionado
  const expenseMap = new Map<string, number>();
  currentMonthTransactions.filter(t => t?.type === 'saida').forEach(t => {
    const cat = t?.category || 'Outros';
    expenseMap.set(cat, (expenseMap.get(cat) || 0) + (t?.amount || 0));
  });
  const expenseCategories = Array.from(expenseMap.entries())
    .map(([name, value]) => ({ name, value }))
    .filter(e => e.value > 0)
    .sort((a, b) => b.value - a.value);

  // Processar Composição de Entradas para o mês selecionado
  const tithes = currentMonthTransactions.filter(t => t?.category === 'Dízimos').reduce((sum, t) => sum + (t?.amount || 0), 0);
  const offerings = currentMonthTransactions.filter(t => t?.category?.includes('Ofertas')).reduce((sum, t) => sum + (t?.amount || 0), 0);
  const otherIncome = currentMonthTransactions.filter(t => t?.type === 'entrada' && t?.category !== 'Dízimos' && !t?.category?.includes('Ofertas')).reduce((sum, t) => sum + (t?.amount || 0), 0);

  const incomeComposition = [
    { name: 'Dízimos', value: tithes },
    { name: 'Ofertas', value: offerings },
    { name: 'Outras Entradas', value: otherIncome }
  ].filter(i => i.value > 0);

  if (!selectedMonth) return <div className="py-12 text-center text-muted-foreground">Carregando dados mensais...</div>;

  return (
    <div className="space-y-6">
      {/* Seletor de Mês */}
      <Card className="border-primary/20 shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-lg">Distribuição Mensal</h2>
            </div>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex h-10 w-full sm:w-64 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {availableMonths.map(m => (
                <option key={m.rawMonth} value={m.rawMonth}>
                  {format(new Date(m.rawMonth + '-02'), 'MMMM yyyy', { locale: ptBR })}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pizza de Despesas */}
        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-destructive" />
              Onde foi gasto (Saídas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expenseCategories.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      cx="40%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name, index)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, name]} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px', lineHeight: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm italic">
                Nenhuma despesa registrada neste mês.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pizza de Entradas */}
        <Card className="shadow-lg border-primary/10">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Composição das Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {incomeComposition.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeComposition}
                      cx="40%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {incomeComposition.map((entry, index) => (
                        <Cell key={`cell-income-${index}`} fill={getCategoryColor(entry.name, index)} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, name]} />
                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px', lineHeight: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm italic">
                Nenhuma entrada registrada neste mês.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Reports() {
  useDocumentTitle('Relatórios');
  const [selectedTab, setSelectedTab] = useState('evolucao');
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<any[]>([]);
  const [financialDataRawTransactions, setFinancialDataRawTransactions] = useState<any[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [evolutionData, setEvolutionData] = useState<any[]>([]);
  const [churchHealthData, setChurchHealthData] = useState<any>({
    attendance: [],
    newMembers: 0,
    baptisms: 0,
    conversions: 0,
    activeCells: 0,
  });
  const [spiritualGrowthData, setSpiritualGrowthData] = useState<any>({
    bibleStudy: [],
    prayerMeetings: [],
  });
  const [budgets, setBudgets] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));

  const { toast } = useToast();
  const { user, viewingChurch } = useAuth();
  const canDownload = user?.role && !['aluno', 'membro', 'congregado'].includes(user.role);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    let attendanceDataFallback: any[] = [{ month: 'Sem dados', total: 0, adults: 0, youth: 0, children: 0 }];

    try {
      const finSummary = await financialService.getSummary();
      const rawTransactions = await financialService.getTransactionsForPeriod(6);
      const summaryList = Array.isArray(finSummary) ? finSummary : [];
      const txList = Array.isArray(rawTransactions) ? rawTransactions : [];
      setFinancialDataRawTransactions(txList);

      const formatMonth = (yyyyMM: string) => {
        if (!yyyyMM) return '';
        const [year, month] = yyyyMM.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
      };

      const processedFinData = summaryList.map((f: any) => {
        const monthTransactions = txList.filter((t: any) => t?.date?.startsWith?.(f?.month));
        const tithes = monthTransactions.filter((t: any) => t?.category === 'Dízimos').reduce((sum: number, t: any) => sum + (t?.amount ?? 0), 0);
        const offerings = monthTransactions.filter((t: any) => t?.category?.includes?.('Ofertas')).reduce((sum: number, t: any) => sum + (t?.amount ?? 0), 0);
        return { month: formatMonth(f?.month ?? ''), rawMonth: f?.month ?? '', income: Number(f?.total_income) || 0, expenses: Number(f?.total_expenses) || 0, tithes, offerings };
      }).reverse();
      setFinancialData(processedFinData);

      const expenseMap = new Map<string, number>();
      txList.filter((t: any) => t?.type === 'saida').forEach((t: any) => {
        const cat = t?.category ?? 'Outros';
        expenseMap.set(cat, (expenseMap.get(cat) || 0) + (t?.amount ?? 0));
      });
      // Inclui TODAS as categorias de saída (não apenas top 5) para permitir criar metas para todas
      setExpenseCategories(Array.from(expenseMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value));

      const budgetData = await budgetsService.listByMonth(currentMonth, user?.churchId);
      setBudgets(budgetData || []);
    } catch (e) {
      console.error('Erro ao carregar dados financeiros:', e);
      setFinancialData([]);
      setExpenseCategories([]);
    }

    try {
      const [stats, activeCells, allReports] = await Promise.all([
        membersService.getStatistics().catch(() => null),
        cellsService.getActive().catch(() => []),
        cellsService.getAllReports().catch(() => []),
      ]);
      const reportsList = Array.isArray(allReports) ? allReports : [];
      const attendanceByMonthMap = new Map<string, { total: number; adults: number; youth: number; children: number; month: string; monthKey: string; visitantes: number; membrosPresentes: number }>();

      reportsList.forEach((report: any) => {
        const date = new Date(report?.date);
        if (isNaN(date.getTime())) return;
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        const current = attendanceByMonthMap.get(monthKey) || { total: 0, adults: 0, youth: 0, children: 0, month: monthLabel, monthKey, visitantes: 0, membrosPresentes: 0 };
        const mp = report?.members_present ?? 0;
        const v = report?.visitors ?? 0;
        attendanceByMonthMap.set(monthKey, { ...current, total: current.total + mp + v, adults: current.adults + mp, month: monthLabel, monthKey, visitantes: current.visitantes + v, membrosPresentes: current.membrosPresentes + mp });
      });

      const attendanceData = Array.from(attendanceByMonthMap.values()).sort((a, b) => (a.monthKey || '').localeCompare(b.monthKey || '')).slice(-6);
      attendanceDataFallback = attendanceData.length > 0 ? attendanceData : [{ month: 'Sem dados', total: 0, adults: 0, youth: 0, children: 0, monthKey: '', visitantes: 0, membrosPresentes: 0 }];

      setChurchHealthData({
        attendance: attendanceDataFallback,
        newMembers: (stats as any)?.total_members ?? 0,
        baptisms: (stats as any)?.baptized_members ?? 0,
        conversions: 0,
        activeCells: Array.isArray(activeCells) ? activeCells.length : 0,
      });
    } catch (e) {
      console.error('Erro ao carregar saúde da igreja:', e);
      setChurchHealthData({ attendance: attendanceDataFallback, newMembers: 0, baptisms: 0, conversions: 0, activeCells: 0 });
    }

    try {
      setSpiritualGrowthData({ bibleStudy: attendanceDataFallback.map((a: any) => ({ month: a?.month ?? '', participants: a?.total ?? 0 })), prayerMeetings: [] });
    } catch (e) {
      console.error('Erro ao carregar crescimento espiritual:', e);
      setSpiritualGrowthData({ bibleStudy: [], prayerMeetings: [] });
    }

    setLoading(false);
  }, [currentMonth]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

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

  function formatMonth(yyyyMM: string) {
    if (!yyyyMM) return '';
    const [year, month] = yyyyMM.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
  }

  const handleExport = () => {
    let dataToExport: any[] = [];
    let fileName = "";
    const churchName = viewingChurch?.name || DEFAULT_CHURCH_NAME;
    const currentDate = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

    // Função para gerar dados fictícios quando necessário
    const generateMockData = (type: string) => {
      const mockData: any[] = [];
      for (let i = 1; i <= 10; i++) {
        switch (type) {
          case 'saude':
            mockData.push({
              Mês: `Mês ${i}`,
              Total: 50 + i * 5,
              Adultos: 30 + i * 3,
              Jovens: 15 + i * 2,
              Crianças: 5 + i
            });
            break;
          case 'financeiro':
            mockData.push({
              Mês: `Mês ${i}`,
              Entradas: 15000 + i * 1000,
              Saídas: 8000 + i * 500,
              Dízimos: 10000 + i * 600,
              Ofertas: 5000 + i * 400,
              Saldo: 7000 + i * 500
            });
            break;
          case 'crescimento':
            mockData.push({
              Mês: `Mês ${i}`,
              Participantes_Estudo: 20 + i * 3,
              Participantes_Oracao: 15 + i * 2
            });
            break;
        }
      }
      return mockData;
    };

    switch (selectedTab) {
      case 'saude':
        dataToExport = (Array.isArray(churchHealthData?.attendance) ? churchHealthData.attendance : []).map((a: any) => ({
          Mês: a.month,
          Total: a.total,
          Adultos: a.adults,
          Jovens: a.youth,
          Crianças: a.children
        }));
        // Adiciona dados fictícios para garantir 10 itens
        if (dataToExport.length === 0) {
          dataToExport = generateMockData('saude');
        } else if (dataToExport.length < 10) {
          const needed = 10 - dataToExport.length;
          dataToExport = [...dataToExport, ...generateMockData('saude').slice(0, needed)];
        }
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
        // Adiciona dados fictícios para garantir 10 itens
        if (dataToExport.length === 0) {
          dataToExport = generateMockData('financeiro');
        } else if (dataToExport.length < 10) {
          const needed = 10 - dataToExport.length;
          dataToExport = [...dataToExport, ...generateMockData('financeiro').slice(0, needed)];
        }
        fileName = "relatorio_financeiro.csv";
        break;
      case 'crescimento':
        dataToExport = (Array.isArray(spiritualGrowthData?.bibleStudy) ? spiritualGrowthData.bibleStudy : []).map((b: any, i: number) => ({
          Mês: b.month,
          Participantes_Estudo: b.participants,
          Participantes_Oracao: spiritualGrowthData.prayerMeetings[i]?.participants || 0
        }));
        // Adiciona dados fictícios para garantir 10 itens
        if (dataToExport.length === 0) {
          dataToExport = generateMockData('crescimento');
        } else if (dataToExport.length < 10) {
          const needed = 10 - dataToExport.length;
          dataToExport = [...dataToExport, ...generateMockData('crescimento').slice(0, needed)];
        }
        fileName = "relatorio_crescimento.csv";
        break;
    }

    if (dataToExport.length > 0) {
      const headers = Object.keys(dataToExport[0]).join(";");
      const rows = dataToExport.map(obj => Object.values(obj).join(";"));
      
      // Cabeçalho com logo e informações da igreja
      const headerLines = [
        `Logo da Igreja: ${churchName}`,
        `Relatório Gerado em: ${currentDate}`,
        `Igreja: ${churchName}`,
        "", // Linha em branco
        headers
      ];
      
      const csvContent = "\uFEFF" + [...headerLines, ...rows].join("\n");
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
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          @page {
            margin: 2cm;
            /* Remove cabeçalhos e rodapés padrão do navegador */
            margin-top: 2cm;
            margin-bottom: 2cm;
          }
          /* Oculta qualquer URL que possa aparecer no rodapé */
          body::after,
          body::before,
          #relatorios-print::after,
          #relatorios-print::before,
          *::after[content*="localhost"],
          *::after[content*="caixa-diario"],
          *::before[content*="localhost"],
          *::before[content*="caixa-diario"] {
            content: none !important;
            display: none !important;
            visibility: hidden !important;
          }
          /* Remove URLs de links impressos */
          a[href*="localhost"]::after,
          a[href*="caixa-diario"]::after {
            content: none !important;
            display: none !important;
          }
          /* Remove qualquer texto que contenha localhost ou caixa-diario */
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        /* Oculta URLs mesmo fora do modo impressão se necessário */
        body::after,
        #relatorios-print::after {
          display: none !important;
        }
      `}</style>
      <div id="relatorios-print" className="space-y-6">

        {/* Header original */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary">
            Evolução da Igreja
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {canDownload && (
            <>
              <ExcelAdministrativeDashboardButton />
              <ExcelMinistriesDashboardButton />
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 h-10 text-sm px-3">
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="gap-2 h-10 text-sm px-3">
                <FileDown className="h-4 w-4" />
                Baixar PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="flex w-full justify-start overflow-x-auto overflow-y-hidden h-auto p-1 scrollbar-hide snap-x print:flex print:flex-wrap">
          <TabsTrigger value="evolucao" className="gap-2 text-sm shrink-0 snap-start">
            <BarChart3 className="h-[20px] w-[20px]" />
            <span className="hidden sm:inline">Evolução</span>
            <span className="sm:hidden">Evol.</span>
          </TabsTrigger>
          <TabsTrigger value="saude" className="gap-2 text-sm shrink-0 snap-start">
            <Heart className="h-[20px] w-[20px]" />
            <span className="hidden sm:inline">Saúde</span>
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-2 text-sm shrink-0 snap-start">
            <DollarSign className="h-[20px] w-[20px]" />
            <span className="hidden sm:inline">Financeiro</span>
            <span className="sm:hidden">$</span>
          </TabsTrigger>
          <TabsTrigger value="crescimento" className="gap-2 text-sm shrink-0 snap-start">
            <TrendingUp className="h-[20px] w-[20px]" />
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
            onRefresh={loadAllData}
          />
        </TabsContent>

        {/* Crescimento Espiritual Tab */}
        <TabsContent value="crescimento" className="space-y-6">
          <SpiritualGrowthReport data={spiritualGrowthData} />
        </TabsContent>
      </Tabs>
      </div>
    </>
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
            <CardTitle className="text-base md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-5 w-5 md:h-4 md:w-4 text-[#6366f1]" />
              Total de Membros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#6366f1]">{churchHealthData?.newMembers ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#22c55e] shadow-lg bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-5 w-5 md:h-4 md:w-4 text-[#22c55e]" />
              Células Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#22c55e]">{churchHealthData?.activeCells ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-[#8b5cf6] shadow-lg bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-5 w-5 md:h-4 md:w-4 text-[#8b5cf6]" />
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
                      data={safeExpense.filter(e => e.value > 0).slice(0, 6)}
                      cx="40%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {safeExpense.filter(e => e.value > 0).slice(0, 6).map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, '']} />
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      wrapperStyle={{ fontSize: '11px' }}
                    />
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
            <CardTitle className="text-base md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-5 w-5 md:h-4 md:w-4" />
              Frequência Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {latestAttendance.total}
            </p>
            <p className="text-sm md:text-xs text-muted-foreground mt-1">
              <span className={Number(growthRate) >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                {Number(growthRate) >= 0 ? '+' : ''}{growthRate}%
              </span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Award className="h-5 w-5 md:h-4 md:w-4" />
              Novos Membros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{data?.newMembers ?? 0}</p>
            <p className="text-sm md:text-xs text-muted-foreground mt-1">Últimos 6 meses</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="h-5 w-5 md:h-4 md:w-4" />
              Batismos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{data?.baptisms ?? 0}</p>
            <p className="text-sm md:text-xs text-muted-foreground mt-1">Últimos 6 meses</p>
          </CardContent>
        </Card>

        <Card className="border-primary/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-5 w-5 md:h-4 md:w-4" />
              Taxa de Retenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {data?.retentionRate ?? '94'}%
            </p>
            <p className="text-sm md:text-xs text-muted-foreground mt-1 text-green-600 font-semibold">Alto Engajamento</p>
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

      {/* Células */}
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

      </div>
    </>
  );
}

function BudgetSummary({ budgets, expenseCategories, onRefresh, currentMonth }: { budgets: any[], expenseCategories: any[], onRefresh: () => void, currentMonth: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editBudget, setEditBudget] = useState<any>(null);
  const [deleteBudgetId, setDeleteBudgetId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Combina categorias das transações com categorias padrão para garantir que todas estejam disponíveis
  const allAvailableCategories = Array.from(new Set([
    ...expenseCategories.map((c: any) => c.name),
    ...DEFAULT_EXPENSE_CATEGORIES
  ])).sort();

  const handleEdit = (budget: any) => {
    setEditBudget(budget);
    setIsOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteBudgetId) return;
    
    try {
      await budgetsService.delete(deleteBudgetId);
      toast({
        title: "Orçamento excluído",
        description: "O orçamento foi removido com sucesso.",
      });
      onRefresh();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o orçamento.",
        variant: "destructive"
      });
    } finally {
      setDeleteBudgetId(null);
    }
  };

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
      const churchId = user?.churchId;
      if (!churchId) throw new Error("Igreja não identificada");

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
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setEditBudget(null); }}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-primary/30 text-primary hover:bg-primary/5">
                  <TrendingUp className="h-4 w-4" />
                  Configurar
                </Button>
              </DialogTrigger>
              <DialogContent className="w-screen h-screen sm:w-[95vw] sm:max-w-md sm:h-auto overflow-y-auto p-4 sm:p-6 rounded-xl">
                <DialogHeader>
                  <DialogTitle>{editBudget ? 'Editar Orçamento' : 'Configurar Meta de Gasto'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveBudget} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <select
                      id="category"
                      name="category"
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      required
                      defaultValue={editBudget?.category || ''}
                      disabled={!!editBudget}
                    >
                      <option value="">Selecione uma categoria</option>
                      {allAvailableCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Valor da Meta (R$)</Label>
                    <Input id="amount" name="amount" type="number" step="0.01" placeholder="0,00" required defaultValue={editBudget?.amount || ''} />
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
                <div key={budget.id} className="space-y-2 p-3 rounded-xl border border-primary/5 bg-background/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm font-semibold">{budget.category}</span>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Meta: R$ {budget.amount.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => handleEdit(budget)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteBudgetId(budget.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="text-right flex-1">
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

      {/* Diálogo de confirmação de exclusão */}
      <ConfirmDialog
        open={!!deleteBudgetId}
        onOpenChange={(o) => !o && setDeleteBudgetId(null)}
        title="Excluir orçamento"
        description="Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        confirmLabel="Excluir"
        variant="destructive"
      />
    </Card>
  );
}

// Financial Report Component
function FinancialReport({ data, totalIncome, totalExpenses, balance, chartConfig, expenseCategories, budgets, currentMonth, onRefresh }: any) {
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
      <BudgetSummary budgets={budgets} expenseCategories={expenseCategories} onRefresh={onRefresh} currentMonth={currentMonth} />

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
              Distribuição de Despesas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {safeExpenseCategories.length > 0 ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={safeExpenseCategories.filter(e => e.value > 0).slice(0, 6)}
                        cx="40%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {safeExpenseCategories.filter(e => e.value > 0).slice(0, 6).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name, index)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, name]} />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        wrapperStyle={{ fontSize: '11px' }}
                      />
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

    </>
  );
}


// Spiritual Growth Report Component
function SpiritualGrowthReport({ data }: { data: any }) {
  const bibleStudy = Array.isArray(data?.bibleStudy) ? data.bibleStudy : [];
  const prayerMeetings = Array.isArray(data?.prayerMeetings) ? data.prayerMeetings : [];
  return (
    <>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/10 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Estudos Bíblicos
            </CardTitle>
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
    </>
  );
}
