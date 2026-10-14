import { CardCustomizationConfig, CardFontFamily, CardFrameStyle, CardTextAlign, Member } from '@/types';

export const DEFAULT_CARD_CONFIG: CardCustomizationConfig = {
  fontFamily: 'serif',
  fontSize: 16,
  fontWeight: 'bold',
  textTransform: 'uppercase',
  textAlign: 'left',
  letterSpacing: 0,
  primaryColor: '#1e3a8a', // Azul royal
  secondaryColor: '#d97706', // Dourado âmbar
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  headerTextColor: '#ffffff',
  badgeTextColor: '#ffffff',
  frameStyle: 'classic',
  showPhoto: true,
  showQrCode: true,
  showBloodType: true,
  showOrganDonor: true,
  showDocuments: true,
  showParentage: true,
  showBaptismDate: true,
  showValidity: true,
  customWatermark: '',
};

export interface CardPreset {
  id: string;
  name: string;
  description: string;
  previewColor: string;
  config: Partial<CardCustomizationConfig>;
}

export interface CardFrameOption {
  id: CardFrameStyle;
  name: string;
  description: string;
}

export interface CardFontOption {
  id: CardFontFamily;
  name: string;
  category: string;
  sample: string;
}

export const CARD_FONTS_LIST: CardFontOption[] = [
  { id: 'serif', name: 'Serif Clássico', category: 'Solene & Tradicional', sample: 'Garamond' },
  { id: 'sans', name: 'Sans Moderno', category: 'Clean & Contemporâneo', sample: 'Inter' },
  { id: 'cinzel', name: 'Cinzel Imperial', category: 'Maiúsculas Romanas', sample: 'Cinzel' },
  { id: 'playfair', name: 'Playfair Display', category: 'Editorial de Luxo', sample: 'Playfair' },
  { id: 'montserrat', name: 'Montserrat Forte', category: 'Geométrico & Firme', sample: 'Montserrat' },
  { id: 'poppins', name: 'Poppins Arredondado', category: 'Moderno & Dinâmico', sample: 'Poppins' },
  { id: 'slab', name: 'Roboto Slab', category: 'Slab Serif Nobre', sample: 'Roboto Slab' },
  { id: 'mono', name: 'Monospace Tech', category: 'Estilo Passaporte / Doc', sample: 'Courier' },
  { id: 'handwriting', name: 'Elegante Itálico', category: 'Estilo Certificado', sample: 'Itálico' },
  { id: 'script', name: 'Caligrafia Fina', category: 'Manuscrito Nobre', sample: 'Dancing Script' },
  { id: 'gothic', name: 'Eclesiástico Histórico', category: 'Gótico Solene', sample: 'Gothic' },
];

export interface CardTextColorPalette {
  id: string;
  name: string;
  color: string;
  category: 'classicos' | 'eclesiasticos' | 'modernos' | 'claros';
}

export const CARD_TEXT_COLOR_PALETTES: CardTextColorPalette[] = [
  // Clássicos & Nobres
  { id: 'preto_onix', name: 'Preto Ônix', color: '#0f172a', category: 'classicos' },
  { id: 'preto_puro', name: 'Preto Puro', color: '#000000', category: 'classicos' },
  { id: 'cinza_chumbo', name: 'Cinza Chumbo', color: '#334155', category: 'classicos' },
  { id: 'grafite_nobre', name: 'Grafite Nobre', color: '#1e293b', category: 'classicos' },

  // Eclesiásticos & Solenes
  { id: 'azul_real', name: 'Azul Real Nobre', color: '#1e3a8a', category: 'eclesiasticos' },
  { id: 'azul_noite', name: 'Azul Meia-Noite', color: '#172554', category: 'eclesiasticos' },
  { id: 'dourado_ambar', name: 'Ouro / Dourado', color: '#b45309', category: 'eclesiasticos' },
  { id: 'ouro_rico', name: 'Dourado Âmbar', color: '#d97706', category: 'eclesiasticos' },
  { id: 'vinho_bordo', name: 'Vinho / Bordô Real', color: '#881337', category: 'eclesiasticos' },
  { id: 'roxo_episcopal', name: 'Roxo Episcopal', color: '#581c87', category: 'eclesiasticos' },
  { id: 'verde_esmeralda', name: 'Verde Esmeralda', color: '#065f46', category: 'eclesiasticos' },
  { id: 'marrom_mogno', name: 'Marrom Mogno', color: '#451a03', category: 'eclesiasticos' },

  // Modernos & Contemporâneos
  { id: 'azul_petroleo', name: 'Azul Petróleo', color: '#0e7490', category: 'modernos' },
  { id: 'verde_floresta', name: 'Verde Floresta', color: '#15803d', category: 'modernos' },
  { id: 'cobre_bronze', name: 'Cobre / Bronze', color: '#9a3412', category: 'modernos' },
  { id: 'indigo_real', name: 'Índigo Real', color: '#4338ca', category: 'modernos' },
  { id: 'azul_celeste', name: 'Azul Celeste', color: '#0284c7', category: 'modernos' },
  { id: 'rubi_solene', name: 'Rubi Solene', color: '#991b1b', category: 'modernos' },

  // Tons Claros (ideais para fundos escuros / credenciais VIP)
  { id: 'branco_puro', name: 'Branco Puro', color: '#ffffff', category: 'claros' },
  { id: 'champagne', name: 'Champanhe Ouro', color: '#fef08a', category: 'claros' },
  { id: 'gelo_platina', name: 'Gelo Platina', color: '#f1f5f9', category: 'claros' },
  { id: 'ouro_luminoso', name: 'Ouro Luminoso', color: '#fde047', category: 'claros' },
];

