import { supabase } from '@/lib/supabaseClient';

export interface School {
  id: string;
  church_id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchoolStudent {
  id: string;
  school_id: string;
  member_id?: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SchoolReport {
  id: string;
  school_id: string;
  report_date: string;
  subject?: string;
  num_present: number;
  num_visitors?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const isTestEnv = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
const CACHE_TTL_MS = isTestEnv ? 0 : 2 * 60 * 1000;
const schoolsCache = new Map<string, { data: School[]; timestamp: number }>();

export const schoolsService = {
  async getAll(churchId?: string | null): Promise<School[]> {
    const cacheKey = churchId || '__all__';
    if (CACHE_TTL_MS > 0) {
      const cached = schoolsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
      }
    }

    let query = supabase.from('schools').select('*').order('name');
    if (churchId) query = query.eq('church_id', churchId);
    const { data, error } = await query;
    if (error) throw error;
    const list = (data || []) as School[];
    if (CACHE_TTL_MS > 0) {
      schoolsCache.set(cacheKey, { data: list, timestamp: Date.now() });
    }
    return list;
  },

  async getById(id: string): Promise<School | null> {
    const { data, error } = await supabase.from('schools').select('*').eq('id', id).single();
    if (error) throw error;
    return data as School;
  },

  async create(school: { name: string; description?: string }, churchId: string): Promise<School> {
    const { data, error } = await supabase
      .from('schools')
      .insert({ ...school, church_id: churchId })
      .select()
      .single();
    if (error) throw error;
    schoolsCache.clear();
    return data as School;
  },

  async update(id: string, updates: Partial<{ name: string; description: string; active: boolean }>): Promise<School> {
    const { data, error } = await supabase
      .from('schools')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    schoolsCache.clear();
    return data as School;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('schools').delete().eq('id', id);
    if (error) throw error;
    schoolsCache.clear();
  },

  async getStudents(schoolId: string): Promise<SchoolStudent[]> {
    const { data, error } = await supabase
      .from('school_students')
      .select('*')
      .eq('school_id', schoolId)
      .order('name');
    if (error) throw error;
    return (data || []) as SchoolStudent[];
  },

  async addStudent(
    schoolId: string,
    student: { name: string; email?: string; phone?: string; member_id?: string; notes?: string }
  ): Promise<SchoolStudent> {
    const { data, error } = await supabase
      .from('school_students')
      .insert({ school_id: schoolId, ...student })
      .select()
      .single();
    if (error) throw error;
    return data as SchoolStudent;
  },

  async removeStudent(id: string): Promise<void> {
    const { error } = await supabase.from('school_students').delete().eq('id', id);
    if (error) throw error;
  },

  async getReports(schoolId: string): Promise<SchoolReport[]> {
    const { data, error } = await supabase
      .from('school_reports')
      .select('*')
      .eq('school_id', schoolId)
      .order('report_date', { ascending: false });
    if (error) throw error;
    return (data || []) as SchoolReport[];
  },

  async addReport(
    schoolId: string,
    report: { report_date: string; subject?: string; num_present: number; num_visitors?: number; notes?: string }
  ): Promise<SchoolReport> {
    const { data, error } = await supabase
      .from('school_reports')
      .insert({ school_id: schoolId, ...report })
      .select()
      .single();
    if (error) throw error;
    return data as SchoolReport;
  },

  async removeReport(id: string): Promise<void> {
    const { error } = await supabase.from('school_reports').delete().eq('id', id);
    if (error) throw error;
  },
};
