import { useState, useEffect, createContext, useContext, type ReactNode } from 'react';
import { createElement } from 'react';
import { churchesService, Church } from '@/services/churches.service';
import { supabase } from '@/lib/supabaseClient';

const MAIN_DOMAIN = 'church-gest-oficial.com.br';
const SESSION_KEY = 'church_slug';

// ─── Global singleton (para Logo.tsx antes do React montar) ────
export let globalChurchLogo: string | null = null;
export let globalChurchName: string | null = null;
export let globalChurchThemeColor: string | null = null;
export let globalChurchBanner: string | null = null;

// ─── Context ─────────────────────────────────────────────────────────────────
interface TenantContextValue {
  tenant: Church | null;
  loading: boolean;
  isMainDomain: boolean;
  subdomain: string | null;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  loading: true,
  isMainDomain: false,
  subdomain: null,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function extractSlug(): string | null {
  const host = window.location.hostname;
  const path = window.location.pathname;

  // 1. Parâmetro de URL: ?slug=ibma ou ?church=ibma ou ?igreja=ibma ou ?c=ibma
  const urlParams = new URLSearchParams(window.location.search);
  const slugParam = urlParams.get('slug') || urlParams.get('church') || urlParams.get('igreja') || urlParams.get('c');
  if (slugParam) {
    const cleanParam = decodeURIComponent(slugParam).trim();
    // Persiste no sessionStorage para sobreviver à navegação interna
    try { sessionStorage.setItem(SESSION_KEY, cleanParam); } catch {}
    return cleanParam;
  }

  // 2. Parâmetro na rota (Path): /igreja/slug, /login/slug, /entrar/slug, /app/slug, /i/slug, /acesso/slug
  const pathParts = path.split('/').filter(Boolean);
  if (pathParts.length >= 2) {
    const [prefix, slugFromPath] = pathParts;
    const directLoginPrefixes = ['igreja', 'login', 'entrar', 'app', 'i', 'acesso'];
    if (directLoginPrefixes.includes(prefix.toLowerCase()) && slugFromPath) {
      const cleanPathSlug = decodeURIComponent(slugFromPath).trim();
      try { sessionStorage.setItem(SESSION_KEY, cleanPathSlug); } catch {}
      return cleanPathSlug;
    }
  }

  // 3. Recupera do sessionStorage caso o usuário tenha navegado
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) return saved;
  } catch {}

  // 4. localhost / 127.0.0.1 sem parâmetro → fallback via banco (dev local)
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.');
  if (isLocal) return null;

  // 5. Domínio principal sem subdomínio
  if (host === MAIN_DOMAIN || host === `www.${MAIN_DOMAIN}`) return null;

  // 6. Subdomínio do domínio principal: batista.church-gest-oficial.com.br
  if (host.endsWith(MAIN_DOMAIN)) {
    const slug = host.replace(`.${MAIN_DOMAIN}`, '').split('.').pop() || '';
    return slug && slug !== 'www' ? slug : null;
  }

  // 7. Domínio customizado: o primeiro segmento pode ser www → ignorar
  const first = host.split('.')[0];
  return first && first !== 'www' ? first : null;
}

function applyBranding(church: Church) {
  // Título da aba
  if (church.name) {
    document.title = church.name;
    globalChurchName = church.name;
  }

  if (church.logo_url) {
    globalChurchLogo = church.logo_url;

    // Favicon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (favicon) favicon.href = church.logo_url;

    // Apple touch icon
    const apple = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
    if (apple) apple.href = church.logo_url;

    // Imagens de logo já renderizadas
    document.querySelectorAll<HTMLImageElement>('img.church-logo, img[src*="logo-app"]').forEach((img) => {
      img.src = church.logo_url!;
    });

    // Evento para Logo.tsx (componentes React já montados)
    window.dispatchEvent(new CustomEvent('churchLogoUpdated', { detail: church.logo_url }));
  }

  // Banner de culto
  if (church.banner_url) {
    globalChurchBanner = church.banner_url;
    window.dispatchEvent(new CustomEvent('churchBannerUpdated', { detail: church.banner_url }));
  }

  // theme-color meta tag (cor primária da igreja)
  const themeColor = church.theme_color || '#2563eb';
  globalChurchThemeColor = themeColor;
  const themeMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (themeMeta) themeMeta.content = themeColor;

  // Dispara evento geral de branding atualizado
  window.dispatchEvent(new CustomEvent('churchBrandingUpdated', {
    detail: { name: church.name, logo: church.logo_url, banner: church.banner_url, themeColor },
  }));
}

// ─── Provider ─────────────────────────────────────────────────────────────────
let _cachedTenant: Church | null = null;
let _cachedSlug: string | null = null;
let _cachedIsMain = false;
let _resolved = false;

/**
 * Invalida o cache do tenant e força o re-fetch na próxima renderização.
 * Use após atualizar logo_url ou banner_url no banco.
 */
export function invalidateTenantCache() {
  _resolved = false;
  _cachedTenant = null;
}

/**
 * Limpa o slug salvo no sessionStorage (use no logout para não vazar entre sessões).
 */
export function clearTenantSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  _resolved = false;
  _cachedTenant = null;
  _cachedSlug = null;
  _cachedIsMain = false;
}

async function resolveTenant(): Promise<TenantContextValue> {
  if (_resolved) {
    return { tenant: _cachedTenant, loading: false, isMainDomain: _cachedIsMain, subdomain: _cachedSlug };
  }

  const slug = extractSlug();
  _cachedSlug = slug;

  if (!slug) {
    _cachedIsMain = true;
    _resolved = true;
    return { tenant: null, loading: false, isMainDomain: true, subdomain: null };
  }

  try {
    const church = await churchesService.getBySlug(slug);
    if (church) {
      _cachedTenant = church;
      applyBranding(church);
    } else {
      _cachedIsMain = true;
    }
  } catch (err) {
    console.error('[useTenant] Erro ao buscar tenant:', err);
    _cachedIsMain = true;
  }

  _resolved = true;
  return { tenant: _cachedTenant, loading: false, isMainDomain: _cachedIsMain, subdomain: slug };
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<TenantContextValue>({
    tenant: _cachedTenant,
    loading: !_resolved,
    isMainDomain: _cachedIsMain,
    subdomain: _cachedSlug,
  });

  useEffect(() => {
    if (_resolved) return; // já resolvido por outra instância
    resolveTenant().then(setValue);
  }, []);

  return createElement(TenantContext.Provider, { value }, children);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTenant() {
  return useContext(TenantContext);
}
