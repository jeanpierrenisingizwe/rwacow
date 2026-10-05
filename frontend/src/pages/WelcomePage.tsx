import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

const features = [
  {
    emoji: '🐄',
    en: 'Cow Registration',
    rw: 'Kwandika Inka',
    descEn: 'Register every cow with a unique tag, breed, gender, color, weight and date of birth.',
    descRw: 'Andika buri nka ifite nimero y\'ikirango yihariye, ubwoko, igitsina, ibara, ibiro n\'itariki y\'amavuko.',
  },
  {
    emoji: '👤',
    en: 'Owner Management',
    rw: 'Gucunga Ba Nyir\'inka',
    descEn: 'Track every owner by national ID, phone, and location across Rwanda\'s administrative divisions.',
    descRw: 'Kurikirana buri nyir\'inka ukoresheje indangamuntu, telefoni, n\'aho atuye mu Rwanda.',
  },
  {
    emoji: '📍',
    en: 'Location Tracking',
    rw: 'Gukurikirana Aho Inka Iherereye',
    descEn: 'Know exactly where each cow is — Province, District, Sector, Cell, Village.',
    descRw: 'Menya neza aho buri nka iherereye — Intara, Akarere, Umurenge, Akagari, Umudugudu.',
  },
  {
    emoji: '💉',
    en: 'Vaccination Records',
    rw: 'Amakuru y\'Inkingo',
    descEn: 'Record every vaccine given, the date administered, and when the next dose is due.',
    descRw: 'Andika buri rukingo rwatanzwe, itariki rwatangiweho, n\'igihe urukingo rukurikira ruzatangirwa.',
  },
  {
    emoji: '🐣',
    en: 'Offspring Tracking (Izakomotse)',
    rw: 'Gukurikirana Inyana (Izakomotse)',
    descEn: 'Record every calf born — linked to its mother, with birth date and weight.',
    descRw: 'Andika buri nyana yavutse — ihujwe na nyina wayo, hamwe n\'itariki n\'ibiro byo kuvuka.',
  },
  {
    emoji: '🔪',
    en: 'Slaughter Records (Izabazwe)',
    rw: 'Amakuru y\'Inka Zibagwa (Izabazwe)',
    descEn: 'Schedule and confirm slaughter events, record meat weight, and maintain full audit trails.',
    descRw: 'Andika inka zigiye kubagwa, wemeze ko zabazwe, wandike ibiro by\'inyama, ubike amateka yose.',
  },
  {
    emoji: '🔄',
    en: 'Ownership Transfers',
    rw: 'Guhererekanya Inka',
    descEn: 'When a cow is sold, re-register it to the new owner with full transfer history.',
    descRw: 'Iyo inka iguzwe, iyandikishe kuri nyir\'inka mushya hamwe n\'amateka yose y\'uko yahererekanyijwe.',
  },
  {
    emoji: '🔐',
    en: 'Role-Based Access',
    rw: 'Uburenganzira Bushingiye ku Nshingano',
    descEn: 'Different access levels for Farmers, Vets, Government Officials and Slaughterhouses.',
    descRw: 'Uburenganzira butandukanye ku Borozi, Abaganga b\'Amatungo, Abakozi ba Leta n\'Ababaga.',
  },
];

const roles = [
  { emoji: '🌾', en: 'Farmer', rw: 'Umworozi', descEn: 'Register your cows, record births, transfer ownership.', descRw: 'Andika inka zawe, wandike inyana zavutse, uhererekanye inka.' },
  { emoji: '🩺', en: 'Veterinarian', rw: 'Muganga w\'Amatungo', descEn: 'Record vaccinations and health updates for all cattle.', descRw: 'Andika inkingo n\'amakuru y\'ubuzima bw\'inka zose.' },
  { emoji: '🏛️', en: 'Government Official', rw: 'Umukozi wa Leta', descEn: 'Oversee all livestock data across districts and provinces.', descRw: 'Genzura amakuru yose y\'amatungo mu turere no mu ntara.' },
  { emoji: '🏭', en: 'Slaughterhouse', rw: 'Ababaga Amatungo', descEn: 'Schedule and confirm cattle slaughter records.', descRw: 'Andika kandi wemeze amakuru y\'inka zibagwa.' },
];

