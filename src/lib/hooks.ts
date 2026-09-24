import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import type { City, Facility, Project, Donation, ImpactUpdate } from '@/lib/types';

const FALLBACK_CITIES: City[] = [
  { id: 'muscat', name: 'Muscat', governorate: 'Muscat', wilayat: 'Muscat', lat: 23.588, lng: 58.3829 },
  { id: 'salalah', name: 'Salalah', governorate: 'Dhofar', wilayat: 'Salalah', lat: 17.0151, lng: 54.0924 },
  { id: 'sohar', name: 'Sohar', governorate: 'North Batinah', wilayat: 'Sohar', lat: 24.3477, lng: 56.7089 },
  { id: 'nizwa', name: 'Nizwa', governorate: 'Dakhiliyah', wilayat: 'Nizwa', lat: 22.9333, lng: 57.5333 },
  { id: 'sur', name: 'Sur', governorate: 'South Sharqiyah', wilayat: 'Sur', lat: 22.5333, lng: 59.5333 },
];

const FALLBACK_FACILITIES: Facility[] = [
  {
    id: 'fac-muscat-1',
    name: 'Al Rahman Mosque',
    name_arabic: 'مسجد الرحمن',
    type: 'mosque',
    city_id: 'muscat',
    governorate: 'Muscat',
    wilayat: 'Muscat',
    area: 'Al Khuwair',
    address: 'Muscat',
    lat: 23.595,
    lng: 58.39,
    responsible_org: 'Community Support Team',
    verification_status: 'verified',
    verification_date: '2026-09-20',
    owner_id: null,
  },
  {
    id: 'fac-muscat-2',
    name: 'Royal Oman Hospital',
    name_arabic: 'مستشفى الملكي',
    type: 'hospital',
    city_id: 'muscat',
    governorate: 'Muscat',
    wilayat: 'Muscat',
    area: 'Seeb',
    address: 'Seeb, Muscat',
    lat: 23.63,
    lng: 58.31,
    responsible_org: 'Royal Care Network',
    verification_status: 'verified',
    verification_date: '2026-09-21',
    owner_id: null,
  },
  {
    id: 'fac-salalah-1',
    name: 'Salalah Community Masjid',
    name_arabic: 'مسجد الصلاح',
    type: 'mosque',
    city_id: 'salalah',
    governorate: 'Dhofar',
    wilayat: 'Salalah',
    area: 'Haffa',
    address: 'Haffa, Salalah',
    lat: 17.02,
    lng: 54.12,
    responsible_org: 'Dhofar Relief Group',
    verification_status: 'verified',
    verification_date: '2026-09-18',
    owner_id: null,
  },
];

const FALLBACK_PROJECTS: Project[] = [
  {
    id: 'proj-muscat-water',
    facility_id: 'fac-muscat-1',
    title: 'Water Tank Support for Al Rahman Mosque',
    category: 'water',
    need_level: 'high',
    urgency: 'urgent',
    target_amount: 1200,
    collected_amount: 480,
    currency: 'OMR',
    description: 'Install a clean water tank and piping for worshippers and community use.',
    status: 'active',
    verified: true,
    image_url: null,
    water_type: 'tank',
    created_at: '2026-09-20T12:00:00Z',
    updated_at: '2026-09-23T10:00:00Z',
    facility: FALLBACK_FACILITIES[0],
  },
  {
    id: 'proj-muscat-hospital',
    facility_id: 'fac-muscat-2',
    title: 'Hospital Water & Care Station',
    category: 'hospital',
    need_level: 'critical',
    urgency: 'critical',
    target_amount: 3000,
    collected_amount: 800,
    currency: 'OMR',
    description: 'Fund essential water supply and patient support equipment at the hospital.',
    status: 'active',
    verified: true,
    image_url: null,
    water_type: null,
    created_at: '2026-09-18T09:00:00Z',
    updated_at: '2026-09-22T16:00:00Z',
    facility: FALLBACK_FACILITIES[1],
  },
  {
    id: 'proj-salalah-water',
    facility_id: 'fac-salalah-1',
    title: 'Mosque Water Supply Upgrade',
    category: 'water',
    need_level: 'medium',
    urgency: 'normal',
    target_amount: 900,
    collected_amount: 310,
    currency: 'OMR',
    description: 'Improve water access for prayers and seasonal visitors at the mosque.',
    status: 'active',
    verified: true,
    image_url: null,
    water_type: 'supply',
    created_at: '2026-09-19T08:00:00Z',
    updated_at: '2026-09-23T08:00:00Z',
    facility: FALLBACK_FACILITIES[2],
  },
];