export const CARD_HEADER_TEXT_COLOR_PALETTES: CardTextColorPalette[] = [
  { id: 'hdr_branco_puro', name: 'Branco Puro', color: '#ffffff', category: 'claros' },
  { id: 'hdr_ouro_luminoso', name: 'Ouro Luminoso', color: '#fde047', category: 'claros' },
  { id: 'hdr_amarelo_ouro', name: 'Amarelo Ouro', color: '#facc15', category: 'claros' },
  { id: 'hdr_dourado_ambar', name: 'Dourado Âmbar', color: '#f59e0b', category: 'eclesiasticos' },
  { id: 'hdr_ouro_rico', name: 'Ouro Nobre', color: '#d97706', category: 'eclesiasticos' },
  { id: 'hdr_champagne', name: 'Champanhe', color: '#fef08a', category: 'claros' },
  { id: 'hdr_marfim', name: 'Marfim Nobre', color: '#fef3c7', category: 'claros' },
  { id: 'hdr_gelo_platina', name: 'Gelo Platina', color: '#f1f5f9', category: 'claros' },
  { id: 'hdr_azul_ceu', name: 'Azul Céu Claro', color: '#bae6fd', category: 'claros' },
  { id: 'hdr_menta_suave', name: 'Menta Suave', color: '#bbf7d0', category: 'claros' },
  { id: 'hdr_pessego_claro', name: 'Pêssego Claro', color: '#fed7aa', category: 'claros' },
  { id: 'hdr_rosa_suave', name: 'Rosa Suave', color: '#fbcfe8', category: 'claros' },
  { id: 'hdr_preto_onix', name: 'Preto Ônix', color: '#0f172a', category: 'classicos' },
  { id: 'hdr_preto_puro', name: 'Preto Puro', color: '#000000', category: 'classicos' },
  { id: 'hdr_cinza_grafite', name: 'Grafite Nobre', color: '#334155', category: 'classicos' },
  { id: 'hdr_azul_noite', name: 'Azul Noite', color: '#172554', category: 'eclesiasticos' },
];

export const CARD_FRAMES_LIST: CardFrameOption[] = [
  { id: 'classic', name: 'Clássica Dupla', description: 'Filete nobre tradicional com borda interna dourada' },
  { id: 'luxury', name: 'Luxo Imperial', description: 'Borda dupla trabalhada com relevo e sombra' },
  { id: 'geometric', name: 'Geométrica Nobre', description: 'Cantos estilizados e traço contemporâneo' },
  { id: 'modern', name: 'Moderna Clean', description: 'Contorno suave, minimalista e arejado' },
  { id: 'minimal', name: 'Minimalista Fina', description: 'Borda ultrafina sutil de alta precisão' },
  { id: 'vintage', name: 'Vintage Solene', description: 'Estilo clássico pontilhado eclesiástico' },
  { id: 'royal', name: 'Brasão Real', description: 'Borda tripla com cantoneiras de destaque cerimonial' },
  { id: 'badge', name: 'Emblema Oficial', description: 'Filete nobre duplo com recorte de autenticidade' },
  { id: 'double_gold', name: 'Ouro Duplo Metálico', description: 'Dois filetes nobres com acabamento dourado' },
  { id: 'ornate', name: 'Ornato Eclesiástico', description: 'Bordas decorativas com visual de medalhão' },
];

