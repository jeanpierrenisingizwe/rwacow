import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, User, Syringe, Baby, Scissors, ArrowLeftRight, Lock } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';

const CowDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'info'|'vaccines'|'offspring'|'transfers'|'slaughter'>('info');

  // Only vets, government and admin can record vaccinations.
  // Farmers get read-only access (view vaccinations + next due date).
  const canRecordVaccination = ['admin', 'vet', 'government'].includes(user?.role || '');
  // Only admin, government and farmer can transfer ownership.
  const canTransfer = ['admin', 'government', 'farmer'].includes(user?.role || '');

  const { data: cow, isLoading } = useQuery({
    queryKey: ['cow', id],
    queryFn: () => api.get(`/cows/${id}`).then(r => r.data),
  });

  const { data: ownersData } = useQuery({
    queryKey: ['owners-list'],
    queryFn: () => api.get('/owners').then(r => r.data),
  });

  // Vaccination form
  const [vacForm, setVacForm] = useState({ vaccine_name: '', vaccination_date: '', next_due_date: '', batch_number: '', notes: '' });
  const [vacSuccess, setVacSuccess] = useState('');
  const [vacError, setVacError] = useState('');

  const vacMutation = useMutation({
    mutationFn: (data: any) => api.post('/vaccinations', { ...data, cow_id: id }),
    onSuccess: (res) => {
      // Add the new vaccination directly into the cached cow detail so it shows immediately
      queryClient.setQueryData(['cow', id], (old: any) => {
        if (!old) return old;
        const newVac = res.data?.data ?? res.data ?? {};
        const alreadyExists = old.vaccinations?.some((v: any) => v.id === newVac.id);
        return {
          ...old,
          vaccinations: alreadyExists
            ? old.vaccinations
            : [{ ...newVac, vet_name: 'You' }, ...(old.vaccinations || [])],
        };
      });
      queryClient.invalidateQueries({ queryKey: ['cow', id] });
      setVacSuccess('✅ Vaccination saved successfully!');
      setVacError('');
      setVacForm({ vaccine_name: '', vaccination_date: '', next_due_date: '', batch_number: '', notes: '' });
      setTimeout(() => setVacSuccess(''), 4000);
    },
    onError: (err: any) => {
      setVacError(err?.response?.data?.error || 'Failed to save vaccination. Please try again.');
      setVacSuccess('');
    },
  });

  // Transfer form
  const [transForm, setTransForm] = useState({ to_owner_id: '', sale_price: '', reason: 'sale', transfer_date: '', notes: '' });
  const [transSuccess, setTransSuccess] = useState('');
  const [transError, setTransError] = useState('');

  const transMutation = useMutation({
    mutationFn: (data: any) => api.post('/transfers', { ...data, cow_id: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cow', id] });
      setTransSuccess('✅ Ownership transferred successfully!');
      setTransError('');
      setTransForm({ to_owner_id: '', sale_price: '', reason: 'sale', transfer_date: '', notes: '' });
      setTimeout(() => setTransSuccess(''), 4000);
    },
    onError: (err: any) => {
      setTransError(err?.response?.data?.error || 'Transfer failed. Please try again.');
      setTransSuccess('');
    },
  });

  if (isLoading) return <div className="text-center py-20 text-gray-400">{t('loading')}</div>;
  if (!cow) return <div className="text-center py-20 text-gray-400">Cow not found</div>;

  const tabs = [
    { key: 'info', label: 'Info', icon: <User size={14}/> },
    { key: 'vaccines', label: t('vaccinations'), icon: <Syringe size={14}/> },
    { key: 'offspring', label: t('offspring'), icon: <Baby size={14}/> },
    { key: 'transfers', label: t('transfers'), icon: <ArrowLeftRight size={14}/> },
    { key: 'slaughter', label: t('slaughter'), icon: <Scissors size={14}/> },
  ];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <button onClick={() => navigate('/cows')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Back to Cows
      </button>

      {/* Header */}
      <div className="bg-green-900 text-white rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">🐄</span>
              <h1 className="text-2xl font-bold">{cow.name || cow.tag_number}</h1>
            </div>
            <p className="text-green-300 font-mono text-sm">{cow.tag_number}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            cow.status === 'active' ? 'bg-green-500' :
            cow.status === 'sold' ? 'bg-blue-500' :
            cow.status === 'slaughtered' ? 'bg-red-500' : 'bg-gray-500'
          }`}>{t(cow.status)}</span>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="text-green-400 text-xs">{t('breed')}</p><p>{cow.breed || '—'}</p></div>
          <div><p className="text-green-400 text-xs">{t('gender')}</p><p>{cow.gender ? t(cow.gender) : '—'}</p></div>
          <div><p className="text-green-400 text-xs">{t('color')}</p><p>{cow.color || '—'}</p></div>
          <div><p className="text-green-400 text-xs">{t('weight')}</p><p>{cow.weight_kg ? `${cow.weight_kg} kg` : '—'}</p></div>
        </div>
      </div>

      {/* Owner & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-gray-600">
            <User size={16} /><span className="font-semibold text-sm">{t('owner')}</span>
          </div>
          <p className="font-medium">{cow.owner_name || '—'}</p>
          <p className="text-sm text-gray-500">{cow.owner_phone}</p>
          <p className="text-sm text-gray-500">{cow.owner_national_id}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-gray-600">
            <MapPin size={16} /><span className="font-semibold text-sm">{t('location')}</span>
          </div>
          <p className="font-medium">{cow.village || cow.cell || '—'}</p>
          <p className="text-sm text-gray-500">{[cow.sector, cow.district, cow.province].filter(Boolean).join(', ')}</p>
          {cow.latitude && <p className="text-xs text-gray-400 mt-1">GPS: {cow.latitude}, {cow.longitude}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === tab.key ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
          {/* Vaccinations tab */}
          {activeTab === 'vaccines' && (
            <div className="space-y-4">

              {/* Add vaccination form — only for vet / government / admin */}
              {canRecordVaccination ? (
                <form onSubmit={e => { e.preventDefault(); vacMutation.mutate(vacForm); }} className="bg-green-50 rounded-lg p-4 space-y-3">
                  <p className="text-sm font-semibold text-green-800">{t('addVaccination')}</p>

                  {vacSuccess && (
                    <div className="bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded-lg text-sm">
                      {vacSuccess}
                    </div>
                  )}
                  {vacError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                      ⚠️ {vacError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-600">{t('vaccineName')} *</label>
                      <input required value={vacForm.vaccine_name}
                        onChange={e => setVacForm({...vacForm, vaccine_name: e.target.value})}
                        placeholder="e.g. FMD Vaccine"
                        className="w-full border rounded px-2 py-1.5 text-sm mt-0.5 bg-white" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">{t('vaccinationDate')} *</label>
                      <input type="date" required value={vacForm.vaccination_date}
                        onChange={e => setVacForm({...vacForm, vaccination_date: e.target.value})}
                        className="w-full border rounded px-2 py-1.5 text-sm mt-0.5 bg-white" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">{t('nextDueDate')}</label>
                      <input type="date" value={vacForm.next_due_date}
                        onChange={e => setVacForm({...vacForm, next_due_date: e.target.value})}
                        className="w-full border rounded px-2 py-1.5 text-sm mt-0.5 bg-white" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">{t('batchNumber')}</label>
                      <input value={vacForm.batch_number}
                        onChange={e => setVacForm({...vacForm, batch_number: e.target.value})}
                        placeholder="e.g. LOT-FMD-2024-001"
                        title="The lot/batch number printed on the vaccine vial or packaging"
                        className="w-full border rounded px-2 py-1.5 text-sm mt-0.5 bg-white" />
                      <p className="text-xs text-gray-400 mt-0.5">
                        {language === 'en' ? 'Number on the vaccine vial (optional)' : "Nimero iri ku icupa ry'urukingo (si itegeko)"}
                      </p>
                    </div>
                  </div>
                  <button type="submit" disabled={vacMutation.isPending}
                    className="flex items-center gap-2 bg-green-700 text-white px-4 py-1.5 rounded text-sm hover:bg-green-800 disabled:opacity-60 transition-colors">
                    {vacMutation.isPending ? (
                      <>
                        <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {language === 'en' ? 'Saving…' : 'Birabikwa…'}
                      </>
                    ) : t('save')}
                  </button>
                </form>
              ) : (
                /* Read-only note for farmers */
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <Lock size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold">
                      {language === 'en' ? 'View only' : 'Kureba gusa'}
                    </p>
                    <p className="text-blue-600 mt-0.5">
                      {language === 'en'
                        ? 'Vaccinations are recorded by a veterinarian. You can see your cow\'s vaccination history and the next due date below.'
                        : "Inkingo zandikwa na muganga w'amatungo. Ushobora kureba amateka y'urukingo rw'inka yawe n'itariki ikurikira hepfo."}
                    </p>
                  </div>
                </div>
              )}

              {/* Next due date summary — the soonest upcoming next_due_date */}
              {(() => {
                const upcoming = (cow.vaccinations || [])
                  .map((v: any) => v.next_due_date)
                  .filter(Boolean)
                  .sort();
                const nextDate = upcoming[0];
                if (!nextDate) return null;
                return (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-3">
                    <span className="text-xl">📅</span>
                    <div className="text-sm">
                      <p className="font-semibold text-yellow-800">
                        {language === 'en' ? 'Next vaccination due' : 'Urukingo rukurikira'}
                      </p>
                      <p className="text-yellow-700">{nextDate}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Vaccination history */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {language === 'en' ? 'History' : 'Amateka'} ({cow.vaccinations?.length || 0})
                </p>
                {(!cow.vaccinations || cow.vaccinations.length === 0) && (
                  <p className="text-gray-400 text-sm py-4 text-center">
                    {language === 'en' ? 'No vaccinations recorded yet.' : 'Nta rukingo ruranditswe.'}
                  </p>
                )}
                {cow.vaccinations?.map((v: any) => (
                  <div key={v.id} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-sm text-gray-800">💉 {v.vaccine_name}</p>
                      {v.batch_number && (
                        <p className="text-xs text-gray-400">
                          {language === 'en' ? 'Batch' : 'Umutwe'}: {v.batch_number}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">{t('administeredBy')}: {v.vet_name || '—'}</p>
                    </div>
                    <div className="text-right text-xs flex-shrink-0 ml-4">
                      <p className="font-medium text-gray-700">{v.vaccination_date}</p>
                      {v.next_due_date && (
                        <p className="text-yellow-600 mt-0.5">
                          {language === 'en' ? 'Next' : 'Ikurikira'}: {v.next_due_date}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offspring tab */}
          {activeTab === 'offspring' && (
            <div className="space-y-3">
              {cow.offspring?.length === 0 && <p className="text-gray-400 text-sm">{t('noData')}</p>}
              {cow.offspring?.map((o: any) => (
                <div key={o.id} className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-sm">{o.calf_tag} — {o.calf_name || '—'}</p>
                    <p className="text-xs text-gray-400">{o.calf_gender ? t(o.calf_gender) : '—'}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>{t('birthDate')}: {o.birth_date}</p>
                    {o.birth_weight_kg && <p>{o.birth_weight_kg} kg</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Transfers tab */}
          {activeTab === 'transfers' && (
            <div className="space-y-4">
              {canTransfer && (
              <form onSubmit={e => { e.preventDefault(); transMutation.mutate(transForm); }}
                className="bg-blue-50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-blue-800">{t('transferOwnership')}</p>

                {transSuccess && (
                  <div className="bg-blue-100 border border-blue-300 text-blue-800 px-3 py-2 rounded-lg text-sm">
                    {transSuccess}
                  </div>
                )}
                {transError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    ⚠️ {transError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600">{t('newOwner')} *</label>
                    <select required value={transForm.to_owner_id}
                      onChange={e => setTransForm({...transForm, to_owner_id: e.target.value})}
                      className="w-full border rounded px-2 py-1.5 text-sm mt-0.5">
                      <option value="">-- Select --</option>
                      {ownersData?.owners?.map((o: any) => (
                        <option key={o.id} value={o.id}>{o.full_name} ({o.national_id})</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {language === 'en'
                        ? "The cow moves to the new owner's registered address automatically."
                        : "Inka yimukira ku aderesi ya nyir'inka mushya yanditse mu buryo bwikoresha."}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">{t('salePrice')}</label>
                    <input type="number" value={transForm.sale_price}
                      onChange={e => setTransForm({...transForm, sale_price: e.target.value})}
                      className="w-full border rounded px-2 py-1.5 text-sm mt-0.5" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">{t('transferDate')}</label>
                    <input type="date" value={transForm.transfer_date}
                      onChange={e => setTransForm({...transForm, transfer_date: e.target.value})}
                      className="w-full border rounded px-2 py-1.5 text-sm mt-0.5" />
                  </div>
                </div>
                <button type="submit" disabled={transMutation.isPending}
                  className="bg-blue-700 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-800 disabled:opacity-60">
                  {t('save')}
                </button>
              </form>
              )}
              {cow.transfers?.length === 0 && <p className="text-gray-400 text-sm">{t('noData')}</p>}
              {cow.transfers?.map((tr: any) => (
                <div key={tr.id} className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div>
                    <p className="text-sm">{tr.from_owner_name || 'N/A'} → {tr.to_owner_name}</p>
                    <p className="text-xs text-gray-400">{tr.district}{tr.sector ? ', ' + tr.sector : ''}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-medium">{tr.transfer_date}</p>
                    {tr.sale_price && <p className="text-green-700">{parseInt(tr.sale_price).toLocaleString()} RWF</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Slaughter tab */}
          {activeTab === 'slaughter' && (
            <div>
              {cow.slaughter_record ? (
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="font-semibold text-red-800 mb-2">{t('slaughterTitle')}</p>
                  <p className="text-sm"><span className="text-gray-500">{t('status')}:</span> {t(cow.slaughter_record.status)}</p>
                  <p className="text-sm"><span className="text-gray-500">{t('scheduledDate')}:</span> {cow.slaughter_record.scheduled_date || '—'}</p>
                  <p className="text-sm"><span className="text-gray-500">{t('slaughterDate')}:</span> {cow.slaughter_record.slaughter_date || '—'}</p>
                  {cow.slaughter_record.meat_weight_kg && (
                    <p className="text-sm"><span className="text-gray-500">{t('meatWeight')}:</span> {cow.slaughter_record.meat_weight_kg} kg</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">{t('noData')}</p>
              )}
            </div>
          )}

          {/* Info tab */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-gray-400 text-xs">{t('dateOfBirth')}</p><p>{cow.date_of_birth || '—'}</p></div>
              <div><p className="text-gray-400 text-xs">{t('weight')}</p><p>{cow.weight_kg ? `${cow.weight_kg} kg` : '—'}</p></div>
              <div><p className="text-gray-400 text-xs">{t('color')}</p><p>{cow.color || '—'}</p></div>
              <div><p className="text-gray-400 text-xs">Vaccinations</p>
                <p>{cow.vaccinations?.length > 0 ?
                  <span className="text-green-600 font-medium">{t('vaccinated')} ({cow.vaccinations.length})</span> :
                  <span className="text-red-500">{t('notVaccinated')}</span>}
                </p>
              </div>
              <div className="col-span-2"><p className="text-gray-400 text-xs">{t('notes')}</p><p>{cow.notes || '—'}</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CowDetailPage;
