/**
 * Gerador de Dashboard Executivo Administrativo & Patrimonial em Excel (ExcelJS).
 * 
 * Abas:
 * 1. 📊 Painel Executivo (KPIs em cartões coloridos, resumo de membros e patrimônio)
 * 2. 👥 Rol de Membros (Congelamento xSplit: 2, ySplit: 4, cores, categorias, filtros)
 * 3. 🏢 Inventário de Patrimônio (Categorias, valores em R$, locais, conservação, dataBars)
 * 4. 🛠️ Manutenções e Ocorrências (Status, valores, datas)
 * 5. 📜 Atas e Registros Oficiais (Histórico oficial da secretaria)
 */
import * as ExcelJSNS from 'exceljs';
import type { Member, Asset, AssetMaintenance } from '@/types';
import type { ChurchDocument } from '@/services/documents.service';

function getExcelJS(): any {
  const ns: any = ExcelJSNS;
  if (ns?.Workbook) return ns;
  if (ns?.default?.Workbook) return ns.default;
  return ns;
}

export interface AdministrativeDashboardInput {
  churchName: string;
  members: Member[];
  assets: Asset[];
  maintenances?: AssetMaintenance[];
  documents?: ChurchDocument[];
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
  amber: 'B45309',
  amberLight: 'FEF3C7',
  teal: '0F766E',
  tealLight: 'CCFBF1',
};

const FONT = 'Calibri';
const BRL = '"R$" #,##0.00;[Red]-"R$" #,##0.00;"-"';
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
  ws.headerFooter = { oddFooter: '&L&8Gestão Eclesiástica & Patrimonial&R&8Página &P de &N' };
}

const toDate = (iso?: string): Date | string => {
  if (!iso) return '-';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
};

const num = (v: any) => Number(v) || 0;

