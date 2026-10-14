export type UserRole = 'superadmin' | 'admin' | 'pastor' | 'pastor_admin' | 'secretario' | 'tesoureiro' | 'membro' | 'lider_celula' | 'lider_ministerio' | 'aluno' | 'congregado' | 'diretor_patrimonio';

export interface Church {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt: string;
}

export interface Profile {
  id: string;
  churchId: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  managed_churches?: string[]; // Array de IDs das igrejas que este pastor_admin supervisiona
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  churchId?: string; // ID da igreja à qual o usuário pertence
  avatar?: string;
  /** Se membro/congregado já completou o cadastro (primeira vez) */
  registrationCompleted?: boolean;
}

export type CardFontFamily =
  | 'sans'
  | 'serif'
  | 'cinzel'
  | 'mono'
  | 'handwriting'
  | 'playfair'
  | 'montserrat'
  | 'poppins'
  | 'slab'
  | 'gothic'
  | 'script';

export type CardFrameStyle =
  | 'classic'
  | 'geometric'
  | 'modern'
  | 'minimal'
  | 'luxury'
  | 'vintage'
  | 'royal'
  | 'badge'
  | 'double_gold'
  | 'ornate';

export type CardTextAlign = 'left' | 'center' | 'right' | 'justify';

export type CardBackgroundType = 'solid' | 'gradient' | 'light' | 'dark' | 'mesh';

export interface CardCustomizationConfig {
  fontFamily: CardFontFamily;
  fontSize: number; // member name font size
  fontWeight: 'normal' | 'semibold' | 'bold' | 'black';
  textTransform: 'uppercase' | 'capitalize' | 'none';
  textAlign?: CardTextAlign;
  letterSpacing?: number;
  primaryColor: string; // Header, badges, title
  secondaryColor: string; // Accent, borders, subtle highlights
  backgroundColor: string; // Card surface
  textColor: string; // Text color
  headerTextColor?: string; // Cor da fonte do cabeçalho (Nome da Igreja)
  badgeTextColor?: string; // Cor da fonte do selo (Credencial Oficial)
  frameStyle: CardFrameStyle;
  showPhoto: boolean;
  showQrCode: boolean;
  showBloodType: boolean;
  showOrganDonor: boolean;
  showDocuments: boolean; // CPF / RG
  showParentage: boolean; // Filiação (Mãe / Pai)
  showBaptismDate: boolean;
  showValidity: boolean;
  customWatermark?: string;
}

export interface Member {
  id: string;
  churchId: string; // Vínculo com a igreja
  name: string;
  birthDate: string;
  maritalStatus: string;
  address: string;
  email: string;
  phone: string;
  baptismDate?: string;
  role?: string;
  category: 'membro' | 'congregado';
  photoUrl?: string;
  createdAt: string;

  // Novos campos do modelo de cadastro (conforme referência visual)
  prefix?: string; // Prefixo (ex: Pr., Ev., Ir., Dca., Ap.)
  nickname?: string; // Apelido
  gender?: string; // Feminino / Masculino / Outro
  organDonor?: string; // Não / Sim
  nationality?: string; // Brasileira
  education?: string; // Escolaridade
  profession?: string; // Profissão
  bloodType?: string; // Tipo sanguíneo (A+, O+, etc.)
  specialNeeds?: string; // Necessidades especiais (Não / Sim)
  cpf?: string; // CPF
  rg?: string; // RG
  passport?: string; // Passaporte
  motherName?: string; // Nome da Mãe
  fatherName?: string; // Nome do Pai
  registrationUpdatedAt?: string; // Data de atualização cadastral
  status?: string; // Disponível, Ativo, etc.
  customCardConfig?: Partial<CardCustomizationConfig>;
}

export interface Ministry {
  id: string;
  churchId: string;
  name: string;
  description: string;
  leader: string;
  icon: string;
  memberCount: number;
  meetingsCount?: number;
  monthlyActivityReport?: string;
  visitorsCount?: number;
  membersPresentCount?: number;
  meetingDate?: string;
}

export interface CellReport {
  id: string;
  churchId: string;
  cellId: string;
  date: string;
  membersPresent: string[];
  visitors: number;
  studyTopic: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  notes: string;
}

export interface BibleVerse {
  text: string;
  reference: string;
}

export type AssetStatus = 'ativo' | 'inativo' | 'em_manutencao';
export type MaintenanceStatus = 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
export type AssetSource = 'compra' | 'doacao' | 'comodato' | 'outro';
export type DepreciationMethod = 'linear';

export interface Asset {
  id: string;
  name: string;
  description?: string;
  category?: string;
  serialNumber?: string;
  acquisitionDate?: string;
  value?: number;
  location?: string;
  status: AssetStatus;
  photoUrl?: string;
  qrCode?: string;

  /** Origem / doação / documentos */
  source?: AssetSource;
  donorName?: string;
  donationDate?: string;
  documentRef?: string;

  /** Depreciação (opcional) */
  depreciationEnabled?: boolean;
  depreciationMethod?: DepreciationMethod;
  depreciationStartDate?: string;
  usefulLifeYears?: number;
  depreciationRate?: number; // % ao ano (opcional)
  residualValue?: number;

  /** Manutenção preventiva (opcional) */
  maintenanceIntervalMonths?: number;
  nextMaintenanceDate?: string;

  createdAt: string;
  updatedAt: string;
}

export interface AssetMaintenance {
  id: string;
  assetId: string;
  description: string;
  scheduledDate?: string;
  completionDate?: string;
  cost?: number;
  responsible?: string;
  status: MaintenanceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
