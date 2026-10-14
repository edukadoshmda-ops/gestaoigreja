import { describe, it, expect } from 'vitest';
import * as ExcelJSNS from 'exceljs';
import JSZip from 'jszip';
import { buildAdministrativeDashboardBuffer } from './administrativeDashboardExcel';
import { buildMinistriesDashboardBuffer } from './ministriesDashboardExcel';

const ExcelJS: any = (ExcelJSNS as any).Workbook ? ExcelJSNS : (ExcelJSNS as any).default;

describe('Novos Dashboards Executivos em Excel (ExcelJS)', () => {
  it('Dashboard Administrativo: gera abas com painéis congelados, cores e formatação', async () => {
    const buf = await buildAdministrativeDashboardBuffer({
      churchName: 'Igreja Viva Global',
      members: [
        { id: '1', name: 'João Silva', role: 'Pastor', category: 'membro', phone: '11999999999', birthDate: '1980-05-10', baptismDate: '1995-10-20', maritalStatus: 'casado', gender: 'masculino', status: 'ativo' } as any,
        { id: '2', name: 'Maria Souza', role: 'Líder', category: 'congregado', phone: '11888888888', birthDate: '1992-08-15', maritalStatus: 'solteiro', gender: 'feminino', status: 'visitante' } as any,
      ],
      assets: [
        { id: 'a1', name: 'Mesa de Som Digital Yamaha', category: 'Som & Áudio', location: 'Templo Principal', value: 18500, status: 'ativo', source: 'compra' } as any,
        { id: 'a2', name: 'Projetor Laser 4K', category: 'Vídeo', location: 'Nave Central', value: 12000, status: 'em_manutencao', source: 'doacao' } as any,
      ],
      documents: [
        { id: 'd1', title: 'Ata de Assembleia Geral Ordinária', category: 'minutes', created_at: '2026-03-15', description: 'Eleição da nova diretoria' } as any,
      ],
    });

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const names = wb.worksheets.map((w: any) => w.name);
    expect(names).toEqual(['Painel Administrativo', 'Rol de Membros', 'Patrimônio & Bens', 'Atas e Documentos']);

    // Validar XML de congelamento
    const zip = await JSZip.loadAsync(buf as ArrayBuffer);
    for (let i = 1; i <= names.length; i++) {
      const xml = await zip.file(`xl/worksheets/sheet${i}.xml`)!.async('string');
      expect(xml, `sheet${i} sem freeze`).toMatch(/<pane[^>]*state="frozen"/);
    }
  });

  it('Dashboard de Ministérios: gera 6 abas completas com células, kids, ebd e oração', async () => {
    const buf = await buildMinistriesDashboardBuffer({
      churchName: 'Igreja Viva Global',
      ministries: [
        { id: 'm1', name: 'Ministério de Louvor', leader: { name: 'Davi Harpa' }, memberCount: 18, active: true },
        { id: 'm2', name: 'Ministério Infantil (Kids)', leader: { name: 'Tia Sarah' }, memberCount: 25, active: true },
      ],
      cells: [
        { id: 'c1', name: 'Célula Ágape', leader: { name: 'Pedro Alencar' }, meetingDay: 'Quarta-feira', memberCount: 14, address: 'Rua das Flores 123' },
        { id: 'c2', name: 'Célula Boas Novas', leader: { name: 'Lucas Mateus' }, meetingDay: 'Quinta-feira', memberCount: 10, address: 'Av Principal 456' },
      ],
      members: [
        { id: 'k1', name: 'Samuel Alencar', birthDate: '2018-05-10', role: 'Aluno Kids', gender: 'masculino' } as any,
        { id: 'j1', name: 'Gabriel Santos', birthDate: '2004-11-20', role: 'Jovem', gender: 'masculino' } as any,
      ],
      schools: [
        { id: 's1', name: 'EBD - Classe Jovens', active: true, description: 'Estudo de Romanos' } as any,
      ],
      prayerRequests: [
        { id: 'pr1', requester_name: 'Ana Silva', category: 'saude', content: 'Oração por cura', status: 'em_oracao', created_at: '2026-10-01' } as any,
      ],
    });

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const names = wb.worksheets.map((w: any) => w.name);
    expect(names).toEqual(['Painel Ministerial', 'Células e Grupos', 'Ministérios', 'Infantil & Jovens', 'Escolas e EBD', 'Discipulado', 'Oração e Intercessão']);

    const zip = await JSZip.loadAsync(buf as ArrayBuffer);
    for (let i = 1; i <= names.length; i++) {
      const xml = await zip.file(`xl/worksheets/sheet${i}.xml`)!.async('string');
      expect(xml, `sheet${i} sem freeze`).toMatch(/<pane[^>]*state="frozen"/);
    }
  });
});
