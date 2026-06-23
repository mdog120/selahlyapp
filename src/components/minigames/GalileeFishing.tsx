"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Anchor, BookOpen, Fish, Sparkles, Waves } from "lucide-react";

type CastState = "idle" | "casting" | "waiting" | "bite" | "caught" | "missed";
type CatchRarity = "common" | "blessed" | "miracle";

interface CatchItem {
  id: string;
  name: string;
  emoji: string;
  rarity: CatchRarity;
  points: number;
  verse: string;
  reference: string;
  color: string;
}

interface FloatingCatch extends CatchItem {
  caughtId: string;
}

interface SaveData {
  totalFish?: number;
  bestStreak?: number;
  pearls?: number;
  journal?: string[];
}

const SAVE_KEY = "selahly_galilee_fishing_v1";

const CATCHES: CatchItem[] = [
  {
    id: "faith",
    name: "Faith Fish",
    emoji: "🐟",
    rarity: "common",
    points: 8,
    verse: "Follow me, and I will make you fishers of men.",
    reference: "Matthew 4:19",
    color: "from-sky-200 to-cyan-300",
  },
  {
    id: "peace",
    name: "Peace Minnow",
    emoji: "🐠",
    rarity: "common",
    points: 9,
    verse: "Peace I leave with you; my peace I give unto you.",
    reference: "John 14:27",
    color: "from-teal-200 to-emerald-300",
  },
  {
    id: "mercy",
    name: "Mercy Koi",
    emoji: "🐡",
    rarity: "common",
    points: 10,
    verse: "His mercies are new every morning.",
    reference: "Lamentations 3:23",
    color: "from-rose-200 to-orange-200",
  },
  {
    id: "loaves",
    name: "Loaves & Fishes Basket",
    emoji: "🧺",
    rarity: "blessed",
    points: 18,
    verse: "They did all eat, and were filled.",
    reference: "Matthew 14:20",
    color: "from-amber-200 to-yellow-300",
  },
  {
    id: "pearl",
    name: "Pearl of Great Price",
    emoji: "🦪",
    rarity: "blessed",
    points: 22,
    verse: "The kingdom of heaven is like unto a merchant seeking goodly pearls.",
    reference: "Matthew 13:45",
    color: "from-violet-200 to-rose-200",
  },
  {
    id: "net",
    name: "Overflowing Net",
    emoji: "🕸️",
    rarity: "miracle",
    points: 35,
    verse: "They enclosed a great multitude of fishes.",
    reference: "Luke 5:6",
    color: "from-indigo-200 via-sky-200 to-amber-200",
  },
];

const ENCOURAGEMENTS = [
  "Cast with patience. Good things surface in quiet waters.",
  "The lake is calm, and grace is near.",
  "Steady hands, soft heart, eyes on the ripple.",
  "Every small catch still belongs in the basket.",
];

const rarityStyle: Record<CatchRarity, string> = {
  common: "bg-sky-50 text-sky-700 border-sky-200",
  blessed: "bg-amber-50 text-amber-800 border-amber-200",
  miracle: "bg-violet-50 text-violet-800 border-violet-200",
};

function chooseCatch(streak: number): CatchItem {
  const roll = Math.random();
  const miracleChance = Math.min(0.08 + streak * 0.012, 0.2);
  const blessedChance = Math.min(0.28 + streak * 0.018, 0.45);

  const pool =
    roll < miracleChance
      ? CATCHES.filter((item) => item.rarity === "miracle")
      : roll < blessedChance
        ? CATCHES.filter((item) => item.rarity === "blessed")
        : CATCHES.filter((item) => item.rarity === "common");

  return pool[Math.floor(Math.random() * pool.length)];
}

