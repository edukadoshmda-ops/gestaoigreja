/**
 * Gerador do Dashboard Financeiro em Excel (ExcelJS).
 *
 * Por que ExcelJS: as bibliotecas `xlsx` / `xlsx-js-style` NÃO gravam congelamento
 * de painéis (freeze panes) no arquivo e perdem estilos com facilidade. O ExcelJS grava
 * de verdade: painéis congelados, cores, bordas, formatação condicional, barras de dados,
 * filtros automáticos e fórmulas.
 *
 * Este módulo é puro (não depende de React) para poder ser testado em Node.
 */
import * as ExcelJSNS from 'exceljs';
import type {
  FinancialTransactionExtended,
  BankAccount,
  ChartCategory,
  CostCenter,
} from '@/services/financial-management.service';

export interface AccountBalanceInfo {
  current: number;
  income: number;
  expense: number;
}

export interface FinancialDashboardInput {
  churchName: string;
  transactions: FinancialTransactionExtended[];
  accounts: BankAccount[];
  chartCategories: ChartCategory[];
  costCenters: CostCenter[];
  accountBalances: Record<string, AccountBalanceInfo>;
  totalBalance: number;
  issuedAt?: Date;
}

// ============================================================================
// PALETA
// ============================================================================
const C = {
  navy: '0F172A',
  navy2: '1E293B',
  slate700: '334155',
  slate500: '64748B',
  slate300: 'CBD5E1',
  slate200: 'E2E8F0',
  slate100: 'F1F5F9',
  slate50: 'F8FAFC',
  white: 'FFFFFF',
  gold: 'F59E0B',
  blue: '1D4ED8',
  blueLight: 'DBEAFE',
  green: '047857',
  greenMid: '10B981',
  greenLight: 'D1FAE5',
  red: 'B91C1C',
  redMid: 'EF4444',
  redLight: 'FEE2E2',
  purple: '6D28D9',
  purpleLight: 'EDE9FE',
  amber: 'B45309',
  amberLight: 'FEF3C7',
  teal: '0F766E',
  tealLight: 'CCFBF1',
};

const FONT = 'Calibri';
const BRL = '"R$" #,##0.00;[Red]-"R$" #,##0.00;"-"';
const PCT = '0.0%;[Red]-0.0%;"-"';
const DATE = 'dd/mm/yyyy';
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getExcelJS(): any {
  const ns: any = ExcelJSNS;
  if (ns?.Workbook) return ns;
  if (ns?.default?.Workbook) return ns.default;
  return ns;
}

// ============================================================================
// HELPERS DE ESTILO
// ============================================================================
interface StyleOpts {
  bg?: string;
  color?: string;
  size?: number;
  bold?: boolean;
  italic?: boolean;
  h?: 'left' | 'center' | 'right';
  v?: 'top' | 'middle' | 'bottom';
  wrap?: boolean;
  indent?: number;
  numFmt?: string;
  border?: 'thin' | 'none' | 'total' | 'card';
}

const argb = (hex: string) => 'FF' + hex;
const thin = (hex = C.slate200) => ({ style: 'thin', color: { argb: argb(hex) } });

function applyStyle(cell: any, o: StyleOpts) {
  if (o.bg) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(o.bg) } };
  cell.font = {
    name: FONT,
    size: o.size ?? 10,
    bold: !!o.bold,
    italic: !!o.italic,
    color: { argb: argb(o.color ?? C.navy2) },
  };
  cell.alignment = {
    horizontal: o.h ?? 'left',
    vertical: o.v ?? 'middle',
    wrapText: !!o.wrap,
    indent: o.indent ?? (o.h === 'left' || !o.h ? 1 : 0),
  };
  if (o.numFmt) cell.numFmt = o.numFmt;
  if (o.border === 'thin') {
    cell.border = { top: thin(), bottom: thin(), left: thin(), right: thin() };
  } else if (o.border === 'total') {
    cell.border = {
      top: { style: 'medium', color: { argb: argb(C.navy2) } },
      bottom: { style: 'double', color: { argb: argb(C.navy2) } },
      left: thin(),
      right: thin(),
    };
  }
}

/** Estiliza um intervalo, grava valor na célula mestre e mescla (se > 1 célula). */
function block(ws: any, r1: number, c1: number, r2: number, c2: number, value: any, o: StyleOpts) {
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) applyStyle(ws.getCell(r, c), o);
  }
  if (r1 !== r2 || c1 !== c2) ws.mergeCells(r1, c1, r2, c2);
  const master = ws.getCell(r1, c1);
  if (value !== undefined) master.value = value;
  return master;
}

function cell(ws: any, r: number, c: number, value: any, o: StyleOpts) {
  const x = ws.getCell(r, c);
  x.value = value;
  applyStyle(x, o);
  return x;
}

/** Faixa de título padrão (linhas 1–3) das abas. */
function banner(ws: any, lastCol: number, title: string, subtitle: string, firstCol = 1) {
  ws.getRow(1).height = 34;
  ws.getRow(2).height = 20;
  ws.getRow(3).height = 5;
  block(ws, 1, firstCol, 1, lastCol, title, { bg: C.navy, color: C.white, size: 16, bold: true });
  block(ws, 2, firstCol, 2, lastCol, subtitle, { bg: C.navy2, color: C.slate300, size: 9.5, italic: true });
  block(ws, 3, firstCol, 3, lastCol, '', { bg: C.gold });
}

function headerRow(ws: any, row: number, startCol: number, labels: string[], bg = C.navy2) {
  ws.getRow(row).height = 30;
  labels.forEach((label, i) =>
    cell(ws, row, startCol + i, label, { bg, color: C.white, bold: true, size: 9.5, h: 'center', wrap: true, border: 'thin' })
  );
}

function dataBar(ws: any, ref: string, hex: string) {
  ws.addConditionalFormatting({
    ref,
    rules: [
      {
        type: 'dataBar',
        priority: 1,
        gradient: true,
        minLength: 0,
        maxLength: 100,
        cfvo: [{ type: 'num', value: 0 }, { type: 'max' }],
        color: { argb: argb(hex) },
      } as any,
    ],
  });
}