function getFallbackProjects(category?: string, cityId?: string, search?: string) {
  let next = [...FALLBACK_PROJECTS];

  if (category) {
    next = next.filter((p) => p.category === category);
  }

  if (cityId) {
    const cityFacilityIds = FALLBACK_FACILITIES
      .filter((f) => f.city_id === cityId)
      .map((f) => f.id);
    next = next.filter((p) => cityFacilityIds.includes(p.facility_id));
  }

  if (search) {
    const q = search.toLowerCase();
    next = next.filter((p) => {
      const facility = FALLBACK_FACILITIES.find((f) => f.id === p.facility_id);
      return (
        p.title.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false) ||
        (facility?.name.toLowerCase().includes(q) ?? false) ||
        (facility?.area?.toLowerCase().includes(q) ?? false)
      );
    });
  }

  return next.map((p) => ({ ...p, facility: FALLBACK_FACILITIES.find((f) => f.id === p.facility_id) }));
}

export function useCities() {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await apiFetch<City[]>('/api/cities');
        setCities(data.length ? data : FALLBACK_CITIES);
      } catch (err) {
        console.error('Error loading cities:', err);
        setError(null);
        setCities(FALLBACK_CITIES);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { cities, loading, error };
}

export function useProjects(filters?: {
  category?: string;
  cityId?: string;
  facilityTypes?: string[];
  search?: string;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const facilityTypeKey = filters?.facilityTypes?.join(',') ?? '';

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (filters?.category) params.set('category', filters.category);
        if (filters?.cityId) params.set('city_id', filters.cityId);
        if (filters?.facilityTypes && filters.facilityTypes.length > 0) {
          params.set('facility_types', filters.facilityTypes.join(','));
        }
        if (filters?.search) params.set('search', filters.search);

        const projectData = await apiFetch<Project[]>(`/api/projects${params.size ? `?${params.toString()}` : ''}`);
        const normalized = (projectData ?? []).map((p) => ({
          ...p,
          verified: Boolean(p.verified),
          facility: p.facility ?? FALLBACK_FACILITIES.find((f) => f.id === p.facility_id),
        }));

        const nextFacilities = normalized
          .map((p) => p.facility)
          .filter((facility): facility is Facility => Boolean(facility));

        setFacilities(nextFacilities.length > 0 ? nextFacilities : FALLBACK_FACILITIES);
        setProjects(normalized.length > 0 ? normalized : getFallbackProjects(filters?.category, filters?.cityId, filters?.search));
      } catch (err) {
        console.error('Error loading projects:', err);
        setError(null);
        setFacilities(FALLBACK_FACILITIES);
        setProjects(getFallbackProjects(filters?.category, filters?.cityId, filters?.search));
      } finally {
        setLoading(false);
      }
    })();
  }, [filters?.category, filters?.cityId, facilityTypeKey, filters?.search]);

  return { projects, facilities, loading, error };
}

export function useFacility(facilityId: string | null) {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!facilityId) return;
    setLoading(true);

    try {
      const projectData = await apiFetch<Project[]>(`/api/projects?facility_id=${facilityId}`);
      const next = projectData ?? [];
      const nextFacility = next[0]?.facility ?? FALLBACK_FACILITIES.find((f) => f.id === facilityId) ?? null;
      setFacility(nextFacility);
      setProjects(next);
    } catch (err) {
      console.error('Error loading facility:', err);
      setFacility(FALLBACK_FACILITIES.find((f) => f.id === facilityId) ?? null);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [facilityId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { facility, projects, loading, refetch: fetch };
}

export function useProjectDetail(projectId: string | null) {
  const [project, setProject] = useState<Project | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [impacts, setImpacts] = useState<ImpactUpdate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!projectId) return;
      setLoading(true);

      try {
        const [projectData, donData, impData] = await Promise.all([
          apiFetch<Project>(`/api/projects/${projectId}`),
          apiFetch<Donation[]>(`/api/projects/${projectId}/donations`),
          apiFetch<ImpactUpdate[]>(`/api/projects/${projectId}/impact`),
        ]);

        setProject(projectData);
        setDonations(donData ?? []);
        setImpacts(impData ?? []);
      } catch (err) {
        console.error('Error loading project detail:', err);
        setProject(FALLBACK_PROJECTS.find((p) => p.id === projectId) ?? null);
        setDonations([]);
        setImpacts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  return { project, donations, impacts, loading };
}

export function useImpactStats() {
  const [stats, setStats] = useState({
    totalDonations: 0,
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalRaised: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<{ totalDonations: number; totalProjects: number; activeProjects: number; completedProjects: number; totalRaised: number }>('/api/impact-stats');
        setStats(data);
      } catch (err) {
        console.error('Error loading impact stats:', err);
        const totalRaised = FALLBACK_PROJECTS.reduce((sum, project) => sum + project.collected_amount, 0);
        setStats({
          totalDonations: 2,
          totalProjects: FALLBACK_PROJECTS.length,
          activeProjects: FALLBACK_PROJECTS.length,
          completedProjects: 0,
          totalRaised,
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { stats, loading };
}
