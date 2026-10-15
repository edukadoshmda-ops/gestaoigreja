import { forwardRef, memo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Award,
  Bold,
  Italic,
  List,
  ListOrdered,
  Printer,
  Redo2,
  RemoveFormatting,
  RotateCcw,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CARD_FONTS_LIST,
  CARD_PRESETS,
  CARD_TEXT_COLOR_PALETTES,
  DEFAULT_CARD_CONFIG,
} from '@/lib/memberUtils';
import type { CardCustomizationConfig, CardFontFamily } from '@/types';

type CertificateTemplateId =
  | 'baptism'
  | 'presentation-boy'
  | 'presentation-girl'
  | 'school-completion'
  | 'school-participation'
  | 'custom';

type CertificateFrame =
  | 'classic'
  | 'ornate'
  | 'floral'
  | 'royal'
  | 'geometric'
  | 'minimal';

type CertificateStyle = Pick<
  CardCustomizationConfig,
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'textTransform'
  | 'textAlign'
  | 'letterSpacing'
  | 'primaryColor'
  | 'secondaryColor'
  | 'backgroundColor'
  | 'textColor'
>;

type PageOrientation = 'landscape' | 'portrait';

const CERTIFICATE_FRAMES: { id: CertificateFrame; label: string; ornament: string }[] = [
  { id: 'classic', label: 'Clássica dupla', ornament: '✦' },
  { id: 'ornate', label: 'Ornamental dourada', ornament: '❧' },
  { id: 'floral', label: 'Floral', ornament: '❦' },
  { id: 'royal', label: 'Real', ornament: '♛' },
  { id: 'geometric', label: 'Geométrica', ornament: '◆' },
  { id: 'minimal', label: 'Minimalista', ornament: '' },
];

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const templates: Record<CertificateTemplateId, { label: string; title: string; body: string; course?: string }> = {
  baptism: {
    label: 'Batismo',
    title: 'Certificado de Batismo',
    body: '{{nome}} recebeu o batismo nas águas, confessando publicamente sua fé em Jesus Cristo, nesta comunidade cristã.',
  },
  'presentation-boy': {
    label: 'Apresentação de Criança — Menino',
    title: 'Certificado de Apresentação',
    body: '{{nome}} foi apresentado perante Deus e a comunidade cristã. Seus pais e responsáveis assumem o compromisso de conduzi-lo nos ensinamentos da fé.',
  },
  'presentation-girl': {
    label: 'Apresentação de Criança — Menina',
    title: 'Certificado de Apresentação',
    body: '{{nome}} foi apresentada perante Deus e a comunidade cristã. Seus pais e responsáveis assumem o compromisso de conduzi-la nos ensinamentos da fé.',
  },
  'school-completion': {
    label: 'Conclusão de Escola / Curso',
    title: 'Certificado de Conclusão',
    course: 'Nome da escola ou curso',
    body: '{{nome}} concluiu com aproveitamento {{curso}}, oferecido por nossa instituição.',
  },
  'school-participation': {
    label: 'Participação em Escola / Curso',
    title: 'Certificado de Participação',
    course: 'Nome da escola ou curso',
    body: '{{nome}} participou de {{curso}}, cumprindo as atividades propostas por nossa instituição.',
  },
  custom: {
    label: 'Outro certificado',
    title: 'Certificado',
    body: '{{nome}} participou desta atividade e cumpriu os requisitos estabelecidos.',
  },
};

const DEFAULT_STYLE: CertificateStyle = {
  fontFamily: DEFAULT_CARD_CONFIG.fontFamily,
  fontSize: 34,
  fontWeight: DEFAULT_CARD_CONFIG.fontWeight,
  textTransform: DEFAULT_CARD_CONFIG.textTransform,
  textAlign: 'center',
  letterSpacing: 0,
  primaryColor: DEFAULT_CARD_CONFIG.primaryColor,
  secondaryColor: DEFAULT_CARD_CONFIG.secondaryColor,
  backgroundColor: DEFAULT_CARD_CONFIG.backgroundColor,
  textColor: DEFAULT_CARD_CONFIG.textColor,
};