export const CARD_PRESETS: CardPreset[] = [
  {
    id: 'azul_classico',
    name: 'Azul Nobre & Ouro',
    description: 'Padrão tradicional eclesiástico solene',
    previewColor: '#1e3a8a',
    config: {
      primaryColor: '#1e3a8a',
      secondaryColor: '#d97706',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      fontFamily: 'serif',
      frameStyle: 'classic',
      textAlign: 'left',
    },
  },
  {
    id: 'dourado_luxo',
    name: 'Dourado Imperial',
    description: 'Bordas ornamentadas com ar solene e majestoso',
    previewColor: '#b45309',
    config: {
      primaryColor: '#78350f',
      secondaryColor: '#d97706',
      backgroundColor: '#fffbeb',
      textColor: '#451a03',
      fontFamily: 'cinzel',
      frameStyle: 'luxury',
      textAlign: 'left',
    },
  },
  {
    id: 'vinho_real',
    name: 'Vinho Real & Brasão',
    description: 'Elegância com tons de bordô e acabamento dourado',
    previewColor: '#831843',
    config: {
      primaryColor: '#831843',
      secondaryColor: '#f59e0b',
      backgroundColor: '#fff1f2',
      textColor: '#500724',
      fontFamily: 'playfair',
      frameStyle: 'royal',
      textAlign: 'left',
    },
  },
  {
    id: 'esmeralda_moderna',
    name: 'Verde Esmeralda',
    description: 'Visual moderno com faixa de destaque',
    previewColor: '#065f46',
    config: {
      primaryColor: '#065f46',
      secondaryColor: '#10b981',
      backgroundColor: '#ffffff',
      textColor: '#064e3b',
      fontFamily: 'sans',
      frameStyle: 'modern',
      textAlign: 'left',
    },
  },
  {
    id: 'black_gold',
    name: 'Ônix Black & Gold',
    description: 'Estilo escuro VIP de alta autoridade',
    previewColor: '#18181b',
    config: {
      primaryColor: '#f59e0b',
      secondaryColor: '#fbbf24',
      backgroundColor: '#18181b',
      textColor: '#f8fafc',
      fontFamily: 'cinzel',
      frameStyle: 'double_gold',
      textAlign: 'left',
    },
  },
  {
    id: 'safira_minimal',
    name: 'Safira Clean',
    description: 'Minimalista, moderno e direto',
    previewColor: '#0284c7',
    config: {
      primaryColor: '#0284c7',
      secondaryColor: '#38bdf8',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      fontFamily: 'montserrat',
      frameStyle: 'minimal',
      textAlign: 'left',
    },
  },
  {
    id: 'purpura_episcopal',
    name: 'Púrpura Episcopal',
    description: 'Roxo sacerdotal nobre com detalhe ouro',
    previewColor: '#581c87',
    config: {
      primaryColor: '#581c87',
      secondaryColor: '#eab308',
      backgroundColor: '#faf5ff',
      textColor: '#3b0764',
      fontFamily: 'playfair',
      frameStyle: 'luxury',
      textAlign: 'left',
    },
  },
  {
    id: 'rubi_champagne',
    name: 'Rubi & Champanhe',
    description: 'Vermelho carmesim clássico cerimonial',
    previewColor: '#991b1b',
    config: {
      primaryColor: '#991b1b',
      secondaryColor: '#fbbf24',
      backgroundColor: '#ffffff',
      textColor: '#450a0a',
      fontFamily: 'cinzel',
      frameStyle: 'badge',
      textAlign: 'left',
    },
  },
  {
    id: 'prata_diplomat',
    name: 'Prata & Azul Marinho',
    description: 'Acabamento executivo diplomático solene',
    previewColor: '#334155',
    config: {
      primaryColor: '#1e293b',
      secondaryColor: '#94a3b8',
      backgroundColor: '#f8fafc',
      textColor: '#0f172a',
      fontFamily: 'slab',
      frameStyle: 'classic',
      textAlign: 'left',
    },
  },
  {
    id: 'rose_gold',
    name: 'Rosé Gold & Pérola',
    description: 'Tons suaves sofisticados com brilho delicado',
    previewColor: '#be185d',
    config: {
      primaryColor: '#9d174d',
      secondaryColor: '#f472b6',
      backgroundColor: '#fff1f2',
      textColor: '#700730',
      fontFamily: 'playfair',
      frameStyle: 'ornate',
      textAlign: 'left',
    },
  },
  {
    id: 'terracota_pergaminho',
    name: 'Pergaminho & Terracota',
    description: 'Tons terrosos clássicos de pergaminho bíblico',
    previewColor: '#9a3412',
    config: {
      primaryColor: '#7c2d12',
      secondaryColor: '#d97706',
      backgroundColor: '#fefce8',
      textColor: '#451a03',
      fontFamily: 'serif',
      frameStyle: 'vintage',
      textAlign: 'left',
    },
  },
  {
    id: 'verde_oliva',
    name: 'Oliva & Bronze Sagrado',
    description: 'Verde oliva reverente com toque de bronze',
    previewColor: '#3f6212',
    config: {
      primaryColor: '#365314',
      secondaryColor: '#ca8a04',
      backgroundColor: '#f7fee7',
      textColor: '#1a2e05',
      fontFamily: 'cinzel',
      frameStyle: 'badge',
      textAlign: 'left',
    },
  },
  {
    id: 'ciano_titanio',
    name: 'Ciano & Titânio Tech',
    description: 'Design de alta tecnologia para jovens e eventos',
    previewColor: '#0f766e',
    config: {
      primaryColor: '#0f766e',
      secondaryColor: '#14b8a6',
      backgroundColor: '#ffffff',
      textColor: '#134e4a',
      fontFamily: 'poppins',
      frameStyle: 'modern',
      textAlign: 'left',
    },
  },
  {
    id: 'mono_contraste',
    name: 'Monocromático Nobre',
    description: 'Preto e branco puro de altíssima legibilidade',
    previewColor: '#000000',
    config: {
      primaryColor: '#000000',
      secondaryColor: '#52525b',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      fontFamily: 'montserrat',
      frameStyle: 'minimal',
      textAlign: 'left',
    },
  },
];

