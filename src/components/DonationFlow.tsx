import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import type { City, Facility } from '@/lib/types';
import { formatOMR } from '@/lib/utils';
import { X, ChevronRight, ChevronLeft, CheckCircle2, MapPin, Building2, Heart, Droplet } from 'lucide-react';
import { FacilitySelector } from './FacilitySelector';
import { DonationTracker } from './DonationTracker';

interface DonationFlowProps {
  onClose: () => void;
  onComplete: () => void;
}

type Step = 'type' | 'location' | 'facility' | 'amount' | 'tracking';

interface DonationState {
  type: 'water' | null;
  city: City | null;
  facility: Facility | null;
  amount: number;
  donorName: string;
  donorEmail: string;
  donationId: string;
  receiptNumber: string;
}

export function DonationFlow({ onClose, onComplete }: DonationFlowProps) {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('type');
  const [cities, setCities] = useState<City[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [donation, setDonation] = useState<DonationState>({
    type: null,
    city: null,
    facility: null,
    amount: 100,
    donorName: profile?.full_name ?? '',
    donorEmail: profile?.email ?? '',
    donationId: '',
    receiptNumber: '',
  });

  // Load cities on mount
  useEffect(() => {
    const loadCities = async () => {
      try {
        setLoading(true);
        const data = await apiFetch<City[]>('/api/cities');
        setCities(data || []);
      } catch (err) {
        setError('Failed to load cities');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCities();
  }, []);

  // Load facilities when city is selected
  useEffect(() => {
    if (donation.city) {
      const loadFacilities = async () => {
        try {
          setLoading(true);
          const data = await apiFetch<Facility[]>(
            `/api/facilities?city_id=${donation.city?.id}&types=mosque,hospital`
          );
          setFacilities(data || []);
        } catch (err) {
          setError('Failed to load facilities');
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      loadFacilities();
    }
  }, [donation.city]);

  const handleSelectType = (type: 'water') => {
    setDonation((prev) => ({ ...prev, type }));
    setCurrentStep('location');
  };

  const handleSelectCity = (city: City) => {
    setDonation((prev) => ({ ...prev, city, facility: null }));
    setCurrentStep('facility');
  };

  const handleSelectFacility = (facility: Facility) => {
    setDonation((prev) => ({ ...prev, facility }));
    setCurrentStep('amount');
  };

  const handleSubmitDonation = async () => {
    if (!donation.facility || !donation.amount) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await apiFetch<{ id: string; receipt_number: string }>('/api/donations', {
        method: 'POST',
        body: JSON.stringify({
          facility_id: donation.facility.id,
          user_id: profile?.id || 'donor-demo',
          donor_name: donation.donorName || profile?.full_name || 'Anonymous Donor',
          donor_email: donation.donorEmail || profile?.email || 'anonymous@omancare.local',
          amount: parseFloat(customAmount || donation.amount.toString()),
          currency: 'OMR',
          recurring: false,
          frequency: 'one-time',
          donation_type: 'water',
        }),
      });

      if (response?.id && response?.receipt_number) {
        setDonation((prev) => ({
          ...prev,
          donationId: response.id,
          receiptNumber: response.receipt_number,
        }));
        setCurrentStep('tracking');
      } else {
        throw new Error('Invalid donation response');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process donation';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    switch (currentStep) {
      case 'location':
        setCurrentStep('type');
        break;
      case 'facility':
        setCurrentStep('location');
        break;
      case 'amount':
        setCurrentStep('facility');
        break;
      case 'tracking':
        break; // No going back from tracking
      default:
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-teal-50 to-teal-100 px-6 py-4 border-b border-teal-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Water Donation</h2>
            <p className="text-sm text-gray-600 mt-1">
              Step {currentStep === 'type' ? 1 : currentStep === 'location' ? 2 : currentStep === 'facility' ? 3 : currentStep === 'amount' ? 4 : 5} of 5
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Select Donation Type */}
          {currentStep === 'type' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">What would you like to donate?</h3>
              <button
                onClick={() => handleSelectType('water')}
                className="w-full p-6 border-2 border-teal-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors">
                    <Droplet className="w-8 h-8 text-teal-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900">Water Support</h4>
                    <p className="text-sm text-gray-600">Provide clean water to mosques and hospitals</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Step 2: Choose Location */}
          {currentStep === 'location' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Where would you like to help?</h3>
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="col-span-2 text-center py-8 text-gray-500">Loading cities...</div>
                ) : (
                  cities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleSelectCity(city)}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-teal-600 group-hover:scale-110 transition-transform" />
                        <div>
                          <h4 className="font-semibold text-gray-900">{city.name}</h4>
                          <p className="text-xs text-gray-500">{city.governorate}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 3: Find Verified Facilities */}
          {currentStep === 'facility' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Select a facility in {donation.city?.name}
              </h3>
              <p className="text-sm text-gray-600">Choose a verified mosque or hospital</p>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading facilities...</div>
                ) : facilities.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No facilities found in this area</div>
                ) : (
                  facilities.map((facility) => (
                    <FacilitySelector
                      key={facility.id}
                      facility={facility}
                      selected={donation.facility?.id === facility.id}
                      onClick={() => handleSelectFacility(facility)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 4: Donation Amount */}
          {currentStep === 'amount' && (
            <div className="space-y-6">
              <div className="p-4 bg-teal-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Selected Facility</h4>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg">
                    <Building2 className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{donation.facility?.name}</p>
                    <p className="text-sm text-gray-600">{donation.facility?.address}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Donation Amount</h3>

                <div className="grid grid-cols-3 gap-2">
                  {[50, 100, 250].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setDonation((prev) => ({ ...prev, amount: preset }));
                        setCustomAmount('');
                      }}
                      className={`p-3 rounded-lg font-semibold transition-all border-2 ${
                        donation.amount === preset && customAmount === ''
                          ? 'border-teal-500 bg-teal-50 text-teal-600'
                          : 'border-gray-200 text-gray-700 hover:border-teal-200'
                      }`}
                    >
                      {formatOMR(preset)}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Custom Amount (OMR)</label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      if (e.target.value) setDonation((prev) => ({ ...prev, amount: 0 }));
                    }}
                    placeholder="Enter custom amount"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="pt-4 border-t-2 border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Donor Information</p>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={donation.donorName}
                      onChange={(e) => setDonation((prev) => ({ ...prev, donorName: e.target.value }))}
                      placeholder="Your name"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 text-sm"
                    />
                    <input
                      type="email"
                      value={donation.donorEmail}
                      onChange={(e) => setDonation((prev) => ({ ...prev, donorEmail: e.target.value }))}
                      placeholder="Your email"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-teal-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Tracking */}
          {currentStep === 'tracking' && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <CheckCircle2 className="w-16 h-16 text-teal-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Donation Received!</h3>
                <p className="text-gray-600">Thank you for your generous donation</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Receipt Number</p>
                <p className="text-lg font-mono font-bold text-gray-900">{donation.receiptNumber}</p>
              </div>

              <DonationTracker donationId={donation.donationId} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3 justify-between">
          {currentStep !== 'type' && currentStep !== 'tracking' && (
            <button
              onClick={goBack}
              className="px-6 py-2 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          )}

          {currentStep === 'type' && (
            <div className="flex-1" />
          )}

          {currentStep === 'amount' && (
            <button
              onClick={handleSubmitDonation}
              disabled={submitting || !donation.facility}
              className="ml-auto px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <Heart className="w-5 h-5" />
              {submitting ? 'Processing...' : 'Complete Donation'}
            </button>
          )}

          {currentStep === 'tracking' && (
            <button
              onClick={() => {
                onComplete();
                onClose();
              }}
              className="ml-auto px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
