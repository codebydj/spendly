import React, { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { AppProvider, useApp } from './context/AppContext';
import { DesktopSidebar } from './components/layout/DesktopSidebar';
import { MobileNav } from './components/layout/MobileNav';
import { Header } from './components/layout/Header';
import { SpendlyLogo } from './components/ui/SpendlyLogo';
import { ToastContainer } from './components/ui/Toast';
import { AddTransactionModal } from './components/forms/AddTransactionModal';
import { AddAccountModal } from './components/forms/AddAccountModal';
import { AddBudgetModal } from './components/forms/AddBudgetModal';
import { AddRecurringModal } from './components/forms/AddRecurringModal';
import { PinLockModal } from './components/forms/PinLockModal';
import { UpdateModal } from './components/modals/UpdateModal';

import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { AccountsView } from './views/AccountsView';
import { BudgetsView } from './views/BudgetsView';
import { AnalyticsView } from './views/AnalyticsView';
import { RecurringView } from './views/RecurringView';
import { CalendarView } from './views/CalendarView';
import { MapsView } from './views/MapsView';
import { NotificationsView } from './views/NotificationsView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';
import { SignupView } from './views/SignupView';
import { UpdatePasswordView } from './views/UpdatePasswordView';
import { LinkExpiredView } from './views/LinkExpiredView';

const MainContentRouter: React.FC = () => {
  const { currentView } = useApp();

  switch (currentView) {
    case 'dashboard':
      return <DashboardView />;
    case 'transactions':
      return <TransactionsView />;
    case 'accounts':
      return <AccountsView />;
    case 'budgets':
      return <BudgetsView />;
    case 'analytics':
      return <AnalyticsView />;
    case 'recurring':
      return <RecurringView />;
    case 'calendar':
      return <CalendarView />;
    case 'maps':
      return <MapsView />;
    case 'notifications':
      return <NotificationsView />;
    case 'settings':
      return <SettingsView />;
    case 'login':
      return <LoginView />;
    case 'signup':
      return <SignupView />;
    case 'update-password':
      return <UpdatePasswordView />;
    case 'link-expired':
      return <LinkExpiredView />;
    default:
      return <DashboardView />;
  }
};

const AppShell: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    user,
    authLoading,
    isAddTransactionOpen,
    setIsAddTransactionOpen,
    isAddAccountOpen,
    setIsAddAccountOpen,
    isAddBudgetOpen,
    setIsAddBudgetOpen,
    isAddRecurringOpen,
    setIsAddRecurringOpen,
    selectedAccountIdForDetail,
    setSelectedAccountIdForDetail,
    installedVersion,
    latestManifest,
    isUpdateModalOpen,
    setIsUpdateModalOpen,
    postponeUpdate,
  } = useApp();

  // Edge-to-edge StatusBar Setup
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: '#00000000' }).catch(() => {});
    }
  }, []);

  // Capacitor Native Android Back Button Handling
  useEffect(() => {
    let listener: any;
    const setupBackButton = async () => {
      try {
        listener = await CapacitorApp.addListener('backButton', () => {
          if (isAddTransactionOpen) {
            setIsAddTransactionOpen(false);
          } else if (isAddAccountOpen) {
            setIsAddAccountOpen(false);
          } else if (isAddBudgetOpen) {
            setIsAddBudgetOpen(false);
          } else if (isAddRecurringOpen) {
            setIsAddRecurringOpen(false);
          } else if (selectedAccountIdForDetail) {
            setSelectedAccountIdForDetail(null);
          } else if (currentView !== 'dashboard' && user) {
            setCurrentView('dashboard');
          } else {
            CapacitorApp.minimizeApp();
          }
        });
      } catch (err) {
        // Fallback for non-native web browser environment
      }
    };

    setupBackButton();

    return () => {
      if (listener && typeof listener.remove === 'function') {
        listener.remove();
      }
    };
  }, [
    currentView,
    setCurrentView,
    user,
    isAddTransactionOpen,
    setIsAddTransactionOpen,
    isAddAccountOpen,
    setIsAddAccountOpen,
    isAddBudgetOpen,
    setIsAddBudgetOpen,
    isAddRecurringOpen,
    setIsAddRecurringOpen,
    selectedAccountIdForDetail,
    setSelectedAccountIdForDetail,
  ]);

  // Enforce Clean Auth Boundary Rules
  useEffect(() => {
    if (authLoading) return;

    const isAuthPage =
      currentView === 'login' ||
      currentView === 'signup' ||
      currentView === 'update-password' ||
      currentView === 'link-expired';

    if (!user && !isAuthPage) {
      setCurrentView('login');
    } else if (user && isAuthPage && currentView !== 'update-password' && currentView !== 'link-expired') {
      setCurrentView('dashboard');
    }
  }, [user, authLoading, currentView, setCurrentView]);

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          backgroundColor: 'var(--bg-dark)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
        }}
      >
        <div className="logo-float-animation">
          <SpendlyLogo type="icon" size={56} />
        </div>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Initializing Spendly...
        </span>
      </div>
    );
  }

  const isAuthPage =
    currentView === 'login' ||
    currentView === 'signup' ||
    currentView === 'update-password' ||
    currentView === 'link-expired';

  if (isAuthPage) {
    return (
      <div
        style={{
          minHeight: '100vh',
          width: '100%',
          backgroundColor: 'var(--bg-dark)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <MainContentRouter />
        </div>
        <ToastContainer />
        <UpdateModal
          isOpen={isUpdateModalOpen}
          onClose={() => setIsUpdateModalOpen(false)}
          manifest={latestManifest}
          installedVersion={installedVersion}
          onLater={postponeUpdate}
        />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Pinned Sticky Desktop Sidebar */}
      <div className="desktop-only" style={{ display: 'flex' }}>
        <DesktopSidebar />
      </div>

      {/* Main App Content Area */}
      <div className="main-content">
        <Header />
        <main className="page-container">
          <MainContentRouter />
        </main>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="mobile-only">
        <MobileNav />
      </div>

      {/* Overlays & Modals */}
      <AddTransactionModal />
      <AddAccountModal />
      <AddBudgetModal />
      <AddRecurringModal />
      <PinLockModal />
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        manifest={latestManifest}
        installedVersion={installedVersion}
        onLater={postponeUpdate}
      />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