/**
 * Empacota os campos estendidos em notes serializado em JSON com namespace _ext
 */
export function packExtendedFieldsToNotes(
  currentNotes: string | null | undefined | Record<string, any>,
  extendedData: Partial<Member>
): string {
  let existingObj: Record<string, any> = {};

  if (currentNotes) {
    if (typeof currentNotes === 'object') {
      existingObj = { ...currentNotes };
    } else if (typeof currentNotes === 'string') {
      const trimmed = currentNotes.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          existingObj = JSON.parse(trimmed);
        } catch {
          existingObj = { observations: currentNotes };
        }
      } else {
        existingObj = { observations: currentNotes };
      }
    }
  }

  const prevExt = existingObj._ext || {};

  const extPayload = {
    prefix: extendedData.prefix !== undefined ? extendedData.prefix : (prevExt.prefix || ''),
    nickname: extendedData.nickname !== undefined ? extendedData.nickname : (prevExt.nickname || ''),
    gender: extendedData.gender !== undefined ? extendedData.gender : (prevExt.gender || ''),
    organDonor: extendedData.organDonor !== undefined ? extendedData.organDonor : (prevExt.organDonor || 'Não'),
    nationality: extendedData.nationality !== undefined ? extendedData.nationality : (prevExt.nationality || 'Brasileira'),
    education: extendedData.education !== undefined ? extendedData.education : (prevExt.education || ''),
    profession: extendedData.profession !== undefined ? extendedData.profession : (prevExt.profession || ''),
    bloodType: extendedData.bloodType !== undefined ? extendedData.bloodType : (prevExt.bloodType || ''),
    specialNeeds: extendedData.specialNeeds !== undefined ? extendedData.specialNeeds : (prevExt.specialNeeds || 'Não'),
    cpf: extendedData.cpf !== undefined ? extendedData.cpf : (prevExt.cpf || ''),
    rg: extendedData.rg !== undefined ? extendedData.rg : (prevExt.rg || ''),
    passport: extendedData.passport !== undefined ? extendedData.passport : (prevExt.passport || ''),
    motherName: extendedData.motherName !== undefined ? extendedData.motherName : (prevExt.motherName || ''),
    fatherName: extendedData.fatherName !== undefined ? extendedData.fatherName : (prevExt.fatherName || ''),
    registrationUpdatedAt: extendedData.registrationUpdatedAt !== undefined ? extendedData.registrationUpdatedAt : (prevExt.registrationUpdatedAt || ''),
    status: extendedData.status !== undefined ? extendedData.status : (prevExt.status || 'Disponível'),
    role: extendedData.role !== undefined ? extendedData.role : (prevExt.role || ''),
    baptismDate: extendedData.baptismDate !== undefined ? extendedData.baptismDate : (prevExt.baptismDate || ''),
    customCardConfig: extendedData.customCardConfig || prevExt.customCardConfig || undefined,
  };

  existingObj._ext = {
    ...prevExt,
    ...extPayload,
  };

  return JSON.stringify(existingObj);
}

