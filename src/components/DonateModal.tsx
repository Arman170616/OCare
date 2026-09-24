import { useState, useEffect } from 'react';
import type { ProjectWithDistance } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { DONATION_PRESETS, SPONSOR_PRESETS, SPONSOR_FREQUENCIES, getCategoryInfo } from '@/lib/constants';
import { formatOMR, getRemainingAmount, facilityTypeLabel } from '@/lib/utils';
import { ProgressBar } from './ProgressBar';
import { X, Heart, CheckCircle2, Calendar, Repeat, AlertCircle } from 'lucide-react';

interface DonateModalProps {
  project: ProjectWithDistance | null;
  onClose: () => void;
  onDonated: () => void;
}

export function DonateModal({ project, onClose, onDonated }: DonateModalProps) {
  const { profile } = useAuth();
  const [mode, setMode] = useState<'one-time' | 'sponsor'>('one-time');
  const [amount, setAmount] = useState<number>(DONATION_PRESETS[1]);
  const [customAmount, setCustomAmount] = useState('');
  const [frequency, setFrequency] = useState<string>('monthly');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [receiptNo, setReceiptNo] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setDonorName(profile.full_name ?? '');
      setDonorEmail(profile.email ?? '');
    }
  }, [profile]);

  if (!project) return null;

  const cat = getCategoryInfo(project.category);
  const facility = project.facility;
  const remaining = getRemainingAmount(project);

  const finalAmount =
    customAmount !== '' ? parseFloat(customAmount) : amount;

  const handleSubmit = async () => {
    setError('');

    if (!finalAmount || finalAmount <= 0 || Number.isNaN(finalAmount)) {
      setError('Please enter a valid donation amount.');
      return;
    }

    setSubmitting(true);

    try {
      const safeUserId = profile?.id || 'donor-demo';
      const safeName = (donorName || profile?.full_name || 'Anonymous Donor').trim();
      const safeEmail = (donorEmail || profile?.email || 'anonymous@omancare.local').trim();

      const response = await apiFetch<{ receipt_number?: string; id?: string }>(`/api/donations`, {
        method: 'POST',
        body: JSON.stringify({
          project_id: project.id,
          user_id: safeUserId,
          donor_name: safeName || 'Anonymous Donor',
          donor_email: safeEmail || 'anonymous@omancare.local',
          amount: finalAmount,
          currency: 'OMR',
          recurring: mode === 'sponsor',
          frequency: mode === 'sponsor' ? frequency : 'one-time',
        }),
      });

      if (!response?.receipt_number) {
        throw new Error('Donation receipt was not returned');
      }

      setReceiptNo(response.receipt_number);
      setSuccess(true);
    } catch (err) {
      console.error('Donation failed:', err);
      const message = err instanceof Error && err.message ? err.message : 'Donation failed. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (success) {
      onDonated();
    }
    setSuccess(false);
    setError('');
    setCustomAmount('');
    setDonorName('');
    setDonorEmail('');
    onClose();
  };

  if (success) {
    return (
      <ModalShell onClose={handleClose}>
        <div className="flex flex-col items-center px-6 py-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="mb-1 text-xl font-bold text-slate-800">Donation Successful!</h2>
          <p className="mb-4 text-sm text-slate-600">
            Thank you for your contribution to {project.title}.
          </p>
          <div className="glass-card mb-6 w-full rounded-xl p-4 text-left">
            <div className="flex justify-between py-1 text-sm">
              <span className="text-slate-500">Amount</span>
              <span className="font-bold text-slate-800">{formatOMR(finalAmount)}</span>
            </div>
            <div className="flex justify-between py-1 text-sm">
              <span className="text-slate-500">Receipt No.</span>
              <span className="font-mono font-semibold text-slate-700">{receiptNo}</span>
            </div>
            <div className="flex justify-between py-1 text-sm">
              <span className="text-slate-500">Facility</span>
              <span className="font-medium text-slate-700">{facility?.name}</span>
            </div>
            <div className="flex justify-between py-1 text-sm">
              <span className="text-slate-500">Type</span>
              <span className="font-medium text-slate-700">
                {mode === 'sponsor' ? `Sponsor (${frequency})` : 'One-time'}
              </span>
            </div>
          </div>
          <p className="mb-4 text-xs text-slate-500">
            You can track the status of this donation in My Impact: received, preparing, on the way, and delivered.
          </p>
          <button
            onClick={handleClose}
            className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl active:scale-95"
          >
            Done
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={handleClose}>
      <div className="border-b border-slate-200/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${cat.gradient} text-white shadow-md`}
          >
            <cat.icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="truncate text-base font-bold text-slate-800">Donate to this project</h2>
            <p className="truncate text-xs text-slate-500">{project.title}</p>
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar project={project} />
        </div>
      </div>

      <div className="max-h-[55vh] overflow-y-auto px-6 py-4">
        {facility && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-teal-50/70 px-3 py-2 text-xs text-teal-700">
            <span className="font-semibold">{facility.name}</span>
            <span>·</span>
            <span>{facilityTypeLabel(facility.type)}</span>
            <span>·</span>
            <span>{project.distance.toFixed(1)} km</span>
          </div>
        )}

        <div className="mb-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setMode('one-time');
              setAmount(DONATION_PRESETS[1]);
              setCustomAmount('');
            }}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
              mode === 'one-time'
                ? 'border-teal-500 bg-teal-50 text-teal-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Heart className="h-4 w-4" />
            One-time
          </button>
          <button
            onClick={() => {
              setMode('sponsor');
              setAmount(SPONSOR_PRESETS[0]);
              setCustomAmount('');
            }}
            className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
              mode === 'sponsor'
                ? 'border-teal-500 bg-teal-50 text-teal-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <Repeat className="h-4 w-4" />
            Sponsor Water
          </button>
        </div>

        {mode === 'sponsor' && (
          <div className="mb-4">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Calendar className="h-3.5 w-3.5" />
              Frequency
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SPONSOR_FREQUENCIES.map((freq) => (
                <button
                  key={freq.key}
                  onClick={() => setFrequency(freq.key)}
                  className={`rounded-lg px-2 py-2 text-xs font-medium transition-all ${
                    frequency === freq.key
                      ? 'bg-teal-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {freq.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="mb-2 block text-xs font-semibold text-slate-600">
            Choose amount {mode === 'sponsor' ? `(per ${frequency === 'weekly' ? 'week' : frequency === 'monthly' ? 'month' : 'payment'})` : ''}
          </label>
          <div className="grid grid-cols-5 gap-2">
            {(mode === 'one-time' ? DONATION_PRESETS : SPONSOR_PRESETS).map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setAmount(preset);
                  setCustomAmount('');
                }}
                className={`rounded-lg px-2 py-2.5 text-sm font-bold transition-all ${
                  customAmount === '' && amount === preset
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
          {mode === 'one-time' && (
            <div className="mt-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
                  OMR
                </span>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Custom amount"
                  className="w-full rounded-lg border border-slate-200 bg-white/70 py-2.5 pl-12 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>
          )}
        </div>

        <div className="mb-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Your name <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <input
              type="text"
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder="Anonymous donor"
              className="w-full rounded-lg border border-slate-200 bg-white/70 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">
              Email <span className="font-normal text-slate-400">(for receipt)</span>
            </label>
            <input
              type="email"
              value={donorEmail}
              onChange={(e) => setDonorEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-lg border border-slate-200 bg-white/70 px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </div>

        {error && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-sm font-medium text-slate-600">Total donation</span>
          <span className="text-lg font-bold text-teal-600">
            {formatOMR(finalAmount || 0)}
          </span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !finalAmount}
          className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? 'Processing...'
            : `Donate ${formatOMR(finalAmount || 0)}`}
        </button>

        <p className="mt-3 text-center text-[10px] text-slate-400">
          {remaining > 0
            ? `${formatOMR(remaining)} still needed for this project`
            : 'This project has reached its funding goal!'}
        </p>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="glass-card max-h-[90vh] w-full max-w-lg overflow-hidden rounded-t-3xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end p-2">
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
