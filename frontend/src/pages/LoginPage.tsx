import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import api from '../services/api';

type Tab = 'login' | 'register' | 'forgot' | 'reset-sent';

const ROLES = [
  { value: 'farmer',         en: '🌾 Farmer',             rw: '🌾 Umworozi' },
  { value: 'vet',            en: '🩺 Veterinarian',       rw: "🩺 Muganga w'Amatungo" },
  { value: 'government',     en: '🏛️ Government Official', rw: '🏛️ Umukozi wa Leta' },
  { value: 'slaughterhouse', en: '🏭 Slaughterhouse',     rw: "🏭 Ubwicanyi bw'Amatungo" },
];

const AuthPage: React.FC = () => {
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const L = language;

  // If user landed on /register, open register tab by default
  const [tab, setTab] = useState<Tab>(location.pathname === '/register' ? 'register' : 'login');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [reg, setReg] = useState({
    full_name: '', email: '', phone: '', password: '', confirm_password: '', role: 'farmer'
  });

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');

  const clearMessages = () => { setError(''); setSuccess(''); };

  /* ── LOGIN ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || (L === 'en' ? 'Login failed. Check your credentials.' : 'Kwinjira ntibyakunze. Reba amakuru yawe.'));
    } finally {
      setLoading(false);
    }
  };

  /* ── REGISTER ── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (reg.password !== reg.confirm_password) {
      return setError(L === 'en' ? 'Passwords do not match.' : 'Amajambobanga ntahuye.');
    }
    if (reg.password.length < 8) {
      return setError(L === 'en' ? 'Password must be at least 8 characters.' : 'Ijambobanga rigomba kugira nibura inyuguti 8.');
    }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        full_name: reg.full_name,
        email: reg.email,
        phone: reg.phone,
        password: reg.password,
        role: reg.role,
      });
      setSuccess(L === 'en'
        ? '✅ Account created! You can now sign in.'
        : '✅ Konti yarafunguwe! Ubu ushobora kwinjira.');
      setTab('login');
      setLoginEmail(reg.email);
      setReg({ full_name: '', email: '', phone: '', password: '', confirm_password: '', role: 'farmer' });
    } catch (err: any) {
      setError(err.response?.data?.error || (L === 'en' ? 'Registration failed.' : 'Kwiyandikisha ntibyakunze.'));
    } finally {
      setLoading(false);
    }
  };

  /* ── FORGOT PASSWORD ── */
  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setTab('reset-sent');
    } catch (err: any) {
      setError(err.response?.data?.error || (L === 'en' ? 'Request failed. Try again.' : 'Ntibikunze. Ongera ugerageze.'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow";
  const labelClass = "block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-green-800 to-green-600 flex flex-col items-center justify-center p-4">

      {/* Back to welcome */}
      <Link to="/" className="flex items-center gap-1.5 text-green-200 hover:text-white text-sm mb-6 transition-colors self-start max-w-md w-full">
        <ArrowLeft size={15} />
        {L === 'en' ? 'Back to Home' : 'Subira ku Rupapuro Rwibanze'}
      </Link>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-green-900 to-green-700 px-8 py-6 text-white text-center">
          <div className="text-5xl mb-2">🐄</div>
          <h1 className="text-xl font-black">RwaCow</h1>
          <p className="text-green-300 text-xs mt-0.5">Rwanda Cow Tracking System</p>

          {/* Language toggle */}
          <div className="flex justify-center mt-4">
            <div className="flex rounded-full bg-green-950/40 border border-white/20 overflow-hidden text-xs">
              <button onClick={() => setLanguage('en')}
                className={`px-4 py-1.5 transition-colors ${L === 'en' ? 'bg-white text-green-900 font-bold' : 'text-green-200'}`}>
                English
              </button>
              <button onClick={() => setLanguage('rw')}
                className={`px-4 py-1.5 transition-colors ${L === 'rw' ? 'bg-white text-green-900 font-bold' : 'text-green-200'}`}>
                Kinyarwanda
              </button>
            </div>
          </div>
        </div>

        {/* Tab bar (only for login/register) */}
        {(tab === 'login' || tab === 'register') && (
          <div className="flex border-b border-gray-100">
            <button onClick={() => { setTab('login'); clearMessages(); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors
                ${tab === 'login' ? 'text-green-700 border-b-2 border-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
              {L === 'en' ? 'Sign In' : 'Injira'}
            </button>
            <button onClick={() => { setTab('register'); clearMessages(); }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors
                ${tab === 'register' ? 'text-green-700 border-b-2 border-green-600' : 'text-gray-400 hover:text-gray-600'}`}>
              {L === 'en' ? 'Create Account' : 'Fungura Konti'}
            </button>
          </div>
        )}

        <div className="px-8 py-6">

          {/* ─── Alerts ─── */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex gap-2">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm flex gap-2">
              <span>✅</span><span>{success}</span>
            </div>
          )}

          {/* ─── LOGIN ─── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={labelClass}>{L === 'en' ? 'Email Address' : 'Imeyili'}</label>
                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  required className={inputClass} placeholder="you@example.com" />
              </div>
              <div>
                <label className={labelClass}>{L === 'en' ? 'Password' : 'Ijambo ry\'Ibanga'}</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    required className={inputClass + ' pr-10'} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <button type="button" onClick={() => { setTab('forgot'); clearMessages(); }}
                  className="text-xs text-green-600 hover:text-green-800 font-medium">
                  {L === 'en' ? 'Forgot password?' : 'Wibagiwe ijambobanga?'}
                </button>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm">
                {loading ? (L === 'en' ? 'Signing in…' : 'Kwinjira…') : (L === 'en' ? 'Sign In →' : 'Injira →')}
              </button>
            </form>
          )}

          {/* ─── REGISTER ─── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className={labelClass}>{L === 'en' ? 'Full Name' : 'Amazina Yuzuye'}</label>
                <input value={reg.full_name} onChange={e => setReg({...reg, full_name: e.target.value})}
                  required className={inputClass} placeholder={L === 'en' ? 'Jean Mutabazi' : 'Amazina yombi'} />
              </div>
              <div>
                <label className={labelClass}>{L === 'en' ? 'Email Address' : 'Imeyili'}</label>
                <input type="email" value={reg.email} onChange={e => setReg({...reg, email: e.target.value})}
                  required className={inputClass} placeholder="you@example.com" />
              </div>
              <div>
                <label className={labelClass}>{L === 'en' ? 'Phone Number' : 'Nimero ya Telefoni'}</label>
                <input type="tel" value={reg.phone} onChange={e => setReg({...reg, phone: e.target.value})}
                  required className={inputClass} placeholder="+250 780 000 000" />
              </div>
              <div>
                <label className={labelClass}>{L === 'en' ? 'Your Role' : 'Uruhare Rwawe'}</label>
                <select value={reg.role} onChange={e => setReg({...reg, role: e.target.value})}
                  className={inputClass}>
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{L === 'en' ? r.en : r.rw}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {L === 'en'
                    ? 'Admin accounts are created by system administrators.'
                    : "Konti z'abayobozi zishyirwaho n'abayobozi ba sisitemu."}
                </p>
              </div>
              <div>
                <label className={labelClass}>{L === 'en' ? 'Password' : 'Ijambobanga'}</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={reg.password}
                    onChange={e => setReg({...reg, password: e.target.value})}
                    required minLength={8} className={inputClass + ' pr-10'}
                    placeholder={L === 'en' ? 'At least 8 characters' : 'Nibura inyuguti 8'} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>{L === 'en' ? 'Confirm Password' : 'Emeza Ijambobanga'}</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={reg.confirm_password}
                    onChange={e => setReg({...reg, confirm_password: e.target.value})}
                    required className={inputClass + ' pr-10'} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Password strength indicator */}
              {reg.password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${
                        reg.password.length >= i * 3
                          ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-yellow-400' : i <= 3 ? 'bg-blue-400' : 'bg-green-500'
                          : 'bg-gray-200'
                      }`} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    {reg.password.length < 4 ? (L === 'en' ? 'Too short' : 'Rigufi cyane')
                    : reg.password.length < 7 ? (L === 'en' ? 'Weak' : 'Ridakomeye')
                    : reg.password.length < 10 ? (L === 'en' ? 'Good' : 'Ryiza')
                    : (L === 'en' ? 'Strong 💪' : 'Rikomeye 💪')}
                  </p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm">
                {loading ? (L === 'en' ? 'Creating account…' : 'Birafungurwa…') : (L === 'en' ? '🐄 Create My Account' : '🐄 Fungura Konti Yanjye')}
              </button>

              <p className="text-xs text-gray-400 text-center">
                {L === 'en'
                  ? 'By registering you agree to use this system responsibly for livestock management.'
                  : "Mu kwiyandikisha wemeye gukoresha iyi sisitemu neza mu micungire y'amatungo."}
              </p>
            </form>
          )}

          {/* ─── FORGOT PASSWORD ─── */}
          {tab === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div className="text-center mb-2">
                <div className="text-4xl mb-2">🔑</div>
                <h2 className="font-bold text-gray-800 text-lg">
                  {L === 'en' ? 'Reset Password' : 'Guhindura Ijambobanga'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {L === 'en'
                    ? 'Enter your email and we\'ll send you a reset link.'
                    : "Andika imeyili yawe tukoherereze umuhora wo guhindura ijambobanga."}
                </p>
              </div>
              <div>
                <label className={labelClass}>{L === 'en' ? 'Email Address' : 'Imeyili'}</label>
                <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  required className={inputClass} placeholder="you@example.com" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-60 text-sm">
                {loading ? (L === 'en' ? 'Sending…' : 'Birohererezwa…') : (L === 'en' ? 'Send Reset Link' : 'Ohereza Umuhora')}
              </button>
              <button type="button" onClick={() => { setTab('login'); clearMessages(); }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
                <ArrowLeft size={14} /> {L === 'en' ? 'Back to Sign In' : 'Subira Kwinjira'}
              </button>
            </form>
          )}

          {/* ─── RESET LINK SENT ─── */}
          {tab === 'reset-sent' && (
            <div className="text-center py-4 space-y-4">
              <div className="text-5xl">📧</div>
              <h2 className="font-bold text-gray-800 text-lg">
                {L === 'en' ? 'Check Your Email' : 'Reba Imeyili Yawe'}
              </h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                {L === 'en'
                  ? `We sent a password reset link to ${forgotEmail}. Check your inbox and follow the instructions.`
                  : `Twohereje umuhora wo guhindura ijambobanga kuri ${forgotEmail}. Reba mu bubiko bwawe bw'imeyili maze ukurikize amabwiriza.`}
              </p>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                {L === 'en'
                  ? '💡 Tip: If you don\'t see the email, check your spam folder.'
                  : "💡 Inama: Niba utabona imeyili, reba mu bubiko bw'imeyili zitifuzwa (spam)."}
              </div>
              <button onClick={() => { setTab('login'); clearMessages(); setForgotEmail(''); }}
                className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3 rounded-xl transition-colors text-sm">
                {L === 'en' ? '← Back to Sign In' : '← Subira Kwinjira'}
              </button>
            </div>
          )}

        </div>
      </div>

      <p className="text-green-300 text-xs mt-6 text-center">
        © {new Date().getFullYear()} RwaCow — Rwanda Livestock Management
      </p>
    </div>
  );
};

export default AuthPage;
