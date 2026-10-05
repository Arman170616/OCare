import type { ProjectWithDistance } from '@/lib/types';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCategoryInfo } from '@/lib/constants';

// Projects within this distance of the user count as "near me" when framing the map.
const NEAR_RADIUS_KM = 25;

interface MapViewProps {
  projects: ProjectWithDistance[];
  onSelectProject: (project: ProjectWithDistance) => void;
  centerLat: number;
  centerLng: number;
  userLat?: number;
  userLng?: number;
}

export function MapView({
  projects,
  onSelectProject,
  centerLat,
  centerLng,
  userLat,
  userLng,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center: [centerLat, centerLng],
      zoom: 11,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;

    return () => {
      map.remove();
      mapInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (userLat !== undefined && userLng !== undefined) {
      const radius = L.circle([userLat, userLng], {
        radius: NEAR_RADIUS_KM * 1000,
        color: '#0d9488',
        weight: 1,
        fillColor: '#14b8a6',
        fillOpacity: 0.06,
        interactive: false,
      }).addTo(map);
      const userIcon = L.divIcon({
        html: `<div class="user-dot"></div>`,
        className: 'user-marker',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const userMarker = L.marker([userLat, userLng], { icon: userIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindTooltip('You are here', { permanent: true, direction: 'top', offset: [0, -10], className: 'user-tooltip' });
      markersRef.current.push(radius, userMarker);
    }

    const categoryColors: Record<string, string> = {
      water: '#0ea5e9',
      mosque: '#14b8a6',
      hospital: '#f43f5e',
    };

    projects.forEach((project) => {
      const cat = getCategoryInfo(project.category);
      const facility = project.facility;
      if (!facility) return;

      const color = categoryColors[project.category] ?? '#0d9488';

      const icon = L.divIcon({
        html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;color:white">${cat.label.charAt(0)}</div>`,
        className: 'project-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([facility.lat, facility.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="min-width:180px"><b>${project.title}</b><br/><span style="color:#64748b;font-size:12px">${facility.name}</span><br/><span style="color:#0d9488;font-weight:600">${project.distance.toFixed(1)} km away</span><br/><button id="map-donate-${project.id}" style="margin-top:6px;background:#0d9488;color:white;border:none;padding:4px 12px;border-radius:6px;cursor:pointer;font-size:12px">View Details</button></div>`
        );

      marker.on('popupopen', () => {
        const btn = document.getElementById(`map-donate-${project.id}`);
        if (btn) {
          btn.onclick = () => onSelectProject(project);
        }
      });

      markersRef.current.push(marker);
    });

    const located = projects.filter((p) => p.facility);
    const points = (list: ProjectWithDistance[]) =>
      list.map((p) => [p.facility!.lat, p.facility!.lng] as [number, number]);

    if (userLat !== undefined && userLng !== undefined) {
      // Near me: frame the user plus nearby projects (or the closest one if nothing is nearby).
      const nearby = located.filter((p) => p.distance <= NEAR_RADIUS_KM);
      const closest = [...located].sort((a, b) => a.distance - b.distance).slice(0, 1);
      const bounds = L.latLngBounds([[userLat, userLng]]);
      points(nearby.length > 0 ? nearby : closest).forEach((pt) => bounds.extend(pt));
      bounds.extend(L.latLng(userLat, userLng).toBounds(NEAR_RADIUS_KM * 1000));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
    } else if (located.length > 0) {
      map.fitBounds(L.latLngBounds(points(located)), { padding: [50, 50], maxZoom: 14 });
    } else {
      map.setView([centerLat, centerLng], 11);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, userLat, userLng]);

  return <div ref={mapRef} className="h-full w-full rounded-2xl" />;
}
