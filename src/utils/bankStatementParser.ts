import * as XLSX from 'xlsx';

export interface ParsedStatementTransaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  type: 'entrada' | 'saida';
  amount: number; // sempre positivo
  documentNumber?: string;
  suggestedCategory: string;
  selected: boolean;
}

export interface StatementParseResult {
  format: 'OFX' | 'CSV' | 'EXCEL';
  accountInfo?: {
    bankId?: string;
    accountId?: string;
  };
  transactions: ParsedStatementTransaction[];
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  periodStart?: string;
  periodEnd?: string;
}

/**
 * Sugere categoria com base no texto do extrato bancário
 */
export function suggestCategory(description: string, type: 'entrada' | 'saida'): string {
  const d = (description || '').toUpperCase();

  if (type === 'entrada') {
    if (d.includes('DIZIMO') || d.includes('DÍZIMO')) return 'Dízimos';
    if (d.includes('OFERTA')) return 'Ofertas - Culto Geral';
    if (d.includes('MISSO') || d.includes('MISSÃO')) return 'Ofertas - Missões';
    if (d.includes('CONSTRUC') || d.includes('REFORMA')) return 'Ofertas - Construção & Reforma';
    if (d.includes('EBD') || d.includes('ESCOLA')) return 'Ofertas - Escola Bíblica';
    if (d.includes('CANTINA') || d.includes('LANCHE')) return 'Vendas - Cantina';
    if (d.includes('LIVRARIA') || d.includes('BAZAR')) return 'Vendas - Livraria / Bazar';
    if (d.includes('EVENTO') || d.includes('RETIRO') || d.includes('INSCRIC')) return 'Inscrições de Eventos / Retiros';
    if (d.includes('CAMPANHA') || d.includes('DOACAO') || d.includes('DOAÇÃO')) return 'Doações Especiais e Campanhas';
    if (d.includes('RENDIMENTO') || d.includes('JUROS') || d.includes('APLIC')) return 'Rendimento de Aplicações';
    if (d.includes('PIX') || d.includes('TED') || d.includes('DOC') || d.includes('DEP')) return 'Dízimos';
    return 'Outras Entradas';
  } else {
    if (d.includes('TARIFA') || d.includes('TAXA') || d.includes('IOF') || d.includes('MANUT CONTA') || d.includes('BANC')) return 'Despesas Bancárias';
    if (d.includes('ENERGIA') || d.includes('ELETRIC') || d.includes('LUZ') || d.includes('CPFL') || d.includes('ENEL') || d.includes('CEMIG')) return 'Energia Elétrica';
    if (d.includes('AGUA') || d.includes('ÁGUA') || d.includes('SABESP') || d.includes('COPASA') || d.includes('SANEPAR')) return 'Água e Saneamento';
    if (d.includes('INTERNET') || d.includes('TELEF') || d.includes('VIVO') || d.includes('CLARO') || d.includes('TIM')) return 'Internet e Telefonia';
    if (d.includes('ALUGUEL') || d.includes('LOCACAO') || d.includes('LOCAÇÃO')) return 'Aluguel do Templo';
    if (d.includes('PREBENDA') || d.includes('HONORARIO') || d.includes('PASTOR') || d.includes('SALARIO')) return 'Prebendas e Honorários Pastorais';
    if (d.includes('LIMPEZA') || d.includes('DESCARTAV') || d.includes('PRODUTOS')) return 'Limpeza e Descartáveis';
    if (d.includes('MANUT') || d.includes('REFORMA') || d.includes('REPARO')) return 'Manutenção Predial e Reformas';
    if (d.includes('SOM') || d.includes('INSTRUMENT') || d.includes('AUDIO') || d.includes('MICROF')) return 'Equipamentos de Som & Multimídia';
    if (d.includes('BENEF') || d.includes('CESTA') || d.includes('SOCIAL') || d.includes('AJUDA')) return 'Ação Social & Ajuda Fraterna';
    return 'Utilidades e Manutenção';
  }
}

/**
 * Converte data OFX (ex: 20261014120000[-03:EST] ou 20261014) em YYYY-MM-DD
 */
