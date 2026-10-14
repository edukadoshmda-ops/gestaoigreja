import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  financialManagementService,
  DEFAULT_COST_CENTROS,
  DEFAULT_ADMIN_AREAS,
  BankAccount,
  ChartCategory,
  FinancialTransactionExtended,
} from '@/services/financial-management.service';

import { CashFlowView } from '@/components/financial/CashFlowView';
import { TransactionsGridView } from '@/components/financial/TransactionsGridView';
import { BankAccountsView } from '@/components/financial/BankAccountsView';
import { ChartOfAccountsView } from '@/components/financial/ChartOfAccountsView';
import { FinancialReportsView } from '@/components/financial/FinancialReportsView';
import { ReceiptsStorageView } from '@/components/financial/ReceiptsStorageView';
import { NewTransactionModal } from '@/components/financial/NewTransactionModal';
import { ExcelFinancialDashboardReport } from '@/components/financial/ExcelFinancialDashboardReport';

import {
  TrendingUp,
  FileSpreadsheet,
  Building2,
  FolderTree,
  BarChart3,
  CloudUpload,
  Plus,
  RefreshCw,
  Wallet,
} from 'lucide-react';

export default function DailyCash() {
  useDocumentTitle('Gestão Financeira');
  const queryClient = useQueryClient();
  const { user, viewingChurch, churchId: authChurchId } = useAuth();

  // Isolamento estrito por tenant: respeita igreja visualizada pelo Superadmin/Pastor de Rede ou igreja do usuário
  const effectiveChurchId = viewingChurch?.id || authChurchId || user?.churchId || 'default-church';
  const churchName = viewingChurch?.name || user?.churchName || 'Nossa Igreja';

  // Aba ativa (padrão: fluxo de caixa)
  const [activeTab, setActiveTab] = useState<string>('fluxo');
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState<boolean>(false);

  // Estados locais sincronizados estritamente por tenant (effectiveChurchId)
  const [accounts, setAccounts] = useState<BankAccount[]>(() =>
    financialManagementService.getAccounts(effectiveChurchId)
  );
  const [chartCategories, setChartCategories] = useState<ChartCategory[]>(() =>
    financialManagementService.getChartOfAccounts(effectiveChurchId)
  );

  // Query para transações estendidas (garante filtro por effectiveChurchId no Supabase e no cache)
  const {
    data: transactions = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['financial-transactions-extended', effectiveChurchId],
    queryFn: () => financialManagementService.getAllExtendedTransactions(effectiveChurchId),
    enabled: !!effectiveChurchId,
  });

  const refreshAll = () => {
    if (!effectiveChurchId) return;
    setAccounts(financialManagementService.getAccounts(effectiveChurchId));
    setChartCategories(financialManagementService.getChartOfAccounts(effectiveChurchId));
    refetch();
    queryClient.invalidateQueries({ queryKey: ['financial-transactions-extended', effectiveChurchId] });
  };

  useEffect(() => {
    if (!effectiveChurchId) return;
    setAccounts(financialManagementService.getAccounts(effectiveChurchId));
    setChartCategories(financialManagementService.getChartOfAccounts(effectiveChurchId));
  }, [effectiveChurchId]);

  // Saldo total consolidado
  const { totalBalance } = financialManagementService.calculateAccountBalances(
    accounts,
    transactions,
    false
  );

  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl animate-in fade-in-50 duration-300">
      {/* Cabeçalho do Módulo de Gestão Financeira */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600/10 text-emerald-600 border border-emerald-500/20">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                Gestão Financeira
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Fluxo de caixa, relatórios, conciliação bancária, plano de contas e comprovantes digitais
              </p>
            </div>
          </div>
        </div>

        {/* Saldo Consolidado + Ações Globais */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          <div className="px-3.5 py-1.5 rounded-xl bg-card border border-border shadow-sm flex items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">
              Saldo Consolidado:
            </span>
            <span className={`text-base font-extrabold ${totalBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {fmt(totalBalance)}
            </span>
          </div>

          <ExcelFinancialDashboardReport
            churchName={churchName}
            transactions={transactions}
            accounts={accounts}
            chartCategories={chartCategories}
            costCenters={DEFAULT_COST_CENTROS}
            adminAreas={DEFAULT_ADMIN_AREAS}
            className="h-9 text-xs"
          />

          <Button
            variant="outline"
            size="icon"
            onClick={refreshAll}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            title="Atualizar dados"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => setIsNewTxModalOpen(true)}
            className="h-9 gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" /> Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Navegação por Abas dos 6 Módulos */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-1 print:hidden">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 p-1.5 bg-muted/70 rounded-2xl min-w-[620px] h-auto border border-border/50">
            <TabsTrigger
              value="fluxo"
              className="text-xs py-2 rounded-xl gap-2 font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
              <span>Fluxo de Caixa</span>
            </TabsTrigger>

            <TabsTrigger
              value="lancamentos"
              className="text-xs py-2 rounded-xl gap-2 font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
              <span>Lançamentos</span>
            </TabsTrigger>

            <TabsTrigger
              value="contas"
              className="text-xs py-2 rounded-xl gap-2 font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <Building2 className="h-3.5 w-3.5 text-purple-500" />
              <span>Contas Bancárias</span>
            </TabsTrigger>

            <TabsTrigger
              value="plano-contas"
              className="text-xs py-2 rounded-xl gap-2 font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <FolderTree className="h-3.5 w-3.5 text-amber-500" />
              <span>Plano de Contas</span>
            </TabsTrigger>

            <TabsTrigger
              value="relatorios"
              className="text-xs py-2 rounded-xl gap-2 font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <BarChart3 className="h-3.5 w-3.5 text-rose-500" />
              <span>Relatórios</span>
            </TabsTrigger>

            <TabsTrigger
              value="comprovantes"
              className="text-xs py-2 rounded-xl gap-2 font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all"
            >
              <CloudUpload className="h-3.5 w-3.5 text-cyan-500" />
              <span>Comprovantes</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Conteúdo de Cada Módulo */}
        <TabsContent value="fluxo" className="space-y-4 focus-visible:outline-none">
          <CashFlowView
            churchId={effectiveChurchId}
            accounts={accounts}
            transactions={transactions}
            onRefresh={refreshAll}
            onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
          />
        </TabsContent>

        <TabsContent value="lancamentos" className="space-y-4 focus-visible:outline-none">
          <TransactionsGridView
            churchId={effectiveChurchId}
            transactions={transactions}
            accounts={accounts}
            chartCategories={chartCategories}
            costCenters={DEFAULT_COST_CENTROS}
            adminAreas={DEFAULT_ADMIN_AREAS}
            onRefresh={refreshAll}
            onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
          />
        </TabsContent>

        <TabsContent value="contas" className="space-y-4 focus-visible:outline-none">
          <BankAccountsView
            churchId={effectiveChurchId}
            accounts={accounts}
            transactions={transactions}
            onRefresh={refreshAll}
          />
        </TabsContent>

        <TabsContent value="plano-contas" className="space-y-4 focus-visible:outline-none">
          <ChartOfAccountsView
            churchId={effectiveChurchId}
            churchName={churchName}
            categories={chartCategories}
            onRefresh={refreshAll}
          />
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4 focus-visible:outline-none">
          <FinancialReportsView
            churchName={churchName}
            transactions={transactions}
            accounts={accounts}
            costCenters={DEFAULT_COST_CENTROS}
            adminAreas={DEFAULT_ADMIN_AREAS}
          />
        </TabsContent>

        <TabsContent value="comprovantes" className="space-y-4 focus-visible:outline-none">
          <ReceiptsStorageView
            churchId={effectiveChurchId}
            transactions={transactions}
            onRefresh={refreshAll}
            onOpenNewTransaction={() => setIsNewTxModalOpen(true)}
          />
        </TabsContent>
      </Tabs>

      {/* Modal Unificado de Novo Lançamento */}
      <NewTransactionModal
        open={isNewTxModalOpen}
        onOpenChange={setIsNewTxModalOpen}
        churchId={effectiveChurchId}
        accounts={accounts}
        chartCategories={chartCategories}
        costCenters={DEFAULT_COST_CENTROS}
        adminAreas={DEFAULT_ADMIN_AREAS}
        onSuccess={refreshAll}
      />
    </div>
  );
}