function posNegFont(ws: any, ref: string) {
  ws.addConditionalFormatting({
    ref,
    rules: [
      { type: 'cellIs', operator: 'greaterThan', formulae: ['0'], priority: 2, style: { font: { color: { argb: argb(C.green) }, bold: true } } } as any,
      { type: 'cellIs', operator: 'lessThan', formulae: ['0'], priority: 3, style: { font: { color: { argb: argb(C.red) }, bold: true } } } as any,
    ],
  });
}

function setupPrint(ws: any, landscape = true) {
  ws.pageSetup = {
    paperSize: 9,
    orientation: landscape ? 'landscape' : 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
  };
  ws.headerFooter = { oddFooter: '&L&8Gestão Financeira Eclesiástica&R&8Página &P de &N' };
}

const toDate = (iso?: string): Date | string => {
  if (!iso) return '-';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
};

const num = (v: any) => Number(v) || 0;

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  corrente: 'Conta Corrente',
  poupanca: 'Poupança',
  aplicacao: 'Aplicação',
  cartao_credito: 'Cartão de Crédito',
  caixa: 'Caixa Físico',
};

// ============================================================================
// GERADOR
// ============================================================================
export async function buildFinancialDashboardWorkbook(input: FinancialDashboardInput) {
  const ExcelJS = getExcelJS();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Gestão de Igreja';
  wb.created = input.issuedAt ?? new Date();
  wb.calcProperties = { fullCalcOnLoad: true };

  const issued = input.issuedAt ?? new Date();
  const issuedStr = `${String(issued.getDate()).padStart(2, '0')}/${String(issued.getMonth() + 1).padStart(2, '0')}/${issued.getFullYear()} às ${String(issued.getHours()).padStart(2, '0')}:${String(issued.getMinutes()).padStart(2, '0')}`;
  const church = (input.churchName || 'Igreja').toUpperCase();

  const tx = input.transactions || [];
  const accounts = input.accounts || [];
  const categories = input.chartCategories || [];
  const realized = tx.filter((t) => t.status !== 'planejado');
  const planned = tx.filter((t) => t.status === 'planejado');

  // Ano de referência: ano atual se houver movimento, senão o ano mais recente com dados
  const currentYear = issued.getFullYear();
  const years = realized.map((t) => Number((t.date || '').slice(0, 4))).filter((y) => y > 1900);
  const year = years.includes(currentYear) || years.length === 0 ? currentYear : Math.max(...years);

  const totalIncome = realized.filter((t) => t.type === 'entrada').reduce((s, t) => s + num(t.amount), 0);
  const totalExpense = realized.filter((t) => t.type === 'saida').reduce((s, t) => s + num(t.amount), 0);
  const result = totalIncome - totalExpense;
  const plannedIncome = planned.filter((t) => t.type === 'entrada').reduce((s, t) => s + num(t.amount), 0);
  const plannedExpense = planned.filter((t) => t.type === 'saida').reduce((s, t) => s + num(t.amount), 0);
  const commitment = totalIncome > 0 ? totalExpense / totalIncome : 0;
  const pendingReconcile = realized.filter((t) => t.type !== 'transferencia' && !t.is_reconciled).length;

  // Mensal do ano de referência
  const monthly = MONTHS.map((_, m) => {
    const prefix = `${year}-${String(m + 1).padStart(2, '0')}`;
    const list = realized.filter((t) => (t.date || '').startsWith(prefix));
    const inc = list.filter((t) => t.type === 'entrada').reduce((s, t) => s + num(t.amount), 0);
    const exp = list.filter((t) => t.type === 'saida').reduce((s, t) => s + num(t.amount), 0);
    return { inc, exp };
  });
  const yearInc = monthly.reduce((s, m) => s + m.inc, 0);
  const yearExp = monthly.reduce((s, m) => s + m.exp, 0);
  const opening = input.totalBalance - (yearInc - yearExp);

  // Categorias
  const catIndex = new Map(categories.map((c) => [c.name, c]));
  const byCategory = (type: 'entrada' | 'saida') => {
    const map = new Map<string, { name: string; total: number; count: number }>();
    realized
      .filter((t) => t.type === type)
      .forEach((t) => {
        const key = t.category || 'Sem categoria';
        const cur = map.get(key) || { name: key, total: 0, count: 0 };
        cur.total += num(t.amount);
        cur.count += 1;
        map.set(key, cur);
      });
    return [...map.values()].sort((a, b) => b.total - a.total);
  };
  const accSum = (k: 'income' | 'expense') =>
    accounts.reduce((s, a) => s + num((input.accountBalances[a.id] || { income: 0, expense: 0 })[k]), 0);
  const expenseCats = byCategory('saida');
  const incomeCats = byCategory('entrada');

  // ==========================================================================
  // ABA 1 — PAINEL
  // ==========================================================================
  const wsP = wb.addWorksheet('Painel', {
    properties: { tabColor: { argb: argb(C.gold) } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 3, topLeftCell: 'A4', activeCell: 'B5', showGridLines: false, zoomScale: 90 }],
  });
  wsP.columns = [{ width: 2 }, ...Array.from({ length: 12 }, () => ({ width: 17 })), { width: 2 }];
  banner(
    wsP,
    14,
    `${church}  •  PAINEL EXECUTIVO DE GESTÃO FINANCEIRA`,
    `Emitido em ${issuedStr}   •   Exercício de referência: ${year}   •   ${realized.length} lançamentos realizados   •   ${planned.length} previstos`
  );
  wsP.getRow(4).height = 10;

  const kpi = (row: number, col: number, label: string, value: number, foot: string, dark: string, light: string, fmt = BRL) => {
    const edge = { style: 'thick', color: { argb: argb(C.white) } };
    block(wsP, row, col, row, col + 2, label, { bg: dark, color: C.white, bold: true, size: 9.5 });
    block(wsP, row + 1, col, row + 1, col + 2, value, { bg: light, color: dark, bold: true, size: 20, numFmt: fmt });
    block(wsP, row + 2, col, row + 2, col + 2, foot, { bg: light, color: C.slate700, italic: true, size: 9 });
    for (let r = row; r <= row + 2; r++) {
      wsP.getCell(r, col).border = { ...(wsP.getCell(r, col).border || {}), left: edge };
      wsP.getCell(r, col + 2).border = { ...(wsP.getCell(r, col + 2).border || {}), right: edge };
    }
    wsP.getRow(row).height = 22;
    wsP.getRow(row + 1).height = 38;
    wsP.getRow(row + 2).height = 20;
  };

  kpi(5, 2, '🏦  SALDO CONSOLIDADO', input.totalBalance, `${accounts.length} conta(s) bancária(s) / caixa`, C.blue, C.blueLight);
  kpi(5, 5, '📈  TOTAL DE ENTRADAS', totalIncome, `${realized.filter((t) => t.type === 'entrada').length} receitas realizadas`, C.green, C.greenLight);
  kpi(5, 8, '📉  TOTAL DE SAÍDAS', totalExpense, `${realized.filter((t) => t.type === 'saida').length} despesas realizadas`, C.red, C.redLight);
  kpi(5, 11, '⚖️  RESULTADO LÍQUIDO', result, result >= 0 ? 'Superávit no período' : 'Déficit no período', result >= 0 ? C.teal : C.red, result >= 0 ? C.tealLight : C.redLight);
  wsP.getRow(8).height = 8;
  kpi(9, 2, '🔮  ENTRADAS PREVISTAS', plannedIncome, `${planned.filter((t) => t.type === 'entrada').length} lançamentos planejados`, C.purple, C.purpleLight);
  kpi(9, 5, '🗓️  SAÍDAS PREVISTAS', plannedExpense, `${planned.filter((t) => t.type === 'saida').length} compromissos futuros`, C.amber, C.amberLight);
  kpi(9, 8, '📊  COMPROMETIMENTO DA RECEITA', commitment, commitment <= 0.8 ? 'Saudável (até 80%)' : commitment <= 1 ? 'Atenção (80% a 100%)' : 'Crítico (acima de 100%)', commitment <= 0.8 ? C.green : commitment <= 1 ? C.amber : C.red, commitment <= 0.8 ? C.greenLight : commitment <= 1 ? C.amberLight : C.redLight, '0.0%');
  kpi(9, 11, '✅  PENDENTES DE CONCILIAÇÃO', pendingReconcile, pendingReconcile === 0 ? 'Tudo conciliado' : 'Lançamentos a conferir no extrato', pendingReconcile === 0 ? C.green : C.amber, pendingReconcile === 0 ? C.greenLight : C.amberLight, '0');
  wsP.getRow(12).height = 14;

  // --- Evolução mensal (B..G) e Top despesas (I..M)
  block(wsP, 13, 2, 13, 7, `📅  EVOLUÇÃO MENSAL ${year}`, { bg: C.navy, color: C.white, bold: true, size: 11 });
  block(wsP, 13, 9, 13, 13, '🔻  MAIORES DESPESAS POR CATEGORIA', { bg: C.red, color: C.white, bold: true, size: 11 });
  wsP.getRow(13).height = 24;
  headerRow(wsP, 14, 2, ['MÊS', 'ENTRADAS', 'SAÍDAS', 'RESULTADO', 'MARGEM', 'SALDO ACUMULADO']);
  block(wsP, 14, 9, 14, 10, 'CATEGORIA', { bg: C.navy2, color: C.white, bold: true, size: 9.5, h: 'center', border: 'thin' });
  headerRow(wsP, 14, 11, ['VALOR', 'PARTICIPAÇÃO', 'LANÇAMENTOS']);

  let running = opening;
  monthly.forEach((m, i) => {
    const r = 15 + i;
    const bg = i % 2 === 0 ? C.white : C.slate50;
    const net = m.inc - m.exp;
    running += net;
    wsP.getRow(r).height = 19;
    cell(wsP, r, 2, MONTHS[i], { bg, bold: true, border: 'thin' });
    cell(wsP, r, 3, m.inc, { bg, h: 'right', numFmt: BRL, border: 'thin', color: C.green });
    cell(wsP, r, 4, m.exp, { bg, h: 'right', numFmt: BRL, border: 'thin', color: C.red });
    cell(wsP, r, 5, { formula: `C${r}-D${r}`, result: net }, { bg, h: 'right', numFmt: BRL, border: 'thin', bold: true });
    cell(wsP, r, 6, { formula: `IF(C${r}=0,0,E${r}/C${r})`, result: m.inc ? net / m.inc : 0 }, { bg, h: 'center', numFmt: PCT, border: 'thin' });
    cell(wsP, r, 7, running, { bg, h: 'right', numFmt: BRL, border: 'thin', bold: true });
  });
  const tot = (r: number, c: number, v: any, fmt?: string, h: StyleOpts['h'] = 'right') =>
    cell(wsP, r, c, v, { bg: C.slate200, bold: true, h, numFmt: fmt, border: 'total', color: C.navy });
  tot(27, 2, 'TOTAL DO ANO', undefined, 'left');
  tot(27, 3, { formula: 'SUM(C15:C26)', result: yearInc }, BRL);
  tot(27, 4, { formula: 'SUM(D15:D26)', result: yearExp }, BRL);
  tot(27, 5, { formula: 'C27-D27', result: yearInc - yearExp }, BRL);
  tot(27, 6, { formula: 'IF(C27=0,0,E27/C27)', result: yearInc ? (yearInc - yearExp) / yearInc : 0 }, PCT, 'center');
  tot(27, 7, running, BRL);
  wsP.getRow(27).height = 22;
  dataBar(wsP, 'C15:C26', C.greenMid);
  dataBar(wsP, 'D15:D26', C.redMid);
  posNegFont(wsP, 'E15:E26');

  const catTable = (startRow: number, list: { name: string; total: number; count: number }[], total: number, barHex: string, rows = 12) => {
    for (let i = 0; i < rows; i++) {
      const r = startRow + i;
      const bg = i % 2 === 0 ? C.white : C.slate50;
      const item = list[i];
      block(wsP, r, 9, r, 10, item ? item.name : '', { bg, border: 'thin', bold: !!item });
      cell(wsP, r, 11, item ? item.total : null, { bg, h: 'right', numFmt: BRL, border: 'thin' });
      cell(wsP, r, 12, item && total ? item.total / total : null, { bg, h: 'center', numFmt: PCT, border: 'thin' });
      cell(wsP, r, 13, item ? item.count : null, { bg, h: 'center', numFmt: '0', border: 'thin' });
    }
    dataBar(wsP, `K${startRow}:K${startRow + rows - 1}`, barHex);
    const tr = startRow + rows;
    block(wsP, tr, 9, tr, 10, 'TOTAL', { bg: C.slate200, bold: true, border: 'total', color: C.navy });
    cell(wsP, tr, 11, total, { bg: C.slate200, bold: true, h: 'right', numFmt: BRL, border: 'total', color: C.navy });
    cell(wsP, tr, 12, total ? 1 : 0, { bg: C.slate200, bold: true, h: 'center', numFmt: PCT, border: 'total', color: C.navy });
    cell(wsP, tr, 13, list.reduce((s, x) => s + x.count, 0), { bg: C.slate200, bold: true, h: 'center', numFmt: '0', border: 'total', color: C.navy });
  };
  catTable(15, expenseCats, totalExpense, C.redMid);

  // --- Saldos por conta (B..G) e Top receitas (I..M)
  wsP.getRow(28).height = 14;
  block(wsP, 29, 2, 29, 7, '🏦  SALDOS POR CONTA BANCÁRIA', { bg: C.blue, color: C.white, bold: true, size: 11 });
  block(wsP, 29, 9, 29, 13, '🔺  MAIORES RECEITAS POR CATEGORIA', { bg: C.green, color: C.white, bold: true, size: 11 });
  wsP.getRow(29).height = 24;
  block(wsP, 30, 2, 30, 3, 'CONTA', { bg: C.navy2, color: C.white, bold: true, size: 9.5, h: 'center', border: 'thin' });
  headerRow(wsP, 30, 4, ['BANCO', 'ENTRADAS', 'SAÍDAS', 'SALDO ATUAL']);
  block(wsP, 30, 9, 30, 10, 'CATEGORIA', { bg: C.navy2, color: C.white, bold: true, size: 9.5, h: 'center', border: 'thin' });
  headerRow(wsP, 30, 11, ['VALOR', 'PARTICIPAÇÃO', 'LANÇAMENTOS']);

  const accRows = Math.max(accounts.length, 1);
  const recRows = Math.max(Math.min(incomeCats.length, 12), accRows);
  for (let i = 0; i < accRows; i++) {
    const r = 31 + i;
    const bg = i % 2 === 0 ? C.white : C.slate50;
    const acc = accounts[i];
    const bal = acc ? input.accountBalances[acc.id] || { current: num(acc.initial_balance), income: 0, expense: 0 } : null;
    wsP.getRow(r).height = 19;
    block(wsP, r, 2, r, 3, acc ? acc.name : 'Nenhuma conta cadastrada', { bg, bold: true, border: 'thin', italic: !acc });
    cell(wsP, r, 4, acc ? acc.bank_name || '-' : '', { bg, border: 'thin', h: 'center' });
    cell(wsP, r, 5, bal ? num(bal.income) : null, { bg, h: 'right', numFmt: BRL, border: 'thin', color: C.green });
    cell(wsP, r, 6, bal ? num(bal.expense) : null, { bg, h: 'right', numFmt: BRL, border: 'thin', color: C.red });
    cell(wsP, r, 7, bal ? num(bal.current) : null, { bg, h: 'right', numFmt: BRL, border: 'thin', bold: true });
  }
  const accTot = 31 + accRows;
  block(wsP, accTot, 2, accTot, 4, 'SALDO CONSOLIDADO', { bg: C.slate200, bold: true, border: 'total', color: C.navy });
  cell(wsP, accTot, 5, { formula: `SUM(E31:E${accTot - 1})`, result: accSum('income') }, { bg: C.slate200, bold: true, h: 'right', numFmt: BRL, border: 'total', color: C.navy });
  cell(wsP, accTot, 6, { formula: `SUM(F31:F${accTot - 1})`, result: accSum('expense') }, { bg: C.slate200, bold: true, h: 'right', numFmt: BRL, border: 'total', color: C.navy });
  cell(wsP, accTot, 7, input.totalBalance, { bg: C.slate200, bold: true, h: 'right', numFmt: BRL, border: 'total', color: C.navy });
  posNegFont(wsP, `G31:G${accTot - 1}`);
  catTable(31, incomeCats, totalIncome, C.greenMid, recRows);

  const noteRow = Math.max(accTot, 31 + recRows) + 2;
  block(wsP, noteRow, 2, noteRow, 13, `Saldo acumulado parte do saldo de abertura estimado de ${opening.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em 01/01/${year}. Valores realizados (não inclui previstos). Transferências entre contas não entram em entradas/saídas.`, { color: C.slate500, italic: true, size: 8.5, wrap: true });
  wsP.getRow(noteRow).height = 26;
  setupPrint(wsP);

  // ==========================================================================
  // ABA 2 — EXTRATO
  // ==========================================================================
  const wsT = wb.addWorksheet('Extrato', {
    properties: { tabColor: { argb: argb(C.navy2) } },
    views: [{ state: 'frozen', xSplit: 2, ySplit: 5, topLeftCell: 'C6', activeCell: 'C6', showGridLines: false, zoomScale: 90 }],
  });
  wsT.columns = [12, 40, 15, 26, 20, 18, 22, 20, 16, 13, 13, 17, 17, 17].map((width) => ({ width }));
  banner(wsT, 14, `${church}  •  EXTRATO GERAL DE MOVIMENTAÇÕES`, `Emitido em ${issuedStr}   •   ${tx.length} lançamentos   •   Use os filtros do cabeçalho — os totais acima se ajustam automaticamente`);
  const sorted = [...tx].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const firstData = 6;
  const lastData = Math.max(firstData, firstData + sorted.length - 1);
  wsT.getRow(4).height = 24;
  block(wsT, 4, 1, 4, 11, 'TOTAIS DOS LANÇAMENTOS VISÍVEIS (respeitam o filtro)  ►', { bg: C.slate100, bold: true, color: C.navy, h: 'right', border: 'thin' });
  const sumIf = (type: string) => sorted.filter((t) => t.type === type).reduce((s, t) => s + num(t.amount), 0);
  cell(wsT, 4, 12, { formula: `SUBTOTAL(109,L${firstData}:L${lastData})`, result: sumIf('entrada') }, { bg: C.greenLight, bold: true, color: C.green, h: 'right', numFmt: BRL, border: 'thin' });
  cell(wsT, 4, 13, { formula: `SUBTOTAL(109,M${firstData}:M${lastData})`, result: sumIf('saida') }, { bg: C.redLight, bold: true, color: C.red, h: 'right', numFmt: BRL, border: 'thin' });
  cell(wsT, 4, 14, { formula: `SUBTOTAL(109,N${firstData}:N${lastData})`, result: sumIf('transferencia') }, { bg: C.blueLight, bold: true, color: C.blue, h: 'right', numFmt: BRL, border: 'thin' });
  headerRow(wsT, 5, 1, ['DATA', 'DESCRIÇÃO / HISTÓRICO', 'TIPO', 'CATEGORIA', 'CENTRO DE CUSTO', 'ÁREA ADM.', 'CONTA', 'CONTA DESTINO', 'FORMA PGTO', 'STATUS', 'CONCILIADO', 'ENTRADA', 'SAÍDA', 'TRANSFERÊNCIA']);
  wsT.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: 14 } };

  if (sorted.length === 0) {
    block(wsT, firstData, 1, firstData, 14, 'Nenhum lançamento registrado.', { italic: true, color: C.slate500, h: 'center', border: 'thin' });
  }
  sorted.forEach((t, i) => {
    const r = firstData + i;
    const bg = i % 2 === 0 ? C.white : C.slate50;
    const isIn = t.type === 'entrada';
    const isOut = t.type === 'saida';
    const isPlanned = t.status === 'planejado';
    const base: StyleOpts = { bg, border: 'thin', italic: isPlanned, color: isPlanned ? C.slate500 : C.navy2 };
    wsT.getRow(r).height = 18;
    cell(wsT, r, 1, toDate(t.date), { ...base, h: 'center', numFmt: DATE });
    cell(wsT, r, 2, t.description || 'Lançamento financeiro', base);
    cell(wsT, r, 3, isIn ? 'ENTRADA' : isOut ? 'SAÍDA' : 'TRANSFERÊNCIA', {
      bg: isIn ? C.greenLight : isOut ? C.redLight : C.blueLight,
      color: isIn ? C.green : isOut ? C.red : C.blue,
      bold: true, size: 9, h: 'center', border: 'thin',
    });
    cell(wsT, r, 4, t.category || '-', { ...base, bold: !isPlanned });
    cell(wsT, r, 5, t.cost_center || '-', base);
    cell(wsT, r, 6, t.admin_area || '-', base);
    cell(wsT, r, 7, t.account_name || '-', base);
    cell(wsT, r, 8, t.destination_account_name || '-', { ...base, h: 'center' });
    cell(wsT, r, 9, t.payment_method || '-', { ...base, h: 'center' });
    cell(wsT, r, 10, isPlanned ? 'PREVISTO' : 'REALIZADO', {
      bg: isPlanned ? C.amberLight : C.slate100, color: isPlanned ? C.amber : C.slate700, bold: true, size: 9, h: 'center', border: 'thin',
    });
    cell(wsT, r, 11, t.is_reconciled ? 'SIM' : 'NÃO', {
      bg: t.is_reconciled ? C.greenLight : C.white, color: t.is_reconciled ? C.green : C.slate500, bold: !!t.is_reconciled, size: 9, h: 'center', border: 'thin',
    });
    cell(wsT, r, 12, isIn ? num(t.amount) : null, { ...base, h: 'right', numFmt: BRL, color: C.green, bold: true });
    cell(wsT, r, 13, isOut ? num(t.amount) : null, { ...base, h: 'right', numFmt: BRL, color: C.red, bold: true });
    cell(wsT, r, 14, !isIn && !isOut ? num(t.amount) : null, { ...base, h: 'right', numFmt: BRL, color: C.blue, bold: true });
  });
  setupPrint(wsT);
  wsT.pageSetup.printTitlesRow = '5:5';

  // ==========================================================================
  // ABA 3 — CONTAS BANCÁRIAS
  // ==========================================================================
  const wsA = wb.addWorksheet('Contas Bancárias', {
    properties: { tabColor: { argb: argb(C.blue) } },
    views: [{ state: 'frozen', xSplit: 1, ySplit: 4, topLeftCell: 'B5', activeCell: 'B5', showGridLines: false, zoomScale: 90 }],
  });
  wsA.columns = [32, 22, 18, 18, 17, 17, 17, 19, 14, 16].map((width) => ({ width }));
  banner(wsA, 10, `${church}  •  POSIÇÃO DAS CONTAS BANCÁRIAS E CAIXA`, `Posição em ${issuedStr}   •   Saldo consolidado: ${input.totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
  headerRow(wsA, 4, 1, ['CONTA', 'BANCO / INSTITUIÇÃO', 'TIPO', 'AGÊNCIA / CONTA', 'SALDO INICIAL', 'ENTRADAS', 'SAÍDAS', 'SALDO ATUAL', 'PARTICIPAÇÃO', 'SITUAÇÃO']);
  wsA.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: 10 } };
  accounts.forEach((acc, i) => {
    const r = 5 + i;
    const bg = i % 2 === 0 ? C.white : C.slate50;
    const bal = input.accountBalances[acc.id] || { current: num(acc.initial_balance), income: 0, expense: 0 };
    const ok = num(bal.current) >= 0;
    wsA.getRow(r).height = 20;
    cell(wsA, r, 1, acc.name, { bg, bold: true, border: 'thin' });
    cell(wsA, r, 2, acc.bank_name || '-', { bg, border: 'thin' });
    cell(wsA, r, 3, ACCOUNT_TYPE_LABEL[acc.account_type] || acc.account_type || '-', { bg, border: 'thin', h: 'center' });
    cell(wsA, r, 4, acc.account_number || '-', { bg, border: 'thin', h: 'center' });
    cell(wsA, r, 5, num(acc.initial_balance), { bg, border: 'thin', h: 'right', numFmt: BRL });
    cell(wsA, r, 6, num(bal.income), { bg, border: 'thin', h: 'right', numFmt: BRL, color: C.green });
    cell(wsA, r, 7, num(bal.expense), { bg, border: 'thin', h: 'right', numFmt: BRL, color: C.red });
    cell(wsA, r, 8, num(bal.current), { bg, border: 'thin', h: 'right', numFmt: BRL, bold: true });
    cell(wsA, r, 9, input.totalBalance ? num(bal.current) / input.totalBalance : 0, { bg, border: 'thin', h: 'center', numFmt: PCT });
    cell(wsA, r, 10, acc.is_active === false ? 'INATIVA' : ok ? 'REGULAR' : 'DEVEDORA', {
      bg: acc.is_active === false ? C.slate100 : ok ? C.greenLight : C.redLight,
      color: acc.is_active === false ? C.slate500 : ok ? C.green : C.red,
      bold: true, size: 9, h: 'center', border: 'thin',
    });
  });
  const aLast = 4 + Math.max(accounts.length, 1);
  if (accounts.length === 0) block(wsA, 5, 1, 5, 10, 'Nenhuma conta cadastrada.', { italic: true, color: C.slate500, h: 'center', border: 'thin' });
  const aTot = aLast + 1;
  cell(wsA, aTot, 1, 'TOTAL CONSOLIDADO', { bg: C.slate200, bold: true, border: 'total', color: C.navy });
  [2, 3, 4].forEach((c) => cell(wsA, aTot, c, '', { bg: C.slate200, border: 'total' }));
  ['E', 'F', 'G'].forEach((col, k) =>
    cell(wsA, aTot, 5 + k, { formula: `SUM(${col}5:${col}${aLast})`, result: k === 0 ? accounts.reduce((s, a) => s + num(a.initial_balance), 0) : accSum(k === 1 ? 'income' : 'expense') }, { bg: C.slate200, bold: true, h: 'right', numFmt: BRL, border: 'total', color: C.navy })
  );
  cell(wsA, aTot, 8, input.totalBalance, { bg: C.slate200, bold: true, h: 'right', numFmt: BRL, border: 'total', color: C.navy });
  cell(wsA, aTot, 9, 1, { bg: C.slate200, bold: true, h: 'center', numFmt: PCT, border: 'total', color: C.navy });
  cell(wsA, aTot, 10, '', { bg: C.slate200, border: 'total' });
  wsA.getRow(aTot).height = 22;
  dataBar(wsA, `H5:H${aLast}`, C.blue);
  setupPrint(wsA);

  // ==========================================================================
  // ABA 4 — DRE MENSAL
  // ==========================================================================
  const wsD = wb.addWorksheet('DRE Mensal', {
    properties: { tabColor: { argb: argb(C.green) } },
    views: [{ state: 'frozen', xSplit: 2, ySplit: 4, topLeftCell: 'C5', activeCell: 'C5', showGridLines: false, zoomScale: 85 }],
  });
  wsD.columns = [{ width: 11 }, { width: 36 }, ...Array.from({ length: 12 }, () => ({ width: 14 })), { width: 17 }, { width: 11 }];
  banner(wsD, 16, `${church}  •  DRE — DEMONSTRAÇÃO DO RESULTADO MÊS A MÊS (${year})`, `Regime de caixa (valores realizados)   •   Emitido em ${issuedStr}`);
  headerRow(wsD, 4, 1, ['CÓDIGO', 'CONTA', ...MONTHS_SHORT.map((m) => m.toUpperCase()), 'TOTAL', '% RECEITA']);

  const monthsOf = (filter: (t: FinancialTransactionExtended) => boolean) =>
    MONTHS.map((_, m) => {
      const prefix = `${year}-${String(m + 1).padStart(2, '0')}`;
      return realized.filter((t) => (t.date || '').startsWith(prefix) && filter(t)).reduce((s, t) => s + num(t.amount), 0);
    });

  let dr = 5;
  const writeDreLine = (code: string, label: string, values: number[], o: StyleOpts, totalRevenue: number) => {
    const total = values.reduce((s, v) => s + v, 0);
    wsD.getRow(dr).height = o.bold ? 21 : 18;
    cell(wsD, dr, 1, code, { ...o, h: 'center' });
    cell(wsD, dr, 2, label, o);
    values.forEach((v, m) => cell(wsD, dr, 3 + m, v, { ...o, h: 'right', numFmt: BRL }));
    cell(wsD, dr, 15, total, { ...o, h: 'right', numFmt: BRL, bold: true });
    cell(wsD, dr, 16, totalRevenue ? total / totalRevenue : 0, { ...o, h: 'center', numFmt: PCT });
    dr++;
  };

  const section = (type: 'entrada' | 'saida') => {
    const catType = type === 'entrada' ? 'receita' : 'despesa';
    const names = new Set<string>();
    categories.filter((c) => c.type === catType).forEach((c) => names.add(c.name));
    realized.filter((t) => t.type === type).forEach((t) => names.add(t.category || 'Sem categoria'));
    const groups = new Map<string, { code: string; name: string }[]>();
    [...names].forEach((name) => {
      const meta = catIndex.get(name);
      const group = meta?.group || (type === 'entrada' ? 'Outras Receitas' : 'Outras Despesas');
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push({ code: meta?.code || '', name });
    });
    return [...groups.entries()].map(([group, items]) => ({
      group,
      items: items.sort((a, b) => a.code.localeCompare(b.code, 'pt-BR', { numeric: true }) || a.name.localeCompare(b.name)),
    }));
  };

  const revenueTotal = yearInc;
  const writeSection = (type: 'entrada' | 'saida', title: string, dark: string, light: string) => {
    const vals = monthsOf((t) => t.type === type);
    block(wsD, dr, 1, dr, 16, title, { bg: dark, color: C.white, bold: true, size: 11 });
    wsD.getRow(dr).height = 22;
    dr++;
    section(type).forEach(({ group, items }) => {
      const gVals = monthsOf((t) => t.type === type && items.some((i) => i.name === (t.category || 'Sem categoria')));
      writeDreLine('', group.toUpperCase(), gVals, { bg: light, bold: true, color: dark, border: 'thin' }, revenueTotal);
      items.forEach((item, k) => {
        const v = monthsOf((t) => t.type === type && (t.category || 'Sem categoria') === item.name);
        writeDreLine(item.code, `    ${item.name}`, v, { bg: k % 2 === 0 ? C.white : C.slate50, border: 'thin' }, revenueTotal);
      });
    });
    writeDreLine('', `TOTAL DE ${type === 'entrada' ? 'RECEITAS' : 'DESPESAS'}`, vals, { bg: C.slate200, bold: true, color: C.navy, border: 'total' }, revenueTotal);
    return vals;
  };
  const recVals = writeSection('entrada', '📈  RECEITAS OPERACIONAIS E ECLESIÁSTICAS', C.green, C.greenLight);
  wsD.getRow(dr).height = 8;
  dr++;
  const despVals = writeSection('saida', '📉  DESPESAS OPERACIONAIS E MINISTERIAIS', C.red, C.redLight);
  wsD.getRow(dr).height = 8;
  dr++;
  const resRow = dr;
  writeDreLine('', '⚖️  RESULTADO DO EXERCÍCIO (SUPERÁVIT / DÉFICIT)', recVals.map((v, i) => v - despVals[i]), { bg: C.navy, color: C.white, bold: true, size: 11 }, revenueTotal);
  wsD.getRow(resRow).height = 26;
  ws_posNegResult(wsD, resRow);
  setupPrint(wsD);
  wsD.pageSetup.printTitlesRow = '4:4';

  // ==========================================================================
  // ABA 5 — CENTROS DE CUSTO
  // ==========================================================================
  const wsC = wb.addWorksheet('Centros de Custo', {
    properties: { tabColor: { argb: argb(C.purple) } },
    views: [{ state: 'frozen', xSplit: 1, ySplit: 4, topLeftCell: 'B5', activeCell: 'B5', showGridLines: false, zoomScale: 90 }],
  });
  wsC.columns = [34, 19, 19, 19, 16, 14, 30].map((width) => ({ width }));
  banner(wsC, 7, `${church}  •  ANÁLISE POR CENTRO DE CUSTO / DEPARTAMENTO`, `Valores realizados   •   Emitido em ${issuedStr}`);
  headerRow(wsC, 4, 1, ['CENTRO DE CUSTO', 'ENTRADAS', 'SAÍDAS', 'RESULTADO', '% DAS DESPESAS', 'LANÇAMENTOS', 'DESCRIÇÃO']);
  wsC.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: 7 } };
  const ccNames = new Set<string>((input.costCenters || []).map((c) => c.name));
  realized.forEach((t) => ccNames.add(t.cost_center || 'Sem centro de custo'));
  const ccRows = [...ccNames]
    .map((name) => {
      const list = realized.filter((t) => (t.cost_center || 'Sem centro de custo') === name);
      const inc = list.filter((t) => t.type === 'entrada').reduce((s, t) => s + num(t.amount), 0);
      const exp = list.filter((t) => t.type === 'saida').reduce((s, t) => s + num(t.amount), 0);
      return { name, inc, exp, count: list.length, desc: (input.costCenters || []).find((c) => c.name === name)?.description || '' };
    })
    .sort((a, b) => b.exp - a.exp || b.inc - a.inc);
  ccRows.forEach((cc, i) => {
    const r = 5 + i;
    const bg = i % 2 === 0 ? C.white : C.slate50;
    wsC.getRow(r).height = 19;
    cell(wsC, r, 1, cc.name, { bg, bold: true, border: 'thin' });
    cell(wsC, r, 2, cc.inc, { bg, h: 'right', numFmt: BRL, border: 'thin', color: C.green });
    cell(wsC, r, 3, cc.exp, { bg, h: 'right', numFmt: BRL, border: 'thin', color: C.red });
    cell(wsC, r, 4, { formula: `B${r}-C${r}`, result: cc.inc - cc.exp }, { bg, h: 'right', numFmt: BRL, border: 'thin', bold: true });
    cell(wsC, r, 5, totalExpense ? cc.exp / totalExpense : 0, { bg, h: 'center', numFmt: PCT, border: 'thin' });
    cell(wsC, r, 6, cc.count, { bg, h: 'center', numFmt: '0', border: 'thin' });
    cell(wsC, r, 7, cc.desc || '-', { bg, border: 'thin', color: C.slate500, italic: true });
  });
  const cLast = 4 + Math.max(ccRows.length, 1);
  if (ccRows.length === 0) block(wsC, 5, 1, 5, 7, 'Nenhum centro de custo com movimento.', { italic: true, color: C.slate500, h: 'center', border: 'thin' });
  const cTot = cLast + 1;
  cell(wsC, cTot, 1, 'TOTAL', { bg: C.slate200, bold: true, border: 'total', color: C.navy });
  ['B', 'C', 'D'].forEach((col, k) =>
    cell(wsC, cTot, 2 + k, { formula: `SUM(${col}5:${col}${cLast})`, result: ccRows.reduce((s, x) => s + (k === 0 ? x.inc : k === 1 ? x.exp : x.inc - x.exp), 0) }, { bg: C.slate200, bold: true, h: 'right', numFmt: BRL, border: 'total', color: C.navy })
  );
  cell(wsC, cTot, 5, totalExpense ? 1 : 0, { bg: C.slate200, bold: true, h: 'center', numFmt: PCT, border: 'total', color: C.navy });
  cell(wsC, cTot, 6, { formula: `SUM(F5:F${cLast})`, result: ccRows.reduce((s, x) => s + x.count, 0) }, { bg: C.slate200, bold: true, h: 'center', numFmt: '0', border: 'total', color: C.navy });
  cell(wsC, cTot, 7, '', { bg: C.slate200, border: 'total' });
  dataBar(wsC, `B5:B${cLast}`, C.greenMid);
  dataBar(wsC, `C5:C${cLast}`, C.redMid);
  posNegFont(wsC, `D5:D${cLast}`);
  setupPrint(wsC);

  // ==========================================================================
  // ABA 6 — FLUXO PROJETADO
  // ==========================================================================
  const wsF = wb.addWorksheet('Fluxo Projetado', {
    properties: { tabColor: { argb: argb(C.amber) } },
    views: [{ state: 'frozen', xSplit: 1, ySplit: 5, topLeftCell: 'B6', activeCell: 'B6', showGridLines: false, zoomScale: 90 }],
  });
  wsF.columns = [12, 18, 26, 20, 22, 38, 18, 18, 20].map((width) => ({ width }));
  banner(wsF, 9, `${church}  •  FLUXO DE CAIXA PROJETADO (PREVISTOS)`, `Parte do saldo consolidado atual e soma os lançamentos planejados em ordem cronológica   •   Emitido em ${issuedStr}`);
  wsF.getRow(4).height = 24;
  block(wsF, 4, 1, 4, 8, 'SALDO CONSOLIDADO ATUAL (ponto de partida)  ►', { bg: C.slate100, bold: true, color: C.navy, h: 'right', border: 'thin' });
  cell(wsF, 4, 9, input.totalBalance, { bg: C.blueLight, bold: true, color: C.blue, h: 'right', numFmt: BRL, border: 'thin' });
  headerRow(wsF, 5, 1, ['DATA', 'TIPO', 'CATEGORIA', 'CENTRO DE CUSTO', 'CONTA', 'DESCRIÇÃO', 'ENTRADA PREVISTA', 'SAÍDA PREVISTA', 'SALDO PROJETADO']);
  wsF.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: 9 } };
  const plannedSorted = [...planned].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  let proj = input.totalBalance;
  plannedSorted.forEach((t, i) => {
    const r = 6 + i;
    const bg = i % 2 === 0 ? C.white : C.slate50;
    const isIn = t.type === 'entrada';
    const isOut = t.type === 'saida';
    proj += isIn ? num(t.amount) : isOut ? -num(t.amount) : 0;
    wsF.getRow(r).height = 18;
    cell(wsF, r, 1, toDate(t.date), { bg, h: 'center', numFmt: DATE, border: 'thin' });
    cell(wsF, r, 2, isIn ? 'RECEITA PREVISTA' : isOut ? 'DESPESA PREVISTA' : 'TRANSFERÊNCIA', {
      bg: isIn ? C.greenLight : isOut ? C.redLight : C.blueLight, color: isIn ? C.green : isOut ? C.red : C.blue, bold: true, size: 9, h: 'center', border: 'thin',
    });
    cell(wsF, r, 3, t.category || '-', { bg, bold: true, border: 'thin' });
    cell(wsF, r, 4, t.cost_center || '-', { bg, border: 'thin' });
    cell(wsF, r, 5, t.account_name || '-', { bg, border: 'thin' });
    cell(wsF, r, 6, t.description || 'Previsão', { bg, border: 'thin' });
    cell(wsF, r, 7, isIn ? num(t.amount) : null, { bg, h: 'right', numFmt: BRL, border: 'thin', color: C.green, bold: true });
    cell(wsF, r, 8, isOut ? num(t.amount) : null, { bg, h: 'right', numFmt: BRL, border: 'thin', color: C.red, bold: true });
    cell(wsF, r, 9, proj, { bg, h: 'right', numFmt: BRL, border: 'thin', bold: true });
  });
  const fLast = 5 + Math.max(plannedSorted.length, 1);
  if (plannedSorted.length === 0) block(wsF, 6, 1, 6, 9, 'Nenhum lançamento previsto cadastrado.', { italic: true, color: C.slate500, h: 'center', border: 'thin' });
  const fTot = fLast + 1;
  block(wsF, fTot, 1, fTot, 6, 'TOTAIS PREVISTOS / SALDO FINAL PROJETADO', { bg: C.slate200, bold: true, border: 'total', color: C.navy });
  cell(wsF, fTot, 7, plannedIncome, { bg: C.slate200, bold: true, h: 'right', numFmt: BRL, border: 'total', color: C.green });
  cell(wsF, fTot, 8, plannedExpense, { bg: C.slate200, bold: true, h: 'right', numFmt: BRL, border: 'total', color: C.red });
  cell(wsF, fTot, 9, proj, { bg: C.slate200, bold: true, h: 'right', numFmt: BRL, border: 'total', color: C.navy });
  posNegFont(wsF, `I6:I${fLast}`);
  setupPrint(wsF);

  return wb;
}

/** Destaca em verde/vermelho as células de resultado da DRE (linha escura). */
function ws_posNegResult(ws: any, row: number) {
  ws.addConditionalFormatting({
    ref: `C${row}:O${row}`,
    rules: [
      { type: 'cellIs', operator: 'greaterThan', formulae: ['0'], priority: 4, style: { font: { color: { argb: 'FF6EE7B7' }, bold: true } } } as any,
      { type: 'cellIs', operator: 'lessThan', formulae: ['0'], priority: 5, style: { font: { color: { argb: 'FFFCA5A5' }, bold: true } } } as any,
    ],
  });
}

export async function buildFinancialDashboardBuffer(input: FinancialDashboardInput): Promise<ArrayBuffer> {
  const wb = await buildFinancialDashboardWorkbook(input);
  return wb.xlsx.writeBuffer();
}
