import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Facility, Project, City, Donation } from '@/lib/auth-types';
import type { Category, WaterType } from '@/lib/types';
import { formatOMR, getProgressPercent, getRemainingAmount, facilityTypeLabel, needLevelColor } from '@/lib/utils';
import { CATEGORIES, getCategoryInfo } from '@/lib/constants';
import { useCities } from '@/lib/hooks';
import {
  Building2, Landmark, Droplets, Plus, X, TrendingUp, Heart, BadgeCheck,
  CheckCircle2, AlertCircle, Loader2, MapPin, Edit3, Trash2, FileText,
  Award, Calendar,
} from 'lucide-react';

type Tab = 'overview' | 'facilities' | 'projects' | 'donations' | 'impact';

export function OrganizationDashboard() {
  const { profile } = useAuth();
  const { cities } = useCities();
  const [tab, setTab] = useState<Tab>('overview');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [projects, setProjects] = useState<(Project & { facility?: Facility })[]>([]);
  const [donations, setDonations] = useState<(Donation & { project?: Project })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFacilityForm, setShowFacilityForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showImpactForm, setShowImpactForm] = useState(false);
  const [selectedProjectForImpact, setSelectedProjectForImpact] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!profile) return;
    setLoading(true);

    const { data: facData } = await supabase
      .from('facilities')
      .select('*')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false });
    setFacilities((facData ?? []) as Facility[]);

    const facIds = (facData ?? []).map((f: any) => f.id);
    if (facIds.length > 0) {
      const [{ data: projData }, { data: donData }] = await Promise.all([
        supabase.from('projects').select('*, facility:facilities(*)').in('facility_id', facIds).order('created_at', { ascending: false }),
        supabase.from('donations').select('*, project:projects(*)').in('project_id',
          (await supabase.from('projects').select('id').in('facility_id', facIds)).data?.map((p: any) => p.id) ?? []
        ).order('created_at', { ascending: false }).limit(50),
      ]);
      setProjects((projData ?? []) as (Project & { facility?: Facility })[]);
      setDonations((donData ?? []) as (Donation & { project?: Project })[]);
    } else {
      setProjects([]);
      setDonations([]);
    }

    setLoading(false);
  }, [profile]);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = {
    totalFacilities: facilities.length,
    verifiedFacilities: facilities.filter((f) => f.verification_status === 'verified').length,
    pendingFacilities: facilities.filter((f) => f.verification_status === 'pending').length,
    totalProjects: projects.length,
    activeProjects: projects.filter((p) => p.status === 'active').length,
    totalDonations: donations.length,
    totalRaised: donations.filter((d) => d.status === 'completed').reduce((sum, d) => sum + Number(d.amount), 0),
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        <p className="mt-3 text-sm text-slate-500">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md">
          <Building2 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">Organization Dashboard</h1>
          <p className="text-xs text-slate-500">{profile?.organization_name ?? profile?.full_name}</p>
        </div>
      </div>

      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        {([
          { key: 'overview' as const, label: 'Overview' },
          { key: 'facilities' as const, label: 'Facilities' },
          { key: 'projects' as const, label: 'Projects' },
          { key: 'donations' as const, label: 'Donations' },
          { key: 'impact' as const, label: 'Impact' },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard icon={Building2} label="My Facilities" value={stats.totalFacilities} color="from-sky-500 to-blue-600" />
          <StatCard icon={BadgeCheck} label="Verified" value={stats.verifiedFacilities} color="from-emerald-500 to-green-600" />
          <StatCard icon={Clock} label="Pending" value={stats.pendingFacilities} color="from-amber-500 to-orange-600" />
          <StatCard icon={TrendingUp} label="Active Projects" value={stats.activeProjects} color="from-teal-500 to-emerald-600" />
          <StatCard icon={Heart} label="Donations Received" value={stats.totalDonations} color="from-pink-500 to-rose-600" />
          <StatCard icon={Award} label="Total Raised" value={formatOMR(stats.totalRaised)} color="from-violet-500 to-indigo-600" />
        </div>
      )}

      {tab === 'facilities' && (
        <div>
          <div className="mb-3 flex justify-end">
            <button
              onClick={() => setShowFacilityForm(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg"
            >
              <Plus className="h-4 w-4" /> Add Facility
            </button>
          </div>
          <div className="space-y-2.5">
            {facilities.length === 0 ? (
              <EmptyState text="You haven't registered any facilities yet. Click 'Add Facility' to get started." />
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
                          {facilityTypeLabel(f.type)} · {f.governorate} · {f.area ?? '—'}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                          <MapPin className="h-2.5 w-2.5" /> {f.lat.toFixed(4)}, {f.lng.toFixed(4)}
                        </div>
                      </div>
                    </div>
                    <VerificationBadge status={f.verification_status} />
                  </div>
                  {f.verification_status === 'pending' && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Awaiting admin verification. You'll be able to add projects once verified.
                    </div>
                  )}
                  {f.verification_status === 'rejected' && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      This facility was rejected. Please contact admin for more information.
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          {showFacilityForm && (
            <FacilityForm
              cities={cities}
              onClose={() => setShowFacilityForm(false)}
              onSaved={() => { setShowFacilityForm(false); loadData(); }}
            />
          )}
        </div>
      )}

      {tab === 'projects' && (
        <div>
          <div className="mb-3 flex justify-end">
            <button
              onClick={() => setShowProjectForm(true)}
              disabled={stats.verifiedFacilities === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-40"
            >
              <Plus className="h-4 w-4" /> Add Project
            </button>
          </div>
          {stats.verifiedFacilities === 0 && (
            <div className="mb-3 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-600">
              <AlertCircle className="h-3.5 w-3.5" />
              You need at least one verified facility before you can create projects.
            </div>
          )}
          <div className="space-y-2.5">
            {projects.length === 0 ? (
              <EmptyState text="No projects yet. Create a project for one of your verified facilities." />
            ) : (
              projects.map((p) => {
                const cat = getCategoryInfo(p.category);
                return (
                  <div key={p.id} className="glass-card rounded-2xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${cat.gradient} text-white shadow-md`}>
                          <cat.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{p.title}</div>
                          <div className="text-xs text-slate-500">{p.facility?.name ?? '—'}</div>
                          <div className="mt-0.5 flex items-center gap-2 text-[10px]">
                            <span className={`rounded border px-1.5 py-0.5 font-semibold ${needLevelColor(p.need_level)}`}>{p.need_level.toUpperCase()}</span>
                            <span className={`rounded px-1.5 py-0.5 font-semibold ${p.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{p.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-teal-600">{formatOMR(p.collected_amount)}</div>
                        <div className="text-[10px] text-slate-400">of {formatOMR(p.target_amount)}</div>
                        <div className="mt-1 text-[10px] text-slate-500">{getProgressPercent(p)}% funded</div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => { setSelectedProjectForImpact(p.id); setShowImpactForm(true); }}
                        className="flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-600 transition-all hover:bg-teal-100"
                      >
                        <FileText className="h-3.5 w-3.5" /> Post Impact Update
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {showProjectForm && (
            <ProjectForm
              facilities={facilities.filter((f) => f.verification_status === 'verified')}
              onClose={() => setShowProjectForm(false)}
              onSaved={() => { setShowProjectForm(false); loadData(); }}
            />
          )}
          {showImpactForm && selectedProjectForImpact && (
            <ImpactForm
              projectId={selectedProjectForImpact}
              projectTitle={projects.find((p) => p.id === selectedProjectForImpact)?.title ?? ''}
              onClose={() => { setShowImpactForm(false); setSelectedProjectForImpact(null); }}
              onSaved={() => { setShowImpactForm(false); setSelectedProjectForImpact(null); loadData(); }}
            />
          )}
        </div>
      )}

      {tab === 'donations' && (
        <div className="space-y-2.5">
          {donations.length === 0 ? (
            <EmptyState text="No donations received yet for your projects." />
          ) : (
            donations.map((d) => (
              <DonationRow key={d.id} donation={d} onUpdated={loadData} />
            ))
          )}
        </div>
      )}

      {tab === 'impact' && (
        <ImpactTab facilities={facilities} projects={projects} onPostImpact={(pid) => { setSelectedProjectForImpact(pid); setShowImpactForm(true); }} />
      )}
    </div>
  );
}

// --- Facility Form ---
function FacilityForm({ cities, onClose, onSaved }: { cities: City[]; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [nameArabic, setNameArabic] = useState('');
  const [type, setType] = useState<'mosque' | 'hospital'>('mosque');
  const [cityId, setCityId] = useState('');
  const [area, setArea] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [responsibleOrg, setResponsibleOrg] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedCity = cities.find((c) => c.id === cityId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !cityId) { setError('Please fill in the facility name and city.'); return; }
    const finalLat = lat || (selectedCity?.lat ?? 23.588).toString();
    const finalLng = lng || (selectedCity?.lng ?? 58.3829).toString();

    setSaving(true);
    const { error: insertError } = await supabase.from('facilities').insert({
      name, name_arabic: nameArabic || null, type, city_id: cityId,
      governorate: selectedCity?.governorate ?? 'Muscat',
      wilayat: selectedCity?.wilayat ?? null, area: area || null, address: address || null,
      lat: parseFloat(finalLat), lng: parseFloat(finalLng),
      responsible_org: responsibleOrg || null, verification_status: 'pending',
    });
    setSaving(false);
    if (insertError) { setError('Could not create facility. Please try again.'); return; }
    onSaved();
  };

  return (
    <ModalShell onClose={onClose} title="Register a New Facility">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Grid2>
          <Field label="Facility name" value={name} onChange={setName} placeholder="e.g. Al-Salaam Mosque" required />
          <Field label="Arabic name (optional)" value={nameArabic} onChange={setNameArabic} placeholder="مسجد السلام" />
        </Grid2>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Facility type</label>
          <div className="grid grid-cols-2 gap-2">
            {(['mosque', 'hospital'] as const).map((t) => {
              const Icon = t === 'mosque' ? Landmark : Building2;
              return (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-all ${type === t ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-500'}`}>
                  <Icon className="h-4 w-4" /> {facilityTypeLabel(t)}
                </button>
              );
            })}
          </div>
        </div>
        <Grid2>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">City</label>
            <select value={cityId} onChange={(e) => setCityId(e.target.value)} required
              className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 px-3 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
              <option value="">Select city</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.governorate}</option>)}
            </select>
          </div>
          <Field label="Area" value={area} onChange={setArea} placeholder="e.g. Al-Saada" />
        </Grid2>
        <Field label="Address" value={address} onChange={setAddress} placeholder="Street address" />
        <Field label="Responsible organization" value={responsibleOrg} onChange={setResponsibleOrg} placeholder="e.g. Ministry of Awqaf" />
        <Grid2>
          <Field label="Latitude" value={lat} onChange={setLat} placeholder={selectedCity?.lat.toString() ?? '23.588'} />
          <Field label="Longitude" value={lng} onChange={setLng} placeholder={selectedCity?.lng.toString() ?? '58.383'} />
        </Grid2>
        <p className="text-[10px] text-slate-400">Coordinates default to the selected city center if left blank.</p>
        {error && <ErrorBox text={error} />}
        <SubmitButton saving={saving} label="Register Facility" />
        <p className="text-center text-[10px] text-slate-400">Your facility will be reviewed by an admin before it becomes available for donations.</p>
      </form>
    </ModalShell>
  );
}

// --- Project Form ---
function ProjectForm({ facilities, onClose, onSaved }: { facilities: Facility[]; onClose: () => void; onSaved: () => void }) {
  const [facilityId, setFacilityId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('water');
  const [needLevel, setNeedLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [urgency, setUrgency] = useState<'normal' | 'urgent' | 'critical'>('normal');
  const [targetAmount, setTargetAmount] = useState('');
  const [description, setDescription] = useState('');
  const [waterType, setWaterType] = useState<WaterType | ''>('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!facilityId || !title.trim() || !targetAmount) { setError('Please fill in all required fields.'); return; }

    setSaving(true);
    const { error: insertError } = await supabase.from('projects').insert({
      facility_id: facilityId, title, category, need_level: needLevel, urgency,
      target_amount: parseFloat(targetAmount), collected_amount: 0, currency: 'OMR',
      description: description || null, status: 'active', verified: true,
      water_type: category === 'water' && waterType ? waterType : null,
    });
    setSaving(false);
    if (insertError) { setError('Could not create project. Please try again.'); return; }
    onSaved();
  };

  return (
    <ModalShell onClose={onClose} title="Create a New Donation Project">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Facility</label>
          <select value={facilityId} onChange={(e) => setFacilityId(e.target.value)} required
            className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 px-3 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100">
            <option value="">Select facility</option>
            {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <Field label="Project title" value={title} onChange={setTitle} placeholder="e.g. Mosque Water Supply Support" required />
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Category</label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => (
              <button key={cat.key} type="button" onClick={() => setCategory(cat.key)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${category === cat.key ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                <cat.icon className="h-3 w-3" /> {cat.label}
              </button>
            ))}
          </div>
        </div>
        {category === 'water' && (
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Water type</label>
            <select value={waterType} onChange={(e) => setWaterType(e.target.value as WaterType | '')}
              className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 px-3 text-sm text-slate-700 outline-none focus:border-sky-400">
              <option value="">General water support</option>
              <option value="drinking">Drinking Water</option>
              <option value="dispenser">Water Dispensers</option>
              <option value="tank">Water Tanks</option>
              <option value="supply">Water Supply</option>
              <option value="filtration">Filtration System</option>
              <option value="maintenance">Water System Maintenance</option>
              <option value="project">Water Project</option>
            </select>
          </div>
        )}
        <Grid2>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Need level</label>
            <select value={needLevel} onChange={(e) => setNeedLevel(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 px-3 text-sm text-slate-700 outline-none focus:border-sky-400">
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Urgency</label>
            <select value={urgency} onChange={(e) => setUrgency(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 px-3 text-sm text-slate-700 outline-none focus:border-sky-400">
              <option value="normal">Normal</option><option value="urgent">Urgent</option><option value="critical">Critical</option>
            </select>
          </div>
        </Grid2>
        <Field label="Target amount (OMR)" value={targetAmount} onChange={setTargetAmount} placeholder="1000" type="number" required />
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe the project..."
            className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 px-3 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
        </div>
        {error && <ErrorBox text={error} />}
        <SubmitButton saving={saving} label="Create Project" />
      </form>
    </ModalShell>
  );
}

// --- Impact Form ---
function ImpactForm({ projectId, projectTitle, onClose, onSaved }: { projectId: string; projectTitle: string; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [amountUtilized, setAmountUtilized] = useState('');
  const [quantityDelivered, setQuantityDelivered] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Please enter a title.'); return; }

    setSaving(true);
    const { error: rpcError } = await supabase.rpc('create_impact_update', {
      p_project_id: projectId, p_title: title, p_description: description || null,
      p_completion_date: completionDate || null,
      p_amount_utilized: amountUtilized ? parseFloat(amountUtilized) : null,
      p_quantity_delivered: quantityDelivered || null, p_status: 'published',
    });
    setSaving(false);
    if (rpcError) { setError('Could not post impact update. Please try again.'); return; }
    onSaved();
  };

  return (
    <ModalShell onClose={onClose} title="Post Impact Update">
      <div className="mb-3 rounded-xl bg-teal-50/70 px-3 py-2 text-xs text-teal-700">
        Project: <span className="font-semibold">{projectTitle}</span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Update title" value={title} onChange={setTitle} placeholder="e.g. Water Supply Completed" required />
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Describe what was accomplished..."
            className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 px-3 text-sm text-slate-700 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
        </div>
        <Grid2>
          <Field label="Completion date" value={completionDate} onChange={setCompletionDate} type="date" />
          <Field label="Amount utilized (OMR)" value={amountUtilized} onChange={setAmountUtilized} type="number" placeholder="500" />
        </Grid2>
        <Field label="Quantity / service delivered" value={quantityDelivered} onChange={setQuantityDelivered} placeholder="e.g. 3000 liters of water" />
        {error && <ErrorBox text={error} />}
        <SubmitButton saving={saving} label="Publish Impact Update" />
      </form>
    </ModalShell>
  );
}

// --- Impact Tab ---
function ImpactTab({ facilities, projects, onPostImpact }: { facilities: Facility[]; projects: (Project & { facility?: Facility })[]; onPostImpact: (projectId: string) => void }) {
  const [impacts, setImpacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const projIds = projects.map((p) => p.id);
      if (projIds.length === 0) { setLoading(false); return; }
      const { data } = await supabase.from('impact_updates').select('*').in('project_id', projIds).order('created_at', { ascending: false });
      setImpacts(data ?? []);
      setLoading(false);
    })();
  }, [projects]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-sky-500" /></div>;

  return (
    <div>
      {projects.length === 0 ? (
        <EmptyState text="Create a project first, then post impact updates here." />
      ) : (
        <div className="space-y-2.5">
          {impacts.length === 0 ? (
            <EmptyState text="No impact updates posted yet. Select a project and post an update to keep your donors informed." />
          ) : (
            impacts.map((imp) => {
              const proj = projects.find((p) => p.id === imp.project_id);
              return (
                <div key={imp.id} className="glass-card rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-bold text-slate-800">{imp.title}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{proj?.title ?? 'Project'}</div>
                  {imp.description && <p className="mt-2 text-xs leading-relaxed text-slate-600">{imp.description}</p>}
                  <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-400">
                    {imp.completion_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(imp.completion_date).toLocaleDateString()}</span>}
                    {imp.amount_utilized != null && <span>Utilized: {formatOMR(imp.amount_utilized)}</span>}
                    {imp.quantity_delivered && <span>{imp.quantity_delivered}</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// --- Shared UI helpers ---
function ModalShell({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="glass-card max-h-[90vh] w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200/60 px-5 py-3">
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-600">{label}{required && <span className="text-red-400"> *</span>}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 px-3 text-sm text-slate-700 outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function ErrorBox({ text }: { text: string }) {
  return <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600"><AlertCircle className="h-4 w-4 shrink-0" />{text}</div>;
}

function SubmitButton({ saving, label }: { saving: boolean; label: string }) {
  return (
    <button type="submit" disabled={saving}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-50">
      {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : label}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: typeof Building2; label: string; value: number | string; color: string }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function VerificationBadge({ status }: { status: string }) {
  if (status === 'verified') return <span className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600"><BadgeCheck className="h-3 w-3" /> VERIFIED</span>;
  if (status === 'pending') return <span className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600"><Clock className="h-3 w-3" /> PENDING</span>;
  return <span className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-[10px] font-bold text-red-600"><X className="h-3 w-3" /> REJECTED</span>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center rounded-2xl py-16 text-center">
      <AlertCircle className="mb-2 h-8 w-8 text-slate-300" />
      <p className="max-w-xs text-sm text-slate-500">{text}</p>
    </div>
  );
}

function DonationRow({ donation, onUpdated }: { donation: Donation & { project?: Project }; onUpdated: () => void }) {
  const [updating, setUpdating] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState(donation.delivery_status ?? 'received');

  const handleStatus = async (nextStatus: Donation['delivery_status']) => {
    if (!donation.id) return;
    setUpdating(true);
    const { error } = await supabase
      .from('donations')
      .update({ delivery_status: nextStatus, delivery_updated_at: new Date().toISOString() })
      .eq('id', donation.id);
    setUpdating(false);
    if (!error) {
      setDeliveryStatus(nextStatus);
      onUpdated();
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-slate-800">{donation.project?.title ?? 'Donation'}</div>
          <div className="text-xs text-slate-500">{donation.donor_name ?? 'Anonymous donor'} · {new Date(donation.created_at).toLocaleDateString()}</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-teal-600">{formatOMR(donation.amount)}</div>
          <div className="text-[10px] text-slate-400">Receipt: {donation.receipt_number}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase text-slate-600">
          {donation.status}
        </span>
        <span className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase text-emerald-600">
          {deliveryStatus}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(['received', 'preparing', 'on_the_way', 'delivered'] as const).map((status) => (
          <button
            key={status}
            onClick={() => handleStatus(status)}
            disabled={updating}
            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase transition-all ${
              deliveryStatus === status
                ? 'bg-sky-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}

// Re-export Clock for VerificationBadge
import { Clock } from 'lucide-react';
