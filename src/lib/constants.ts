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

export interface CategoryInfo {
  key: Category;
  label: string;
  icon: LucideIcon;
  color: string;
  tint: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { key: 'water', label: 'Water', icon: Droplets, color: 'text-sky-600', tint: 'bg-sky-50 text-sky-600' },
  { key: 'mosque', label: 'Mosques', icon: Landmark, color: 'text-teal-600', tint: 'bg-teal-50 text-teal-600' },
  { key: 'hospital', label: 'Hospitals', icon: Building2, color: 'text-rose-600', tint: 'bg-rose-50 text-rose-600' },
];

export function getCategoryInfo(key: Category): CategoryInfo {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[0];
}

export const DONATION_PRESETS = [5, 10, 25, 50, 100];

export const SPONSOR_PRESETS = [5, 10, 25];

export const SPONSOR_FREQUENCIES = [
  { key: 'one-time', label: 'One-time' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'custom', label: 'Custom' },
] as const;

export type DeliveryStatus = 'received' | 'preparing' | 'on_the_way' | 'delivered';

export const DELIVERY_STEPS: { key: DeliveryStatus; label: string; icon: LucideIcon }[] = [
  { key: 'received', label: 'Donation Received', icon: Heart },
  { key: 'preparing', label: 'Preparing', icon: Package },
  { key: 'on_the_way', label: 'On the Way', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

export function deliveryStepIndex(status: DeliveryStatus): number {
  return DELIVERY_STEPS.findIndex((s) => s.key === status);
}

