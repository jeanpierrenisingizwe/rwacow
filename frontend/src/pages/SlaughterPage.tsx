import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CheckCircle } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    scheduled: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-600',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

const SlaughterPage: React.FC = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [confirmId, setConfirmId] = useState<string|null>(null);
  const [form, setForm] = useState({ cow_id: '', scheduled_date: '', reason: '', notes: '' });
  const [confirmForm, setConfirmForm] = useState({ slaughter_date: '', meat_weight_kg: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['slaughter', statusFilter],
    queryFn: () => api.get('/slaughter', { params: { status: statusFilter || undefined } }).then(r => r.data),
  });

  const { data: cowsData } = useQuery({
    queryKey: ['cows-active'],
    queryFn: () => api.get('/cows', { params: { status: 'active' } }).then(r => r.data),
  });

  const scheduleMutation = useMutation({
    mutationFn: (data: any) => api.post('/slaughter', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['slaughter'] }); setShowForm(false); }
  });

  const confirmMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/slaughter/${id}/confirm`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['slaughter'] }); setConfirmId(null); }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('slaughterTitle')}</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-800">
          <Plus size={16} /> {t('scheduleSlaughter')}
        </button>
      </div>

      <div className="flex gap-3">
        {['', 'scheduled', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${statusFilter === s ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {s ? t(s) : 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? <div className="text-center py-12 text-gray-400">{t('loading')}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {[t('tagNumber'), t('owner'), t('scheduledDate'), t('slaughterDate'), t('meatWeight'), t('status'), ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.records?.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">{t('noData')}</td></tr>
                )}
                {data?.records?.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-red-700">{r.tag_number}</td>
                    <td className="px-4 py-3">{r.owner_name || '—'}</td>
                    <td className="px-4 py-3">{r.scheduled_date || '—'}</td>
                    <td className="px-4 py-3">{r.slaughter_date || '—'}</td>
                    <td className="px-4 py-3">{r.meat_weight_kg ? `${r.meat_weight_kg} kg` : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(r.status)}`}>
                        {t(r.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'scheduled' && (
                        <button onClick={() => setConfirmId(r.id)}
                          className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900">
                          <CheckCircle size={14} /> {t('confirmSlaughter')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="border-b px-6 py-4 flex justify-between">
              <h2 className="font-bold text-lg">{t('scheduleSlaughter')}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); scheduleMutation.mutate(form); }} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600">{t('cows')} *</label>
                <select required value={form.cow_id} onChange={e => setForm({...form, cow_id: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5">
                  <option value="">-- Select Cow --</option>
                  {cowsData?.cows?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.tag_number} {c.name ? `(${c.name})` : ''} — {c.owner_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">{t('scheduledDate')}</label>
                <input type="date" value={form.scheduled_date}
                  onChange={e => setForm({...form, scheduled_date: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Reason</label>
                <input value={form.reason} onChange={e => setForm({...form, reason: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm border rounded-lg">{t('cancel')}</button>
                <button type="submit" disabled={scheduleMutation.isPending}
                  className="px-4 py-2 text-sm bg-red-700 text-white rounded-lg disabled:opacity-60">
                  {scheduleMutation.isPending ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm slaughter modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="border-b px-6 py-4 flex justify-between">
              <h2 className="font-bold text-lg text-red-700">{t('confirmSlaughter')}</h2>
              <button onClick={() => setConfirmId(null)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); confirmMutation.mutate({ id: confirmId, data: confirmForm }); }}
              className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600">{t('slaughterDate')} *</label>
                <input type="date" required value={confirmForm.slaughter_date}
                  onChange={e => setConfirmForm({...confirmForm, slaughter_date: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">{t('meatWeight')}</label>
                <input type="number" value={confirmForm.meat_weight_kg}
                  onChange={e => setConfirmForm({...confirmForm, meat_weight_kg: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setConfirmId(null)}
                  className="px-4 py-2 text-sm border rounded-lg">{t('cancel')}</button>
                <button type="submit" disabled={confirmMutation.isPending}
                  className="px-4 py-2 text-sm bg-red-700 text-white rounded-lg disabled:opacity-60">
                  {confirmMutation.isPending ? t('loading') : t('confirmSlaughter')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlaughterPage;
