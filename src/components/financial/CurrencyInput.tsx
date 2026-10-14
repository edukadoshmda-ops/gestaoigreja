import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  parseCurrency,
  formatCurrencyBRL,
  formatCurrencyInWords,
} from '@/utils/currencyUtils';
import { CheckCircle2, Sparkles, RotateCcw } from 'lucide-react';

interface CurrencyInputProps {
  label?: string;
  value: number | string;
  onChange: (numericValue: number, rawString: string) => void;
  placeholder?: string;
  className?: string;
  showPresets?: boolean;
  required?: boolean;
  autoFocus?: boolean;
}

export function CurrencyInput({
  label,
  value,
  onChange,
  placeholder = 'Ex: 10 mil, 100 mil, 1 milhão, 10.000...',
  className = '',
  showPresets = true,
  required = false,
  autoFocus = false,
}: CurrencyInputProps) {
  // Estado interno para a string digitada pelo usuário
  const [text, setText] = useState<string>(() => {
    if (value === '' || value === undefined || value === null) return '';
    if (typeof value === 'number') {
      return value > 0 ? formatCurrencyBRL(value) : '';
    }
    return String(value);
  });

  // Atualizar quando o valor externo mudar bruscamente ou for resetado
  useEffect(() => {
    if (value === '' || value === undefined || value === null || value === 0) {
      if (text !== '' && value === '') setText('');
      return;
    }
    if (typeof value === 'number') {
      const currentParsed = parseCurrency(text);
      if (currentParsed !== value) {
        setText(value > 0 ? formatCurrencyBRL(value) : '');
      }
    } else if (typeof value === 'string') {
      if (value !== text) {
        setText(value);
      }
    }
  }, [value]);

  const currentNumeric = parseCurrency(text);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setText(raw);
    const parsed = parseCurrency(raw);
    onChange(parsed, raw);
  };

  const handleBlur = () => {
    const parsed = parseCurrency(text);
    if (parsed > 0) {
      setText(formatCurrencyBRL(parsed));
      onChange(parsed, formatCurrencyBRL(parsed));
    }
  };

  const handleAddPreset = (addValue: number) => {
    const current = parseCurrency(text);
    const updated = current + addValue;
    setText(formatCurrencyBRL(updated));
    onChange(updated, formatCurrencyBRL(updated));
  };

  const handleSetPreset = (targetValue: number) => {
    setText(formatCurrencyBRL(targetValue));
    onChange(targetValue, formatCurrencyBRL(targetValue));
  };

  const handleClear = () => {
    setText('');
    onChange(0, '');
  };

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wider">{label}</Label>
          {currentNumeric > 0 && (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {formatCurrencyBRL(currentNumeric)}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <Input
          type="text"
          value={text}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          className={`font-bold text-base pr-8 ${className}`}
        />
        {text && (
          <button
            type="button"
            onClick={handleClear}
            title="Limpar valor"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Extenso em tempo real para clareza absoluta (1 real, 10 mil, 100 mil, 1 milhão) */}
      {currentNumeric > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{formatCurrencyBRL(currentNumeric)}</span>
          <span className="text-muted-foreground">•</span>
          <span className="italic">{formatCurrencyInWords(currentNumeric)}</span>
        </div>
      )}

      {/* Botões Rápidos de Atalhos: 1 mil, 10 mil, 100 mil, 1 milhão */}
      {showPresets && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-muted-foreground font-medium uppercase mr-0.5">Atalhos:</span>

          <button
            type="button"
            onClick={() => handleSetPreset(1000)}
            className="px-2 py-0.5 rounded-md bg-muted hover:bg-primary hover:text-primary-foreground text-[11px] font-medium transition-colors border border-border"
          >
            1 mil
          </button>

          <button
            type="button"
            onClick={() => handleSetPreset(10000)}
            className="px-2 py-0.5 rounded-md bg-muted hover:bg-primary hover:text-primary-foreground text-[11px] font-medium transition-colors border border-border"
          >
            10 mil
          </button>

          <button
            type="button"
            onClick={() => handleSetPreset(100000)}
            className="px-2 py-0.5 rounded-md bg-muted hover:bg-primary hover:text-primary-foreground text-[11px] font-medium transition-colors border border-border"
          >
            100 mil
          </button>

          <button
            type="button"
            onClick={() => handleSetPreset(1000000)}
            className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-600 hover:text-white text-[11px] font-bold transition-colors border border-emerald-300 dark:border-emerald-700"
          >
            1 milhão
          </button>

          <button
            type="button"
            onClick={() => handleAddPreset(1000)}
            className="px-1.5 py-0.5 rounded-md bg-muted/70 hover:bg-muted text-[10px] text-muted-foreground transition-colors"
          >
            +1 mil
          </button>

          <button
            type="button"
            onClick={() => handleAddPreset(10000)}
            className="px-1.5 py-0.5 rounded-md bg-muted/70 hover:bg-muted text-[10px] text-muted-foreground transition-colors"
          >
            +10 mil
          </button>
        </div>
      )}
    </div>
  );
}
