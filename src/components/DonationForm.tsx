import type { ReactNode } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { formatOMR, isValidAmount } from '@/lib/utils';
import { tr } from '@/lib/i18n';

// Shared form pieces so every donate screen (project modal, water flow) looks the same.

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100';

export function AmountPicker({
  label,
  presets,
  amount,
  customAmount,
  onPreset,
  onCustomChange,
  allowCustom = true,
}: {
  label: string;
  presets: readonly number[];
  amount: number;
  customAmount: string;
  onPreset: (value: number) => void;
  onCustomChange: (value: string) => void;
  allowCustom?: boolean;
}) {
  return (
    <div className="mb-4">
      <label className="mb-2 block text-xs font-semibold text-slate-600">{label}</label>
      <div className="grid grid-cols-5 gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onPreset(preset)}
            className={`rounded-lg px-2 py-2.5 text-sm font-bold transition-all ${
              customAmount === '' && amount === preset
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>
      {allowCustom && (
        <div className="relative mt-2">
          <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">
            {tr('OMR', 'ر.ع.')}
          </span>
          <input
            type="number"
            min="0"
            step="any"
            value={customAmount}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder={tr('Custom amount', 'مبلغ مخصص')}
            className={`${inputClass} ps-12`}
          />
        </div>
      )}
    </div>
  );
}

export function DonorFields({
  name,
  email,
  onNameChange,
  onEmailChange,
}: {
  name: string;
  email: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
}) {
  return (
    <div className="mb-4 space-y-3">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
          {tr('Your name', 'اسمك')} <span className="font-normal text-slate-400">({tr('optional', 'اختياري')})</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={tr('Anonymous donor', 'فاعل خير')}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-slate-600">
          {tr('Email', 'البريد الإلكتروني')} <span className="font-normal text-slate-400">({tr('for receipt', 'لإرسال الإيصال')})</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="your@email.com"
          className={inputClass}
        />
      </div>
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}

export function DonationTotal({ amount }: { amount: number }) {
  return (
    <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-600">{tr('Total donation', 'إجمالي التبرع')}</span>
      <span className="text-lg font-bold text-teal-600">
        {formatOMR(isValidAmount(amount) ? amount : 0)}
      </span>
    </div>
  );
}

export function SubmitButton({
  amount,
  submitting,
  onClick,
}: {
  amount: number;
  submitting: boolean;
  onClick: () => void;
}) {
  const valid = isValidAmount(amount);
  return (
    <button
      onClick={onClick}
      disabled={submitting || !valid}
      className="w-full rounded-xl bg-teal-600 px-6 py-3.5 font-semibold text-white transition-all hover:bg-teal-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {submitting ? tr('Processing...', 'جارٍ المعالجة...') : tr(`Donate ${formatOMR(valid ? amount : 0)}`, `تبرّع بمبلغ ${formatOMR(valid ? amount : 0)}`)}
    </button>
  );
}

export function ModalShell({
  children,
  onClose,
  header,
}: {
  children: ReactNode;
  onClose: () => void;
  header?: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="glass-card flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex shrink-0 items-start gap-3 ${header ? 'px-6 pb-2 pt-5' : 'justify-end p-2'}`}>
          {header && <div className="min-w-0 flex-1">{header}</div>}
          <button
            onClick={onClose}
            aria-label={tr('Close', 'إغلاق')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
