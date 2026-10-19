import { supabase } from '@/lib/supabaseClient';
import { compressImageFile, STORAGE_CACHE_CONTROL } from '@/utils/imageCompression';

const STORAGE_BUCKET = import.meta.env.VITE_STORAGE_BUCKET || 'church-documents';

export interface ChurchDocument {
    id: string;
    title: string;
    description: string | null;
    file_url: string;
    file_type: string | null;
    file_size: number | null;
    category: 'study' | 'financial' | 'minutes' | 'media' | string;
    uploaded_by: string | null;
    created_at: string;
}

export const documentsService = {
    async getAll(churchId?: string | null) {
        let query = supabase
            .from('documents')
            .select('*')
            .order('created_at', { ascending: false });

        if (churchId) {
            query = query.eq('church_id', churchId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return (data || []) as ChurchDocument[];
    },

    async getByCategory(category: string, churchId?: string | null) {
        let query = supabase
            .from('documents')
            .select('*')
            .eq('category', category)
            .order('created_at', { ascending: false });

        if (churchId) {
            query = query.eq('church_id', churchId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return (data || []) as ChurchDocument[];
    },

    async uploadFile(file: File, category: string, churchId?: string | null, title?: string) {
        const optimized = await compressImageFile(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.80 });
        const fileExt = (optimized instanceof File ? optimized.name : file.name).split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const prefix = churchId || 'global';
        const filePath = `${prefix}/${category}/${fileName}`;

        // 1. Upload file to Storage
        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, optimized, {
                cacheControl: STORAGE_CACHE_CONTROL,
                contentType: optimized.type || file.type,
            });

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);

        // 3. Save reference in Database
        const { data, error: dbError } = await (supabase.from('documents') as any)
            .insert([
                {
                    title: title || file.name,
                    file_url: publicUrl,
                    file_type: optimized.type || file.type,
                    file_size: optimized.size ?? file.size,
                    category: category,
                    church_id: churchId ?? null,
                },
            ] as any)
            .select()
            .single();

        if (dbError) throw dbError;
        return data as ChurchDocument;
    },

    async delete(id: string, fileUrl: string) {
        // Extract path from URL (rough implementation)
        if (fileUrl && fileUrl.includes(STORAGE_BUCKET + '/')) {
            const urlParts = fileUrl.split(STORAGE_BUCKET + '/');
            if (urlParts.length > 1) {
                const filePath = urlParts[1];
                await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
            }
        }

        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async create(doc: Partial<ChurchDocument>) {
        const { data, error } = await (supabase.from('documents') as any)
            .insert([doc])
            .select()
            .single();

        if (error) throw error;
        return data as ChurchDocument;
    }
};
