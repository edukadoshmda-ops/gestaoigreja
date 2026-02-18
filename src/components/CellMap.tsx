import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const centerBR: L.LatLngExpression = [-14.235, -51.925];

interface CellMapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onSelect: (lat: number, lng: number) => void;
  height?: string;
}

export function CellMapPicker({ latitude, longitude, onSelect, height = '240px' }: CellMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current) return;
    const center: L.LatLngExpression =
      latitude != null && longitude != null ? [latitude, longitude] : centerBR;
    const zoom = latitude != null && longitude != null ? 15 : 4;

    const map = L.map(containerRef.current).setView(center, zoom);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    if (latitude != null && longitude != null) {
      const marker = L.marker([latitude, longitude], { icon: defaultIcon }).addTo(map);
      markerRef.current = marker;
    }

    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      markerRef.current?.remove();
      const marker = L.marker([lat, lng], { icon: defaultIcon }).addTo(map);
      markerRef.current = marker;
      onSelectRef.current(lat, lng);
    };
    map.on('click', handleClick);

    return () => {
      map.off('click', handleClick);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (latitude != null && longitude != null) {
      map.setView([latitude, longitude], 15);
      markerRef.current?.remove();
      const marker = L.marker([latitude, longitude], { icon: defaultIcon }).addTo(map);
      markerRef.current = marker;
    }
  }, [latitude, longitude]);

  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height }}>
      <div ref={containerRef} className="h-full w-full min-h-[200px]" />
      <p className="text-xs text-muted-foreground p-2 bg-muted/30 border-t">
        Clique no mapa para definir o local da reunião.
      </p>
    </div>
  );
}

interface CellMapViewProps {
  latitude: number;
  longitude: number;
  name?: string;
  height?: string;
}

export function CellMapView({ latitude, longitude, name, height = '200px' }: CellMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current).setView([latitude, longitude], 15);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    L.marker([latitude, longitude], { icon: defaultIcon }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude]);

  return (
    <div className="rounded-xl overflow-hidden border border-border" style={{ height }}>
      <div ref={containerRef} className="h-full w-full min-h-[180px]" />
      {name && (
        <p className="text-xs text-muted-foreground p-2 bg-muted/30 border-t truncate" title={name}>
          {name}
        </p>
      )}
    </div>
  );
}

export interface CellForMap {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
}

interface CellsMapAllProps {
  cells: CellForMap[];
  height?: string;
  onCellClick?: (cell: CellForMap) => void;
}

/** Mapa com todas as células cadastradas que possuem localização */
export function CellsMapAll({ cells, height = '400px', onCellClick }: CellsMapAllProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const hasCells = cells.length > 0;
    const center: L.LatLngExpression = hasCells
      ? [cells[0].latitude, cells[0].longitude]
      : centerBR;
    const zoom = hasCells ? 12 : 4;

    const map = L.map(containerRef.current).setView(center, zoom);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (cells.length === 0) {
      map.setView(centerBR, 4);
      return;
    }

    const bounds = L.latLngBounds(
      cells.map((c) => [c.latitude, c.longitude] as L.LatLngTuple)
    );

    cells.forEach((cell) => {
      const marker = L.marker([cell.latitude, cell.longitude], { icon: defaultIcon }).addTo(map);
      const content = [
        `<strong>${escapeHtml(cell.name)}</strong>`,
        cell.address ? escapeHtml(cell.address) : '',
      ].filter(Boolean).join('<br/>');
      marker.bindPopup(content, { maxWidth: 280 });

      if (onCellClick) {
        marker.on('click', () => onCellClick(cell));
      }
      markersRef.current.push(marker);
    });

    if (cells.length === 1) {
      map.setView([cells[0].latitude, cells[0].longitude], 14);
    } else {
      map.fitBounds(bounds.pad(0.15));
    }
  }, [cells, onCellClick]);

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card" style={{ height }}>
      <div ref={containerRef} className="h-full w-full min-h-[300px]" />
      <p className="text-xs text-muted-foreground p-2 bg-muted/30 border-t">
        {cells.length === 0
          ? 'Nenhuma célula com localização. Cadastre uma célula e defina o ponto no mapa.'
          : `${cells.length} célula(s) no mapa. Clique no marcador para ver detalhes.`}
      </p>
    </div>
  );
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
