import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import type { Donation } from '@/lib/types';
import { Package, Truck, MapPin, CheckCircle2, Calendar, MoreVertical } from 'lucide-react';

const statusConfig = {
  received: { label: 'Donation Received', color: 'text-teal-600', bgColor: 'bg-teal-50', icon: CheckCircle2 },
  preparing: { label: 'Preparing', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: Package },
  on_the_way: { label: 'On The Way', color: 'text-amber-600', bgColor: 'bg-amber-50', icon: Truck },
  delivered: { label: 'Delivered', color: 'text-green-600', bgColor: 'bg-green-50', icon: MapPin },
};

export function DonationHistoryView() {
  const { profile } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDonation, setSelectedDonation] = useState<string | null>(null);

  useEffect(() => {
    const loadDonations = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<Donation[]>('/api/donations');
        if (data) {
          setDonations(data);
        }
      } catch (err) {
        console.error('Failed to load donations:', err);
        setError('Failed to load your donations');
      } finally {
        setLoading(false);
      }
    };

    loadDonations();
  }, [profile?.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading your donations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Your Donations</h1>
        <p className="text-gray-600 mt-2">Track all your donations and their delivery status</p>
      </div>

      {donations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No donations yet. Start making an impact!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {donations.map((donation) => {
            const statusInfo = statusConfig[donation.delivery_status as keyof typeof statusConfig] || statusConfig.received;
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={donation.id}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
                          <StatusIcon className={`w-5 h-5 ${statusInfo.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {donation.project?.facility?.name || 'Unknown Facility'}
                          </h3>
                          <p className="text-sm text-gray-600">{statusInfo.label}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Amount</p>
                          <p className="text-lg font-bold text-gray-900">{donation.amount.toFixed(3)} {donation.currency}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Receipt</p>
                          <p className="text-sm font-mono text-gray-900">{donation.receipt_number}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Donor</p>
                          <p className="text-sm text-gray-900">{donation.donor_name || 'Anonymous'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                          <p className="text-sm text-gray-900 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(donation.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedDonation(selectedDonation === donation.id ? null : donation.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {selectedDonation === donation.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Facility Address</p>
                          <p className="text-sm text-gray-900">{donation.project?.facility?.address || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Facility Type</p>
                          <p className="text-sm text-gray-900 capitalize">
                            {donation.project?.facility?.type || 'Unknown'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Last Updated</p>
                          <p className="text-sm text-gray-900">
                            {new Date(donation.delivery_updated_at).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status History</p>
                          <div className="flex flex-wrap gap-2">
                            {['received', 'preparing', 'on_the_way', 'delivered'].map((status) => (
                              <span
                                key={status}
                                className={`text-xs px-2 py-1 rounded-full ${
                                  donation.delivery_status === status
                                    ? statusConfig[status as keyof typeof statusConfig].bgColor + ' ' + statusConfig[status as keyof typeof statusConfig].color
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                              >
                                {statusConfig[status as keyof typeof statusConfig].label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