/**
 * Extrai campos estendidos de um registro de membro
 */
export function extractExtendedFields(dbRow: any): Partial<Member> {
  const result: Partial<Member> = {};
  if (!dbRow) return result;

  // 1. Extrai de notes (objeto ou string JSON)
  let ext: Record<string, any> = {};
  const rawNotes = dbRow.notes;

  if (rawNotes) {
    if (typeof rawNotes === 'object') {
      ext = rawNotes._ext || rawNotes;
    } else if (typeof rawNotes === 'string') {
      const trimmed = rawNotes.trim();
      if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          ext = parsed?._ext || parsed || {};
        } catch {
          ext = {};
        }
      }
    }
  }

  // Atribui valores de ext
  if (ext.prefix) result.prefix = ext.prefix;
  if (ext.nickname) result.nickname = ext.nickname;
  if (ext.gender) result.gender = ext.gender;
  if (ext.organDonor || ext.organ_donor) result.organDonor = ext.organDonor || ext.organ_donor;
  if (ext.nationality) result.nationality = ext.nationality;
  if (ext.education) result.education = ext.education;
  if (ext.profession) result.profession = ext.profession;
  if (ext.bloodType || ext.blood_type) result.bloodType = ext.bloodType || ext.blood_type;
  if (ext.specialNeeds || ext.special_needs) result.specialNeeds = ext.specialNeeds || ext.special_needs;
  if (ext.cpf) result.cpf = ext.cpf;
  if (ext.rg) result.rg = ext.rg;
  if (ext.passport) result.passport = ext.passport;
  if (ext.motherName || ext.mother_name) result.motherName = ext.motherName || ext.mother_name;
  if (ext.fatherName || ext.father_name) result.fatherName = ext.fatherName || ext.father_name;
  if (ext.registrationUpdatedAt || ext.registration_updated_at) result.registrationUpdatedAt = ext.registrationUpdatedAt || ext.registration_updated_at;
  if (ext.status) result.status = ext.status;
  if (ext.role) result.role = ext.role;
  if (ext.baptismDate || ext.baptism_date) result.baptismDate = ext.baptismDate || ext.baptism_date;
  if (ext.customCardConfig || ext.custom_card_config) result.customCardConfig = ext.customCardConfig || ext.custom_card_config;

  // 2. Colunas diretas no banco de dados (apenas sobrescreve se tiver valor válido)
  if (dbRow.prefix && String(dbRow.prefix).trim()) result.prefix = dbRow.prefix;
  if (dbRow.nickname && String(dbRow.nickname).trim()) result.nickname = dbRow.nickname;
  if (dbRow.gender && String(dbRow.gender).trim()) result.gender = dbRow.gender;
  if (dbRow.organ_donor && String(dbRow.organ_donor).trim()) result.organDonor = dbRow.organ_donor;
  if (dbRow.nationality && String(dbRow.nationality).trim()) result.nationality = dbRow.nationality;
  if (dbRow.education && String(dbRow.education).trim()) result.education = dbRow.education;
  if (dbRow.profession && String(dbRow.profession).trim()) result.profession = dbRow.profession;
  if (dbRow.blood_type && String(dbRow.blood_type).trim()) result.bloodType = dbRow.blood_type;
  if (dbRow.special_needs && String(dbRow.special_needs).trim()) result.specialNeeds = dbRow.special_needs;
  if (dbRow.cpf && String(dbRow.cpf).trim()) result.cpf = dbRow.cpf;
  if (dbRow.rg && String(dbRow.rg).trim()) result.rg = dbRow.rg;
  if (dbRow.passport && String(dbRow.passport).trim()) result.passport = dbRow.passport;
  if (dbRow.mother_name && String(dbRow.mother_name).trim()) result.motherName = dbRow.mother_name;
  if (dbRow.father_name && String(dbRow.father_name).trim()) result.fatherName = dbRow.father_name;
  if (dbRow.registration_updated_at) result.registrationUpdatedAt = dbRow.registration_updated_at;
  if (dbRow.baptism_date) result.baptismDate = dbRow.baptism_date;
  if (dbRow.custom_card_config) result.customCardConfig = dbRow.custom_card_config;

  return result;
}
