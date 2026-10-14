import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Printer,
  Palette,
  Type,
  Frame,
  Check,
  RotateCcw,
  Eye,
  Sliders,
  Sparkles,
  Heart,
  Droplet,
  ShieldCheck,
  QrCode as QrIcon,
  Minus,
  Plus,
  Church,
  Save,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Member, CardCustomizationConfig, CardFontFamily, CardFrameStyle, CardTextAlign } from '@/types';
import {
  DEFAULT_CARD_CONFIG,
  CARD_PRESETS,
  CARD_FONTS_LIST,
  CARD_FRAMES_LIST,
  CARD_TEXT_COLOR_PALETTES,
  CARD_HEADER_TEXT_COLOR_PALETTES,
  packExtendedFieldsToNotes,
} from '@/lib/memberUtils';
import { maskCPF, unmask } from '@/lib/masks';
import { membersService } from '@/services/members.service';
import { useToast } from '@/hooks/use-toast';
import { useTenant, globalChurchLogo, globalChurchName } from '@/hooks/useTenant';

interface MemberIdCardProps {
  member: Member;
  churchName?: string;
  churchLogo?: string;
  pastorName?: string;
  cnpj?: string;
  churchAddress?: string;
  onSaveConfig?: (config: CardCustomizationConfig) => void;
  onUpdateMember?: (updatedMember: Partial<Member>) => Promise<void> | void;
}

