import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

const TransfersPage: React.FC = () => {
  const { t } = useLanguage();

  const { data, isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: () => api.get('/transfers').then(r => r.data),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">{t('transfers')}</h1>
      <p className="text-sm text-gray-500">
        To transfer a cow, go to the cow's detail page and use the Transfers tab.
      </p>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {isLoading ? <div className="text-center py-12 text-gray-400">{t('loading')}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {[t('tagNumber'), t('previousOwner'), '', t('newOwner'), t('transferDate'), t('salePrice'), 'Location'].map((h, i) => (
                    <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.transfers?.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">{t('noData')}</td></tr>
                )}
                {data?.transfers?.map((tr: any) => (
                  <tr key={tr.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-green-700">{tr.tag_number}</td>
                    <td className="px-4 py-3">{tr.from_owner_name || '—'}</td>
                    <td className="px-4 py-3"><ArrowRight size={14} className="text-gray-400" /></td>
                    <td className="px-4 py-3 font-medium">{tr.to_owner_name}</td>
                    <td className="px-4 py-3">{tr.transfer_date}</td>
                    <td className="px-4 py-3">
                      {tr.sale_price
                        ? <span className="text-green-700 font-medium">{parseInt(tr.sale_price).toLocaleString()} RWF</span>
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{tr.district || '—'}</td>
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

export default TransfersPage;
