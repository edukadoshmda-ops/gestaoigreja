/**
 * Constantes globais do app Gestão Igreja
 */

export const APP_NAME = 'Gestão Igreja';
export const APP_SHORT_NAME = 'Igreja';

export const DOCUMENT_CATEGORIES = {
  study: 'Estudos para Células',
  financial: 'Relatórios Financeiros',
  minutes: 'Atas',
  media: 'Fotos',
  videos: 'Vídeos e Cultos',
  baptism: 'Batismo',
  dedication: 'Apresentação',
  transfer: 'Transferência',
  roll: 'Rol',
  credential: 'Credencial',
} as const;

export const ROLES_LABELS: Record<string, string> = {
  superadmin: 'SuperAdmin',
  admin: 'Administrador',
  pastor: 'Pastor',
  secretario: 'Secretário',
  tesoureiro: 'Tesoureiro',
  lider_celula: 'Líder de Célula',
  lider_ministerio: 'Líder de Ministério',
  membro: 'Membro',
  congregado: 'Congregado',
};

export const MEMBER_CATEGORIES = ['membro', 'congregado'] as const;
export const DEFAULT_CHURCH_NAME = 'Igreja Comunidade Cristã';
export const DEFAULT_CNPJ = '00.000.000/0001-00';
