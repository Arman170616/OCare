import type { Profile } from './auth-types';

// Demo accounts live in localStorage until the app has a real auth backend.
const USERS_KEY = 'omancare-users';

// Demo admin login. This ships in the browser bundle, so it is NOT a secret:
// replace with server-side auth before real use.
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'adminpass';

const DEFAULT_USERS = [
  {
    id: 'admin-demo',
    username: 'admin',
    email: 'admin@omancare.com',
    password: ADMIN_PASSWORD,
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

function readUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return [...DEFAULT_USERS];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_USERS];
  } catch {
    return [...DEFAULT_USERS];
  }
}

export function getStoredUsers() {
  const users = readUsers();
  // Keep the built-in admin's login current, including in browsers that saved older demo data.
  const hasAdmin = users.some((u) => u.id === 'admin-demo');
  const synced = hasAdmin
    ? users.map((u) => (u.id === 'admin-demo' ? { ...u, username: ADMIN_USERNAME, password: ADMIN_PASSWORD } : u))
    : [DEFAULT_USERS[0], ...users];
  localStorage.setItem(USERS_KEY, JSON.stringify(synced));
  return synced;
}

/** Find an account by email or username plus password. */
export function findUserByLogin(login: string, password: string) {
  const needle = login.trim().toLowerCase();
  return getStoredUsers().find(
    (user) =>
      user.password === password &&
      (user.email?.toLowerCase() === needle || user.username?.toLowerCase() === needle)
  );
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
