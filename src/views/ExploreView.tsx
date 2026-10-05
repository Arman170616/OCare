import { useState, useMemo, useEffect } from 'react';
import { useCities, useProjects } from '@/lib/hooks';
import type { ProjectWithDistance, Facility, City } from '@/lib/types';
import {
  calculateDistance,
  sortProjectsByDistance,
  sortProjectsByUrgency,
  sortProjectsByRemaining,
  sortProjectsByNeed,
  isWithinServiceArea,
  placeName,
} from '@/lib/utils';
import { tr } from '@/lib/i18n';
import { CATEGORIES, getCategoryInfo } from '@/lib/constants';
import { ProjectCard } from '@/components/ProjectCard';
import { MapView } from '@/components/MapView';
import {
  MapPin,
  Search,
  Map as MapIcon,
  List as ListIcon,
  SlidersHorizontal,
  Navigation,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface ExploreViewProps {
  initialCategory: string | null;
  onDonate: (project: ProjectWithDistance) => void;
  onViewDetails: (project: ProjectWithDistance) => void;
}

type SortMode = 'distance' | 'urgency' | 'remaining' | 'need';

const NEAR_ME = '__near_me__';

export function ExploreView({ initialCategory, onDonate, onViewDetails }: ExploreViewProps) {
  const { cities, loading: citiesLoading, error: citiesError } = useCities();
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [sortMode, setSortMode] = useState<SortMode>('distance');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const facilityTypes = useMemo(() => ['mosque', 'hospital'], []);

  const { projects, facilities, loading, error } = useProjects({
    category: selectedCategory ?? undefined,
    cityId: selectedCity?.id,
    facilityTypes,
    search: searchQuery || undefined,
  });

  const projectsWithDistance = useMemo<ProjectWithDistance[]>(() => {
    const refLat = userLocation?.lat ?? selectedCity?.lat ?? 23.588;
    const refLng = userLocation?.lng ?? selectedCity?.lng ?? 58.3829;

    return projects
      .filter((p) => p.facility)
      .map((p) => ({
        ...p,
        facility: p.facility as Facility,
        distance: calculateDistance(refLat, refLng, p.facility!.lat, p.facility!.lng),
      }));
  }, [projects, userLocation, selectedCity]);

  // Service radius only applies when we know where the donor actually is (Near Me).
  const reachableProjects = useMemo(
    () => (userLocation ? projectsWithDistance.filter((p) => isWithinServiceArea(p, p.distance)) : projectsWithDistance),
    [projectsWithDistance, userLocation]
  );
  const outOfAreaCount = projectsWithDistance.length - reachableProjects.length;

  const sortedProjects = useMemo(() => {
    switch (sortMode) {
      case 'urgency':
        return sortProjectsByUrgency(reachableProjects);
      case 'remaining':
        return sortProjectsByRemaining(reachableProjects);
      case 'need':
        return sortProjectsByNeed(reachableProjects);
      default:
        return sortProjectsByDistance(reachableProjects);
    }
  }, [reachableProjects, sortMode]);

  const groupedByType = useMemo(() => {
    const groups: Record<string, ProjectWithDistance[]> = {};
    sortedProjects.forEach((p) => {
      const type = p.facility?.type ?? 'facility';
      if (!groups[type]) groups[type] = [];
      groups[type].push(p);
    });
    return groups;
  }, [sortedProjects]);

  const handleGetLocation = () => {
    setLocating(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError(tr('Geolocation is not supported by your browser.', 'متصفحك لا يدعم تحديد الموقع.'));
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSelectedCity(null);
        setSortMode('distance');
        setLocating(false);
      },
      (err) => {
        setLocationError(
          err.code === 1
            ? tr('Location permission denied. Select a city manually.', 'تم رفض إذن الموقع. اختر مدينة يدويًا.')
            : tr('Could not get your location. Please select a city.', 'تعذر تحديد موقعك. يرجى اختيار مدينة.')
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const countLabel =
    sortedProjects.length === 1
      ? tr('1 verified project', 'مشروع موثق واحد')
      : tr(`${sortedProjects.length} verified projects`, `${sortedProjects.length} مشاريع موثقة`);
  const nearestKm = sortedProjects.length ? Math.min(...sortedProjects.map((p) => p.distance)).toFixed(1) : '0';

  const mapCenterLat = userLocation?.lat ?? selectedCity?.lat ?? 23.588;
  const mapCenterLng = userLocation?.lng ?? selectedCity?.lng ?? 58.3829;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">{tr('Help Near Me', 'ساعد بالقرب مني')}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {tr(
            'Select a donation type, choose a location, and find verified mosques or hospitals near you.',
            'اختر نوع التبرع والموقع، واعثر على مساجد أو مستشفيات موثقة بالقرب منك.'
          )}
        </p>
      </div>

      <div className="glass-card mb-4 rounded-2xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">{tr('Select your city', 'اختر مدينتك')}</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MapPin className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={userLocation ? NEAR_ME : selectedCity?.id ?? ''}
                  onChange={(e) => {
                    if (e.target.value === NEAR_ME) {
                      handleGetLocation();
                      return;
                    }
                    const city = cities.find((c) => c.id === e.target.value);
                    setSelectedCity(city ?? null);
                    setUserLocation(null);
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 ps-10 pe-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                >
                  <option value={NEAR_ME}>{tr('Near me (current location)', 'بالقرب مني (موقعي الحالي)')}</option>
                  <option value="">{tr('All cities in Oman', 'جميع مدن عُمان')}</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {placeName(city.name)} — {placeName(city.governorate)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleGetLocation}
                disabled={locating}
                className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all disabled:opacity-50 ${
                  userLocation ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                }`}
                title={tr('Use my current location', 'استخدم موقعي الحالي')}
              >
                {locating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{tr('Near Me', 'بالقرب مني')}</span>
              </button>
            </div>
            {locationError && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-600">
                <AlertCircle className="h-3 w-3" />
                {locationError}
              </div>
            )}
          </div>

          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">{tr('Search', 'بحث')}</label>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={tr('Mosque, hospital, area, project...', 'مسجد، مستشفى، منطقة، مشروع...')}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 ps-10 pe-9 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <CategoryChip
          label={tr('All', 'الكل')}
          active={!selectedCategory}
          onClick={() => setSelectedCategory(null)}
        />
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.key}
            label={cat.label}
            icon={cat.icon}
            active={selectedCategory === cat.key}
            onClick={() => setSelectedCategory(cat.key)}
          />
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {selectedCategory && (
            <div className="flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700">
              {(() => {
                const cat = getCategoryInfo(selectedCategory as any);
                const CatIcon = cat.icon;
                return (
                  <>
                    <CatIcon className="h-3.5 w-3.5" />
                    {cat.label}
                  </>
                );
              })()}
              <button
                onClick={() => setSelectedCategory(null)}
                className="ms-1 rounded-full p-0.5 hover:bg-teal-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'list' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <ListIcon className="h-3.5 w-3.5" /> {tr('List', 'قائمة')}
            </button>
            <button
              onClick={() => {
                setViewMode('map');
                if (!userLocation && !selectedCity && !locating) handleGetLocation();
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'map' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" /> {tr('Map', 'خريطة')}
            </button>
          </div>

          {viewMode === 'list' && (
            <div className="relative">
              <SlidersHorizontal className="absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="appearance-none rounded-xl border border-slate-200 bg-white py-2 ps-8 pe-8 text-xs font-medium text-slate-700 outline-none focus:border-teal-400"
              >
                <option value="distance">{tr('Nearest', 'الأقرب')}</option>
                <option value="urgency">{tr('Most Urgent', 'الأكثر إلحاحًا')}</option>
                <option value="need">{tr('Highest Need', 'الأعلى احتياجًا')}</option>
                <option value="remaining">{tr('Most Remaining', 'الأكثر حاجة للتمويل')}</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {loading || citiesLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
          <p className="mt-3 text-sm text-slate-500">{tr('Loading nearby needs...', 'جارٍ تحميل الاحتياجات القريبة...')}</p>
        </div>
      ) : error || citiesError ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-2xl py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <AlertCircle className="h-7 w-7 text-amber-600" />
          </div>
          <h3 className="text-base font-bold text-slate-700">{tr('Unable to load nearby needs', 'تعذر تحميل الاحتياجات القريبة')}</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {error ?? citiesError ?? tr('Please check your connection or try again in a moment.', 'تحقق من اتصالك أو حاول مرة أخرى بعد قليل.')}
          </p>
        </div>
      ) : sortedProjects.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-2xl py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Search className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-base font-bold text-slate-700">{tr('No projects found', 'لا توجد مشاريع')}</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            {outOfAreaCount > 0
              ? tr(
                  `${outOfAreaCount} ${outOfAreaCount === 1 ? 'post serves' : 'posts serve'} other areas but not your current location. Pick a city to browse them.`,
                  `${outOfAreaCount} ${outOfAreaCount === 1 ? 'منشور يخدم' : 'منشورات تخدم'} مناطق أخرى غير موقعك الحالي. اختر مدينة لتصفحها.`
                )
              : selectedCategory || selectedCity || searchQuery
              ? tr('Try adjusting your filters — select a different category, city, or search term.', 'جرّب تعديل عوامل التصفية: اختر فئة أو مدينة أو كلمة بحث مختلفة.')
              : tr('Select a category or city to find nearby verified needs.', 'اختر فئة أو مدينة للعثور على احتياجات موثقة قريبة.')}
          </p>
        </div>
      ) : viewMode === 'map' ? (
        <div className="glass-card overflow-hidden rounded-2xl">
          <div className="h-[500px] w-full">
            <MapView
              projects={sortedProjects}
              onSelectProject={onViewDetails}
              centerLat={mapCenterLat}
              centerLng={mapCenterLng}
              userLat={userLocation?.lat}
              userLng={userLocation?.lng}
            />
          </div>
          <div className="border-t border-slate-200/60 px-4 py-2.5 text-xs text-slate-500">
            {userLocation
              ? tr(
                  `Showing your location · nearest project ${nearestKm} km away · ${countLabel} in total`,
                  `يتم عرض موقعك · أقرب مشروع على بعد ${nearestKm} كم · ${countLabel} إجمالًا`
                )
              : tr(`${countLabel} on the map`, `${countLabel} على الخريطة`)}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-3 text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{countLabel}</span>{' '}
            {(userLocation || selectedCity) && tr('near you', 'بالقرب منك')}
            {outOfAreaCount > 0 && (
              <span className="ms-1 text-slate-400">
                · {tr(`${outOfAreaCount} outside your area hidden`, `تم إخفاء ${outOfAreaCount} خارج منطقتك`)}
              </span>
            )}
          </div>

          <div className="space-y-6">
            {['mosque', 'hospital'].map((type) => {
              const group = groupedByType[type];
              if (!group || group.length === 0) return null;
              const label = type === 'mosque' ? tr('Nearby Mosques', 'المساجد القريبة') : tr('Nearby Hospitals', 'المستشفيات القريبة');
              return (
                <div key={type}>
                  <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-slate-800">
                    {label}
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      {group.length}
                    </span>
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {group.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onDonate={onDonate}
                        onViewDetails={onViewDetails}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
        active
          ? 'bg-slate-900 text-white'
          : 'glass-card text-slate-600 hover:bg-slate-100'
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
