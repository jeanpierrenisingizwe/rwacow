import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './i18n/LanguageContext';
import Layout from './components/Layout';
import WelcomePage from './pages/WelcomePage';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import DashboardPage from './pages/DashboardPage';
import CowsPage from './pages/CowsPage';
import CowDetailPage from './pages/CowDetailPage';
import OwnersPage from './pages/OwnersPage';
import VaccinationsPage from './pages/VaccinationsPage';
import OffspringPage from './pages/OffspringPage';
import SlaughterPage from './pages/SlaughterPage';
import TransfersPage from './pages/TransfersPage';
import ExportPage from './pages/ExportPage';
import ApprovalsPage from './pages/ApprovalsPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 } }
});

// Role permissions for frontend route guarding
const ROUTE_ROLES: Record<string, string[]> = {
  owners:      ['admin', 'government', 'vet'],
  slaughter:   ['admin', 'government', 'slaughterhouse', 'vet'],
  transfers:   ['admin', 'government', 'farmer'],
  export:      ['admin', 'government', 'vet', 'farmer'],
  approvals:   ['admin', 'government'],
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; page?: string }> = ({ children, page }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-green-950">
        <div className="text-center text-white">
          <div className="text-5xl mb-4">🐄</div>
          <p className="text-green-300 animate-pulse">Loading RwaCow…</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  // Check page-level role restriction
  if (page && ROUTE_ROLES[page] && !ROUTE_ROLES[page].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<WelcomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected — all inside Layout */}
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="dashboard"    element={<DashboardPage />} />
                <Route path="cows"         element={<CowsPage />} />
                <Route path="cows/:id"     element={<CowDetailPage />} />
                <Route path="vaccinations" element={<VaccinationsPage />} />
                <Route path="offspring"    element={<OffspringPage />} />

                <Route path="owners"    element={
                  <ProtectedRoute page="owners"><OwnersPage /></ProtectedRoute>
                } />
                <Route path="slaughter" element={
                  <ProtectedRoute page="slaughter"><SlaughterPage /></ProtectedRoute>
                } />
                <Route path="transfers" element={
                  <ProtectedRoute page="transfers"><TransfersPage /></ProtectedRoute>
                } />
                <Route path="export" element={
                  <ProtectedRoute page="export"><ExportPage /></ProtectedRoute>
                } />
                <Route path="approvals" element={
                  <ProtectedRoute page="approvals"><ApprovalsPage /></ProtectedRoute>
                } />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
