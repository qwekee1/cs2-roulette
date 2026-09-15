import { useState, FormEvent, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player, TeamType } from '../types';
import { Language, translations } from '../i18n';

export default function TeamRandomizer({ lang, setLang }: { lang: Language, setLang: (l: Language) => void }) {
  const t = translations[lang];
  const [players, setPlayers] = useState<Player[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [intrigueMode, setIntrigueMode] = useState(true);
  const [isRandomizing, setIsRandomizing] = useState(false);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('cs2_players_v2');
    if (saved) {
      setPlayers(JSON.parse(saved));
    }
    const savedIntrigue = localStorage.getItem('cs2_intrigue');
    if (savedIntrigue !== null) {
      setIntrigueMode(savedIntrigue === 'true');
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('cs2_players_v2', JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem('cs2_intrigue', String(intrigueMode));
  }, [intrigueMode]);

  const addPlayer = (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isRandomizing) return;
    
    const names = inputValue.split(',').map(n => n.trim()).filter(Boolean);
    const newPlayers = names.map(name => ({
      id: crypto.randomUUID(),
      name,
      team: 'pool' as TeamType
    }));

    setPlayers(prev => [...prev, ...newPlayers]);
    setInputValue('');
  };

  const removePlayer = (id: string) => {
    if (isRandomizing) return;
    setPlayers(prev => prev.filter(p => p.id !== id));
  };

  const moveToPool = () => {
    if (isRandomizing) return;
    setPlayers(prev => prev.map(p => ({ ...p, team: 'pool', assignOrder: undefined })));
  };

  const clearAll = () => {
    if (isRandomizing) return;
    setPlayers([]);
  };

  const randomize = () => {
    if (isRandomizing || players.length === 0) return;
    
    setIsRandomizing(true);
    
    // First move everyone to pool
    const resetPlayers = players.map(p => ({ ...p, team: 'pool' as TeamType, assignOrder: undefined }));
    setPlayers(resetPlayers);
    
    setTimeout(() => {
      // Fisher-Yates shuffle
      const shuffled = [...resetPlayers];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      if (!intrigueMode) {
        const finalPlayers = resetPlayers.map(p => {
          const shuffleIndex = shuffled.findIndex(sp => sp.id === p.id);
          if (shuffleIndex < 10) {
            return { ...p, team: shuffleIndex % 2 === 0 ? 'a' : 'b', assignOrder: shuffleIndex };
          }
          return p;
        });
        setPlayers(finalPlayers);
        setIsRandomizing(false);
      } else {
        // Intrigue mode (slow assignment)
        const maxPlayersToAssign = Math.min(10, shuffled.length);
        
        for (let i = 0; i < maxPlayersToAssign; i++) {
          setTimeout(() => {
            setPlayers(current => 
              current.map(cp => cp.id === shuffled[i].id ? { ...cp, team: i % 2 === 0 ? 'a' : 'b', assignOrder: i } : cp)
            );
            
            if (i === maxPlayersToAssign - 1) {
               // Add a buffer before completing to prevent blink
               setTimeout(() => setIsRandomizing(false), 800);
            }
          }, (i + 1) * 1200); // 1200ms delay per player (slower)
        }
        
        if (maxPlayersToAssign === 0) setIsRandomizing(false);
      }
    }, 400); 
  };

  const pool = players;
  const teamA = players.filter(p => p.team === 'a').sort((a, b) => (a.assignOrder || 0) - (b.assignOrder || 0));
  const teamB = players.filter(p => p.team === 'b').sort((a, b) => (a.assignOrder || 0) - (b.assignOrder || 0));

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={addPlayer} className="flex-1 flex gap-2">
          <span className="text-neutral-500 mt-3 hidden md:inline">{'>'}</span>
          <input 
            type="text" 
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder={t.placeholder}
            disabled={isRandomizing}
            className="flex-1 bg-transparent border-b border-neutral-700 text-white px-2 py-2 focus:outline-none focus:border-white placeholder-neutral-700 uppercase font-mono disabled:opacity-50"
          />
          <button type="submit" disabled={isRandomizing} className="border border-neutral-700 px-6 hover:bg-white hover:text-black hover:border-white transition-colors uppercase font-mono font-bold disabled:opacity-50">
            {t.add}
          </button>
        </form>
        <button 
          onClick={randomize} 
          disabled={players.length === 0 || isRandomizing}
          className="border border-white bg-white text-black px-8 py-2 font-bold hover:bg-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase font-mono"
        >
          {t.shuffle}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden min-h-[400px]">
        <TeamColumn title={t.idlePool} players={pool} badgeCount={players.filter(p => p.team === 'pool').length} onRemove={removePlayer} noData={t.noData} isRandomizing={isRandomizing} isPool={true} />
        <TeamColumn title={t.teamAlpha} players={teamA} onRemove={removePlayer} noData={t.noData} isRandomizing={isRandomizing} />
        <TeamColumn title={t.teamBravo} players={teamB} onRemove={removePlayer} noData={t.noData} isRandomizing={isRandomizing} />
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center border-t border-neutral-900 pt-4 gap-4">
        <div className="flex flex-wrap gap-4 md:gap-6 items-center">
          <button onClick={moveToPool} disabled={isRandomizing} className="text-neutral-500 hover:text-white transition-colors text-sm uppercase font-mono disabled:opacity-50">
            {t.resetPool}
          </button>
          <button onClick={clearAll} disabled={isRandomizing} className="text-neutral-600 hover:text-red-500 transition-colors text-sm uppercase font-mono disabled:opacity-50">
            {t.purgeData}
          </button>
          <div className="w-px h-4 bg-neutral-800 hidden md:block"></div>
          <button 
            onClick={() => setIntrigueMode(!intrigueMode)}
            disabled={isRandomizing}
            className={`text-sm transition-colors font-mono uppercase disabled:opacity-50 flex items-center gap-1 ${intrigueMode ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
          >
            <span className="text-neutral-500">[</span>
            {intrigueMode ? 'X' : '\u00A0'}
            <span className="text-neutral-500">]</span> {t.intrigue}
          </button>
        </div>
        
        <div className="flex gap-3 text-sm font-mono font-bold">
          <button 
            onClick={() => setLang('UA')} 
            disabled={isRandomizing}
            className={`transition-colors ${lang === 'UA' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
          >UA</button>
          <span className="text-neutral-800">/</span>
          <button 
            onClick={() => setLang('RU')} 
            disabled={isRandomizing}
            className={`transition-colors ${lang === 'RU' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
          >RU</button>
          <span className="text-neutral-800">/</span>
          <button 
            onClick={() => setLang('EN')} 
            disabled={isRandomizing}
            className={`transition-colors ${lang === 'EN' ? 'text-white' : 'text-neutral-600 hover:text-neutral-400'}`}
          >EN</button>
        </div>
      </div>
    </div>
  );
}

function TeamColumn({ title, players, onRemove, noData, isRandomizing, isPool = false, badgeCount }: { title: string, players: Player[], onRemove: (id: string) => void, noData: string, isRandomizing: boolean, isPool?: boolean, badgeCount?: number }) {
  return (
    <div className="border border-neutral-800 flex flex-col h-full bg-[#0a0a0a] relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neutral-500" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-neutral-500" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-neutral-500" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neutral-500" />

      <div className="p-3 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/30">
        <h2 className="tracking-widest font-bold text-sm text-neutral-300">{title}</h2>
        <span className="text-neutral-500 text-xs font-mono">[{((badgeCount !== undefined ? badgeCount : players.length) || 0).toString().padStart(2, '0')}]</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 relative z-10">
        <AnimatePresence>
          {players.map((p, i) => {
            const isDimmed = isPool && p.team !== 'pool';
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isDimmed ? 0.15 : 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                key={p.id}
                className={`group/card border border-neutral-800/50 p-2 flex justify-between items-center transition-colors min-h-[38px] ${isDimmed ? 'bg-transparent border-neutral-900/30' : 'bg-black hover:border-neutral-500'}`}
              >
                <div className={`flex gap-3 items-center overflow-hidden ${isDimmed ? 'opacity-30 grayscale' : ''}`}>
                  <span className="text-neutral-700 text-xs font-mono">{String(i + 1).padStart(2, '0')}</span>
                  <span className="truncate block text-sm uppercase text-white font-mono">{p.name}</span>
                </div>
                {!isRandomizing && !isDimmed && (
                  <button 
                    onClick={() => onRemove(p.id)}
                    className="opacity-0 group-hover/card:opacity-100 text-neutral-600 hover:text-white text-xs px-2 transition-opacity"
                    title="Remove Player"
                  >
                    X
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {players.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-neutral-800 text-xs font-mono text-center">
            {noData}
          </div>
        )}
      </div>
    </div>
  );
}
