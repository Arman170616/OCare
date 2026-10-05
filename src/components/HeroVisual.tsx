import { useEffect, useState } from 'react';
import { DELIVERY_STEPS } from '@/lib/constants';
import { Droplets, Heart, Landmark } from 'lucide-react';
import { tr, isRtl } from '@/lib/i18n';
import { formatOMR, placeName } from '@/lib/utils';

// Simple equirectangular projection of Oman into a 0–100 box (x scaled by cos ~21°N).
const BOUNDS = { west: 51.8, east: 60.1, north: 26.6, south: 16.4 };
const X_SCALE = Math.cos((21 * Math.PI) / 180);
const MAP_W = (BOUNDS.east - BOUNDS.west) * X_SCALE;
const MAP_H = BOUNDS.north - BOUNDS.south;
const MAP_ASPECT = MAP_W / MAP_H;

function project(lng: number, lat: number): [number, number] {
  return [((lng - BOUNDS.west) * X_SCALE * 100) / MAP_W, ((BOUNDS.north - lat) * 100) / MAP_H];
}

function toPath(coords: [number, number][]): string {
  return (
    coords
      .map(([lng, lat], i) => {
        const [x, y] = project(lng, lat);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(' ') + ' Z'
  );
}

// Simplified outlines as [lng, lat] — decorative, not survey accurate.
const MAINLAND: [number, number][] = [
  [56.37, 24.98], [56.47, 24.74], [56.73, 24.36], [57.1, 23.98], [57.6, 23.78], [58.18, 23.67],
  [58.6, 23.6], [58.92, 23.26], [59.25, 22.95], [59.53, 22.57], [59.8, 22.53], [59.85, 22.35],
  [59.6, 21.9], [59.35, 21.45], [59.0, 21.0], [58.75, 20.8], [58.35, 20.65], [58.2, 20.4],
  [57.85, 20.15], [57.7, 19.65], [57.8, 18.95], [57.3, 18.9], [56.65, 18.2], [56.35, 17.9],
  [55.6, 17.6], [55.3, 17.45], [54.75, 17.0], [54.1, 17.0], [53.6, 16.75], [53.0, 16.65],
  [52.75, 17.3], [52.0, 19.0], [55.0, 22.7], [55.2, 22.7], [55.7, 24.0], [55.8, 24.25],
  [56.0, 24.6], [56.1, 24.9],
];
const MUSANDAM: [number, number][] = [
  [56.08, 26.05], [56.2, 26.38], [56.38, 26.36], [56.45, 26.15], [56.38, 25.95], [56.27, 25.65], [56.1, 25.75],
];
const MASIRAH: [number, number][] = [
  [58.85, 20.7], [58.95, 20.5], [58.85, 20.2], [58.68, 20.15], [58.62, 20.4],
];
const OMAN_PATH = [MAINLAND, MUSANDAM, MASIRAH].map(toPath).join(' ');

// City coordinates match the backend's /api/cities data.
const PINS = [
  { name: 'Sohar', lng: 56.7089, lat: 24.3477 },
  { name: 'Muscat', lng: 58.3829, lat: 23.588, primary: true },
  { name: 'Nizwa', lng: 57.5333, lat: 22.9333 },
  { name: 'Sur', lng: 59.5333, lat: 22.5333 },
  { name: 'Salalah', lng: 54.0924, lat: 17.0151 },
].map((pin) => {
  const [x, y] = project(pin.lng, pin.lat);
  return { ...pin, x, y };
});

const [YOU_X, YOU_Y] = project(57.8, 23.2);

/** Decorative hero illustration: Oman with city nodes, a route to the chosen mosque, and a live delivery tracker. */
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
  const textDir = isRtl() ? 'rtl' : 'ltr';

  return (
    <div dir="ltr" className="hero-visual relative h-96 overflow-hidden rounded-3xl border border-slate-200 bg-white sm:h-[26rem]" aria-hidden="true">
      <span className="absolute bottom-24 right-6 text-[10px] font-medium uppercase tracking-[0.2em] text-sky-300 sm:bottom-auto sm:right-auto sm:left-[46%] sm:top-[62%]">
        {tr('Arabian Sea', 'بحر العرب')}
      </span>
      <span className="absolute left-[44%] top-[9%] hidden text-[10px] font-medium uppercase tracking-[0.2em] text-sky-300 sm:block">
        {tr('Gulf of Oman', 'خليج عُمان')}
      </span>

      <div
        className="absolute bottom-[5%] left-[4%] top-[5%] sm:left-[6%]"
        style={{ aspectRatio: `${MAP_ASPECT}` }}
      >
        <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="oman-dots" width="2.6" height="2.6" patternUnits="userSpaceOnUse">
              <circle cx="1.3" cy="1.3" r="0.45" fill="#14b8a6" fillOpacity="0.35" />
            </pattern>
          </defs>
          <path d={OMAN_PATH} className="oman-fill" fill="#f0fdfa" />
          <path d={OMAN_PATH} className="oman-fill" fill="url(#oman-dots)" />
          <path
            d={OMAN_PATH}
            className="oman-outline"
            fill="none"
            stroke="#5eead4"
            strokeWidth="1.25"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
          />
          <line
            x1={YOU_X}
            y1={YOU_Y}
            x2={primary.x}
            y2={primary.y}
            className="hero-route"
            stroke="#0d9488"
            strokeWidth="1.5"
            strokeDasharray="3 3"
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
                pin.primary ? 'h-7 w-7 bg-teal-600 text-white' : 'h-3.5 w-3.5 bg-sky-500'
              }`}
              style={{ animationDelay: `${900 + i * 140}ms` }}
            >
              {pin.primary && <Landmark className="h-3.5 w-3.5" />}
            </span>
            <span
              className={`absolute top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-medium ${
                pin.primary ? 'left-full ml-1.5 text-teal-700' : 'right-full mr-1.5 text-slate-500'
              }`}
            >
              {placeName(pin.name)}
            </span>
          </div>
        ))}

        <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${YOU_X}%`, top: `${YOU_Y}%` }}>
          <div className="user-dot" />
        </div>
      </div>

      <div dir={textDir} className="hero-float absolute right-4 top-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <Heart className="h-3.5 w-3.5" />
        </span>
        <div className="text-[11px] leading-tight">
          <div className="font-semibold text-slate-800">{tr(`+ ${formatOMR(10)} donated`, `تبرع جديد بقيمة ${formatOMR(10)}`)}</div>
          <div className="text-slate-400">{tr('just now · Muscat', 'الآن · مسقط')}</div>
        </div>
      </div>

      <div dir={textDir} className="hero-float-slow absolute bottom-4 right-4 w-56 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:w-72">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Droplets className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-slate-800">{tr('Water Tank Support', 'دعم خزان المياه')}</div>
            <div className="truncate text-[11px] text-slate-500">{tr('Al Rahman Mosque · 1.1 km', 'مسجد الرحمن · 1.1 كم')}</div>
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