function parseOfxDate(rawDate?: string): string {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  const cleaned = rawDate.trim();
  if (cleaned.length >= 8) {
    const y = cleaned.substring(0, 4);
    const m = cleaned.substring(4, 6);
    const d = cleaned.substring(6, 8);
    return `${y}-${m}-${d}`;
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Parser inteligente de extratos no formato OFX
 */
export function parseOfxContent(text: string): StatementParseResult {
  const transactions: ParsedStatementTransaction[] = [];
  let totalIncome = 0;
  let totalExpense = 0;

  // Extrair blocos <STMTTRN>...</STMTTRN> ou <STMTTRN> até próximo <STMTTRN> / </BANKTRANLIST>
  const trnRegex = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|(?=<\/BANKTRANLIST>))/gi;
  let match;

  const extractTag = (block: string, tag: string): string => {
    // Procura <TAG>VALOR</TAG> ou <TAG>VALOR (sem fechar tag)
    const regex = new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i');
    const m = block.match(regex);
    return m ? m[1].trim() : '';
  };

  let idx = 0;
  while ((match = trnRegex.exec(text)) !== null) {
    const block = match[1];
    idx++;

    const trnType = extractTag(block, 'TRNTYPE').toUpperCase();
    const dtPosted = extractTag(block, 'DTPOSTED');
    const trnAmtStr = extractTag(block, 'TRNAMT');
    const fitId = extractTag(block, 'FITID') || extractTag(block, 'CHECKNUM') || `ofx-${idx}`;
    const memo = extractTag(block, 'MEMO') || extractTag(block, 'NAME') || 'Movimentação Bancária';

    const amt = parseFloat(trnAmtStr.replace(',', '.'));
    if (isNaN(amt)) continue;

    const isCredit = amt > 0 || trnType === 'CREDIT' || trnType === 'DEP';
    const type: 'entrada' | 'saida' = isCredit ? 'entrada' : 'saida';
    const positiveAmt = Math.abs(amt);
    const date = parseOfxDate(dtPosted);

    if (type === 'entrada') {
      totalIncome += positiveAmt;
    } else {
      totalExpense += positiveAmt;
    }

    transactions.push({
      id: fitId || `trn-${Date.now()}-${idx}`,
      date,
      description: memo,
      type,
      amount: positiveAmt,
      documentNumber: fitId,
      suggestedCategory: suggestCategory(memo, type),
      selected: true,
    });
  }

  // Ordenar por data decrescente
  transactions.sort((a, b) => b.date.localeCompare(a.date));

  return {
    format: 'OFX',
    transactions,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    netAmount: Math.round((totalIncome - totalExpense) * 100) / 100,
    periodStart: transactions.length > 0 ? transactions[transactions.length - 1].date : undefined,
    periodEnd: transactions.length > 0 ? transactions[0].date : undefined,
  };
}

/**
 * Parser de linhas CSV respeitando aspas e detectando delimitador (, ou ; ou TAB)
 */
function parseCsvRows(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  const delimiter = tabCount > semicolonCount && tabCount > commaCount ? '\t' : commaCount > semicolonCount ? ',' : ';';

  return lines.map((line) => {
    const parts = line.split(delimiter);
    return parts.map((p) => p.replace(/^["']|["']$/g, '').trim());
  });
}

/**
 * Normaliza valores monetários em formato brasileiro (ex: "1.250,50", "-350,00", "(150.00)")
 */
export function parseBrazilianNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const s = String(val).trim();
  const isNegative = s.includes('-') || (s.startsWith('(') && s.endsWith(')'));
  const clean = s.replace(/[^\d,\.]/g, '');

  let num = 0;
  if (clean.includes(',') && clean.includes('.')) {
    if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
      // 1.250,50 -> 1250.50
      num = parseFloat(clean.replace(/\./g, '').replace(',', '.'));
    } else {
      // 1,250.50 -> 1250.50
      num = parseFloat(clean.replace(/,/g, ''));
    }
  } else if (clean.includes(',')) {
    // 250,50 -> 250.50
    num = parseFloat(clean.replace(',', '.'));
  } else {
    num = parseFloat(clean);
  }

  if (isNaN(num)) return 0;
  return isNegative ? -Math.abs(num) : Math.abs(num);
}

/**
 * Converte data de texto (DD/MM/YYYY ou YYYY-MM-DD) para YYYY-MM-DD
 */
function parseAnyDate(val: any): string {
  if (!val) return new Date().toISOString().split('T')[0];
  if (val instanceof Date) return val.toISOString().split('T')[0];

  const s = String(val).trim();
  // DD/MM/YYYY
  const brMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    const d = brMatch[1].padStart(2, '0');
    const m = brMatch[2].padStart(2, '0');
    const y = brMatch[3];
    return `${y}-${m}-${d}`;
  }

  // YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return new Date().toISOString().split('T')[0];
}

/**
 * Parser de planilhas Excel (.xlsx, .xls) ou CSV estruturado
 */
export function parseSpreadsheet(data: ArrayBuffer | Uint8Array | string, isCsv = false): StatementParseResult {
  let rows: any[][] = [];

  if (isCsv && typeof data === 'string') {
    rows = parseCsvRows(data);
  } else {
    const wb = XLSX.read(data, { type: typeof data === 'string' ? 'string' : 'array', cellDates: true });
    const firstSheetName = wb.SheetNames[0];
    const ws = wb.Sheets[firstSheetName];
    rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  }

  if (rows.length < 2) {
    return {
      format: isCsv ? 'CSV' : 'EXCEL',
      transactions: [],
      totalIncome: 0,
      totalExpense: 0,
      netAmount: 0,
    };
  }

  // Detectar cabeçalho
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const r = rows[i].map((c) => String(c).toUpperCase());
    if (r.some((c) => c.includes('DATA') || c.includes('DATE') || c.includes('LANÇAMENTO'))) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = rows[headerRowIndex].map((h) => String(h).toUpperCase().trim());
  const dateCol = headers.findIndex((h) => h.includes('DATA') || h.includes('DATE') || h.includes('DIA'));
  const descCol = headers.findIndex(
    (h) => h.includes('HISTOR') || h.includes('HISTÓR') || h.includes('DESCRI') || h.includes('MEMO') || h.includes('DETALHE')
  );
  const valCol = headers.findIndex((h) => h.includes('VALOR') || h.includes('VALUE') || h.includes('MONTANTE'));
  const docCol = headers.findIndex((h) => h.includes('DOC') || h.includes('NUMERO') || h.includes('Nº') || h.includes('ID'));
  const creditCol = headers.findIndex((h) => h.includes('ENTRADA') || h.includes('CRÉDITO') || h.includes('CREDITO'));
  const debitCol = headers.findIndex((h) => h.includes('SAÍDA') || h.includes('SAIDA') || h.includes('DÉBITO') || h.includes('DEBITO'));

  const transactions: ParsedStatementTransaction[] = [];
  let totalIncome = 0;
  let totalExpense = 0;

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rawDate = dateCol >= 0 ? row[dateCol] : row[0];
    const date = parseAnyDate(rawDate);

    const desc = descCol >= 0 ? String(row[descCol]).trim() : String(row[1] || 'Lançamento bancário').trim();
    if (!desc || desc.toUpperCase().includes('TOTAL') || desc.toUpperCase().includes('SALDO')) continue;

    let amt = 0;
    let type: 'entrada' | 'saida' = 'saida';

    if (creditCol >= 0 && debitCol >= 0) {
      const crVal = parseBrazilianNumber(row[creditCol]);
      const dbVal = parseBrazilianNumber(row[debitCol]);
      if (crVal > 0) {
        amt = crVal;
        type = 'entrada';
      } else if (dbVal > 0) {
        amt = dbVal;
        type = 'saida';
      }
    } else if (valCol >= 0) {
      const rawVal = row[valCol];
      const parsedNum = parseBrazilianNumber(rawVal);
      if (parsedNum !== 0) {
        type = parsedNum > 0 ? 'entrada' : 'saida';
        amt = Math.abs(parsedNum);
      }
    } else {
      // Tentar encontrar coluna numérica
      for (const col of row) {
        const p = parseBrazilianNumber(col);
        if (p !== 0) {
          type = p > 0 ? 'entrada' : 'saida';
          amt = Math.abs(p);
          break;
        }
      }
    }

    if (amt <= 0) continue;

    if (type === 'entrada') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
    }

    const docNumber = docCol >= 0 ? String(row[docCol] || '') : undefined;

    transactions.push({
      id: `row-${r}-${Date.now()}`,
      date,
      description: desc,
      type,
      amount: amt,
      documentNumber: docNumber,
      suggestedCategory: suggestCategory(desc, type),
      selected: true,
    });
  }

  transactions.sort((a, b) => b.date.localeCompare(a.date));

  return {
    format: isCsv ? 'CSV' : 'EXCEL',
    transactions,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalExpense: Math.round(totalExpense * 100) / 100,
    netAmount: Math.round((totalIncome - totalExpense) * 100) / 100,
    periodStart: transactions.length > 0 ? transactions[transactions.length - 1].date : undefined,
    periodEnd: transactions.length > 0 ? transactions[0].date : undefined,
  };
}

