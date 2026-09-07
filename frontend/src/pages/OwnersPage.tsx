import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Phone, Beef } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

const RWANDA_PROVINCES = ['Kigali', 'Northern', 'Southern', 'Eastern', 'Western'];

const OwnersPage: React.FC = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    national_id: '', full_name: '', phone: '', email: '',
    location: { province: '', district: '', sector: '', cell: '', village: '' }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['owners', search],
    queryFn: () => api.get('/owners', { params: { search: search || undefined } }).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/owners', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owners'] });
      setShowForm(false);
      setForm({ national_id: '', full_name: '', phone: '', email: '',
        location: { province: '', district: '', sector: '', cell: '', village: '' } });
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('owners')}</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800">
          <Plus size={16} /> {t('addOwner')}
        </button>
      </div>

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
        <Search size={16} className="text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={t('search')} className="flex-1 text-sm outline-none" />
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">{t('loading')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data?.owners?.length === 0 && (
            <div className="col-span-3 text-center py-12 text-gray-400">{t('noData')}</div>
          )}
          {data?.owners?.map((owner: any) => (
            <div key={owner.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{owner.full_name}</h3>
                  <p className="text-xs text-gray-400 font-mono">{owner.national_id}</p>
                </div>
                <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                  <Beef size={12} />
                  <span>{owner.cow_count} {t('cows')}</span>
                </div>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-gray-400" />
                  <span>{owner.phone}</span>
                </div>
                {owner.district && (
                  <p className="text-xs text-gray-400">
                    📍 {[owner.village, owner.sector, owner.district, owner.province].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Owner Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
              <h2 className="font-bold text-lg">{t('addOwner')}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="p-6 space-y-4">
              {createMutation.isError && (
                <div className="bg-red-50 text-red-700 px-4 py-2 rounded text-sm">
                  {(createMutation.error as any)?.response?.data?.error || 'Error'}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('fullName')} *</label>
                  <input required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('nationalId')} *</label>
                  <input required value={form.national_id} onChange={e => setForm({...form, national_id: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('phone')} *</label>
                  <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('email')}</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">{t('location')}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600">{t('province')}</label>
                    <select value={form.location.province}
                      onChange={e => setForm({...form, location: {...form.location, province: e.target.value}})}
                      className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5">
                      <option value="">-- Select --</option>
                      {RWANDA_PROVINCES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  {(['district','sector','cell','village'] as const).map(f => (
                    <div key={f}>
                      <label className="text-xs text-gray-600 capitalize">{t(f)}</label>
                      <input value={(form.location as any)[f]}
                        onChange={e => setForm({...form, location: {...form.location, [f]: e.target.value}})}
                        className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg">{t('cancel')}</button>
                <button type="submit" disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm bg-green-700 text-white rounded-lg disabled:opacity-60">
                  {createMutation.isPending ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnersPage;
