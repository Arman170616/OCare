import type { Category } from './types';
import {
  Droplets,
  Building2,
  Landmark,
  Heart,
  Package,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { tr } from './i18n';

export interface CategoryInfo {
  key: Category;
  label: string;
  icon: LucideIcon;
  color: string;
  tint: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { key: 'water', get label() { return tr('Water', 'المياه'); }, icon: Droplets, color: 'text-sky-600', tint: 'bg-sky-50 text-sky-600' },
  { key: 'mosque', get label() { return tr('Mosques', 'المساجد'); }, icon: Landmark, color: 'text-teal-600', tint: 'bg-teal-50 text-teal-600' },
  { key: 'hospital', get label() { return tr('Hospitals', 'المستشفيات'); }, icon: Building2, color: 'text-rose-600', tint: 'bg-rose-50 text-rose-600' },
];

export function getCategoryInfo(key: Category): CategoryInfo {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];
}

export const DONATION_PRESETS = [5, 10, 25, 50, 100];

export const SPONSOR_PRESETS = [5, 10, 25];

export const SPONSOR_FREQUENCIES = [
  { key: 'one-time', get label() { return tr('One-time', 'مرة واحدة'); } },
  { key: 'weekly', get label() { return tr('Weekly', 'أسبوعي'); } },
  { key: 'monthly', get label() { return tr('Monthly', 'شهري'); } },
  { key: 'custom', get label() { return tr('Custom', 'مخصص'); } },
] as const;

export type DeliveryStatus = 'received' | 'preparing' | 'on_the_way' | 'delivered';

export const DELIVERY_STEPS: { key: DeliveryStatus; label: string; icon: LucideIcon }[] = [
  { key: 'received', get label() { return tr('Donation Received', 'تم استلام التبرع'); }, icon: Heart },
  { key: 'preparing', get label() { return tr('Preparing', 'قيد التجهيز'); }, icon: Package },
  { key: 'on_the_way', get label() { return tr('On the Way', 'في الطريق'); }, icon: Truck },
  { key: 'delivered', get label() { return tr('Delivered', 'تم التسليم'); }, icon: CheckCircle2 },
];

export function deliveryStepIndex(status: DeliveryStatus): number {
  return DELIVERY_STEPS.findIndex((s) => s.key === status);
}

