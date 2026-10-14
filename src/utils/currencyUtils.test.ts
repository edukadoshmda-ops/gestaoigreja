import { describe, it, expect } from 'vitest';
import { parseCurrency, formatCurrencyInWords, formatCurrencyBRL } from './currencyUtils';

describe('currencyUtils tests', () => {
  it('corretamente interpreta valores simples e em reais', () => {
    expect(parseCurrency('1')).toBe(1);
    expect(parseCurrency('10')).toBe(10);
    expect(parseCurrency('100')).toBe(100);
    expect(parseCurrency('1000')).toBe(1000);
  });

  it('corretamente interpreta separadores brasileiros de milhar e milhão', () => {
    expect(parseCurrency('1.000')).toBe(1000);
    expect(parseCurrency('10.000')).toBe(10000);
    expect(parseCurrency('100.000')).toBe(100000);
    expect(parseCurrency('1.000.000')).toBe(1000000);
    expect(parseCurrency('10.000,00')).toBe(10000);
    expect(parseCurrency('1.000.000,00')).toBe(1000000);
    expect(parseCurrency('R$ 10.000,00')).toBe(10000);
    expect(parseCurrency('R$ 1.000.000,00')).toBe(1000000);
  });

  it('corretamente interpreta atalhos textuais: mil, milhão', () => {
    expect(parseCurrency('1 mil')).toBe(1000);
    expect(parseCurrency('10 mil')).toBe(10000);
    expect(parseCurrency('100 mil')).toBe(100000);
    expect(parseCurrency('1 milhão')).toBe(1000000);
    expect(parseCurrency('1 milhao')).toBe(1000000);
    expect(parseCurrency('um milhão')).toBe(1000000);
    expect(parseCurrency('um milhao')).toBe(1000000);
    expect(parseCurrency('10 mi')).toBe(10000000);
    expect(parseCurrency('10k')).toBe(10000);
  });

  it('corretamente interpreta centavos e decimais', () => {
    expect(parseCurrency('10,50')).toBe(10.5);
    expect(parseCurrency('10.50')).toBe(10.5);
    expect(parseCurrency('10.000,75')).toBe(10000.75);
  });

  it('gera extenso compreensível em português', () => {
    expect(formatCurrencyInWords(1)).toBe('Um real');
    expect(formatCurrencyInWords(10)).toBe('Dez reais');
    expect(formatCurrencyInWords(1000)).toBe('Um mil reais');
    expect(formatCurrencyInWords(10000)).toBe('Dez mil reais');
    expect(formatCurrencyInWords(100000)).toBe('Cem mil reais');
    expect(formatCurrencyInWords(1000000)).toBe('Um milhão de reais');
  });
});
