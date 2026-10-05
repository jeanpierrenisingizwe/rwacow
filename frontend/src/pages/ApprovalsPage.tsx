import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Clock, User, MapPin } from 'lucide-react';
import api from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

const ApprovalsPage: React.FC = () => {
  const { language: L } = useLanguage();
  const queryClient = useQueryClient();
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [msg, setMsg] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['pending-cows'],
    queryFn: () => api.get('/cows/pending').then(r => r.data),
    staleTime: 0,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.put(`/cows/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-cows'] });
      queryClient.invalidateQueries({ queryKey: ['cows'] });
      queryClient.invalidateQueries({ queryKey: ['cow-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pending-count'] });
      setMsg(L === 'en' ? '✅ Cow approved.' : '✅ Inka yemejwe.');
      setTimeout(() => setMsg(''), 4000);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.put(`/cows/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-cows'] });
      queryClient.invalidateQueries({ queryKey: ['pending-count'] });
      setRejectId(null); setRejectReason('');
      setMsg(L === 'en' ? 'Cow rejected.' : 'Inka yanzwe.');
      setTimeout(() => setMsg(''), 4000);
    },
  });

  const cows = data?.cows || [];

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-2">
        <Clock className="text-yellow-500" size={22} />
        <h1 className="text-2xl font-bold text-gray-800">
          {L === 'en' ? 'Pending Approvals' : 'Ibitegereje Kwemezwa'}
        </h1>
        {cows.length > 0 && (
          <span className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-2.5 py-0.5 rounded-full">
            {cows.length}
          </span>
        )}
      </div>

      <p className="text-sm text-gray-500">
        {L === 'en'
          ? 'Cows registered by farmers that need your review before being added to the official registry.'
          : "Inka zanditswe n'aborozi zisaba ko uzisuzuma mbere yo kwinjizwa mu gitabo cy'igihugu."}
      </p>

      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2.5 rounded-xl text-sm">
          {msg}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">{L === 'en' ? 'Loading…' : 'Tegereza gato…'}</div>
      ) : cows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckCircle className="mx-auto text-green-400 mb-3" size={40} />
          <p className="text-gray-500">
            {L === 'en' ? 'No cows waiting for approval. All caught up!' : 'Nta nka itegereje kwemezwa. Byose birakozwe!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cows.map((cow: any) => (
            <div key={cow.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-mono font-bold text-green-700">{cow.tag_number}</p>
                  <p className="font-semibold text-gray-800">{cow.name || '—'}</p>
                </div>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {L === 'en' ? 'Pending' : 'Bitegereje'}
                </span>
              </div>

              <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                <p>🐄 {cow.breed || '—'} · {cow.gender ? (L === 'en' ? cow.gender : (cow.gender === 'male' ? 'Gabo' : 'Gore')) : '—'} · {cow.weight_kg ? `${cow.weight_kg} kg` : '—'}</p>
                <p className="flex items-center gap-1.5"><User size={13} className="text-gray-400" /> {cow.owner_name} ({cow.owner_national_id})</p>
                <p className="flex items-center gap-1.5"><MapPin size={13} className="text-gray-400" />
                  {[cow.village, cow.sector, cow.district, cow.province].filter(Boolean).join(', ') || '—'}
                </p>
                <p className="text-xs text-gray-400">
                  {L === 'en' ? 'Submitted by' : 'Byatanzwe na'}: {cow.submitted_by_name || '—'}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => approveMutation.mutate(cow.id)}
                  disabled={approveMutation.isPending}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-60"
                >
                  <CheckCircle size={15} /> {L === 'en' ? 'Approve' : 'Emeza'}
                </button>
                <button
                  onClick={() => { setRejectId(cow.id); setRejectReason(''); }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  <XCircle size={15} /> {L === 'en' ? 'Reject' : 'Anga'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject reason modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-lg text-red-700 mb-1">
              {L === 'en' ? 'Reject Cow' : 'Anga Inka'}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {L === 'en' ? 'Give a reason so the farmer knows what to fix.' : "Tanga impamvu kugira ngo umworozi amenye icyo akosora."}
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              placeholder={L === 'en' ? 'e.g. Wrong tag number, duplicate entry…' : 'urugero: Nimero itari yo, byanditswe kabiri…'}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectId(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg">
                {L === 'en' ? 'Cancel' : 'Reka'}
              </button>
              <button
                onClick={() => rejectMutation.mutate({ id: rejectId, reason: rejectReason })}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 text-sm bg-red-700 text-white rounded-lg disabled:opacity-60"
              >
                {rejectMutation.isPending ? '…' : (L === 'en' ? 'Confirm Reject' : 'Emeza Kwanga')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsPage;
