import { useImpactStats } from '@/lib/hooks';
import { CATEGORIES } from '@/lib/constants';
import { formatOMR } from '@/lib/utils';
import { Droplets, Heart, ArrowRight, MapPin, BadgeCheck, TrendingUp, Building2, Landmark, Sparkles } from 'lucide-react';

interface HomeViewProps {
  onExplore: () => void;
  onCategorySelect: (category: string) => void;
  onDonateWater: () => void;
}

export function HomeView({ onExplore, onCategorySelect, onDonateWater }: HomeViewProps) {
  const { stats } = useImpactStats();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <section className="glass-card relative mb-6 overflow-hidden rounded-3xl px-6 py-10 sm:px-10 sm:py-14">
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-teal-500/10 to-transparent" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-teal-400/20 to-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-10 left-10 h-40 w-40 rounded-full bg-gradient-to-br from-sky-400/10 to-cyan-500/10 blur-2xl" />

        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-teal-50/80 px-3 py-1 text-xs font-semibold text-teal-700">
            <Sparkles className="h-3.5 w-3.5" />
            OmanCare · Location-Aware Charity Platform
          </div>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-slate-800 sm:text-4xl md:text-5xl">
            Find a Need.
            <br />
            <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Choose a Place.
            </span>{' '}
            Make an Impact.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
            Discover verified charitable needs around you — mosques and hospitals that need your support.
            Water is provided through these verified facilities, not as a separate direct-water listing.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onDonateWater}
              className="group flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-3.5 font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all hover:shadow-2xl hover:shadow-emerald-500/30 active:scale-[0.98]"
            >
              <Heart className="h-5 w-5" />
              Donate Water Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={onExplore}
              className="group flex items-center justify-center gap-2 rounded-2xl border-2 border-teal-200 bg-white/60 px-6 py-3.5 font-semibold text-teal-600 transition-all hover:border-teal-300 hover:bg-teal-50"
            >
              <Heart className="h-5 w-5" />
              Help Near Me
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-3xl border border-teal-100 bg-gradient-to-r from-teal-50 via-sky-50 to-emerald-50 p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-teal-700">
          <MapPin className="h-4 w-4" />
          Donation Journey
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <JourneyStep num="1" title="Select Donation Type" text="Choose water, mosque, or hospital support." />
          <JourneyStep num="2" title="Choose Your Location" text="Pick your city or use nearby mode." />
          <JourneyStep num="3" title="Find Verified Facilities" text="See trusted mosques and hospitals in your area." />
          <JourneyStep num="4" title="Donate & Track Impact" text="Follow updates from received to on the way to delivered." />
        </div>
      </section>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Heart}
          label="Total Donations"
          value={stats.totalDonations.toString()}
          color="from-teal-500 to-emerald-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Total Raised"
          value={formatOMR(stats.totalRaised)}
          color="from-sky-500 to-cyan-600"
        />
        <StatCard
          icon={BadgeCheck}
          label="Active Projects"
          value={stats.activeProjects.toString()}
          color="from-amber-500 to-orange-600"
        />
        <StatCard
          icon={Building2}
          label="Verified Facilities"
          value="19"
          color="from-rose-500 to-pink-600"
        />
      </section>

      {/* <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">What would you like to support?</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => onCategorySelect(cat.key)}
              className="glass-card group flex items-center gap-3 rounded-2xl p-4 text-left transition-all hover:shadow-lg hover:shadow-slate-200/50 active:scale-[0.97]"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${cat.gradient} text-white shadow-md transition-transform group-hover:scale-110`}
              >
                <cat.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-slate-800">{cat.label}</div>
                <div className="flex items-center gap-0.5 text-[10px] text-slate-400">
                  <MapPin className="h-2.5 w-2.5" /> Find near you
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </section> */}

      <section className="mb-6">
        <div className="glass-card rounded-3xl p-6">
          <h2 className="mb-4 text-lg font-bold text-slate-800">How OmanCare Works</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <HowItWorksStep
              num="1"
              icon={Heart}
              title="Select Donation Type"
              desc="Choose the cause you want to support — water, mosque care, or hospital care."
            />
            <HowItWorksStep
              num="2"
              icon={MapPin}
              title="Choose Your Location"
              desc="Select your city or use your current location to find needs near you."
            />
            <HowItWorksStep
              num="3"
              icon={BadgeCheck}
              title="Find Verified Facilities"
              desc="Browse verified mosques and hospitals in your area, then pick the one that matches your support."
            />
            <HowItWorksStep
              num="4"
              icon={TrendingUp}
              title="Donate & Track Impact"
              desc="Donate with confidence and monitor delivery status from received to on the way to delivered."
            />
          </div>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <FeatureCard
          icon={Droplets}
          title="Water for Verified Facilities"
          desc="Support water needs at trusted mosques and hospitals in your area."
          gradient="from-sky-400 to-cyan-500"
          onClick={() => onCategorySelect('water')}
        />
        <FeatureCard
          icon={Landmark}
          title="Mosque Support"
          desc="Help verified mosques with sanitation, water access, and essential needs."
          gradient="from-teal-400 to-emerald-500"
          onClick={() => onCategorySelect('mosque')}
        />
        <FeatureCard
          icon={Building2}
          title="Hospital Support"
          desc="Find approved hospital projects that need your assistance and follow progress closely."
          gradient="from-rose-400 to-pink-500"
          onClick={() => onCategorySelect('hospital')}
        />
      </section>

      <section className="glass-card rounded-3xl p-6 text-center">
        <h2 className="text-xl font-bold text-slate-800">One Platform. Every Good Cause.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Instead of asking &ldquo;Where can I donate?&rdquo; — OmanCare lets you ask
          &ldquo;Who needs help near me?&rdquo; and shows you verified opportunities.
        </p>
        <button
          onClick={onExplore}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl active:scale-95"
        >
          Explore Nearby Needs
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="glass-card flex items-center gap-3 rounded-2xl p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-lg font-bold text-slate-800">{value}</div>
        <div className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function HowItWorksStep({
  num,
  icon: Icon,
  title,
  desc,
}: {
  num: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative rounded-2xl border border-slate-200/60 bg-white/50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-xs font-bold text-teal-700">
          {num}
        </span>
        <Icon className="h-4 w-4 text-teal-600" />
      </div>
      <h3 className="mb-1 text-sm font-bold text-slate-800">{title}</h3>
      <p className="text-xs leading-relaxed text-slate-500">{desc}</p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  gradient,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  gradient: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glass-card group flex flex-col items-start rounded-2xl p-5 text-left transition-all hover:shadow-lg hover:shadow-slate-200/50 active:scale-[0.98]"
    >
      <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md transition-transform group-hover:scale-110`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-1 text-base font-bold text-slate-800">{title}</h3>
      <p className="text-xs leading-relaxed text-slate-600">{desc}</p>
      <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-teal-600">
        Explore
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
      </div>
    </button>
  );
}

function JourneyStep({
  num,
  title,
  text,
}: {
  num: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 p-3 shadow-sm">
      <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-xs font-bold text-white">
        {num}
      </div>
      <h3 className="mb-1 text-sm font-bold text-slate-800">{title}</h3>
      <p className="text-xs leading-relaxed text-slate-600">{text}</p>
    </div>
  );
}
