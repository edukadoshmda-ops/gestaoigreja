import { describe, it, expect } from 'vitest';
import {
  parseOfxContent,
  parseSpreadsheet,
  suggestCategory,
} from './bankStatementParser';

describe('bankStatementParser', () => {
  it('parses OFX format with credit and debit correctly', () => {
    const sampleOfx = `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<BANKTRANLIST>
<DTSTART>20261001
<DTEND>20261014
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20261005120000[-03:BRT]
<TRNAMT>1500.00
<FITID>20261005001
<MEMO>PIX RECEBIDO DIZIMO IRMAO SILVA
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20261010120000[-03:BRT]
<TRNAMT>-320.50
<FITID>20261010002
<MEMO>PAGTO ENERGIA ENEL
</STMTTRN>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20261012120000[-03:BRT]
<TRNAMT>-45.00
<FITID>20261012003
<MEMO>TARIFA BANCARIA CESTA
</STMTTRN>
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
    `;

    const res = parseOfxContent(sampleOfx);
    expect(res.format).toBe('OFX');
    expect(res.transactions.length).toBe(3);

    const credit = res.transactions.find((t) => t.type === 'entrada');
    expect(credit).toBeDefined();
    expect(credit?.amount).toBe(1500);
    expect(credit?.date).toBe('2026-10-05');
    expect(credit?.suggestedCategory).toBe('Dízimos');

    const debit = res.transactions.find((t) => t.description.includes('ENEL'));
    expect(debit).toBeDefined();
    expect(debit?.type).toBe('saida');
    expect(debit?.amount).toBe(320.5);
    expect(debit?.date).toBe('2026-10-10');
    expect(debit?.suggestedCategory).toBe('Energia Elétrica');

    expect(res.totalIncome).toBe(1500);
    expect(res.totalExpense).toBe(365.5);
    expect(res.netAmount).toBe(1134.5);
  });

  it('suggests appropriate categories based on descriptions', () => {
    expect(suggestCategory('CPFL ENERGIA ELETRICA', 'saida')).toBe('Energia Elétrica');
    expect(suggestCategory('SABESP AGUA', 'saida')).toBe('Água e Saneamento');
    expect(suggestCategory('INTERNET FIBRA VIVO', 'saida')).toBe('Internet e Telefonia');
    expect(suggestCategory('TARIFA MANUTENCAO', 'saida')).toBe('Despesas Bancárias');
    expect(suggestCategory('OFERTA CULTO DOMINGO', 'entrada')).toBe('Ofertas - Culto Geral');
  });

  it('parses CSV bank format with Brazilian numbers', () => {
    const csv = `Data;Historico;Documento;Valor
10/10/2026;RECEBIMENTO PIX;12345;2.500,00
11/10/2026;PAGAMENTO CONTA LUZ;67890;-450,20
12/10/2026;TARIFA MENSAL;11223;-39,90
`;

    const res = parseSpreadsheet(csv, true);
    expect(res.format).toBe('CSV');
    expect(res.transactions.length).toBe(3);
    expect(res.totalIncome).toBe(2500);
    expect(res.totalExpense).toBe(490.1);
  });
});