export async function buildAdministrativeDashboardWorkbook(input: AdministrativeDashboardInput) {
  const ExcelJS = getExcelJS();
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Gestão de Igreja';
  wb.created = input.issuedAt ?? new Date();
  wb.calcProperties = { fullCalcOnLoad: true };

  const issued = input.issuedAt ?? new Date();
  const issuedStr = `${String(issued.getDate()).padStart(2, '0')}/${String(issued.getMonth() + 1).padStart(2, '0')}/${issued.getFullYear()} às ${String(issued.getHours()).padStart(2, '0')}:${String(issued.getMinutes()).padStart(2, '0')}`;
  const church = (input.churchName || 'Igreja').toUpperCase();

  const members = input.members || [];
  const assets = input.assets || [];
  const maintenances = input.maintenances || [];
  const documents = input.documents || [];

  // Cálculos Gerais
  const totalMembers = members.filter((m) => m.category === 'membro' || m.status === 'ativo').length;
  const totalCongregados = members.filter((m) => m.category === 'congregado' || m.status === 'visitante').length;
  const totalBaptized = members.filter((m) => Boolean(m.baptismDate)).length;
  const totalAssetsValue = assets.reduce((s, a) => s + num(a.value), 0);
  const activeAssetsCount = assets.filter((a) => a.status === 'ativo' || !a.status).length;
  const maintenanceAssetsCount = assets.filter((a) => a.status === 'em_manutencao').length;
  const totalMinutes = documents.filter((d) => d.category === 'minutes' || d.category === 'roll').length;

  // ==========================================================================
  // ABA 1 — 📊 PAINEL EXECUTIVO ADMINISTRATIVO
  // ==========================================================================
  const wsP = wb.addWorksheet('Painel Administrativo', {
    properties: { tabColor: { argb: argb(C.blue) } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 3, topLeftCell: 'A4', activeCell: 'B5', showGridLines: false, zoomScale: 90 }],
  });
  wsP.columns = [{ width: 2 }, ...Array.from({ length: 12 }, () => ({ width: 17 })), { width: 2 }];
  banner(
    wsP,
    14,
    `${church}  •  DASHBOARD ADMINISTRATIVO, SECRETARIA & PATRIMÔNIO`,
    `Emitido em ${issuedStr}   •   ${members.length} cadastrados no rol   •   ${assets.length} bens patrimoniais   •   Governança eclesiástica`
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

  kpi(5, 2, '👥  TOTAL DE MEMBROS', totalMembers, 'Membros em plena comunhão', C.green, C.greenLight);
  kpi(5, 5, '🔵  CONGREGADOS & VISITANTES', totalCongregados, 'Acolhidos e em integração', C.blue, C.blueLight);
  kpi(5, 8, '🌊  MEMBROS BATIZADOS', totalBaptized, `${members.length > 0 ? ((totalBaptized / members.length) * 100).toFixed(0) : 0}% do rol de comunhão`, C.teal, C.tealLight);
  kpi(5, 11, '🏛️  VALOR TOTAL DO PATRIMÔNIO', totalAssetsValue, `${assets.length} bens patrimoniais cadastrados`, C.purple, C.purpleLight, BRL);
  wsP.getRow(8).height = 8;
  kpi(9, 2, '📦  BENS ATIVOS & EM USO', activeAssetsCount, 'Equipamentos e imóveis regulares', C.navy2, C.slate100);
  kpi(9, 5, '🛠️  BENS EM MANUTENÇÃO', maintenanceAssetsCount, maintenanceAssetsCount === 0 ? 'Nenhum equipamento quebrado' : 'Aguardando reparo técnico', maintenanceAssetsCount === 0 ? C.green : C.amber, maintenanceAssetsCount === 0 ? C.greenLight : C.amberLight);
  kpi(9, 8, '📜  ATAS & REGISTROS OFICIAIS', totalMinutes, 'Documentos da secretaria salvos', C.amber, C.amberLight);
  kpi(9, 11, '📋  TAXA DE ATIVIDADE DO ROL', members.length > 0 ? (totalMembers / members.length) : 1, 'Membros vs Congregados', C.navy, C.slate100, PCT);
  wsP.getRow(12).height = 14;

  // --- Resumo de Categorias de Bens (B..G) e Demografia de Membros (I..M)
  block(wsP, 13, 2, 13, 7, '🏢  PATRIMÔNIO POR CATEGORIA', { bg: C.purple, color: C.white, bold: true, size: 11 });
  block(wsP, 13, 9, 13, 13, '👥  DISTRIBUIÇÃO DEMOGRÁFICA DO ROL', { bg: C.teal, color: C.white, bold: true, size: 11 });
  wsP.getRow(13).height = 24;

  headerRow(wsP, 14, 2, ['CATEGORIA', 'QUANTIDADE', 'VALOR TOTAL (R$)', 'PARTICIPAÇÃO %', 'EM MANUTENÇÃO', 'ESTADO GERAL']);
  block(wsP, 14, 9, 14, 10, 'INDICADOR DEMOGRÁFICO', { bg: C.navy2, color: C.white, bold: true, size: 9.5, h: 'center', border: 'thin' });
  headerRow(wsP, 14, 11, ['QUANTIDADE', '% DO ROL', 'CLASSIFICAÇÃO']);

  // Agrupamento de Bens por Categoria
  const assetCatMap = new Map<string, { count: number; value: number; inMaint: number }>();
  assets.forEach((a) => {
    const cat = a.category || 'Geral / Outros';
    const cur = assetCatMap.get(cat) || { count: 0, value: 0, inMaint: 0 };
    cur.count++;
    cur.value += num(a.value);
    if (a.status === 'em_manutencao') cur.inMaint++;
    assetCatMap.set(cat, cur);
  });
  const assetCats = [...assetCatMap.entries()].sort((a, b) => b[1].value - a[1].value);

  const assetRows = Math.max(assetCats.length, 6);
  for (let i = 0; i < assetRows; i++) {
    const r = 15 + i;
    const bg = i % 2 === 0 ? C.white : C.slate50;
    const ac = assetCats[i];
    wsP.getRow(r).height = 19;
    cell(wsP, r, 2, ac ? ac[0] : (i === 0 ? 'Nenhum bem cadastrado' : ''), { bg, bold: !!ac, border: 'thin' });
    cell(wsP, r, 3, ac ? ac[1].count : null, { bg, h: 'center', numFmt: '0', border: 'thin' });
    cell(wsP, r, 4, ac ? ac[1].value : null, { bg, h: 'right', numFmt: BRL, border: 'thin', bold: true });
    cell(wsP, r, 5, ac && totalAssetsValue ? ac[1].value / totalAssetsValue : null, { bg, h: 'center', numFmt: PCT, border: 'thin' });
    cell(wsP, r, 6, ac ? ac[1].inMaint : null, { bg, h: 'center', numFmt: '0', border: 'thin', color: ac && ac[1].inMaint > 0 ? C.red : C.slate500 });
    cell(wsP, r, 7, ac ? (ac[1].inMaint === 0 ? '100% Operacional' : 'Revisão Necessária') : '', { bg, h: 'center', border: 'thin', color: ac && ac[1].inMaint === 0 ? C.green : C.amber, bold: true });
  }

  const aTot = 15 + assetRows;
  cell(wsP, aTot, 2, 'TOTAL DO PATRIMÔNIO', { bg: C.slate200, bold: true, border: 'total', color: C.navy });
  cell(wsP, aTot, 3, assets.length, { bg: C.slate200, bold: true, h: 'center', numFmt: '0', border: 'total', color: C.navy });
  cell(wsP, aTot, 4, totalAssetsValue, { bg: C.slate200, bold: true, h: 'right', numFmt: BRL, border: 'total', color: C.navy });
  cell(wsP, aTot, 5, totalAssetsValue ? 1 : 0, { bg: C.slate200, bold: true, h: 'center', numFmt: PCT, border: 'total', color: C.navy });
  cell(wsP, aTot, 6, maintenanceAssetsCount, { bg: C.slate200, bold: true, h: 'center', numFmt: '0', border: 'total', color: C.navy });
  cell(wsP, aTot, 7, maintenanceAssetsCount === 0 ? 'Excelente' : 'Atenção', { bg: C.slate200, bold: true, h: 'center', border: 'total', color: maintenanceAssetsCount === 0 ? C.green : C.amber });
  wsP.getRow(aTot).height = 22;
  dataBar(wsP, `D15:D${aTot - 1}`, C.purple);

  // Demografia de Membros na direita (I..M)
  const menCount = members.filter((m) => String(m.gender).toLowerCase().startsWith('m')).length;
  const womenCount = members.filter((m) => String(m.gender).toLowerCase().startsWith('f')).length;
  const marriedCount = members.filter((m) => String(m.maritalStatus || m.marital_status).toLowerCase().includes('casad')).length;
  const singleCount = members.filter((m) => String(m.maritalStatus || m.marital_status).toLowerCase().includes('solteir')).length;
  const totalM = Math.max(members.length, 1);

  const demoItems = [
    { label: 'Homens (Masculino)', val: menCount, tag: 'Gênero' },
    { label: 'Mulheres (Feminino)', val: womenCount, tag: 'Gênero' },
    { label: 'Membros Casados', val: marriedCount, tag: 'Estado Civil' },
    { label: 'Membros Solteiros', val: singleCount, tag: 'Estado Civil' },
    { label: 'Membros Batizados', val: totalBaptized, tag: 'Espiritual' },
    { label: 'Congregados / Em Integração', val: totalCongregados, tag: 'Frequência' },
  ];

  demoItems.forEach((d, i) => {
    const r = 15 + i;
    const bg = i % 2 === 0 ? C.white : C.slate50;
    block(wsP, r, 9, r, 10, d.label, { bg, bold: true, border: 'thin' });
    cell(wsP, r, 11, d.val, { bg, h: 'center', numFmt: '0', border: 'thin', bold: true });
    cell(wsP, r, 12, d.val / totalM, { bg, h: 'center', numFmt: PCT, border: 'thin' });
    cell(wsP, r, 13, d.tag, { bg, h: 'center', border: 'thin', color: C.slate500, italic: true });
  });

  dataBar(wsP, `K15:K${15 + demoItems.length - 1}`, C.teal);

  setupPrint(wsP);

  // ==========================================================================
  // ABA 2 — 👥 ROL DE MEMBROS E CONGREGADOS
  // ==========================================================================
  const wsM = wb.addWorksheet('Rol de Membros', {
    properties: { tabColor: { argb: argb(C.green) } },
    views: [{ state: 'frozen', xSplit: 2, ySplit: 5, topLeftCell: 'C6', activeCell: 'C6', showGridLines: false, zoomScale: 90 }],
  });
  wsM.columns = [8, 38, 16, 22, 18, 28, 16, 14, 14, 16, 14, 14, 38, 24].map((width) => ({ width }));
  banner(
    wsM,
    14,
    `${church}  •  ROL GERAL DE MEMBROS E CONGREGADOS`,
    `Emitido em ${issuedStr}   •   Total de Registros: ${members.length}   •   Painéis Congelados em Nº e Nome Completo`
  );

  wsM.getRow(4).height = 24;
  block(wsM, 4, 1, 4, 11, 'RESUMO DO ROL VISÍVEL  ►', { bg: C.slate100, bold: true, color: C.navy, h: 'right', border: 'thin' });
  cell(wsM, 4, 12, `Total: ${members.length}`, { bg: C.greenLight, bold: true, color: C.green, h: 'center', border: 'thin' });
  block(wsM, 4, 13, 4, 14, `Membros: ${totalMembers}  |  Congregados: ${totalCongregados}`, { bg: C.blueLight, bold: true, color: C.blue, h: 'center', border: 'thin' });

  headerRow(wsM, 5, 1, [
    'Nº',
    'NOME COMPLETO',
    'CATEGORIA',
    'CARGO / FUNÇÃO',
    'TELEFONE / WHATSAPP',
    'E-MAIL',
    'CPF',
    'NASCIMENTO',
    'BATISMO',
    'ESTADO CIVIL',
    'GÊNERO',
    'STATUS',
    'ENDEREÇO RESIDENCIAL',
    'FILIAÇÃO (MÃE / PAI)',
  ]);
  wsM.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: 14 } };

  if (members.length === 0) {
    block(wsM, 6, 1, 6, 14, 'Nenhum membro ou congregado cadastrado no sistema.', { italic: true, color: C.slate500, h: 'center', border: 'thin' });
  }

  members.forEach((m, idx) => {
    const r = 6 + idx;
    const bg = idx % 2 === 0 ? C.white : C.slate50;
    const isCongregado = m.status === 'visitante' || (m as any).category === 'congregado';
    wsM.getRow(r).height = 19;

    cell(wsM, r, 1, idx + 1, { bg, h: 'center', border: 'thin', color: C.slate500 });
    cell(wsM, r, 2, (m.name || 'Sem Nome').toUpperCase(), { bg, bold: true, border: 'thin' });
    cell(wsM, r, 3, isCongregado ? 'CONGREGADO' : 'MEMBRO', {
      bg: isCongregado ? C.blueLight : C.greenLight,
      color: isCongregado ? C.blue : C.green,
      bold: true,
      h: 'center',
      border: 'thin',
    });
    cell(wsM, r, 4, m.role || (isCongregado ? 'Congregado' : 'Membro'), { bg, border: 'thin' });
    cell(wsM, r, 5, m.phone || '-', { bg, h: 'center', border: 'thin' });
    cell(wsM, r, 6, m.email || '-', { bg, border: 'thin' });
    cell(wsM, r, 7, (m as any).cpf || '-', { bg, h: 'center', border: 'thin' });
    cell(wsM, r, 8, toDate(m.birthDate || (m as any).birth_date), { bg, h: 'center', numFmt: DATE, border: 'thin' });
    cell(wsM, r, 9, toDate(m.baptismDate || (m as any).baptism_date), { bg, h: 'center', numFmt: DATE, border: 'thin' });
    cell(wsM, r, 10, m.maritalStatus ? String(m.maritalStatus).toUpperCase() : (m as any).marital_status ? String((m as any).marital_status).toUpperCase() : '-', { bg, h: 'center', border: 'thin' });
    cell(wsM, r, 11, m.gender ? String(m.gender).toUpperCase() : '-', { bg, h: 'center', border: 'thin' });
    cell(wsM, r, 12, m.status ? String(m.status).toUpperCase() : 'ATIVO', {
      bg: m.status === 'inativo' ? C.redLight : C.slate100,
      color: m.status === 'inativo' ? C.red : C.navy2,
      bold: true,
      h: 'center',
      border: 'thin',
    });
    cell(wsM, r, 13, m.address || '-', { bg, border: 'thin' });
    cell(wsM, r, 14, (m as any).motherName || (m as any).fatherName ? `${(m as any).motherName || ''} / ${(m as any).fatherName || ''}` : '-', { bg, border: 'thin' });
  });

  setupPrint(wsM);
  wsM.pageSetup.printTitlesRow = '5:5';

  // ==========================================================================
  // ABA 3 — 🏢 INVENTÁRIO DO PATRIMÔNIO
  // ==========================================================================
  const wsA = wb.addWorksheet('Patrimônio & Bens', {
    properties: { tabColor: { argb: argb(C.purple) } },
    views: [{ state: 'frozen', xSplit: 2, ySplit: 5, topLeftCell: 'C6', activeCell: 'C6', showGridLines: false, zoomScale: 90 }],
  });
  wsA.columns = [8, 34, 20, 22, 16, 18, 18, 16, 20, 26].map((width) => ({ width }));
  banner(
    wsA,
    10,
    `${church}  •  INVENTÁRIO GERAL DE BENS PATRIMONIAIS`,
    `Emitido em ${issuedStr}   •   ${assets.length} bens inventariados   •   Avaliação total: ${totalAssetsValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
  );

  wsA.getRow(4).height = 24;
  block(wsA, 4, 1, 4, 6, 'VALOR PATRIMONIAL TOTAL INVENTARIADO  ►', { bg: C.slate100, bold: true, color: C.navy, h: 'right', border: 'thin' });
  cell(wsA, 4, 7, totalAssetsValue, { bg: C.purpleLight, bold: true, color: C.purple, h: 'right', numFmt: BRL, border: 'thin' });
  block(wsA, 4, 8, 4, 10, `${activeAssetsCount} Ativos  |  ${maintenanceAssetsCount} em Manutenção`, { bg: C.slate100, bold: true, color: C.navy2, h: 'center', border: 'thin' });

  headerRow(wsA, 5, 1, [
    'ITEM',
    'NOME DO BEM / EQUIPAMENTO',
    'CATEGORIA',
    'LOCALIZAÇÃO / SALA',
    'Nº SÉRIE / TOMBO',
    'AQUISIÇÃO',
    'VALOR HISTÓRICO',
    'ESTADO / SITUAÇÃO',
    'ORIGEM DO BEM',
    'DESCRIÇÃO / ESPECIFICAÇÃO',
  ]);
  wsA.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: 10 } };

  if (assets.length === 0) {
    block(wsA, 6, 1, 6, 10, 'Nenhum bem patrimonial cadastrado.', { italic: true, color: C.slate500, h: 'center', border: 'thin' });
  }

  assets.forEach((a, idx) => {
    const r = 6 + idx;
    const bg = idx % 2 === 0 ? C.white : C.slate50;
    const isMaint = a.status === 'em_manutencao';
    const isInativo = a.status === 'inativo';
    wsA.getRow(r).height = 19;

    cell(wsA, r, 1, idx + 1, { bg, h: 'center', border: 'thin', color: C.slate500 });
    cell(wsA, r, 2, (a.name || 'Sem Nome').toUpperCase(), { bg, bold: true, border: 'thin' });
    cell(wsA, r, 3, a.category || 'Geral', { bg, border: 'thin', bold: true });
    cell(wsA, r, 4, a.location || 'Templo Sede', { bg, border: 'thin' });
    cell(wsA, r, 5, a.serialNumber || '-', { bg, h: 'center', border: 'thin' });
    cell(wsA, r, 6, toDate(a.acquisitionDate), { bg, h: 'center', numFmt: DATE, border: 'thin' });
    cell(wsA, r, 7, num(a.value), { bg, h: 'right', numFmt: BRL, border: 'thin', bold: true, color: C.purple });
    cell(wsA, r, 8, isMaint ? 'EM MANUTENÇÃO' : isInativo ? 'BAIXADO/INATIVO' : 'ATIVO / EM USO', {
      bg: isMaint ? C.amberLight : isInativo ? C.redLight : C.greenLight,
      color: isMaint ? C.amber : isInativo ? C.red : C.green,
      bold: true,
      h: 'center',
      border: 'thin',
    });
    cell(wsA, r, 9, a.source ? String(a.source).toUpperCase() : 'COMPRA', { bg, h: 'center', border: 'thin' });
    cell(wsA, r, 10, a.description || '-', { bg, border: 'thin' });
  });

  const aLastRow = 5 + Math.max(assets.length, 1);
  const aSummaryRow = aLastRow + 1;
  block(wsA, aSummaryRow, 1, aSummaryRow, 6, 'TOTAL GERAL DO PATRIMÔNIO', { bg: C.slate200, bold: true, border: 'total', color: C.navy });
  cell(wsA, aSummaryRow, 7, { formula: `SUM(G6:G${aLastRow})`, result: totalAssetsValue }, { bg: C.slate200, bold: true, h: 'right', numFmt: BRL, border: 'total', color: C.navy });
  block(wsA, aSummaryRow, 8, aSummaryRow, 10, `${assets.length} bens inventariados`, { bg: C.slate200, bold: true, h: 'center', border: 'total', color: C.navy });
  wsA.getRow(aSummaryRow).height = 22;

  dataBar(wsA, `G6:G${aLastRow}`, C.purple);
  setupPrint(wsA);

  // ==========================================================================
  // ABA 4 — 📜 ATAS E REGISTROS OFICIAIS
  // ==========================================================================
  const wsD = wb.addWorksheet('Atas e Documentos', {
    properties: { tabColor: { argb: argb(C.amber) } },
    views: [{ state: 'frozen', xSplit: 1, ySplit: 4, topLeftCell: 'B5', activeCell: 'B5', showGridLines: false, zoomScale: 90 }],
  });
  wsD.columns = [8, 38, 20, 16, 44, 20].map((width) => ({ width }));
  banner(
    wsD,
    6,
    `${church}  •  REGISTRO HISTÓRICO DE ATAS E DOCUMENTOS OFICIAIS`,
    `Emitido em ${issuedStr}   •   Livro de Atas e Registros da Secretaria`
  );

  headerRow(wsD, 4, 1, ['ITEM', 'TÍTULO DO DOCUMENTO / ATA', 'CATEGORIA', 'DATA REGISTRO', 'DESCRIÇÃO / CONTEÚDO SÍNTESE', 'FORMATO / STATUS']);
  wsD.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: 6 } };

  if (documents.length === 0) {
    block(wsD, 5, 1, 5, 6, 'Nenhuma ata ou documento oficial arquivado ainda.', { italic: true, color: C.slate500, h: 'center', border: 'thin' });
  }

  documents.forEach((doc, idx) => {
    const r = 5 + idx;
    const bg = idx % 2 === 0 ? C.white : C.slate50;
    wsD.getRow(r).height = 20;

    cell(wsD, r, 1, idx + 1, { bg, h: 'center', border: 'thin', color: C.slate500 });
    cell(wsD, r, 2, doc.title || 'Documento Oficial', { bg, bold: true, border: 'thin' });
    cell(wsD, r, 3, String(doc.category || 'Secretaria').toUpperCase(), { bg, h: 'center', border: 'thin', bold: true });
    cell(wsD, r, 4, toDate(doc.created_at), { bg, h: 'center', numFmt: DATE, border: 'thin' });
    cell(wsD, r, 5, doc.description || 'Registro arquivado na secretaria.', { bg, border: 'thin' });
    cell(wsD, r, 6, doc.file_type || 'Texto / Ata', { bg, h: 'center', border: 'thin', color: C.slate500 });
  });

  setupPrint(wsD);

  return wb;
}

export async function buildAdministrativeDashboardBuffer(input: AdministrativeDashboardInput): Promise<ArrayBuffer> {
  const wb = await buildAdministrativeDashboardWorkbook(input);
  return wb.xlsx.writeBuffer();
}
