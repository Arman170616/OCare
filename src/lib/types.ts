export interface City {
  id: string;
  name: string;
  governorate: string;
  wilayat: string | null;
  lat: number;
  lng: number;
}

export interface Facility {
  id: string;
  name: string;
  name_arabic: string | null;
  type: 'mosque' | 'hospital' | 'facility';
  city_id: string | null;
  governorate: string;
  wilayat: string | null;
  area: string | null;
  address: string | null;
  lat: number;
  lng: number;
  responsible_org: string | null;
  verification_status: 'pending' | 'verified' | 'rejected';
  verification_date: string | null;
  owner_id: string | null;
}

export interface Project {
  id: string;
  facility_id: string;
  title: string;
  category: Category;
  need_level: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'normal' | 'urgent' | 'critical';
  target_amount: number;
  collected_amount: number;
  currency: string;
  description: string | null;
  status: 'active' | 'funded' | 'completed' | 'cancelled';
  verified: boolean;
  image_url: string | null;
  water_type: WaterType | null;
  /** Donors outside this distance (km) from the facility don't see the post; null = everywhere. */
  service_radius_km?: number | null;
  created_at: string;
  updated_at: string;
  facility?: Facility;
}

export interface Donation {
  id: string;
  project_id: string;
  user_id: string | null;
  donor_name: string | null;
  donor_email: string | null;
  amount: number;
  currency: string;
  recurring: boolean;
  frequency: 'one-time' | 'weekly' | 'monthly' | 'custom' | null;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  delivery_status: 'received' | 'preparing' | 'on_the_way' | 'delivered';
  delivery_updated_at: string;
  receipt_number: string;
  created_at: string;
  project?: Project;
}

export interface ImpactUpdate {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  completion_date: string | null;
  amount_utilized: number | null;
  quantity_delivered: string | null;
  status: 'draft' | 'published';
  created_at: string;
}

export type Category =
  | 'water'
  | 'food'
  | 'medical'
  | 'hospital'
  | 'mosque'
  | 'education'
  | 'housing'
  | 'orphan'
  | 'emergency'
  | 'debt'
  | 'other';

export type WaterType =
  | 'drinking'
  | 'dispenser'
  | 'tank'
  | 'supply'
  | 'filtration'
  | 'maintenance'
  | 'project';

export interface ProjectWithDistance extends Project {
  distance: number;
  facility: Facility;
}
