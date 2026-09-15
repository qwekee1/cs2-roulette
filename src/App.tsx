import { useState, useEffect } from 'react';
import TeamRandomizer from './components/TeamRandomizer';
import MapRandomizer from './components/MapRandomizer';
import { Language, translations } from './i18n';

export default function App() {
  const [activeTab, setActiveTab] = useState<'teams' | 'maps'>('teams');
  const [lang, setLang] = useState<Language>('EN');

  useEffect(() => {
    const savedLang = localStorage.getItem('cs2_lang') as Language;
    if (savedLang && translations[savedLang]) {
      setLang(savedLang);
    }
  }, []);

  const handleSetLang = (l: Language) => {
    setLang(l);
    localStorage.setItem('cs2_lang', l);
  };

  const t = translations[lang];

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-mono uppercase selection:bg-white selection:text-black flex flex-col">
      <div className="max-w-5xl mx-auto w-full p-4 md:p-6 flex flex-col h-screen relative z-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-neutral-800 pb-4 mb-6 gap-4">
          <div className="flex items-center gap-3">
             <h1 className="text-xl md:text-2xl font-bold tracking-widest text-white leading-none font-mono">{'>_'}</h1>
          </div>
          <nav className="flex gap-4">
             <button 
                onClick={() => setActiveTab('teams')}
                className={`text-sm tracking-widest transition-colors font-mono ${activeTab === 'teams' ? 'text-white border-b-2 border-white pb-1' : 'text-neutral-600 hover:text-neutral-400 pb-1'}`}
             >
               {t.teams}
             </button>
             <button 
                onClick={() => setActiveTab('maps')}
                className={`text-sm tracking-widest transition-colors font-mono ${activeTab === 'maps' ? 'text-white border-b-2 border-white pb-1' : 'text-neutral-600 hover:text-neutral-400 pb-1'}`}
             >
               {t.maps}
             </button>
          </nav>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col min-h-0">
          {activeTab === 'teams' ? (
            <TeamRandomizer lang={lang} setLang={handleSetLang} />
          ) : (
            <MapRandomizer lang={lang} />
          )}
        </main>
      </div>
    </div>
  )
}
