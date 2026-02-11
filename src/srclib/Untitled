export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    name: string
                    role: 'admin' | 'secretario' | 'tesoureiro' | 'membro' | 'lider_celula' | 'lider_ministerio' | 'aluno' | 'congregado'
                    phone: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    name: string
                    role: 'admin' | 'secretario' | 'tesoureiro' | 'membro' | 'lider_celula' | 'lider_ministerio' | 'aluno' | 'congregado'
                    phone?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    name?: string
                    role?: 'admin' | 'secretario' | 'tesoureiro' | 'membro' | 'lider_celula' | 'lider_ministerio' | 'aluno' | 'congregado'
                    phone?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            },
            members: {
                Row: {
                    id: string
                    name: string
                    email: string | null
                    phone: string | null
                    birth_date: string | null
                    address: string | null
                    city: string | null
                    state: string | null
                    zip_code: string | null
                    marital_status: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | null
                    gender: 'masculino' | 'feminino' | null
                    baptized: boolean
                    baptism_date: string | null
                    member_since: string | null
                    status: 'ativo' | 'inativo' | 'visitante'
                    photo_url: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    birth_date?: string | null
                    address?: string | null
                    city?: string | null
                    state?: string | null
                    zip_code?: string | null
                    marital_status?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | null
                    gender?: 'masculino' | 'feminino' | null
                    baptized?: boolean
                    baptism_date?: string | null
                    member_since?: string | null
                    status?: 'ativo' | 'inativo' | 'visitante'
                    photo_url?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string | null
                    phone?: string | null
                    birth_date?: string | null
                    address?: string | null
                    city?: string | null
                    state?: string | null
                    zip_code?: string | null
                    marital_status?: 'solteiro' | 'casado' | 'divorciado' | 'viuvo' | null
                    gender?: 'masculino' | 'feminino' | null
                    baptized?: boolean
                    baptism_date?: string | null
                    member_since?: string | null
                    status?: 'ativo' | 'inativo' | 'visitante'
                    photo_url?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            },
            ministries: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    leader_id: string | null
                    color: string | null
                    icon: string | null
                    active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    leader_id?: string | null
                    color?: string | null
                    icon?: string | null
                    active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    leader_id?: string | null
                    color?: string | null
                    icon?: string | null
                    active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            },
            events: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    type: 'culto' | 'evento' | 'reuniao' | 'especial'
                    date: string
                    time: string
                    location: string | null
                    responsible_id: string | null
                    status: 'planejado' | 'confirmado' | 'realizado' | 'cancelado'
                    estimated_attendees: number | null
                    actual_attendees: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    type: 'culto' | 'evento' | 'reuniao' | 'especial'
                    date: string
                    time: string
                    location?: string | null
                    responsible_id?: string | null
                    status?: 'planejado' | 'confirmado' | 'realizado' | 'cancelado'
                    estimated_attendees?: number | null
                    actual_attendees?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    type?: 'culto' | 'evento' | 'reuniao' | 'especial'
                    date?: string
                    time?: string
                    location?: string | null
                    responsible_id?: string | null
                    status?: 'planejado' | 'confirmado' | 'realizado' | 'cancelado'
                    estimated_attendees?: number | null
                    actual_attendees?: number | null
                    created_at?: string
                    updated_at?: string
                }
            },
            cells: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    leader_id: string | null
                    host_id: string | null
                    meeting_day: string | null
                    meeting_time: string | null
                    address: string | null
                    city: string | null
                    active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    leader_id?: string | null
                    host_id?: string | null
                    meeting_day?: string | null
                    meeting_time?: string | null
                    address?: string | null
                    city?: string | null
                    active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    leader_id?: string | null
                    host_id?: string | null
                    meeting_day?: string | null
                    meeting_time?: string | null
                    address?: string | null
                    city?: string | null
                    active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            },
            financial_transactions: {
                Row: {
                    id: string
                    type: 'entrada' | 'saida'
                    category: string
                    subcategory: string | null
                    amount: number
                    date: string
                    description: string | null
                    payment_method: string | null
                    member_id: string | null
                    event_id: string | null
                    receipt_url: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    type: 'entrada' | 'saida'
                    category: string
                    subcategory?: string | null
                    amount: number
                    date: string
                    description?: string | null
                    payment_method?: string | null
                    member_id?: string | null
                    event_id?: string | null
                    receipt_url?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    type?: 'entrada' | 'saida'
                    category?: string
                    subcategory?: string | null
                    amount?: number
                    date?: string
                    description?: string | null
                    payment_method?: string | null
                    member_id?: string | null
                    event_id?: string | null
                    receipt_url?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            },
            cell_members: {
                Row: {
                    cell_id: string
                    member_id: string
                    joined_at: string
                }
                Insert: {
                    cell_id: string
                    member_id: string
                    joined_at?: string
                }
                Update: {
                    cell_id?: string
                    member_id?: string
                    joined_at?: string
                }
            },
            cell_reports: {
                Row: {
                    id: string
                    cell_id: string
                    date: string
                    members_present: number
                    visitors: number
                    study_topic: string | null
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    cell_id: string
                    date: string
                    members_present: number
                    visitors: number
                    study_topic?: string | null
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    cell_id?: string
                    date?: string
                    members_present?: number
                    visitors?: number
                    study_topic?: string | null
                    notes?: string | null
                    created_at?: string
                }
            },
            discipleships: {
                Row: {
                    id: string
                    disciple_id: string
                    mentor_id: string
                    start_date: string
                    end_date: string | null
                    status: 'em_andamento' | 'concluido' | 'cancelado'
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    disciple_id: string
                    mentor_id: string
                    start_date: string
                    end_date?: string | null
                    status?: 'em_andamento' | 'concluido' | 'cancelado'
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    disciple_id?: string
                    mentor_id?: string
                    start_date?: string
                    end_date?: string | null
                    status?: 'em_andamento' | 'concluido' | 'cancelado'
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            },
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    message: string
                    type: 'info' | 'warning' | 'success' | 'error' | null
                    read: boolean
                    link: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    message: string
                    type?: 'info' | 'warning' | 'success' | 'error' | null
                    read?: boolean
                    link?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    message?: string
                    type?: 'info' | 'warning' | 'success' | 'error' | null
                    read?: boolean
                    link?: string | null
                    created_at?: string
                }
            },
            ministry_members: {
                Row: {
                    member_id: string
                    ministry_id: string
                    role: string | null
                    joined_at: string
                }
                Insert: {
                    member_id: string
                    ministry_id: string
                    role?: string | null
                    joined_at?: string
                }
                Update: {
                    member_id?: string
                    ministry_id?: string
                    role?: string | null
                    joined_at?: string
                }
            }
        }
        Views: {
            member_statistics: {
                Row: {
                    total_members: number | null
                    active_members: number | null
                    baptized_members: number | null
                    male_members: number | null
                    female_members: number | null
                    children: number | null
                    youth: number | null
                    adults: number | null
                }
            }
            financial_summary: {
                Row: {
                    month: string | null
                    total_income: number | null
                    total_expenses: number | null
                    balance: number | null
                }
            }
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
