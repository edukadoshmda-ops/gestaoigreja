import { describe, it, expect } from 'vitest';
import * as ExcelJSNS from 'exceljs';
import JSZip from 'jszip';
import { writeFileSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { buildFinancialDashboardBuffer, FinancialDashboardInput } from './financialDashboardExcel';

const ExcelJS: any = (ExcelJSNS as any).Workbook ? ExcelJSNS : (ExcelJSNS as any).default;

function sampleInput(): FinancialDashboardInput {
  const cats = ['Dízimos', 'Ofertas', 'Missões'];
  const exps = ['Energia', 'Água', 'Aluguel', 'Salário Pastoral'];
  const transactions: any[] = [];
  for (let m = 1; m <= 10; m++) {
    const mm = String(m).padStart(2, '0');
    cats.forEach((c, i) => transactions.push({ id: `e${m}${i}`, church_id: 'c', type: 'entrada', status: 'realizado', amount: 5000 + i * 1500 + m * 120, date: `2026-${mm}-0${i + 1}`, category: c, cost_center: 'Culto Geral', account_id: 'a1', account_name: 'Banco do Brasil', description: `${c} do mês`, is_reconciled: m % 2 === 0 }));
    exps.forEach((c, i) => transactions.push({ id: `s${m}${i}`, church_id: 'c', type: 'saida', status: 'realizado', amount: 800 + i * 900 + m * 50, date: `2026-${mm}-1${i}`, category: c, cost_center: i === 3 ? 'Pastoral' : 'Manutenção', account_id: 'a1', account_name: 'Banco do Brasil', description: `Pagamento ${c}`, is_reconciled: true }));
  }
  transactions.push({ id: 't1', church_id: 'c', type: 'transferencia', status: 'realizado', amount: 2000, date: '2026-05-20', category: 'Transferência', account_name: 'Banco do Brasil', destination_account_name: 'Caixa', description: 'Reforço de caixa' });
  transactions.push({ id: 'p1', church_id: 'c', type: 'entrada', status: 'planejado', amount: 9000, date: '2026-11-05', category: 'Dízimos', account_name: 'Banco do Brasil', description: 'Previsão dízimos' });
  transactions.push({ id: 'p2', church_id: 'c', type: 'saida', status: 'planejado', amount: 4000, date: '2026-11-10', category: 'Aluguel', account_name: 'Banco do Brasil', description: 'Aluguel novembro' });
  return {
    churchName: 'Igreja Viva Global',
    transactions,
    accounts: [
      { id: 'a1', church_id: 'c', name: 'Conta Movimento', bank_name: 'Banco do Brasil', account_type: 'corrente', initial_balance: 10000, balance_date: '2026-01-01', color: '#000', is_active: true },
      { id: 'a2', church_id: 'c', name: 'Caixa Tesouraria', bank_name: 'Caixa Físico', account_type: 'caixa', initial_balance: 500, balance_date: '2026-01-01', color: '#000', is_active: true },
    ] as any,
    chartCategories: [
      { id: '1', code: '1.1.01', name: 'Dízimos', type: 'receita', group: 'Receitas Eclesiásticas' },
      { id: '2', code: '1.1.02', name: 'Ofertas', type: 'receita', group: 'Receitas Eclesiásticas' },
      { id: '3', code: '1.2.01', name: 'Missões', type: 'receita', group: 'Receitas Missionárias' },
      { id: '4', code: '2.1.01', name: 'Energia', type: 'despesa', group: 'Despesas Administrativas' },
      { id: '5', code: '2.1.02', name: 'Água', type: 'despesa', group: 'Despesas Administrativas' },
      { id: '6', code: '2.1.03', name: 'Aluguel', type: 'despesa', group: 'Despesas Administrativas' },
      { id: '7', code: '2.2.01', name: 'Salário Pastoral', type: 'despesa', group: 'Despesas com Pessoal' },
    ],
    costCenters: [{ id: 'cc1', name: 'Culto Geral' }, { id: 'cc2', name: 'Manutenção' }, { id: 'cc3', name: 'Pastoral' }],
    accountBalances: { a1: { current: 182340.5, income: 230000, expense: 57659.5 }, a2: { current: 2500, income: 2000, expense: 0 } },
    totalBalance: 184840.5,
    issuedAt: new Date(2026, 9, 13, 21, 0),
  };
}

describe('Dashboard Financeiro Excel (ExcelJS)', () => {
  it('gera 6 abas com painéis congelados, cores e formatação condicional gravados no arquivo', async () => {
    const buf = await buildFinancialDashboardBuffer(sampleInput());

    // Salva amostra para inspeção visual
    const outDir = join(tmpdir(), 'gestao-igreja-excel');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'dashboard-financeiro-amostra.xlsx'), Buffer.from(buf as ArrayBuffer));

    // 1) Relê com ExcelJS
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const names = wb.worksheets.map((w: any) => w.name);
    expect(names).toEqual(['Painel', 'Extrato', 'Contas Bancárias', 'DRE Mensal', 'Centros de Custo', 'Fluxo Projetado']);

    const extrato = wb.getWorksheet('Extrato');
    expect(extrato.views[0]).toMatchObject({ state: 'frozen', xSplit: 2, ySplit: 5 });
    expect(extrato.getCell('A5').fill.fgColor.argb).toBe('FF1E293B');
    expect(extrato.getCell('A6').value).toBeInstanceOf(Date);

    const painel = wb.getWorksheet('Painel');
    expect(painel.getCell('B6').value).toBe(184840.5);
    expect(painel.getCell('B1').fill.fgColor.argb).toBe('FF0F172A');

    // 2) Inspeciona o XML bruto: o congelamento PRECISA estar no arquivo
    const zip = await JSZip.loadAsync(buf as ArrayBuffer);
    for (let i = 1; i <= 6; i++) {
      const xml = await zip.file(`xl/worksheets/sheet${i}.xml`)!.async('string');
      expect(xml, `sheet${i} sem freeze`).toMatch(/<pane[^>]*state="frozen"/);
      expect(xml, `sheet${i} com grade visível`).toMatch(/showGridLines="0"/);
    }
    const sheet1 = await zip.file('xl/worksheets/sheet1.xml')!.async('string');
    expect(sheet1).toMatch(/<dataBar/);
    const styles = await zip.file('xl/styles.xml')!.async('string');
    expect(styles).toContain('FF0F172A');
    expect(styles).toContain('FFD1FAE5');
  });

  it('funciona sem nenhum dado (igreja nova)', async () => {
    const buf = await buildFinancialDashboardBuffer({
      churchName: 'Igreja Nova', transactions: [], accounts: [], chartCategories: [], costCenters: [], accountBalances: {}, totalBalance: 0,
    });
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    expect(wb.worksheets.length).toBe(6);
  });
});
