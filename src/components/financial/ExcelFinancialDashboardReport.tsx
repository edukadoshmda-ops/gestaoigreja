import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  FinancialTransactionExtended,
  BankAccount,
  ChartCategory,
  CostCenter,
  AdminArea,
  financialManagementService,
} from '@/services/financial-management.service';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { FileSpreadsheet, Loader2 } from 'lucide-react';

interface ExcelFinancialDashboardReportProps {
  churchName?: string;
  transactions: FinancialTransactionExtended[];
  accounts: BankAccount[];
  chartCategories: ChartCategory[];
  costCenters: CostCenter[];
  adminAreas: AdminArea[];
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

/**
 * Botão que exporta o Dashboard Financeiro em Excel.
 * A planilha é gerada com ExcelJS (ver src/utils/financialDashboardExcel.ts), que grava
 * de verdade painéis congelados, cores, barras de dados e formatação condicional.
 */
export function ExcelFinancialDashboardReport({
  churchName = 'IGREJA EVANGÉLICA',
  transactions,
  accounts,
  chartCategories,
  costCenters,
  className = '',
  variant = 'default',
  size = 'default',
  showLabel = true,
}: ExcelFinancialDashboardReportProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateDashboard = async () => {
    try {
      setLoading(true);
      const safeTx = transactions || [];
      const safeAccounts = accounts || [];
      const { accountBalances, totalBalance } = financialManagementService.calculateAccountBalances(
        safeAccounts,
        safeTx,
        false
      );

      // Carregado sob demanda: o ExcelJS só é baixado quando o usuário clica
      const { buildFinancialDashboardBuffer } = await import('@/utils/financialDashboardExcel');
      const buffer = await buildFinancialDashboardBuffer({
        churchName,
        transactions: safeTx,
        accounts: safeAccounts,
        chartCategories: chartCategories || [],
        costCenters: costCenters || [],
        accountBalances: (accountBalances || {}) as any,
        totalBalance: Number(totalBalance) || 0,
      });

      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const cleanChurchName = churchName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_');
      saveAs(blob, `DASHBOARD_FINANCEIRO_${cleanChurchName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

      toast({
        title: '📊 Dashboard Financeiro gerado!',
        description: '6 abas: Painel, Extrato, Contas, DRE Mensal, Centros de Custo e Fluxo Projetado — com painéis congelados e filtros.',
      });
    } catch (err: any) {
      console.error('Erro ao gerar Dashboard Excel:', err);
      toast({
        title: 'Erro na geração do Dashboard Excel',
        description: err?.message || 'Falha ao processar os dados financeiros.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleGenerateDashboard}
      disabled={loading}
      variant={variant}
      size={size}
      className={`font-semibold transition-all shadow-sm gap-2 ${
        variant === 'default'
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
          : variant === 'outline'
          ? 'border-emerald-600/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400'
          : ''
      } ${className}`}
      title="Exportar Dashboard Financeiro profissional em Excel (painéis congelados, cores, DRE mensal e filtros)"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-emerald-200" />}
      {showLabel && (
        <div className="flex items-center gap-1.5">
          <span>Dashboard Excel</span>
          <span className="bg-emerald-800 text-emerald-100 text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider">
            PRO
          </span>
        </div>
      )}
    </Button>
  );
}

export default ExcelFinancialDashboardReport;
