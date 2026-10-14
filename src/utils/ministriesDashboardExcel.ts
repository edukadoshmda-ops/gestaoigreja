/**
 * Gerador de Dashboard Executivo de Ministérios, Células & Liderança em Excel (ExcelJS).
 * 
 * Abas:
 * 1. 📊 Painel Geral de Ministérios (KPIs consolidados: Células, Frequência, Líderes, Escolas, Oração)
 * 2. 🏘️ Células & Grupos Familiares (Líderes, anfitriões, dias, membros, endereços, participações)
 * 3. 👥 Todos os Ministérios & Departamentos (Louvor, Kids, Jovens, Mulheres, Homens, Ação Social)
 * 4. 👶 Ministério Infantil (Kids) & Jovens (Foco nas faixas etárias e liderança)
 * 5. 📖 Escolas Bíblicas (EBD) & Discipulado (Turmas, alunos e progresso)
 * 6. 🙏 Intercessão & Pedidos de Oração (Categorias, status, acolhimento)
 */
import * as ExcelJSNS from 'exceljs';
import type { Ministry, Member, CellReport } from '@/types';
import type { School, SchoolStudent } from '@/services/schools.service';
import type { PrayerRequest } from '@/services/prayerRequests.service';
import { parseMinistryReport } from '@/utils/ministriesReportHelper';

function getExcelJS(): any {
  const ns: any = ExcelJSNS;
  if (ns?.Workbook) return ns;
  if (ns?.default?.Workbook) return ns.default;
  return ns;
}

export interface MinistriesDashboardInput {
  churchName: string;
  ministries: any[];
  cells: any[];
  cellReports?: any[];
  members: Member[];
  schools?: School[];
  schoolStudents?: SchoolStudent[];
  discipleships?: any[];
  prayerRequests?: PrayerRequest[];
  issuedAt?: Date;
}

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
  pink: 'BE185D',
  pinkLight: 'FCE7F3',
  amber: 'B45309',
  amberLight: 'FEF3C7',
  teal: '0F766E',
  tealLight: 'CCFBF1',
};

const FONT = 'Calibri';
const PCT = '0.0%;[Red]-0.0%;"-"';
const DATE = 'dd/mm/yyyy';

const argb = (hex: string) => 'FF' + hex;
const thin = (hex = C.slate200) => ({ style: 'thin', color: { argb: argb(hex) } });

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
  border?: 'thin' | 'none' | 'total';
}

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

function setupPrint(ws: any, landscape = true) {
  ws.pageSetup = {
    paperSize: 9,
    orientation: landscape ? 'landscape' : 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
  };
  ws.headerFooter = { oddFooter: '&L&8Gestão de Ministérios & Células&R&8Página &P de &N' };
}

const toDate = (iso?: string): Date | string => {
  if (!iso) return '-';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
};

const num = (v: any) => Number(v) || 0;

