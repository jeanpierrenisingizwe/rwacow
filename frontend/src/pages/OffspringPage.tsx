import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Baby } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

const OffspringPage: React.FC = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    mother_id: '', birth_date: '', birth_weight_kg: '', gender: 'female',
    calf_tag_number: '', calf_name: '', calf_breed: '', owner_id: '', notes: ''
  });

  const { data, isLoading } = useQuery({
    queryKey: ['offspring'],
    queryFn: () => api.get('/offspring').then(r => r.data),
  });

  const { data: cowsData } = useQuery({
    queryKey: ['cows-female'],
    queryFn: () => api.get('/cows', { params: { status: 'active' } }).then(r => r.data),
  });

  const { data: ownersData } = useQuery({
    queryKey: ['owners-list'],
    queryFn: () => api.get('/owners').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/offspring', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offspring'] });
      setShowForm(false);
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('offspringTitle')}</h1>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-800">
          <Plus size={16} /> {t('registerOffspring')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">{t('loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {[t('calf'), t('mother'), t('birthDate'), t('birthWeight'), t('gender')].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.offspring?.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">{t('noData')}</td></tr>
                )}
                {data?.offspring?.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Baby size={14} className="text-green-500" />
                        <span className="font-mono text-green-700">{o.calf_tag}</span>
                        {o.calf_name && <span className="text-gray-500">({o.calf_name})</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">{o.mother_tag} <span className="text-gray-400 text-xs">{o.mother_name}</span></td>
                    <td className="px-4 py-3">{o.birth_date}</td>
                    <td className="px-4 py-3">{o.birth_weight_kg ? `${o.birth_weight_kg} kg` : '—'}</td>
                    <td className="px-4 py-3 capitalize">{o.gender ? t(o.gender) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
              <h2 className="font-bold text-lg">{t('registerOffspring')}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-600">{t('mother')} *</label>
                  <select required value={form.mother_id}
                    onChange={e => setForm({...form, mother_id: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5">
                    <option value="">-- Select Mother --</option>
                    {cowsData?.cows?.filter((c: any) => c.gender === 'female').map((c: any) => (
                      <option key={c.id} value={c.id}>{c.tag_number} {c.name ? `(${c.name})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">{t('calf')} Tag *</label>
                  <input required value={form.calf_tag_number}
                    onChange={e => setForm({...form, calf_tag_number: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">{t('calf')} Name</label>
                  <input value={form.calf_name} onChange={e => setForm({...form, calf_name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">{t('birthDate')} *</label>
                  <input type="date" required value={form.birth_date}
                    onChange={e => setForm({...form, birth_date: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">{t('birthWeight')}</label>
                  <input type="number" value={form.birth_weight_kg}
                    onChange={e => setForm({...form, birth_weight_kg: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">{t('gender')}</label>
                  <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5">
                    <option value="female">{t('female')}</option>
                    <option value="male">{t('male')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600">{t('owner')}</label>
                  <select value={form.owner_id} onChange={e => setForm({...form, owner_id: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm mt-0.5">
                    <option value="">-- Same as Mother's Owner --</option>
                    {ownersData?.owners?.map((o: any) => (
                      <option key={o.id} value={o.id}>{o.full_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
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

export default OffspringPage;
