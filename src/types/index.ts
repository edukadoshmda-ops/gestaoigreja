export type UserRole = 'superadmin' | 'admin' | 'pastor' | 'secretario' | 'tesoureiro' | 'membro' | 'lider_celula' | 'lider_ministerio' | 'aluno' | 'congregado';

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
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  churchId?: string; // ID da igreja à qual o usuário pertence
  avatar?: string;
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
}

export interface Ministry {
  id: string;
  churchId: string;
  name: string;
  description: string;
  leader: string;
  icon: string;
  memberCount: number;
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
