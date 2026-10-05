import type { Project, ProjectWithDistance, Facility } from './types';

export function formatOMR(amount: number): string {
  return `OMR ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 })}`;
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
      return 'Mosque';
    case 'hospital':
      return 'Hospital';
    case 'facility':
      return 'Community Facility';
  }
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
    drinking: 'Drinking Water',
    dispenser: 'Water Dispensers',
    tank: 'Water Tanks',
    supply: 'Water Supply',
    filtration: 'Filtration System',
    maintenance: 'Water System Maintenance',
    project: 'Water Project',
  };
  return labels[type] || type;
}

export function resolveAmount(amount: number, customAmount: string): number {
  return customAmount !== '' ? parseFloat(customAmount) : amount;
}

export function isValidAmount(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}
