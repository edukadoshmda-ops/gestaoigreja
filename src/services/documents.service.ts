import { supabase } from '@/lib/supabase';

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
    async getAll() {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as ChurchDocument[];
    },

    async getByCategory(category: string) {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('category', category)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as ChurchDocument[];
    },

    async uploadFile(file: File, category: string, title?: string) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${category}/${fileName}`;

        // 1. Upload file to Storage
        const { error: uploadError } = await supabase.storage
            .from('church-documents')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('church-documents')
            .getPublicUrl(filePath);

        // 3. Save reference in Database
        const { data, error: dbError } = await supabase
            .from('documents')
            .insert([
                {
                    title: title || file.name,
                    file_url: publicUrl,
                    file_type: file.type,
                    file_size: file.size,
                    category: category,
                },
            ])
            .select()
            .single();

        if (dbError) throw dbError;
        return data as ChurchDocument;
    },

    async delete(id: string, fileUrl: string) {
        // Extract path from URL (rough implementation)
        const urlParts = fileUrl.split('church-documents/');
        if (urlParts.length > 1) {
            const filePath = urlParts[1];
            await supabase.storage.from('church-documents').remove([filePath]);
        }

        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};
