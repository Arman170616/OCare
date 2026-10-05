import { useState, useCallback, useEffect, Fragment, type ReactNode } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Header, type View } from '@/components/Header';
import { AuthScreen } from '@/components/AuthScreen';
import { HomeView } from '@/views/HomeView';
import { ExploreView } from '@/views/ExploreView';
import { ImpactView } from '@/views/ImpactView';
import { AdminDashboard } from '@/views/AdminDashboard';
import { OrganizationDashboard } from '@/views/OrganizationDashboard';
import { DonateModal } from '@/components/DonateModal';
import { ProjectDetailModal } from '@/components/ProjectDetailModal';
import { DonationFlow } from '@/components/DonationFlow';
import type { ProjectWithDistance } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { getLang, onLangChange, tr } from '@/lib/i18n';

function AppContent() {
  const { profile, loading } = useAuth();
  // Remembered for the tab session so a language switch (which remounts the app) keeps the page.
  const [view, setViewState] = useState<View>(() => {
    try {
      return (sessionStorage.getItem('omancare-view') as View) || 'home';
    } catch {
      return 'home';
    }
  });
  const setView = useCallback((next: View) => {
    setViewState(next);
    try {
      sessionStorage.setItem('omancare-view', next);
    } catch {
      // ignore unavailable storage
    }
  }, []);
  const [initialCategory, setInitialCategory] = useState<string | null>(null);
  const [donateProject, setDonateProject] = useState<ProjectWithDistance | null>(null);
  const [detailProject, setDetailProject] = useState<ProjectWithDistance | null>(null);
  const [showDonationFlow, setShowDonationFlow] = useState(false);

  const handleNavigate = (newView: View) => {
    setView(newView);
    if (newView === 'explore') {
      setInitialCategory(null);
    }
  };

  const handleCategorySelect = (category: string) => {
    setInitialCategory(category);
    setView('explore');
  };

  const handleDonate = useCallback((project: ProjectWithDistance) => {
    setDetailProject(null);
    setDonateProject(project);
  }, []);

  const handleViewDetails = useCallback((project: ProjectWithDistance) => {
    setDetailProject(project);
  }, []);

  const handleDonated = useCallback(() => {
    setView('impact');
    setTimeout(() => setView('explore'), 50);
  }, [setView]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (!profile) {
    return <AuthScreen />;
  }

  const allowedView = (): View => {
    if (view === 'admin' && profile.role !== 'admin') return 'home';
    if (view === 'organization' && profile.role !== 'organization') return 'home';
    return view;
  };

  const currentView = allowedView();

  return (
    <div className="min-h-screen pb-10">
      <Header activeView={currentView} onNavigate={handleNavigate} />

      <main className="animate-fade-in-up">
        {currentView === 'home' && (
          <HomeView
            onExplore={() => setView('explore')}
            onCategorySelect={handleCategorySelect}
            onDonateWater={() => setShowDonationFlow(true)}
          />
        )}
        {currentView === 'explore' && (
          <ExploreView
            initialCategory={initialCategory}
            onDonate={handleDonate}
            onViewDetails={handleViewDetails}
          />
        )}
        {currentView === 'impact' && <ImpactView />}
        {currentView === 'admin' && profile.role === 'admin' && <AdminDashboard />}
        {currentView === 'organization' && profile.role === 'organization' && <OrganizationDashboard />}
      </main>

      <DonateModal
        project={donateProject}
        onClose={() => setDonateProject(null)}
        onDonated={handleDonated}
      />

      <ProjectDetailModal
        project={detailProject}
        onClose={() => setDetailProject(null)}
        onDonate={handleDonate}
      />

      {showDonationFlow && (
        <DonationFlow
          onClose={() => setShowDonationFlow(false)}
          onComplete={handleDonated}
        />
      )}

      <footer className="mx-auto max-w-7xl border-t border-slate-200 px-4 py-6 text-center text-xs text-slate-500">
        {tr('OmanCare — One Platform. Every Good Cause.', 'عُمان كير — منصة واحدة لكل عمل خيري.')}
      </footer>
    </div>
  );
}

/** Re-renders the whole tree when the language changes so every tr() call picks it up. */
function LanguageRoot({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(getLang());
  useEffect(() => onLangChange(setLangState), []);
  return <Fragment key={lang}>{children}</Fragment>;
}

function App() {
  return (
    <LanguageRoot>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageRoot>
  );
}

export default App;
