import { useState, useCallback } from 'react';
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

function AppContent() {
  const { profile, loading } = useAuth();
  const [view, setView] = useState<View>('home');
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
  }, []);

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

      <footer className="mx-auto max-w-7xl px-4 py-8 text-center">
        <div className="glass-card rounded-2xl px-6 py-4">
          <p className="text-sm font-semibold text-slate-700">
            OmanCare — One Platform. Every Good Cause.
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Find a Need. Choose a Place. Make an Impact. · Water Near Me · Help Near Me · Impact You Can Track.
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
