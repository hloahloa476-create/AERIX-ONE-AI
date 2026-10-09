import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  X,
  Trophy,
  RotateCcw,
  Zap,
  Rocket,
  Timer,
  Grid,
  ChevronLeft,
  Flame,
  Volume2
} from 'lucide-react';
import { soundEffects } from '../../utils/sound';

interface ArcadeAppProps {
  onClose: () => void;
}

type GameId = 'menu' | 'racing' | 'space' | 'reaction' | 'memory';

export const ArcadeApp: React.FC<ArcadeAppProps> = ({ onClose }) => {
  const [activeGame, setActiveGame] = useState<GameId>('menu');

  return (
    <div className="fixed inset-0 z-40 bg-[#040711] text-slate-100 flex flex-col overflow-hidden select-none pb-16">
      {/* Top Header */}
      <div className="p-3 aerix-glass border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          {activeGame !== 'menu' && (
            <button
              onClick={() => {
                soundEffects.playHapticClick();
                setActiveGame('menu');
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold font-display text-white">
              AERIX ARCADE
            </h2>
            <span className="text-[10px] font-mono text-amber-400">
              Interactive 2D Game Suite
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeGame === 'menu' && <ArcadeMenu onSelectGame={setActiveGame} />}
        {activeGame === 'racing' && <ElectricRacingGame onExit={() => setActiveGame('menu')} />}
        {activeGame === 'space' && <SpaceDefenderGame onExit={() => setActiveGame('menu')} />}
        {activeGame === 'reaction' && <ReactionTestGame onExit={() => setActiveGame('menu')} />}
        {activeGame === 'memory' && <MemoryMatrixGame onExit={() => setActiveGame('menu')} />}
      </div>
    </div>
  );
};

/* --- ARCADE MENU --- */
const ArcadeMenu: React.FC<{ onSelectGame: (g: GameId) => void }> = ({ onSelectGame }) => {
  const games = [
    {
      id: 'racing' as GameId,
      title: 'Electric Car Racing',
      desc: 'Evade heavy commuter traffic and gather energy cells.',
      icon: Zap,
      accent: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/40 text-cyan-400',
      badge: 'High Speed',
    },
    {
      id: 'space' as GameId,
      title: 'Space Defender',
      desc: 'Intercept orbital asteroids with your plasma cannons.',
      icon: Rocket,
      accent: 'from-purple-500/20 to-pink-500/10 border-purple-500/40 text-purple-400',
      badge: 'Shooter',
    },
    {
      id: 'reaction' as GameId,
      title: 'Reaction Velocity Test',
      desc: 'Benchmark your biological reflexes in milliseconds.',
      icon: Timer,
      accent: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-400',
      badge: 'Benchmark',
    },
    {
      id: 'memory' as GameId,
      title: 'Neural Memory Matrix',
      desc: 'Match synaptic pairs in the 4x4 cryptographic grid.',
      icon: Grid,
      accent: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-400',
      badge: 'Cognitive',
    },
  ];

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <div className="p-4 rounded-3xl aerix-glass border border-amber-500/30 text-center space-y-1">
        <Trophy className="w-8 h-8 text-amber-400 mx-auto" />
        <h3 className="font-display font-bold text-lg text-white">Arcade Champions Hub</h3>
        <p className="text-xs text-slate-400">All games run at 60 FPS offline on the local node.</p>
      </div>

      <div className="space-y-3">
        {games.map((g) => {
          const Icon = g.icon;
          return (
            <div
              key={g.id}
              onClick={() => {
                soundEffects.playHapticClick();
                onSelectGame(g.id);
              }}
              className="p-4 rounded-3xl aerix-glass-card border hover:border-cyan-500/50 cursor-pointer flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${g.accent} border flex items-center justify-center shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-white group-hover:text-cyan-300">
                      {g.title}
                    </h4>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {g.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{g.desc}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* --- 1. ELECTRIC CAR RACING GAME --- */
const ElectricRacingGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [lane, setLane] = useState(1); // 0 = Left, 1 = Center, 2 = Right
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [obstacles, setObstacles] = useState<{ id: number; lane: number; y: number; type: 'car' | 'energy' }[]>([]);

  useEffect(() => {
    if (gameOver) return;

    const gameLoop = setInterval(() => {
      setScore((s) => s + 10);

      // Move obstacles down
      setObstacles((prev) => {
        const moved = prev
          .map((o) => ({ ...o, y: o.y + 7 }))
          .filter((o) => o.y < 400);

        // Collision check
        for (const obs of moved) {
          if (obs.y > 300 && obs.y < 350 && obs.lane === lane) {
            if (obs.type === 'car') {
              soundEffects.playTone(150, 0.3);
              setGameOver(true);
            } else if (obs.type === 'energy') {
              soundEffects.playSuccessBeep();
              setScore((s) => s + 250);
              return moved.filter((m) => m.id !== obs.id);
            }
          }
        }

        // Spawn new obstacle periodically
        if (Math.random() < 0.28 && moved.length < 5) {
          const spawnLane = Math.floor(Math.random() * 3);
          const type = Math.random() < 0.3 ? 'energy' : 'car';
          moved.push({
            id: Date.now() + Math.random(),
            lane: spawnLane,
            y: 0,
            type,
          });
        }

        return moved;
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [lane, gameOver]);

  const moveLeft = () => {
    soundEffects.playHapticClick();
    setLane((l) => Math.max(l - 1, 0));
  };

  const moveRight = () => {
    soundEffects.playHapticClick();
    setLane((l) => Math.min(l + 1, 2));
  };

  const restart = () => {
    setLane(1);
    setScore(0);
    setObstacles([]);
    setGameOver(false);
  };

  return (
    <div className="p-4 max-w-sm mx-auto flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-2">
        <span className="font-mono text-cyan-400 text-xs">Electric Car Racing</span>
        <span className="font-mono text-white text-xs font-bold">Score: {score}</span>
      </div>

      {/* Track Canvas */}
      <div className="w-72 h-96 bg-slate-900 border-2 border-cyan-500/40 rounded-3xl relative overflow-hidden shadow-2xl">
        {/* Track Lane Markers */}
        <div className="absolute inset-0 flex justify-between px-24 pointer-events-none opacity-30">
          <div className="w-1 border-r border-dashed border-cyan-400 h-full" />
          <div className="w-1 border-r border-dashed border-cyan-400 h-full" />
        </div>

        {/* Player Car */}
        <div
          className="absolute bottom-8 w-14 h-18 bg-cyan-500 rounded-xl border border-white flex flex-col items-center justify-center text-slate-950 font-bold transition-all duration-100 shadow-lg shadow-cyan-500/50"
          style={{
            left: `${lane * 80 + 18}px`,
          }}
        >
          <Zap className="w-6 h-6 fill-current text-white" />
        </div>

        {/* Obstacles & Energy */}
        {obstacles.map((obs) => (
          <div
            key={obs.id}
            className={`absolute w-12 h-14 rounded-xl flex items-center justify-center text-xs font-bold shadow-md ${
              obs.type === 'car'
                ? 'bg-rose-600 text-white border border-rose-400'
                : 'bg-emerald-400 text-slate-950 border border-white animate-bounce'
            }`}
            style={{
              top: `${obs.y}px`,
              left: `${obs.lane * 80 + 20}px`,
            }}
          >
            {obs.type === 'car' ? 'EV' : '⚡'}
          </div>
        ))}

        {/* Game Over Screen */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center">
            <h3 className="text-xl font-bold font-display text-rose-400">Impact Detected</h3>
            <p className="text-xs text-slate-300 mt-1">Final Score: {score}</p>
            <button
              onClick={restart}
              className="mt-4 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Re-engage
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="w-72 mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={moveLeft}
          className="py-3 bg-slate-800 border border-slate-700 hover:border-cyan-500 rounded-2xl text-xs font-bold active:scale-95"
        >
          ◀ Steer Left
        </button>
        <button
          onClick={moveRight}
          className="py-3 bg-slate-800 border border-slate-700 hover:border-cyan-500 rounded-2xl text-xs font-bold active:scale-95"
        >
          Steer Right ▶
        </button>
      </div>
    </div>
  );
};

/* --- 2. SPACE DEFENDER GAME --- */
const SpaceDefenderGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [shipX, setShipX] = useState(130);
  const [score, setScore] = useState(0);
  const [asteroids, setAsteroids] = useState<{ id: number; x: number; y: number }[]>([]);
  const [lasers, setLasers] = useState<{ id: number; x: number; y: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    if (gameOver) return;

    const loop = setInterval(() => {
      // Advance lasers
      setLasers((prev) =>
        prev.map((l) => ({ ...l, y: l.y - 12 })).filter((l) => l.y > 0)
      );

      // Advance asteroids
      setAsteroids((prev) => {
        let list = prev
          .map((a) => ({ ...a, y: a.y + 4 }))
          .filter((a) => a.y < 380);

        // Check if asteroid reached bottom
        if (list.some((a) => a.y > 330 && Math.abs(a.x - shipX) < 30)) {
          soundEffects.playTone(100, 0.4);
          setGameOver(true);
        }

        // Spawn
        if (Math.random() < 0.25 && list.length < 5) {
          list.push({
            id: Date.now() + Math.random(),
            x: Math.floor(Math.random() * 230) + 15,
            y: 0,
          });
        }
        return list;
      });

      // Hit detection
      setLasers((currLasers) => {
        setAsteroids((currAsteroids) => {
          const hitAsteroids = new Set<number>();
          const hitLasers = new Set<number>();

          for (const l of currLasers) {
            for (const a of currAsteroids) {
              if (Math.abs(l.x - a.x) < 25 && Math.abs(l.y - a.y) < 25) {
                hitAsteroids.add(a.id);
                hitLasers.add(l.id);
                soundEffects.playLaser();
                setScore((s) => s + 50);
              }
            }
          }

          return currAsteroids.filter((a) => !hitAsteroids.has(a.id));
        });
        return currLasers;
      });
    }, 50);

    return () => clearInterval(loop);
  }, [shipX, gameOver]);

  const fireLaser = () => {
    soundEffects.playLaser();
    setLasers((prev) => [...prev, { id: Date.now(), x: shipX + 16, y: 310 }]);
  };

  const handlePointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 20;
    setShipX(Math.max(10, Math.min(x, 240)));
  };

  const restart = () => {
    setScore(0);
    setAsteroids([]);
    setLasers([]);
    setGameOver(false);
  };

  return (
    <div className="p-4 max-w-sm mx-auto flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-2">
        <span className="font-mono text-purple-400 text-xs">Space Defender</span>
        <span className="font-mono text-white text-xs font-bold">Interceptions: {score}</span>
      </div>

      <div
        onPointerMove={handlePointer}
        onClick={fireLaser}
        className="w-72 h-96 bg-[#020308] border-2 border-purple-500/40 rounded-3xl relative overflow-hidden shadow-2xl cursor-crosshair"
      >
        {/* Stars */}
        <div className="absolute inset-0 bg-[radial-gradient(white_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />

        {/* Ship */}
        <div
          className="absolute bottom-6 w-10 h-10 text-cyan-400 flex items-center justify-center transition-all duration-75"
          style={{ left: `${shipX}px` }}
        >
          <Rocket className="w-8 h-8 fill-cyan-400/30" />
        </div>

        {/* Lasers */}
        {lasers.map((l) => (
          <div
            key={l.id}
            className="absolute w-1.5 h-4 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/80"
            style={{ left: `${l.x}px`, top: `${l.y}px` }}
          />
        ))}

        {/* Asteroids */}
        {asteroids.map((a) => (
          <div
            key={a.id}
            className="absolute w-8 h-8 bg-amber-700/80 border border-amber-400 rounded-full flex items-center justify-center text-[10px] text-white shadow-md"
            style={{ left: `${a.x}px`, top: `${a.y}px` }}
          >
            ☄️
          </div>
        ))}

        {/* Game Over */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center">
            <h3 className="text-xl font-bold font-display text-rose-400">Shield Collapsed</h3>
            <p className="text-xs text-slate-300 mt-1">Total Interceptions: {score}</p>
            <button
              onClick={restart}
              className="mt-4 px-4 py-2 rounded-xl bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Recharge Shields
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 text-center text-xs text-slate-400">
        Slide to pilot · Tap anywhere to discharge plasma
      </div>
    </div>
  );
};

/* --- 3. REACTION TEST GAME --- */
const ReactionTestGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [state, setState] = useState<'idle' | 'waiting' | 'ready' | 'result' | 'early'>('idle');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  const startTest = () => {
    setState('waiting');
    setReactionTime(null);
    const delay = Math.floor(Math.random() * 2500) + 1500;
    timerRef.current = window.setTimeout(() => {
      setState('ready');
      startTimeRef.current = performance.now();
    }, delay);
  };

  const handleBoxClick = () => {
    if (state === 'idle' || state === 'result' || state === 'early') {
      startTest();
    } else if (state === 'waiting') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setState('early');
      soundEffects.playTone(200, 0.2);
    } else if (state === 'ready') {
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      setReactionTime(elapsed);
      setState('result');
      soundEffects.playSuccessBeep();
    }
  };

  return (
    <div className="p-4 max-w-sm mx-auto flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-2">
        <span className="font-mono text-emerald-400 text-xs">Reaction Velocity</span>
        <span className="font-mono text-white text-xs font-bold">Bio-Clock</span>
      </div>

      <div
        onClick={handleBoxClick}
        className={`w-72 h-80 rounded-3xl flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none transition-colors border-2 shadow-2xl ${
          state === 'idle'
            ? 'bg-slate-900 border-slate-700 text-slate-200'
            : state === 'waiting'
            ? 'bg-rose-950 border-rose-700 text-rose-200'
            : state === 'ready'
            ? 'bg-emerald-500 border-emerald-300 text-slate-950 font-bold'
            : state === 'result'
            ? 'bg-slate-900 border-cyan-500 text-white'
            : 'bg-amber-950 border-amber-700 text-amber-200'
        }`}
      >
        {state === 'idle' && (
          <>
            <Timer className="w-12 h-12 text-slate-400 mb-2" />
            <h4 className="font-bold text-base">Tap to Start Benchmark</h4>
            <p className="text-xs text-slate-400 mt-1">Wait for screen to turn GREEN, then tap instantly.</p>
          </>
        )}

        {state === 'waiting' && (
          <>
            <h4 className="font-bold text-xl text-rose-300 animate-pulse">Wait for Green...</h4>
            <p className="text-xs text-rose-400/80 mt-1">Do not tap yet!</p>
          </>
        )}

        {state === 'ready' && (
          <>
            <Flame className="w-16 h-16 animate-bounce" />
            <h4 className="font-extrabold text-2xl uppercase">TAP NOW!</h4>
          </>
        )}

        {state === 'early' && (
          <>
            <h4 className="font-bold text-lg text-amber-300">Too Early!</h4>
            <p className="text-xs text-amber-400 mt-1">Tap to try again.</p>
          </>
        )}

        {state === 'result' && (
          <>
            <div className="font-mono text-4xl font-extrabold text-cyan-400">{reactionTime} ms</div>
            <p className="text-xs text-slate-300 mt-2 font-medium">
              {reactionTime! < 200
                ? 'Superhuman reflex speed! 🚀'
                : reactionTime! < 260
                ? 'Excellent biological latency.'
                : 'Average neural reflex.'}
            </p>
            <span className="text-[10px] text-slate-500 mt-4">Tap to test again</span>
          </>
        )}
      </div>
    </div>
  );
};

/* --- 4. MEMORY GAME --- */
const MemoryMatrixGame: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const icons = ['⚡', '🛰️', '🪐', '🧬', '💎', '🚀', '🔮', '🔋'];
  const [cards, setCards] = useState<{ id: number; symbol: string; matched: boolean }[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const initGame = () => {
    const deck = [...icons, ...icons]
      .sort(() => Math.random() - 0.5)
      .map((symbol, idx) => ({ id: idx, symbol, matched: false }));
    setCards(deck);
    setFlipped([]);
    setMoves(0);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (idx: number) => {
    if (flipped.length === 2 || flipped.includes(idx) || cards[idx].matched) return;
    soundEffects.playHapticClick();

    const newFlipped = [...flipped, idx];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [first, second] = newFlipped;
      if (cards[first].symbol === cards[second].symbol) {
        soundEffects.playSuccessBeep();
        setCards((prev) =>
          prev.map((c, i) => (i === first || i === second ? { ...c, matched: true } : c))
        );
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  const isWon = cards.length > 0 && cards.every((c) => c.matched);

  return (
    <div className="p-4 max-w-sm mx-auto flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-2">
        <span className="font-mono text-amber-400 text-xs">Neural Memory Matrix</span>
        <span className="font-mono text-white text-xs font-bold">Moves: {moves}</span>
      </div>

      <div className="grid grid-cols-4 gap-2.5 w-72">
        {cards.map((card, idx) => {
          const isFlipped = flipped.includes(idx) || card.matched;
          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(idx)}
              className={`h-16 rounded-2xl flex items-center justify-center text-xl cursor-pointer select-none transition-all duration-200 border ${
                card.matched
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                  : isFlipped
                  ? 'bg-slate-800 border-amber-400 text-white shadow-lg'
                  : 'bg-slate-900/90 border-slate-700 hover:border-slate-500'
              }`}
            >
              {isFlipped ? card.symbol : '✦'}
            </div>
          );
        })}
      </div>

      {isWon && (
        <div className="mt-4 p-4 rounded-2xl bg-amber-950/40 border border-amber-500 text-center w-72">
          <h4 className="font-bold text-amber-400 text-sm">Synaptic Matrix Cleared!</h4>
          <p className="text-xs text-slate-300 mt-0.5">Completed in {moves} attempts.</p>
          <button
            onClick={initGame}
            className="mt-2 px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};
