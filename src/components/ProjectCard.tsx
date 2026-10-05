import type { ProjectWithDistance } from '@/lib/types';
import { ProgressBar } from './ProgressBar';
import {
  formatOMR,
  getRemainingAmount,
  needLevelColor,
  urgencyColor,
  facilityTypeLabel,
  waterTypeLabel,
  needLevelLabel,
  urgencyLabel,
  facilityName,
  placeName,
  formatKm,
} from '@/lib/utils';
import { tr } from '@/lib/i18n';
import { getCategoryInfo } from '@/lib/constants';
import { MapPin, BadgeCheck, Droplets, Building2, Landmark, Radar } from 'lucide-react';

interface ProjectCardProps {
  project: ProjectWithDistance;
  onDonate: (project: ProjectWithDistance) => void;
  onViewDetails: (project: ProjectWithDistance) => void;
}

export function ProjectCard({ project, onDonate, onViewDetails }: ProjectCardProps) {
  const cat = getCategoryInfo(project.category);
  const remaining = getRemainingAmount(project);
  const facility = project.facility;

  const facilityIcon =
    facility?.type === 'mosque'
      ? Landmark
      : facility?.type === 'hospital'
        ? Building2
        : Droplets;

  const FacilityIcon = facilityIcon;

  return (
    <div className="glass-card group flex flex-col rounded-2xl p-5 transition-all">
      {project.image_url && (
        <img src={project.image_url} alt="" className="mb-4 h-36 w-full rounded-xl object-cover" />
      )}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cat.tint}`}
          >
            <cat.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 dir="auto" className="truncate text-start text-sm font-bold text-slate-800">
              {project.title}
            </h3>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <FacilityIcon className="h-3.5 w-3.5" />
              <span className="truncate">{facilityName(facility)}</span>
            </div>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${needLevelColor(project.need_level)}`}
        >
          {needLevelLabel(project.need_level)}
        </span>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        {facility && (
          <span className="flex items-center gap-1 text-slate-600">
            <MapPin className="h-3.5 w-3.5 text-teal-600" />
            {placeName(facility.area ?? facility.wilayat ?? facility.governorate)}
            <span className="font-semibold text-slate-700">
              · {formatKm(project.distance)}
            </span>
          </span>
        )}
        <span
          className={`rounded-md px-1.5 py-0.5 font-semibold ${urgencyColor(project.urgency)}`}
        >
          {urgencyLabel(project.urgency)}
        </span>
        {project.water_type && (
          <span className="rounded-md bg-sky-50 px-1.5 py-0.5 font-medium text-sky-700">
            {waterTypeLabel(project.water_type)}
          </span>
        )}
        {project.service_radius_km != null && (
          <span className="flex items-center gap-1 rounded-md bg-teal-50 px-1.5 py-0.5 font-medium text-teal-700">
            <Radar className="h-3 w-3" />
            {tr(`Serves ${project.service_radius_km} km`, `يخدم ${project.service_radius_km} كم`)}
          </span>
        )}
      </div>

      {project.description && (
        <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-slate-600">
          <bdi>{project.description}</bdi>
        </p>
      )}

      <div className="mb-4 mt-auto">
        <ProgressBar project={project} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-slate-500">
          {tr('Needed:', 'المطلوب:')} <span className="font-semibold text-slate-700">{formatOMR(remaining)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewDetails(project)}
            className="rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            {tr('Details', 'التفاصيل')}
          </button>
          <button
            onClick={() => onDonate(project)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition-all active:scale-95"
          >
            <BadgeCheck className="h-3.5 w-3.5" />
            {tr('Donate', 'تبرّع')}
          </button>
        </div>
      </div>

      {facility?.verification_status === 'verified' && (
        <div className="mt-3 flex items-center gap-1 border-t border-slate-200/60 pt-2 text-[10px] text-emerald-600">
          <BadgeCheck className="h-3 w-3" />
          {tr(`Verified ${facilityTypeLabel(facility.type)}`, `${facilityTypeLabel(facility.type)} موثق`)}
        </div>
      )}
    </div>
  );
}
