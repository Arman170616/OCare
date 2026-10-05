import type { Profile } from './auth-types';

// Demo accounts live in localStorage until the app has a real auth backend.
const USERS_KEY = 'omancare-users';

const DEFAULT_USERS = [
  {
    id: 'admin-demo',
    email: 'admin@omancare.com',
    password: 'admin123',
    full_name: 'Platform Admin',
    role: 'admin',
    organization_name: null,
    phone: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 'donor-demo',
    email: 'donor@omancare.com',
    password: 'donor123',
    full_name: 'Aisha Rahman',
    role: 'donor',
    organization_name: null,
    phone: null,
    created_at: new Date().toISOString(),
  },
] as const;

export function getStoredUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return [...DEFAULT_USERS];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_USERS];
  } catch {
    return [...DEFAULT_USERS];
  }
}

export function writeStoredUsers(users: Array<Record<string, any>>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

const PROFILE_KEY = 'omancare-profile';

export function listProfiles(): Profile[] {
  return getStoredUsers().map((user) => ({
    id: user.id,
    email: user.email,
    full_name: user.full_name ?? null,
    role: user.role as Profile['role'],
    organization_name: user.organization_name ?? null,
    phone: user.phone ?? null,
    created_at: user.created_at,
  }));
}

export function setUserRole(userId: string, role: Profile['role']): void {
  writeStoredUsers(getStoredUsers().map((user) => (user.id === userId ? { ...user, role } : user)));
  try {
    const current = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null');
    if (current?.id === userId) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ ...current, role }));
    }
  } catch {
    // ignore malformed stored profile
  }
}
