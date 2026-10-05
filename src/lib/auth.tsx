import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Profile } from './auth-types';
import { getStoredUsers, writeStoredUsers } from './users';

interface AuthContextValue {
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role: string, orgName?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const STORAGE_KEY = 'omancare-profile';
const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredProfile(): Profile | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Profile) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setProfile(getStoredProfile());
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const users = getStoredUsers();
    const found = users.find(
      (user) => user.email.toLowerCase() === normalizedEmail && user.password === password
    );

    if (!found) {
      return { error: 'Invalid email or password.' };
    }

    const nextProfile: Profile = {
      id: found.id,
      email: found.email,
      full_name: found.full_name,
      role: found.role as Profile['role'],
      organization_name: found.organization_name ?? null,
      phone: found.phone ?? null,
      created_at: found.created_at,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
    setProfile(nextProfile);
    return { error: null };
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, fullName: string, role: string, orgName?: string) => {
      const normalizedEmail = email.trim().toLowerCase();
      const users = getStoredUsers();
      const exists = users.some((user) => user.email.toLowerCase() === normalizedEmail);

      if (exists) {
        return { error: 'An account with this email already exists.' };
      }

      const nextProfile: Profile = {
        id: `user-${Date.now()}`,
        email: normalizedEmail,
        full_name: fullName.trim() || 'New donor',
        role: (role === 'admin' ? 'donor' : role === 'organization' ? 'organization' : 'donor') as Profile['role'],
        organization_name: orgName?.trim() || null,
        phone: null,
        created_at: new Date().toISOString(),
      };

      const nextUser = {
        ...nextProfile,
        password,
      };

      writeStoredUsers([...users, nextUser]);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
      setProfile(nextProfile);
      return { error: null };
    },
    []
  );

  const signOut = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    setProfile(getStoredProfile());
  }, []);

  return (
    <AuthContext.Provider value={{ profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
