import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Beef, Users, Syringe, Baby,
  Scissors, ArrowLeftRight, LogOut, Menu, X, Globe,
  Download, Shield, ClipboardCheck
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { isDemoMode } from '../services/api';

// Role-based nav visibility
const NAV_PERMISSIONS: Record<string, string[]> = {
  dashboard:   ['admin','government','vet','farmer','slaughterhouse'],
  cows:        ['admin','government','vet','farmer','slaughterhouse'],
  approvals:   ['admin','government'],
  owners:      ['admin','government','vet'],
  vaccinations:['admin','government','vet','farmer'],
  offspring:   ['admin','government','vet','farmer'],
  slaughter:   ['admin','government','slaughterhouse'],
  transfers:   ['admin','government','farmer'],
  export:      ['admin','government','vet','farmer'],
};

const canAccess = (page: string, role: string) =>
  (NAV_PERMISSIONS[page] || []).includes(role);

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const role = user?.role || 'farmer';
  const isReviewer = role === 'admin' || role === 'government';

  // Live count of cows awaiting approval (reviewers only)
  const { data: pendingData } = useQuery({
    queryKey: ['pending-count'],
    queryFn: () => api.get('/cows/pending/count').then(r => r.data),
    enabled: isReviewer,
    refetchInterval: 30000, // refresh every 30s
  });
  const pendingCount = pendingData?.count || 0;

  const allNavItems = [
    { to: '/dashboard',   icon: LayoutDashboard, key: 'dashboard',    label: t('dashboard') },
    { to: '/cows',        icon: Beef,            key: 'cows',         label: t('cows') },
    { to: '/approvals',   icon: ClipboardCheck,  key: 'approvals',    label: t('approvals'), badge: pendingCount },
    { to: '/owners',      icon: Users,           key: 'owners',       label: t('owners') },
    { to: '/vaccinations',icon: Syringe,         key: 'vaccinations', label: t('vaccinations') },
    { to: '/offspring',   icon: Baby,            key: 'offspring',    label: t('offspring') },
    { to: '/slaughter',   icon: Scissors,        key: 'slaughter',    label: t('slaughter') },
    { to: '/transfers',   icon: ArrowLeftRight,  key: 'transfers',    label: t('transfers') },
    { to: '/export',      icon: Download,        key: 'export',       label: language === 'en' ? 'Export & Backup' : 'Kopa & Sobeka' },
  ];

  const navItems = allNavItems.filter(item => canAccess(item.key, role));

  const roleColors: Record<string, string> = {
    admin:         'text-yellow-300',
    government:    'text-blue-300',
    vet:           'text-green-300',
    farmer:        'text-lime-300',
    slaughterhouse:'text-red-300',
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-green-900 text-white flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:inset-0`}>

        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 bg-green-950 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐄</span>
            <span className="font-bold text-lg">{t('appNameShort')}</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden"><X size={20} /></button>
        </div>

        {/* Role badge */}
        <div className="px-4 py-2 bg-green-950/50 border-b border-green-800 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className={roleColors[role] || 'text-green-300'} />
            <span className={`text-xs font-semibold capitalize ${roleColors[role] || 'text-green-300'}`}>
              {role === 'slaughterhouse' ? 'Slaughterhouse' : role.charAt(0).toUpperCase() + role.slice(1)}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, badge }: any) => (
            <NavLink key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-green-700 text-white' : 'text-green-100 hover:bg-green-800'}`
              }>
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span className="bg-yellow-400 text-green-950 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-green-800 flex-shrink-0">
          <p className="text-xs text-green-300 truncate font-semibold">{user?.full_name}</p>
          <p className="text-xs text-green-500 truncate">{user?.email}</p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shadow-sm flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu size={22} /></button>
          <h1 className="text-sm font-semibold text-gray-600 hidden md:block">{t('appName')}</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setLanguage(language === 'en' ? 'rw' : 'en')}
              className="flex items-center gap-1 text-sm px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-100">
              <Globe size={14} />
              {language === 'en' ? 'Kinyarwanda' : 'English'}
            </button>
            <button onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800">
              <LogOut size={16} />
              <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {isDemoMode() && (
            <div className="mb-4 bg-amber-50 border border-amber-300 text-amber-800 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">
              <span className="text-lg">🎭</span>
              <span><strong>Demo Mode</strong> — Backend offline. Showing sample data. Run the backend to use real data.</span>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