export function GalileeFishing() {
  const [castState, setCastState] = useState<CastState>("idle");
  const [score, setScore] = useState(0);
  const [pearls, setPearls] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalFish, setTotalFish] = useState(0);
  const [message, setMessage] = useState("Tap Cast Line and wait for the golden ripple.");
  const [currentCatch, setCurrentCatch] = useState<CatchItem | null>(null);
  const [floatingCatches, setFloatingCatches] = useState<FloatingCatch[]>([]);
  const [journal, setJournal] = useState<string[]>([]);
  const [rippleX, setRippleX] = useState(52);
  const [bobberX, setBobberX] = useState(52);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showJournal, setShowJournal] = useState(false);
  const biteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const biteWindowRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundTickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const discovered = useMemo(
    () => CATCHES.filter((item) => journal.includes(item.id)),
    [journal]
  );

  const clearTimers = useCallback(() => {
    if (biteTimerRef.current) clearTimeout(biteTimerRef.current);
    if (biteWindowRef.current) clearTimeout(biteWindowRef.current);
    if (roundTickerRef.current) clearInterval(roundTickerRef.current);
    biteTimerRef.current = null;
    biteWindowRef.current = null;
    roundTickerRef.current = null;
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as SaveData;
      queueMicrotask(() => {
        setPearls(saved.pearls ?? 0);
        setTotalFish(saved.totalFish ?? 0);
        setBestStreak(saved.bestStreak ?? 0);
        setJournal(saved.journal ?? []);
      });
    } catch {
      localStorage.removeItem(SAVE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ pearls, totalFish, bestStreak, journal }));
  }, [bestStreak, journal, pearls, totalFish]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const resetRound = useCallback((nextMessage?: string) => {
    clearTimers();
    setCurrentCatch(null);
    setTimeLeft(0);
    setCastState("idle");
    if (nextMessage) setMessage(nextMessage);
  }, [clearTimers]);

  const startBiteWindow = useCallback(() => {
    const catchItem = chooseCatch(streak);
    const nextRipple = 20 + Math.random() * 60;
    setCurrentCatch(catchItem);
    setRippleX(nextRipple);
    setBobberX(nextRipple + (Math.random() * 14 - 7));
    setTimeLeft(5);
    setCastState("bite");
    setMessage("A golden ripple! Reel it in before it slips away!");

    roundTickerRef.current = setInterval(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1));
      setBobberX((previous) => Math.min(86, Math.max(14, previous + (Math.random() * 12 - 6))));
    }, 650);

    biteWindowRef.current = setTimeout(() => {
      clearTimers();
      setCastState("missed");
      setStreak(0);
      setMessage("The fish slipped away. Deep breath — cast again with patience.");
      setTimeout(() => resetRound(), 1300);
    }, 3600);
  }, [clearTimers, resetRound, streak]);

  const castLine = () => {
    if (castState !== "idle") return;

    clearTimers();
    setCastState("casting");
    setCurrentCatch(null);
    setRippleX(20 + Math.random() * 60);
    setBobberX(30 + Math.random() * 40);
    setMessage(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);

    setTimeout(() => {
      setCastState("waiting");
      setMessage("Watch the water... wait for the glowing ripple.");
      biteTimerRef.current = setTimeout(startBiteWindow, 1200 + Math.random() * 1800);
    }, 700);
  };

  const reelIn = () => {
    if (castState !== "bite" || !currentCatch) return;

    const accuracy = Math.abs(bobberX - rippleX);
    if (accuracy > 12) {
      clearTimers();
      setCastState("missed");
      setStreak(0);
      setMessage("Almost! Reel when the bobber is close to the golden ripple.");
      setTimeout(() => resetRound(), 1400);
      return;
    }

    clearTimers();
    const streakBonus = Math.min(streak * 2, 16);
    const earned = currentCatch.points + streakBonus;
    const pearlBonus = currentCatch.rarity === "miracle" ? 4 : currentCatch.rarity === "blessed" ? 2 : 1;
    const caught: FloatingCatch = { ...currentCatch, caughtId: crypto.randomUUID() };

    setCastState("caught");
    setScore((value) => value + earned);
    setPearls((value) => value + pearlBonus);
    setTotalFish((value) => value + 1);
    setStreak((value) => {
      const next = value + 1;
      setBestStreak((best) => Math.max(best, next));
      return next;
    });
    setJournal((items) => Array.from(new Set([...items, currentCatch.id])));
    setFloatingCatches((items) => [caught, ...items].slice(0, 4));
    setMessage(`${currentCatch.emoji} ${currentCatch.name}! +${earned} grace points • ${currentCatch.reference}`);

    setTimeout(() => resetRound("The lake is ready. Cast again when your heart feels steady."), 1800);
  };

  const perfectZone = Math.max(12, 100 - Math.round(Math.abs(bobberX - rippleX) * 5));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 text-warm-cocoa">
      <div className="relative overflow-hidden rounded-[36px] border-[6px] border-white/80 bg-gradient-to-br from-sky-100 via-cyan-50 to-amber-50 p-5 shadow-[0_24px_80px_rgba(69,104,124,0.2)]">
        <div className="absolute -left-20 top-10 h-48 w-48 rounded-full bg-sky-200/45 blur-3xl" />
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-200/50 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-cyan-300/45 via-sky-200/20 to-transparent" />

        <div className="relative z-10 flex flex-col gap-4">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-sky-200 bg-white/70 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-sky-700 shadow-sm">
                <Waves className="h-3 w-3" /> Sea of Galilee
              </div>
              <h2 className="font-serif text-2xl font-black text-[#4e3a31]">Fishers of Faith</h2>
              <p className="max-w-md text-[11px] leading-relaxed text-warm-grey/70">
                Cast your line, watch for the golden ripple, and collect scripture treasures from the quiet lake.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl border border-white/70 bg-white/65 px-3 py-2 shadow-sm">
                <span className="block text-[8px] font-black uppercase tracking-wider text-sky-600/70">Points</span>
                <span className="text-sm font-black">{score}</span>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/65 px-3 py-2 shadow-sm">
                <span className="block text-[8px] font-black uppercase tracking-wider text-amber-600/70">Pearls</span>
                <span className="text-sm font-black">🦪 {pearls}</span>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/65 px-3 py-2 shadow-sm">
                <span className="block text-[8px] font-black uppercase tracking-wider text-rose-600/70">Streak</span>
                <span className="text-sm font-black">{streak} / {bestStreak}</span>
              </div>
            </div>
          </header>

          <div className="relative h-[360px] overflow-hidden rounded-[32px] border border-white/70 bg-gradient-to-b from-sky-200 via-cyan-100 to-cyan-300 shadow-inner">
            <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-sky-100 to-transparent" />
            <div className="absolute left-8 top-9 h-14 w-14 rounded-full bg-amber-200 shadow-[0_0_40px_rgba(251,191,36,0.7)]" />
            <div className="absolute left-24 top-12 h-7 w-20 rounded-full bg-white/75 blur-[1px]" />
            <div className="absolute right-16 top-16 h-6 w-24 rounded-full bg-white/65 blur-[1px]" />

            <div className="absolute bottom-28 left-0 right-0 h-36 overflow-hidden">
              {Array.from({ length: 6 }).map((_, index) => (
                <motion.div
                  key={index}
                  className="absolute h-10 w-[160%] rounded-[50%] border-t border-white/45"
                  style={{ top: index * 22, left: "-30%" }}
                  animate={{ x: [0, index % 2 === 0 ? 18 : -18, 0] }}
                  transition={{ repeat: Infinity, duration: 4 + index * 0.4, ease: "easeInOut" }}
                />
              ))}
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#7fc9b9] to-transparent" />
            <div className="absolute bottom-4 left-8 right-8 flex justify-between text-xl opacity-80">
              <span>🌿</span><span>🪷</span><span>🌾</span><span>🌿</span><span>🪷</span>
            </div>

            <motion.div
              className="absolute bottom-16 left-8 z-20 flex h-28 w-40 items-end justify-center"
              animate={castState === "casting" ? { rotate: [-2, -12, 0] } : { rotate: 0 }}
              transition={{ duration: 0.7 }}
            >
              <div className="absolute bottom-0 h-16 w-32 rounded-[48%_48%_22%_22%] border-2 border-[#6f5144] bg-gradient-to-b from-amber-100 to-amber-300 shadow-[4px_5px_0_rgba(111,81,68,.18)]" />
              <div className="absolute bottom-11 text-4xl">🧕🏽</div>
              <div className="absolute bottom-[78px] left-[86px] h-1.5 w-28 origin-left -rotate-[28deg] rounded-full bg-[#6f5144]" />
              {(castState === "waiting" || castState === "bite" || castState === "caught") && (
                <svg className="absolute bottom-[76px] left-[158px] h-40 w-40 overflow-visible" viewBox="0 0 160 160">
                  <path d={`M 0 0 C 44 38, 74 64, ${bobberX} 128`} fill="none" stroke="#6f5144" strokeWidth="1.5" strokeDasharray="3 4" />
                </svg>
              )}
            </motion.div>

            <AnimatePresence>
              {castState === "bite" && (
                <motion.div
                  className="absolute bottom-[92px] z-10 h-20 w-20 -translate-x-1/2 rounded-full border-4 border-amber-200/70 bg-amber-100/20"
                  style={{ left: `${rippleX}%` }}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: [0.8, 1.22, 0.9], opacity: [0.8, 0.35, 0.8] }}
                  exit={{ scale: 0.2, opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.1 }}
                />
              )}
            </AnimatePresence>

            {(castState === "waiting" || castState === "bite") && (
              <motion.div
                className="absolute bottom-[112px] z-20 -translate-x-1/2 text-3xl drop-shadow-md"
                style={{ left: `${bobberX}%` }}
                animate={{ y: castState === "bite" ? [0, -8, 0, 5, 0] : [0, 3, 0] }}
                transition={{ repeat: Infinity, duration: castState === "bite" ? 0.65 : 1.8 }}
              >
                🎣
              </motion.div>
            )}

            <AnimatePresence>
              {castState === "caught" && currentCatch && (
                <motion.div
                  className="absolute left-1/2 top-28 z-30 -translate-x-1/2 rounded-[28px] border-4 border-white bg-white/90 px-6 py-4 text-center shadow-2xl"
                  initial={{ y: 28, scale: 0.7, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  exit={{ y: -20, scale: 0.8, opacity: 0 }}
                >
                  <div className="text-5xl">{currentCatch.emoji}</div>
                  <div className="mt-1 font-serif text-lg font-black">{currentCatch.name}</div>
                  <div className="text-[10px] font-bold italic text-warm-grey/70">&ldquo;{currentCatch.verse}&rdquo;</div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute left-5 right-5 top-5 z-30 rounded-[24px] border border-white/70 bg-white/70 p-3 text-center shadow-sm backdrop-blur-md">
              <p className="text-[11px] font-bold leading-relaxed text-[#5f4b42]">{message}</p>
              {castState === "bite" && (
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-sky-100">
                  <div
                    className={`h-full rounded-full transition-all ${perfectZone > 70 ? "bg-emerald-400" : perfectZone > 40 ? "bg-amber-400" : "bg-rose-400"}`}
                    style={{ width: `${perfectZone}%` }}
                  />
                </div>
              )}
            </div>

            <div className="absolute bottom-5 left-5 right-5 z-30 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={castLine}
                disabled={castState !== "idle"}
                className="rounded-2xl border border-white/70 bg-gradient-to-r from-sky-500 to-cyan-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Cast Line
              </button>
              <button
                type="button"
                onClick={reelIn}
                disabled={castState !== "bite"}
                className="rounded-2xl border border-white/70 bg-gradient-to-r from-amber-400 to-rose-400 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Reel In {castState === "bite" ? `(${timeLeft})` : ""}
              </button>
              <button
                type="button"
                onClick={() => setShowJournal(true)}
                className="rounded-2xl border border-white/70 bg-white/75 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#5f4b42] shadow-sm transition-all active:scale-95"
              >
                Journal
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-3xl border border-white/70 bg-white/60 p-4 shadow-sm sm:col-span-2">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-sky-700">
            <Fish className="h-4 w-4" /> Recent Catches
          </div>
          <div className="flex min-h-16 flex-wrap gap-2">
            {floatingCatches.length === 0 ? (
              <p className="text-[11px] italic text-warm-grey/50">Your basket is waiting for its first catch.</p>
            ) : (
              floatingCatches.map((item) => (
                <div key={item.caughtId} className={`rounded-2xl border bg-gradient-to-br ${item.color} px-3 py-2 shadow-sm`}>
                  <span className="mr-1 text-lg">{item.emoji}</span>
                  <span className="text-[10px] font-black">{item.name}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/60 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-700">
            <Anchor className="h-4 w-4" /> Lifetime
          </div>
          <p className="text-2xl font-black">{totalFish}</p>
          <p className="text-[10px] text-warm-grey/55">fish and treasures caught</p>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/60 p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-violet-700">
            <Sparkles className="h-4 w-4" /> Discovery
          </div>
          <p className="text-2xl font-black">{discovered.length}/{CATCHES.length}</p>
          <p className="text-[10px] text-warm-grey/55">journal entries found</p>
        </div>
      </div>

      <AnimatePresence>
        {showJournal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-[34px] border border-white/80 bg-[#fffaf0] p-5 shadow-2xl"
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 20 }}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-amber-700">
                    <BookOpen className="h-4 w-4" /> Scripture Catch Journal
                  </div>
                  <h3 className="font-serif text-xl font-black text-[#4e3a31]">Treasures from the Lake</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowJournal(false)}
                  className="rounded-full bg-white px-3 py-1 text-xs font-black text-warm-cocoa shadow-sm"
                >
                  Close
                </button>
              </div>

              <div className="grid gap-3">
                {CATCHES.map((item) => {
                  const isFound = journal.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`rounded-3xl border p-4 transition-all ${isFound ? "border-white bg-white/70 shadow-sm" : "border-stone-200 bg-stone-100/70 opacity-60"}`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{isFound ? item.emoji : "❔"}</span>
                          <div>
                            <p className="text-sm font-black">{isFound ? item.name : "Undiscovered Catch"}</p>
                            <span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${rarityStyle[item.rarity]}`}>
                              {item.rarity}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-black text-amber-700">+{item.points}</span>
                      </div>
                      <p className="text-[11px] font-bold italic leading-relaxed text-warm-grey/70">
                        {isFound ? `“${item.verse}” — ${item.reference}` : "Catch this treasure to reveal its verse."}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
