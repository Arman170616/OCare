import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Facility, Project } from '@/lib/types';
import type { Profile } from '@/lib/auth-types';
import { useAuth } from '@/lib/auth';
import { listProfiles, setUserRole } from '@/lib/users';
import {
  listAllFacilities,
  listAllPosts,
  setFacilityVerification,
  updatePost,
  deletePost,
  type PostInput,
} from '@/lib/admin';
import { formatOMR, facilityTypeLabel, getProgressPercent, statusLabel, facilityName, placeName } from '@/lib/utils';
import { tr } from '@/lib/i18n';
import { getCategoryInfo } from '@/lib/constants';
import { PostFormModal } from '@/components/PostFormModal';
import {
  Shield, Building2, Landmark, Droplets, BadgeCheck, XCircle, Clock, Users, TrendingUp, Heart,
  CheckCircle2, AlertCircle, Loader2, Plus, Pencil, Trash2, MapPin, Archive, RotateCcw, Wallet,
} from 'lucide-react';

type Tab = 'overview' | 'posts' | 'facilities' | 'users';
type PostFilter = 'all' | 'active' | 'closed';

function toInput(post: Project, overrides: Partial<PostInput> = {}): PostInput {
  return {
    facility_id: post.facility_id,
    title: post.title,
    description: post.description ?? '',
    target_amount: post.target_amount,
    service_radius_km: post.service_radius_km ?? null,
    status: post.status,
    ...overrides,
  };
}

