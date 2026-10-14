import React, { useState } from 'react';
import { FileSpreadsheet, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ChartCategory } from '@/services/financial-management.service';
import * as XLSXStyleModule from 'xlsx-js-style';
import * as XLSXBaseModule from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

const getXLSX = () => {
  const mod: any = XLSXStyleModule;
  if (mod?.default?.utils?.book_new) return mod.default;
  if (mod?.utils?.book_new) return mod;
  if (mod?.default?.default?.utils?.book_new) return mod.default.default;

  const base: any = XLSXBaseModule;
  if (base?.default?.utils?.book_new) return base.default;
  if (base?.utils?.book_new) return base;
  if (base?.default?.default?.utils?.book_new) return base.default.default;

  return mod?.default || mod || base?.default || base;
};

interface ExcelChartOfAccountsProps {
  categories: ChartCategory[];
  churchName?: string;
  className?: string;
}

// Paleta de Cores Corporativas Eclesiásticas
const PALETTE = {
  NAVY_HEADER: '1A237E',   // Azul Marinho Imperial
  GREEN_HEADER: '065F46',  // Verde Esmeralda (Receitas)
  RED_HEADER: '831843',    // Vinho/Bordô (Despesas)
  GOLD_ACCENT: 'D97706',   // Dourado
  TEXT_MAIN: '0F172A',     // Texto Principal
  TEXT_MUTED: '475569',    // Texto Secundário
  BG_LIGHT: 'F8FAFC',      // Fundo suave
  BG_ZEBRA: 'F1F5F9',      // Linha alternada
  WHITE: 'FFFFFF',         // Branco puro
  BORDER: 'CBD5E1',        // Borda suave
  REC_BG: 'DCFCE7',        // Fundo badge receita
  REC_TEXT: '15803D',      // Texto badge receita
  DESP_BG: 'FEE2E2',       // Fundo badge despesa
  DESP_TEXT: 'B91C1C',     // Texto badge despesa
};

// Gerador de Estilos de Célula
const createTitleStyle = (bgColor: string) => ({
  font: { name: 'Calibri', bold: true, sz: 16, color: { rgb: PALETTE.WHITE } },
  fill: { patternType: 'solid', fgColor: { rgb: bgColor } },
  alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
});

const createSubtitleStyle = () => ({
  font: { name: 'Calibri', italic: true, sz: 10, color: { rgb: PALETTE.NAVY_HEADER } },
  fill: { patternType: 'solid', fgColor: { rgb: 'E0E7FF' } },
  alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
});

const createHeaderStyle = (bgColor: string) => ({
  font: { name: 'Calibri', bold: true, sz: 11, color: { rgb: PALETTE.WHITE } },
  fill: { patternType: 'solid', fgColor: { rgb: bgColor } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top: { style: 'medium', color: { rgb: PALETTE.WHITE } },
    bottom: { style: 'medium', color: { rgb: PALETTE.WHITE } },
    left: { style: 'thin', color: { rgb: 'E2E8F0' } },
    right: { style: 'thin', color: { rgb: 'E2E8F0' } },
  },
});

const createDataStyle = (
  bg: string,
  align: 'left' | 'center' | 'right' = 'left',
  isBold = false,
  textColor: string = PALETTE.TEXT_MAIN
) => ({
  font: { name: 'Calibri', sz: 10, bold: isBold, color: { rgb: textColor } },
  fill: { patternType: 'solid', fgColor: { rgb: bg } },
  alignment: { horizontal: align, vertical: 'center', wrapText: true },
  border: {
    top: { style: 'thin', color: { rgb: PALETTE.BORDER } },
    bottom: { style: 'thin', color: { rgb: PALETTE.BORDER } },
    left: { style: 'thin', color: { rgb: PALETTE.BORDER } },
    right: { style: 'thin', color: { rgb: PALETTE.BORDER } },
  },
});

function cell(v: any, s: any, t?: 's' | 'n') {
  const c: any = { v, s };
  if (t) c.t = t;
  return c;
}

