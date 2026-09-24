import type { City, Facility, Project, Donation, ImpactUpdate } from './types';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'organization' | 'donor';
  organization_name: string | null;
  phone: string | null;
  created_at: string;
}

export interface AuthState {
  profile: Profile | null;
  loading: boolean;
}

export type { City, Facility, Project, Donation, ImpactUpdate };