export function AdminDashboard() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [posts, setPosts] = useState<Project[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [postFilter, setPostFilter] = useState<PostFilter>('all');
  const [editing, setEditing] = useState<Project | null | 'new'>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setError('');
    try {
      const [facData, postData] = await Promise.all([listAllFacilities(), listAllPosts()]);
      setFacilities(facData);
      setPosts(postData);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('Could not load admin data.', 'تعذر تحميل بيانات الإدارة.'));
    } finally {
      setUsers(listProfiles());
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const verifiedFacilities = useMemo(() => facilities.filter((f) => f.verification_status === 'verified'), [facilities]);

  const stats = {
    totalFacilities: facilities.length,
    pendingFacilities: facilities.filter((f) => f.verification_status === 'pending').length,
    verifiedFacilities: verifiedFacilities.length,
    activePosts: posts.filter((p) => p.status === 'active').length,
    totalRaised: posts.reduce((sum, p) => sum + (p.collected_amount || 0), 0),
    totalUsers: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    donors: users.filter((u) => u.role === 'donor').length,
  };

  const visiblePosts = posts.filter((p) =>
    postFilter === 'all' ? true : postFilter === 'active' ? p.status === 'active' : p.status !== 'active'
  );

  const runAction = async (id: string, action: () => Promise<unknown>) => {
    setBusyId(id);
    setError('');
    try {
      await action();
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr('Something went wrong.', 'حدث خطأ ما.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = (post: Project) => {
    if (!window.confirm(tr(`Delete "${post.title}"? This cannot be undone.`, `حذف "${post.title}"؟ لا يمكن التراجع عن هذا الإجراء.`))) return;
    runAction(post.id, () => deletePost(post.id));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        <p className="mt-3 text-sm text-slate-500">{tr('Loading admin dashboard...', 'جارٍ تحميل لوحة الإدارة...')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">{tr('Admin Panel', 'لوحة الإدارة')}</h1>
            <p className="text-xs text-slate-500">{tr('Manage water posts, facilities, and users', 'إدارة منشورات المياه والمنشآت والمستخدمين')}</p>
          </div>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
        >
          <Plus className="h-4 w-4" />
          {tr('New water post', 'منشور مياه جديد')}
        </button>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {([
          { key: 'overview', label: tr('Overview', 'نظرة عامة') },
          { key: 'posts', label: `${tr('Water Posts', 'منشورات المياه')} (${posts.length})` },
          { key: 'facilities', label: `${tr('Facilities', 'المنشآت')} (${facilities.length})` },
          { key: 'users', label: `${tr('Users', 'المستخدمون')} (${users.length})` },
        ] as { key: Tab; label: string }[]).map((t) => (
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

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard icon={Droplets} label={tr('Active Posts', 'المنشورات النشطة')} value={stats.activePosts} color="bg-sky-50 text-sky-600" />
          <StatCard icon={Wallet} label={tr('Total Raised', 'إجمالي المبالغ المجمعة')} value={formatOMR(stats.totalRaised)} color="bg-teal-50 text-teal-600" />
          <StatCard icon={BadgeCheck} label={tr('Verified Facilities', 'المنشآت الموثقة')} value={stats.verifiedFacilities} color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={Clock} label={tr('Pending Verification', 'بانتظار التوثيق')} value={stats.pendingFacilities} color="bg-amber-50 text-amber-600" />
          <StatCard icon={Building2} label={tr('Total Facilities', 'إجمالي المنشآت')} value={stats.totalFacilities} color="bg-slate-100 text-slate-600" />
          <StatCard icon={Users} label={tr('Total Users', 'إجمالي المستخدمين')} value={stats.totalUsers} color="bg-violet-50 text-violet-600" />
          <StatCard icon={Shield} label={tr('Admins', 'المديرون')} value={stats.admins} color="bg-red-50 text-red-600" />
          <StatCard icon={Heart} label={tr('Donors', 'المتبرعون')} value={stats.donors} color="bg-pink-50 text-pink-600" />
        </div>
      )}

      {tab === 'posts' && (
        <div>
          <div className="mb-3 flex gap-1.5">
            {(['all', 'active', 'closed'] as PostFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setPostFilter(f)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  postFilter === f ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
              >
                {f === 'all' ? tr('All', 'الكل') : f === 'active' ? tr('Active', 'النشطة') : tr('Closed', 'المغلقة')}
              </button>
            ))}
          </div>

          {visiblePosts.length === 0 ? (
            <EmptyState
              text={
                postFilter === 'all'
                  ? tr('No posts yet. Create the first water post.', 'لا توجد منشورات بعد. أنشئ أول منشور مياه.')
                  : postFilter === 'active'
                    ? tr('No active posts.', 'لا توجد منشورات نشطة.')
                    : tr('No closed posts.', 'لا توجد منشورات مغلقة.')
              }
            />
          ) : (
            <div className="space-y-2.5">
              {visiblePosts.map((p) => (
                <PostRow
                  key={p.id}
                  post={p}
                  busy={busyId === p.id}
                  onEdit={() => setEditing(p)}
                  onToggle={() =>
                    runAction(p.id, () => updatePost(p.id, toInput(p, { status: p.status === 'active' ? 'completed' : 'active' })))
                  }
                  onDelete={() => handleDelete(p)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'facilities' && (
        <div className="space-y-2.5">
          {facilities.length === 0 ? (
            <EmptyState text={tr('No facilities registered yet.', 'لا توجد منشآت مسجلة بعد.')} />
          ) : (
            facilities.map((f) => (
              <div key={f.id} className="glass-card rounded-2xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      {f.type === 'mosque' ? <Landmark className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-slate-800">{facilityName(f)}</div>
                      <div className="truncate text-xs text-slate-500">
                        {facilityTypeLabel(f.type)} · {placeName(f.governorate)} · {placeName(f.area ?? f.wilayat) || '—'}
                      </div>
                      {f.responsible_org && <div className="text-[10px] text-slate-400">{tr('Managed by:', 'تديرها:')} {f.responsible_org}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <VerificationBadge status={f.verification_status} />
                    {f.verification_status !== 'verified' ? (
                      <ActionButton
                        tone="green"
                        disabled={busyId === f.id}
                        onClick={() => runAction(f.id, () => setFacilityVerification(f.id, 'verified'))}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> {f.verification_status === 'rejected' ? tr('Re-approve', 'إعادة الاعتماد') : tr('Approve', 'اعتماد')}
                      </ActionButton>
                    ) : (
                      <ActionButton
                        tone="red"
                        disabled={busyId === f.id}
                        onClick={() => runAction(f.id, () => setFacilityVerification(f.id, 'rejected'))}
                      >
                        <XCircle className="h-3.5 w-3.5" /> {tr('Revoke', 'إلغاء التوثيق')}
                      </ActionButton>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-2.5">
          <p className="text-xs text-slate-500">{tr('Accounts are stored in this browser until the app has a server-side login.', 'تُحفظ الحسابات في هذا المتصفح إلى أن يتوفر تسجيل دخول عبر الخادم.')}</p>
          {users.map((u) => (
            <div key={u.id} className="glass-card rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-sm font-bold text-white">
                    {u.full_name?.charAt(0).toUpperCase() ?? 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">
                      {u.full_name || tr('Unknown', 'غير معروف')} {u.id === profile?.id && <span className="text-xs font-normal text-slate-400">({tr('you', 'أنت')})</span>}
                    </div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </div>
                </div>
                <select
                  value={u.role}
                  disabled={u.id === profile?.id}
                  title={u.id === profile?.id ? tr("You can't change your own role", 'لا يمكنك تغيير دورك') : undefined}
                  onChange={(e) => {
                    setUserRole(u.id, e.target.value as Profile['role']);
                    setUsers(listProfiles());
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 outline-none focus:border-teal-400 disabled:opacity-50"
                >
                  <option value="donor">{tr('Donor', 'متبرع')}</option>
                  <option value="organization">{tr('Organization', 'منظمة')}</option>
                  <option value="admin">{tr('Admin', 'مدير')}</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <PostFormModal
          facilities={verifiedFacilities}
          post={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setTab('posts');
            loadData();
          }}
        />
      )}
    </div>
  );
}

function PostRow({
  post,
  busy,
  onEdit,
  onToggle,
  onDelete,
}: {
  post: Project;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const cat = getCategoryInfo(post.category);
  const active = post.status === 'active';
  const percent = getProgressPercent(post);

  return (
    <div className={`glass-card rounded-2xl p-4 ${active ? '' : 'opacity-70'}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {post.image_url ? (
            <img src={post.image_url} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
          ) : (
            <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${cat.tint}`}>
              <cat.icon className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div dir="auto" className="truncate text-sm font-bold text-slate-800">{post.title}</div>
            <div className="truncate text-xs text-slate-500">{facilityName(post.facility) || '—'}</div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
              <span className={`rounded px-1.5 py-0.5 ${active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {statusLabel(post.status)}
              </span>
              <span className="flex items-center gap-0.5 rounded bg-teal-50 px-1.5 py-0.5 text-teal-700">
                <MapPin className="h-3 w-3" />
                {post.service_radius_km ? tr(`${post.service_radius_km} km radius`, `نطاق ${post.service_radius_km} كم`) : tr('All of Oman', 'كل عُمان')}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full sm:w-44">
          <div className="mb-1 flex justify-between text-[11px]">
            <span className="font-semibold text-slate-700">{formatOMR(post.collected_amount)}</span>
            <span className="text-slate-400">{tr(`of ${formatOMR(post.target_amount)}`, `من ${formatOMR(post.target_amount)}`)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-teal-500" style={{ width: `${percent}%` }} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <IconButton label={tr('Edit', 'تعديل')} onClick={onEdit} disabled={busy}>
            <Pencil className="h-4 w-4" />
          </IconButton>
          <IconButton label={active ? tr('Close post', 'إغلاق المنشور') : tr('Reopen post', 'إعادة فتح المنشور')} onClick={onToggle} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : active ? <Archive className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
          </IconButton>
          <IconButton label={tr('Delete', 'حذف')} onClick={onDelete} disabled={busy} danger>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 ${
        danger ? 'border-red-100 text-red-500 hover:bg-red-50' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

function ActionButton({
  tone,
  onClick,
  disabled,
  children,
}: {
  tone: 'green' | 'red';
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-40 ${
        tone === 'green' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Shield; label: string; value: number | string; color: string }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="truncate text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function VerificationBadge({ status }: { status: string }) {
  if (status === 'verified') {
    return <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600"><BadgeCheck className="h-3 w-3" /> {tr('VERIFIED', 'موثق')}</span>;
  }
  if (status === 'pending') {
    return <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600"><Clock className="h-3 w-3" /> {tr('PENDING', 'قيد المراجعة')}</span>;
  }
  return <span className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600"><XCircle className="h-3 w-3" /> {tr('REJECTED', 'مرفوض')}</span>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center rounded-2xl py-16 text-center">
      <TrendingUp className="mb-2 h-8 w-8 text-slate-300" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}
