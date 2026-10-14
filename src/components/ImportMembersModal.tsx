import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  X,
  FileCheck,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSXBase from 'xlsx';
import * as XLSXStyle from 'xlsx-js-style';
import { saveAs } from 'file-saver';
import { membersService } from '@/services/members.service';
import { packExtendedFieldsToNotes } from '@/lib/memberUtils';

const getXLSX = () => {
  const mod: any = XLSXStyle;
  if (mod?.utils?.book_new) return mod;
  if (mod?.default?.utils?.book_new) return mod.default;
  if ((XLSXBase as any)?.utils?.book_new) return XLSXBase;
  if ((XLSXBase as any)?.default?.utils?.book_new) return (XLSXBase as any).default;
  return mod?.default || mod;
};

interface ParsedMemberRow {
  selected: boolean;
  name: string;
  category: 'membro' | 'congregado';
  phone?: string;
  email?: string;
  cpf?: string;
  rg?: string;
  birthDate?: string;
  baptismDate?: string;
  maritalStatus?: string;
  gender?: string;
  address?: string;
  role?: string;
  motherName?: string;
  fatherName?: string;
}

interface ImportMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchId: string;
  onSuccess: () => void;
}

export function ImportMembersModal({
  open,
  onOpenChange,
  churchId,
  onSuccess,
}: ImportMembersModalProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loadingFile, setLoadingFile] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedMemberRow[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Baixar Modelo de Planilha de Importação
  const handleDownloadTemplate = () => {
    try {
      const xlsx = getXLSX();
      const wb = xlsx.utils.book_new();

      const templateHeaders = [
        'NOME COMPLETO',
        'CATEGORIA (Membro ou Congregado)',
        'CARGO / FUNÇÃO',
        'TELEFONE / WHATSAPP',
        'E-MAIL',
        'CPF',
        'RG',
        'DATA NASCIMENTO (AAAA-MM-DD ou DD/MM/AAAA)',
        'DATA BATISMO',
        'ESTADO CIVIL (Casado, Solteiro, Divorciado, Viuvo)',
        'GÊNERO (Masculino ou Feminino)',
        'ENDEREÇO COMPLETO',
        'NOME DA MÃE',
        'NOME DO PAI',
      ];

      const sampleRows = [
        [
          'JOÃO CARLOS DA SILVA',
          'Membro',
          'Diácono',
          '(11) 98765-4321',
          'joao.silva@email.com',
          '123.456.789-00',
          '12.345.678-9',
          '15/05/1985',
          '20/10/2005',
          'Casado',
          'Masculino',
          'Rua das Palmeiras, 120 - Centro',
          'Maria da Silva',
          'Antônio Carlos da Silva',
        ],
        [
          'MARIA APARECIDA SANTOS',
          'Congregado',
          'Visitante',
          '(11) 91234-5678',
          'maria.santos@email.com',
          '987.654.321-11',
          '98.765.432-1',
          '22/08/1992',
          '',
          'Solteiro',
          'Feminino',
          'Av. Brasil, 450, Apto 23',
          'Ana Maria Santos',
          'Sebastião Santos',
        ],
      ];

      const ws = xlsx.utils.aoa_to_sheet([templateHeaders, ...sampleRows]);

      ws['!cols'] = [
        { wch: 32 }, // Nome
        { wch: 28 }, // Categoria
        { wch: 20 }, // Cargo
        { wch: 22 }, // Fone
        { wch: 28 }, // Email
        { wch: 18 }, // CPF
        { wch: 16 }, // RG
        { wch: 26 }, // Nascimento
        { wch: 16 }, // Batismo
        { wch: 20 }, // Estado civil
        { wch: 18 }, // Gênero
        { wch: 35 }, // Endereço
        { wch: 25 }, // Mãe
        { wch: 25 }, // Pai
      ];

      xlsx.utils.book_append_sheet(wb, ws, 'Modelo Importação');

      const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
      });
      saveAs(blob, 'Modelo_Importacao_Membros_Igreja.xlsx');

      toast({
        title: '📥 Modelo Baixado!',
        description: 'Preencha a planilha e faça o upload neste assistente.',
      });
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar modelo',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  // Normalizador de Cabeçalhos
  const normalizeKey = (k: string) => {
    return k
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  // Processar Arquivo Selecionado
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingFile(true);
    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const xlsx = getXLSX();
      const workbook = xlsx.read(arrayBuffer, { type: 'array', cellDates: true });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

      if (rawRows.length === 0) {
        toast({
          title: 'Planilha Vazia',
          description: 'A planilha selecionada não possui linhas de dados.',
          variant: 'destructive',
        });
        setLoadingFile(false);
        return;
      }

      // Mapeamento flexível de colunas
      const parsed: ParsedMemberRow[] = [];

      for (const row of rawRows) {
        // Encontrar os valores correspondentes em cada linha
        const entries = Object.entries(row);

        const getValue = (...keywords: string[]): string => {
          for (const [colName, val] of entries) {
            const normCol = normalizeKey(colName);
            for (const kw of keywords) {
              if (normCol.includes(normalizeKey(kw))) {
                if (val instanceof Date) {
                  return val.toISOString().split('T')[0];
                }
                return String(val || '').trim();
              }
            }
          }
          return '';
        };

        const name = getValue('nomecompleto', 'nome', 'membro', 'pessoa');
        if (!name) continue; // Pula linhas sem nome

        const categoryRaw = getValue('categoria', 'tipo', 'status').toLowerCase();
        const category: 'membro' | 'congregado' =
          categoryRaw.includes('congregad') || categoryRaw.includes('visit')
            ? 'congregado'
            : 'membro';

        parsed.push({
          selected: true,
          name,
          category,
          role: getValue('cargo', 'funcao', 'ministerio'),
          phone: getValue('telefone', 'celular', 'whatsapp', 'fone', 'tel'),
          email: getValue('email', 'e-mail', 'correio'),
          cpf: getValue('cpf', 'c.p.f', 'numcpf', 'documento', 'doc'),
          rg: getValue('rg', 'r.g', 'identidade', 'registrogeral', 'numrg'),
          birthDate: getValue('nascimento', 'aniversario', 'datanascimento'),
          baptismDate: getValue('batismo', 'databatismo'),
          maritalStatus: getValue('estadocivil', 'civil', 'conjugal'),
          gender: getValue('genero', 'sexo'),
          address: getValue('endereco', 'rua', 'logradouro'),
          motherName: getValue('mae', 'nomedamae'),
          fatherName: getValue('pai', 'nomedopai'),
        });
      }

      if (parsed.length === 0) {
        toast({
          title: 'Nenhum membro identificado',
          description: 'Verifique se a planilha possui uma coluna identificada como "Nome" ou "Nome Completo".',
          variant: 'destructive',
        });
        setLoadingFile(false);
        return;
      }

      setParsedRows(parsed);
      toast({
        title: '📋 Planilha Analisada com Sucesso!',
        description: `${parsed.length} membros prontos para importação. Revise e confirme abaixo.`,
      });
    } catch (err: any) {
      console.error('Erro ao ler planilha:', err);
      toast({
        title: 'Erro na leitura',
        description: err?.message || 'Falha ao processar o arquivo selecionado.',
        variant: 'destructive',
      });
    } finally {
      setLoadingFile(false);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    setParsedRows((prev) => prev.map((r) => ({ ...r, selected: checked })));
  };

  const toggleSelectRow = (index: number) => {
    setParsedRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r))
    );
  };

  // Efetivar Importação
  const handleExecuteImport = async () => {
    const selectedMembers = parsedRows.filter((r) => r.selected);
    if (selectedMembers.length === 0) {
      toast({
        title: 'Nenhum selecionado',
        description: 'Selecione ao menos um membro para importar.',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    setProgress({ current: 0, total: selectedMembers.length });

    let importedCount = 0;
    let skippedCount = 0;

    try {
      // Buscar membros existentes para verificar duplicidade
      const existingMembers = await membersService.getAll(churchId);
      const existingCpfs = new Set(
        existingMembers.map((m: any) => m.cpf).filter(Boolean)
      );
      const existingNames = new Set(
        existingMembers.map((m: any) => m.name.toLowerCase().trim())
      );

      for (let i = 0; i < selectedMembers.length; i++) {
        const item = selectedMembers[i];
        setProgress({ current: i + 1, total: selectedMembers.length });

        // Checar duplicidade se ativado
        if (skipDuplicates) {
          const cleanCpf = item.cpf?.replace(/\D/g, '');
          if (cleanCpf && existingCpfs.has(cleanCpf)) {
            skippedCount++;
            continue;
          }
          if (existingNames.has(item.name.toLowerCase().trim())) {
            skippedCount++;
            continue;
          }
        }

        // Empacotar campos estendidos para notes._ext
        const packedNotes = packExtendedFieldsToNotes('', {
          name: item.name,
          phone: item.phone || '',
          email: item.email || '',
          category: item.category,
          maritalStatus: item.maritalStatus || 'solteiro',
          birthDate: item.birthDate || '',
          address: item.address || '',
          cpf: item.cpf || '',
          rg: item.rg || '',
          role: item.role || (item.category === 'congregado' ? 'Congregado' : 'Membro'),
          gender: item.gender || 'outro',
          motherName: item.motherName || '',
          fatherName: item.fatherName || '',
          baptismDate: item.baptismDate || '',
          status: 'Disponível',
        });

        // Limpar estado civil para o banco
        const cleanMarital = ['solteiro', 'casado', 'divorciado', 'viuvo'].includes(
          item.maritalStatus?.toLowerCase() || ''
        )
          ? item.maritalStatus?.toLowerCase()
          : item.maritalStatus?.toLowerCase() === 'uniao_estavel'
          ? 'casado'
          : 'solteiro';

        await membersService.create(
          {
            name: item.name,
            email: item.email || null,
            phone: item.phone || null,
            birth_date: item.birthDate || null,
            marital_status: cleanMarital as any,
            address: item.address || null,
            photo_url: null,
            notes: packedNotes,
            status: item.category === 'congregado' ? 'visitante' : 'ativo',
          },
          churchId
        );

        importedCount++;
      }

      toast({
        title: '🎉 Importação Concluída!',
        description: `${importedCount} novos membros cadastrados no Rol com sucesso!${
          skippedCount > 0 ? ` (${skippedCount} ignorados por duplicidade).` : ''
        }`,
      });

      // Fechar e recarregar
      onOpenChange(false);
      setParsedRows([]);
      setFileName('');
      onSuccess();
    } catch (err: any) {
      console.error('Erro na importação:', err);
      toast({
        title: 'Erro na importação',
        description: err?.message || 'Ocorreu um erro durante a importação.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setParsedRows([]);
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b">
          <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            Importar Rol de Membros e Congregados via Excel
          </DialogTitle>
          <DialogDescription>
            Importe centenas de membros em segundos a partir de planilhas Excel (.xlsx) ou CSV.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1">
          {/* Barra de Ações: Baixar Modelo ou Selecionar Arquivo */}
          {parsedRows.length === 0 ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Download className="h-4 w-4 text-primary" />
                    Precisa de um modelo padrão pronto?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Baixe nossa planilha modelo pré-formatada com as colunas corretas e exemplos práticos.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="gap-2 shrink-0 border-primary/40 text-primary hover:bg-primary/10"
                >
                  <Download className="h-4 w-4" />
                  Baixar Modelo Excel (.xlsx)
                </Button>
              </div>

              {/* Área de Seleção de Arquivo (Dropzone) */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-emerald-50/20 dark:bg-emerald-950/10 cursor-pointer transition-all hover:bg-emerald-50/40"
              >
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-full text-emerald-600 dark:text-emerald-400">
                  {loadingFile ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">
                    Clique aqui para selecionar sua planilha Excel (.xlsx, .xls ou .csv)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    O sistema identifica automaticamente colunas de Nome, Telefone, E-mail, Categoria, CPF, etc.
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
          ) : (
            /* Tabela de Pré-visualização com Itens Detectados */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-muted/60 rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Arquivo: <span className="font-normal text-muted-foreground">{fileName}</span>
                    </p>
                    <p className="text-xs text-emerald-600 font-semibold">
                      {parsedRows.filter((r) => r.selected).length} de {parsedRows.length} membros selecionados para cadastro
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skipDuplicates"
                      checked={skipDuplicates}
                      onCheckedChange={(c) => setSkipDuplicates(!!c)}
                    />
                    <Label htmlFor="skipDuplicates" className="text-xs cursor-pointer">
                      Evitar cadastros duplicados (mesmo CPF ou Nome)
                    </Label>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="text-xs h-8 text-muted-foreground hover:text-destructive"
                  >
                    Trocar Arquivo
                  </Button>
                </div>
              </div>

              {/* Tabela de Pré-visualização */}
              <div className="border rounded-xl overflow-hidden max-h-[360px] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10 text-xs">
                    <TableRow>
                      <TableHead className="w-10 text-center">
                        <Checkbox
                          checked={
                            parsedRows.length > 0 &&
                            parsedRows.every((r) => r.selected)
                          }
                          onCheckedChange={(c) => toggleSelectAll(!!c)}
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="w-28 text-center">Categoria</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Nascimento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row, idx) => (
                      <TableRow
                        key={idx}
                        className={`text-xs cursor-pointer ${
                          row.selected ? 'bg-card' : 'opacity-40 bg-muted/20'
                        }`}
                        onClick={() => toggleSelectRow(idx)}
                      >
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={row.selected}
                            onCheckedChange={() => toggleSelectRow(idx)}
                          />
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          {row.name}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={
                              row.category === 'membro'
                                ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-[10px]'
                                : 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/40 text-[10px]'
                            }
                          >
                            {row.category.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{row.role || '-'}</TableCell>
                        <TableCell>{row.phone || '-'}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{row.email || '-'}</TableCell>
                        <TableCell>{row.cpf || '-'}</TableCell>
                        <TableCell>{row.birthDate || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Barra de Progresso quando estiver importando */}
          {importing && (
            <div className="p-4 bg-muted/60 rounded-xl space-y-2 border border-border">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cadastrando membros no Rol Oficial...
                </span>
                <span>
                  {progress.current} de {progress.total}
                </span>
              </div>
              <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2 transition-all duration-200"
                  style={{
                    width: `${Math.round((progress.current / (progress.total || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancelar
          </Button>

          {parsedRows.length > 0 && (
            <Button
              type="button"
              onClick={handleExecuteImport}
              disabled={importing || parsedRows.filter((r) => r.selected).length === 0}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Importando ({progress.current}/{progress.total})...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar Importação de {parsedRows.filter((r) => r.selected).length} Membros
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ImportMembersModal;
