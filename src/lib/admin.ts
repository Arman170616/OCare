import { apiFetch } from './api';
import type { Facility, Project } from './types';

export interface PostInput {
  facility_id: string;
  title: string;
  description: string;
  target_amount: number;
  service_radius_km: number | null;
  status: Project['status'];
  /** Base64 data URL of a new photo; omit to keep the current one. */
  image_data?: string;
  remove_image?: boolean;
}

export const RADIUS_PRESETS_KM = [2, 5, 10, 25, 50];

export function listAllFacilities() {
  return apiFetch<Facility[]>('/api/admin/facilities');
}

export function listAllPosts() {
  return apiFetch<Project[]>('/api/projects');
}

export function setFacilityVerification(id: string, status: Facility['verification_status']) {
  return apiFetch<Facility>(`/api/admin/facilities/${id}/verification`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
}

export function createPost(input: PostInput) {
  return apiFetch<Project>('/api/admin/projects', { method: 'POST', body: JSON.stringify(input) });
}

export function updatePost(id: string, input: PostInput) {
  return apiFetch<Project>(`/api/admin/projects/${id}`, { method: 'PUT', body: JSON.stringify(input) });
}

export function deletePost(id: string) {
  return apiFetch<void>(`/api/admin/projects/${id}`, { method: 'DELETE' });
}