const fontFamilies: Record<CardFontFamily, string> = {
  sans: 'Arial, sans-serif',
  serif: 'Georgia, serif',
  cinzel: "'Cinzel', Georgia, serif",
  mono: "'Courier New', monospace",
  handwriting: "'Segoe Print', cursive",
  playfair: "'Playfair Display', Georgia, serif",
  montserrat: "'Montserrat', Arial, sans-serif",
  poppins: "'Poppins', Arial, sans-serif",
  slab: "'Roboto Slab', Georgia, serif",
  gothic: 'Georgia, serif',
  script: "'Dancing Script', cursive",
};

function frameBorder(frame: CertificateFrame, color: string): string {
  switch (frame) {
    case 'ornate':
      return `8px ridge ${color}`;
    case 'floral':
      return `5px double ${color}`;
    case 'royal':
      return `9px double ${color}`;
    case 'geometric':
      return `4px solid ${color}`;
    case 'minimal':
      return `2px solid ${color}`;
    default:
      return `6px double ${color}`;
  }
}

function formatCertificateDate(value: string): string {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(year, month - 1, day));
}

const CertificateDocument = memo(
  forwardRef<
    HTMLElement,
    {
      title: string;
      introduction: string;
      body: string;
      churchName: string;
      churchLogo?: string;
      pastorName: string;
      date: string;
      frame: CertificateFrame;
    }
  >(function CertificateDocument(
    { title, introduction, body, churchName, churchLogo, pastorName, date, frame },
    ref
  ) {
    return (
      <article
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        aria-label="Documento do certificado. Clique no texto para editar."
        className="certificate-page relative mx-auto grid w-full max-w-[900px] grid-rows-[auto_minmax(0,1fr)_auto] items-center gap-2 overflow-hidden p-4 text-center shadow-lg sm:gap-3 sm:p-8 md:p-12"
      >
        {frame !== 'minimal' && (
          <div aria-hidden="true" className="certificate-inner-frame pointer-events-none absolute inset-2 sm:inset-3" />
        )}
        {CERTIFICATE_FRAMES.find((option) => option.id === frame)?.ornament &&
          ['✦', '✦', '✦', '✦'].map((ornament, index) => (
          <span
            key={index}
            aria-hidden="true"
            contentEditable={false}
            className={`certificate-ornament pointer-events-none absolute z-10 text-lg sm:text-2xl ${
              index < 2 ? 'top-3' : 'bottom-3'
            } ${index % 2 === 0 ? 'left-3' : 'right-3'}`}
          >
            {ornament}
          </span>
        ))}
        <header className="relative z-10 flex w-full flex-col items-center gap-1">
          {churchLogo && (
            <img
              src={churchLogo}
              alt="Logo da igreja"
              draggable={false}
              contentEditable={false}
              className="mb-1 h-8 max-w-20 object-contain sm:h-14 sm:max-w-32"
            />
          )}
          <p className="max-w-full break-words text-[clamp(9px,1.6cqw,14px)] font-semibold uppercase tracking-[0.12em]">
            {churchName || 'Nome da Igreja'}
          </p>
          <div className="h-px w-1/3 bg-[var(--certificate-secondary)]" />
        </header>

        <main className="certificate-document-content relative z-10 flex min-h-0 w-full flex-col items-center justify-center">
          <h1 className="max-w-full break-words text-[clamp(20px,4cqw,38px)] font-bold leading-tight">
            {title}
          </h1>
          <p className="certificate-introduction text-[clamp(10px,1.7cqw,15px)] font-medium">{introduction}</p>
          <p className="certificate-recipient max-w-full break-words border-b-2 border-[var(--certificate-secondary)] px-3 pb-1 text-[clamp(18px,3.2cqw,30px)] font-semibold leading-tight sm:px-8">
            Nome do(a) homenageado(a)
          </p>
          <p className="certificate-body max-w-3xl whitespace-pre-line break-words text-[clamp(10px,1.7cqw,15px)] leading-snug">
            {body}
          </p>
        </main>

        <footer className="relative z-10 flex w-full flex-col items-center gap-2 sm:gap-4">
          <p className="certificate-date text-[clamp(9px,1.5cqw,13px)]">{date}</p>
          <div className="flex w-full flex-wrap justify-center gap-6 sm:gap-16">
            <div className="min-w-24 max-w-64 flex-1">
              <div className="mb-1 border-t border-[var(--certificate-secondary)]" />
              <p className="certificate-signature text-[clamp(9px,1.4cqw,12px)] font-semibold">
                {pastorName || 'Pastor Presidente'}
              </p>
              <p className="certificate-signature-role text-[clamp(8px,1.2cqw,10px)] text-muted-foreground">
                Responsável
              </p>
            </div>
            <div className="certificate-second-signature min-w-24 max-w-64 flex-1">
              <div className="mb-1 border-t border-[var(--certificate-secondary)]" />
              <p className="certificate-signature text-[clamp(9px,1.4cqw,12px)] font-semibold">
                Nome do segundo responsável
              </p>
              <p className="certificate-signature-role text-[clamp(8px,1.2cqw,10px)] text-muted-foreground">
                Assinatura
              </p>
            </div>
          </div>
        </footer>
      </article>
    );
  })
);

