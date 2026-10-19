/**
 * Utilitário de compressão de imagens no navegador (Client-Side)
 * Reduz fotos de celular (3MB - 8MB) para ~40KB - 80KB (WebP/JPEG)
 * antes de subir para o Supabase Storage (economizando até 95% do limite de 1GB e 5GB de Egress).
 */

export const STORAGE_CACHE_CONTROL = '31536000'; // 1 ano de cache HTTP no navegador/CDN

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputType?: 'image/webp' | 'image/jpeg';
}

/**
 * Comprime um File ou Blob caso seja uma imagem raster (JPEG, PNG, WebP, HEIC renderizável).
 * Caso não seja imagem (PDF, DOC, SVG, GIF) ou ocorra qualquer erro/ambiente de teste,
 * retorna o arquivo original intacto.
 */
export async function compressImageFile(
  file: File | Blob,
  options: CompressImageOptions = {}
): Promise<File | Blob> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.78,
    outputType = 'image/webp',
  } = options;

  // Ignorar arquivos que não são imagens ou que são vetoriais/animados
  const type = file.type || '';
  if (!type.startsWith('image/') || type === 'image/svg+xml' || type === 'image/gif') {
    return file;
  }

  // Se já for muito pequeno (< 60 KB), não precisa recomprimir
  if (file.size <= 60 * 1024) {
    return file;
  }

  // Em ambiente de teste (jsdom) ou SSR onde canvas/Image não processam mídia real
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof Image === 'undefined' ||
    (typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || ''))
  ) {
    return file;
  }

  return new Promise<File | Blob>((resolve) => {
    let objectUrl = '';
    try {
      objectUrl = URL.createObjectURL(file);
    } catch {
      resolve(file);
      return;
    }

    const img = new Image();
    const cleanup = () => {
      if (objectUrl) {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {}
      }
    };

    // Timeout de segurança para não travar em ambientes sem decodificador de imagem (ex: vitest/jsdom)
    const timer = setTimeout(() => {
      cleanup();
      resolve(file);
    }, 4000);

    img.onload = () => {
      clearTimeout(timer);
      try {
        let { width, height } = img;
        if (!width || !height) {
          cleanup();
          resolve(file);
          return;
        }

        // Mantém a proporção (aspect ratio) dentro de maxWidth x maxHeight
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          cleanup();
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (!blob || blob.size >= file.size) {
              // Se não gerou blob ou ficou maior que o original, usa o original
              resolve(file);
              return;
            }

            const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
            const originalName = file instanceof File ? file.name : `image.${ext}`;
            const baseName = originalName.includes('.')
              ? originalName.substring(0, originalName.lastIndexOf('.'))
              : originalName;

            try {
              const compressedFile = new File([blob], `${baseName}.${ext}`, {
                type: blob.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } catch {
              resolve(blob);
            }
          },
          outputType,
          quality
        );
      } catch {
        cleanup();
        resolve(file);
      }
    };

    img.onerror = () => {
      clearTimeout(timer);
      cleanup();
      resolve(file);
    };

    img.src = objectUrl;
  });
}