export function MemberIdCard({
  member,
  churchName,
  churchLogo,
  pastorName,
  cnpj,
  churchAddress,
  onSaveConfig,
  onUpdateMember,
}: MemberIdCardProps) {
  const { tenant } = useTenant();
  const effectiveChurchName = churchName || tenant?.name || globalChurchName || 'Igreja Evangélica';
  const effectiveChurchLogo = churchLogo || tenant?.logo_url || globalChurchLogo || '';
  const effectiveCnpj = cnpj || (tenant as any)?.cnpj || '00.000.000/0001-00';
  const effectiveChurchAddress = churchAddress || tenant?.address || 'Av. Principal, 1000 - Centro';
  const effectivePastorName = pastorName || tenant?.president_name || 'Pastor Presidente';
  const [config, setConfig] = useState<CardCustomizationConfig>({
    ...DEFAULT_CARD_CONFIG,
    ...(member.customCardConfig || {}),
  });

  const [activeSide, setActiveSide] = useState<'both' | 'front' | 'back'>('both');
  const [customName, setCustomName] = useState(member.name || '');
  const [customRole, setCustomRole] = useState(member.role || 'Membro');
  const [customCpf, setCustomCpf] = useState(member.cpf ? maskCPF(member.cpf) : '');
  const [customRg, setCustomRg] = useState(member.rg || '');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Sincroniza se o membro mudar
  useEffect(() => {
    if (member.customCardConfig) {
      setConfig((prev) => ({
        ...prev,
        ...member.customCardConfig,
      }));
    }
    setCustomName(member.name || '');
    setCustomRole(member.role || 'Membro');
    setCustomCpf(member.cpf ? maskCPF(member.cpf) : '');
    setCustomRg(member.rg || '');
  }, [member.id, member.customCardConfig, member.name, member.role, member.cpf, member.rg]);

  const updateConfig = (patch: Partial<CardCustomizationConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      if (onSaveConfig) {
        onSaveConfig(next);
      }
      return next;
    });
  };

  const applyPreset = (presetConfig: Partial<CardCustomizationConfig>) => {
    updateConfig(presetConfig);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const cleanCpfDigits = unmask(customCpf);
      const cleanName = customName.trim() || member.name;
      const updatedData: Partial<Member> = {
        name: cleanName,
        role: customRole,
        cpf: cleanCpfDigits,
        rg: customRg.trim(),
        customCardConfig: config,
      };

      if (member.id) {
        const currentNotes = (member as any).notes;
        const packedNotes = packExtendedFieldsToNotes(currentNotes, {
          ...member,
          ...updatedData,
        });

        await membersService.update(
          member.id,
          {
            name: cleanName,
            notes: packedNotes,
          } as any,
          member.churchId
        );
      }

      if (onSaveConfig) {
        onSaveConfig(config);
      }
      if (onUpdateMember) {
        await onUpdateMember(updatedData);
      }

      toast({
        title: 'Carteirinha salva com sucesso!',
        description: `Nome, CPF, RG e modelo visual foram atualizados e salvos.`,
      });
    } catch (err: any) {
      console.error('Erro ao salvar carteirinha:', err);
      toast({
        title: 'Erro ao salvar',
        description: err?.message || 'Não foi possível salvar as alterações da carteirinha.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Determina classes de fonte
  const getFontFamilyClass = (family?: CardFontFamily) => {
    switch (family) {
      case 'cinzel':
        return 'font-serif tracking-widest';
      case 'playfair':
        return 'font-serif';
      case 'montserrat':
        return 'font-sans tracking-tight';
      case 'poppins':
        return 'font-sans';
      case 'slab':
        return 'font-serif font-bold';
      case 'script':
      case 'handwriting':
        return 'font-sans italic';
      case 'mono':
        return 'font-mono';
      case 'sans':
        return 'font-sans';
      case 'gothic':
        return 'font-serif tracking-wider';
      case 'serif':
      default:
        return 'font-serif';
    }
  };

  const getFontFamilyStyle = (family?: CardFontFamily) => {
    switch (family) {
      case 'cinzel':
        return { fontFamily: "'Cinzel', Georgia, serif" };
      case 'playfair':
        return { fontFamily: "'Playfair Display', Georgia, serif" };
      case 'montserrat':
        return { fontFamily: "'Montserrat', sans-serif" };
      case 'poppins':
        return { fontFamily: "'Poppins', sans-serif" };
      case 'slab':
        return { fontFamily: "'Roboto Slab', serif" };
      case 'script':
      case 'handwriting':
        return { fontFamily: "'Dancing Script', cursive, sans-serif" };
      case 'mono':
        return { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" };
      case 'sans':
        return { fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" };
      case 'gothic':
        return { fontFamily: "'Cinzel', Georgia, serif", letterSpacing: '1.5px' };
      case 'serif':
      default:
        return { fontFamily: "Georgia, 'Times New Roman', serif" };
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '--/--/----';
    try {
      // Aceita YYYY-MM-DD
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return format(new Date(dateStr), 'dd/MM/yyyy');
    } catch {
      return dateStr;
    }
  };

  const memberDisplayName = [member.prefix, customName]
    .filter(Boolean)
    .join(' ');

  const registrationNumber = `MB-${(member.id || '000000').slice(0, 6).toUpperCase()}`;

  // Molduras personalizadas
  const getFrameStyles = (style: CardFrameStyle) => {
    switch (style) {
      case 'classic':
        return {
          border: `2px solid ${config.primaryColor}`,
          boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
          innerBorder: `1px solid ${config.secondaryColor}`,
        };
      case 'luxury':
        return {
          border: `3px double ${config.secondaryColor}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          innerBorder: `1px dashed ${config.secondaryColor}60`,
        };
      case 'geometric':
        return {
          border: `2px solid ${config.primaryColor}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          innerBorder: `2px solid ${config.secondaryColor}80`,
        };
      case 'modern':
        return {
          border: `1.5px solid ${config.primaryColor}50`,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
          innerBorder: 'none',
        };
      case 'minimal':
        return {
          border: `1px solid rgba(0,0,0,0.15)`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          innerBorder: 'none',
        };
      case 'vintage':
        return {
          border: `3px dotted ${config.primaryColor}`,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          innerBorder: `1px solid ${config.secondaryColor}80`,
        };
      case 'royal':
        return {
          border: `3px solid ${config.primaryColor}`,
          boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
          innerBorder: `2px double ${config.secondaryColor}`,
        };
      case 'badge':
        return {
          border: `2.5px solid ${config.secondaryColor}`,
          boxShadow: '0 4px 18px rgba(0,0,0,0.12)',
          innerBorder: `1.5px dashed ${config.primaryColor}50`,
        };
      case 'double_gold':
        return {
          border: `4px double ${config.secondaryColor}`,
          boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
          innerBorder: `1px solid ${config.secondaryColor}90`,
        };
      case 'ornate':
        return {
          border: `2.5px groove ${config.secondaryColor}`,
          boxShadow: '0 6px 22px rgba(0,0,0,0.15)',
          innerBorder: `1px dotted ${config.primaryColor}`,
        };
      default:
        return {
          border: `2px solid ${config.primaryColor}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          innerBorder: `1px solid ${config.secondaryColor}`,
        };
    }
  };

  const frameInfo = getFrameStyles(config.frameStyle);

  return (
    <div className="space-y-6">
      {/* CSS Específico para Impressão Perfeita de Carteirinha (Formato CR-80 8.6cm x 5.4cm) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          .carteirinha-print-root, .carteirinha-print-root * {
            visibility: visible !important;
          }
          .carteirinha-print-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: wrap !important;
            justify-content: center !important;
            align-items: center !important;
            gap: 15mm !important;
            padding-top: 15mm !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .carteirinha-card-box {
            width: 86mm !important;
            height: 54mm !important;
            min-width: 86mm !important;
            min-height: 54mm !important;
            max-width: 86mm !important;
            max-height: 54mm !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            border-radius: 4mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `,
        }}
      />

      {/* Header com botões principais */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Carteirinha de Membro
          </h2>
          <p className="text-sm text-muted-foreground">
            Personalize cores, tipografia e moldura com visualização em tempo real e impressão oficial.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfig(DEFAULT_CARD_CONFIG)}
            className="gap-1.5"
            title="Redefinir para o padrão"
          >
            <RotateCcw className="h-4 w-4" />
            Padrão
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md text-xs sm:text-sm font-semibold"
            title="Salvar preferências da carteirinha e dados do membro"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
          <Button
            onClick={handlePrint}
            className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-md"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Painel de Customização à Esquerda (5 colunas) */}
        <div className="lg:col-span-5 space-y-6">
          <Tabs defaultValue="cores" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="cores" className="gap-1 text-xs sm:text-sm">
                <Palette className="h-3.5 w-3.5" />
                Cores & Presets
              </TabsTrigger>
              <TabsTrigger value="fontes" className="gap-1 text-xs sm:text-sm">
                <Type className="h-3.5 w-3.5" />
                Fontes & Texto
              </TabsTrigger>
              <TabsTrigger value="moldura" className="gap-1 text-xs sm:text-sm">
                <Frame className="h-3.5 w-3.5" />
                Moldura & Itens
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: CORES E TEMAS PREDEFINIDOS */}
            <TabsContent value="cores" className="space-y-5 pt-3">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-2 block">
                      Modelos / Presets Prontos
                    </Label>
                    <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                      {CARD_PRESETS.map((p) => {
                        const isSelected =
                          config.primaryColor === p.config.primaryColor &&
                          config.frameStyle === p.config.frameStyle;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => applyPreset(p.config)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
                              isSelected
                                ? 'border-primary ring-2 ring-primary/20 bg-primary/5 font-semibold'
                                : 'hover:border-primary/40 bg-card'
                            }`}
                          >
                            <span
                              className="h-5 w-5 rounded-full border shadow-sm flex-shrink-0"
                              style={{ backgroundColor: p.previewColor }}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{p.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {p.description}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                      Cores Personalizadas
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Cor Primária</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={config.primaryColor}
                            onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                            className="h-8 w-10 p-0 rounded border cursor-pointer"
                          />
                          <Input
                            value={config.primaryColor}
                            onChange={(e) => updateConfig({ primaryColor: e.target.value })}
                            className="h-8 text-xs uppercase font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Cor de Destaque</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={config.secondaryColor}
                            onChange={(e) => updateConfig({ secondaryColor: e.target.value })}
                            className="h-8 w-10 p-0 rounded border cursor-pointer"
                          />
                          <Input
                            value={config.secondaryColor}
                            onChange={(e) => updateConfig({ secondaryColor: e.target.value })}
                            className="h-8 text-xs uppercase font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-xs font-medium text-muted-foreground">Fundo do Cartão</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={config.backgroundColor.startsWith('#') ? config.backgroundColor : '#ffffff'}
                            onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                            className="h-8 w-10 p-0 rounded border cursor-pointer"
                          />
                          <Input
                            value={config.backgroundColor}
                            onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Cor da Fonte do Membro</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{config.textColor}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={config.textColor}
                            onChange={(e) => updateConfig({ textColor: e.target.value })}
                            className="h-8 w-10 p-0 rounded border cursor-pointer"
                          />
                          <Input
                            value={config.textColor}
                            onChange={(e) => updateConfig({ textColor: e.target.value })}
                            className="h-8 text-xs uppercase font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                          {CARD_TEXT_COLOR_PALETTES.slice(0, 8).map((pal) => (
                            <button
                              key={pal.id}
                              type="button"
                              onClick={() => updateConfig({ textColor: pal.color })}
                              className={`h-4 w-4 rounded-full border shadow-xs transition-transform hover:scale-125 ${
                                (config.textColor || '').toLowerCase() === pal.color.toLowerCase()
                                  ? 'ring-2 ring-primary ring-offset-1'
                                  : ''
                              }`}
                              style={{ backgroundColor: pal.color }}
                              title={pal.name}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Cor da Fonte do Cabeçalho</span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {config.headerTextColor || '#ffffff'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={config.headerTextColor || '#ffffff'}
                            onChange={(e) => updateConfig({ headerTextColor: e.target.value })}
                            className="h-8 w-10 p-0 rounded border cursor-pointer"
                          />
                          <Input
                            value={config.headerTextColor || '#ffffff'}
                            onChange={(e) => updateConfig({ headerTextColor: e.target.value })}
                            className="h-8 text-xs uppercase font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                          {CARD_HEADER_TEXT_COLOR_PALETTES.slice(0, 8).map((pal) => (
                            <button
                              key={pal.id}
                              type="button"
                              onClick={() => updateConfig({ headerTextColor: pal.color })}
                              className={`h-4 w-4 rounded-full border shadow-xs transition-transform hover:scale-125 ${
                                (config.headerTextColor || '#ffffff').toLowerCase() === pal.color.toLowerCase()
                                  ? 'ring-2 ring-primary ring-offset-1'
                                  : ''
                              }`}
                              style={{ backgroundColor: pal.color }}
                              title={pal.name}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 col-span-2 sm:col-span-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Cor do Selo (Credencial)</span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {config.badgeTextColor || config.headerTextColor || '#ffffff'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={config.badgeTextColor || config.headerTextColor || '#ffffff'}
                            onChange={(e) => updateConfig({ badgeTextColor: e.target.value })}
                            className="h-8 w-10 p-0 rounded border cursor-pointer"
                          />
                          <Input
                            value={config.badgeTextColor || config.headerTextColor || '#ffffff'}
                            onChange={(e) => updateConfig({ badgeTextColor: e.target.value })}
                            className="h-8 text-xs uppercase font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA 2: MODELOS DE FONTES & TIPOGRAFIA */}
            <TabsContent value="fontes" className="space-y-4 pt-3">
              <Card>
                <CardContent className="p-4 space-y-4">
                  {/* PALETA DE CORES DA FONTE */}
                  <div className="space-y-3 p-3.5 rounded-xl border border-primary/20 bg-primary/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-primary" />
                        <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Paleta de Cores da Fonte
                        </Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-4 w-4 rounded-full border shadow-xs"
                          style={{ backgroundColor: config.textColor || '#0f172a' }}
                        />
                        <span className="text-xs font-mono font-bold uppercase text-foreground">
                          {config.textColor || '#0f172a'}
                        </span>
                      </div>
                    </div>

                    {/* Amostra / Preview ao vivo da Fonte com a Cor Selecionada */}
                    <div
                      className="p-3 rounded-lg border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                      style={{ ...getFontFamilyStyle(config.fontFamily) }}
                    >
                      <div className="min-w-0">
                        <span className="text-[10px] text-muted-foreground block uppercase font-sans font-semibold">
                          Amostra da Cor & Tipografia:
                        </span>
                        <p
                          className="text-sm font-bold truncate leading-tight mt-0.5"
                          style={{
                            color: config.textColor || '#0f172a',
                            letterSpacing: config.letterSpacing ? `${config.letterSpacing}px` : undefined,
                            textTransform: config.textTransform,
                          }}
                        >
                          {customName || member.name || 'Pastor João da Silva'}
                        </p>
                      </div>
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded self-start sm:self-auto uppercase tracking-wide"
                        style={{
                          backgroundColor: `${config.textColor || '#0f172a'}18`,
                          color: config.textColor || '#0f172a',
                        }}
                      >
                        {customRole || 'Pastor'}
                      </span>
                    </div>

                    {/* Paleta Completa de Cores em Grade */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        Clique em uma cor para aplicar à fonte:
                      </span>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                        {CARD_TEXT_COLOR_PALETTES.map((pal) => {
                          const isSelected =
                            (config.textColor || '#0f172a').toLowerCase() === pal.color.toLowerCase();
                          return (
                            <button
                              key={pal.id}
                              type="button"
                              onClick={() => updateConfig({ textColor: pal.color })}
                              className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all text-center group ${
                                isSelected
                                  ? 'border-primary ring-2 ring-primary/30 bg-primary/10 font-bold shadow-xs'
                                  : 'border-border/60 hover:border-primary/50 bg-background/70 hover:bg-background'
                              }`}
                              title={`${pal.name} (${pal.color})`}
                            >
                              <span
                                className="h-5 w-5 rounded-full border shadow-xs transition-transform group-hover:scale-110 flex items-center justify-center relative"
                                style={{ backgroundColor: pal.color }}
                              >
                                {isSelected && (
                                  <Check
                                    className={`h-3 w-3 ${
                                      pal.category === 'claros' ? 'text-black' : 'text-white'
                                    }`}
                                  />
                                )}
                              </span>
                              <span className="text-[9px] text-muted-foreground truncate w-full mt-1 leading-tight group-hover:text-foreground">
                                {pal.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Seletor Customizado de Cor Livre */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                      <span className="text-muted-foreground font-medium text-[11px]">
                        Cor personalizada (HEX):
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={config.textColor || '#0f172a'}
                          onChange={(e) => updateConfig({ textColor: e.target.value })}
                          className="h-7 w-8 p-0 rounded border cursor-pointer"
                        />
                        <Input
                          value={config.textColor || '#0f172a'}
                          onChange={(e) => updateConfig({ textColor: e.target.value })}
                          className="h-7 w-24 text-xs uppercase font-mono"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PALETA DE CORES DA FONTE DO CABEÇALHO (FAIXA DA IGREJA & SELO) */}
                  <div className="space-y-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <Label className="text-xs font-bold uppercase tracking-wider text-foreground">
                          Cor da Fonte do Cabeçalho Superior (Faixa da Igreja)
                        </Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-4 w-4 rounded-full border shadow-xs"
                          style={{ backgroundColor: config.headerTextColor || '#ffffff' }}
                        />
                        <span className="text-xs font-mono font-bold uppercase text-foreground">
                          {config.headerTextColor || '#ffffff'}
                        </span>
                      </div>
                    </div>

                    {/* Amostra / Preview ao vivo da Faixa Superior com a Cor Selecionada */}
                    <div
                      className="p-2.5 rounded-lg border flex items-center justify-between gap-2 shadow-xs transition-colors"
                      style={{
                        backgroundColor: config.primaryColor,
                        color: config.headerTextColor || '#ffffff',
                      }}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {effectiveChurchLogo ? (
                          <div className="h-4 w-4 rounded bg-white p-0.5 shrink-0 flex items-center justify-center">
                            <img
                              src={effectiveChurchLogo}
                              alt="Logo"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <Church
                            className="h-4 w-4 shrink-0"
                            style={{ color: config.headerTextColor || '#ffffff' }}
                          />
                        )}
                        <span
                          className="font-bold text-[11px] uppercase tracking-wide truncate max-w-[200px]"
                          style={{ color: config.headerTextColor || '#ffffff' }}
                        >
                          {effectiveChurchName}
                        </span>
                      </div>
                      <span
                        className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest shrink-0"
                        style={{
                          backgroundColor: config.secondaryColor,
                          color: config.badgeTextColor || config.headerTextColor || '#ffffff',
                        }}
                      >
                        Credencial Oficial
                      </span>
                    </div>

                    {/* Paleta Completa de Cores do Cabeçalho */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground">
                        Clique em uma cor para a fonte do cabeçalho:
                      </span>
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                        {CARD_HEADER_TEXT_COLOR_PALETTES.map((pal) => {
                          const isSelected =
                            (config.headerTextColor || '#ffffff').toLowerCase() === pal.color.toLowerCase();
                          return (
                            <button
                              key={pal.id}
                              type="button"
                              onClick={() => updateConfig({ headerTextColor: pal.color })}
                              className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all text-center group ${
                                isSelected
                                  ? 'border-primary ring-2 ring-primary/30 bg-primary/10 font-bold shadow-xs'
                                  : 'border-border/60 hover:border-primary/50 bg-background/70 hover:bg-background'
                              }`}
                              title={`${pal.name} (${pal.color})`}
                            >
                              <span
                                className="h-5 w-5 rounded-full border shadow-xs transition-transform group-hover:scale-110 flex items-center justify-center relative"
                                style={{ backgroundColor: pal.color }}
                              >
                                {isSelected && (
                                  <Check
                                    className={`h-3 w-3 ${
                                      pal.category === 'claros' ? 'text-black' : 'text-white'
                                    }`}
                                  />
                                )}
                              </span>
                              <span className="text-[9px] text-muted-foreground truncate w-full mt-1 leading-tight group-hover:text-foreground">
                                {pal.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Seletores Customizados HEX de Cor do Cabeçalho e do Selo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/50 text-xs">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-muted-foreground text-[11px] truncate">Nome da Igreja:</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="color"
                            value={config.headerTextColor || '#ffffff'}
                            onChange={(e) => updateConfig({ headerTextColor: e.target.value })}
                            className="h-7 w-8 p-0 rounded border cursor-pointer"
                          />
                          <Input
                            value={config.headerTextColor || '#ffffff'}
                            onChange={(e) => updateConfig({ headerTextColor: e.target.value })}
                            className="h-7 w-20 text-xs uppercase font-mono"
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1.5">
                        <span className="text-muted-foreground text-[11px] truncate">Texto do Selo:</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="color"
                            value={config.badgeTextColor || config.headerTextColor || '#ffffff'}
                            onChange={(e) => updateConfig({ badgeTextColor: e.target.value })}
                            className="h-7 w-8 p-0 rounded border cursor-pointer"
                          />
                          <Input
                            value={config.badgeTextColor || config.headerTextColor || '#ffffff'}
                            onChange={(e) => updateConfig({ badgeTextColor: e.target.value })}
                            className="h-7 w-20 text-xs uppercase font-mono"
                            placeholder="#ffffff"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                      Família Tipográfica
                    </Label>
                    <Select
                      value={config.fontFamily}
                      onValueChange={(val: CardFontFamily) => updateConfig({ fontFamily: val })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {CARD_FONTS_LIST.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            <div className="flex items-center justify-between gap-3 w-full py-0.5">
                              <span style={getFontFamilyStyle(f.id)} className="font-semibold text-xs">
                                {f.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground ml-auto pl-2">
                                {f.category}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* FERRAMENTAS DE ALINHAMENTO */}
                  <div className="space-y-1.5 pt-1">
                    <Label className="text-xs font-medium">Alinhamento do Texto</Label>
                    <div className="grid grid-cols-4 gap-1 p-1 bg-muted/50 rounded-lg border">
                      {[
                        { id: 'left', label: 'Esquerda', icon: AlignLeft },
                        { id: 'center', label: 'Centralizar', icon: AlignCenter },
                        { id: 'right', label: 'Direita', icon: AlignRight },
                        { id: 'justify', label: 'Justificar', icon: AlignJustify },
                      ].map((align) => {
                        const Icon = align.icon;
                        const isSelected = (config.textAlign || 'left') === align.id;
                        return (
                          <Button
                            key={align.id}
                            type="button"
                            size="sm"
                            variant={isSelected ? 'default' : 'ghost'}
                            className={`h-8 text-xs gap-1 px-1.5 ${
                              isSelected
                                ? 'shadow-sm font-semibold'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={() => updateConfig({ textAlign: align.id as CardTextAlign })}
                            title={`Alinhamento ${align.label}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline text-[11px]">{align.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ESPAÇAMENTO ENTRE LETRAS (LETTER-SPACING) */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Espaçamento entre Letras</Label>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            updateConfig({
                              letterSpacing: Math.max(
                                -1,
                                Math.round(((config.letterSpacing || 0) - 0.5) * 10) / 10
                              ),
                            })
                          }
                          title="Diminuir espaçamento"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-xs font-bold min-w-[2.5rem] text-center">
                          {config.letterSpacing || 0}px
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            updateConfig({
                              letterSpacing: Math.min(
                                8,
                                Math.round(((config.letterSpacing || 0) + 0.5) * 10) / 10
                              ),
                            })
                          }
                          title="Aumentar espaçamento"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Slider
                      value={[config.letterSpacing || 0]}
                      min={-1}
                      max={8}
                      step={0.5}
                      onValueChange={([val]) => updateConfig({ letterSpacing: val })}
                    />
                  </div>

                  {/* TAMANHO DO NOME */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Tamanho do Nome do Membro</Label>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateConfig({ fontSize: Math.max(10, config.fontSize - 1) })}
                          title="Diminuir"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-xs font-bold min-w-[2.5rem] text-center">
                          {config.fontSize}px
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateConfig({ fontSize: Math.min(24, config.fontSize + 1) })}
                          title="Aumentar"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Slider
                      value={[config.fontSize]}
                      min={10}
                      max={24}
                      step={1}
                      onValueChange={([val]) => updateConfig({ fontSize: val })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Peso da Fonte</Label>
                      <Select
                        value={config.fontWeight}
                        onValueChange={(val: any) => updateConfig({ fontWeight: val })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="semibold">Semi-Negrito</SelectItem>
                          <SelectItem value="bold">Negrito</SelectItem>
                          <SelectItem value="black">Extra Negrito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Formato do Nome</Label>
                      <Select
                        value={config.textTransform}
                        onValueChange={(val: any) => updateConfig({ textTransform: val })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="uppercase">MAIÚSCULO</SelectItem>
                          <SelectItem value="capitalize">Primeira Maiúscula</SelectItem>
                          <SelectItem value="none">Original</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-3">
                    <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider block">
                      Dados do Titular na Credencial
                    </Label>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Nome do Membro</Label>
                      <Input
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Nome completo do membro"
                        className="h-8 text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Cargo/Função no Cartão</Label>
                      <Input
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        placeholder="Ex: Pastor, Diácono, Membro..."
                        className="h-8 text-xs font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">CPF do Titular</Label>
                        <Input
                          value={customCpf}
                          onChange={(e) => setCustomCpf(maskCPF(e.target.value))}
                          placeholder="000.000.000-00"
                          className="h-8 text-xs font-mono font-medium"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">RG do Titular</Label>
                        <Input
                          value={customRg}
                          onChange={(e) => setCustomRg(e.target.value)}
                          placeholder="Número do RG"
                          className="h-8 text-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ABA 3: ESTILOS DE MOLDURA & ELEMENTOS VISÍVEIS */}
            <TabsContent value="moldura" className="space-y-4 pt-3">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                      Estilo da Moldura / Borda
                    </Label>
                    <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                      {CARD_FRAMES_LIST.map((m) => {
                        const isSelected = config.frameStyle === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => updateConfig({ frameStyle: m.id as CardFrameStyle })}
                            className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                              isSelected
                                ? 'border-primary ring-2 ring-primary/20 bg-primary/5 font-semibold'
                                : 'hover:border-primary/40 bg-card'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{m.name}</span>
                              {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
                            </div>
                            <span className="text-[10px] text-muted-foreground block mt-0.5">{m.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-3">
                    <Label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                      Campos Exibidos na Credencial
                    </Label>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="toggle-docs" className="text-xs cursor-pointer">
                          Exibir CPF / RG
                        </Label>
                        <Switch
                          id="toggle-docs"
                          checked={config.showDocuments}
                          onCheckedChange={(checked) => updateConfig({ showDocuments: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="toggle-blood" className="text-xs cursor-pointer">
                          Tipo Sanguíneo & Doador de Órgãos
                        </Label>
                        <Switch
                          id="toggle-blood"
                          checked={config.showBloodType}
                          onCheckedChange={(checked) => updateConfig({ showBloodType: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="toggle-parentage" className="text-xs cursor-pointer">
                          Filiação no Verso (Pai & Mãe)
                        </Label>
                        <Switch
                          id="toggle-parentage"
                          checked={config.showParentage}
                          onCheckedChange={(checked) => updateConfig({ showParentage: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="toggle-qr" className="text-xs cursor-pointer">
                          QR Code de Validação
                        </Label>
                        <Switch
                          id="toggle-qr"
                          checked={config.showQrCode}
                          onCheckedChange={(checked) => updateConfig({ showQrCode: checked })}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="toggle-baptism" className="text-xs cursor-pointer">
                          Data de Batismo
                        </Label>
                        <Switch
                          id="toggle-baptism"
                          checked={config.showBaptismDate}
                          onCheckedChange={(checked) => updateConfig({ showBaptismDate: checked })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Pré-visualização da Carteirinha à Direita (7 colunas) */}
        <div className="lg:col-span-7 flex flex-col items-center gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-xl">
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border text-xs">
              <Button
                type="button"
                variant={activeSide === 'both' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSide('both')}
                className="h-7 text-xs"
              >
                Frente e Verso
              </Button>
              <Button
                type="button"
                variant={activeSide === 'front' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSide('front')}
                className="h-7 text-xs"
              >
                Apenas Frente
              </Button>
              <Button
                type="button"
                variant={activeSide === 'back' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSide('back')}
                className="h-7 text-xs"
              >
                Apenas Verso
              </Button>
            </div>

            {/* Ferramentas Rápidas de Alinhamento (Justificar, Centralizar, Esquerda, Direita) */}
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border text-xs" title="Alinhamento dos Textos da Carteirinha">
              <span className="text-[11px] font-semibold text-muted-foreground px-1 hidden sm:inline">Alinhar:</span>
              {[
                { id: 'left', label: 'Esquerda', icon: AlignLeft },
                { id: 'center', label: 'Centralizar', icon: AlignCenter },
                { id: 'right', label: 'Direita', icon: AlignRight },
                { id: 'justify', label: 'Justificar', icon: AlignJustify },
              ].map((align) => {
                const Icon = align.icon;
                const isSelected = (config.textAlign || 'left') === align.id;
                return (
                  <Button
                    key={align.id}
                    type="button"
                    size="sm"
                    variant={isSelected ? 'default' : 'ghost'}
                    className={`h-7 px-2 text-xs gap-1 ${
                      isSelected
                        ? 'shadow-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => updateConfig({ textAlign: align.id as CardTextAlign })}
                    title={`Alinhar ${align.label}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden md:inline text-[11px]">{align.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Área Renderizada das Carteirinhas (Frente e Verso) */}
          <div
            ref={printAreaRef}
            className="carteirinha-print-root flex flex-col md:flex-row items-center justify-center gap-6 p-4 rounded-2xl bg-muted/30 border border-dashed border-primary/20 w-full"
          >
            {/* ================= FRENTE DO CARTÃO ================= */}
            {(activeSide === 'both' || activeSide === 'front') && (
              <div
                className={`carteirinha-card-box relative overflow-hidden flex flex-col select-none ${getFontFamilyClass(
                  config.fontFamily
                )}`}
                style={{
                  width: '380px',
                  height: '240px',
                  backgroundColor: config.backgroundColor,
                  color: config.textColor,
                  borderRadius: '14px',
                  border: frameInfo.border,
                  boxShadow: frameInfo.boxShadow,
                  ...getFontFamilyStyle(config.fontFamily),
                }}
              >
                {/* Linha interna da moldura se houver */}
                {frameInfo.innerBorder !== 'none' && (
                  <div
                    className="absolute inset-1.5 pointer-events-none rounded-[10px]"
                    style={{ border: frameInfo.innerBorder }}
                  />
                )}

                {/* Faixa decorativa superior com cabeçalho institucional */}
                <div
                  className="w-full px-3 py-1.5 flex items-center justify-between relative z-10"
                  style={{
                    backgroundColor: config.primaryColor,
                    color: config.headerTextColor || '#ffffff',
                  }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {effectiveChurchLogo ? (
                      <div className="h-5 w-5 rounded bg-white p-0.5 shrink-0 flex items-center justify-center shadow-sm">
                        <img
                          src={effectiveChurchLogo}
                          alt="Logo da Igreja"
                          className="w-full h-full object-contain"
                          crossOrigin="anonymous"
                        />
                      </div>
                    ) : (
                      <Church
                        className="h-4 w-4 shrink-0"
                        style={{ color: config.headerTextColor || '#ffffff' }}
                      />
                    )}
                    <span
                      className="font-bold text-[11px] uppercase tracking-wide truncate max-w-[240px]"
                      style={{ color: config.headerTextColor || '#ffffff' }}
                    >
                      {effectiveChurchName}
                    </span>
                  </div>
                  <span
                    className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest shrink-0 shadow-xs"
                    style={{
                      backgroundColor: config.secondaryColor,
                      color: config.badgeTextColor || config.headerTextColor || '#ffffff',
                    }}
                  >
                    Credencial Oficial
                  </span>
                </div>

                {/* Corpo do Cartão Frente */}
                <div className="flex-1 p-3 flex gap-3 relative z-10">
                  {/* Foto e Badges Médicos */}
                  <div className="w-[100px] flex flex-col items-center gap-1.5 shrink-0">
                    <div
                      className="w-[94px] h-[106px] rounded-lg overflow-hidden border-2 bg-muted/40 shadow-sm relative flex items-center justify-center"
                      style={{ borderColor: config.secondaryColor }}
                    >
                      {member.photoUrl ? (
                        <img
                          src={member.photoUrl}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground">
                          <span className="text-2xl font-bold">
                            {(member.name || 'M').charAt(0).toUpperCase()}
                          </span>
                          <span className="text-[9px] uppercase font-semibold">Sem Foto</span>
                        </div>
                      )}
                    </div>

                    {/* Matrícula / Registro */}
                    <div
                      className="w-full text-center py-0.5 px-1 rounded text-[8px] font-mono font-bold tracking-wider"
                      style={{
                        backgroundColor: `${config.primaryColor}15`,
                        color: config.primaryColor,
                      }}
                    >
                      {registrationNumber}
                    </div>

                    {/* Dados médicos na foto se habilitados */}
                    {config.showBloodType && (member.bloodType || member.organDonor) && (
                      <div className="flex items-center justify-center gap-1.5 w-full text-[8px]">
                        {member.bloodType && (
                          <span
                            className="flex items-center gap-0.5 font-bold px-1 rounded"
                            style={{
                              backgroundColor: '#fee2e2',
                              color: '#b91c1c',
                            }}
                            title="Tipo Sanguíneo"
                          >
                            <Droplet className="h-2.5 w-2.5 fill-current" />
                            {member.bloodType}
                          </span>
                        )}
                        {member.organDonor === 'Sim' && (
                          <span
                            className="flex items-center gap-0.5 font-bold px-1 rounded text-[7px]"
                            style={{
                              backgroundColor: '#dcfce7',
                              color: '#15803d',
                            }}
                            title="Doador de Órgãos"
                          >
                            <Heart className="h-2 w-2 fill-current" />
                            DOADOR
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Informações Textuais do Membro */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 pr-1">
                    {/* Nome do Membro */}
                    <div className="group relative" style={{ textAlign: config.textAlign || 'left' }}>
                      <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-semibold block leading-none">
                        Nome do Membro
                      </span>
                      <input
                        type="text"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        placeholder="Nome do Membro"
                        className="print:hidden w-full bg-transparent border border-dashed border-transparent hover:border-primary/50 focus:border-primary focus:bg-white/80 dark:focus:bg-slate-900/80 rounded px-1 -mx-1 py-0 outline-none truncate leading-tight mt-0.5 transition-all cursor-text"
                        style={{
                          fontSize: `${config.fontSize}px`,
                          fontWeight:
                            config.fontWeight === 'black'
                              ? 900
                              : config.fontWeight === 'bold'
                              ? 700
                              : config.fontWeight === 'semibold'
                              ? 600
                              : 400,
                          textTransform: config.textTransform,
                          color: config.textColor || config.primaryColor,
                          textAlign: config.textAlign || 'left',
                          textAlignLast: config.textAlign === 'justify' ? 'justify' : undefined,
                          letterSpacing: config.letterSpacing ? `${config.letterSpacing}px` : undefined,
                          ...getFontFamilyStyle(config.fontFamily),
                        }}
                        title="Clique para editar o nome do membro diretamente"
                      />
                      <p
                        className="hidden print:block truncate leading-tight mt-0.5"
                        style={{
                          fontSize: `${config.fontSize}px`,
                          fontWeight:
                            config.fontWeight === 'black'
                              ? 900
                              : config.fontWeight === 'bold'
                              ? 700
                              : config.fontWeight === 'semibold'
                              ? 600
                              : 400,
                          textTransform: config.textTransform,
                          color: config.textColor || config.primaryColor,
                          textAlign: config.textAlign || 'left',
                          textAlignLast: config.textAlign === 'justify' ? 'justify' : undefined,
                          letterSpacing: config.letterSpacing ? `${config.letterSpacing}px` : undefined,
                          ...getFontFamilyStyle(config.fontFamily),
                        }}
                      >
                        {memberDisplayName || 'Nome do Membro'}
                      </p>
                      {member.nickname && (
                        <span className="text-[9px] text-muted-foreground italic block leading-none">
                          ({member.nickname})
                        </span>
                      )}
                    </div>

                    {/* Cargo / Função eclesiástica editável e alinhável */}
                    <div
                      className="py-1 px-2 rounded-md transition-all group relative"
                      style={{
                        backgroundColor: `${config.primaryColor}12`,
                        borderLeft: `3px solid ${config.secondaryColor}`,
                        textAlign: config.textAlign || 'left',
                      }}
                    >
                      <span
                        className="text-[7px] uppercase font-bold tracking-wider block leading-none"
                        style={{
                          color: config.textColor || config.primaryColor,
                          textAlign: config.textAlign || 'left',
                        }}
                      >
                        Função Eclesiástica
                      </span>

                      {/* Campo editável diretamente na carteirinha */}
                      <input
                        type="text"
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        placeholder="Função Eclesiástica (Ex: Pastor, Membro...)"
                        className="print:hidden w-full bg-transparent border border-dashed border-transparent hover:border-primary/50 focus:border-primary focus:bg-white/80 dark:focus:bg-slate-900/80 rounded px-1 -mx-1 py-0 outline-none truncate leading-tight mt-0.5 text-[10px] font-black uppercase tracking-wide transition-all cursor-text"
                        style={{
                          color: config.textColor || config.primaryColor,
                          textAlign: config.textAlign || 'left',
                          textAlignLast: config.textAlign === 'justify' ? 'justify' : undefined,
                          letterSpacing: config.letterSpacing ? `${config.letterSpacing}px` : undefined,
                          ...getFontFamilyStyle(config.fontFamily),
                        }}
                        title="Clique para editar a função eclesiástica diretamente"
                      />

                      {/* Texto renderizado para impressão */}
                      <p
                        className="hidden print:block truncate leading-tight mt-0.5 text-[10px] font-black uppercase tracking-wide"
                        style={{
                          color: config.textColor || config.primaryColor,
                          textAlign: config.textAlign || 'left',
                          textAlignLast: config.textAlign === 'justify' ? 'justify' : undefined,
                          letterSpacing: config.letterSpacing ? `${config.letterSpacing}px` : undefined,
                          ...getFontFamilyStyle(config.fontFamily),
                        }}
                      >
                        {customRole || 'Membro'}
                      </p>
                    </div>

                    {/* Grid com datas e documentos */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8.5px]">
                      <div>
                        <span className="text-muted-foreground block text-[7px] uppercase font-semibold">
                          Nascimento
                        </span>
                        <span className="font-bold" style={{ color: config.textColor || config.primaryColor }}>
                          {formatDate(member.birthDate)}
                        </span>
                      </div>

                      {config.showBaptismDate && (
                        <div>
                          <span className="text-muted-foreground block text-[7px] uppercase font-semibold">
                            Batismo
                          </span>
                          <span className="font-bold" style={{ color: config.textColor || config.primaryColor }}>
                            {formatDate(member.baptismDate)}
                          </span>
                        </div>
                      )}

                      {config.showDocuments && (
                        <>
                          <div>
                            <span className="text-muted-foreground block text-[7px] uppercase font-semibold">
                              CPF
                            </span>
                            <span className="font-bold" style={{ color: config.textColor || config.primaryColor }}>
                              {customCpf ? maskCPF(customCpf) : '---.---.--- --'}
                            </span>
                          </div>

                          <div>
                            <span className="text-muted-foreground block text-[7px] uppercase font-semibold">
                              RG
                            </span>
                            <span className="font-bold" style={{ color: config.textColor || config.primaryColor }}>
                              {customRg || 'Não informado'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Assinatura do Portador */}
                    <div className="pt-1 flex flex-col items-center">
                      <div className="w-28 border-t border-black/40 dark:border-white/40" />
                      <span className="text-[7px] uppercase font-semibold text-muted-foreground tracking-wider mt-0.5">
                        Assinatura do Titular
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rodapé decorativo */}
                <div
                  className="w-full h-1 relative z-10"
                  style={{
                    background: `linear-gradient(90deg, ${config.primaryColor}, ${config.secondaryColor})`,
                  }}
                />
              </div>
            )}

            {/* ================= VERSO DO CARTÃO ================= */}
            {(activeSide === 'both' || activeSide === 'back') && (
              <div
                className={`carteirinha-card-box relative overflow-hidden flex flex-col justify-between p-3 select-none text-center ${getFontFamilyClass(
                  config.fontFamily
                )}`}
                style={{
                  width: '380px',
                  height: '240px',
                  backgroundColor: config.backgroundColor,
                  color: config.textColor,
                  borderRadius: '14px',
                  border: frameInfo.border,
                  boxShadow: frameInfo.boxShadow,
                  ...getFontFamilyStyle(config.fontFamily),
                }}
              >
                {/* Linha interna da moldura se houver */}
                {frameInfo.innerBorder !== 'none' && (
                  <div
                    className="absolute inset-1.5 pointer-events-none rounded-[10px]"
                    style={{ border: frameInfo.innerBorder }}
                  />
                )}

                {/* Topo do Verso: Dados da Igreja */}
                <div className="space-y-0.5 relative z-10">
                  <div className="flex items-center justify-center gap-1.5">
                    {effectiveChurchLogo ? (
                      <div className="h-6 w-6 rounded bg-white p-0.5 shrink-0 flex items-center justify-center shadow-sm border border-black/5">
                        <img
                          src={effectiveChurchLogo}
                          alt="Logo da Igreja"
                          className="w-full h-full object-contain"
                          crossOrigin="anonymous"
                        />
                      </div>
                    ) : (
                      <Church
                        className="h-4 w-4 shrink-0"
                        style={{ color: config.primaryColor }}
                      />
                    )}
                    <h3
                      className="text-xs font-black uppercase tracking-wide"
                      style={{ color: config.primaryColor }}
                    >
                      {effectiveChurchName}
                    </h3>
                  </div>
                  <p className="text-[8px] font-bold text-muted-foreground uppercase">
                    CNPJ: {effectiveCnpj}
                  </p>
                  <p className="text-[7.5px] text-muted-foreground truncate max-w-[340px] mx-auto">
                    {effectiveChurchAddress}
                  </p>
                </div>

                {/* Meio: Filiação e Nacionalidade */}
                <div className="my-1 py-1.5 px-3 rounded-lg bg-muted/30 border border-muted/60 relative z-10 text-left space-y-1 text-[8px]">
                  {config.showParentage && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[7px] text-muted-foreground uppercase font-bold block">
                          Mãe
                        </span>
                        <span className="font-semibold truncate block">
                          {member.motherName || 'Não informada'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[7px] text-muted-foreground uppercase font-bold block">
                          Pai
                        </span>
                        <span className="font-semibold truncate block">
                          {member.fatherName || 'Não informado'}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-0.5 border-t border-muted text-[7.5px]">
                    <span>
                      <strong>Nacionalidade:</strong> {member.nationality || 'Brasileira'}
                    </span>
                    <span>
                      <strong>Atualização:</strong> {formatDate(member.registrationUpdatedAt || member.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Validação / QR Code e Assinatura do Pastor */}
                <div className="flex items-center justify-between px-2 relative z-10">
                  {/* QR Code Simulado ou SVG */}
                  {config.showQrCode && (
                    <div className="flex items-center gap-1.5 text-left">
                      <div className="p-1 rounded bg-white border shadow-sm">
                        <QrIcon className="h-9 w-9 text-black" />
                      </div>
                      <div className="text-[6.5px] leading-tight text-muted-foreground">
                        <span className="font-bold uppercase text-black block">
                          Validar Credencial
                        </span>
                        <span>Doc. Oficial ID:</span>
                        <span className="font-mono block font-bold text-black">
                          {registrationNumber}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Assinatura do Pastor Presidente */}
                  <div className="flex flex-col items-center">
                    <div className="w-32 border-t border-black/50 dark:border-white/50" />
                    <span className="text-[7.5px] font-bold uppercase mt-0.5 text-black">
                      {pastorName}
                    </span>
                    <span className="text-[6.5px] uppercase text-muted-foreground font-semibold">
                      Pastor Presidente
                    </span>
                  </div>
                </div>

                {/* Rodapé Legal */}
                <div className="text-[6.5px] uppercase text-muted-foreground font-medium pt-1 border-t relative z-10">
                  Esta credencial é pessoal e intransferível. Válida como identificação eclesiástica.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
