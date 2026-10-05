import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Facility, Project, Profile } from '@/lib/auth-types';
import { formatOMR, facilityTypeLabel, needLevelColor } from '@/lib/utils';
import { getCategoryInfo } from '@/lib/constants';
import {
  Shield, Building2, Landmark, Droplets, BadgeCheck, XCircle, Clock,
  Users, TrendingUp, Heart, CheckCircle2, AlertCircle, Loader2, MapPin,
} from 'lucide-react';

type Tab = 'overview' | 'facilities' | 'projects' | 'users';

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [projects, setProjects] = useState<(Project & { facility?: Facility })[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: facData }, { data: projData }, { data: userData }] = await Promise.all([
      supabase.from('facilities').select('*').order('created_at', { ascending: false }),
      supabase.from('projects').select('*, facility:facilities(*)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
    ]);
    setFacilities((facData ?? []) as Facility[]);
    setProjects((projData ?? []) as (Project & { facility?: Facility })[]);
    setUsers((userData ?? []) as Profile[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = {
    totalFacilities: facilities.length,
    pendingFacilities: facilities.filter((f) => f.verification_status === 'pending').length,
    verifiedFacilities: facilities.filter((f) => f.verification_status === 'verified').length,
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === 'active').length,
    totalUsers: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    organizations: users.filter((u) => u.role === 'organization').length,
    donors: users.filter((u) => u.role === 'donor').length,
  };

  const handleVerifyFacility = async (facilityId: string, status: 'verified' | 'rejected') => {
    const { error } = await supabase.rpc('verify_facility', {
      p_facility_id: facilityId,
      p_status: status,
    });
    if (error) {
      alert('Could not update verification. Please try again.');
      return;
    }
    loadData();
  };

  const handleSetRole = async (userId: string, newRole: 'admin' | 'organization' | 'donor') => {
    const { error } = await supabase.rpc('set_user_role', {
      p_user_id: userId,
      p_role: newRole,
    });
    if (error) {
      alert('Could not update user role. Please try again.');
      return;
    }
    loadData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        <p className="mt-3 text-sm text-slate-500">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Admin Panel</h1>
          <p className="text-xs text-slate-500">Manage facilities, projects, and users</p>
        </div>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {([
          { key: 'overview' as const, label: 'Overview' },
          { key: 'facilities' as const, label: 'Facilities' },
          { key: 'projects' as const, label: 'Projects' },
          { key: 'users' as const, label: 'Users' },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard icon={Building2} label="Total Facilities" value={stats.totalFacilities} color="bg-teal-50 text-teal-600" />
          <StatCard icon={Clock} label="Pending Verification" value={stats.pendingFacilities} color="bg-amber-50 text-amber-600" />
          <StatCard icon={BadgeCheck} label="Verified" value={stats.verifiedFacilities} color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={TrendingUp} label="Active Projects" value={stats.activeProjects} color="bg-sky-50 text-sky-600" />
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-violet-50 text-violet-600" />
          <StatCard icon={Shield} label="Admins" value={stats.admins} color="bg-red-50 text-red-600" />
          <StatCard icon={Building2} label="Organizations" value={stats.organizations} color="bg-blue-50 text-blue-600" />
          <StatCard icon={Heart} label="Donors" value={stats.donors} color="bg-pink-50 text-pink-600" />
        </div>
      )}

      {tab === 'facilities' && (
        <div className="space-y-2.5">
          {facilities.length === 0 ? (
            <EmptyState text="No facilities registered yet." />
          ) : (
            facilities.map((f) => (
              <div key={f.id} className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      {f.type === 'mosque' ? <Landmark className="h-5 w-5" /> : f.type === 'hospital' ? <Building2 className="h-5 w-5" /> : <Droplets className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">{f.name}</div>
                      <div className="text-xs text-slate-500">
                        {facilityTypeLabel(f.type)} · {f.governorate} · {f.area ?? f.wilayat ?? '—'}
                      </div>
                      {f.responsible_org && (
                        <div className="text-[10px] text-slate-400">Managed by: {f.responsible_org}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <VerificationBadge status={f.verification_status} />
                  </div>
                </div>
                {f.verification_status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleVerifyFacility(f.id, 'verified')}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-emerald-600"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleVerifyFacility(f.id, 'rejected')}
                      className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-all hover:bg-red-100"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                )}
                {f.verification_status === 'rejected' && (
                  <div className="mt-3">
                    <button
                      onClick={() => handleVerifyFacility(f.id, 'verified')}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600 transition-all hover:bg-emerald-100"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Re-approve
                    </button>
                  </div>
                )}
                {f.verification_status === 'verified' && (
                  <div className="mt-3">
                    <button
                      onClick={() => handleVerifyFacility(f.id, 'rejected')}
                      className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-all hover:bg-red-100"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Revoke
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'projects' && (
        <div className="space-y-2.5">
          {projects.length === 0 ? (
            <EmptyState text="No projects created yet." />
          ) : (
            projects.map((p) => {
              const cat = getCategoryInfo(p.category);
              return (
                <div key={p.id} className="glass-card rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.tint}`}>
                        <cat.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800">{p.title}</div>
                        <div className="text-xs text-slate-500">{p.facility?.name ?? '—'}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px]">
                          <span className={`rounded border px-1.5 py-0.5 font-semibold ${needLevelColor(p.need_level)}`}>
                            {p.need_level.toUpperCase()}
                          </span>
                          <span className={`rounded px-1.5 py-0.5 font-semibold ${p.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            {p.status}
                          </span>
                          {p.verified && (
                            <span className="flex items-center gap-0.5 text-emerald-600">
                              <BadgeCheck className="h-3 w-3" /> Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-teal-600">{formatOMR(p.collected_amount)}</div>
                      <div className="text-[10px] text-slate-400">of {formatOMR(p.target_amount)}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-2.5">
          {users.length === 0 ? (
            <EmptyState text="No users registered yet." />
          ) : (
            users.map((u) => (
              <div key={u.id} className="glass-card rounded-2xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-sm font-bold text-white">
                      {u.full_name?.charAt(0).toUpperCase() ?? 'U'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">{u.full_name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                      {u.organization_name && (
                        <div className="text-[10px] text-slate-400">{u.organization_name}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RoleBadge role={u.role} />
                    <select
                      value={u.role}
                      onChange={(e) => handleSetRole(u.id, e.target.value as 'admin' | 'organization' | 'donor')}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-teal-400"
                    >
                      <option value="donor">Donor</option>
                      <option value="organization">Organization</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Shield; label: string; value: number; color: string }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function VerificationBadge({ status }: { status: string }) {
  if (status === 'verified') {
    return <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600"><BadgeCheck className="h-3 w-3" /> VERIFIED</span>;
  }
  if (status === 'pending') {
    return <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600"><Clock className="h-3 w-3" /> PENDING</span>;
  }
  return <span className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600"><XCircle className="h-3 w-3" /> REJECTED</span>;
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'admin') return <span className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600"><Shield className="h-3 w-3" /> ADMIN</span>;
  if (role === 'organization') return <span className="flex items-center gap-1 rounded-lg bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-600"><Building2 className="h-3 w-3" /> ORG</span>;
  return <span className="flex items-center gap-1 rounded-lg bg-teal-50 px-2 py-1 text-[10px] font-bold text-teal-600"><Heart className="h-3 w-3" /> DONOR</span>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center rounded-2xl py-16 text-center">
      <AlertCircle className="mb-2 h-8 w-8 text-slate-300" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}
