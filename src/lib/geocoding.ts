/**
 * Geocoding via OpenStreetMap Nominatim (gratuito, sem API key).
 * Use com moderação: máx. 1 req/segundo conforme política de uso.
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  if (!address?.trim()) return null;
  const query = encodeURIComponent(address.trim());
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'GestaoIgrejaApp/1.0 (gestao-igreja; contato@igreja.local)',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const item = data[0];
  const lat = parseFloat(item.lat);
  const lng = parseFloat(item.lon);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return {
    lat,
    lng,
    displayName: item.display_name || address,
  };
}

/** URL do OpenStreetMap para abrir localização no navegador */
export function openStreetMapUrl(lat: number, lng: number, zoom = 16): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=${zoom}`;
}

/** URL do Google Maps para abrir localização no navegador */
export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
