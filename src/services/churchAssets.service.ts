import { supabase } from '@/lib/supabaseClient';
import { churchesService } from '@/services/churches.service';
import { invalidateTenantCache } from '@/hooks/useTenant';
import { compressImageFile, STORAGE_CACHE_CONTROL } from '@/utils/imageCompression';

/**
 * Faz upload da logo da igreja para o Supabase Storage (bucket 'logos'),
 * salva a URL pública na tabela churches e retorna a URL.
 */
export async function uploadChurchLogo(churchId: string, slug: string, file: File): Promise<string> {
    // Garante que o bucket existe
    await supabase.storage.createBucket('logos', { public: true }).catch(() => {});

    const optimized = await compressImageFile(file, { maxWidth: 512, maxHeight: 512, quality: 0.82 });
    const ext = optimized instanceof File ? optimized.name.split('.').pop() : file.name.split('.').pop();
    const fileName = `${slug}-logo-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, optimized, {
            upsert: true,
            contentType: optimized.type || file.type,
            cacheControl: STORAGE_CACHE_CONTROL,
        });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName);
    const publicUrl = urlData?.publicUrl;

    if (!publicUrl) throw new Error('Não foi possível obter a URL pública da logo.');

    // Salva a URL no banco para este tenant
    await churchesService.update(churchId, { logo_url: publicUrl } as any);
    // Invalida o cache para o tenant recarregar a nova logo
    invalidateTenantCache();

    return publicUrl;
}

/**
 * Faz upload do banner da igreja para o Supabase Storage (bucket 'banners'),
 * salva a URL pública na tabela churches e retorna a URL.
 */
export async function uploadChurchBanner(churchId: string, slug: string, file: File): Promise<string> {
    // Garante que o bucket existe
    await supabase.storage.createBucket('banners', { public: true }).catch(() => {});

    const optimized = await compressImageFile(file, { maxWidth: 1400, maxHeight: 800, quality: 0.80 });
    const ext = optimized instanceof File ? optimized.name.split('.').pop() : file.name.split('.').pop();
    const fileName = `${slug}-banner-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, optimized, {
            upsert: true,
            contentType: optimized.type || file.type,
            cacheControl: STORAGE_CACHE_CONTROL,
        });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('banners').getPublicUrl(fileName);
    const publicUrl = urlData?.publicUrl;

    if (!publicUrl) throw new Error('Não foi possível obter a URL pública do banner.');

    // Salva a URL no banco para este tenant
    await churchesService.update(churchId, { banner_url: publicUrl } as any);
    // Invalida o cache para o tenant recarregar o novo banner
    invalidateTenantCache();

    return publicUrl;
}
