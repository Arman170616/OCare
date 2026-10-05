import { useImpactStats } from '@/lib/hooks';
import { CATEGORIES } from '@/lib/constants';
import { formatOMR } from '@/lib/utils';
import { Droplets, Heart, ArrowRight, MapPin, BadgeCheck, TrendingUp, Building2, Landmark } from 'lucide-react';
import { HeroVisual } from '@/components/HeroVisual';
import { Reveal, CountUp } from '@/components/Motion';
import { tr } from '@/lib/i18n';

interface HomeViewProps {
  onExplore: () => void;
  onCategorySelect: (category: string) => void;
  onDonateWater: () => void;
}

export function HomeView({ onExplore, onCategorySelect, onDonateWater }: HomeViewProps) {
  const { stats } = useImpactStats();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <section className="mb-10 grid items-center gap-10 pt-6 sm:pt-10 lg:grid-cols-2">
        <div>
          <div
            className="hero-in mb-4 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-teal-700"
            style={{ animationDelay: '0ms' }}
          >
            <MapPin className="h-3.5 w-3.5" />
            {tr('Location-aware charity in Oman', 'عمل خيري حسب موقعك في عُمان')}
          </div>
          <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            <span className="hero-in inline-block" style={{ animationDelay: '80ms' }}>{tr('Find a Need.', 'اكتشف حاجة.')}</span>{' '}
            <span className="hero-in inline-block text-teal-600" style={{ animationDelay: '200ms' }}>{tr('Choose a Place.', 'اختر مكانًا.')}</span>{' '}
            <span className="hero-in inline-block" style={{ animationDelay: '320ms' }}>{tr('Make an Impact.', 'اصنع أثرًا.')}</span>
          </h1>
          <p className="hero-in mt-4 max-w-xl text-base leading-relaxed text-slate-600" style={{ animationDelay: '440ms' }}>
            {tr(
              'Discover verified mosques and hospitals near you that need support, and follow your donation until it is delivered.',
              'اكتشف المساجد والمستشفيات الموثقة القريبة منك التي تحتاج إلى الدعم، وتابع تبرعك حتى يصل إلى وجهته.'
            )}
          </p>

          <div className="hero-in mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: '560ms' }}>
            <button
              onClick={onDonateWater}
              className="group flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-teal-700 active:scale-[0.98]"
            >
              <Droplets className="h-4 w-4 transition-transform group-hover:-rotate-12" />
              {tr('Donate Water Now', 'تبرّع بالمياه الآن')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
            </button>
            <button
              onClick={onExplore}
              className="group flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-700 transition-all hover:-translate-y-0.5 hover:border-teal-300 hover:bg-slate-50"
            >
              <MapPin className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
              {tr('Help Near Me', 'ساعد بالقرب مني')}
            </button>
          </div>
        </div>

        <div className="hero-in" style={{ animationDelay: '300ms' }}>
          <HeroVisual />
        </div>
      </section>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: Heart, label: tr('Total Donations', 'إجمالي التبرعات'), value: <CountUp value={stats.totalDonations} />, color: 'bg-teal-50 text-teal-600' },
          {
            icon: TrendingUp,
            label: tr('Total Raised', 'إجمالي المبالغ المجمعة'),
            value: <CountUp value={stats.totalRaised} format={(n) => formatOMR(Math.round(n * 10) / 10)} />,
            color: 'bg-sky-50 text-sky-600',
          },
          { icon: BadgeCheck, label: tr('Active Projects', 'المشاريع النشطة'), value: <CountUp value={stats.activeProjects} />, color: 'bg-amber-50 text-amber-600' },
          { icon: Building2, label: tr('Verified Facilities', 'المنشآت الموثقة'), value: <CountUp value={19} />, color: 'bg-rose-50 text-rose-600' },
        ].map((stat, i) => (
          <Reveal key={stat.label} delay={i * 90}>
            <StatCard icon={stat.icon} label={stat.label} value={stat.value} color={stat.color} />
          </Reveal>
        ))}
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
              className="glass-card group flex items-center gap-3 rounded-2xl p-4 text-start transition-all active:scale-[0.97]"
            >
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${cat.tint} transition-transform group-hover:scale-110`}
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

      <Reveal className="mb-6">
        <div className="glass-card rounded-3xl p-6">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">{tr('How OmanCare Works', 'كيف تعمل عُمان كير')}</h2>
          <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="draw-line absolute start-4 end-[calc(25%-1rem)] top-4 hidden h-px bg-teal-200 lg:block" />
            <HowItWorksStep
              num="1"
              delay={0}
              icon={Heart}
              title={tr('Select Donation Type', 'اختر نوع التبرع')}
              desc={tr('Choose the cause you want to support — water, mosque care, or hospital care.', 'اختر القضية التي تريد دعمها: المياه أو رعاية المساجد أو رعاية المستشفيات.')}
            />
            <HowItWorksStep
              num="2"
              delay={150}
              icon={MapPin}
              title={tr('Choose Your Location', 'اختر موقعك')}
              desc={tr('Select your city or use your current location to find needs near you.', 'اختر مدينتك أو استخدم موقعك الحالي للعثور على الاحتياجات القريبة منك.')}
            />
            <HowItWorksStep
              num="3"
              delay={300}
              icon={BadgeCheck}
              title={tr('Find Verified Facilities', 'اعثر على منشآت موثقة')}
              desc={tr('Browse verified mosques and hospitals in your area, then pick the one that matches your support.', 'تصفح المساجد والمستشفيات الموثقة في منطقتك، ثم اختر ما يناسب دعمك.')}
            />
            <HowItWorksStep
              num="4"
              delay={450}
              icon={TrendingUp}
              title={tr('Donate & Track Impact', 'تبرّع وتابع أثرك')}
              desc={tr('Donate with confidence and monitor delivery status from received to on the way to delivered.', 'تبرّع بثقة وتابع حالة التوصيل من الاستلام إلى الطريق حتى التسليم.')}
            />
          </div>
        </div>
      </Reveal>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Reveal delay={0}>
          <FeatureCard
            icon={Droplets}
            title={tr('Water for Verified Facilities', 'مياه للمنشآت الموثقة')}
            desc={tr('Support water needs at trusted mosques and hospitals in your area.', 'ادعم احتياجات المياه في المساجد والمستشفيات الموثوقة في منطقتك.')}
            tint="bg-sky-50 text-sky-600"
            onClick={() => onCategorySelect('water')}
          />
        </Reveal>
        <Reveal delay={100}>
          <FeatureCard
            icon={Landmark}
            title={tr('Mosque Support', 'دعم المساجد')}
            desc={tr('Help verified mosques with sanitation, water access, and essential needs.', 'ساعد المساجد الموثقة في النظافة وتوفير المياه والاحتياجات الأساسية.')}
            tint="bg-teal-50 text-teal-600"
            onClick={() => onCategorySelect('mosque')}
          />
        </Reveal>
        <Reveal delay={200}>
          <FeatureCard
            icon={Building2}
            title={tr('Hospital Support', 'دعم المستشفيات')}
            desc={tr('Find approved hospital projects that need your assistance and follow progress closely.', 'اعثر على مشاريع مستشفيات معتمدة تحتاج مساعدتك وتابع تقدمها عن قرب.')}
            tint="bg-rose-50 text-rose-600"
            onClick={() => onCategorySelect('hospital')}
          />
        </Reveal>
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
  value: React.ReactNode;
  color: string;
}) {
  return (
    <div className="glass-card lift group flex h-full flex-col items-start gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-lg font-semibold tabular-nums text-slate-900">{value}</div>
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
  delay,
}: {
  num: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <div className="group relative">
      <div className="mb-3 flex items-center gap-2">
        <span
          className="step-dot relative flex h-8 w-8 items-center justify-center rounded-full border border-teal-200 bg-white text-teal-600"
          style={{ transitionDelay: `${delay + 300}ms` }}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="relative bg-white pe-2 text-xs font-medium text-slate-400">{tr(`Step ${num}`, `الخطوة ${num}`)}</span>
      </div>
      <h3 className="mb-1 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs leading-relaxed text-slate-500">{desc}</p>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  tint,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  tint: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glass-card lift group flex h-full w-full flex-col items-start rounded-2xl p-5 text-start hover:border-teal-300 active:scale-[0.98]"
    >
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-xs leading-relaxed text-slate-600">{desc}</p>
      <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-teal-600">
        {tr('Explore', 'استكشف')}
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1" />
      </div>
    </button>
  );
}
