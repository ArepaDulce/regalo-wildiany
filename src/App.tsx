import { useState, useEffect } from 'react';
import { Tube } from './components/Tube';

import bgImage from './assets/bg_world1.png'; 
import jokerCard from './assets/joker_card.png';
import bossSprite from './assets/boss_sprite.png';

const C = { R: '#ef4444', B: '#3b82f6', G: '#10b981', Y: '#eab308', P: '#a855f7', O: '#f97316', C: '#06b6d4', M: '#ec4899' };
const ALL_COLORS = [C.R, C.B, C.G, C.Y, C.P, C.O, C.C, C.M];

const LEVEL_CONFIG = [
  { colors: 3, empty: 2, rocks: 0, blind: false, powers: { fool: 0, undo: 0, extra: 0 } }, // 1
  { colors: 4, empty: 2, rocks: 0, blind: false, powers: { fool: 0, undo: 0, extra: 0 } }, // 2
  { colors: 4, empty: 2, rocks: 0, blind: false, powers: { fool: 0, undo: 0, extra: 0 } }, // 3
  { colors: 4, empty: 2, rocks: 0, blind: false, powers: { fool: 2, undo: 0, extra: 0 }, tutorial: 'fool' }, // 4: El Loco
  { colors: 5, empty: 2, rocks: 0, blind: false, powers: { fool: 2, undo: 0, extra: 0 } }, // 5
  { colors: 5, empty: 2, rocks: 2, blind: false, powers: { fool: 3, undo: 0, extra: 0 }, tutorial: 'rocks' }, // 6: Rocas
  { colors: 6, empty: 2, rocks: 2, blind: false, powers: { fool: 3, undo: 4, extra: 0 }, tutorial: 'undo' }, // 7: El Ermitaño
  { colors: 6, empty: 2, rocks: 0, blind: true, powers: { fool: 4, undo: 4, extra: 0 }, tutorial: 'blind' }, // 8: Niebla
  { colors: 7, empty: 2, rocks: 3, blind: false, powers: { fool: 3, undo: 5, extra: 0 } }, // 9
  { colors: 7, empty: 2, rocks: 0, blind: true, powers: { fool: 4, undo: 5, extra: 0 } }, // 10
  { colors: 6, empty: 1, rocks: 2, blind: false, powers: { fool: 3, undo: 5, extra: 1 }, tutorial: 'extra' }, // 11: La Estrella
  { colors: 8, empty: 2, rocks: 4, blind: false, powers: { fool: 4, undo: 5, extra: 1 } }, // 12
  { colors: 8, empty: 2, rocks: 2, blind: true, powers: { fool: 4, undo: 5, extra: 2 } }, // 13
  { colors: 8, empty: 2, rocks: 4, blind: true, powers: { fool: 5, undo: 5, extra: 2 } }, // 14
  { colors: 8, empty: 2, rocks: 6, blind: true, powers: { fool: 5, undo: 5, extra: 2 }, boss: true } // 15
];

// Textos crípticos y más inmersivos
const TUTORIALS: Record<string, { title: string, text: string, color: string }> = {
  fool: { title: "El Loco", text: "Baila al borde del abismo. Toca la carta ROJA: tu próximo movimiento corromperá las leyes de la alquimia.", color: "text-fuchsia-400" },
  undo: { title: "El Ermitaño", text: "Camina hacia atrás en silencio. Toca la carta AZUL para deshacer un error del pasado.", color: "text-blue-400" },
  rocks: { title: "Sedimentos Muertos", text: "Restos petrificados en el fondo de los viales. Estorban. No pueden ser purificados.", color: "text-slate-400" },
  extra: { title: "La Estrella", text: "Luz en el vacío. Toca la carta VERDE para que nazca un nuevo recipiente de la nada.", color: "text-green-400" },
  blind: { title: "Niebla Turbia", text: "La esencia se oscurece. Solo puedes ver la superficie. Confía ciegamente en tu memoria.", color: "text-purple-400" }
};

const ACHIEVEMENTS_DB = [
  { id: 'endless', title: "El Ciclo Sin Fin", desc: "Has descendido a la espiral infinita.", icon: "🌌" },
  { id: 'scores', title: "Ecos del Pasado", desc: "Has revelado las almas que lo intentaron antes.", icon: "🕯️" }
];

