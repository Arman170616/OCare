import type { Facility } from '@/lib/types';
import { Building2, MapPin, CheckCircle2 } from 'lucide-react';

interface FacilitySelectorProps {
  facility: Facility;
  selected: boolean;
  onClick: () => void;
}

const facilityTypeIcon = (type: 'mosque' | 'hospital' | 'facility') => {
  return <Building2 className="w-6 h-6 text-teal-600" />;
};

const facilityTypeLabel = (type: 'mosque' | 'hospital' | 'facility') => {
  const labels: Record<typeof type, string> = {
    mosque: 'Mosque',
    hospital: 'Hospital',
    facility: 'Facility',
  };
  return labels[type] || type;
};

export function FacilitySelector({ facility, selected, onClick }: FacilitySelectorProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-lg border-2 transition-all text-left group ${
        selected
          ? 'border-teal-500 bg-teal-50'
          : 'border-gray-200 hover:border-teal-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg ${selected ? 'bg-teal-100' : 'bg-gray-100 group-hover:bg-teal-100'}`}>
          {facilityTypeIcon(facility.type)}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">{facility.name}</h4>
            {facility.verification_status === 'verified' && (
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
            )}
          </div>

          <p className="text-xs text-gray-600 mb-2">{facilityTypeLabel(facility.type)}</p>

          {facility.address && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              {facility.address}
            </div>
          )}

          {facility.area && (
            <p className="text-xs text-gray-500 mt-1">📍 {facility.area}</p>
          )}
        </div>

        {selected && (
          <div className="flex-shrink-0">
            <CheckCircle2 className="w-6 h-6 text-teal-600 animate-pulse" />
          </div>
        )}
      </div>
    </button>
  );
}
