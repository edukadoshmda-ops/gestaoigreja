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
            churches: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    logo_url: string | null
                    created_at: string
                    facebook_url?: string | null
                    instagram_url?: string | null
                    youtube_url?: string | null
                    twitter_url?: string | null
                    whatsapp?: string | null
                    tiktok_url?: string | null
                    linkedin_url?: string | null
                    website_url?: string | null
                    pix_key?: string | null
                    pix_key_type?: string | null
                    pix_beneficiary_name?: string | null
                    pix_city?: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    logo_url?: string | null
                    created_at?: string
                    facebook_url?: string | null
                    instagram_url?: string | null
                    youtube_url?: string | null
                    twitter_url?: string | null
                    whatsapp?: string | null
                    tiktok_url?: string | null
                    linkedin_url?: string | null
                    website_url?: string | null
                    pix_key?: string | null
                    pix_key_type?: string | null
                    pix_beneficiary_name?: string | null
                    pix_city?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    logo_url?: string | null
                    created_at?: string
                    facebook_url?: string | null
                    instagram_url?: string | null
                    youtube_url?: string | null
                    twitter_url?: string | null
                    whatsapp?: string | null
                    tiktok_url?: string | null
                    linkedin_url?: string | null
                    website_url?: string | null
                    pix_key?: string | null
                    pix_key_type?: string | null
                    pix_beneficiary_name?: string | null
                    pix_city?: string | null
                }
            },
            profiles: {
                Row: {
                    id: string
                    church_id: string | null
                    full_name: string | null
                    role: 'superadmin' | 'admin' | 'pastor' | 'secretario' | 'tesoureiro' | 'membro' | 'lider_celula' | 'lider_ministerio' | 'aluno' | 'congregado' | null
                    phone: string | null
                    avatar_url: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    church_id?: string | null
                    full_name?: string | null
                    role?: 'superadmin' | 'admin' | 'pastor' | 'secretario' | 'tesoureiro' | 'membro' | 'lider_celula' | 'lider_ministerio' | 'aluno' | 'congregado' | null
                    phone?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    church_id?: string | null
                    full_name?: string | null
                    role?: 'superadmin' | 'admin' | 'pastor' | 'secretario' | 'tesoureiro' | 'membro' | 'lider_celula' | 'lider_ministerio' | 'aluno' | 'congregado' | null
                    phone?: string | null
                    avatar_url?: string | null
                    created_at?: string
                    updated_at?: string
                }
            },
            members: {
                Row: {
                    id: string
                    church_id: string | null
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
                    church_id?: string | null
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
                    church_id?: string | null
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
                    church_id: string | null
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
                    church_id?: string | null
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
                    church_id?: string | null
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
                    church_id: string | null
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
                    registration_fee: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    church_id?: string | null
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
                    registration_fee?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    church_id?: string | null
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
                    registration_fee?: number | null
                    created_at?: string
                    updated_at?: string
                }
            },
            cells: {
                Row: {
                    id: string
                    church_id: string | null
                    name: string
                    description: string | null
                    leader_id: string | null
                    host_id: string | null
                    meeting_day: string | null
                    meeting_time: string | null
                    address: string | null
                    city: string | null
                    latitude: number | null
                    longitude: number | null
                    active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    church_id?: string | null
                    name: string
                    description?: string | null
                    leader_id?: string | null
                    host_id?: string | null
                    meeting_day?: string | null
                    meeting_time?: string | null
                    address?: string | null
                    city?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    church_id?: string | null
                    name?: string
                    description?: string | null
                    leader_id?: string | null
                    host_id?: string | null
                    meeting_day?: string | null
                    meeting_time?: string | null
                    address?: string | null
                    city?: string | null
                    latitude?: number | null
                    longitude?: number | null
                    active?: boolean
                    created_at?: string
                    updated_at?: string
                }
            },
            financial_transactions: {
                Row: {
                    id: string
                    church_id: string | null
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
                    church_id?: string | null
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
                    church_id?: string | null
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
                    church_id: string | null
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
                    church_id?: string | null
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
                    church_id?: string | null
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
                    church_id: string | null
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
                    church_id?: string | null
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
                    church_id?: string | null
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
                    church_id: string | null
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
                    church_id?: string | null
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
                    church_id?: string | null
                    user_id?: string
                    title?: string
                    message?: string
                    type?: 'info' | 'warning' | 'success' | 'error' | null
                    read?: boolean
                    link?: string | null
                    created_at?: string
                }
            },
            reading_plans: {
                Row: {
                    id: string
                    church_id: string | null
                    name: string
                    description: string | null
                    total_days: number
                    cover_image_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    church_id?: string | null
                    name: string
                    description?: string | null
                    total_days: number
                    cover_image_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    church_id?: string | null
                    name?: string
                    description?: string | null
                    total_days?: number
                    cover_image_url?: string | null
                    created_at?: string
                }
            },
            reading_plan_days: {
                Row: {
                    id: string
                    plan_id: string
                    day_number: number
                    title: string | null
                    reference: string
                    content: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    plan_id: string
                    day_number: number
                    title?: string | null
                    reference: string
                    content?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    plan_id?: string
                    day_number?: number
                    title?: string | null
                    reference?: string
                    content?: string | null
                    created_at?: string
                }
            },
            reading_plan_completions: {
                Row: {
                    user_id: string
                    plan_id: string
                    day_number: number
                    completed_at: string
                }
                Insert: {
                    user_id: string
                    plan_id: string
                    day_number: number
                    completed_at?: string
                }
                Update: {
                    user_id?: string
                    plan_id?: string
                    day_number?: number
                    completed_at?: string
                }
            },
            reading_plan_progress: {
                Row: {
                    user_id: string
                    plan_id: string
                    current_day: number
                    started_at: string
                    last_read_at: string
                }
                Insert: {
                    user_id: string
                    plan_id: string
                    current_day?: number
                    started_at?: string
                    last_read_at?: string
                }
                Update: {
                    user_id?: string
                    plan_id?: string
                    current_day?: number
                    started_at?: string
                    last_read_at?: string
                }
            },
            prayer_requests: {
                Row: {
                    id: string
                    church_id: string
                    content: string
                    is_anonymous: boolean
                    requester_id: string | null
                    requester_name: string | null
                    prayed_count: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    church_id: string
                    content: string
                    is_anonymous?: boolean
                    requester_id?: string | null
                    requester_name?: string | null
                    prayed_count?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    church_id?: string
                    content?: string
                    is_anonymous?: boolean
                    requester_id?: string | null
                    requester_name?: string | null
                    prayed_count?: number
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
            },
            event_checklists: {
                Row: {
                    id: string
                    event_id: string
                    task: string
                    responsible_id: string | null
                    completed: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    event_id: string
                    task: string
                    responsible_id?: string | null
                    completed?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    event_id?: string
                    task?: string
                    responsible_id?: string | null
                    completed?: boolean
                    created_at?: string
                }
            },
            service_scales: {
                Row: {
                    id: string
                    event_id: string
                    member_id: string
                    role: string
                    confirmed: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    event_id: string
                    member_id: string
                    role: string
                    confirmed?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    event_id?: string
                    member_id?: string
                    role?: string
                    confirmed?: boolean
                    created_at?: string
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
            confirm_participation: {
                Args: {
                    scale_id: string
                }
                Returns: Json
            }
        }
        Enums: {
            [_ in never]: never
        }
    }
}
