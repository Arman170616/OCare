import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RadiusMapProps {
  lat: number;
  lng: number;
  /** null = no limit; the map then just centers on the facility. */
  radiusKm: number | null;
  label?: string;
}

/** Small preview map: one facility pin plus its service-radius circle. */
export function RadiusMap({ lat, lng, radiusKm, label }: RadiusMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);
  const fitRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    // A view must exist before circles can be measured for fitBounds.
    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 10,
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    // Modals mount before layout settles; re-measure once it has.
    const resize = window.setTimeout(() => {
      map.invalidateSize();
      fitRef.current();
    }, 50);
    return () => {
      window.clearTimeout(resize);
      map.remove();
      mapRef.current = null;
    };
    // Created once; later position/radius changes are applied by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layersRef.current.forEach((layer) => layer.remove());
    layersRef.current = [];

    const pin = L.marker([lat, lng], {
      icon: L.divIcon({
        html: '<div class="radius-pin"></div>',
        className: '',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    }).addTo(map);
    if (label) pin.bindTooltip(label, { permanent: true, direction: 'top', offset: [0, -10], className: 'user-tooltip' });
    layersRef.current.push(pin);

    if (radiusKm) {
      const circle = L.circle([lat, lng], {
        radius: radiusKm * 1000,
        color: '#0d9488',
        weight: 1.5,
        fillColor: '#14b8a6',
        fillOpacity: 0.12,
      }).addTo(map);
      layersRef.current.push(circle);
      fitRef.current = () => map.fitBounds(circle.getBounds(), { padding: [16, 16] });
    } else {
      fitRef.current = () => map.setView([lat, lng], 7);
    }
    fitRef.current();
  }, [lat, lng, radiusKm, label]);

  return <div ref={containerRef} dir="ltr" className="h-full w-full" />;
}
