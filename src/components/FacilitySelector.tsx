import type { Facility } from '@/lib/types';
import { facilityTypeLabel } from '@/lib/utils';
import { Building2, Landmark, MapPin, BadgeCheck, ChevronRight } from 'lucide-react';

interface FacilitySelectorProps {
  facility: Facility;
  selected: boolean;
  onClick: () => void;
}

export function FacilitySelector({ facility, selected, onClick }: FacilitySelectorProps) {
  const Icon = facility.type === 'mosque' ? Landmark : Building2;
  const tint = facility.type === 'hospital' ? 'bg-rose-50 text-rose-600' : 'bg-teal-50 text-teal-600';

  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
        selected ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
      }`}
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-slate-800">{facility.name}</span>
          {facility.verification_status === 'verified' && (
            <BadgeCheck className="h-4 w-4 shrink-0 text-teal-600" />
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
          <MapPin className="h-3 w-3 shrink-0" />
          {facilityTypeLabel(facility.type)}
          {(facility.area || facility.address) && ` · ${facility.area ?? facility.address}`}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-500" />
    </button>
  );
}
