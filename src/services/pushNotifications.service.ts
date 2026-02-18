import { supabase } from '@/lib/supabaseClient';

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;

export async function isPushSupported(): Promise<boolean> {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  return Notification.requestPermission();
}

/** Envia uma notificação local de teste (não usa servidor). */
export function showLocalNotification(title: string, body: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const n = new Notification(title, { body, icon: '/logo-app.png' });
  n.onclick = () => {
    window.focus();
    n.close();
  };
}

/** Obtém a subscription do PushManager (requer VAPID key configurada). */
async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC || !('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  try {
    const key = Uint8Array.from(atob(VAPID_PUBLIC.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
    return await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  } catch {
    return null;
  }
}

/** Regista a subscription no Supabase para envio futuro de push pelo servidor. */
export async function registerPushSubscription(userId: string): Promise<{ ok: boolean; message: string }> {
  if (!userId) return { ok: false, message: 'Usuário não identificado.' };
  try {
    let perm = await getNotificationPermission();
    if (perm !== 'granted') {
      perm = await requestNotificationPermission();
      if (perm !== 'granted') return { ok: false, message: 'Permissão de notificação negada.' };
    }
    if (!VAPID_PUBLIC) {
      return { ok: true, message: 'Notificações ativadas no app. Para push em segundo plano, configure VITE_VAPID_PUBLIC_KEY no .env.' };
    }
    const sub = await getPushSubscription();
    if (!sub) return { ok: false, message: 'Não foi possível inscrever para push.' };
    return await saveSubscription(userId, sub);
  } catch (e: unknown) {
    return { ok: false, message: e instanceof Error ? e.message : 'Erro ao ativar notificações push.' };
  }
}

async function saveSubscription(userId: string, sub: PushSubscription): Promise<{ ok: boolean; message: string }> {
  const json = sub.toJSON();
  const endpoint = json.endpoint;
  const keys = json.keys;
  if (!endpoint || !keys?.p256dh || !keys?.auth) return { ok: false, message: 'Dados da subscription inválidos.' };

  const { error } = await supabase.from('push_subscriptions').upsert(
    { user_id: userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    { onConflict: 'user_id,endpoint' }
  );

  if (error) return { ok: false, message: error.message };
  return { ok: true, message: 'Notificações push ativadas.' };
}

/** Verifica se já existe subscription salva para o usuário. */
export async function hasStoredSubscription(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('user_id', userId)
    .limit(1);
  return !error && (data?.length ?? 0) > 0;
}
