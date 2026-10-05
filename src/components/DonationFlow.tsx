import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import type { City, Facility } from '@/lib/types';
import { DONATION_PRESETS } from '@/lib/constants';
import { facilityTypeLabel, resolveAmount, isValidAmount } from '@/lib/utils';
import { ChevronLeft, ChevronRight, CheckCircle2, MapPin, Droplets, Loader2 } from 'lucide-react';
import { FacilitySelector } from './FacilitySelector';
import { DonationTracker } from './DonationTracker';
import {
  ModalShell,
  AmountPicker,
  DonorFields,
  FormError,
  DonationTotal,
  SubmitButton,
} from './DonationForm';

interface DonationFlowProps {
  onClose: () => void;
  onComplete: () => void;
}

type Step = 'type' | 'location' | 'facility' | 'amount' | 'tracking';

const STEPS: { key: Step; label: string }[] = [
  { key: 'type', label: 'Donation type' },
  { key: 'location', label: 'Location' },
  { key: 'facility', label: 'Facility' },
  { key: 'amount', label: 'Amount' },
  { key: 'tracking', label: 'Tracking' },
];

export function DonationFlow({ onClose, onComplete }: DonationFlowProps) {
  const { profile } = useAuth();
  const [step, setStep] = useState<Step>('type');
  const [cities, setCities] = useState<City[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [city, setCity] = useState<City | null>(null);
  const [facility, setFacility] = useState<Facility | null>(null);
  const [amount, setAmount] = useState<number>(DONATION_PRESETS[1]);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState(profile?.full_name ?? '');
  const [donorEmail, setDonorEmail] = useState(profile?.email ?? '');
  const [receipt, setReceipt] = useState<{ id: string; number: string } | null>(null);

  const finalAmount = resolveAmount(amount, customAmount);
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  useEffect(() => {
    setLoading(true);
    apiFetch<City[]>('/api/cities')
      .then((data) => setCities(data || []))
      .catch(() => setError('Failed to load cities'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!city) return;
    setLoading(true);
    apiFetch<Facility[]>(`/api/facilities?city_id=${city.id}&types=mosque,hospital`)
      .then((data) => setFacilities(data || []))
      .catch(() => setError('Failed to load facilities'))
      .finally(() => setLoading(false));
  }, [city]);

  const goTo = (next: Step) => {
    setError('');
    setStep(next);
  };

  const goBack = () => {
    if (stepIndex > 0 && step !== 'tracking') goTo(STEPS[stepIndex - 1].key);
  };

  const handleSubmit = async () => {
    if (!facility) {
      setError('Please choose a facility.');
      return;
    }
    if (!isValidAmount(finalAmount)) {
      setError('Please enter a valid donation amount.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await apiFetch<{ id: string; receipt_number: string }>('/api/donations', {
        method: 'POST',
        body: JSON.stringify({
          facility_id: facility.id,
          user_id: profile?.id || 'donor-demo',
          donor_name: donorName.trim() || profile?.full_name || 'Anonymous Donor',
          donor_email: donorEmail.trim() || profile?.email || 'anonymous@omancare.local',
          amount: finalAmount,
          currency: 'OMR',
          recurring: false,
          frequency: 'one-time',
          donation_type: 'water',
        }),
      });

      if (!response?.id || !response?.receipt_number) {
        throw new Error('Donation receipt was not returned');
      }
      setReceipt({ id: response.id, number: response.receipt_number });
      goTo('tracking');
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Donation failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (receipt) onComplete();
    onClose();
  };

  const header = (
    <>
      <h2 className="text-base font-bold text-slate-800">Water Donation</h2>
      <p className="text-xs text-slate-500">
        Step {stepIndex + 1} of {STEPS.length} · {STEPS[stepIndex].label}
      </p>
      <div className="mt-3 flex gap-1">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`h-1 flex-1 rounded-full ${i <= stepIndex ? 'bg-teal-600' : 'bg-slate-200'}`}
          />
        ))}
      </div>
    </>
  );

  return (
    <ModalShell onClose={handleClose} header={header}>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-3">
        {step !== 'type' && step !== 'tracking' && (
          <button
            onClick={goBack}
            className="mb-3 flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        )}

        {step === 'type' && (
          <>
            <StepTitle>What would you like to donate?</StepTitle>
            <OptionButton
              icon={<Droplets className="h-5 w-5" />}
              title="Water Support"
              subtitle="Provide clean water to mosques and hospitals"
              onClick={() => goTo('location')}
            />
          </>
        )}

        {step === 'location' && (
          <>
            <StepTitle>Where would you like to help?</StepTitle>
            {loading ? (
              <Loading text="Loading cities..." />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {cities.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCity(c);
                      setFacility(null);
                      goTo('facility');
                    }}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors ${
                      city?.id === c.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'
                    }`}
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-teal-600" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-800">{c.name}</div>
                      <div className="truncate text-xs text-slate-500">{c.governorate}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {step === 'facility' && (
          <>
            <StepTitle>Select a facility in {city?.name}</StepTitle>
            {loading ? (
              <Loading text="Loading facilities..." />
            ) : facilities.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No verified facilities in this city yet.</p>
            ) : (
              <div className="space-y-2">
                {facilities.map((f) => (
                  <FacilitySelector
                    key={f.id}
                    facility={f}
                    selected={facility?.id === f.id}
                    onClick={() => {
                      setFacility(f);
                      goTo('amount');
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {step === 'amount' && facility && (
          <>
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-teal-50/70 px-3 py-2 text-xs text-teal-700">
              <span className="font-semibold">{facility.name}</span>
              <span>·</span>
              <span>{facilityTypeLabel(facility.type)}</span>
              <span>·</span>
              <span>{city?.name}</span>
            </div>

            <AmountPicker
              label="Choose amount"
              presets={DONATION_PRESETS}
              amount={amount}
              customAmount={customAmount}
              onPreset={(value) => {
                setAmount(value);
                setCustomAmount('');
              }}
              onCustomChange={setCustomAmount}
            />

            <DonorFields
              name={donorName}
              email={donorEmail}
              onNameChange={setDonorName}
              onEmailChange={setDonorEmail}
            />

            <FormError message={error} />
            <DonationTotal amount={finalAmount} />
            <SubmitButton amount={finalAmount} submitting={submitting} onClick={handleSubmit} />
          </>
        )}

        {step === 'tracking' && receipt && (
          <>
            <div className="flex flex-col items-center py-4 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Donation Received!</h3>
              <p className="text-sm text-slate-600">Thank you for supporting {facility?.name}.</p>
            </div>
            <div className="mb-4 flex justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <span className="text-slate-500">Receipt No.</span>
              <span className="font-mono font-semibold text-slate-700">{receipt.number}</span>
            </div>
            <DonationTracker donationId={receipt.id} />
            <button
              onClick={handleClose}
              className="mt-4 w-full rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-teal-700"
            >
              Done
            </button>
          </>
        )}

        {step !== 'amount' && <FormError message={error} />}
      </div>
    </ModalShell>
  );
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-sm font-semibold text-slate-700">{children}</h3>;
}

function Loading({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      {text}
    </div>
  );
}

function OptionButton({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 p-4 text-left transition-colors hover:border-teal-300 hover:bg-slate-50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <div className="text-xs text-slate-500">{subtitle}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-500" />
    </button>
  );
}
