export type UserRole = 'admin' | 'secretario' | 'tesoureiro' | 'membro';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Member {
  id: string;
  name: string;
  birthDate: string;
  address: string;
  email: string;
  phone: string;
  ministries: string[];
  photoUrl?: string;
  createdAt: string;
}

export interface Ministry {
  id: string;
  name: string;
  description: string;
  icon: string;
  memberCount: number;
}

export interface CellReport {
  id: string;
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
