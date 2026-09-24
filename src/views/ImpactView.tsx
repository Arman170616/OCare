import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import type { Donation, Project, Facility } from '@/lib/types';
import { useImpactStats } from '@/lib/hooks';
import { formatOMR } from '@/lib/utils';
import { getCategoryInfo, DELIVERY_STEPS, deliveryStepIndex, type DeliveryStatus } from '@/lib/constants';
import {
  Droplets,
  Landmark,
  Building2,
  Heart,
  Repeat,
  CheckCircle2,
  Receipt,
  TrendingUp,
  Award,
  Calendar,
  ChevronDown,
  ChevronUp,
  Truck,
  Package,
} from 'lucide-react';

export function ImpactView() {
  const { profile } = useAuth();
  const { stats } = useImpactStats();
  const [recentDonations, setRecentDonations] = useState<(Donation & { project?: Project & { facility?: Facility } })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      try {
        const data = await apiFetch<(Donation & { project?: Project & { facility?: Facility } })[]>(`/api/donations?user_id=${profile.id}`);
        setRecentDonations(data ?? []);
      } catch (error) {
        console.error('Error loading donations:', error);
        setRecentDonations([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [profile]);

  const totals = recentDonations.reduce(
    (acc, d) => {
      if (d.project) {
        const cat = d.project.category;
        if (!acc.byCategory[cat]) acc.byCategory[cat] = 0;
        acc.byCategory[cat] += 1;
        const facType = d.project.facility?.type;
        if (facType === 'mosque') acc.mosques += 1;
        else if (facType === 'hospital') acc.hospitals += 1;
        else acc.facilities += 1;
      }
      acc.total += d.amount;
      if (d.recurring) acc.sponsorships += 1;
      return acc;
    },
    {
      byCategory: {} as Record<string, number>,
      mosques: 0,
      hospitals: 0,
      facilities: 0,
      total: 0,
      sponsorships: 0,
    }
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">My Impact</h1>
        <p className="mt-1 text-sm text-slate-600">
          Your charitable contributions through OmanCare — every donation making a difference.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <ImpactStat
          icon={Heart}
          label="Donations"
          value={recentDonations.length.toString()}
          gradient="from-teal-500 to-emerald-600"
        />
        <ImpactStat
          icon={Droplets}
          label="Water Projects"
          value={(totals.byCategory['water'] ?? 0).toString()}
          gradient="from-sky-500 to-cyan-600"
        />
        <ImpactStat
          icon={Landmark}
          label="Mosques"
          value={totals.mosques.toString()}
          gradient="from-teal-400 to-emerald-500"
        />
        <ImpactStat
          icon={Building2}
          label="Hospitals"
          value={totals.hospitals.toString()}
          gradient="from-rose-400 to-pink-500"
        />
        <ImpactStat
          icon={Repeat}
          label="Sponsorships"
          value={totals.sponsorships.toString()}
          gradient="from-amber-500 to-orange-600"
        />
        <ImpactStat
          icon={TrendingUp}
          label="Total Given"
          value={formatOMR(totals.total)}
          gradient="from-violet-500 to-indigo-600"
        />
      </div>

      <div className="glass-card mb-6 rounded-2xl p-5">
        <h2 className="mb-4 text-base font-bold text-slate-800">Platform Impact Summary</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryStat label="Total Donations" value={stats.totalDonations.toString()} icon={Heart} />
          <SummaryStat label="Total Raised" value={formatOMR(stats.totalRaised)} icon={TrendingUp} />
          <SummaryStat label="Active Projects" value={stats.activeProjects.toString()} icon={Award} />
          <SummaryStat label="Completed" value={stats.completedProjects.toString()} icon={CheckCircle2} />
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">Recent Donations</h2>
        {recentDonations.length > 0 && (
          <span className="text-xs text-slate-500">{recentDonations.length} records</span>
        )}
      </div>

      {loading ? (
        <div className="glass-card flex items-center justify-center rounded-2xl py-16">
          <p className="text-sm text-slate-500">Loading donations...</p>
        </div>
      ) : recentDonations.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center rounded-2xl py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
            <Heart className="h-7 w-7 text-teal-400" />
          </div>
          <h3 className="text-base font-bold text-slate-700">No donations yet</h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Your donations will appear here once you contribute to a project. Start by exploring
            nearby needs!
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {recentDonations.map((donation) => {
            const cat = donation.project
              ? getCategoryInfo(donation.project.category)
              : null;
            const CatIcon = cat?.icon ?? Heart;
            const deliveryStatus = (donation.delivery_status ?? 'received') as DeliveryStatus;
            const currentStepIdx = deliveryStepIndex(deliveryStatus);
            return (
              <DonationCard
                key={donation.id}
                donation={donation}
                cat={cat}
                CatIcon={CatIcon}
                deliveryStatus={deliveryStatus}
                currentStepIdx={currentStepIdx}
              />
            );
          })}
        </div>
      )}

      <div className="mt-6 glass-card rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <h2 className="text-base font-bold text-slate-800">Transparency & Trust</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Every donation through OmanCare is connected to a verified project at an approved
          mosque, hospital, or community facility. The platform follows a strict verification
          process — from organization verification to administrative approval — before any
          project is available for public donations.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {['Organization Verified', 'Location Verified', 'Project Approved', 'Impact Tracked'].map(
            (tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
              >
                <CheckCircle2 className="h-3 w-3" />
                {tag}
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function DonationCard({
  donation,
  cat,
  CatIcon,
  deliveryStatus,
  currentStepIdx,
}: {
  donation: Donation & { project?: Project & { facility?: Facility } };
  cat: ReturnType<typeof getCategoryInfo> | null;
  CatIcon: React.ComponentType<{ className?: string }>;
  deliveryStatus: DeliveryStatus;
  currentStepIdx: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${
            cat?.gradient ?? 'from-slate-400 to-slate-500'
          } text-white shadow-md`}
        >
          <CatIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-slate-800">
            {donation.project?.title ?? 'Project'}
          </div>
          <div className="truncate text-xs text-slate-500">
            {donation.project?.facility?.name ?? 'Facility'}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-0.5">
              <Calendar className="h-3 w-3" />
              {new Date(donation.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-0.5">
              <Receipt className="h-3 w-3" />
              {donation.receipt_number}
            </span>
            {donation.recurring && (
              <span className="flex items-center gap-0.5 text-amber-600">
                <Repeat className="h-3 w-3" />
                {donation.frequency}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-bold text-teal-600">
            {formatOMR(donation.amount)}
          </div>
          <DeliveryBadge status={deliveryStatus} />
        </div>
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100"
      >
        <span>Track Donation</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <DeliveryTimeline currentStepIdx={currentStepIdx} updatedAt={donation.delivery_updated_at} />
      )}
    </div>
  );
}

function DeliveryBadge({ status }: { status: DeliveryStatus }) {
  const styles: Record<DeliveryStatus, string> = {
    received: 'bg-sky-50 text-sky-600',
    preparing: 'bg-amber-50 text-amber-600',
    on_the_way: 'bg-violet-50 text-violet-600',
    delivered: 'bg-emerald-50 text-emerald-600',
  };
  const label = DELIVERY_STEPS.find((s) => s.key === status)?.label ?? 'Received';
  return (
    <span className={`mt-0.5 inline-block rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${styles[status]}`}>
      {label}
    </span>
  );
}

function DeliveryTimeline({ currentStepIdx, updatedAt }: { currentStepIdx: number; updatedAt?: string }) {
  return (
    <div className="mt-3 space-y-0">
      {DELIVERY_STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i <= currentStepIdx;
        const active = i === currentStepIdx;
        return (
          <div key={step.key} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                  done
                    ? active
                      ? 'bg-teal-500 text-white shadow-md ring-4 ring-teal-100'
                      : 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              {i < DELIVERY_STEPS.length - 1 && (
                <div className={`my-0.5 h-5 w-0.5 ${i < currentStepIdx ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </div>
            <div className="pt-1">
              <span
                className={`text-xs ${done ? 'font-semibold text-slate-700' : 'text-slate-400'}`}
              >
                {step.label}
              </span>
              {active && updatedAt && (
                <span className="ml-2 text-[9px] text-slate-400">
                  {new Date(updatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ImpactStat({
  icon: Icon,
  label,
  value,
  gradient,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  gradient: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-lg font-bold text-slate-800">{value}</div>
      <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 text-center">
      <Icon className="mx-auto mb-1 h-4 w-4 text-slate-400" />
      <div className="text-sm font-bold text-slate-800">{value}</div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}
