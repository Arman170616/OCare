import type { Project, ProjectWithDistance, Facility } from './types';
import { tr, isRtl } from './i18n';

export function formatOMR(amount: number): string {
  const value = amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
  return isRtl() ? `${value} ر.ع.` : `OMR ${value}`;
}

/** Format a distance in km with the localized unit. */
export function formatKm(km: number, digits = 1): string {
  return `${km.toFixed(digits)} ${tr('km', 'كم')}`;
}

// Arabic names for the places in the seed data; anything unknown falls back to English.
const PLACE_AR: Record<string, string> = {
  Muscat: 'مسقط',
  Salalah: 'صلالة',
  Sohar: 'صحار',
  Nizwa: 'نزوى',
  Sur: 'صور',
  Dhofar: 'ظفار',
  'North Batinah': 'شمال الباطنة',
  Dakhiliyah: 'الداخلية',
  'South Sharqiyah': 'جنوب الشرقية',
  'Al Khuwair': 'الخوير',
  Seeb: 'السيب',
  Haffa: 'الحافة',
  'Seeb, Muscat': 'السيب، مسقط',
  'Haffa, Salalah': 'الحافة، صلالة',
};

export function placeName(name: string | null | undefined): string {
  if (!name) return '';
  return isRtl() ? PLACE_AR[name] ?? name : name;
}

export function facilityName(facility: Pick<Facility, 'name' | 'name_arabic'> | null | undefined): string {
  if (!facility) return '';
  return isRtl() && facility.name_arabic ? facility.name_arabic : facility.name;
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getProgressPercent(project: Project): number {
  if (project.target_amount <= 0) return 0;
  return Math.min(100, Math.round((project.collected_amount / project.target_amount) * 100));
}

export function getRemainingAmount(project: Project): number {
  return Math.max(0, project.target_amount - project.collected_amount);
}

export function sortProjectsByDistance(projects: ProjectWithDistance[]): ProjectWithDistance[] {
  return [...projects].sort((a, b) => a.distance - b.distance);
}

export function sortProjectsByUrgency(projects: ProjectWithDistance[]): ProjectWithDistance[] {
  const urgencyOrder: Record<string, number> = { critical: 0, urgent: 1, normal: 2 };
  return [...projects].sort(
    (a, b) => (urgencyOrder[a.urgency] ?? 3) - (urgencyOrder[b.urgency] ?? 3)
  );
}

export function sortProjectsByRemaining(projects: ProjectWithDistance[]): ProjectWithDistance[] {
  return [...projects].sort(
    (a, b) => getRemainingAmount(b) - getRemainingAmount(a)
  );
}

export function sortProjectsByNeed(projects: ProjectWithDistance[]): ProjectWithDistance[] {
  const needOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...projects].sort(
    (a, b) => (needOrder[a.need_level] ?? 4) - (needOrder[b.need_level] ?? 4)
  );
}

export function facilityTypeLabel(type: Facility['type']): string {
  switch (type) {
    case 'mosque':
      return tr('Mosque', 'مسجد');
    case 'hospital':
      return tr('Hospital', 'مستشفى');
    case 'facility':
      return tr('Community Facility', 'مرفق مجتمعي');
  }
}

export function needLevelLabel(level: Project['need_level']): string {
  const labels = {
    critical: tr('Critical', 'حرج'),
    high: tr('High', 'مرتفع'),
    medium: tr('Medium', 'متوسط'),
    low: tr('Low', 'منخفض'),
  };
  return labels[level] ?? level;
}

export function urgencyLabel(urgency: Project['urgency']): string {
  const labels = {
    critical: tr('Critical', 'حرج'),
    urgent: tr('Urgent', 'عاجل'),
    normal: tr('Normal', 'عادي'),
  };
  return labels[urgency] ?? urgency;
}

export function statusLabel(status: Project['status']): string {
  const labels = {
    active: tr('Active', 'نشط'),
    funded: tr('Funded', 'مكتمل التمويل'),
    completed: tr('Completed', 'منتهٍ'),
    cancelled: tr('Cancelled', 'ملغى'),
  };
  return labels[status] ?? status;
}

export function needLevelColor(level: Project['need_level']): string {
  switch (level) {
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'high':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'low':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  }
}

export function urgencyColor(urgency: Project['urgency']): string {
  switch (urgency) {
    case 'critical':
      return 'text-red-700 bg-red-100';
    case 'urgent':
      return 'text-orange-700 bg-orange-100';
    case 'normal':
      return 'text-sky-700 bg-sky-100';
  }
}

export function waterTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    drinking: tr('Drinking Water', 'مياه الشرب'),
    dispenser: tr('Water Dispensers', 'موزعات المياه'),
    tank: tr('Water Tanks', 'خزانات المياه'),
    supply: tr('Water Supply', 'إمداد المياه'),
    filtration: tr('Filtration System', 'نظام الترشيح'),
    maintenance: tr('Water System Maintenance', 'صيانة شبكة المياه'),
    project: tr('Water Project', 'مشروع مياه'),
  };
  return labels[type] || type;
}

export function resolveAmount(amount: number, customAmount: string): number {
  return customAmount !== '' ? parseFloat(customAmount) : amount;
}

export function isValidAmount(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/** True when a donor at `distanceKm` from the facility falls inside the post's service area. */
export function isWithinServiceArea(project: { service_radius_km?: number | null }, distanceKm: number): boolean {
  return project.service_radius_km == null || distanceKm <= project.service_radius_km;
}
