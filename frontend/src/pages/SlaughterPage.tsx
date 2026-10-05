import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CheckCircle, XCircle, ShieldCheck, MapPin, User, Beef, Clock } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending_authorization: 'bg-orange-100 text-orange-800',
    authorized: 'bg-blue-100 text-blue-800',
    completed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-600',
    scheduled: 'bg-yellow-100 text-yellow-800',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

const fmtLocation = (parts: (string | null | undefined)[]) =>
  parts.filter(Boolean).join(', ') || '—';

const SlaughterPage: React.FC = () => {
  const { t, language: L } = useLanguage();
  const { user } = useAuth();
  const role = user?.role || '';
  const canRegister = ['admin', 'government', 'slaughterhouse'].includes(role);
  const canAuthorize = ['admin', 'government', 'vet'].includes(role);
  const canConfirm = ['admin', 'slaughterhouse'].includes(role);

  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [authId, setAuthId] = useState<string | null>(null);
  const [authNotes, setAuthNotes] = useState('');
  const [form, setForm] = useState({ cow_id: '', scheduled_date: '', reason: '', notes: '' });
  const [confirmForm, setConfirmForm] = useState({ slaughter_date: '', meat_weight_kg: '' });
  const [banner, setBanner] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['slaughter', statusFilter],
    queryFn: () => api.get('/slaughter', { params: { status: statusFilter || undefined } }).then(r => r.data),
  });

  const { data: cowsData } = useQuery({
    queryKey: ['cows-active'],
    queryFn: () => api.get('/cows', { params: { status: 'active' } }).then(r => r.data),
  });

  const selectedCow = useMemo(
    () => cowsData?.cows?.find((c: any) => c.id === form.cow_id),
    [cowsData, form.cow_id]
  );

  const scheduleMutation = useMutation({
    mutationFn: (payload: any) => api.post('/slaughter', payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['slaughter'] });
      setShowForm(false);
      setForm({ cow_id: '', scheduled_date: '', reason: '', notes: '' });
      setBanner(res?.data?.message || (L === 'en' ? '✅ Registered.' : '✅ Byanditswe.'));
      setTimeout(() => setBanner(''), 5000);
    },
  });

  const authorizeMutation = useMutation({
    mutationFn: ({ id, decision, notes }: any) => api.put(`/slaughter/${id}/authorize`, { decision, notes }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['slaughter'] });
      queryClient.invalidateQueries({ queryKey: ['slaughter-auth-count'] });
      setAuthId(null); setAuthNotes('');
      setBanner(res?.data?.message || 'Done.');
      setTimeout(() => setBanner(''), 5000);
    },
  });

  const confirmMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.put(`/slaughter/${id}/confirm`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['slaughter'] }); setConfirmId(null); },
    onError: (err: any) => {
      setBanner('⚠️ ' + (err?.response?.data?.error || 'Failed'));
      setConfirmId(null);
      setTimeout(() => setBanner(''), 6000);
    },
  });

  const authLabel = (s: string) =>
    s === 'authorized' ? (L === 'en' ? 'Vet Authorized' : 'Muganga Yaremeje')
    : s === 'rejected' ? (L === 'en' ? 'Vet Rejected' : 'Muganga Yabyanze')
    : (L === 'en' ? 'Awaiting Vet' : 'Itegereje Muganga');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('slaughterTitle')}</h1>
        {canRegister && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-red-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-800">
            <Plus size={16} /> {t('scheduleSlaughter')}
          </button>
        )}
      </div>

      {/* Workflow explainer */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-800 flex items-center gap-2 flex-wrap">
        <span className="font-semibold">{L === 'en' ? 'Workflow:' : 'Uko bigenda:'}</span>
        <span className="bg-white px-2 py-0.5 rounded-full border border-blue-200">1. {L === 'en' ? 'Slaughterhouse registers' : 'Ababaga barayandika'}</span>
        <span>→</span>
        <span className="bg-white px-2 py-0.5 rounded-full border border-blue-200">2. {L === 'en' ? 'Vet authorizes' : 'Muganga aremeza'}</span>
        <span>→</span>
        <span className="bg-white px-2 py-0.5 rounded-full border border-blue-200">3. {L === 'en' ? 'Slaughter confirmed' : 'Kubaga biremezwa'}</span>
      </div>

      {banner && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2.5 rounded-xl text-sm">
          {banner}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {['', 'pending_authorization', 'authorized', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${statusFilter === s ? 'bg-gray-800 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {s ? t(s) || s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      {/* Records */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? <div className="text-center py-12 text-gray-400">{t('loading')}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {[
                    t('tagNumber'), t('owner'),
                    (L === 'en' ? 'Origin' : 'Inkomoko'),
                    (L === 'en' ? 'Vet Authorization' : 'Uruhushya rwa Muganga'),
                    t('status'),
                    (L === 'en' ? 'Action' : 'Igikorwa'),
                  ].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.records?.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">{t('noData')}</td></tr>
                )}
                {data?.records?.map((r: any) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-red-700">{r.tag_number}</td>
                    <td className="px-4 py-3">
                      <div>{r.owner_name || '—'}</div>
                      {r.owner_phone && <div className="text-xs text-gray-400">{r.owner_phone}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-700">{r.origin_district || '—'}</div>
                      <div className="text-xs text-gray-400">{fmtLocation([r.origin_village, r.origin_sector])}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.authorization_status === 'authorized' ? 'bg-blue-100 text-blue-800'
                        : r.authorization_status === 'rejected' ? 'bg-gray-200 text-gray-700'
                        : 'bg-orange-100 text-orange-800'
                      }`} title={r.authorization_notes || ''}>
                        {authLabel(r.authorization_status)}
                      </span>
                      {r.authorized_by_name && (
                        <div className="text-xs text-gray-400 mt-0.5">{r.authorized_by_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(r.status)}`}>
                        {t(r.status) || r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {/* Vet: authorize pending requests */}
                      {canAuthorize && r.authorization_status === 'pending' && (
                        <button onClick={() => { setAuthId(r.id); setAuthNotes(''); }}
                          className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 whitespace-nowrap">
                          <ShieldCheck size={14} /> {L === 'en' ? 'Review' : 'Suzuma'}
                        </button>
                      )}
                      {/* Slaughterhouse: confirm only when authorized */}
                      {canConfirm && r.authorization_status === 'authorized' && r.status !== 'completed' && (
                        <button onClick={() => setConfirmId(r.id)}
                          className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 whitespace-nowrap">
                          <CheckCircle size={14} /> {t('confirmSlaughter')}
                        </button>
                      )}
                      {/* Waiting indicator for slaughterhouse */}
                      {canConfirm && r.authorization_status === 'pending' && (
                        <span className="flex items-center gap-1 text-xs text-orange-500 whitespace-nowrap">
                          <Clock size={13} /> {L === 'en' ? 'Awaiting vet' : 'Itegereje muganga'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
              <h2 className="font-bold text-lg">{t('scheduleSlaughter')}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); scheduleMutation.mutate(form); }} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600">{t('cows')} *</label>
                <select required value={form.cow_id} onChange={e => setForm({ ...form, cow_id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5">
                  <option value="">{L === 'en' ? '-- Select the cow --' : '-- Hitamo inka --'}</option>
                  {cowsData?.cows?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.tag_number} {c.name ? `(${c.name})` : ''} — {c.owner_name || '—'}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCow && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                    {L === 'en' ? 'This cow comes from' : 'Iyi nka ikomoka'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1.5"><Beef size={13} className="text-amber-600" />
                      <span>{selectedCow.breed || '—'} · {selectedCow.gender ? t(selectedCow.gender) : '—'}</span></div>
                    <div className="flex items-center gap-1.5"><span className="text-amber-600">⚖️</span>
                      <span>{selectedCow.weight_kg ? `${selectedCow.weight_kg} kg` : '—'}</span></div>
                    <div className="flex items-center gap-1.5 col-span-2"><User size={13} className="text-amber-600" />
                      <span>{selectedCow.owner_name || '—'}{selectedCow.owner_phone ? ` · ${selectedCow.owner_phone}` : ''}</span></div>
                    <div className="flex items-start gap-1.5 col-span-2"><MapPin size={13} className="text-amber-600 mt-0.5" />
                      <span>{fmtLocation([selectedCow.village, selectedCow.cell, selectedCow.sector, selectedCow.district, selectedCow.province])}</span></div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-600">
                  {L === 'en' ? 'Date brought in' : 'Itariki yazanywe'}
                </label>
                <input type="date" value={form.scheduled_date}
                  onChange={e => setForm({ ...form, scheduled_date: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">{L === 'en' ? 'Reason' : 'Impamvu'}</label>
                <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder={L === 'en' ? 'e.g. Commercial, age, injury' : 'urugero: Ubucuruzi, imyaka'}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" />
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-xs text-orange-700">
                ⚠️ {L === 'en'
                  ? 'A veterinarian must authorize this before the cow can be slaughtered.'
                  : 'Muganga agomba kubyemeza mbere y\'uko inka ibagwa.'}
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

      {/* Vet authorization modal */}
      {authId && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="text-blue-600" size={20} />
              <h2 className="font-bold text-lg text-gray-800">
                {L === 'en' ? 'Veterinary Review' : 'Isuzuma rya Muganga'}
              </h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {L === 'en'
                ? 'Authorize this cow for slaughter, or reject it.'
                : "Emeza ko iyi nka ibagwa, cyangwa uyange."}
            </p>
            <textarea value={authNotes} onChange={e => setAuthNotes(e.target.value)} rows={3}
              placeholder={L === 'en' ? 'Inspection notes (optional)' : "Ibyagaragaye mu isuzuma (si itegeko)"}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4" />
            <div className="flex gap-2">
              <button
                onClick={() => authorizeMutation.mutate({ id: authId, decision: 'authorized', notes: authNotes })}
                disabled={authorizeMutation.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg disabled:opacity-60">
                <CheckCircle size={15} /> {L === 'en' ? 'Authorize' : 'Emeza'}
              </button>
              <button
                onClick={() => authorizeMutation.mutate({ id: authId, decision: 'rejected', notes: authNotes })}
                disabled={authorizeMutation.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm font-medium py-2 rounded-lg">
                <XCircle size={15} /> {L === 'en' ? 'Reject' : 'Anga'}
              </button>
            </div>
            <button onClick={() => setAuthId(null)} className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700">
              {t('cancel')}
            </button>
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
                  onChange={e => setConfirmForm({ ...confirmForm, slaughter_date: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">{t('meatWeight')}</label>
                <input type="number" value={confirmForm.meat_weight_kg}
                  onChange={e => setConfirmForm({ ...confirmForm, meat_weight_kg: e.target.value })}
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
