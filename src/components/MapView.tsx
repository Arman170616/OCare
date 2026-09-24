import type { ProjectWithDistance } from '@/lib/types';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCategoryInfo } from '@/lib/constants';

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
  const markersRef = useRef<L.Marker[]>([]);

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
      const userIcon = L.divIcon({
        html: `<div style="width:18px;height:18px;border-radius:50%;background:#0d9488;border:3px solid white;box-shadow:0 0 0 4px rgba(13,148,136,0.3)"></div>`,
        className: 'user-marker',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const userMarker = L.marker([userLat, userLng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Your location</b>');
      markersRef.current.push(userMarker);
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

    if (projects.length > 0) {
      const bounds = L.latLngBounds(
        projects
          .filter((p) => p.facility)
          .map((p) => [p.facility!.lat, p.facility!.lng] as [number, number])
      );
      if (userLat !== undefined && userLng !== undefined) {
        bounds.extend([userLat, userLng]);
      }
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    } else {
      map.setView([centerLat, centerLng], 11);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, userLat, userLng]);

  return <div ref={mapRef} className="h-full w-full rounded-2xl" />;
}
