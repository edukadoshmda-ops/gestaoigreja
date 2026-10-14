/**
 * Utilitários robustos de Moeda e Valores Financeiros em Português (pt-BR)
 * Suporta digitação livre: "1", "10", "10 mil", "100 mil", "1 milhão", "10.000", "1.000.000,00"
 */

export function parseCurrency(input: string | number | null | undefined): number {
  if (input === null || input === undefined) return 0;
  if (typeof input === 'number') return isNaN(input) ? 0 : input;

  let str = input.toString().trim().toLowerCase();
  if (!str) return 0;

  // Normalizar acentos
  str = str.replace(/ã/g, 'a').replace(/õ/g, 'o').replace(/é/g, 'e');

  // Atalhos por extenso comuns
  if (str === 'um milhao' || str === '1 milhao') return 1000000;
  if (str === 'dois milhoes' || str === '2 milhoes') return 2000000;
  if (str === 'cinco milhoes' || str === '5 milhoes') return 5000000;
  if (str === 'dez milhoes' || str === '10 milhoes') return 10000000;
  if (str === 'cem mil') return 100000;
  if (str === 'duzentos mil') return 200000;
  if (str === 'quinhentos mil') return 500000;
  if (str === 'cinquenta mil') return 50000;
  if (str === 'vinte mil') return 20000;
  if (str === 'dez mil') return 10000;
  if (str === 'cinco mil') return 5000;
  if (str === 'um mil' || str === 'mil') return 1000;
  if (str === 'cem') return 100;
  if (str === 'cinquenta') return 50;
  if (str === 'dez') return 10;
  if (str === 'um') return 1;

  // Regex de multiplicador: "10 mil", "10k", "100 mil", "1 milhao", "1.5 mi"
  const millionMatch = str.match(/^([\d.,]+)\s*(milhoes|milhao|mi)$/);
  if (millionMatch) {
    const base = parseSimpleNumber(millionMatch[1]);
    return base * 1000000;
  }

  const thousandMatch = str.match(/^([\d.,]+)\s*(mil|k)$/);
  if (thousandMatch) {
    const base = parseSimpleNumber(thousandMatch[1]);
    return base * 1000;
  }

  // Remover "r$", espaços e caracteres que não sejam dígitos, pontos ou vírgulas
  str = str.replace(/^r\$\s*/i, '').replace(/[^\d.,]/g, '').trim();

  return parseSimpleNumber(str);
}

function parseSimpleNumber(str: string): number {
  str = str.trim();
  if (!str) return 0;

  // Caso contenha tanto ponto quanto vírgula: "1.000,50" ou "1,000.50"
  if (str.includes('.') && str.includes(',')) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastComma > lastDot) {
      // Padrão brasileiro: 1.000.000,50
      const clean = str.replace(/\./g, '').replace(',', '.');
      return parseFloat(clean) || 0;
    } else {
      // Padrão internacional: 1,000,000.50
      const clean = str.replace(/,/g, '');
      return parseFloat(clean) || 0;
    }
  }

  // Caso contenha apenas vírgula: "10,50" ou "10000,00"
  if (str.includes(',')) {
    const clean = str.replace(',', '.');
    return parseFloat(clean) || 0;
  }

  // Caso contenha apenas pontos: "10.000", "1.000.000" ou "10.50"
  if (str.includes('.')) {
    const parts = str.split('.');
    // Múltiplos pontos: 1.000.000 -> separador de milhar
    if (parts.length > 2) {
      return parseFloat(parts.join('')) || 0;
    }
    // Único ponto: se a parte após o ponto tiver exatamente 3 dígitos (ex: 1.000, 10.000, 100.000)
    // é separador de milhar brasileiro!
    if (parts[1].length === 3) {
      return parseFloat(parts[0] + parts[1]) || 0;
    }
    // Se tiver 1 ou 2 dígitos após o ponto (ex: 10.5 ou 10.50), é decimal
    return parseFloat(str) || 0;
  }

  // Apenas dígitos: "10000", "1000000"
  return parseFloat(str) || 0;
}

/**
 * Formata um número para o padrão monetário brasileiro R$ 0.000,00
 */
export function formatCurrencyBRL(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
}

/**
 * Converte valor numérico em extenso em português para dar feedback visual instantâneo ao usuário
 */
export function formatCurrencyInWords(amount: number): string {
  if (!amount || isNaN(amount) || amount === 0) return 'Zero reais';
  if (amount < 0) return `Menos ${formatCurrencyInWords(Math.abs(amount))}`;

  const intPart = Math.floor(amount);
  const cents = Math.round((amount - intPart) * 100);

  const units = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const teens = [
    'dez',
    'onze',
    'doze',
    'treze',
    'quatorze',
    'quinze',
    'dezesseis',
    'dezessete',
    'dezoito',
    'dezenove',
  ];
  const tens = [
    '',
    '',
    'vinte',
    'trinta',
    'quarenta',
    'cinquenta',
    'sessenta',
    'setenta',
    'oitenta',
    'noventa',
  ];
  const hundreds = [
    '',
    'cento',
    'duzentos',
    'trezentos',
    'quatrocentos',
    'quinhentos',
    'seiscentos',
    'setecentos',
    'oitocentos',
    'novecentos',
  ];

  function readGroup(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    const c = Math.floor(n / 100);
    const remainder = n % 100;
    const d = Math.floor(remainder / 10);
    const u = remainder % 10;

    const parts: string[] = [];
    if (c > 0) parts.push(hundreds[c]);
    if (remainder >= 10 && remainder < 20) {
      parts.push(teens[remainder - 10]);
    } else {
      if (d > 0) parts.push(tens[d]);
      if (u > 0) parts.push(units[u]);
    }
    return parts.join(' e ');
  }

  const millions = Math.floor(intPart / 1000000);
  const thousands = Math.floor((intPart % 1000000) / 1000);
  const rest = intPart % 1000;

  const phraseParts: string[] = [];

  if (millions > 0) {
    if (millions === 1) {
      phraseParts.push('um milhão');
    } else {
      phraseParts.push(`${readGroup(millions)} milhões`);
    }
  }

  if (thousands > 0) {
    if (thousands === 1) {
      phraseParts.push('um mil');
    } else {
      phraseParts.push(`${readGroup(thousands)} mil`);
    }
  }

  if (rest > 0 || phraseParts.length === 0) {
    const restText = readGroup(rest);
    if (restText) phraseParts.push(restText);
  }

  let result = phraseParts.join(rest > 0 && rest < 100 ? ' e ' : ', ');
  result = result.replace(/,\s*([^,]+)$/, ' e $1'); // Última vírgula vira "e"

  if (intPart === 1) {
    result += ' real';
  } else if (intPart > 1) {
    if (millions > 0 && thousands === 0 && rest === 0) {
      result += ' de reais';
    } else {
      result += ' reais';
    }
  }

  if (cents > 0) {
    const centsText = readGroup(cents);
    result += ` e ${centsText} ${cents === 1 ? 'centavo' : 'centavos'}`;
  }

  // Capitalizar primeira letra
  return result.charAt(0).toUpperCase() + result.slice(1);
}