export function CertificateBuilder({
  churchName,
  churchLogo,
  pastorName,
}: {
  churchName: string;
  churchLogo?: string;
  pastorName: string;
}) {
  const [templateId, setTemplateId] = useState<CertificateTemplateId>('baptism');
  const [style, setStyle] = useState<CertificateStyle>(DEFAULT_STYLE);
  const [frame, setFrame] = useState<CertificateFrame>('classic');
  const [orientation, setOrientation] = useState<PageOrientation>('landscape');
  const [lineSpacing, setLineSpacing] = useState(1.35);
  const [paragraphSpacing, setParagraphSpacing] = useState(12);
  const [documentFontSize, setDocumentFontSize] = useState(16);
  const [documentFontFamily, setDocumentFontFamily] = useState<CardFontFamily>(DEFAULT_STYLE.fontFamily);
  const [documentTextColor, setDocumentTextColor] = useState(DEFAULT_STYLE.textColor);
  const [documentHighlightColor, setDocumentHighlightColor] = useState('#fff59d');
  const documentRef = useRef<HTMLElement>(null);
  const selectionRangeRef = useRef<Range | null>(null);

  const selectTemplate = (value: string) => {
    setTemplateId(value as CertificateTemplateId);
  };

  const rememberSelection = (event: ReactMouseEvent<HTMLElement>) => {
    event.preventDefault();
    captureSelection();
  };

  const captureSelection = () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (documentRef.current?.contains(range.commonAncestorContainer)) {
      selectionRangeRef.current = range.cloneRange();
    }
  };

  const restoreSelection = (): Range | null => {
    const editor = documentRef.current;
    const range = selectionRangeRef.current;
    if (!editor || !range || !editor.contains(range.commonAncestorContainer)) return null;
    const selection = window.getSelection();
    if (!selection) return null;
    selection.removeAllRanges();
    selection.addRange(range);
    return range;
  };

  const applyTextStyle = (property: 'fontFamily' | 'fontSize' | 'color', value: string) => {
    const normalizedValue =
      property === 'fontSize' ? String(Math.min(96, Math.max(6, Number(value) || 6))) : value;
    if (property === 'fontFamily') setDocumentFontFamily(normalizedValue as CardFontFamily);
    if (property === 'fontSize') setDocumentFontSize(Number(normalizedValue));
    if (property === 'color') setDocumentTextColor(normalizedValue);
    const range = restoreSelection();
    if (!range || range.collapsed) return;

    if (property === 'fontFamily') {
      document.execCommand('fontName', false, fontFamilies[normalizedValue as CardFontFamily]);
    } else if (property === 'color') {
      document.execCommand('foreColor', false, normalizedValue);
    } else {
      document.execCommand('fontSize', false, '7');
      documentRef.current?.querySelectorAll('font[size="7"]').forEach((font) => {
        const span = document.createElement('span');
        span.style.fontSize = `${normalizedValue}px`;
        font.replaceWith(span);
        span.append(...Array.from(font.childNodes));
      });
    }
    selectionRangeRef.current = null;
  };

  const applyCommand = (command: string) => {
    if (!restoreSelection()) {
      const alignment = {
        justifyLeft: 'left',
        justifyCenter: 'center',
        justifyRight: 'right',
        justifyFull: 'justify',
      }[command] as CertificateStyle['textAlign'] | undefined;
      if (alignment) setStyle((current) => ({ ...current, textAlign: alignment }));
      return;
    }
    document.execCommand(command, false);
    selectionRangeRef.current = null;
  };

  const applyBlockFormat = (tagName: string) => {
    if (!restoreSelection()) return;
    document.execCommand('formatBlock', false, tagName);
    selectionRangeRef.current = null;
  };

  const applyTextHighlight = (color: string) => {
    setDocumentHighlightColor(color);
    if (!restoreSelection()) return;
    document.execCommand('hiliteColor', false, color);
    selectionRangeRef.current = null;
  };

  const applyPreset = (presetId: string) => {
    const preset = CARD_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setStyle((current) => ({
      ...current,
      fontFamily: preset.config.fontFamily ?? current.fontFamily,
      primaryColor: preset.config.primaryColor ?? current.primaryColor,
      secondaryColor: preset.config.secondaryColor ?? current.secondaryColor,
      backgroundColor: preset.config.backgroundColor ?? current.backgroundColor,
      textColor: preset.config.textColor ?? current.textColor,
    }));
    if (preset.config.fontFamily) setDocumentFontFamily(preset.config.fontFamily);
    if (preset.config.textColor) setDocumentTextColor(preset.config.textColor);
    if (preset.config.frameStyle) {
      const presetFrame: CertificateFrame =
        preset.config.frameStyle === 'minimal' || preset.config.frameStyle === 'modern'
          ? 'minimal'
          : preset.config.frameStyle === 'geometric'
            ? 'geometric'
            : preset.config.frameStyle === 'ornate' || preset.config.frameStyle === 'vintage'
              ? 'ornate'
              : preset.config.frameStyle === 'royal' || preset.config.frameStyle === 'luxury'
                ? 'royal'
                : 'classic';
      setFrame(presetFrame);
    }
  };

  const certificateTemplate = templates[templateId];
  const certificateBody = certificateTemplate.body
    .replaceAll('{{nome}}', '')
    .replaceAll('{{igreja}}', churchName || '')
    .replaceAll('{{curso}}', certificateTemplate.course || 'nome da escola ou curso')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const todayLabel = formatCertificateDate(today());
  const documentStyle = {
    '--certificate-primary': style.primaryColor,
    '--certificate-secondary': style.secondaryColor,
    '--certificate-background': style.backgroundColor,
    '--certificate-text': style.textColor,
    '--certificate-font-family': fontFamilies[documentFontFamily],
    '--certificate-font-size': `${documentFontSize}px`,
    '--certificate-line-height': lineSpacing,
    '--certificate-paragraph-spacing': `${paragraphSpacing}px`,
    '--certificate-page-width': orientation === 'landscape' ? '297mm' : '210mm',
    '--certificate-page-height': orientation === 'landscape' ? '210mm' : '297mm',
    '--certificate-page-ratio': orientation === 'landscape' ? '1.414 / 1' : '1 / 1.414',
    '--certificate-frame-border': frameBorder(frame, style.secondaryColor),
    '--certificate-frame-inner': style.primaryColor,
    '--certificate-default-color': documentTextColor,
  } as CSSProperties;

  return (
    <div className="min-w-0 space-y-6">
      <style>{`
        .certificate-page {
          aspect-ratio: var(--certificate-page-ratio);
          min-height: max(340px, 50cqw);
          background: var(--certificate-background);
          color: var(--certificate-default-color);
          border: var(--certificate-frame-border);
          font-family: var(--certificate-font-family);
          font-size: var(--certificate-font-size);
          line-height: var(--certificate-line-height);
          text-align: ${style.textAlign};
        }
        .certificate-page h1,
        .certificate-page p {
          margin-block: 0 var(--certificate-paragraph-spacing);
          color: inherit;
          line-height: inherit;
          font-size: var(--certificate-font-size);
        }
        .certificate-page h1 {
          font-size: calc(var(--certificate-font-size) * 2);
          color: var(--certificate-primary);
          font-weight: ${style.fontWeight === 'black' ? 900 : style.fontWeight === 'bold' ? 700 : style.fontWeight === 'semibold' ? 600 : 400};
          text-transform: ${style.textTransform};
          letter-spacing: ${style.letterSpacing}px;
        }
        .certificate-page .certificate-inner-frame {
          border: ${frame === 'geometric' ? '1px dashed' : '3px double'} var(--certificate-frame-inner);
        }
        .certificate-page [contenteditable="true"]:focus {
          outline: 2px solid color-mix(in srgb, var(--certificate-primary) 30%, transparent);
          outline-offset: 2px;
        }
        .certificate-page .certificate-recipient {
          border-color: var(--certificate-secondary);
          font-size: calc(var(--certificate-font-size) * 1.5);
        }
        .certificate-page .certificate-date,
        .certificate-page .certificate-signature,
        .certificate-page .certificate-signature-role,
        .certificate-page .certificate-second-signature {
          color: var(--certificate-default-color);
        }
        @media screen and (max-width: 640px) {
          .certificate-page {
            aspect-ratio: auto;
            min-height: 0;
            grid-template-rows: auto auto auto;
            gap: 0.75rem;
          }
          .certificate-page .certificate-document-content {
            min-height: auto;
          }
        }
        @media print {
          @page { size: A4 ${orientation}; margin: 0; }
          html,
          body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          body * { visibility: hidden !important; }
          .print-content > * { visibility: hidden !important; }
          .print-content .certificate-print-root,
          .print-content .certificate-print-root * { visibility: visible !important; }
          .print-content .certificate-print-root {
            position: fixed !important;
            inset: 10mm !important;
            width: auto !important;
            height: auto !important;
            box-sizing: border-box !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .certificate-page {
            aspect-ratio: auto !important;
            width: 100% !important;
            height: 100% !important;
            box-sizing: border-box !important;
            max-width: none !important;
            min-height: 0 !important;
            overflow: hidden !important;
            margin: 0 !important;
            box-shadow: none !important;
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
          }
        }
      `}</style>

      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
            <Award className="h-5 w-5 text-amber-500" />
            Certificados
          </h2>
          <p className="text-sm text-muted-foreground">
            Edite o certificado diretamente na página e use a barra de ferramentas para formatar o texto.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStyle(DEFAULT_STYLE);
              setFrame('classic');
              setDocumentFontFamily(DEFAULT_STYLE.fontFamily);
              setDocumentFontSize(16);
              setDocumentTextColor(DEFAULT_STYLE.textColor);
              setLineSpacing(1.35);
              setParagraphSpacing(12);
              setOrientation('landscape');
            }}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar estilo
          </Button>
          <Button size="sm" onClick={() => window.print()} className="gap-2">
            <Printer className="h-4 w-4" />
            Imprimir certificado
          </Button>
        </div>
      </div>

      <div className="grid min-w-0 gap-4">
        <div className="min-w-0 space-y-5 print:hidden">
          <Card className="overflow-hidden border-slate-300 shadow-sm">
            <CardHeader className="border-b bg-slate-100 px-4 py-2.5 dark:bg-slate-800">
              <CardTitle className="text-sm font-semibold">Documento</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3 p-3">
              <div className="w-full max-w-sm space-y-1">
                <Label htmlFor="certificate-template">Tipo de certificado</Label>
                <Select value={templateId} onValueChange={selectTemplate}>
                  <SelectTrigger id="certificate-template">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(templates).map(([id, template]) => (
                      <SelectItem key={id} value={id}>
                        {template.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/*
              <div className="space-y-2">
                <Label htmlFor="certificate-title">Título</Label>
                <Input
                  id="certificate-title"
                  value={content.title}
                  onChange={(event) => updateContent({ title: event.target.value })}
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificate-church-name">Nome da igreja no certificado</Label>
                <Input
                  id="certificate-church-name"
                  value={editableChurchName}
                  onChange={(event) => setEditableChurchName(event.target.value)}
                  maxLength={140}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificate-recipient">Nome do(a) homenageado(a)</Label>
                <Input
                  id="certificate-recipient"
                  value={content.recipient}
                  onChange={(event) => updateContent({ recipient: event.target.value })}
                  placeholder="Digite o nome completo"
                  maxLength={120}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificate-introduction">Frase antes do nome</Label>
                <Input
                  id="certificate-introduction"
                  value={content.introduction}
                  onChange={(event) => updateContent({ introduction: event.target.value })}
                  maxLength={200}
                />
              </div>

              {templateId.startsWith('school-') && (
                <div className="space-y-2">
                  <Label htmlFor="certificate-course">Escola, curso ou atividade</Label>
                  <Input
                    id="certificate-course"
                    value={content.course}
                    onChange={(event) => updateContent({ course: event.target.value })}
                    placeholder="Nome da escola ou curso"
                    maxLength={120}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="certificate-body">Texto do certificado</Label>
                <Textarea
                  id="certificate-body"
                  value={content.body}
                  onChange={(event) => updateContent({ body: event.target.value })}
                  className="min-h-28"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground">
                  Campos automáticos: {'{{nome}}'}, {'{{igreja}}'} e {'{{curso}}'}.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="certificate-location">Cidade / local</Label>
                  <Input
                    id="certificate-location"
                    value={content.location}
                    onChange={(event) => updateContent({ location: event.target.value })}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificate-date">Data</Label>
                  <Input
                    id="certificate-date"
                    type="date"
                    value={content.date}
                    onChange={(event) => updateContent({ date: event.target.value, dateText: '' })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificate-date-text">Data exibida no documento</Label>
                  <Input
                    id="certificate-date-text"
                    value={content.dateText}
                    onChange={(event) => updateContent({ dateText: event.target.value })}
                    placeholder={formatCertificateDate(content.date)}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificate-signature-one">Responsável / assinatura</Label>
                  <Input
                    id="certificate-signature-one"
                    value={content.firstSignature}
                    onChange={(event) => updateContent({ firstSignature: event.target.value })}
                    placeholder={pastorName || 'Nome do responsável'}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificate-signature-one-role">Descrição da assinatura</Label>
                  <Input
                    id="certificate-signature-one-role"
                    value={content.firstSignatureRole}
                    onChange={(event) => updateContent({ firstSignatureRole: event.target.value })}
                    maxLength={80}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificate-signature-two">Segunda assinatura (opcional)</Label>
                  <Input
                    id="certificate-signature-two"
                    value={content.secondSignature}
                    onChange={(event) => updateContent({ secondSignature: event.target.value })}
                    placeholder="Nome do diretor ou professor"
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificate-signature-two-role">Descrição da segunda assinatura</Label>
                  <Input
                    id="certificate-signature-two-role"
                    value={content.secondSignatureRole}
                    onChange={(event) => updateContent({ secondSignatureRole: event.target.value })}
                    maxLength={80}
                  />
                </div>
              </div>
              */}
            </CardContent>
          </Card>

        </div>

        <div className="min-w-0 space-y-3">
          <Card className="overflow-hidden border-slate-300 shadow-sm print:hidden">
            <CardContent className="space-y-3 bg-slate-100 p-3 dark:bg-slate-900 sm:p-4">
              <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-wrap gap-1 rounded-md border bg-background p-1 shadow-sm">
                    {[
                      { label: 'Desfazer', command: 'undo', icon: Undo2 },
                      { label: 'Refazer', command: 'redo', icon: Redo2 },
                      { label: 'Negrito', command: 'bold', icon: Bold },
                      { label: 'Itálico', command: 'italic', icon: Italic },
                      { label: 'Sublinhado', command: 'underline', icon: Underline },
                      { label: 'Riscado', command: 'strikeThrough', icon: Strikethrough },
                      { label: 'Lista com marcadores', command: 'insertUnorderedList', icon: List },
                      { label: 'Lista numerada', command: 'insertOrderedList', icon: ListOrdered },
                      { label: 'Limpar formatação', command: 'removeFormat', icon: RemoveFormatting },
                      { label: 'Alinhar à esquerda', command: 'justifyLeft', icon: AlignLeft },
                      { label: 'Centralizar', command: 'justifyCenter', icon: AlignCenter },
                      { label: 'Alinhar à direita', command: 'justifyRight', icon: AlignRight },
                      { label: 'Justificar', command: 'justifyFull', icon: AlignJustify },
                    ].map(({ label, command, icon: Icon }) => (
                      <Button
                        key={command}
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={label}
                        title={label}
                        className="h-8 w-8 rounded-sm"
                        onMouseDown={rememberSelection}
                        onClick={() => applyCommand(command)}
                      >
                        <Icon className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>

                  <div className="w-36 space-y-1">
                    <Label htmlFor="certificate-block-format">Estilo do parágrafo</Label>
                    <Select onValueChange={applyBlockFormat}>
                      <SelectTrigger id="certificate-block-format" onMouseDown={captureSelection}>
                        <SelectValue placeholder="Normal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="p">Normal</SelectItem>
                        <SelectItem value="h1">Título 1</SelectItem>
                        <SelectItem value="h2">Título 2</SelectItem>
                        <SelectItem value="h3">Título 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-wrap items-end gap-2">
                    <div className="w-40 space-y-1">
                      <Label htmlFor="certificate-document-font">Fonte</Label>
                      <Select
                        value={documentFontFamily}
                        onValueChange={(value: CardFontFamily) => applyTextStyle('fontFamily', value)}
                      >
                        <SelectTrigger id="certificate-document-font" onMouseDown={captureSelection}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CARD_FONTS_LIST.map((font) => (
                            <SelectItem key={font.id} value={font.id}>{font.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20 space-y-1">
                      <Label htmlFor="certificate-document-size">Tamanho</Label>
                      <Input
                        id="certificate-document-size"
                        type="number"
                        min={6}
                        max={96}
                        value={documentFontSize}
                        onMouseDown={captureSelection}
                        onChange={(event) => applyTextStyle('fontSize', event.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="certificate-document-color">Cor da fonte</Label>
                      <Input
                        id="certificate-document-color"
                        aria-label="Cor da fonte selecionada"
                        type="color"
                        value={documentTextColor}
                        onMouseDown={captureSelection}
                        onChange={(event) => applyTextStyle('color', event.target.value)}
                        className="h-10 w-14 cursor-pointer p-1"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="certificate-highlight-color">Realce</Label>
                      <Input
                        id="certificate-highlight-color"
                        aria-label="Cor de realce"
                        type="color"
                        value={documentHighlightColor}
                        onMouseDown={captureSelection}
                        onChange={(event) => applyTextHighlight(event.target.value)}
                        className="h-10 w-14 cursor-pointer p-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-2 border-t border-slate-300 pt-3 dark:border-slate-700">
                  <div className="w-36 space-y-1">
                    <Label htmlFor="certificate-orientation">Orientação A4</Label>
                    <Select value={orientation} onValueChange={(value: PageOrientation) => setOrientation(value)}>
                      <SelectTrigger id="certificate-orientation"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Retrato</SelectItem>
                        <SelectItem value="landscape">Paisagem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-28 space-y-1">
                    <Label htmlFor="certificate-line-spacing">Entrelinhas</Label>
                    <Input
                      id="certificate-line-spacing"
                      type="number"
                      min={0.8}
                      max={3}
                      step={0.1}
                      value={lineSpacing}
                      onChange={(event) => setLineSpacing(Number(event.target.value))}
                    />
                  </div>
                  <div className="w-40 space-y-1">
                    <Label htmlFor="certificate-paragraph-spacing">Espaço entre parágrafos (px)</Label>
                    <Input
                      id="certificate-paragraph-spacing"
                      type="number"
                      min={0}
                      max={80}
                      value={paragraphSpacing}
                      onChange={(event) => setParagraphSpacing(Number(event.target.value))}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-end gap-3 border-t border-slate-300 pt-3 dark:border-slate-700">
                  <div className="w-full max-w-xs space-y-1">
                    <Label htmlFor="certificate-preset">Tema do certificado</Label>
                    <Select onValueChange={applyPreset}>
                      <SelectTrigger id="certificate-preset">
                        <SelectValue placeholder="Escolha um tema" />
                      </SelectTrigger>
                      <SelectContent>
                        {CARD_PRESETS.map((preset) => (
                          <SelectItem key={preset.id} value={preset.id}>
                            {preset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label>Moldura</Label>
                    <div className="flex flex-wrap gap-1">
                      {CERTIFICATE_FRAMES.map((option) => (
                        <Button
                          key={option.id}
                          type="button"
                          variant={frame === option.id ? 'secondary' : 'outline'}
                          size="sm"
                          aria-pressed={frame === option.id}
                          onClick={() => setFrame(option.id)}
                          className="h-9"
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Paleta de texto</Label>
                    <div className="flex flex-wrap gap-2">
                      {CARD_TEXT_COLOR_PALETTES.filter((color) => color.category !== 'claros').map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          aria-label={`Usar cor ${color.name}`}
                          title={color.name}
                          onClick={() => {
                            setStyle((current) => ({ ...current, textColor: color.color }));
                            setDocumentTextColor(color.color);
                          }}
                          className="h-7 w-7 rounded-full border shadow-sm ring-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          style={{ backgroundColor: color.color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
            </CardContent>
          </Card>

          <div className="@container certificate-print-root rounded-xl bg-muted/40 p-2 sm:p-4" style={documentStyle}>
            <CertificateDocument
              ref={documentRef}
              key={templateId}
              title={certificateTemplate.title}
              introduction="Certificamos para os devidos fins que"
              body={certificateBody}
              churchName={churchName}
              churchLogo={churchLogo}
              pastorName={pastorName}
              date={todayLabel}
              frame={frame}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
