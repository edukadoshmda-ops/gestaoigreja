import { describe, it, expect, beforeEach } from 'vitest';
import {
  financialManagementService,
  BankAccount,
  FinancialTransactionExtended,
  DEFAULT_CHART_CATEGORIES,
} from './financial-management.service';

describe('Financial Management Service - Automated Tests', () => {
  const CHURCH_A = 'church-aaa-111';
  const CHURCH_B = 'church-bbb-222';

  beforeEach(() => {
    const store = new Map<string, string>();
    globalThis.localStorage = {
      getItem: (k: string) => store.get(k) || null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
      key: (i: number) => Array.from(store.keys())[i] || null,
      length: store.size,
    } as any;
  });

  describe('1. Multi-Tenant Isolation', () => {
    it('isolates bank accounts between different churches', () => {
      // Cria conta na Igreja A
      financialManagementService.saveAccount(CHURCH_A, {
        name: 'Conta Corrente Banco A',
        bank_name: 'Banco A',
        account_type: 'corrente',
        initial_balance: 5000,
      });

      // Cria conta na Igreja B
      financialManagementService.saveAccount(CHURCH_B, {
        name: 'Conta Corrente Banco B',
        bank_name: 'Banco B',
        account_type: 'corrente',
        initial_balance: 20000,
      });

      const accountsA = financialManagementService.getAccounts(CHURCH_A);
      const accountsB = financialManagementService.getAccounts(CHURCH_B);

      // Nomes de contas de A não existem em B e vice-versa
      expect(accountsA.some((a) => a.name === 'Conta Corrente Banco A')).toBe(true);
      expect(accountsA.some((a) => a.name === 'Conta Corrente Banco B')).toBe(false);

      expect(accountsB.some((a) => a.name === 'Conta Corrente Banco B')).toBe(true);
      expect(accountsB.some((a) => a.name === 'Conta Corrente Banco A')).toBe(false);
    });

    it('isolates customized chart of accounts between churches', () => {
      // Adiciona categoria personalizada na Igreja A
      financialManagementService.saveChartCategory(CHURCH_A, {
        name: 'Oferta Especial Campanha do Agasalho',
        type: 'receita',
        group: 'Campanhas',
      });

      const chartA = financialManagementService.getChartOfAccounts(CHURCH_A);
      const chartB = financialManagementService.getChartOfAccounts(CHURCH_B);

      expect(chartA.some((c) => c.name === 'Oferta Especial Campanha do Agasalho')).toBe(true);
      expect(chartB.some((c) => c.name === 'Oferta Especial Campanha do Agasalho')).toBe(false);
    });

    it('isolates cash flow simulations between churches', () => {
      financialManagementService.addSimulation(CHURCH_A, {
        name: 'Venda de Terreno',
        type: 'receita',
        amount: 150000,
        date: '2026-12-01',
      });

      const simsA = financialManagementService.getSimulations(CHURCH_A);
      const simsB = financialManagementService.getSimulations(CHURCH_B);

      expect(simsA.length).toBe(1);
      expect(simsA[0].name).toBe('Venda de Terreno');
      expect(simsB.length).toBe(0);
    });
  });

  describe('2. Balance and Cash Flow Calculations', () => {
    it('calculates initial real balances and transaction impacts without retroactive entries', () => {
      const mockAccounts: BankAccount[] = [
        {
          id: 'acc-1',
          church_id: CHURCH_A,
          name: 'Caixa Geral',
          bank_name: 'Caixa',
          account_type: 'caixa',
          initial_balance: 1000,
          balance_date: '2026-10-13',
          color: '#10B981',
          is_active: true,
        },
        {
          id: 'acc-2',
          church_id: CHURCH_A,
          name: 'Banco do Brasil',
          bank_name: 'BB',
          account_type: 'corrente',
          initial_balance: 5000,
          balance_date: '2026-10-13',
          color: '#3B82F6',
          is_active: true,
        },
      ];

      const mockTxs: FinancialTransactionExtended[] = [
        // Entrada de 500 no Caixa
        {
          id: 'tx-1',
          church_id: CHURCH_A,
          type: 'entrada',
          status: 'realizado',
          amount: 500,
          date: '2026-10-13',
          category: 'Dízimos',
          account_id: 'acc-1',
          account_name: 'Caixa Geral',
          created_at: new Date().toISOString(),
        },
        // Saída de 200 do Banco do Brasil
        {
          id: 'tx-2',
          church_id: CHURCH_A,
          type: 'saida',
          status: 'realizado',
          amount: 200,
          date: '2026-10-13',
          category: 'Energia Elétrica',
          account_id: 'acc-2',
          account_name: 'Banco do Brasil',
          created_at: new Date().toISOString(),
        },
        // Saída planejada (prevista) de 1000 no Banco do Brasil
        {
          id: 'tx-3',
          church_id: CHURCH_A,
          type: 'saida',
          status: 'planejado',
          amount: 1000,
          date: '2026-10-20',
          category: 'Manutenção Predial',
          account_id: 'acc-2',
          account_name: 'Banco do Brasil',
          created_at: new Date().toISOString(),
        },
      ];

      // Cálculo considerando apenas realizados
      const resultRealized = financialManagementService.calculateAccountBalances(
        mockAccounts,
        mockTxs,
        false
      );

      // Caixa: 1000 + 500 = 1500
      expect(resultRealized.accountBalances['acc-1'].current).toBe(1500);
      // Banco: 5000 - 200 = 4800
      expect(resultRealized.accountBalances['acc-2'].current).toBe(4800);
      // Total consolidado: 1500 + 4800 = 6300
      expect(resultRealized.totalBalance).toBe(6300);

      // Cálculo incluindo planejados (toggle de projeção)
      const resultWithPlanned = financialManagementService.calculateAccountBalances(
        mockAccounts,
        mockTxs,
        true
      );

      // Banco com despesa planejada de 1000: 4800 - 1000 = 3800
      expect(resultWithPlanned.accountBalances['acc-2'].current).toBe(3800);
      expect(resultWithPlanned.totalBalance).toBe(5300);
    });
  });

  describe('3. Chart of Accounts Integrity', () => {
    it('contains essential church categories by default', () => {
      const categories = financialManagementService.getChartOfAccounts(CHURCH_A);

      const categoryNames = categories.map((c) => c.name);
      expect(categoryNames).toContain('Dízimos');
      expect(categoryNames).toContain('Ofertas - Culto Geral');
      expect(categoryNames).toContain('Ofertas - Missões');
      expect(categoryNames).toContain('Prebendas e Honorários Pastorais');
      expect(categoryNames).toContain('Ministério Infantil (Kids)');
      expect(categoryNames).toContain('Energia Elétrica');
    });

    it('allows deleting and resetting chart of accounts', () => {
      financialManagementService.saveChartCategory(CHURCH_A, {
        name: 'Categoria Temporaria',
        type: 'despesa',
      });

      let current = financialManagementService.getChartOfAccounts(CHURCH_A);
      const temp = current.find((c) => c.name === 'Categoria Temporaria');
      expect(temp).toBeDefined();

      financialManagementService.deleteChartCategory(CHURCH_A, temp!.id);
      current = financialManagementService.getChartOfAccounts(CHURCH_A);
      expect(current.some((c) => c.name === 'Categoria Temporaria')).toBe(false);

      financialManagementService.resetChartOfAccounts(CHURCH_A);
      const reset = financialManagementService.getChartOfAccounts(CHURCH_A);
      expect(reset.length).toBe(DEFAULT_CHART_CATEGORIES.length);
    });
  });

  describe('4. Reconciliation & Difference Elimination', () => {
    it('updates initial balance to eliminate bank statement discrepancy without retroactive logs', () => {
      const initialAccount = financialManagementService.saveAccount(CHURCH_A, {
        name: 'Conta Conciliação',
        bank_name: 'Itaú',
        account_type: 'corrente',
        initial_balance: 1000,
      });

      // Extrato real do banco acusa 1250 (diferença de +250)
      const diff = 250;
      financialManagementService.saveAccount(CHURCH_A, {
        ...initialAccount,
        initial_balance: (initialAccount.initial_balance || 0) + diff,
        balance_date: '2026-10-13',
      });

      const updated = financialManagementService
        .getAccounts(CHURCH_A)
        .find((a) => a.id === initialAccount.id);

      expect(updated?.initial_balance).toBe(1250);
    });
  });
});
