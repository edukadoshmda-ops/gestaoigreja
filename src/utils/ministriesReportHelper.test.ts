import { describe, it, expect } from 'vitest';
import {
  parseMinistryReport,
  formatMinistryReport,
  getTodayDateString,
} from './ministriesReportHelper';

describe('ministriesReportHelper', () => {
  it('parses empty or null text safely', () => {
    const res = parseMinistryReport(null);
    expect(res.visitorsCount).toBe(0);
    expect(res.membersPresentCount).toBe(0);
    expect(res.notes).toBe('');
    expect(res.meetingDate).toBe(getTodayDateString());
  });

  it('parses standard plain text without metadata', () => {
    const res = parseMinistryReport('Reunião de alinhamento com a liderança.');
    expect(res.notes).toBe('Reunião de alinhamento com a liderança.');
    expect(res.visitorsCount).toBe(0);
    expect(res.membersPresentCount).toBe(0);
  });

  it('encodes and decodes metadata correctly', () => {
    const encoded = formatMinistryReport('Ensaio geral de louvor e adoração realizado com sucesso.', {
      visitorsCount: 7,
      membersPresentCount: 25,
      meetingDate: '2026-10-12',
    });

    expect(encoded).toContain('<!--METADATA:');
    expect(encoded).toContain('Ensaio geral de louvor e adoração');

    const parsed = parseMinistryReport(encoded);
    expect(parsed.visitorsCount).toBe(7);
    expect(parsed.membersPresentCount).toBe(25);
    expect(parsed.meetingDate).toBe('2026-10-12');
    expect(parsed.notes).toBe('Ensaio geral de louvor e adoração realizado com sucesso.');
  });

  it('parses raw JSON format if stored as json string', () => {
    const jsonStr = JSON.stringify({
      visitors: 12,
      membersPresent: 40,
      meetingDate: '2026-09-30',
      notes: 'Culto especial da juventude',
    });

    const parsed = parseMinistryReport(jsonStr);
    expect(parsed.visitorsCount).toBe(12);
    expect(parsed.membersPresentCount).toBe(40);
    expect(parsed.meetingDate).toBe('2026-09-30');
    expect(parsed.notes).toBe('Culto especial da juventude');
  });
});
