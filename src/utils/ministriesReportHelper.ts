export interface MinistryReportData {
  notes: string;
  visitorsCount: number;
  membersPresentCount: number;
  meetingDate: string;
}

const META_REGEX = /<!--METADATA:(\{.*?\})-->/;

/**
 * Retorna a data de hoje no formato YYYY-MM-DD (hora local segura)
 */
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Extrai notas, visitantes, membros presentes e data da reunião
 * a partir do texto salvo em `monthly_activity_report` (ou objeto misto)
 */
export function parseMinistryReport(raw?: string | null): MinistryReportData {
  const today = getTodayDateString();

  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return {
      notes: '',
      visitorsCount: 0,
      membersPresentCount: 0,
      meetingDate: today,
    };
  }

  const trimmed = raw.trim();

  // 1. Tag embutida <!--METADATA:{...}-->
  const match = trimmed.match(META_REGEX);
  if (match) {
    try {
      const meta = JSON.parse(match[1]);
      const cleanNotes = trimmed.replace(META_REGEX, '').trim();
      return {
        notes: cleanNotes,
        visitorsCount: Math.max(0, Number(meta.visitors ?? meta.visitorsCount ?? 0) || 0),
        membersPresentCount: Math.max(0, Number(meta.membersPresent ?? meta.membersPresentCount ?? 0) || 0),
        meetingDate: meta.meetingDate || meta.date || today,
      };
    } catch {
      // Ignora falha de parse e segue
    }
  }

  // 2. Objeto JSON puro salvo diretamente no campo
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const meta = JSON.parse(trimmed);
      return {
        notes: meta.notes || meta.report || meta.description || '',
        visitorsCount: Math.max(0, Number(meta.visitors ?? meta.visitorsCount ?? 0) || 0),
        membersPresentCount: Math.max(0, Number(meta.membersPresent ?? meta.membersPresentCount ?? 0) || 0),
        meetingDate: meta.meetingDate || meta.date || today,
      };
    } catch {
      // Ignora e trata como texto
    }
  }

  // 3. Texto comum sem metadados
  return {
    notes: trimmed,
    visitorsCount: 0,
    membersPresentCount: 0,
    meetingDate: today,
  };
}

/**
 * Serializa os dados do relatório com metadados para salvar em `monthly_activity_report`
 */
export function formatMinistryReport(
  notes: string,
  meta: {
    visitorsCount: number;
    membersPresentCount: number;
    meetingDate: string;
  }
): string {
  const tagPayload = {
    visitors: Math.max(0, Number(meta.visitorsCount) || 0),
    membersPresent: Math.max(0, Number(meta.membersPresentCount) || 0),
    meetingDate: meta.meetingDate || getTodayDateString(),
  };

  const tag = `<!--METADATA:${JSON.stringify(tagPayload)}-->`;
  const cleanNotes = (notes || '').trim();

  return cleanNotes ? `${tag}\n${cleanNotes}` : tag;
}