/**
 * Lê arquivo e identifica automaticamente o formato (OFX, CSV ou Excel)
 */
export async function parseBankStatementFile(file: File): Promise<StatementParseResult> {
  const name = file.name.toLowerCase();

  // 1. OFX (.ofx)
  if (name.endsWith('.ofx')) {
    const text = await file.text();
    return parseOfxContent(text);
  }

  // 2. CSV / TXT (.csv, .txt)
  if (name.endsWith('.csv') || name.endsWith('.txt')) {
    const text = await file.text();
    // Se for OFX com extensão .txt
    if (text.includes('<OFX>') || text.includes('<STMTTRN>')) {
      return parseOfxContent(text);
    }
    return parseSpreadsheet(text, true);
  }

  // 3. Excel (.xlsx, .xls)
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buffer = await file.arrayBuffer();
    return parseSpreadsheet(buffer, false);
  }

  // Se for PDF
  if (name.endsWith('.pdf')) {
    throw new Error(
      'Arquivos em PDF não contêm dados bancários estruturados. Para importar, acesse o Internet Banking do seu banco e selecione a opção "Salvar como OFX" ou "Exportar como Excel/CSV".'
    );
  }

  throw new Error(
    `Formato de arquivo não suportado. O sistema aceita extratos em: OFX (.ofx), Excel (.xlsx, .xls) e CSV (.csv).`
  );
}
