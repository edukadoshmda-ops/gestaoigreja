import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { financialService } from '@/services/financial.service';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinanceData {
  monthIncome: number;
  monthExpense: number;
  balance: number;
  loading: boolean;
}

export function FinanceSummary() {
  const { churchId, user } = useAuth();
  const effectiveChurchId = churchId ?? user?.churchId;
  const [finance, setFinance] = useState<FinanceData>({
    monthIncome: 0,
    monthExpense: 0,
    balance: 0,
    loading: true,
  });

  useEffect(() => {
    async function loadFinance() {
      if (!effectiveChurchId) {
        setFinance((f) => ({ ...f, loading: false }));
        return;
      }

      try {
        const today = new Date();
        const startDate = startOfMonth(today);
        const endDate = endOfMonth(today);

        const entries = await financialService.list(startDate, endDate, effectiveChurchId);

        const income = (entries || [])
          .filter((e: any) => e.type === 'income' || e.entry_type === 'income')
          .reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);

        const expense = (entries || [])
          .filter((e: any) => e.type === 'expense' || e.entry_type === 'expense')
          .reduce((sum: number, e: any) => sum + (parseFloat(e.amount) || 0), 0);

        setFinance({
          monthIncome: income,
          monthExpense: expense,
          balance: income - expense,
          loading: false,
        });
      } catch (error) {
        console.error('Erro ao carregar financeiro:', error);
        setFinance((f) => ({ ...f, loading: false }));
      }
    }

    loadFinance();
  }, [effectiveChurchId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (finance.loading) {
    return (
      <Card className="bg-card border-primary/10 h-full">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const currentMonth = format(new Date(), 'MMMM', { locale: ptBR });

  return (
    <Card className="bg-card border-primary/10 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Resumo Financeiro - {currentMonth}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-950/50 border border-green-500/15 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">Entradas</span>
            </div>
            <p className="text-lg font-bold text-green-700 dark:text-green-300">
              {formatCurrency(finance.monthIncome)}
            </p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-500/15 rounded-xl">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-xs font-medium text-red-600 dark:text-red-400 uppercase">Saídas</span>
            </div>
            <p className="text-lg font-bold text-red-700 dark:text-red-300">
              {formatCurrency(finance.monthExpense)}
            </p>
          </div>
        </div>
        <div
          className={`p-4 rounded-xl border ${
            finance.balance >= 0
              ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500/15'
              : 'bg-orange-50 dark:bg-orange-950/50 border-orange-500/15'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign
                className={`h-5 w-5 ${
                  finance.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  finance.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
                }`}
              >
                Saldo do Mês
              </span>
            </div>
            <p
              className={`text-xl font-bold ${
                finance.balance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'
              }`}
            >
              {formatCurrency(finance.balance)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
