import { useEffect, useState } from 'react';
import { DELIVERY_STEPS } from '@/lib/constants';
import { Droplets, Heart, Landmark } from 'lucide-react';

// Approximate city positions inside the card (percent of width / height).
const PINS = [
  { name: 'Sohar', x: 50, y: 18 },
  { name: 'Muscat', x: 72, y: 28, primary: true },
  { name: 'Nizwa', x: 55, y: 40 },
  { name: 'Sur', x: 86, y: 44 },
  { name: 'Salalah', x: 22, y: 82 },
];

const YOU = { x: 64, y: 34 };

/** Decorative hero illustration: nearby pins, a route to the chosen mosque, and a live delivery tracker. */
export function HeroVisual() {
  const reduced =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [step, setStep] = useState(reduced ? 2 : 0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setStep((s) => (s + 1) % DELIVERY_STEPS.length), 1800);
    return () => clearInterval(id);
  }, [reduced]);

  const current = DELIVERY_STEPS[step];
  const StepIcon = current.icon;
  const primary = PINS.find((p) => p.primary)!;

  return (
    <div className="hero-visual relative h-80 overflow-hidden rounded-3xl border border-slate-200 bg-white sm:h-96" aria-hidden="true">
      <div className="hero-grid absolute inset-0" />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <line
          x1={YOU.x}
          y1={YOU.y}
          x2={primary.x}
          y2={primary.y}
          className="hero-route"
          stroke="#0d9488"
          strokeWidth="0.6"
          strokeDasharray="1.6 1.4"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {PINS.map((pin, i) => (
        <div
          key={pin.name}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        >
          <span
            className={`hero-pin-ring absolute inset-0 rounded-full ${pin.primary ? 'bg-teal-500/30' : 'bg-sky-400/25'}`}
            style={{ animationDelay: `${i * 450}ms` }}
          />
          <span
            className={`hero-pop relative flex items-center justify-center rounded-full border-2 border-white shadow-sm ${
              pin.primary ? 'h-7 w-7 bg-teal-600 text-white' : 'h-4 w-4 bg-sky-500'
            }`}
            style={{ animationDelay: `${200 + i * 120}ms` }}
          >
            {pin.primary && <Landmark className="h-3.5 w-3.5" />}
          </span>
          <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-slate-400">
            {pin.name}
          </span>
        </div>
      ))}

      <div
        className="absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${YOU.x}%`, top: `${YOU.y}%` }}
      >
        <div className="user-dot" />
      </div>

      <div className="hero-float absolute right-4 top-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <Heart className="h-3.5 w-3.5" />
        </span>
        <div className="text-[11px] leading-tight">
          <div className="font-semibold text-slate-800">+ OMR 10 donated</div>
          <div className="text-slate-400">just now · Muscat</div>
        </div>
      </div>

      <div className="hero-float-slow absolute bottom-4 left-4 right-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:left-auto sm:w-72">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Droplets className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-slate-800">Water Tank Support</div>
            <div className="truncate text-[11px] text-slate-500">Al Rahman Mosque · 1.1 km</div>
          </div>
        </div>

        <div className="mb-2 flex gap-1">
          {DELIVERY_STEPS.map((s, i) => (
            <div key={s.key} className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-500 transition-[width] duration-700 ease-out"
                style={{ width: i <= step ? '100%' : '0%' }}
              />
            </div>
          ))}
        </div>

        <div key={current.key} className="hero-step flex items-center gap-1.5 text-[11px] font-medium text-teal-700">
          <StepIcon className="h-3.5 w-3.5" />
          {current.label}
        </div>
      </div>
    </div>
  );
}
