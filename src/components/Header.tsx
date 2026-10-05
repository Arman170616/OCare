import { MapPin, Heart, LayoutGrid, BarChart3, Sparkles, Shield, Building2, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import type { Profile } from '@/lib/auth-types';

export type View = 'home' | 'explore' | 'impact' | 'admin' | 'organization';

interface HeaderProps {
  activeView: View;
  onNavigate: (view: View) => void;
}

export function Header({ activeView, onNavigate }: HeaderProps) {
  const { profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navItems: { key: View; label: string; icon: typeof LayoutGrid }[] = [
    { key: 'home', label: 'Home', icon: LayoutGrid },
    { key: 'explore', label: 'Help Near Me', icon: Heart },
    { key: 'impact', label: 'My Impact', icon: BarChart3 },
  ];

  if (profile?.role === 'admin') {
    navItems.push({ key: 'admin', label: 'Admin Panel', icon: Shield });
  } else if (profile?.role === 'organization') {
    navItems.push({ key: 'organization', label: 'My Facilities', icon: Building2 });
  }

  const roleBadge = profile ? getRoleBadge(profile) : null;
  const RoleIcon = roleBadge?.icon;

  return (
    <header className="sticky top-0 z-40 px-4 pt-4">
      <div className="mx-auto max-w-7xl">
        <div className="glass-card flex items-center justify-between rounded-2xl px-5 py-3">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-lg font-bold tracking-tight text-slate-800">OmanCare</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Donate Where Help Is Needed
              </div>
            </div>
          </button>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {roleBadge && (
              <span className={`hidden items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide sm:flex ${roleBadge.className}`}>
                {RoleIcon && <RoleIcon className="h-3 w-3" />}
                {roleBadge.label}
              </span>
            )}

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-2 transition-all hover:bg-slate-100"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-xs font-bold text-white">
                  {profile?.full_name?.charAt(0).toUpperCase() ?? 'U'}
                </div>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>

              {menuOpen && profile && (
                <div className="absolute right-0 top-full mt-2 w-52 glass-card rounded-2xl p-2 shadow-xl">
                  <div className="border-b border-slate-200/60 px-3 py-2">
                    <div className="text-sm font-bold text-slate-800">{profile.full_name || 'User'}</div>
                    <div className="truncate text-xs text-slate-500">{profile.email}</div>
                  </div>
                  <div className="py-1 sm:hidden">
                    <span className={`flex items-center gap-1 px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${roleBadge?.className}`}>
                      {RoleIcon && <RoleIcon className="h-3 w-3" />}
                      {roleBadge?.label}
                    </span>
                  </div>
                  <div className="lg:hidden">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.key}
                          onClick={() => { onNavigate(item.key); setMenuOpen(false); }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => { signOut(); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile nav bar */}
        <div className="mt-2 flex gap-1 overflow-x-auto lg:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'glass-card text-slate-600'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}

function getRoleBadge(profile: Profile) {
  switch (profile.role) {
    case 'admin':
      return { label: 'Admin', icon: Shield, className: 'bg-red-50 text-red-600' };
    case 'organization':
      return { label: 'Organization', icon: Building2, className: 'bg-sky-50 text-sky-600' };
    default:
      return { label: 'Donor', icon: Heart, className: 'bg-teal-50 text-teal-600' };
  }
}
