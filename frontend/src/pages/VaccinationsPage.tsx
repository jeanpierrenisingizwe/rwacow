import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Syringe, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

const VaccinationsPage: React.FC = () => {
  const { t } = useLanguage();
  const [upcoming, setUpcoming] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['vaccinations', upcoming],
    queryFn: () => api.get('/vaccinations', { params: { upcoming: upcoming || undefined } }).then(r => r.data),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('vaccinations')}</h1>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={upcoming} onChange={e => setUpcoming(e.target.checked)}
            className="rounded text-green-600" />
          <span className="flex items-center gap-1"><AlertCircle size={14} className="text-yellow-500" />{t('upcomingVaccinations')}</span>
        </label>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">{t('loading')}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {[t('tagNumber'), t('vaccineName'), t('vaccinationDate'), t('nextDueDate'), t('administeredBy'), t('owner')].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.vaccinations?.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-gray-400">{t('noData')}</td></tr>
                )}
                {data?.vaccinations?.map((v: any) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-green-700">{v.tag_number}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Syringe size={14} className="text-blue-500" />
                        <span>{v.vaccine_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{v.vaccination_date}</td>
                    <td className="px-4 py-3">
                      {v.next_due_date ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          new Date(v.next_due_date) <= new Date(Date.now() + 30*24*60*60*1000)
                            ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
                        }`}>{v.next_due_date}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">{v.vet_name || '—'}</td>
                    <td className="px-4 py-3">{v.owner_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default VaccinationsPage;
