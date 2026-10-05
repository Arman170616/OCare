import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import type { Donation } from '@/lib/types';
import { Package, Truck, MapPin, CheckCircle2, Loader } from 'lucide-react';
import { tr, locale } from '@/lib/i18n';
import { formatOMR, facilityName } from '@/lib/utils';

interface DonationTrackerProps {
  donationId: string;
}

const statusSteps = [
  { key: 'received', get label() { return tr('Donation Received', 'تم استلام التبرع'); }, icon: CheckCircle2, color: 'text-teal-600' },
  { key: 'preparing', get label() { return tr('Preparing', 'قيد التجهيز'); }, icon: Package, color: 'text-blue-600' },
  { key: 'on_the_way', get label() { return tr('On the Way', 'في الطريق'); }, icon: Truck, color: 'text-amber-600' },
  { key: 'delivered', get label() { return tr('Delivered', 'تم التسليم'); }, icon: MapPin, color: 'text-green-600' },
];

export function DonationTracker({ donationId }: DonationTrackerProps) {
  const [donation, setDonation] = useState<Donation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDonation = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<Donation>(`/api/donations/${donationId}`);
        if (data) {
          setDonation(data);
        }
      } catch (err) {
        console.error('Failed to load donation:', err);
        setError(tr('Failed to load tracking information', 'تعذر تحميل معلومات التتبع'));
      } finally {
        setLoading(false);
      }
    };

    loadDonation();
    const interval = setInterval(loadDonation, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [donationId]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <Loader className="w-8 h-8 text-teal-600 mx-auto animate-spin" />
        <p className="text-gray-600 mt-2">{tr('Loading tracking information...', 'جارٍ تحميل معلومات التتبع...')}</p>
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
        {error || tr('Could not load tracking information', 'تعذر تحميل معلومات التتبع')}
      </div>
    );
  }

  const currentStatusIndex = statusSteps.findIndex((s) => s.key === donation.delivery_status);

  return (
    <div className="space-y-6">
      {/* Status Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute start-6 top-12 bottom-0 w-1 bg-gray-200" />

        {/* Status Steps */}
        <div className="space-y-6">
          {statusSteps.map((step, index) => {
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = index === currentStatusIndex;
            const Icon = step.icon;

            return (
              <div key={step.key} className="relative flex gap-4">
                {/* Status Circle */}
                <div
                  className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 border-4 ${
                    isCompleted
                      ? 'bg-teal-600 border-teal-200'
                      : 'bg-white border-gray-200'
                  } ${isCurrent ? 'animate-pulse' : ''}`}
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isCompleted ? 'text-white' : 'text-gray-400'
                    }`}
                  />
                </div>

                {/* Status Info */}
                <div className="flex-1 pt-2">
                  <h4 className={`font-semibold ${
                    isCompleted ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </h4>
                  {isCurrent && (
                    <p className="text-sm text-teal-600 mt-1">{tr('Currently at this stage', 'المرحلة الحالية')}</p>
                  )}
                  {isCompleted && index < currentStatusIndex && (
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(donation.delivery_updated_at).toLocaleDateString(locale())}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Donation Details */}
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{tr('Donation Amount', 'مبلغ التبرع')}</span>
          <span className="font-semibold text-gray-900">{formatOMR(donation.amount)}</span>
        </div>
        {donation.project && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">{tr('Facility', 'المنشأة')}</span>
            <span className="font-semibold text-gray-900">{facilityName(donation.project.facility) || '—'}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">{tr('Receipt #', 'رقم الإيصال')}</span>
          <span className="font-mono text-sm text-gray-900">{donation.receipt_number}</span>
        </div>
      </div>

      {/* Help Text */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        <p className="font-semibold mb-1">{tr('Track Your Donation', 'تتبّع تبرعك')}</p>
        <p>
          {tr(
            "Your donation status updates automatically. The water will be delivered to the facility and we'll update you every step of the way.",
            'تُحدَّث حالة تبرعك تلقائيًا. سيتم توصيل المياه إلى المنشأة وسنُطلعك على كل مرحلة.'
          )}
        </p>
      </div>
    </div>
  );
}
