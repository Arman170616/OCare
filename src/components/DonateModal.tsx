import { useState, useEffect } from 'react';
import type { ProjectWithDistance } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import { DONATION_PRESETS, SPONSOR_PRESETS, SPONSOR_FREQUENCIES, getCategoryInfo } from '@/lib/constants';
import { formatOMR, getRemainingAmount, facilityTypeLabel, resolveAmount, isValidAmount, facilityName, formatKm } from '@/lib/utils';
import { tr } from '@/lib/i18n';
import { ProgressBar } from './ProgressBar';
import { Heart, CheckCircle2, Calendar, Repeat } from 'lucide-react';
import {
  ModalShell,
  AmountPicker,
  DonorFields,
  FormError,
  DonationTotal,
  SubmitButton,
} from './DonationForm';

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

  const finalAmount = resolveAmount(amount, customAmount);
  const frequencyLabel = SPONSOR_FREQUENCIES.find((f) => f.key === frequency)?.label ?? frequency;

  const handleSubmit = async () => {
    setError('');

    if (!isValidAmount(finalAmount)) {
      setError(tr('Please enter a valid donation amount.', 'يرجى إدخال مبلغ تبرع صحيح.'));
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
      const message = err instanceof Error && err.message ? err.message : tr('Donation failed. Please try again.', 'فشل التبرع. يرجى المحاولة مرة أخرى.');
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
          <h2 className="mb-1 text-xl font-bold text-slate-800">{tr('Donation Successful!', 'تم التبرع بنجاح!')}</h2>
          <p className="mb-4 text-sm text-slate-600">
            {tr(`Thank you for your contribution to ${project.title}.`, `شكرًا لمساهمتك في ${project.title}.`)}
          </p>
          <div className="glass-card mb-6 w-full rounded-xl p-4 text-start">
            <div className="flex justify-between py-1 text-sm">
              <span className="text-slate-500">{tr('Amount', 'المبلغ')}</span>
              <span className="font-bold text-slate-800">{formatOMR(finalAmount)}</span>
            </div>
            <div className="flex justify-between py-1 text-sm">
              <span className="text-slate-500">{tr('Receipt No.', 'رقم الإيصال')}</span>
              <span className="font-mono font-semibold text-slate-700">{receiptNo}</span>
            </div>
            <div className="flex justify-between py-1 text-sm">
              <span className="text-slate-500">{tr('Facility', 'المنشأة')}</span>
              <span className="font-medium text-slate-700">{facilityName(facility)}</span>
            </div>
            <div className="flex justify-between py-1 text-sm">
              <span className="text-slate-500">{tr('Type', 'النوع')}</span>
              <span className="font-medium text-slate-700">
                {mode === 'sponsor' ? `${tr('Sponsor', 'كفالة')} (${frequencyLabel})` : tr('One-time', 'مرة واحدة')}
              </span>
            </div>
          </div>
          <p className="mb-4 text-xs text-slate-500">
            You can track the status of this donation in My Impact: received, preparing, on the way, and delivered.
          </p>
          <button
            onClick={handleClose}
            className="w-full rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white transition-all active:scale-95"
          >
            {tr('Done', 'تم')}
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
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.tint}`}
          >
            <cat.icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="truncate text-base font-bold text-slate-800">{tr('Donate to this project', 'تبرّع لهذا المشروع')}</h2>
            <p dir="auto" className="truncate text-xs text-slate-500">{project.title}</p>
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar project={project} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
        {facility && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-teal-50/70 px-3 py-2 text-xs text-teal-700">
            <span className="font-semibold">{facilityName(facility)}</span>
            <span>·</span>
            <span>{facilityTypeLabel(facility.type)}</span>
            <span>·</span>
            <span>{formatKm(project.distance)}</span>
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
            {tr('One-time', 'مرة واحدة')}
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
            {tr('Sponsor Water', 'كفالة مياه')}
          </button>
        </div>

        {mode === 'sponsor' && (
          <div className="mb-4">
            <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Calendar className="h-3.5 w-3.5" />
              {tr('Frequency', 'التكرار')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {SPONSOR_FREQUENCIES.map((freq) => (
                <button
                  key={freq.key}
                  onClick={() => setFrequency(freq.key)}
                  className={`rounded-lg px-2 py-2 text-xs font-medium transition-all ${
                    frequency === freq.key
                      ? 'bg-teal-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {freq.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <AmountPicker
          label={
            mode === 'sponsor'
              ? tr(
                  `Choose amount (per ${frequency === 'weekly' ? 'week' : frequency === 'monthly' ? 'month' : 'payment'})`,
                  `اختر المبلغ (${frequency === 'weekly' ? 'أسبوعيًا' : frequency === 'monthly' ? 'شهريًا' : 'لكل دفعة'})`
                )
              : tr('Choose amount', 'اختر المبلغ')
          }
          presets={mode === 'one-time' ? DONATION_PRESETS : SPONSOR_PRESETS}
          amount={amount}
          customAmount={customAmount}
          onPreset={(value) => {
            setAmount(value);
            setCustomAmount('');
          }}
          onCustomChange={setCustomAmount}
          allowCustom={mode === 'one-time'}
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

        <p className="mt-3 text-center text-[10px] text-slate-400">
          {remaining > 0
            ? tr(`${formatOMR(remaining)} still needed for this project`, `لا يزال المشروع بحاجة إلى ${formatOMR(remaining)}`)
            : tr('This project has reached its funding goal!', 'حقق هذا المشروع هدف التمويل!')}
        </p>
      </div>
    </ModalShell>
  );
}