function generateLevel(config: any) {
  const activeColors = ALL_COLORS.slice(0, config.colors);
  let blocks: string[] = [];
  activeColors.forEach(c => { for(let i=0; i<4; i++) blocks.push(c); });
  blocks.sort(() => Math.random() - 0.5); 

  let tubes: string[][] = [];
  for(let i=0; i<config.rocks; i++) tubes.push(['ROCK']);
  
  blocks.forEach(block => {
    let placed = false;
    for(let i=0; i<tubes.length; i++) {
      if (tubes[i].length < 4) { tubes[i].push(block); placed = true; break; }
    }
    if (!placed) tubes.push([block]);
  });
  for(let i=0; i<config.empty; i++) tubes.push([]);
  return tubes;
}

type GameScreen = 'menu' | 'story' | 'playing' | 'ending' | 'achievements' | 'leaderboard';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [gameMode, setGameMode] = useState<'story' | 'endless'>('story');
  const [currentLevel, setCurrentLevel] = useState(0);
  
  const [tubes, setTubes] = useState<string[][]>([]);
  const [history, setHistory] = useState<string[][][]>([]);
  const [selectedTube, setSelectedTube] = useState<number | null>(null);
  
  const [foolActive, setFoolActive] = useState(false);
  const [powers, setPowers] = useState({ fool: 0, undo: 0, extra: 0 });
  const [hasWon, setHasWon] = useState(false);
  const [tutorial, setTutorial] = useState<string | null>(null);

  const [gameBeaten, setGameBeaten] = useState(false);
  const [endingPhase, setEndingPhase] = useState(0);
  const [leaderboard, setLeaderboard] = useState<{name: string, score: number}[]>([]);

  const [, setDevClicks] = useState(0);
  const [devMode, setDevMode] = useState(false);

  const config = gameMode === 'story' 
    ? LEVEL_CONFIG[currentLevel < LEVEL_CONFIG.length ? currentLevel : LEVEL_CONFIG.length - 1] 
    : { colors: Math.min(8, 3 + Math.floor(currentLevel/3)), empty: 2, rocks: Math.min(6, Math.floor(currentLevel/4)), blind: currentLevel >= 5 && currentLevel % 2 !== 0, powers: { fool: 1, undo: 3, extra: 1 }, boss: false };

  useEffect(() => {
    if (localStorage.getItem('wildiany_game_beaten') === 'true') setGameBeaten(true);
    const savedScores = localStorage.getItem('wildiany_scores');
    if (savedScores) setLeaderboard(JSON.parse(savedScores));
  }, []);

  const startLevel = () => {
    setTubes(generateLevel(config));
    setHistory([]);
    setHasWon(false);
    setSelectedTube(null);
    setFoolActive(false);
    setPowers(config.powers);
    setDevClicks(0); 
    setDevMode(false);
    if (gameMode === 'story' && config.tutorial) setTutorial(config.tutorial);
  };

  useEffect(() => {
    if (screen === 'playing') startLevel();
  }, [currentLevel, screen, gameMode]);

  const completedTubesCount = tubes.filter(tube => tube.length === 4 && tube.every(c => c === tube[0] && c !== 'ROCK')).length;

  useEffect(() => {
    if (tubes.length > 0 && completedTubesCount === config.colors) setHasWon(true);
  }, [tubes, completedTubesCount, config.colors]);

  const handleTubeClick = (index: number) => {
    if (hasWon || tutorial) return;
    
    if (selectedTube === null) {
      if (tubes[index].length > 0 && tubes[index][tubes[index].length - 1] !== 'ROCK') setSelectedTube(index);
      return;
    }
    if (selectedTube === index) { setSelectedTube(null); return; }

    const sourceTube = tubes[selectedTube];
    const targetTube = tubes[index];
    const colorToMove = sourceTube[sourceTube.length - 1];

    if (colorToMove === 'ROCK') { setSelectedTube(null); return; }

    let consecutiveCount = 0;
    for (let i = sourceTube.length - 1; i >= 0; i--) {
      if (sourceTube[i] === colorToMove) consecutiveCount++; else break;
    }

    const availableSpace = 4 - targetTube.length;
    const isTargetEmpty = targetTube.length === 0;
    const isSameColor = targetTube.length > 0 && targetTube[targetTube.length - 1] === colorToMove;

    const canMove = availableSpace > 0 && (isTargetEmpty || isSameColor || foolActive);

    if (canMove) {
      setHistory(prev => [...prev, tubes.map(t => [...t])]);
      const blocksToMove = foolActive ? 1 : Math.min(consecutiveCount, availableSpace);
      const movingBlocks = Array(blocksToMove).fill(colorToMove);

      const newTubes = [...tubes];
      newTubes[selectedTube] = sourceTube.slice(0, sourceTube.length - blocksToMove);
      newTubes[index] = [...targetTube, ...movingBlocks];

      setTubes(newTubes);
      if (foolActive && !isTargetEmpty && !isSameColor) setPowers(p => ({ ...p, fool: p.fool - 1 }));
      setFoolActive(false);
    }
    setSelectedTube(null);
  };

  const useUndo = () => {
    if (powers.undo > 0 && history.length > 0 && !tutorial) {
      setTubes(history[history.length - 1]);
      setHistory(prev => prev.slice(0, -1));
      setPowers(p => ({ ...p, undo: p.undo - 1 }));
      setSelectedTube(null);
    }
  };

  const useExtraTube = () => {
    if (powers.extra > 0 && !tutorial) {
      setTubes(prev => [...prev, []]);
      setPowers(p => ({ ...p, extra: p.extra - 1 }));
    }
  };

  const nextLevel = () => {
    if (gameMode === 'story') {
      if (currentLevel < LEVEL_CONFIG.length - 1) {
        setCurrentLevel(l => l + 1);
      } else {
        setEndingPhase(0);
        setScreen('ending');
      }
    } else {
      setCurrentLevel(l => l + 1);
    }
  };

  const saveEndlessScore = () => {
    const newBoard = [...leaderboard, { name: "Wildiany", score: currentLevel }];
    newBoard.sort((a, b) => b.score - a.score);
    const top10 = newBoard.slice(0, 10);
    setLeaderboard(top10);
    localStorage.setItem('wildiany_scores', JSON.stringify(top10));
    setScreen('leaderboard');
  };

  const handleDevClick = () => {
    setDevClicks(prev => {
      if (prev + 1 >= 5) setDevMode(true);
      return prev + 1;
    });
  };

  const forceWinLevel = () => {
    const activeColors = ALL_COLORS.slice(0, config.colors);
    const solvedTubes = activeColors.map(c => [c, c, c, c]);
    for(let i=0; i<config.empty; i++) solvedTubes.push([]);
    setTubes(solvedTubes);
    setDevMode(false);
    setDevClicks(0);
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden relative font-sans select-none touch-manipulation text-white" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/60 z-0 pointer-events-none"></div>

      {screen === 'menu' && (
        <div className="z-10 flex flex-col items-center justify-between flex-1 p-6 text-center h-full">
          <div className="flex-1 flex flex-col justify-center items-center w-full">
            <div className="bg-black/60 p-8 rounded-3xl border-2 border-amber-900/50 backdrop-blur-md w-full max-w-sm">
              <h1 className="text-5xl font-black text-amber-300 drop-shadow-lg mb-2" style={{ fontFamily: 'serif' }}>Tarot Sort</h1>
              <p className="text-amber-100 text-xl font-medium mb-8">Una ofrenda corrompida</p>
              
              <div className="flex flex-col gap-4">
                <button onClick={() => { setGameMode('story'); setCurrentLevel(0); setScreen('story'); }} className="bg-gradient-to-r from-amber-700 to-amber-500 text-black text-xl font-black py-3 px-8 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:scale-105 transition-transform">
                  DESCENDER
                </button>
                
                {gameBeaten && (
                  <button onClick={() => { setGameMode('endless'); setCurrentLevel(1); setScreen('playing'); }} className="bg-gradient-to-r from-purple-700 to-fuchsia-600 text-white text-xl font-black py-3 px-8 rounded-full shadow-[0_0_20px_rgba(192,38,211,0.4)] hover:scale-105 transition-transform animate-pulse">
                    EL BUCLE
                  </button>
                )}
                
                {gameBeaten && (
                  <div className="flex justify-between mt-4">
                    <button onClick={() => setScreen('achievements')} className="text-amber-400 font-bold underline">Códice</button>
                    <button onClick={() => setScreen('leaderboard')} className="text-fuchsia-400 font-bold underline">Memorias</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mb-2 text-slate-500 font-mono text-sm tracking-widest">v0.0.1 - Pre-Alpha</div>
        </div>
      )}

      {screen === 'story' && (
        <div className="z-10 flex flex-col items-center justify-center flex-1 p-6 text-center animate-in fade-in duration-500">
          <div className="bg-slate-900/90 border-4 border-indigo-900/80 p-6 rounded-2xl max-w-md backdrop-blur-md">
            <h2 className="text-3xl font-bold text-fuchsia-400 mb-6 font-serif">El Festín Arruinado</h2>
            <div className="text-slate-200 text-lg space-y-4 mb-8 text-left leading-relaxed">
              <p>Todo estaba listo, pero algo en las sombras tenía un hambre insaciable por los días felices.</p>
              <p>Una masa glotona emergió de la nada, devorando tu regalo frente a tus ojos antes de arrastrarse hacia las profundidades.</p>
              <p>Ahora, el camino está bloqueado por viales de esencias inestables. Solo el eco de los Arcanos Mayores puede devolver el orden... o romperlo por completo.</p>
            </div>
            <div className="flex justify-center mb-8 relative">
               <img src={bossSprite} alt="Engendro" className="w-24 drop-shadow-[0_0_15px_rgba(192,38,211,0.5)]" />
            </div>
            <button onClick={() => setScreen('playing')} className="bg-fuchsia-700 text-white text-xl font-bold py-3 px-8 rounded-full shadow-[0_0_15px_rgba(192,38,211,0.6)] hover:scale-105 transition-transform w-full">
              Entrar en la Oscuridad
            </button>
          </div>
        </div>
      )}

      {screen === 'ending' && (
        <div className="z-10 flex flex-col items-center justify-center flex-1 p-6 text-center animate-in fade-in duration-1000">
          <div className="bg-black/90 p-8 rounded-2xl max-w-md backdrop-blur-md border-2 border-amber-500">
            
            {endingPhase === 0 && (
              <div className="animate-in slide-in-from-bottom-10 fade-in duration-700">
                <img src={bossSprite} alt="Defeated" className="w-24 mx-auto mb-6 grayscale opacity-50 rotate-180" />
                <h2 className="text-3xl font-bold text-amber-400 mb-6 font-serif">El orden ha vuelto...</h2>
                <p className="text-slate-100 text-xl leading-relaxed italic border-l-4 border-amber-500 pl-4 text-left">
                  "Feliz cumpleaños mi amor, te hice este jueguito de aguas como querías que te hiciera. Te lo regalo para que te diviertas un poco con este jueguito"
                </p>
                <button 
                  onClick={() => setEndingPhase(1)} 
                  className="mt-8 bg-amber-600 text-black font-bold py-2 px-8 rounded-full hover:scale-105 animate-pulse"
                >
                  Abrir Regalo
                </button>
              </div>
            )}

            {endingPhase > 0 && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-fuchsia-400 mb-8 font-serif">Nuevas sendas abiertas...</h2>
                
                {endingPhase >= 1 && (
                  <div className="bg-slate-800 border-2 border-slate-600 p-4 rounded-xl flex items-center gap-4 animate-in zoom-in fade-in duration-500 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    <div className="text-4xl">{ACHIEVEMENTS_DB[0].icon}</div>
                    <div className="text-left">
                      <p className="text-amber-400 font-bold text-sm uppercase tracking-wider">Visión Adquirida</p>
                      <p className="font-bold text-lg">{ACHIEVEMENTS_DB[0].title}</p>
                      <p className="text-sm text-slate-300">{ACHIEVEMENTS_DB[0].desc}</p>
                    </div>
                  </div>
                )}

                {endingPhase >= 2 && (
                  <div className="bg-slate-800 border-2 border-slate-600 p-4 rounded-xl flex items-center gap-4 animate-in zoom-in fade-in duration-500 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                    <div className="text-4xl">{ACHIEVEMENTS_DB[1].icon}</div>
                    <div className="text-left">
                      <p className="text-amber-400 font-bold text-sm uppercase tracking-wider">Visión Adquirida</p>
                      <p className="font-bold text-lg">{ACHIEVEMENTS_DB[1].title}</p>
                      <p className="text-sm text-slate-300">{ACHIEVEMENTS_DB[1].desc}</p>
                    </div>
                  </div>
                )}

                <button 
                  onClick={() => {
                    if (endingPhase === 1) setEndingPhase(2);
                    else if (endingPhase === 2) {
                      localStorage.setItem('wildiany_game_beaten', 'true');
                      setGameBeaten(true);
                      setScreen('menu');
                    }
                  }} 
                  className="mt-8 bg-slate-200 text-black font-bold py-2 px-8 rounded-full hover:scale-105"
                >
                  {endingPhase === 1 ? 'Adentrarse...' : 'Despertar'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {screen === 'achievements' && (
        <div className="z-10 flex flex-col items-center justify-center flex-1 p-6 text-center">
          <div className="bg-black/90 p-8 rounded-2xl w-full max-w-sm backdrop-blur-md border border-amber-500/30">
            <h2 className="text-3xl font-bold text-amber-400 mb-6 font-serif">El Códice</h2>
            <div className="flex flex-col gap-4 mb-8">
              {ACHIEVEMENTS_DB.map((ach) => (
                <div key={ach.id} className="bg-slate-800 border-2 border-amber-600/50 p-4 rounded-xl flex items-center gap-4 shadow-md">
                  <div className="text-3xl">{ach.icon}</div>
                  <div className="text-left">
                    <p className="font-bold text-slate-100">{ach.title}</p>
                    <p className="text-xs text-slate-400">{ach.desc}</p>
                  </div>
                </div>
              ))}
              <div className="bg-slate-900 border-2 border-slate-700 border-dashed p-4 rounded-xl flex items-center gap-4 opacity-50">
                <div className="text-3xl">❓</div>
                <div className="text-left">
                  <p className="font-bold text-slate-500">Oculto...</p>
                  <p className="text-xs text-slate-600">Aún por descubrir.</p>
                </div>
              </div>
            </div>
            <button onClick={() => setScreen('menu')} className="bg-slate-700 text-white font-bold py-2 px-8 rounded-full hover:scale-105">Cerrar</button>
          </div>
        </div>
      )}

      {screen === 'leaderboard' && (
        <div className="z-10 flex flex-col items-center justify-center flex-1 p-6 text-center">
          <div className="bg-black/90 p-8 rounded-2xl w-full max-w-sm backdrop-blur-md border border-fuchsia-500/30">
            <h2 className="text-3xl font-bold text-fuchsia-400 mb-6 font-serif">Memorias</h2>
            <div className="flex flex-col gap-2 mb-8">
              {leaderboard.length === 0 ? <p className="text-slate-400">Nadie ha bajado tanto aún.</p> : leaderboard.map((l, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                  <span className="font-bold text-amber-400">#{i+1} {l.name}</span>
                  <span className="text-white text-sm bg-slate-900 px-2 py-1 rounded">Estrato {l.score}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setScreen('menu')} className="bg-slate-700 text-white font-bold py-2 px-8 rounded-full hover:scale-105">Cerrar</button>
          </div>
        </div>
      )}

      {screen === 'playing' && (
        <div className="flex flex-col h-full w-full flex-1">
          <div className="z-10 mt-6 text-center">
            <h1 onClick={handleDevClick} className="text-2xl font-black text-amber-200 drop-shadow-md font-serif cursor-pointer">
              Tarot Sort
            </h1>
            <div className="mt-1 text-sm font-bold text-slate-200">
              {gameMode === 'endless' ? `Estrato ${currentLevel}` : config.boss ? "¡LA MATERIA OSCURA!" : `Nivel ${currentLevel + 1} de 15`} 
            </div>
            {devMode && (
              <button onClick={forceWinLevel} className="mt-2 bg-red-600 text-white text-xs font-bold py-1 px-4 rounded animate-pulse">
                🚀 Auto-Completar (DEV)
              </button>
            )}
          </div>

          <div className="z-10 flex flex-wrap justify-center content-center gap-x-2 gap-y-10 px-4 mt-8 mb-auto max-w-[400px] mx-auto">
            {tubes.map((tubeColors, index) => (
              <Tube key={index} colors={tubeColors} blind={config.blind} isSelected={selectedTube === index} onClick={() => handleTubeClick(index)} isComplete={tubeColors.length === 4 && tubeColors.every(c => c === tubeColors[0] && c !== 'ROCK')} />
            ))}
          </div>

          <div className="z-10 flex flex-col items-center w-full max-w-md mx-auto pb-4">
            <div className="flex justify-end w-full px-8 mb-2 h-[100px]">
              {config.boss && (
                 <div className="relative flex flex-col items-center">
                  <img src={bossSprite} alt="Boss" className="w-20 animate-pulse drop-shadow-2xl" />
                </div>
              )}
            </div>

            <div className="flex gap-4 bg-black/60 p-4 rounded-t-3xl border-t-2 border-amber-900/50 w-full justify-center">
              <div className={`relative cursor-pointer transition-transform ${tutorial || powers.fool === 0 ? 'opacity-50 grayscale' : 'hover:-translate-y-2'}`} onClick={() => !tutorial && powers.fool > 0 && setFoolActive(!foolActive)}>
                <img src={jokerCard} alt="Fool" className={`w-16 rounded-md border-2 ${foolActive ? 'border-fuchsia-500' : 'border-transparent'}`} />
                {powers.fool > 0 && <div className="absolute -top-2 -right-2 bg-fuchsia-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{powers.fool}</div>}
              </div>
              <div className={`relative cursor-pointer transition-transform ${tutorial || powers.undo === 0 || history.length === 0 ? 'opacity-50 grayscale' : 'hover:-translate-y-2'}`} onClick={useUndo}>
                <img src={jokerCard} alt="Undo" className="w-16 rounded-md hue-rotate-180 brightness-75" />
                {powers.undo > 0 && <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{powers.undo}</div>}
              </div>
              <div className={`relative cursor-pointer transition-transform ${tutorial || powers.extra === 0 ? 'opacity-50 grayscale' : 'hover:-translate-y-2'}`} onClick={useExtraTube}>
                <img src={jokerCard} alt="Extra" className="w-16 rounded-md hue-rotate-90 brightness-110" />
                {powers.extra > 0 && <div className="absolute -top-2 -right-2 bg-green-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{powers.extra}</div>}
              </div>
            </div>
          </div>

          {tutorial && TUTORIALS[tutorial] && (
            <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-6 text-center">
              <div className="bg-slate-900 border-4 border-amber-900 p-6 rounded-2xl max-w-sm">
                <h3 className={`text-2xl font-bold mb-4 font-serif ${TUTORIALS[tutorial].color}`}>{TUTORIALS[tutorial].title}</h3>
                <p className="text-slate-200 mb-6">{TUTORIALS[tutorial].text}</p>
                <button onClick={() => setTutorial(null)} className="bg-amber-600 text-black font-bold py-2 px-6 rounded-full">Comprendo...</button>
              </div>
            </div>
          )}

          {hasWon && !tutorial && (
            <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 text-center transition-opacity duration-300">
              <h2 className="text-4xl font-bold text-amber-400 mb-6 font-serif">{config.boss ? '¡PURIFICADO!' : `¡El orden prevalece!`}</h2>
              {gameMode === 'endless' && (
                <div className="mb-6">
                   <p className="text-slate-300 mb-2">¿Dejarás tu marca aquí?</p>
                   <button onClick={saveEndlessScore} className="bg-fuchsia-700 text-white font-bold py-2 px-6 rounded-full mb-4">Grabar Memoria y Salir</button>
                   <p className="text-slate-500 text-sm">O puedes seguir descendiendo...</p>
                </div>
              )}
              <button onClick={nextLevel} className="bg-gradient-to-r from-amber-600 to-amber-400 text-black font-black py-3 px-8 rounded-full shadow-[0_0_20px_rgba(251,191,36,0.5)] active:scale-95 transition-transform">
                {config.boss ? 'Reclamar Ofrenda' : 'Avanzar'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}