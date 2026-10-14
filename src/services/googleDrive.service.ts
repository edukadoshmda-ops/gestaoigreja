import { supabase } from '@/lib/supabaseClient';

const FUNCTION_NAME = 'church-google-drive';
const GOOGLE_DRIVE_PREFIX = 'gdrive:';

interface DriveResponse {
  error?: string;
  connected?: boolean;
  email?: string | null;
  authorizationUrl?: string;
  fileId?: string;
}

async function invoke(action: string, churchId: string, extra: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke<DriveResponse>(FUNCTION_NAME, {
    body: { action, churchId, ...extra },
  });
  if (error) {
    const context = error.context;
    if (context instanceof Response) {
      try {
        const body = await context.json() as DriveResponse;
        throw new Error(body.error || error.message);
      } catch (responseError) {
        if (responseError instanceof Error && responseError.message !== error.message) throw responseError;
      }
    }
    throw new Error(error.message || 'Falha na comunicação com a integração Google Drive.');
  }
  if (data?.error) throw new Error(data.error);
  return data || {};
}

async function upload(churchId: string, file: File) {
  const { data: { session } } = await supabase.auth.getSession();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!session?.access_token || !anonKey) throw new Error('Faça login novamente para enviar o comprovante.');

  const body = new FormData();
  body.set('action', 'upload');
  body.set('churchId', churchId);
  body.set('file', file, file.name);

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${session.access_token}`,
    },
    body,
  });
  const result = await response.json() as DriveResponse;
  if (!response.ok || !result.fileId) {
    throw new Error(result.error || 'Não foi possível enviar o comprovante ao Google Drive.');
  }
  return `${GOOGLE_DRIVE_PREFIX}${result.fileId}`;
}

async function download(churchId: string, fileId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!session?.access_token || !anonKey) throw new Error('Faça login novamente para abrir o comprovante.');

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'download', churchId, fileId }),
  });
  if (!response.ok) {
    const result = await response.json() as DriveResponse;
    throw new Error(result.error || 'Não foi possível abrir o comprovante.');
  }
  return response.blob();
}

export const googleDriveService = {
  isDriveReceipt(value?: string | null): boolean {
    return !!value?.startsWith(GOOGLE_DRIVE_PREFIX);
  },

  fileId(value: string): string {
    return value.slice(GOOGLE_DRIVE_PREFIX.length);
  },

  async getStatus(churchId: string) {
    const result = await invoke('status', churchId);
    return { connected: !!result.connected, email: result.email || null };
  },

  async beginConnection(churchId: string, returnPath: string) {
    const result = await invoke('start', churchId, { returnPath });
    if (!result.authorizationUrl) throw new Error('O servidor não retornou o endereço de autorização Google.');
    window.location.assign(result.authorizationUrl);
  },

  upload,

  async createPreviewUrl(churchId: string, receiptUrl: string) {
    if (!this.isDriveReceipt(receiptUrl)) {
      return {
        url: receiptUrl,
        isImage: /^(data:image\/|https?:\/\/.*\.(png|jpe?g|webp)(?:[?#]|$))/i.test(receiptUrl),
      };
    }
    const blob = await download(churchId, this.fileId(receiptUrl));
    return {
      url: URL.createObjectURL(blob),
      isImage: blob.type.startsWith('image/'),
    };
  },

  async deleteFile(churchId: string, receiptUrl: string) {
    if (!this.isDriveReceipt(receiptUrl)) return;
    await invoke('delete-file', churchId, { fileId: this.fileId(receiptUrl) });
  },
};
