import React, { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Beef, Syringe, Scissors, ArrowLeftRight, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

const StatCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode; color: string }> = ({
  label, value, icon, color
}) => (
  <div className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className="text-gray-300">{icon}</div>
    </div>
  </div>
);

const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  // On mount: clear demo_mode so real backend data is used
  useEffect(() => {
    localStorage.removeItem('demo_mode');
    // Force fresh fetch every time dashboard loads
    queryClient.invalidateQueries({ queryKey: ['cow-stats'] });
    queryClient.invalidateQueries({ queryKey: ['upcoming-vaccinations'] });
    queryClient.invalidateQueries({ queryKey: ['scheduled-slaughter'] });
  }, []);

  const { data: stats, isLoading, refetch: refetchStats } = useQuery({
    queryKey: ['cow-stats'],
    queryFn: () => api.get('/cows/stats').then(r => r.data),
    staleTime: 0,        // always consider stale so it refetches
    refetchOnMount: true,
  });

  const { data: upcomingVaccines } = useQuery({
    queryKey: ['upcoming-vaccinations'],
    queryFn: () => api.get('/vaccinations?upcoming=true').then(r => r.data),
    staleTime: 0,
    refetchOnMount: true,
  });

  const { data: scheduledSlaughter } = useQuery({
    queryKey: ['scheduled-slaughter'],
    queryFn: () => api.get('/slaughter?status=scheduled').then(r => r.data),
    staleTime: 0,
    refetchOnMount: true,
  });

  const handleRefresh = () => {
    localStorage.removeItem('demo_mode');
    queryClient.invalidateQueries();
  };

  // Parse safely — handles both number and string from SQLite
  const n = (v: unknown) => {
    const parsed = parseInt(String(v ?? '0'), 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  return (
    <div className="space-y-6">

      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('dashboard')}</h1>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label={t('totalCows')}
          value={isLoading ? '…' : n(stats?.total_active)}
          icon={<Beef size={32} />}
          color="border-green-500"
        />
        <StatCard
          label={t('totalVaccinated')}
          value={isLoading ? '…' : n(stats?.total_vaccinated)}
          icon={<Syringe size={32} />}
          color="border-blue-500"
        />
        <StatCard
          label={t('totalSlaughtered')}
          value={isLoading ? '…' : n(stats?.total_slaughtered)}
          icon={<Scissors size={32} />}
          color="border-red-500"
        />
        <StatCard
          label={t('totalSold')}
          value={isLoading ? '…' : n(stats?.total_sold)}
          icon={<ArrowLeftRight size={32} />}
          color="border-yellow-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Cows by district */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">{t('cowsByDistrict')}</h2>
          {stats?.by_district?.length > 0 ? (
            <div className="space-y-3">
              {stats.by_district.slice(0, 8).map((d: any) => {
                const total = n(stats?.total_active) || 1;
                const count = n(d.count);
                return (
                  <div key={d.district} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-32 truncate">{d.district}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min((count / total) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">{t('noData')}</p>
          )}
        </div>

        {/* Upcoming vaccinations */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">{t('upcomingVaccinations')}</h2>
          {upcomingVaccines?.vaccinations?.length > 0 ? (
            <div className="space-y-2">
              {upcomingVaccines.vaccinations.slice(0, 6).map((v: any) => (
                <div key={v.id} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{v.tag_number} — {v.cow_name}</p>
                    <p className="text-xs text-gray-400">{v.vaccine_name}</p>
                  </div>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                    {v.next_due_date}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">{t('noData')}</p>
          )}
        </div>

        {/* Scheduled slaughters */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-700 mb-4">{t('slaughterTitle')}</h2>
          {scheduledSlaughter?.records?.length > 0 ? (
            <div className="space-y-2">
              {scheduledSlaughter.records.slice(0, 6).map((s: any) => (
                <div key={s.id} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{s.tag_number} — {s.cow_name}</p>
                    <p className="text-xs text-gray-400">{s.owner_name}</p>
                  </div>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                    {s.scheduled_date}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">{t('noData')}</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