export async function buildMinistriesDashboardWorkbook(input: MinistriesDashboardInput) {
  const ExcelJS = getExcelJS();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Gestão de Igreja';
  wb.created = input.issuedAt ?? new Date();
  wb.calcProperties = { fullCalcOnLoad: true };

  const issued = input.issuedAt ?? new Date();
  const issuedStr = `${String(issued.getDate()).padStart(2, '0')}/${String(issued.getMonth() + 1).padStart(2, '0')}/${issued.getFullYear()} às ${String(issued.getHours()).padStart(2, '0')}:${String(issued.getMinutes()).padStart(2, '0')}`;
  const church = (input.churchName || 'Igreja').toUpperCase();

  const ministries = input.ministries || [];
  const cells = input.cells || [];
  const members = input.members || [];
  const schools = input.schools || [];
  const discipleships = input.discipleships || [];
  const prayerRequests = input.prayerRequests || [];

  // Cálculos Consolidados
  const totalCells = cells.length;
  const totalCellMembers = cells.reduce((s, c) => s + num(c.memberCount || (c.members ? c.members.length : 0)), 0);
  const totalMinistries = ministries.length;
  const totalSchools = schools.length;
  const activeDiscipleships = discipleships.filter((d) => d.status === 'em_andamento').length;
  const answeredPrayers = prayerRequests.filter((p) => p.status === 'respondido' || p.status === 'concluido').length;

  // ==========================================================================
  // ABA 1 — 📊 PAINEL EXECUTIVO DE MINISTÉRIOS
  // ==========================================================================
  const wsP = wb.addWorksheet('Painel Ministerial', {
    properties: { tabColor: { argb: argb(C.purple) } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 3, topLeftCell: 'A4', activeCell: 'B5', showGridLines: false, zoomScale: 90 }],
  });
  wsP.columns = [{ width: 2 }, ...Array.from({ length: 12 }, () => ({ width: 17 })), { width: 2 }];
  banner(
    wsP,
    14,
    `${church}  •  DASHBOARD EXECUTIVO DE MINISTÉRIOS, CÉLULAS & ENSINO`,
    `Emitido em ${issuedStr}   •   ${totalMinistries} ministérios   •   ${totalCells} células   •   Vida eclesiástica e discipulado`
  );
  wsP.getRow(4).height = 10;

  const kpi = (row: number, col: number, label: string, value: any, foot: string, dark: string, light: string, fmt = '0') => {
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

  kpi(5, 2, '🏘️  CÉLULAS EM ATIVIDADE', totalCells, `${totalCellMembers} pessoas integradas em PG`, C.green, C.greenLight);
  kpi(5, 5, '👥  MINISTÉRIOS ATIVOS', totalMinistries, 'Departamentos e frentes de ação', C.purple, C.purpleLight);
  kpi(5, 8, '📖  TURMAS DE ENSINO / EBD', totalSchools, 'Escolas de líderes e formação', C.blue, C.blueLight);
  kpi(5, 11, '🌱  DISCIPULADOS EM CURSO', activeDiscipleships, 'Mentoria 1 a 1 em andamento', C.teal, C.tealLight);
  wsP.getRow(8).height = 8;
  kpi(9, 2, '🙏  PEDIDOS DE ORAÇÃO', prayerRequests.length, `${answeredPrayers} orações respondidas`, C.amber, C.amberLight);
  kpi(9, 5, '👶  MINISTÉRIO INFANTIL (KIDS)', ministries.filter((m) => m.name?.toLowerCase().includes('infan') || m.name?.toLowerCase().includes('kid')).length > 0 ? 'ATIVO' : 'REGULAR', 'Apoio e acolhimento familiar', C.pink, C.pinkLight);
  kpi(9, 8, '🔥  MINISTÉRIO DE JOVENS', ministries.filter((m) => m.name?.toLowerCase().includes('joven') || m.name?.toLowerCase().includes('teen')).length > 0 ? 'ATIVO' : 'REGULAR', 'Discipulado e conexão jovem', C.navy2, C.slate100);
  kpi(9, 11, '🤝  MÉDIA PESSOAS / CÉLULA', totalCells > 0 ? Math.round(totalCellMembers / totalCells) : 0, 'Comunhão e pastoreio', C.teal, C.tealLight);
  wsP.getRow(12).height = 14;

  // --- Tabelas de Resumo: Células na esquerda e Ministérios na direita
  block(wsP, 13, 2, 13, 7, '🏘️  DESTAQUES DAS CÉLULAS E GRUPOS FAMILIARES', { bg: C.green, color: C.white, bold: true, size: 11 });
  block(wsP, 13, 9, 13, 13, '👥  RESUMO DE TODOS OS MINISTÉRIOS', { bg: C.purple, color: C.white, bold: true, size: 11 });
  wsP.getRow(13).height = 24;

  headerRow(wsP, 14, 2, ['NOME DA CÉLULA', 'LÍDER RESPONSÁVEL', 'DIA DE REUNIÃO', 'HORÁRIO', 'MEMBROS', 'PARTICIPAÇÃO']);
  block(wsP, 14, 9, 14, 10, 'DEPARTAMENTO / MINISTÉRIO', { bg: C.navy2, color: C.white, bold: true, size: 9.5, h: 'center', border: 'thin' });
  headerRow(wsP, 14, 11, ['LÍDER', 'VOLUNTÁRIOS', 'STATUS']);

  const cellsPreview = cells.slice(0, 10);
  const cellRows = Math.max(cellsPreview.length, 6);
  for (let i = 0; i < cellRows; i++) {
    const r = 15 + i;
    const bg = i % 2 === 0 ? C.white : C.slate50;
    const cl = cellsPreview[i];
    const mCount = cl ? num(cl.memberCount || (cl.members ? cl.members.length : 0)) : null;
    wsP.getRow(r).height = 19;
    cell(wsP, r, 2, cl ? cl.name : (i === 0 ? 'Nenhuma célula cadastrada' : ''), { bg, bold: !!cl, border: 'thin' });
    cell(wsP, r, 3, cl ? (cl.leader?.name || cl.leader || '-') : '', { bg, border: 'thin' });
    cell(wsP, r, 4, cl ? (cl.meetingDay || 'Semanal') : '', { bg, h: 'center', border: 'thin' });
    cell(wsP, r, 5, cl ? (cl.meetingTime || '20:00') : '', { bg, h: 'center', border: 'thin' });
    cell(wsP, r, 6, mCount, { bg, h: 'center', numFmt: '0', border: 'thin', bold: true, color: C.green });
    cell(wsP, r, 7, cl && totalCellMembers > 0 ? (mCount || 0) / totalCellMembers : null, { bg, h: 'center', numFmt: PCT, border: 'thin' });
  }

  const cTot = 15 + cellRows;
  cell(wsP, cTot, 2, 'TOTAL GERAL DE CÉLULAS', { bg: C.slate200, bold: true, border: 'total', color: C.navy });
  cell(wsP, cTot, 3, `${cells.length} células cadastradas`, { bg: C.slate200, bold: true, h: 'center', border: 'total', color: C.navy });
  cell(wsP, cTot, 4, '', { bg: C.slate200, border: 'total' });
  cell(wsP, cTot, 5, '', { bg: C.slate200, border: 'total' });
  cell(wsP, cTot, 6, totalCellMembers, { bg: C.slate200, bold: true, h: 'center', numFmt: '0', border: 'total', color: C.green });
  cell(wsP, cTot, 7, totalCellMembers > 0 ? 1 : 0, { bg: C.slate200, bold: true, h: 'center', numFmt: PCT, border: 'total', color: C.navy });
  wsP.getRow(cTot).height = 22;
  dataBar(wsP, `F15:F${cTot - 1}`, C.greenMid);

  // Ministérios no lado direito (I..M)
  const minPreview = ministries.slice(0, cellRows);
  for (let i = 0; i < cellRows; i++) {
    const r = 15 + i;
    const bg = i % 2 === 0 ? C.white : C.slate50;
    const m = minPreview[i];
    block(wsP, r, 9, r, 10, m ? m.name : (i === 0 ? 'Nenhum ministério cadastrado' : ''), { bg, bold: !!m, border: 'thin' });
    cell(wsP, r, 11, m ? (m.leader?.name || m.leader || '-') : '', { bg, border: 'thin' });
    cell(wsP, r, 12, m ? (m.memberCount || m.members?.length || '-') : null, { bg, h: 'center', numFmt: '0', border: 'thin', bold: true });
    cell(wsP, r, 13, m ? (m.active !== false ? 'ATIVO' : 'INATIVO') : '', {
      bg: m ? (m.active !== false ? C.greenLight : C.slate100) : bg,
      color: m ? (m.active !== false ? C.green : C.slate500) : C.navy2,
      bold: true,
      h: 'center',
      border: 'thin',
    });
  }

  setupPrint(wsP);

  // ==========================================================================
  // ABA 2 — 🏘️ CÉLULAS & GRUPOS FAMILIARES
  // ==========================================================================
  const wsC = wb.addWorksheet('Células e Grupos', {
    properties: { tabColor: { argb: argb(C.green) } },
    views: [{ state: 'frozen', xSplit: 2, ySplit: 5, topLeftCell: 'C6', activeCell: 'C6', showGridLines: false, zoomScale: 90 }],
  });
  wsC.columns = [8, 32, 26, 26, 16, 14, 14, 16, 38].map((width) => ({ width }));
  banner(
    wsC,
    9,
    `${church}  •  CADASTRO DE CÉLULAS E GRUPOS FAMILIARES`,
    `Emitido em ${issuedStr}   •   ${cells.length} células cadastradas   •   Comunhão nos lares e multiplicação`
  );

  wsC.getRow(4).height = 24;
  block(wsC, 4, 1, 4, 6, 'TOTAL DE INTEGRANTES EM CÉLULAS  ►', { bg: C.slate100, bold: true, color: C.navy, h: 'right', border: 'thin' });
  cell(wsC, 4, 7, totalCellMembers, { bg: C.greenLight, bold: true, color: C.green, h: 'center', numFmt: '0', border: 'thin' });
  block(wsC, 4, 8, 4, 9, `${cells.length} Células Ativas`, { bg: C.slate100, bold: true, color: C.navy, h: 'center', border: 'thin' });

  headerRow(wsC, 5, 1, [
    'Nº',
    'NOME DA CÉLULA',
    'LÍDER TITULAR',
    'ANFITRIÃO',
    'DIA DA SEMANA',
    'HORÁRIO',
    'MEMBROS',
    'PARTICIPAÇÃO %',
    'ENDEREÇO DA REUNIÃO',
  ]);
  wsC.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: 9 } };

  if (cells.length === 0) {
    block(wsC, 6, 1, 6, 9, 'Nenhuma célula cadastrada.', { italic: true, color: C.slate500, h: 'center', border: 'thin' });
  }

  cells.forEach((cl, idx) => {
    const r = 6 + idx;
    const bg = idx % 2 === 0 ? C.white : C.slate50;
    const mCount = num(cl.memberCount || (cl.members ? cl.members.length : 0));
    wsC.getRow(r).height = 19;

    cell(wsC, r, 1, idx + 1, { bg, h: 'center', border: 'thin', color: C.slate500 });
    cell(wsC, r, 2, (cl.name || 'Célula Sem Nome').toUpperCase(), { bg, bold: true, border: 'thin' });
    cell(wsC, r, 3, cl.leader?.name || cl.leader || 'A definir', { bg, border: 'thin' });
    cell(wsC, r, 4, cl.host?.name || cl.host || 'A definir', { bg, border: 'thin' });
    cell(wsC, r, 5, cl.meetingDay || 'Quarta-feira', { bg, h: 'center', border: 'thin' });
    cell(wsC, r, 6, cl.meetingTime || '20:00', { bg, h: 'center', border: 'thin' });
    cell(wsC, r, 7, mCount, { bg, h: 'center', numFmt: '0', border: 'thin', bold: true, color: C.green });
    cell(wsC, r, 8, totalCellMembers > 0 ? mCount / totalCellMembers : 0, { bg, h: 'center', numFmt: PCT, border: 'thin' });
    cell(wsC, r, 9, cl.address || 'Templo / Lares', { bg, border: 'thin' });
  });

  const cLastRow = 5 + Math.max(cells.length, 1);
  const cSumRow = cLastRow + 1;
  block(wsC, cSumRow, 1, cSumRow, 6, 'TOTAL GERAL', { bg: C.slate200, bold: true, border: 'total', color: C.navy });
  cell(wsC, cSumRow, 7, { formula: `SUM(G6:G${cLastRow})`, result: totalCellMembers }, { bg: C.slate200, bold: true, h: 'center', numFmt: '0', border: 'total', color: C.green });
  cell(wsC, cSumRow, 8, totalCellMembers > 0 ? 1 : 0, { bg: C.slate200, bold: true, h: 'center', numFmt: PCT, border: 'total', color: C.navy });
  cell(wsC, cSumRow, 9, `${cells.length} grupos familiares`, { bg: C.slate200, bold: true, h: 'center', border: 'total', color: C.navy });
  wsC.getRow(cSumRow).height = 22;

  dataBar(wsC, `G6:G${cLastRow}`, C.greenMid);
  setupPrint(wsC);

  // ==========================================================================
  // ABA 3 — 👥 TODOS OS MINISTÉRIOS
  // ==========================================================================
  const wsM = wb.addWorksheet('Ministérios', {
    properties: { tabColor: { argb: argb(C.purple) } },
    views: [{ state: 'frozen', xSplit: 2, ySplit: 5, topLeftCell: 'C6', activeCell: 'C6', showGridLines: false, zoomScale: 90 }],
  });
  // 11 colunas formatadas profissionalmente
  wsM.columns = [8, 32, 26, 14, 15, 18, 14, 16, 14, 40, 20].map((width) => ({ width }));
  banner(
    wsM,
    11,
    `${church}  •  QUADRO GERAL DE MINISTÉRIOS E RELATÓRIO DE ATIVIDADES`,
    `Emitido em ${issuedStr}   •   ${ministries.length} ministérios e frentes de serviço ativas`
  );

  headerRow(wsM, 5, 1, [
    'Nº',
    'NOME DO MINISTÉRIO',
    'LÍDER RESPONSÁVEL',
    'INTEGRANTES',
    'REUNIÕES (MÊS)',
    'MEMBROS PRESENTES',
    'VISITANTES',
    'DATA DA REUNIÃO',
    'SITUAÇÃO',
    'RELATÓRIO / ATIVIDADES',
    'CONTATO LÍDER',
  ]);
  wsM.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: 11 } };

  if (ministries.length === 0) {
    block(wsM, 6, 1, 6, 11, 'Nenhum ministério cadastrado.', { italic: true, color: C.slate500, h: 'center', border: 'thin' });
  }

  let totalMinMembers = 0;
  let totalMinMeetings = 0;
  let totalMinPresent = 0;
  let totalMinVisitors = 0;

  ministries.forEach((min, idx) => {
    const r = 6 + idx;
    const bg = idx % 2 === 0 ? C.white : C.slate50;
    const isActive = min.active !== false;
    const rep = parseMinistryReport(min.monthly_activity_report || min.monthlyActivityReport);
    const mCount = num(min.memberCount || (min.members ? min.members.length : 0));
    const meetCount = num(min.meetings_count ?? min.meetingsCount ?? 0);
    const presCount = num(min.members_present_count ?? min.membersPresentCount ?? rep.membersPresentCount);
    const visCount = num(min.visitors_count ?? min.visitorsCount ?? rep.visitorsCount);
    const meetDateRaw = min.meeting_date ?? min.meetingDate ?? rep.meetingDate;
    const reportNotes = rep.notes || min.description || 'Atividades regulares.';

    totalMinMembers += mCount;
    totalMinMeetings += meetCount;
    totalMinPresent += presCount;
    totalMinVisitors += visCount;

    wsM.getRow(r).height = 20;

    cell(wsM, r, 1, idx + 1, { bg, h: 'center', border: 'thin', color: C.slate500 });
    cell(wsM, r, 2, (min.name || 'Ministério').toUpperCase(), { bg, bold: true, border: 'thin' });
    cell(wsM, r, 3, min.leader?.name || min.leader || 'A definir', { bg, border: 'thin' });
    cell(wsM, r, 4, mCount, { bg, h: 'center', numFmt: '0', border: 'thin', bold: true, color: C.navy });
    cell(wsM, r, 5, meetCount, { bg, h: 'center', numFmt: '0', border: 'thin' });
    cell(wsM, r, 6, presCount, { bg, h: 'center', numFmt: '0', border: 'thin', bold: true, color: C.green });
    cell(wsM, r, 7, visCount, { bg, h: 'center', numFmt: '0', border: 'thin', bold: true, color: C.amber });
    cell(wsM, r, 8, toDate(meetDateRaw), { bg, h: 'center', numFmt: meetDateRaw ? 'DD/MM/YYYY' : '@', border: 'thin' });
    cell(wsM, r, 9, isActive ? 'ATIVO' : 'INATIVO', {
      bg: isActive ? C.greenLight : C.slate100,
      color: isActive ? C.green : C.slate500,
      bold: true,
      h: 'center',
      border: 'thin',
    });
    cell(wsM, r, 10, reportNotes, { bg, border: 'thin' });
    cell(wsM, r, 11, min.leader?.phone || min.leader?.email || '-', { bg, h: 'center', border: 'thin' });
  });

  const mLastRow = 5 + Math.max(ministries.length, 1);
  const mSumRow = mLastRow + 1;
  block(wsM, mSumRow, 1, mSumRow, 3, 'TOTAL GERAL', { bg: C.slate200, bold: true, border: 'total', color: C.navy });
  cell(wsM, mSumRow, 4, { formula: `SUM(D6:D${mLastRow})`, result: totalMinMembers }, { bg: C.slate200, bold: true, h: 'center', numFmt: '0', border: 'total', color: C.navy });
  cell(wsM, mSumRow, 5, { formula: `SUM(E6:E${mLastRow})`, result: totalMinMeetings }, { bg: C.slate200, bold: true, h: 'center', numFmt: '0', border: 'total', color: C.navy });
  cell(wsM, mSumRow, 6, { formula: `SUM(F6:F${mLastRow})`, result: totalMinPresent }, { bg: C.slate200, bold: true, h: 'center', numFmt: '0', border: 'total', color: C.green });
  cell(wsM, mSumRow, 7, { formula: `SUM(G6:G${mLastRow})`, result: totalMinVisitors }, { bg: C.slate200, bold: true, h: 'center', numFmt: '0', border: 'total', color: C.amber });
  block(wsM, mSumRow, 8, mSumRow, 11, `${ministries.length} ministérios e departamentos`, { bg: C.slate200, bold: true, h: 'center', border: 'total', color: C.navy });
  wsM.getRow(mSumRow).height = 22;

  if (ministries.length > 0) {
    dataBar(wsM, `D6:D${mLastRow}`, C.purpleLight);
    dataBar(wsM, `F6:F${mLastRow}`, C.greenMid);
  }

  setupPrint(wsM);

  // ==========================================================================
  // ABA 4 — 👶 MINISTÉRIO INFANTIL (KIDS) & JOVENS
  // ==========================================================================
  const wsKids = wb.addWorksheet('Infantil & Jovens', {
    properties: { tabColor: { argb: argb(C.pink) } },
    views: [{ state: 'frozen', xSplit: 2, ySplit: 5, topLeftCell: 'C6', activeCell: 'C6', showGridLines: false, zoomScale: 90 }],
  });
  wsKids.columns = [8, 36, 16, 20, 16, 16, 30, 24].map((width) => ({ width }));
  banner(
    wsKids,
    8,
    `${church}  •  MINISTÉRIO INFANTIL (KIDS), ADOLESCENTES & JOVENS`,
    `Emitido em ${issuedStr}   •   Acompanhamento das novas gerações e liderança`
  );

  headerRow(wsKids, 5, 1, [
    'Nº',
    'NOME DO ALUNO / JOVEM',
    'CATEGORIA',
    'NASCIMENTO',
    'IDADE (APROX.)',
    'GÊNERO',
    'RESPONSÁVEIS (PAI / MÃE)',
    'TELEFONE CONTATO',
  ]);
  wsKids.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: 8 } };

  // Filtrar membros crianças e jovens (ou com tags correspondentes)
  const currentYear = new Date().getFullYear();
  const youngMembers = members.filter((m) => {
    const role = (m.role || '').toLowerCase();
    const birth = m.birthDate || (m as any).birth_date;
    if (role.includes('infan') || role.includes('kid') || role.includes('jovem') || role.includes('adoles')) return true;
    if (birth) {
      const y = parseInt(String(birth).slice(0, 4), 10);
      if (y && (currentYear - y <= 25)) return true;
    }
    return false;
  });

  if (youngMembers.length === 0) {
    block(wsKids, 6, 1, 6, 8, 'Nenhuma criança ou jovem identificado pelo filtro de idade / função.', { italic: true, color: C.slate500, h: 'center', border: 'thin' });
  }

  youngMembers.forEach((ym, idx) => {
    const r = 6 + idx;
    const bg = idx % 2 === 0 ? C.white : C.slate50;
    const birth = ym.birthDate || (ym as any).birth_date;
    const y = birth ? parseInt(String(birth).slice(0, 4), 10) : null;
    const age = y ? currentYear - y : null;
    const isKid = age !== null ? age <= 12 : false;
    wsKids.getRow(r).height = 19;

    cell(wsKids, r, 1, idx + 1, { bg, h: 'center', border: 'thin', color: C.slate500 });
    cell(wsKids, r, 2, (ym.name || 'Sem Nome').toUpperCase(), { bg, bold: true, border: 'thin' });
    cell(wsKids, r, 3, isKid ? 'KIDS (INFANTIL)' : 'JOVEM / ADOLESCENTE', {
      bg: isKid ? C.pinkLight : C.blueLight,
      color: isKid ? C.pink : C.blue,
      bold: true,
      h: 'center',
      border: 'thin',
    });
    cell(wsKids, r, 4, toDate(birth), { bg, h: 'center', numFmt: DATE, border: 'thin' });
    cell(wsKids, r, 5, age !== null ? `${age} anos` : '-', { bg, h: 'center', border: 'thin', bold: true });
    cell(wsKids, r, 6, ym.gender ? String(ym.gender).toUpperCase() : '-', { bg, h: 'center', border: 'thin' });
    cell(wsKids, r, 7, (ym as any).motherName || (ym as any).fatherName ? `${(ym as any).motherName || ''} / ${(ym as any).fatherName || ''}` : '-', { bg, border: 'thin' });
    cell(wsKids, r, 8, ym.phone || '-', { bg, h: 'center', border: 'thin' });
  });

  setupPrint(wsKids);

  // ==========================================================================
  // ==========================================================================
  // ABA 5 — 📖 ESCOLAS BÍBLICAS & FORMAÇÃO
  // ==========================================================================
  const wsSchools = wb.addWorksheet('Escolas e EBD', {
    properties: { tabColor: { argb: argb(C.blue) } },
    views: [{ state: 'frozen', xSplit: 2, ySplit: 5, topLeftCell: 'C6', activeCell: 'C6', showGridLines: false, zoomScale: 90 }],
  });
  wsSchools.columns = [8, 36, 16, 20, 36, 20].map((width) => ({ width }));
  banner(
    wsSchools,
    6,
    `${church}  •  ESCOLAS BÍBLICAS, EBD & FORMAÇÃO DE LÍDERES`,
    `Emitido em ${issuedStr}   •   ${schools.length} turmas cadastradas   •   Educação cristã e teológica`
  );

  headerRow(wsSchools, 5, 1, ['Nº', 'NOME DA ESCOLA / CURSO', 'SITUAÇÃO', 'DATA CRIAÇÃO', 'DESCRIÇÃO / OBJETIVO DO CURSO', 'DEPARTAMENTO']);
  wsSchools.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: 6 } };

  if (schools.length === 0) {
    block(wsSchools, 6, 1, 6, 6, 'Nenhuma escola ou turma cadastrada.', { italic: true, color: C.slate500, h: 'center', border: 'thin' });
  }

  schools.forEach((s, idx) => {
    const r = 6 + idx;
    const bg = idx % 2 === 0 ? C.white : C.slate50;
    wsSchools.getRow(r).height = 20;

    cell(wsSchools, r, 1, idx + 1, { bg, h: 'center', border: 'thin', color: C.slate500 });
    cell(wsSchools, r, 2, (s.name || 'Escola').toUpperCase(), { bg, bold: true, border: 'thin' });
    cell(wsSchools, r, 3, s.active !== false ? 'ATIVA' : 'ENCERRADA', {
      bg: s.active !== false ? C.greenLight : C.slate100,
      color: s.active !== false ? C.green : C.slate500,
      bold: true,
      h: 'center',
      border: 'thin',
    });
    cell(wsSchools, r, 4, toDate(s.created_at), { bg, h: 'center', numFmt: DATE, border: 'thin' });
    cell(wsSchools, r, 5, s.description || 'Formação eclesiástica bíblica.', { bg, border: 'thin' });
    cell(wsSchools, r, 6, 'Ensino / EBD', { bg, h: 'center', border: 'thin' });
  });

  setupPrint(wsSchools);

  // ==========================================================================
  // ABA 6 — 🌱 DISCIPULADO & MENTORIA ESPIRITUAL
  // ==========================================================================
  const wsDisc = wb.addWorksheet('Discipulado', {
    properties: { tabColor: { argb: argb(C.teal) } },
    views: [{ state: 'frozen', xSplit: 2, ySplit: 5, topLeftCell: 'C6', activeCell: 'C6', showGridLines: false, zoomScale: 90 }],
  });
  wsDisc.columns = [8, 34, 34, 18, 16, 24].map((width) => ({ width }));
  banner(
    wsDisc,
    6,
    `${church}  •  DISCIPULADO & MENTORIA ESPIRITUAL 1 A 1`,
    `Emitido em ${issuedStr}   •   ${discipleships.length} acompanhamentos pastorais registrados`
  );

  headerRow(wsDisc, 5, 1, ['Nº', 'DISCÍPULO (ACOMPANHADO)', 'MENTOR / DISCIPULADOR', 'STATUS', 'INÍCIO', 'CONTATO DO DISCÍPULO']);
  wsDisc.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: 6 } };

  if (discipleships.length === 0) {
    block(wsDisc, 6, 1, 6, 6, 'Nenhum discipulado cadastrado.', { italic: true, color: C.slate500, h: 'center', border: 'thin' });
  }

  discipleships.forEach((d, idx) => {
    const r = 6 + idx;
    const bg = idx % 2 === 0 ? C.white : C.slate50;
    const isDone = d.status === 'concluido';
    wsDisc.getRow(r).height = 20;

    cell(wsDisc, r, 1, idx + 1, { bg, h: 'center', border: 'thin', color: C.slate500 });
    cell(wsDisc, r, 2, (d.disciple?.name || 'Discípulo').toUpperCase(), { bg, bold: true, border: 'thin' });
    cell(wsDisc, r, 3, (d.mentor?.name || 'Mentor').toUpperCase(), { bg, border: 'thin' });
    cell(wsDisc, r, 4, isDone ? 'CONCLUÍDO' : 'EM ANDAMENTO', {
      bg: isDone ? C.greenLight : C.tealLight,
      color: isDone ? C.green : C.teal,
      bold: true,
      h: 'center',
      border: 'thin',
    });
    cell(wsDisc, r, 5, toDate(d.created_at || d.startDate), { bg, h: 'center', numFmt: DATE, border: 'thin' });
    cell(wsDisc, r, 6, d.disciple?.phone || d.disciple?.email || '-', { bg, h: 'center', border: 'thin' });
  });

  setupPrint(wsDisc);

  // ==========================================================================
  // ABA 7 — 🙏 INTERCESSÃO & PEDIDOS DE ORAÇÃO
  // ==========================================================================
  const wsPray = wb.addWorksheet('Oração e Intercessão', {
    properties: { tabColor: { argb: argb(C.amber) } },
    views: [{ state: 'frozen', xSplit: 1, ySplit: 5, topLeftCell: 'B6', activeCell: 'B6', showGridLines: false, zoomScale: 90 }],
  });
  wsPray.columns = [8, 22, 18, 44, 18, 16, 20].map((width) => ({ width }));
  banner(
    wsPray,
    7,
    `${church}  •  CADERNO DE ORAÇÃO E CLAMOR PASTORAL`,
    `Emitido em ${issuedStr}   •   ${prayerRequests.length} pedidos registrados   •   Intercessão e cuidado pastoral`
  );

  headerRow(wsPray, 5, 1, ['Nº', 'SOLICITANTE', 'CATEGORIA', 'MOTIVO / PEDIDO DE ORAÇÃO', 'DATA REGISTRO', 'SITUAÇÃO', 'INTERCESSOR']);
  wsPray.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: 7 } };

  if (prayerRequests.length === 0) {
    block(wsPray, 6, 1, 6, 7, 'Nenhum pedido de oração registrado.', { italic: true, color: C.slate500, h: 'center', border: 'thin' });
  }

  prayerRequests.forEach((pr, idx) => {
    const r = 6 + idx;
    const bg = idx % 2 === 0 ? C.white : C.slate50;
    const isAnswered = pr.status === 'respondido' || pr.status === 'concluido';
    wsPray.getRow(r).height = 20;

    cell(wsPray, r, 1, idx + 1, { bg, h: 'center', border: 'thin', color: C.slate500 });
    cell(wsPray, r, 2, pr.is_anonymous ? 'CONFIDENCIAL' : (pr.requester_name || 'Irmão(ã)'), { bg, bold: true, border: 'thin' });
    cell(wsPray, r, 3, String(pr.category || 'Geral').toUpperCase(), { bg, h: 'center', border: 'thin', bold: true });
    cell(wsPray, r, 4, pr.content || 'Pedido de oração.', { bg, border: 'thin' });
    cell(wsPray, r, 5, toDate(pr.created_at), { bg, h: 'center', numFmt: DATE, border: 'thin' });
    cell(wsPray, r, 6, isAnswered ? 'RESPONDIDO' : 'EM ORAÇÃO', {
      bg: isAnswered ? C.greenLight : C.amberLight,
      color: isAnswered ? C.green : C.amber,
      bold: true,
      h: 'center',
      border: 'thin',
    });
    cell(wsPray, r, 7, pr.assigned_to_name || 'Ministério de Intercessão', { bg, border: 'thin' });
  });

  setupPrint(wsPray);

  return wb;
}

export async function buildMinistriesDashboardBuffer(input: MinistriesDashboardInput): Promise<ArrayBuffer> {
  const wb = await buildMinistriesDashboardWorkbook(input);
  return wb.xlsx.writeBuffer();
}
