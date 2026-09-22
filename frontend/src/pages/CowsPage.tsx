import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';

const RWANDA_PROVINCES = ['Kigali', 'Northern', 'Southern', 'Eastern', 'Western'];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    sold: 'bg-blue-100 text-blue-800',
    slaughtered: 'bg-red-100 text-red-800',
    dead: 'bg-gray-100 text-gray-800',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
};

const CowsPage: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const isFarmer = user?.role === 'farmer';

  const [form, setForm] = useState({
    tag_number: '', name: '', breed: '', gender: 'female',
    date_of_birth: '', color: '', weight_kg: '', notes: '',
    current_owner_id: '',
    location: { province: '', district: '', sector: '', cell: '', village: '', latitude: '', longitude: '' }
  });

  const { data, isLoading } = useQuery({
    queryKey: ['cows', search, statusFilter],
    queryFn: () => api.get('/cows', { params: { search, status: statusFilter || undefined } }).then(r => r.data),
  });

  const { data: ownersData } = useQuery({
    queryKey: ['owners-list'],
    queryFn: () => api.get('/owners').then(r => r.data),
  });

  const [formError, setFormError] = useState('');
  const [banner, setBanner] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/cows', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['cows'] });
      queryClient.invalidateQueries({ queryKey: ['cow-stats'] });
      setShowForm(false);
      setFormError('');
      // Farmer submissions are pending approval — inform them
      const msg = res?.data?.message;
      if (msg) { setBanner(msg); setTimeout(() => setBanner(''), 6000); }
      setForm({
        tag_number: '', name: '', breed: '', gender: 'female',
        date_of_birth: '', color: '', weight_kg: '', notes: '', current_owner_id: '',
        location: { province: '', district: '', sector: '', cell: '', village: '', latitude: '', longitude: '' }
      });
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.error || 'Failed to save cow. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    // Farmers don't select an owner — the backend assigns it automatically
    if (!isFarmer && !form.current_owner_id) {
      setFormError('Please select an owner for this cow.');
      return;
    }
    createMutation.mutate({
      ...form,
      current_owner_id: isFarmer ? undefined : form.current_owner_id,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      location: form.location.district ? form.location : null,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('cows')}</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800"
        >
          <Plus size={16} /> {t('addCow')}
        </button>
      </div>

      {/* Submission banner (e.g. "submitted for approval") */}
      {banner && (
        <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
          <span>⏳</span><span>{banner}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-48">
          <Search size={16} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search')}
            className="flex-1 text-sm outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="">{t('status')}: All</option>
          <option value="active">{t('active')}</option>
          <option value="sold">{t('sold')}</option>
          <option value="slaughtered">{t('slaughtered')}</option>
          <option value="dead">{t('dead')}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">{t('loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[t('tagNumber'), t('name'), t('breed'), t('gender'), t('owner'), t('location'), t('status'), ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.cows?.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-10 text-gray-400">{t('noData')}</td></tr>
                )}
                {data?.cows?.map((cow: any) => (
                  <tr key={cow.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-green-700">{cow.tag_number}</td>
                    <td className="px-4 py-3">{cow.name || '—'}</td>
                    <td className="px-4 py-3">{cow.breed || '—'}</td>
                    <td className="px-4 py-3 capitalize">{cow.gender ? t(cow.gender) : '—'}</td>
                    <td className="px-4 py-3">{cow.owner_name || '—'}</td>
                    <td className="px-4 py-3">{cow.district ? `${cow.district}${cow.sector ? ', ' + cow.sector : ''}` : '—'}</td>
                    <td className="px-4 py-3">
                      {cow.approval_status && cow.approval_status !== 'approved' ? (
                        <span
                          title={cow.approval_status === 'rejected' ? cow.rejection_reason : ''}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            cow.approval_status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {cow.approval_status === 'pending'
                            ? (t('pending') || 'Pending')
                            : (t('rejected') || 'Rejected')}
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(cow.status)}`}>
                          {t(cow.status)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/cows/${cow.id}`)}
                        className="flex items-center gap-1 text-green-700 hover:text-green-900 text-xs"
                      >
                        <Eye size={14} /> {t('view')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Cow Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center">
              <h2 className="font-bold text-lg text-gray-800">{t('addCow')}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  ⚠️ {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('tagNumber')} *</label>
                  <input required value={form.tag_number} onChange={e => setForm({...form, tag_number: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('name')}</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('breed')}</label>
                  <input value={form.breed} onChange={e => setForm({...form, breed: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('gender')}</label>
                  <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="female">{t('female')}</option>
                    <option value="male">{t('male')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('dateOfBirth')}</label>
                  <input type="date" value={form.date_of_birth} onChange={e => setForm({...form, date_of_birth: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('color')}</label>
                  <input value={form.color} onChange={e => setForm({...form, color: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{t('weight')}</label>
                  <input type="number" value={form.weight_kg} onChange={e => setForm({...form, weight_kg: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                {!isFarmer && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t('owner')} *</label>
                    <select value={form.current_owner_id} onChange={e => setForm({...form, current_owner_id: e.target.value})}
                      className="w-full border rounded-lg px-3 py-2 text-sm">
                      <option value="">-- Select Owner --</option>
                      {ownersData?.owners?.map((o: any) => (
                        <option key={o.id} value={o.id}>{o.full_name} ({o.national_id})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {isFarmer && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-xs px-3 py-2 rounded-lg">
                  ℹ️ This cow will be registered under your account automatically.
                </div>
              )}

              {/* Location */}
              <div className="border-t pt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">{t('location')}</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['province','district','sector','cell','village'] as const).map(field => (
                    <div key={field}>
                      <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{t(field)}</label>
                      {field === 'province' ? (
                        <select value={form.location.province}
                          onChange={e => setForm({...form, location: {...form.location, province: e.target.value}})}
                          className="w-full border rounded-lg px-3 py-2 text-sm">
                          <option value="">-- Select --</option>
                          {RWANDA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      ) : (
                        <input value={(form.location as any)[field]}
                          onChange={e => setForm({...form, location: {...form.location, [field]: e.target.value}})}
                          className="w-full border rounded-lg px-3 py-2 text-sm" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('notes')}</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  rows={2} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={createMutation.isPending}
                  className="px-4 py-2 text-sm bg-green-700 text-white rounded-lg hover:bg-green-800 disabled:opacity-60">
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

export default CowsPage;
