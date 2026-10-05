import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Sparkles, Mail, Lock, User, Building2, Heart, Shield, ArrowRight, AlertCircle, Loader2, Languages } from 'lucide-react';
import { tr, getLang, setLang } from '@/lib/i18n';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'donor' | 'organization' | 'admin'>('donor');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    if (mode === 'signup') {
      if (password.length < 6) {
        setError(tr('Password must be at least 6 characters.', 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.'));
        setLoading(false);
        return;
      }
      if (role === 'organization' && !orgName.trim()) {
        setError(tr('Please enter your organization name.', 'يرجى إدخال اسم المنظمة.'));
        setLoading(false);
        return;
      }
      const { error: signUpError } = await signUp(
        email,
        password,
        fullName,
        role,
        role === 'organization' ? orgName : undefined
      );
      if (signUpError) {
        setError(signUpError);
        setLoading(false);
        return;
      }
      setInfo(tr('Account created! You can now sign in with your email and password.', 'تم إنشاء الحساب! يمكنك الآن تسجيل الدخول ببريدك الإلكتروني وكلمة المرور.'));
      setMode('signin');
      setPassword('');
      setLoading(false);
    } else {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError);
        setLoading(false);
      }
      // On success, the onAuthStateChange listener triggers profile fetch
      // and the app redirects automatically. Don't reset loading here —
      // the spinner stays briefly until the redirect happens.
    }
  };

  const roleOptions = [
    { key: 'donor' as const, label: tr('Donor', 'متبرع'), icon: Heart, desc: tr('Donate to verified projects near you', 'تبرّع لمشاريع موثقة بالقرب منك') },
    { key: 'organization' as const, label: tr('Organization', 'منظمة'), icon: Building2, desc: tr('Manage facilities and post projects', 'أدر المنشآت وانشر المشاريع') },
    { key: 'admin' as const, label: tr('Admin', 'مدير'), icon: Shield, desc: tr('Verify facilities and manage the platform', 'وثّق المنشآت وأدر المنصة') },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
      <button
        onClick={() => setLang(getLang() === 'ar' ? 'en' : 'ar')}
        className="absolute end-4 top-4 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
      >
        <Languages className="h-3.5 w-3.5" />
        {getLang() === 'ar' ? 'English' : 'العربية'}
      </button>
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-white">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">{tr('OmanCare', 'عُمان كير')}</h1>
          <p className="mt-1 text-sm text-slate-500">{tr('Donate Where Help Is Needed', 'تبرّع حيث تشتد الحاجة')}</p>
        </div>

        <div className="glass-card rounded-3xl p-6">
          <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => { setMode('signin'); setError(''); }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === 'signin' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              {tr('Sign In', 'تسجيل الدخول')}
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === 'signup' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              {tr('Create Account', 'إنشاء حساب')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">{tr('Full name', 'الاسم الكامل')}</label>
                  <div className="relative">
                    <User className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={tr('Your name', 'اسمك')}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white py-2.5 ps-10 pe-4 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">{tr('I want to register as', 'أرغب بالتسجيل بصفتي')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {roleOptions.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setRole(opt.key)}
                          className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 transition-all ${
                            role === opt.key
                              ? 'border-teal-500 bg-teal-50 text-teal-700'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span className="text-[10px] font-bold">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-400">
                    {roleOptions.find((r) => r.key === role)?.desc}
                  </p>
                </div>

                {role === 'organization' && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">{tr('Organization name', 'اسم المنظمة')}</label>
                    <div className="relative">
                      <Building2 className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder={tr('e.g. Salalah Charity Society', 'مثال: جمعية صلالة الخيرية')}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 ps-10 pe-4 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                {mode === 'signin' ? tr('Email or username', 'البريد الإلكتروني أو اسم المستخدم') : tr('Email', 'البريد الإلكتروني')}
              </label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={mode === 'signin' ? 'text' : 'email'}
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'signin' ? 'admin / your@email.com' : 'your@email.com'}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 ps-10 pe-4 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">{tr('Password', 'كلمة المرور')}</label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 ps-10 pe-4 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? tr('Sign In', 'تسجيل الدخول') : tr('Create Account', 'إنشاء حساب')}
                  <ArrowRight className="h-4 w-4 rtl:-scale-x-100" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          {tr('OmanCare · One Platform. Every Good Cause.', 'عُمان كير · منصة واحدة لكل عمل خيري.')}
        </p>
      </div>
    </div>
  );
}
