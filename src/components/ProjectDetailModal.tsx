import { useState } from 'react';
import type { ProjectWithDistance, Donation, ImpactUpdate } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { getCategoryInfo } from '@/lib/constants';
import {
  formatOMR,
  getProgressPercent,
  getRemainingAmount,
  needLevelColor,
  urgencyColor,
  facilityTypeLabel,
  waterTypeLabel,
  needLevelLabel,
  urgencyLabel,
  facilityName,
  placeName,
} from '@/lib/utils';
import { tr, locale } from '@/lib/i18n';
import { ProgressBar } from './ProgressBar';
import {
  X,
  MapPin,
  BadgeCheck,
  Building,
  Calendar,
  Users,
  Droplets,
  CheckCircle2,
  ArrowRight,
  Heart,
  FileText,
  Clock,
  Package,
  Truck,
} from 'lucide-react';

interface ProjectDetailModalProps {
  project: ProjectWithDistance | null;
  onClose: () => void;
  onDonate: (project: ProjectWithDistance) => void;
}

export function ProjectDetailModal({ project, onClose, onDonate }: ProjectDetailModalProps) {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [impacts, setImpacts] = useState<ImpactUpdate[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'donations' | 'impact'>('details');
  const [loading, setLoading] = useState(false);

  if (!project) return null;

  const cat = getCategoryInfo(project.category);
  const facility = project.facility;
  const remaining = getRemainingAmount(project);
  const percent = getProgressPercent(project);

  const loadExtra = async () => {
    if (!project || loading) return;
    setLoading(true);
    try {
      const [donData, impData] = await Promise.all([
        apiFetch<Donation[]>(`/api/projects/${project.id}/donations`),
        apiFetch<ImpactUpdate[]>(`/api/projects/${project.id}/impact`),
      ]);
      setDonations(donData ?? []);
      setImpacts(impData ?? []);
    } catch (error) {
      console.error('Unable to load project details:', error);
      setDonations([]);
      setImpacts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    if ((tab === 'donations' || tab === 'impact') && donations.length === 0 && impacts.length === 0) {
      loadExtra();
    }
  };

  const trackingSteps = [
    { label: tr('Donation Received', 'تم استلام التبرع'), icon: Heart, done: project.collected_amount > 0 },
    { label: tr('Preparing', 'قيد التجهيز'), icon: Package, done: donations.some((d) => d.delivery_status === 'preparing' || d.delivery_status === 'on_the_way' || d.delivery_status === 'delivered') },
    { label: tr('On the Way', 'في الطريق'), icon: Truck, done: donations.some((d) => d.delivery_status === 'on_the_way' || d.delivery_status === 'delivered') },
    { label: tr('Delivered', 'تم التسليم'), icon: CheckCircle2, done: donations.some((d) => d.delivery_status === 'delivered') || project.status === 'completed' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="glass-card flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0">
          {project.image_url ? (
            <img src={project.image_url} alt="" className="h-44 w-full object-cover" />
          ) : (
            <div className={`h-28 ${cat.tint}`}>
              <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <cat.icon className="h-20 w-20" />
              </div>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute end-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-600 transition-colors hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="absolute -bottom-6 start-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${cat.tint}`}>
              <cat.icon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-8">
          <h2 className="text-lg font-bold text-slate-800"><bdi>{project.title}</bdi></h2>
          {facility && (
            <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <Building className="h-3.5 w-3.5" />
              {facilityName(facility)}
              <span>·</span>
              <span>{facilityTypeLabel(facility.type)}</span>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className={`rounded-lg border px-2 py-0.5 font-semibold ${needLevelColor(project.need_level)}`}>
              {tr(`${needLevelLabel(project.need_level)} need`, `احتياج ${needLevelLabel(project.need_level)}`)}
            </span>
            <span className={`rounded-lg px-2 py-0.5 font-semibold ${urgencyColor(project.urgency)}`}>
              {urgencyLabel(project.urgency)}
            </span>
            <span className="rounded-lg bg-teal-50 px-2 py-0.5 font-semibold text-teal-700">
              {project.service_radius_km != null
                ? tr(`Serves ${project.service_radius_km} km around`, `يخدم نطاق ${project.service_radius_km} كم`)
                : tr('All of Oman', 'كل عُمان')}
            </span>
            {project.verified && (
              <span className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-600">
                <BadgeCheck className="h-3 w-3" /> {tr('Verified', 'موثق')}
              </span>
            )}
            {project.water_type && (
              <span className="rounded-lg bg-sky-50 px-2 py-0.5 font-medium text-sky-700">
                {waterTypeLabel(project.water_type)}
              </span>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 p-3 text-center">
              <div className="text-xs text-slate-500">{tr('Target', 'الهدف')}</div>
              <div className="text-sm font-bold text-slate-800">{formatOMR(project.target_amount)}</div>
            </div>
            <div className="rounded-xl bg-teal-50 p-3 text-center">
              <div className="text-xs text-teal-600">{tr('Collected', 'المُجمَّع')}</div>
              <div className="text-sm font-bold text-teal-700">{formatOMR(project.collected_amount)}</div>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-center">
              <div className="text-xs text-amber-600">{tr('Remaining', 'المتبقي')}</div>
              <div className="text-sm font-bold text-amber-700">{formatOMR(remaining)}</div>
            </div>
          </div>

          <div className="mt-4">
            <ProgressBar project={project} />
          </div>

          {project.description && (
            <div className="mt-5">
              <h3 className="mb-1.5 text-sm font-bold text-slate-700">{tr('What is this project about?', 'عن هذا المشروع')}</h3>
              <p className="text-sm leading-relaxed text-slate-600"><bdi>{project.description}</bdi></p>
            </div>
          )}

          {facility && (
            <div className="mt-5 rounded-xl border border-slate-200/70 bg-white p-4">
              <h3 className="mb-2 text-sm font-bold text-slate-700">{tr('Facility Information', 'معلومات المنشأة')}</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <InfoRow icon={Building} label={tr('Facility', 'المنشأة')} value={facility.name} />
                {facility.name_arabic && (
                  <InfoRow icon={Building} label={tr('Arabic Name', 'الاسم العربي')} value={facility.name_arabic} />
                )}
                <InfoRow icon={MapPin} label={tr('Governorate', 'المحافظة')} value={placeName(facility.governorate)} />
                <InfoRow icon={MapPin} label={tr('Wilayat', 'الولاية')} value={placeName(facility.wilayat) || '—'} />
                {facility.area && <InfoRow icon={MapPin} label={tr('Area', 'المنطقة')} value={placeName(facility.area)} />}
                {facility.responsible_org && (
                  <InfoRow icon={Users} label={tr('Responsible', 'الجهة المسؤولة')} value={facility.responsible_org} />
                )}
                {facility.verification_date && (
                  <InfoRow
                    icon={Calendar}
                    label={tr('Verified On', 'تاريخ التوثيق')}
                    value={new Date(facility.verification_date).toLocaleDateString(locale())}
                  />
                )}
              </div>
            </div>
          )}

          <div className="mt-5">
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {(['details', 'donations', 'impact'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold capitalize transition-all ${
                    activeTab === tab
                      ? 'bg-white text-teal-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'details' ? tr('Details', 'التفاصيل') : tab === 'donations' ? tr('Donations', 'التبرعات') : tr('Impact', 'الأثر')}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {activeTab === 'details' && (
                <div>
                  <h3 className="mb-3 text-sm font-bold text-slate-700">{tr('Donation Tracking', 'تتبع التبرع')}</h3>
                  <div className="space-y-2">
                    {trackingSteps.map((step, i) => {
                      const Icon = step.icon;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              step.done
                                ? 'bg-emerald-100 text-emerald-600'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <span
                            className={`text-sm ${step.done ? 'font-medium text-slate-700' : 'text-slate-400'}`}
                          >
                            {step.label}
                          </span>
                          {step.done && i < trackingSteps.length - 1 && (
                            <ArrowRight className="ms-auto h-3 w-3 text-emerald-400 rtl:-scale-x-100" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'donations' && (
                <div>
                  <h3 className="mb-3 text-sm font-bold text-slate-700">
                    {tr(`Recent Donations (${donations.length})`, `أحدث التبرعات (${donations.length})`)}
                  </h3>
                  {donations.length === 0 && !loading ? (
                    <EmptyState text={tr('Be the first to donate to this project!', 'كن أول من يتبرع لهذا المشروع!')} />
                  ) : (
                    <div className="space-y-2">
                      {donations.map((don) => (
                        <div
                          key={don.id}
                          className="glass-card flex items-center justify-between rounded-xl px-3 py-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100">
                              <Heart className="h-4 w-4 text-teal-600" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-slate-700">
                                {don.donor_name || tr('Anonymous', 'فاعل خير')}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(don.created_at).toLocaleDateString(locale())} · #{don.receipt_number}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm font-bold text-teal-600">
                            {formatOMR(don.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'impact' && (
                <div>
                  <h3 className="mb-3 text-sm font-bold text-slate-700">{tr('Impact Updates', 'تحديثات الأثر')}</h3>
                  {impacts.length === 0 && !loading ? (
                    <EmptyState text={tr('Impact updates will appear here once the project is completed.', 'ستظهر تحديثات الأثر هنا بعد اكتمال المشروع.')} />
                  ) : (
                    <div className="space-y-3">
                      {impacts.map((imp) => (
                        <div key={imp.id} className="glass-card rounded-xl p-4">
                          <div className="mb-1 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <h4 className="text-sm font-bold text-slate-800"><bdi>{imp.title}</bdi></h4>
                          </div>
                          {imp.description && (
                            <p className="mb-2 text-xs leading-relaxed text-slate-600"><bdi>{imp.description}</bdi></p>
                          )}
                          <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
                            {imp.completion_date && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(imp.completion_date).toLocaleDateString(locale())}
                              </span>
                            )}
                            {imp.amount_utilized != null && (
                              <span>{tr(`Utilized: ${formatOMR(imp.amount_utilized)}`, `المُستخدم: ${formatOMR(imp.amount_utilized)}`)}</span>
                            )}
                            {imp.quantity_delivered && <span>{imp.quantity_delivered}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-200/60 bg-white px-6 py-3">
          <button
            onClick={() => onDonate(project)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3.5 font-semibold text-white transition-all active:scale-[0.98]"
          >
            <Droplets className="h-5 w-5" />
            {tr(
              `Donate ${formatOMR(remaining > 0 ? Math.min(remaining, 10) : 10)} to this project`,
              `تبرّع بمبلغ ${formatOMR(remaining > 0 ? Math.min(remaining, 10) : 10)} لهذا المشروع`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
      <div>
        <div className="text-[10px] text-slate-400">{label}</div>
        <div className="text-xs font-medium text-slate-700">{value}</div>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50 py-8 text-center">
      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-200">
        <FileText className="h-5 w-5 text-slate-400" />
      </div>
      <p className="max-w-[200px] text-xs text-slate-500">{text}</p>
    </div>
  );
}