export function ExcelChartOfAccountsReport({
  categories,
  churchName = 'IGREJA EVANGÉLICA',
  className = '',
}: ExcelChartOfAccountsProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExportProfessional = () => {
    try {
      setLoading(true);
      const xlsx = getXLSX();
      const wb = xlsx.utils.book_new();
      const dateNow = format(new Date(), 'dd/MM/yyyy HH:mm');
      const filenameDate = format(new Date(), 'dd-MM-yyyy');

      const receitas = categories.filter((c) => c.type === 'receita');
      const despesas = categories.filter((c) => c.type === 'despesa');

      // =========================================================================
      // ABA 1: PLANO DE CONTAS GERAL (CONGELAMENTO DE COLUNAS E LINHAS)
      // =========================================================================
      const headersGeral = [
        'CÓDIGO CONTÁBIL',
        'TIPO',
        'GRUPO CONTÁBIL',
        'NOME DA CONTA / CATEGORIA',
        'NATUREZA',
        'CLASSIFICAÇÃO',
        'DESCRIÇÃO / FINALIDADE',
      ];

      const rowsGeral: any[][] = [];

      // Linha 1: Título Executivo
      rowsGeral.push([`${churchName.toUpperCase()} — PLANO DE CONTAS ECLESIÁSTICO`]);
      // Linha 2: Metadados e Resumo
      rowsGeral.push([
        `Relatório Oficial emitido em: ${dateNow} | Total: ${categories.length} Contas (${receitas.length} Receitas, ${despesas.length} Despesas) | Painéis Congelados nas Colunas A e B`,
      ]);
      // Linha 3: Espaço visual
      rowsGeral.push([]);
      // Linha 4: Cabeçalho das Colunas (Índice 3 na base 0)
      rowsGeral.push(headersGeral);

      // Linhas de Dados
      categories.forEach((cat) => {
        rowsGeral.push([
          cat.code,
          cat.type === 'receita' ? 'RECEITA' : 'DESPESA',
          cat.group,
          cat.name,
          cat.type === 'receita' ? 'CRÉDITO (C)' : 'DÉBITO (D)',
          cat.code.split('.').length > 1 ? 'ANALÍTICA' : 'SINTÉTICA',
          cat.description || 'Conta padrão da rotina eclesiástica',
        ]);
      });

      const wsGeral = xlsx.utils.aoa_to_sheet(rowsGeral);

      // Merges do Título e Subtítulo
      wsGeral['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
      ];

      // Altura das Linhas (Row heights)
      wsGeral['!rows'] = [
        { hpt: 35 }, // Título
        { hpt: 20 }, // Subtítulo
        { hpt: 10 }, // Espaçador
        { hpt: 28 }, // Headers
      ];

      // Formatar Título e Subtítulo
      wsGeral['A1'] = cell(`${churchName.toUpperCase()} — PLANO DE CONTAS ECLESIÁSTICO`, createTitleStyle(PALETTE.NAVY_HEADER));
      wsGeral['A2'] = cell(rowsGeral[1][0], createSubtitleStyle());

      // Formatar Cabeçalhos
      headersGeral.forEach((_, colIdx) => {
        const ref = xlsx.utils.encode_cell({ r: 3, c: colIdx });
        wsGeral[ref] = cell(headersGeral[colIdx], createHeaderStyle(PALETTE.NAVY_HEADER));
      });

      // Formatar Células de Dados
      categories.forEach((cat, rIdx) => {
        const rowNum = rIdx + 4;
        const isZebra = rIdx % 2 === 1;
        const baseBg = isZebra ? PALETTE.BG_ZEBRA : PALETTE.WHITE;
        const isRec = cat.type === 'receita';

        // Coluna A: Código Contábil (Fixada / Congelada)
        const cellA = xlsx.utils.encode_cell({ r: rowNum, c: 0 });
        wsGeral[cellA] = cell(cat.code, createDataStyle(baseBg, 'center', true, PALETTE.NAVY_HEADER));

        // Coluna B: Tipo (Fixada / Congelada) com badge colorido
        const cellB = xlsx.utils.encode_cell({ r: rowNum, c: 1 });
        wsGeral[cellB] = cell(
          isRec ? 'RECEITA' : 'DESPESA',
          createDataStyle(isRec ? PALETTE.REC_BG : PALETTE.DESP_BG, 'center', true, isRec ? PALETTE.REC_TEXT : PALETTE.DESP_TEXT)
        );

        // Coluna C: Grupo Contábil
        const cellC = xlsx.utils.encode_cell({ r: rowNum, c: 2 });
        wsGeral[cellC] = cell(cat.group, createDataStyle(baseBg, 'left', true));

        // Coluna D: Nome da Conta
        const cellD = xlsx.utils.encode_cell({ r: rowNum, c: 3 });
        wsGeral[cellD] = cell(cat.name, createDataStyle(baseBg, 'left', false));

        // Coluna E: Natureza (Crédito / Débito)
        const cellE = xlsx.utils.encode_cell({ r: rowNum, c: 4 });
        wsGeral[cellE] = cell(isRec ? 'CRÉDITO (C)' : 'DÉBITO (D)', createDataStyle(baseBg, 'center'));

        // Coluna F: Classificação
        const cellF = xlsx.utils.encode_cell({ r: rowNum, c: 5 });
        wsGeral[cellF] = cell('ANALÍTICA', createDataStyle(baseBg, 'center'));

        // Coluna G: Descrição
        const cellG = xlsx.utils.encode_cell({ r: rowNum, c: 6 });
        wsGeral[cellG] = cell(cat.description || 'Rotina eclesiástica', createDataStyle(baseBg, 'left'));
      });

      // Larguras Profissionais das Colunas
      wsGeral['!cols'] = [
        { wch: 18 }, // A: Código
        { wch: 15 }, // B: Tipo
        { wch: 28 }, // C: Grupo
        { wch: 38 }, // D: Nome da Conta
        { wch: 16 }, // E: Natureza
        { wch: 16 }, // F: Classificação
        { wch: 45 }, // G: Descrição
      ];

      // =========================================================================
      // CONGELAMENTO DE PAINÉIS PROFISSIONAL (FREEZE PANES)
      // Congela as 2 primeiras colunas (A e B) e as 4 primeiras linhas (Cabeçalho)
      // Compatível simultaneamente com Microsoft Excel, LibreOffice e Google Sheets
      // =========================================================================
      wsGeral['!freeze'] = { xSplit: 2, ySplit: 4 };
      wsGeral['!views'] = [
        {
          state: 'frozen',
          xSplit: 2,
          ySplit: 4,
          topLeftCell: 'C5',
          activeCell: 'C5',
          showGridLines: true,
        },
      ];

      xlsx.utils.book_append_sheet(wb, wsGeral, 'Plano Geral');

      // =========================================================================
      // ABA 2: RECEITAS (Dízimos, Ofertas, Entradas)
      // =========================================================================
      const rowsRec: any[][] = [
        [`${churchName.toUpperCase()} — ESTRUTURA DE RECEITAS (DÍZIMOS E ENTRADAS)`],
        [`Total de Categorias de Entrada: ${receitas.length} | Atualizado em: ${dateNow}`],
        [],
        headersGeral,
      ];
      receitas.forEach((cat) => {
        rowsRec.push([
          cat.code,
          'RECEITA',
          cat.group,
          cat.name,
          'CRÉDITO (C)',
          'ANALÍTICA',
          cat.description || 'Receita eclesiástica',
        ]);
      });
      const wsRec = xlsx.utils.aoa_to_sheet(rowsRec);
      wsRec['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
      ];
      wsRec['!rows'] = [{ hpt: 35 }, { hpt: 20 }, { hpt: 10 }, { hpt: 28 }];
      wsRec['A1'] = cell(rowsRec[0][0], createTitleStyle(PALETTE.GREEN_HEADER));
      wsRec['A2'] = cell(rowsRec[1][0], createSubtitleStyle());
      headersGeral.forEach((_, colIdx) => {
        wsRec[xlsx.utils.encode_cell({ r: 3, c: colIdx })] = cell(headersGeral[colIdx], createHeaderStyle(PALETTE.GREEN_HEADER));
      });
      receitas.forEach((cat, rIdx) => {
        const rowNum = rIdx + 4;
        const isZebra = rIdx % 2 === 1;
        const bg = isZebra ? PALETTE.BG_ZEBRA : PALETTE.WHITE;
        wsRec[xlsx.utils.encode_cell({ r: rowNum, c: 0 })] = cell(cat.code, createDataStyle(bg, 'center', true, PALETTE.GREEN_HEADER));
        wsRec[xlsx.utils.encode_cell({ r: rowNum, c: 1 })] = cell('RECEITA', createDataStyle(PALETTE.REC_BG, 'center', true, PALETTE.REC_TEXT));
        wsRec[xlsx.utils.encode_cell({ r: rowNum, c: 2 })] = cell(cat.group, createDataStyle(bg, 'left', true));
        wsRec[xlsx.utils.encode_cell({ r: rowNum, c: 3 })] = cell(cat.name, createDataStyle(bg, 'left', false));
        wsRec[xlsx.utils.encode_cell({ r: rowNum, c: 4 })] = cell('CRÉDITO (C)', createDataStyle(bg, 'center'));
        wsRec[xlsx.utils.encode_cell({ r: rowNum, c: 5 })] = cell('ANALÍTICA', createDataStyle(bg, 'center'));
        wsRec[xlsx.utils.encode_cell({ r: rowNum, c: 6 })] = cell(cat.description || 'Receita eclesiástica', createDataStyle(bg, 'left'));
      });
      wsRec['!cols'] = wsGeral['!cols'];
      wsRec['!freeze'] = { xSplit: 2, ySplit: 4 };
      wsRec['!views'] = [{ state: 'frozen', xSplit: 2, ySplit: 4, topLeftCell: 'C5', showGridLines: true }];
      xlsx.utils.book_append_sheet(wb, wsRec, 'Receitas');

      // =========================================================================
      // ABA 3: DESPESAS (Manutenção, Custos, Ministérios)
      // =========================================================================
      const rowsDesp: any[][] = [
        [`${churchName.toUpperCase()} — ESTRUTURA DE DESPESAS (SAÍDAS E CUSTOS)`],
        [`Total de Categorias de Saída: ${despesas.length} | Atualizado em: ${dateNow}`],
        [],
        headersGeral,
      ];
      despesas.forEach((cat) => {
        rowsDesp.push([
          cat.code,
          'DESPESA',
          cat.group,
          cat.name,
          'DÉBITO (D)',
          'ANALÍTICA',
          cat.description || 'Despesa eclesiástica',
        ]);
      });
      const wsDesp = xlsx.utils.aoa_to_sheet(rowsDesp);
      wsDesp['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
      ];
      wsDesp['!rows'] = [{ hpt: 35 }, { hpt: 20 }, { hpt: 10 }, { hpt: 28 }];
      wsDesp['A1'] = cell(rowsDesp[0][0], createTitleStyle(PALETTE.RED_HEADER));
      wsDesp['A2'] = cell(rowsDesp[1][0], createSubtitleStyle());
      headersGeral.forEach((_, colIdx) => {
        wsDesp[xlsx.utils.encode_cell({ r: 3, c: colIdx })] = cell(headersGeral[colIdx], createHeaderStyle(PALETTE.RED_HEADER));
      });
      despesas.forEach((cat, rIdx) => {
        const rowNum = rIdx + 4;
        const isZebra = rIdx % 2 === 1;
        const bg = isZebra ? PALETTE.BG_ZEBRA : PALETTE.WHITE;
        wsDesp[xlsx.utils.encode_cell({ r: rowNum, c: 0 })] = cell(cat.code, createDataStyle(bg, 'center', true, PALETTE.RED_HEADER));
        wsDesp[xlsx.utils.encode_cell({ r: rowNum, c: 1 })] = cell('DESPESA', createDataStyle(PALETTE.DESP_BG, 'center', true, PALETTE.DESP_TEXT));
        wsDesp[xlsx.utils.encode_cell({ r: rowNum, c: 2 })] = cell(cat.group, createDataStyle(bg, 'left', true));
        wsDesp[xlsx.utils.encode_cell({ r: rowNum, c: 3 })] = cell(cat.name, createDataStyle(bg, 'left', false));
        wsDesp[xlsx.utils.encode_cell({ r: rowNum, c: 4 })] = cell('DÉBITO (D)', createDataStyle(bg, 'center'));
        wsDesp[xlsx.utils.encode_cell({ r: rowNum, c: 5 })] = cell('ANALÍTICA', createDataStyle(bg, 'center'));
        wsDesp[xlsx.utils.encode_cell({ r: rowNum, c: 6 })] = cell(cat.description || 'Despesa eclesiástica', createDataStyle(bg, 'left'));
      });
      wsDesp['!cols'] = wsGeral['!cols'];
      wsDesp['!freeze'] = { xSplit: 2, ySplit: 4 };
      wsDesp['!views'] = [{ state: 'frozen', xSplit: 2, ySplit: 4, topLeftCell: 'C5', showGridLines: true }];
      xlsx.utils.book_append_sheet(wb, wsDesp, 'Despesas');

      // =========================================================================
      // ABA 4: RESUMO SINTÉTICO POR GRUPOS
      // =========================================================================
      const groupMap: Record<string, { tipo: string; count: number; contas: string[] }> = {};
      categories.forEach((cat) => {
        if (!groupMap[cat.group]) {
          groupMap[cat.group] = {
            tipo: cat.type === 'receita' ? 'RECEITA' : 'DESPESA',
            count: 0,
            contas: [],
          };
        }
        groupMap[cat.group].count++;
        groupMap[cat.group].contas.push(cat.name);
      });

      const headersResumo = ['GRUPO CONTÁBIL', 'TIPO', 'TOTAL DE CONTAS', 'EXEMPLOS DE CONTAS DO GRUPO'];
      const rowsResumo: any[][] = [
        [`${churchName.toUpperCase()} — RESUMO SINTÉTICO POR GRUPOS`],
        [`Consolidação Contábil | Total de Grupos: ${Object.keys(groupMap).length}`],
        [],
        headersResumo,
      ];
      Object.entries(groupMap).forEach(([grp, data]) => {
        rowsResumo.push([grp, data.tipo, data.count, data.contas.slice(0, 3).join(', ') + (data.contas.length > 3 ? '...' : '')]);
      });
      const wsResumo = xlsx.utils.aoa_to_sheet(rowsResumo);
      wsResumo['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
      ];
      wsResumo['!rows'] = [{ hpt: 35 }, { hpt: 20 }, { hpt: 10 }, { hpt: 28 }];
      wsResumo['A1'] = cell(rowsResumo[0][0], createTitleStyle(PALETTE.NAVY_HEADER));
      wsResumo['A2'] = cell(rowsResumo[1][0], createSubtitleStyle());
      headersResumo.forEach((_, colIdx) => {
        wsResumo[xlsx.utils.encode_cell({ r: 3, c: colIdx })] = cell(headersResumo[colIdx], createHeaderStyle(PALETTE.NAVY_HEADER));
      });
      Object.entries(groupMap).forEach(([grp, data], rIdx) => {
        const rowNum = rIdx + 4;
        const bg = rIdx % 2 === 1 ? PALETTE.BG_ZEBRA : PALETTE.WHITE;
        const isRec = data.tipo === 'RECEITA';
        wsResumo[xlsx.utils.encode_cell({ r: rowNum, c: 0 })] = cell(grp, createDataStyle(bg, 'left', true));
        wsResumo[xlsx.utils.encode_cell({ r: rowNum, c: 1 })] = cell(
          data.tipo,
          createDataStyle(isRec ? PALETTE.REC_BG : PALETTE.DESP_BG, 'center', true, isRec ? PALETTE.REC_TEXT : PALETTE.DESP_TEXT)
        );
        wsResumo[xlsx.utils.encode_cell({ r: rowNum, c: 2 })] = cell(data.count, createDataStyle(bg, 'center', true), 'n');
        wsResumo[xlsx.utils.encode_cell({ r: rowNum, c: 3 })] = cell(data.contas.join('; '), createDataStyle(bg, 'left'));
      });
      wsResumo['!cols'] = [{ wch: 32 }, { wch: 15 }, { wch: 18 }, { wch: 55 }];
      wsResumo['!freeze'] = { xSplit: 1, ySplit: 4 };
      wsResumo['!views'] = [{ state: 'frozen', xSplit: 1, ySplit: 4, topLeftCell: 'B5', showGridLines: true }];
      xlsx.utils.book_append_sheet(wb, wsResumo, 'Resumo por Grupos');

      // Download da Planilha Excel
      const excelBuffer = xlsx.write(wb, {
        bookType: 'xlsx',
        type: 'array',
        cellStyles: true,
      });

      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      });

      saveAs(blob, `Plano_de_Contas_Profissional_${filenameDate}.xlsx`);

      toast({
        title: '📊 Planilha Profissional Gerada com Sucesso!',
        description: 'Excel formatado com colunas congeladas e abas executivas baixado com sucesso.',
      });
    } catch (err: any) {
      console.error('Erro ao gerar relatório Excel do plano de contas:', err);
      toast({
        title: 'Erro ao gerar Excel',
        description: err?.message || 'Falha ao processar o relatório profissional.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handleExportProfessional}
      disabled={loading}
      className={`bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-all text-xs gap-2 h-9 px-3 ${className}`}
      title="Baixar Relatório Excel Profissional com Congelamento de Painéis"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 text-emerald-100" />
      )}
      <span>Relatório Excel Profissional</span>
    </Button>
  );
}
export default ExcelChartOfAccountsReport;
