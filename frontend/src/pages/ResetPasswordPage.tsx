import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import api from '../services/api';

const ResetPasswordPage: React.FC = () => {
  const { language: L } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      return setError(L === 'en' ? 'Passwords do not match.' : 'Amajambobanga ntahuye.');
    }
    if (password.length < 8) {
      return setError(L === 'en' ? 'Password must be at least 8 characters.' : 'Rigomba kugira nibura inyuguti 8.');
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.error || (L === 'en' ? 'Reset failed. The link may have expired.' : "Ntibyakunze. Umuhora ushobora kuba warangiye igihe."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-800 to-green-600 flex flex-col items-center justify-center p-4">
      <Link to="/login" className="flex items-center gap-1.5 text-green-200 hover:text-white text-sm mb-6 self-start max-w-md w-full">
        <ArrowLeft size={15} /> {L === 'en' ? 'Back to Sign In' : 'Subira Kwinjira'}
      </Link>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-green-900 to-green-700 px-8 py-6 text-white text-center">
          <div className="text-5xl mb-2">🔐</div>
          <h1 className="text-xl font-black">RwaCow</h1>
          <p className="text-green-300 text-xs mt-0.5">
            {L === 'en' ? 'Set New Password' : 'Shyiraho Ijambobanga Rishya'}
          </p>
        </div>

        <div className="px-8 py-6">
          {!token && (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-red-600 font-semibold">
                {L === 'en' ? 'Invalid or missing reset token.' : "Umuhora wo guhindura ntawuhari cyangwa ntabwo ari wo."}
              </p>
              <button onClick={() => navigate('/login')}
                className="mt-4 text-sm text-green-600 underline">
                {L === 'en' ? 'Go back to login' : 'Subira kwinjira'}
              </button>
            </div>
          )}

          {token && !done && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  ⚠️ {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  {L === 'en' ? 'New Password' : 'Ijambobanga Rishya'}
                </label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} required minLength={8}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                    placeholder={L === 'en' ? 'At least 8 characters' : 'Nibura inyuguti 8'} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  {L === 'en' ? 'Confirm New Password' : 'Emeza Ijambobanga Rishya'}
                </label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm">
                {loading ? (L === 'en' ? 'Saving…' : 'Birabikwa…') : (L === 'en' ? 'Set New Password' : 'Shyiraho Ijambobanga Rishya')}
              </button>
            </form>
          )}

          {done && (
            <div className="text-center py-4 space-y-4">
              <div className="text-5xl">✅</div>
              <h2 className="font-bold text-gray-800 text-lg">
                {L === 'en' ? 'Password Updated!' : 'Ijambobanga Ryahinduwe!'}
              </h2>
              <p className="text-sm text-gray-500">
                {L === 'en'
                  ? 'Your password has been successfully reset. You can now sign in.'
                  : 'Ijambobanga ryawe ryahinduwe neza. Ubu ushobora kwinjira.'}
              </p>
              <button onClick={() => navigate('/login')}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl text-sm">
                {L === 'en' ? '→ Sign In Now' : '→ Injira Ubu'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
