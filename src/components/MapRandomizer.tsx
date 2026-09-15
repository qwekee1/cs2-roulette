import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, translations } from '../i18n';

const DEFAULT_MAPS = [
  'MIRAGE',
  'INFERNO',
  'NUKE',
  'OVERPASS',
  'VERTIGO',
  'ANCIENT',
  'ANUBIS',
  'DUST II',
  'TRAIN'
];

export default function MapRandomizer({ lang }: { lang: Language }) {
  const t = translations[lang];
  const [maps, setMaps] = useState<string[]>(DEFAULT_MAPS);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentSpinMap, setCurrentSpinMap] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('cs2_maps');
    if (saved) {
      setMaps(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cs2_maps', JSON.stringify(maps));
  }, [maps]);

  const toggleMap = (map: string) => {
    if (maps.includes(map)) {
      setMaps(maps.filter(m => m !== map));
    } else {
      setMaps([...maps, map]);
    }
  };

  const randomizeMap = () => {
    if (maps.length === 0) return;
    
    setIsSpinning(true);
    setSelectedMap(null);
    
    let iterations = 0;
    const maxIterations = 25;
    const baseInterval = 50; 
    
    const spin = () => {
      const randomIdx = Math.floor(Math.random() * maps.length);
      setCurrentSpinMap(maps[randomIdx]);
      iterations++;
      
      if (iterations >= maxIterations) {
        setIsSpinning(false);
        setSelectedMap(maps[randomIdx]);
      } else {
        const nextInterval = baseInterval + (iterations * 5);
        setTimeout(spin, nextInterval);
      }
    };
    
    spin();
  };

  return (
    <div className="flex flex-col h-full gap-8 relative overflow-hidden">
      <div className="flex justify-between items-end border-b border-neutral-800 pb-2">
        <div className="text-sm text-neutral-500 uppercase font-mono">{t.selectPool}</div>
        <div className="text-xs text-neutral-600 font-mono">[{maps.length}/{DEFAULT_MAPS.length}]</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {DEFAULT_MAPS.map(map => {
          const isActive = maps.includes(map);
          return (
            <button
              key={map}
              onClick={() => toggleMap(map)}
              className={`border p-3 text-center transition-all text-sm tracking-widest relative overflow-hidden group font-mono ${
                isActive 
                  ? 'border-neutral-500 bg-neutral-900/50 text-white hover:border-white' 
                  : 'border-neutral-900 text-neutral-700 hover:border-neutral-700 hover:text-neutral-400'
              }`}
            >
              <div className="relative z-10">{map}</div>
              {isActive && (
                <div className="absolute top-0 left-0 w-full h-[1px] bg-white opacity-20 group-hover:opacity-50 transition-opacity" />
              )}
            </button>
          )
        })}
      </div>

      <div className="flex justify-center my-4">
        <button 
          onClick={randomizeMap}
          disabled={isSpinning || maps.length === 0}
          className="border border-white bg-white text-black px-12 py-3 font-bold hover:bg-neutral-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase w-full md:w-auto font-mono"
        >
          {t.rollMap}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center border border-neutral-800 bg-[#0a0a0a] relative min-h-[200px]">
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-neutral-500" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-neutral-500" />
        <div className="absolute top-3 left-4 text-[10px] text-neutral-700 font-mono tracking-widest">{t.target}</div>
        <div className="absolute bottom-3 right-4 text-[10px] text-neutral-700 font-mono tracking-widest">
          {isSpinning ? t.statusProcessing : (selectedMap ? t.statusLocked : t.statusAwaiting)}
        </div>
        
        <AnimatePresence mode="wait">
          {isSpinning ? (
            <motion.div
              key="spinning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-3xl md:text-5xl font-bold tracking-widest text-neutral-600 uppercase font-mono"
            >
              {currentSpinMap || '...'}
            </motion.div>
          ) : selectedMap ? (
            <motion.div
              key="selected"
              initial={{ scale: 0.9, opacity: 0, filter: 'blur(4px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="text-4xl md:text-6xl font-bold tracking-widest text-white uppercase relative font-mono"
            >
              {selectedMap}
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl md:text-2xl text-neutral-800 animate-blink font-mono"
            >
              _
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
