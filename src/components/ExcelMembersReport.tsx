import { useState } from 'react';
import { FileSpreadsheet, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSXStyle from 'xlsx-js-style';
import * as XLSXBase from 'xlsx';
import { saveAs } from 'file-saver';
import { membersService } from '@/services/members.service';
import { churchesService } from '@/services/churches.service';
import { extractExtendedFields } from '@/lib/memberUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Resolver biblioteca XLSX de forma resiliente tanto para bundlers Vite ESM quanto para CJS
const getXLSX = () => {
  const mod: any = XLSXStyle;
  if (mod?.utils?.book_new) return mod;
  if (mod?.default?.utils?.book_new) return mod.default;
  if ((XLSXBase as any)?.utils?.book_new) return XLSXBase;
  if ((XLSXBase as any)?.default?.utils?.book_new) return (XLSXBase as any).default;
  return mod?.default || mod;
};

interface ExcelMembersButtonProps {
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  label?: string;
}

export function ExcelMembersButton({
  disabled,
  variant = 'outline',
  size = 'default',
  className = '',
  label = 'Exportar Rol Excel',
}: ExcelMembersButtonProps) {
  const { toast } = useToast();
  const { user, churchId: contextChurchId } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const effectiveChurchId = contextChurchId || user?.churchId;
      if (!effectiveChurchId) {
        toast({ title: 'Erro', description: 'Igreja não identificada.', variant: 'destructive' });
        return;
      }

      toast({ title: '📊 Preparando Planilha...', description: 'Coletando dados do Rol de Membros e Congregados.' });

      // Buscar informações da igreja
      let churchName = 'Igreja';
      let pastorName = '';
      try {
        const church = await churchesService.getById(effectiveChurchId);
        if (church?.name) churchName = church.name;
        if (church?.pastor_name) pastorName = church.pastor_name;
      } catch (e) {
        console.warn('Erro ao buscar dados da igreja:', e);
      }

      // Buscar membros
      const dbMembers = await membersService.getAll(effectiveChurchId);

      if (!dbMembers || dbMembers.length === 0) {
        toast({
          title: 'Rol Vazio',
          description: 'Nenhum membro ou congregado cadastrado para exportar.',
          variant: 'destructive',
        });
        return;
      }

      const xlsx = getXLSX();
      const wb = xlsx.utils.book_new();

      const fontName = 'Calibri';
      const issueDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

      // Estilos executivos
      const borderThin = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } },
      };

      const titleStyle = (bg: string) => ({
        font: { name: fontName, sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: bg } },
        alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
      });

      const subtitleStyle = (bg: string, textColor: string) => ({
        font: { name: fontName, sz: 10, italic: true, bold: true, color: { rgb: textColor } },
        fill: { patternType: 'solid', fgColor: { rgb: bg } },
        alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
      });

      const headerStyle = (bg: string) => ({
        font: { name: fontName, sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: bg } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: borderThin,
      });

      const cellTextStyle = (bg = 'FFFFFF', bold = false, align: 'left' | 'center' | 'right' = 'left') => ({
        font: { name: fontName, sz: 9.5, bold, color: { rgb: '1E293B' } },
        fill: { patternType: 'solid', fgColor: { rgb: bg } },
        alignment: { horizontal: align, vertical: 'center', wrapText: true },
        border: borderThin,
      });

      const badgeMembroStyle = () => ({
        font: { name: fontName, sz: 9, bold: true, color: { rgb: '15803D' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'DCFCE7' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin,
      });

      const badgeCongregadoStyle = () => ({
        font: { name: fontName, sz: 9, bold: true, color: { rgb: '1D4ED8' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'DBEAFE' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin,
      });

      const headers = [
        '#',
        'NOME COMPLETO',
        'CATEGORIA',
        'CARGO / FUNÇÃO',
        'TELEFONE / WHATSAPP',
        'E-MAIL',
        'CPF',
        'RG',
        'DATA NASCIMENTO',
        'DATA BATISMO',
        'ESTADO CIVIL',
        'GÊNERO',
        'ENDEREÇO COMPLETO',
        'NOME DA MÃE',
        'NOME DO PAI',
        'STATUS',
      ];

      const formatDateSafe = (d: any) => {
        if (!d) return '-';
        try {
          const dt = new Date(d);
          if (isNaN(dt.getTime())) return String(d);
          return format(dt, 'dd/MM/yyyy');
        } catch {
          return String(d);
        }
      };

      // Gerador de aba profissional com Congelamento de Painéis
      const buildSheet = (
        sheetTitle: string,
        themeColor: string,
        themeLightColor: string,
        membersList: any[]
      ) => {
        const aoa: any[][] = [
          [`${churchName.toUpperCase()} — ${sheetTitle.toUpperCase()}`],
          [`Emissão Oficial: ${issueDate} • Gestão Eclesiástica • Total de Registros: ${membersList.length}${pastorName ? ` • Pastor: ${pastorName}` : ''}`],
          headers,
        ];

        membersList.forEach((m, idx) => {
          const ext = extractExtendedFields(m);
          const isCongregado = m.status === 'visitante' || (m as any).category === 'congregado';

          aoa.push([
            idx + 1,
            String(m.name || '').toUpperCase(),
            isCongregado ? 'CONGREGADO' : 'MEMBRO',
            ext.role || (isCongregado ? 'Congregado' : 'Membro'),
            m.phone || '-',
            m.email || '-',
            ext.cpf || '-',
            ext.rg || '-',
            formatDateSafe(m.birth_date),
            formatDateSafe(ext.baptismDate || m.baptism_date),
            m.marital_status ? String(m.marital_status).toUpperCase() : '-',
            ext.gender ? String(ext.gender).toUpperCase() : m.gender ? String(m.gender).toUpperCase() : '-',
            m.address || '-',
            ext.motherName || '-',
            ext.fatherName || '-',
            m.status ? String(m.status).toUpperCase() : 'ATIVO',
          ]);
        });

        const ws = xlsx.utils.aoa_to_sheet(aoa);

        // Mesclar Linhas de Título (Colunas A até P)
        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
        ];

        // CONGELAMENTO DE PAINÉIS (FREEZE PANES) PERFEITO
        // Congela as 3 primeiras linhas (títulos + cabeçalho)
        // E congela as colunas A e B (# e Nome do Membro) para visibilidade ao rolar horizontalmente
        ws['!views'] = [
          {
            state: 'frozen',
            ySplit: 3,
            xSplit: 2,
            topLeftCell: 'C4',
            activePane: 'bottomRight',
          },
        ];
        ws['!freeze'] = {
          state: 'frozen',
          ySplit: 3,
          xSplit: 2,
          topLeftCell: 'C4',
          activePane: 'bottomRight',
        };

        // Altura das Linhas
        ws['!rows'] = [
          { hpt: 32 }, // Título
          { hpt: 20 }, // Subtítulo
          { hpt: 26 }, // Cabeçalho
        ];

        // Largura das Colunas
        ws['!cols'] = [
          { wch: 6 },  // #
          { wch: 38 }, // Nome
          { wch: 16 }, // Categoria
          { wch: 20 }, // Cargo
          { wch: 18 }, // Telefone
          { wch: 28 }, // Email
          { wch: 16 }, // CPF
          { wch: 14 }, // RG
          { wch: 15 }, // Nascimento
          { wch: 15 }, // Batismo
          { wch: 15 }, // Estado Civil
          { wch: 13 }, // Gênero
          { wch: 35 }, // Endereço
          { wch: 25 }, // Mãe
          { wch: 25 }, // Pai
          { wch: 12 }, // Status
        ];

        // Estilizar Título e Subtítulo
        ws['A1'] = { v: aoa[0][0], s: titleStyle(themeColor) };
        ws['A2'] = { v: aoa[1][0], s: subtitleStyle(themeLightColor, themeColor) };

        // Estilizar Cabeçalhos
        headers.forEach((h, colIdx) => {
          const cellRef = xlsx.utils.encode_cell({ r: 2, c: colIdx });
          ws[cellRef] = { v: h, s: headerStyle(themeColor) };
        });

        // Estilizar Dados
        membersList.forEach((m, rowIdx) => {
          const r = rowIdx + 3;
          const isEven = rowIdx % 2 === 0;
          const rowBg = isEven ? 'FFFFFF' : 'F8FAFC';
          const isCongregado = m.status === 'visitante' || (m as any).category === 'congregado';

          headers.forEach((_, cIdx) => {
            const cellRef = xlsx.utils.encode_cell({ r, c: cIdx });
            const val = aoa[r][cIdx];

            if (cIdx === 0) {
              ws[cellRef] = { v: val, s: cellTextStyle(rowBg, true, 'center') };
            } else if (cIdx === 1) {
              ws[cellRef] = { v: val, s: cellTextStyle(rowBg, true, 'left') };
            } else if (cIdx === 2) {
              ws[cellRef] = {
                v: val,
                s: isCongregado ? badgeCongregadoStyle() : badgeMembroStyle(),
              };
            } else if ([8, 9, 10, 11, 15].includes(cIdx)) {
              ws[cellRef] = { v: val, s: cellTextStyle(rowBg, false, 'center') };
            } else {
              ws[cellRef] = { v: val, s: cellTextStyle(rowBg, false, 'left') };
            }
          });
        });

        return ws;
      };

      // 1. ABA 1: Rol Geral (Azul Marinho)
      const wsGeral = buildSheet(
        'Rol Geral de Membros e Congregados',
        '1E3A8A', // Navy
        'E0E7FF',
        dbMembers
      );
      xlsx.utils.book_append_sheet(wb, wsGeral, '👥 Rol Geral');

      // 2. ABA 2: Membros (Verde Floresta)
      const membrosOnly = dbMembers.filter(
        (m: any) => m.status !== 'visitante' && (m as any).category !== 'congregado'
      );
      const wsMembros = buildSheet(
        'Rol Oficial de Membros',
        '15803D', // Forest Green
        'DCFCE7',
        membrosOnly
      );
      xlsx.utils.book_append_sheet(wb, wsMembros, '🟢 Membros');

      // 3. ABA 3: Congregados e Visitantes (Azul Cobalto)
      const congregadosOnly = dbMembers.filter(
        (m: any) => m.status === 'visitante' || (m as any).category === 'congregado'
      );
      const wsCongregados = buildSheet(
        'Rol de Congregados e Visitantes',
        '2563EB', // Cobalt Blue
        'DBEAFE',
        congregadosOnly
      );
      xlsx.utils.book_append_sheet(wb, wsCongregados, '🔵 Congregados');

      // 4. ABA 4: Síntese e Estatísticas (Cinza Grafite Nobre)
      const resumoRows: any[][] = [
        [`${churchName.toUpperCase()} — SÍNTESE DEMOGRÁFICA DO ROL`],
        [`Consolidação Geral dos Registros • Data: ${issueDate}`],
        ['INDICADOR / SEGMENTAÇÃO', 'QUANTIDADE', 'PERCENTUAL (%)'],
        ['Total Geral de Cadastrados', dbMembers.length, '100%'],
        ['Membros Oficiais em Comunhão', membrosOnly.length, `${((membrosOnly.length / (dbMembers.length || 1)) * 100).toFixed(1)}%`],
        ['Congregados e Visitantes', congregadosOnly.length, `${((congregadosOnly.length / (dbMembers.length || 1)) * 100).toFixed(1)}%`],
        ['Batizados', dbMembers.filter((m: any) => m.baptized || m.baptism_date).length, `${((dbMembers.filter((m: any) => m.baptized || m.baptism_date).length / (dbMembers.length || 1)) * 100).toFixed(1)}%`],
      ];

      const wsResumo = xlsx.utils.aoa_to_sheet(resumoRows);
      wsResumo['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } },
      ];
      wsResumo['!views'] = [{ state: 'frozen', ySplit: 3, xSplit: 0, topLeftCell: 'A4' }];
      wsResumo['!freeze'] = { state: 'frozen', ySplit: 3, xSplit: 0, topLeftCell: 'A4' };
      wsResumo['!cols'] = [{ wch: 38 }, { wch: 18 }, { wch: 20 }];
      wsResumo['A1'] = { v: resumoRows[0][0], s: titleStyle('334155') };
      wsResumo['A2'] = { v: resumoRows[1][0], s: subtitleStyle('F1F5F9', '334155') };
      ['INDICADOR / SEGMENTAÇÃO', 'QUANTIDADE', 'PERCENTUAL (%)'].forEach((h, i) => {
        wsResumo[xlsx.utils.encode_cell({ r: 2, c: i })] = { v: h, s: headerStyle('334155') };
      });
      for (let rIdx = 3; rIdx < resumoRows.length; rIdx++) {
        const bg = rIdx % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
        wsResumo[xlsx.utils.encode_cell({ r: rIdx, c: 0 })] = { v: resumoRows[rIdx][0], s: cellTextStyle(bg, true) };
        wsResumo[xlsx.utils.encode_cell({ r: rIdx, c: 1 })] = { v: resumoRows[rIdx][1], s: cellTextStyle(bg, false, 'center') };
        wsResumo[xlsx.utils.encode_cell({ r: rIdx, c: 2 })] = { v: resumoRows[rIdx][2], s: cellTextStyle(bg, true, 'center') };
      }
      xlsx.utils.book_append_sheet(wb, wsResumo, '📊 Estatísticas');

      // Gerar buffer e download via saveAs (Blob)
      const excelBuffer = xlsx.write(wb, {
        bookType: 'xlsx',
        type: 'array',
        cellStyles: true,
      });

      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      });

      const safeName = churchName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Rol_de_Membros_${safeName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      saveAs(blob, filename);

      toast({
        title: '📊 Rol de Membros Exportado!',
        description: `Planilha Excel profissional com congelamento de painéis e ${dbMembers.length} registros gerada com sucesso.`,
      });
    } catch (error: any) {
      console.error('Erro ao exportar membros:', error);
      toast({
        title: 'Erro na exportação',
        description: error?.message || 'Falha ao exportar planilha de membros.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={disabled || loading}
      className={`gap-2 font-semibold ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
      ) : (
        <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      )}
      {label}
    </Button>
  );
}

export default ExcelMembersButton;