const steps = [
  { num: '01', en: 'Register your account', rw: 'Iyandikishe konti yawe' },
  { num: '02', en: 'Add owners & locations', rw: 'Ongeraho ba nyir\'inka n\'aho batuye' },
  { num: '03', en: 'Register your cattle with tags', rw: 'Andika inka zawe hamwe n\'ibirango' },
  { num: '04', en: 'Track vaccinations & offspring', rw: 'Kurikirana inkingo n\'inyana' },
  { num: '05', en: 'Manage transfers & slaughter', rw: 'Gucunga ihererekanya n\'inka zibagwa' },
];

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const [activeFeature, setActiveFeature] = useState<number | null>(null);
  const L = language;

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐄</span>
            <span className="font-bold text-green-900 text-lg">RwaCow</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex rounded-full border border-gray-200 overflow-hidden text-xs">
              <button onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 transition-colors ${L === 'en' ? 'bg-green-700 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                EN
              </button>
              <button onClick={() => setLanguage('rw')}
                className={`px-3 py-1.5 transition-colors ${L === 'rw' ? 'bg-green-700 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                RW
              </button>
            </div>
            <button onClick={() => navigate('/login')}
              className="text-sm font-medium text-green-700 hover:text-green-900 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors">
              {L === 'en' ? 'Sign In' : 'Injira'}
            </button>
            <button onClick={() => navigate('/register')}
              className="text-sm font-semibold bg-green-700 text-white px-4 py-1.5 rounded-lg hover:bg-green-800 transition-colors">
              {L === 'en' ? 'Get Started' : 'Tangira'}
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-green-950 via-green-800 to-green-600 text-white overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <span>🇷🇼</span>
            <span>{L === 'en' ? 'Built for Rwanda' : 'Yakozwe ku Rwanda'}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
            {L === 'en' ? (
              <>Rwanda Cow<br /><span className="text-yellow-300">Tracking System</span></>
            ) : (
              <>Sisitemu yo<br /><span className="text-yellow-300">Gukurikirana Inka</span></>
            )}
          </h1>

          <p className="text-lg md:text-xl text-green-100 max-w-2xl mx-auto mb-10 leading-relaxed">
            {L === 'en'
              ? 'The complete digital platform for registering, locating, vaccinating, and managing cattle ownership across Rwanda.'
              : 'Urubuga ruzuye rw\'ikoranabuhanga rwo kwandika, gushakisha, gutunga no gucunga inzira z\'ubusobozi bw\'inka mu Rwanda.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/register')}
              className="bg-yellow-400 hover:bg-yellow-300 text-green-950 font-bold px-8 py-3.5 rounded-xl text-base transition-all hover:scale-105 shadow-lg">
              {L === 'en' ? '🚀 Create Free Account' : '🚀 Fungura Konti ku Buntu'}
            </button>
            <button onClick={() => navigate('/login')}
              className="bg-white/10 border border-white/30 hover:bg-white/20 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all">
              {L === 'en' ? 'Sign In →' : 'Injira →'}
            </button>
          </div>

          {/* Stats bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { val: '8', label: L === 'en' ? 'Core Features' : 'Ibikorwa Shingiro' },
              { val: '5', label: L === 'en' ? 'User Roles' : 'Inshingano z\'Abakoresha' },
              { val: '2', label: L === 'en' ? 'Languages' : 'Indimi' },
              { val: '∞', label: L === 'en' ? 'Cows Tracked' : 'Inka Zikurikiranwa' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 border border-white/20 rounded-xl py-4 px-3">
                <p className="text-3xl font-black text-yellow-300">{s.val}</p>
                <p className="text-xs text-green-200 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
              {L === 'en' ? 'Everything You Need' : 'Ibyose Ukeneye'}
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              {L === 'en'
                ? 'A single platform covering the full lifecycle of cattle management in Rwanda.'
                : 'Urubuga rumwe rugaragaza ubuzima bwose bw\'gucunga inka mu Rwanda.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div key={i}
                className={`bg-white rounded-2xl p-6 border-2 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1
                  ${activeFeature === i ? 'border-green-500 shadow-lg' : 'border-transparent'}`}
                onClick={() => setActiveFeature(activeFeature === i ? null : i)}>
                <div className="text-4xl mb-4">{f.emoji}</div>
                <h3 className="font-bold text-gray-900 mb-2">{L === 'en' ? f.en : f.rw}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {L === 'en' ? f.descEn : f.descRw}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
              {L === 'en' ? 'How It Works' : 'Uburyo Bikora'}
            </h2>
            <p className="text-gray-500">
              {L === 'en' ? 'Up and running in 5 simple steps.' : 'Gutangira mu ntambwe 5 zoroshye.'}
            </p>
          </div>
          <div className="relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-8 left-1/2 -translate-x-1/2 w-4/5 h-0.5 bg-green-100" />
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
              {steps.map((s, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="relative z-10 w-16 h-16 bg-green-700 text-white rounded-2xl flex items-center justify-center text-lg font-black shadow-lg mb-4">
                    {s.num}
                  </div>
                  <p className="text-sm font-semibold text-gray-700">{L === 'en' ? s.en : s.rw}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── WHO IS IT FOR ── */}
      <section className="py-20 bg-green-950 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black mb-3">
              {L === 'en' ? 'Who Uses RwaCow?' : 'Nde Ukoresha RwaCow?'}
            </h2>
            <p className="text-green-300">
              {L === 'en' ? 'Built for everyone in Rwanda\'s livestock ecosystem.' : 'Yakorewe buri wese ukora mu by\'ubworozi bw\'amatungo mu Rwanda.'}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {roles.map((r, i) => (
              <div key={i} className="bg-white/10 border border-white/10 rounded-2xl p-6 hover:bg-white/15 transition-colors">
                <div className="text-4xl mb-4">{r.emoji}</div>
                <h3 className="font-bold text-yellow-300 mb-2">{L === 'en' ? r.en : r.rw}</h3>
                <p className="text-sm text-green-200 leading-relaxed">{L === 'en' ? r.descEn : r.descRw}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-gradient-to-r from-green-700 to-green-600 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            {L === 'en' ? 'Ready to Get Started?' : 'Witeguye Gutangira?'}
          </h2>
          <p className="text-green-100 mb-8 text-lg">
            {L === 'en'
              ? 'Join Rwanda\'s cattle tracking platform today. Free to register.'
              : 'Injira kuri sisitemu yo gukurikirana inka mu Rwanda uyu munsi. Kwiyandikisha ni ku buntu.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => navigate('/register')}
              className="bg-yellow-400 hover:bg-yellow-300 text-green-950 font-bold px-8 py-3.5 rounded-xl text-base transition-all hover:scale-105">
              {L === 'en' ? '🐄 Register Now' : '🐄 Iyandikishe Ubu'}
            </button>
            <button onClick={() => navigate('/login')}
              className="bg-white/20 border border-white/30 hover:bg-white/30 font-semibold px-8 py-3.5 rounded-xl text-base transition-all">
              {L === 'en' ? 'I Already Have an Account' : 'Mfite Konti'}
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-green-950 text-green-400 py-8 text-center text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-xl">🐄</span>
          <span className="font-bold text-white">RwaCow</span>
        </div>
        <p>Rwanda Cow Tracking System — {L === 'en' ? 'Empowering Rwandan Livestock Management' : 'Guteza Imbere Imicungire y\'Amatungo mu Rwanda'}</p>
        <p className="mt-1 text-green-600">© {new Date().getFullYear()} RwaCow. {L === 'en' ? 'All rights reserved.' : 'Uburenganzira bwose bwarabitswe.'}</p>
      </footer>

    </div>
  );
};

export default WelcomePage;
