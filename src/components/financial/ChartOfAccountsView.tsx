import React, { useState } from 'react';
import {
  ChartCategory,
  DEFAULT_CHART_CATEGORIES,
  financialManagementService,
} from '@/services/financial-management.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Download,
  RotateCcw,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  FileSpreadsheet,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx-js-style';
import { saveAs } from 'file-saver';

const getXLSX = () => XLSX;

interface ChartOfAccountsViewProps {
  churchId: string;
  churchName?: string;
  categories: ChartCategory[];
  onRefresh: () => void;
}

export function ChartOfAccountsView({
  churchId,
  churchName = 'Igreja Local',
  categories,
  onRefresh,
}: ChartOfAccountsViewProps) {
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'receita' | 'despesa'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ChartCategory | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'receita' | 'despesa'>('receita');
  const [group, setGroup] = useState('');
  const [description, setDescription] = useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filteredCategories = categories.filter((c) => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const codeMatch = c.code.toLowerCase().includes(q);
      const nameMatch = c.name.toLowerCase().includes(q);
      const groupMatch = c.group.toLowerCase().includes(q);
      if (!codeMatch && !nameMatch && !groupMatch) return false;
    }
    return true;
  });

  const openNewModal = () => {
    setEditingCategory(null);
    setCode('');
    setName('');
    setType('receita');
    setGroup('Dízimos e Ofertas');
    setDescription('');
    setModalOpen(true);
  };

  const openEditModal = (cat: ChartCategory) => {
    setEditingCategory(cat);
    setCode(cat.code);
    setName(cat.name);
    setType(cat.type);
    setGroup(cat.group);
    setDescription(cat.description || '');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    financialManagementService.saveChartCategory(churchId, {
      id: editingCategory ? editingCategory.id : undefined,
      code,
      name,
      type,
      group,
      description,
    });

    toast({
      title: editingCategory ? 'Categoria atualizada' : 'Nova categoria adicionada ao Plano',
    });
    setModalOpen(false);
    onRefresh();
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria do plano de contas?')) return;
    financialManagementService.deleteChartCategory(churchId, id);
    toast({ title: 'Categoria excluída com sucesso.' });
    onRefresh();
  };

  const handleResetToDefault = () => {
    if (
      window.confirm(
        'Deseja restaurar as categorias padrão para igrejas? Suas categorias customizadas serão substituídas.'
      )
    ) {
      financialManagementService.resetChartOfAccounts(churchId);
      toast({ title: 'Plano de contas padrão restaurado!' });
      onRefresh();
    }
  };

  // EXPORTAÇÃO PROFISSIONAL EM EXCEL COM CONGELAMENTO DE PAINÉIS, ESTILIZAÇÃO COMPLETA E MULTI-ABAS
  const handleExportProfessionalExcel = () => {
    try {
      const xlsx = getXLSX();
      const wb = xlsx.utils.book_new();
      const issueDate = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
      const fontName = 'Segoe UI';

      // Definições de Estilo Profissional
      const borderThin = {
        top: { style: 'thin', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
        left: { style: 'thin', color: { rgb: 'CBD5E1' } },
        right: { style: 'thin', color: { rgb: 'CBD5E1' } },
      };

      const titleStyle = (bg = '1E3A8A') => ({
        font: { name: fontName, sz: 14, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: bg } },
        alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
      });

      const subtitleStyle = (bg = 'F1F5F9', color = '334155') => ({
        font: { name: fontName, sz: 9, italic: true, color: { rgb: color } },
        fill: { patternType: 'solid', fgColor: { rgb: bg } },
        alignment: { horizontal: 'left', vertical: 'center', indent: 1 },
      });

      const headerStyle = (bg = '0F172A') => ({
        font: { name: fontName, sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
        fill: { patternType: 'solid', fgColor: { rgb: bg } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: borderThin,
      });

      const cellCodeStyle = (bg = 'FFFFFF') => ({
        font: { name: fontName, sz: 10, bold: true, color: { rgb: '0F172A' } },
        fill: { patternType: 'solid', fgColor: { rgb: bg } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin,
      });

      const cellTextStyle = (bg = 'FFFFFF', bold = false, align: 'left' | 'center' = 'left') => ({
        font: { name: fontName, sz: 9.5, bold, color: { rgb: '1E293B' } },
        fill: { patternType: 'solid', fgColor: { rgb: bg } },
        alignment: { horizontal: align, vertical: 'center', wrapText: true },
        border: borderThin,
      });

      const badgeReceitaStyle = () => ({
        font: { name: fontName, sz: 9.5, bold: true, color: { rgb: '15803D' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'DCFCE7' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin,
      });

      const badgeDespesaStyle = () => ({
        font: { name: fontName, sz: 9.5, bold: true, color: { rgb: 'B91C1C' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'FEE2E2' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderThin,
      });

      // Função geradora de aba profissional com Congelamento de Painéis
      const buildSheet = (
        sheetTitle: string,
        themeColor: string,
        themeLightColor: string,
        items: ChartCategory[]
      ) => {
        const headers = [
          'CÓDIGO',
          'TIPO',
          'GRUPO CONTÁBIL',
          'NOME DA CATEGORIA',
          'FINALIDADE / OBSERVAÇÕES',
          'NATUREZA'
        ];

        // Linhas brutas da matriz
        const aoa: any[][] = [
          [`${churchName.toUpperCase()} — ${sheetTitle.toUpperCase()}`],
          [`Emissão Oficial: ${issueDate} • Gestão Financeira Eclesiástica • Total de Contas: ${items.length}`],
          headers,
        ];

        items.forEach((c) => {
          aoa.push([
            c.code,
            c.type === 'receita' ? 'RECEITA (ENTRADA)' : 'DESPESA (SAÍDA)',
            c.group,
            c.name,
            c.description || 'Movimentação padrão do plano eclesiástico',
            c.type === 'receita' ? 'Crédito' : 'Débito'
          ]);
        });

        const ws = xlsx.utils.aoa_to_sheet(aoa);

        // Mesclar Linhas de Título (Colunas A até F)
        ws['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
          { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
        ];

        // CONGELAMENTO DE PAINÉIS (FREEZE PANES) PERFEITO
        // Congela as 3 primeiras linhas (Título + Subtítulo + Cabeçalho da tabela)
        // E congela a coluna A (Código Contábil) para manter visibilidade fixa ao rolar
        ws['!views'] = [
          {
            state: 'frozen',
            ySplit: 3,
            xSplit: 1,
            topLeftCell: 'B4',
            activePane: 'bottomRight',
          },
        ];
        ws['!freeze'] = {
          state: 'frozen',
          ySplit: 3,
          xSplit: 1,
          topLeftCell: 'B4',
          activePane: 'bottomRight',
        };

        // Altura das Linhas (Row Heights)
        ws['!rows'] = [
          { hpt: 32 }, // Título
          { hpt: 20 }, // Subtítulo
          { hpt: 26 }, // Cabeçalho das Colunas
        ];

        // Largura das Colunas (!cols)
        ws['!cols'] = [
          { wch: 14 }, // Código (A)
          { wch: 22 }, // Tipo (B)
          { wch: 32 }, // Grupo (C)
          { wch: 38 }, // Nome Categoria (D)
          { wch: 48 }, // Observações (E)
          { wch: 16 }, // Natureza (F)
        ];

        // Estilizar Células de Título
        ws['A1'] = { v: aoa[0][0], s: titleStyle(themeColor) };
        ws['A2'] = { v: aoa[1][0], s: subtitleStyle(themeLightColor, themeColor) };

        // Estilizar Cabeçalhos de Colunas (Linha 3 -> índice 2)
        headers.forEach((h, colIdx) => {
          const cellRef = xlsx.utils.encode_cell({ r: 2, c: colIdx });
          ws[cellRef] = { v: h, s: headerStyle(themeColor) };
        });

        // Estilizar Linhas de Dados (Linha 4 em diante) com Zebrado Suave
        items.forEach((item, rowIdx) => {
          const r = rowIdx + 3;
          const isEven = rowIdx % 2 === 0;
          const rowBg = isEven ? 'FFFFFF' : 'F8FAFC';

          // A: Código
          const cellA = xlsx.utils.encode_cell({ r, c: 0 });
          ws[cellA] = { v: item.code, s: cellCodeStyle(rowBg) };

          // B: Tipo
          const cellB = xlsx.utils.encode_cell({ r, c: 1 });
          const isReceita = item.type === 'receita';
          ws[cellB] = {
            v: isReceita ? 'RECEITA (ENTRADA)' : 'DESPESA (SAÍDA)',
            s: isReceita ? badgeReceitaStyle() : badgeDespesaStyle(),
          };

          // C: Grupo Contábil
          const cellC = xlsx.utils.encode_cell({ r, c: 2 });
          ws[cellC] = { v: item.group, s: cellTextStyle(rowBg, true) };

          // D: Nome da Categoria
          const cellD = xlsx.utils.encode_cell({ r, c: 3 });
          ws[cellD] = { v: item.name, s: cellTextStyle(rowBg, true) };

          // E: Observações
          const cellE = xlsx.utils.encode_cell({ r, c: 4 });
          ws[cellE] = {
            v: item.description || 'Movimentação padrão do plano eclesiástico',
            s: cellTextStyle(rowBg, false),
          };

          // F: Natureza
          const cellF = xlsx.utils.encode_cell({ r, c: 5 });
          ws[cellF] = {
            v: isReceita ? 'Crédito' : 'Débito',
            s: cellTextStyle(rowBg, false, 'center'),
          };
        });

        return ws;
      };

      // 1. ABA GERAL: Plano de Contas Completo (Azul Marinho)
      const wsGeral = buildSheet(
        'Plano de Contas Eclesiástico Geral',
        '1E3A8A', // Navy Blue
        'E0E7FF',
        categories
      );
      xlsx.utils.book_append_sheet(wb, wsGeral, '📑 Plano Geral');

      // 2. ABA RECEITAS: Somente Receitas (Verde Floresta)
      const receitas = categories.filter((c) => c.type === 'receita');
      const wsReceitas = buildSheet(
        'Plano de Contas — Receitas (Entradas)',
        '15803D', // Forest Green
        'DCFCE7',
        receitas
      );
      xlsx.utils.book_append_sheet(wb, wsReceitas, '🟢 Receitas (1.00)');

      // 3. ABA DESPESAS: Somente Despesas (Vermelho / Vinho Nobre)
      const despesas = categories.filter((c) => c.type === 'despesa');
      const wsDespesas = buildSheet(
        'Plano de Contas — Despesas (Saídas)',
        '991B1B', // Deep Red
        'FEE2E2',
        despesas
      );
      xlsx.utils.book_append_sheet(wb, wsDespesas, '🔴 Despesas (2.00)');

      // 4. ABA RESUMO: Síntese por Grupos Contábeis
      const gruposMap: Record<string, { tipo: string; count: number; categorias: string[] }> = {};
      categories.forEach((c) => {
        if (!gruposMap[c.group]) {
          gruposMap[c.group] = {
            tipo: c.type === 'receita' ? 'Receitas' : 'Despesas',
            count: 0,
            categorias: [],
          };
        }
        gruposMap[c.group].count += 1;
        gruposMap[c.group].categorias.push(c.name);
      });

      const resumoRows: any[][] = [
        [`${churchName.toUpperCase()} — SÍNTESE POR GRUPOS CONTÁBEIS`],
        [`Consolidação estrutural dos grupos • Total de Grupos: ${Object.keys(gruposMap).length}`],
        ['GRUPO CONTÁBIL', 'TIPO PREDOMINANTE', 'QTD. CATEGORIAS', 'EXEMPLO DE CONTAS'],
      ];

      Object.entries(gruposMap).forEach(([gName, gInfo]) => {
        resumoRows.push([
          gName,
          gInfo.tipo,
          gInfo.count,
          gInfo.categorias.slice(0, 3).join(', ') + (gInfo.categorias.length > 3 ? '...' : ''),
        ]);
      });

      const wsResumo = xlsx.utils.aoa_to_sheet(resumoRows);
      wsResumo['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
      ];
      wsResumo['!views'] = [{ state: 'frozen', ySplit: 3, xSplit: 0, topLeftCell: 'A4' }];
      wsResumo['!freeze'] = { state: 'frozen', ySplit: 3, xSplit: 0, topLeftCell: 'A4' };
      wsResumo['!cols'] = [{ wch: 34 }, { wch: 22 }, { wch: 18 }, { wch: 55 }];
      wsResumo['A1'] = { v: resumoRows[0][0], s: titleStyle('334155') };
      wsResumo['A2'] = { v: resumoRows[1][0], s: subtitleStyle('F1F5F9', '334155') };
      ['GRUPO CONTÁBIL', 'TIPO PREDOMINANTE', 'QTD. CATEGORIAS', 'EXEMPLO DE CONTAS'].forEach((h, i) => {
        wsResumo[xlsx.utils.encode_cell({ r: 2, c: i })] = { v: h, s: headerStyle('334155') };
      });
      Object.keys(gruposMap).forEach((_, rIdx) => {
        const r = rIdx + 3;
        const bg = rIdx % 2 === 0 ? 'FFFFFF' : 'F8FAFC';
        wsResumo[xlsx.utils.encode_cell({ r, c: 0 })] = { v: resumoRows[r][0], s: cellTextStyle(bg, true) };
        wsResumo[xlsx.utils.encode_cell({ r, c: 1 })] = { v: resumoRows[r][1], s: cellTextStyle(bg, false, 'center') };
        wsResumo[xlsx.utils.encode_cell({ r, c: 2 })] = { v: resumoRows[r][2], s: cellCodeStyle(bg) };
        wsResumo[xlsx.utils.encode_cell({ r, c: 3 })] = { v: resumoRows[r][3], s: cellTextStyle(bg, false) };
      });
      xlsx.utils.book_append_sheet(wb, wsResumo, '📊 Resumo por Grupos');

      // Gerar buffer e disparar download direto no navegador via saveAs (Blob)
      const excelBuffer = xlsx.write(wb, {
        bookType: 'xlsx',
        type: 'array',
        cellStyles: true,
      });

      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      });

      const filename = `Plano_de_Contas_Profissional_${churchName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      saveAs(blob, filename);

      toast({
        title: '📊 Planilha Profissional Gerada!',
        description: 'Relatório Excel exportado com congelamento de painéis, abas executivas e layout profissional.',
      });
    } catch (err: any) {
      console.error('Erro ao gerar Excel profissional:', err);
      toast({
        title: 'Erro na exportação',
        description: err?.message || 'Falha ao gerar planilha Excel.',
        variant: 'destructive',
      });
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const xlsx = getXLSX();
        const data = evt.target?.result;
        const workbook = xlsx.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json: any[] = xlsx.utils.sheet_to_json(sheet);

        if (json.length === 0) {
          toast({ title: 'Planilha vazia', variant: 'destructive' });
          return;
        }

        const imported: ChartCategory[] = json.map((row, idx) => ({
          id: `imp-${Date.now()}-${idx}`,
          code: row['Código'] || row['Codigo'] || `${idx + 1}`,
          name: row['Nome da Categoria'] || row['Nome'] || row['Categoria'] || `Categoria ${idx + 1}`,
          type: (row['Tipo'] || '').toLowerCase().includes('rec') ? 'receita' : 'despesa',
          group: row['Grupo'] || row['Grupo Contábil'] || 'Geral',
          description: row['Descrição'] || row['Finalidade / Observações'] || '',
          is_custom: true,
        }));

        financialManagementService.importChartOfAccounts(churchId, imported);
        toast({ title: 'Importação concluída!', description: `${imported.length} categorias importadas.` });
        onRefresh();
      } catch (err: any) {
        toast({ title: 'Erro ao importar', description: err.message, variant: 'destructive' });
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner do Plano de Contas */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Plano de Contas Eclesiástico</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Categorização estruturada de receitas e despesas específica para a rotina eclesiástica.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* BOTÃO PRO: RELATÓRIO EXCEL PROFISSIONAL COM CONGELAMENTO DE COLUNAS E CABEÇALHOS */}
          <Button
            onClick={handleExportProfessionalExcel}
            className="text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-all"
            title="Exportar Planilha Excel Profissional com Congelamento de Painéis e Formatação Executiva"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-100" />
            <span>Relatório Excel Profissional</span>
            <span className="bg-emerald-800 text-emerald-100 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              PRO
            </span>
          </Button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs gap-1.5"
            title="Importar planilha de plano de contas"
          >
            <Upload className="h-3.5 w-3.5" /> Importar
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetToDefault}
            className="text-xs gap-1.5 text-muted-foreground"
            title="Restaurar categorias padrão da igreja"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Padrão
          </Button>

          <Button size="sm" onClick={openNewModal} className="text-xs gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Nova Categoria
          </Button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar categoria, código ou grupo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-muted rounded-xl">
            <Button
              type="button"
              variant={typeFilter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter('all')}
              className="text-xs h-7"
            >
              Todas ({categories.length})
            </Button>
            <Button
              type="button"
              variant={typeFilter === 'receita' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter('receita')}
              className="text-xs h-7"
            >
              Receitas ({categories.filter((c) => c.type === 'receita').length})
            </Button>
            <Button
              type="button"
              variant={typeFilter === 'despesa' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter('despesa')}
              className="text-xs h-7"
            >
              Despesas ({categories.filter((c) => c.type === 'despesa').length})
            </Button>
          </div>
        </div>
      </div>

      {/* Grade do Plano de Contas */}
      <Card className="rounded-2xl border-border">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-xs">
                <TableHead className="w-20">Código</TableHead>
                <TableHead className="w-28">Tipo</TableHead>
                <TableHead>Grupo Contábil</TableHead>
                <TableHead>Nome da Categoria</TableHead>
                <TableHead className="text-right w-20">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((c) => (
                <TableRow key={c.id} className="text-xs hover:bg-muted/30">
                  <TableCell className="font-mono font-semibold text-muted-foreground">
                    {c.code}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] gap-1 ${
                        c.type === 'receita'
                          ? 'border-emerald-500 text-emerald-600 bg-emerald-500/10'
                          : 'border-rose-500 text-rose-600 bg-rose-500/10'
                      }`}
                    >
                      {c.type === 'receita' ? (
                        <ArrowUpCircle className="h-3 w-3" />
                      ) : (
                        <ArrowDownCircle className="h-3 w-3" />
                      )}
                      {c.type === 'receita' ? 'Receita' : 'Despesa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-muted-foreground">{c.group}</TableCell>
                  <TableCell className="font-bold text-foreground">{c.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(c)}
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c.id)}
                        className="h-6 w-6 text-muted-foreground hover:text-rose-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Nova/Editar Categoria */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FolderTree className="h-5 w-5 text-primary" />
              {editingCategory ? 'Editar Categoria do Plano' : 'Nova Categoria no Plano de Contas'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tipo</Label>
                <Select value={type} onValueChange={(v: any) => setType(v)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Código (Ex: 1.15, 2.20)</Label>
                <Input
                  placeholder="Automático ou livre"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nome da Categoria *</Label>
              <Input
                placeholder="Ex: Oferta de Ação de Graças, Manutenção de Instrumentos..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Grupo Contábil</Label>
              <Input
                placeholder="Ex: Dízimos e Ofertas, Departamentos, Utilidades..."
                value={group}
                onChange={(e) => setGroup(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Observações / Descrição</Label>
              <Input
                placeholder="Finalidade desta categoria..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar Categoria</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
