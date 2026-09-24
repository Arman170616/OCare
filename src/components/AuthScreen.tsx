import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Sparkles, Mail, Lock, User, Building2, Heart, Shield, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

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
        setError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }
      if (role === 'organization' && !orgName.trim()) {
        setError('Please enter your organization name.');
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
      setInfo('Account created! You can now sign in with your email and password.');
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
    { key: 'donor' as const, label: 'Donor', icon: Heart, desc: 'Donate to verified projects near you' },
    { key: 'organization' as const, label: 'Organization', icon: Building2, desc: 'Manage facilities and post projects' },
    { key: 'admin' as const, label: 'Admin', icon: Shield, desc: 'Verify facilities and manage the platform' },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xl shadow-emerald-500/30">
            <Sparkles className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">OmanCare</h1>
          <p className="mt-1 text-sm text-slate-500">Donate Where Help Is Needed</p>
        </div>

        <div className="glass-card rounded-3xl p-6">
          <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => { setMode('signin'); setError(''); }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === 'signin' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                mode === 'signup' ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Full name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">I want to register as</label>
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
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Organization name</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="e.g. Salalah Charity Society"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
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
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          OmanCare · One Platform. Every Good Cause.
        </p>
      </div>
    </div>
  );
}
