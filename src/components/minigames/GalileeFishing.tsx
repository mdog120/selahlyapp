"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Anchor, BookOpen, Fish, Sparkles, Waves } from "lucide-react";

type CastState = "idle" | "casting" | "waiting" | "bite" | "reeling" | "caught" | "missed";
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

const SAVE_KEY = "selahly_galilee_fishing_v2";

const CATCHES: CatchItem[] = [
  {
    id: "faith",
    name: "Faith Fish",
    emoji: "🐟",
    rarity: "common",
    points: 10,
    verse: "Follow me, and I will make you fishers of men.",
    reference: "Matthew 4:19",
    color: "from-sky-200 to-cyan-300",
  },
  {
    id: "peace",
    name: "Peace Minnow",
    emoji: "🐠",
    rarity: "common",
    points: 11,
    verse: "Peace I leave with you; my peace I give unto you.",
    reference: "John 14:27",
    color: "from-teal-200 to-emerald-300",
  },
  {
    id: "mercy",
    name: "Mercy Koi",
    emoji: "🐡",
    rarity: "common",
    points: 12,
    verse: "His mercies are new every morning.",
    reference: "Lamentations 3:23",
    color: "from-rose-200 to-orange-200",
  },
  {
    id: "loaves",
    name: "Loaves & Fishes Basket",
    emoji: "🧺",
    rarity: "blessed",
    points: 24,
    verse: "They did all eat, and were filled.",
    reference: "Matthew 14:20",
    color: "from-amber-200 to-yellow-300",
  },
  {
    id: "pearl",
    name: "Pearl of Great Price",
    emoji: "🦪",
    rarity: "blessed",
    points: 28,
    verse: "The kingdom of heaven is like unto a merchant seeking goodly pearls.",
    reference: "Matthew 13:45",
    color: "from-violet-200 to-rose-200",
  },
  {
    id: "net",
    name: "Overflowing Net",
    emoji: "🕸️",
    rarity: "miracle",
    points: 45,
    verse: "They enclosed a great multitude of fishes.",
    reference: "Luke 5:6",
    color: "from-indigo-200 via-sky-200 to-amber-200",
  },
];

const rarityStyle: Record<CatchRarity, string> = {
  common: "bg-sky-50 text-sky-700 border-sky-200",
  blessed: "bg-amber-50 text-amber-800 border-amber-200",
  miracle: "bg-violet-50 text-violet-800 border-violet-200",
};

const catchDifficulty: Record<CatchRarity, { taps: number; zone: number; speed: number; seconds: number }> = {
  common: { taps: 3, zone: 22, speed: 3.8, seconds: 9 },
  blessed: { taps: 4, zone: 18, speed: 4.8, seconds: 8 },
  miracle: { taps: 5, zone: 14, speed: 5.8, seconds: 7 },
};

function chooseCatch(streak: number): CatchItem {
  const roll = Math.random();
  const miracleChance = Math.min(0.04 + streak * 0.008, 0.13);
  const blessedChance = Math.min(0.22 + streak * 0.012, 0.38);

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
  const [message, setMessage] = useState("First-person fishing: cast into the quiet water and wait for a real bite.");
  const [currentCatch, setCurrentCatch] = useState<CatchItem | null>(null);
  const [floatingCatches, setFloatingCatches] = useState<FloatingCatch[]>([]);
  const [journal, setJournal] = useState<string[]>([]);
  const [rippleX, setRippleX] = useState(52);
  const [bobberX, setBobberX] = useState(52);
  const [timeLeft, setTimeLeft] = useState(0);
  const [reelCursor, setReelCursor] = useState(8);
  const [targetStart, setTargetStart] = useState(42);
  const [targetWidth, setTargetWidth] = useState(20);
  const [reelProgress, setReelProgress] = useState(0);
  const [requiredTaps, setRequiredTaps] = useState(3);
  const [misses, setMisses] = useState(0);
  const [showJournal, setShowJournal] = useState(false);

  const biteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const biteWindowRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reelCursorRef = useRef(8);
  const reelDirectionRef = useRef<1 | -1>(1);
  const targetStartRef = useRef(42);
  const targetWidthRef = useRef(20);

  const discovered = useMemo(() => CATCHES.filter((item) => journal.includes(item.id)), [journal]);

  const clearTimers = useCallback(() => {
    if (biteTimerRef.current) clearTimeout(biteTimerRef.current);
    if (biteWindowRef.current) clearTimeout(biteWindowRef.current);
    if (tickerRef.current) clearInterval(tickerRef.current);
    biteTimerRef.current = null;
    biteWindowRef.current = null;
    tickerRef.current = null;
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
    setReelProgress(0);
    setMisses(0);
    setCastState("idle");
    if (nextMessage) setMessage(nextMessage);
  }, [clearTimers]);

  const failRound = useCallback((text: string) => {
    clearTimers();
    setCastState("missed");
    setStreak(0);
    setMisses(0);
    setReelProgress(0);
    setMessage(text);
    setTimeout(() => resetRound("Cast again. The lake rewards patience, not button mashing."), 1500);
  }, [clearTimers, resetRound]);

  const finishCatch = useCallback((catchItem: CatchItem) => {
    clearTimers();
    const streakBonus = Math.min(streak * 3, 24);
    const earned = catchItem.points + streakBonus;
    const pearlBonus = catchItem.rarity === "miracle" ? 5 : catchItem.rarity === "blessed" ? 3 : 1;
    const caught: FloatingCatch = { ...catchItem, caughtId: crypto.randomUUID() };

    setCastState("caught");
    setScore((value) => value + earned);
    setPearls((value) => value + pearlBonus);
    setTotalFish((value) => value + 1);
    setStreak((value) => {
      const next = value + 1;
      setBestStreak((best) => Math.max(best, next));
      return next;
    });
    setJournal((items) => Array.from(new Set([...items, catchItem.id])));
    setFloatingCatches((items) => [caught, ...items].slice(0, 4));
    setMessage(`${catchItem.emoji} ${catchItem.name}! +${earned} grace points • ${catchItem.reference}`);
    setTimeout(() => resetRound("The water settles. Cast again when you are ready."), 2100);
  }, [clearTimers, resetRound, streak]);

  const beginReeling = useCallback((catchItem: CatchItem) => {
    clearTimers();
    const difficulty = catchDifficulty[catchItem.rarity];
    const start = 16 + Math.random() * (74 - difficulty.zone);

    reelCursorRef.current = 8;
    reelDirectionRef.current = 1;
    targetStartRef.current = start;
    targetWidthRef.current = difficulty.zone;
    setReelCursor(8);
    setTargetStart(start);
    setTargetWidth(difficulty.zone);
    setRequiredTaps(difficulty.taps);
    setReelProgress(0);
    setMisses(0);
    setTimeLeft(difficulty.seconds);
    setCastState("reeling");
    setMessage("Set! Now land it: tap Reel only when the marker passes through the glowing zone.");

    tickerRef.current = setInterval(() => {
      reelCursorRef.current += difficulty.speed * reelDirectionRef.current;
      if (reelCursorRef.current >= 98) {
        reelCursorRef.current = 98;
        reelDirectionRef.current = -1;
      }
      if (reelCursorRef.current <= 2) {
        reelCursorRef.current = 2;
        reelDirectionRef.current = 1;
      }
      setReelCursor(reelCursorRef.current);
      setTimeLeft((previous) => {
        if (previous <= 1) {
          failRound("The line went slack. The fish escaped into deeper water.");
          return 0;
        }
        return previous - 1;
      });
    }, 620);
  }, [clearTimers, failRound]);

  const startBiteWindow = useCallback(() => {
    const catchItem = chooseCatch(streak);
    const nextRipple = 18 + Math.random() * 64;
    setCurrentCatch(catchItem);
    setRippleX(nextRipple);
    setBobberX(nextRipple + (Math.random() * 20 - 10));
    setTimeLeft(3);
    setCastState("bite");
    setMessage("Bite! The rod is pulling — set the hook quickly!");

    tickerRef.current = setInterval(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1));
      setBobberX((previous) => Math.min(88, Math.max(12, previous + (Math.random() * 16 - 8))));
    }, 700);

    biteWindowRef.current = setTimeout(() => {
      failRound("Too slow — the fish felt the line and slipped away.");
    }, 2600);
  }, [failRound, streak]);

  const castLine = () => {
    if (castState !== "idle") return;

    clearTimers();
    setCastState("casting");
    setCurrentCatch(null);
    setRippleX(20 + Math.random() * 60);
    setBobberX(36 + Math.random() * 28);
    setMessage("You cast from the shoreline. Watch the bobber; the bite will be quick.");

    setTimeout(() => {
      setCastState("waiting");
      setMessage("Wait for the rod tip to dip and the golden ripple to appear...");
      biteTimerRef.current = setTimeout(startBiteWindow, 1800 + Math.random() * 2600);
    }, 850);
  };

  const setHook = () => {
    if (castState !== "bite" || !currentCatch) return;

    const accuracy = Math.abs(bobberX - rippleX);
    if (accuracy > 15) {
      failRound("You jerked too early. Wait until the bobber is near the golden ripple.");
      return;
    }

    beginReeling(currentCatch);
  };

  const reelTap = () => {
    if (castState !== "reeling" || !currentCatch) return;

    const inZone =
      reelCursorRef.current >= targetStartRef.current &&
      reelCursorRef.current <= targetStartRef.current + targetWidthRef.current;

    if (!inZone) {
      const nextMisses = misses + 1;
      setMisses(nextMisses);
      setMessage(nextMisses >= 3 ? "The line snapped from rough reeling!" : "Careful — reel inside the glowing zone.");
      if (nextMisses >= 3) {
        failRound("The line snapped from rough reeling. Try a steadier rhythm.");
      }
      return;
    }

    const nextProgress = reelProgress + 1;
    const difficulty = catchDifficulty[currentCatch.rarity];
    const nextStart = 10 + Math.random() * (84 - difficulty.zone);

    setReelProgress(nextProgress);
    setMisses(0);
    setTargetStart(nextStart);
    setTargetWidth(Math.max(12, difficulty.zone - nextProgress));
    targetStartRef.current = nextStart;
    targetWidthRef.current = Math.max(12, difficulty.zone - nextProgress);
    setMessage(nextProgress >= requiredTaps ? "Landed!" : `Good reel! ${requiredTaps - nextProgress} more steady pulls.`);

    if (nextProgress >= requiredTaps) {
      finishCatch(currentCatch);
    }
  };

  const hookAccuracy = Math.max(10, 100 - Math.round(Math.abs(bobberX - rippleX) * 5));
  const reelAccuracy =
    reelCursor >= targetStart && reelCursor <= targetStart + targetWidth ? 100 : Math.max(10, 75 - Math.round(Math.abs(reelCursor - (targetStart + targetWidth / 2)) * 2));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 text-warm-cocoa">
      <div className="relative overflow-hidden rounded-[38px] border-[7px] border-white/85 bg-[#eef8ff] p-5 shadow-[0_28px_90px_rgba(32,74,105,0.26)]">
        <div className="absolute -left-20 top-6 h-64 w-64 rounded-full bg-sky-300/35 blur-3xl" />
        <div className="absolute -right-14 -top-20 h-72 w-72 rounded-full bg-amber-200/55 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-4">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-sky-200 bg-white/75 px-3 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-sky-700 shadow-sm">
                <Waves className="h-3 w-3" /> Sea of Galilee • First Person
              </div>
              <h2 className="font-serif text-2xl font-black text-[#3f332e]">Fishers of Faith</h2>
              <p className="max-w-md text-[11px] leading-relaxed text-warm-grey/70">
                Set the hook, control the line, and land scripture treasures with steady timing.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl border border-white/70 bg-white/70 px-3 py-2 shadow-sm">
                <span className="block text-[8px] font-black uppercase tracking-wider text-sky-600/70">Points</span>
                <span className="text-sm font-black">{score}</span>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/70 px-3 py-2 shadow-sm">
                <span className="block text-[8px] font-black uppercase tracking-wider text-amber-600/70">Pearls</span>
                <span className="text-sm font-black">🦪 {pearls}</span>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/70 px-3 py-2 shadow-sm">
                <span className="block text-[8px] font-black uppercase tracking-wider text-rose-600/70">Streak</span>
                <span className="text-sm font-black">{streak} / {bestStreak}</span>
              </div>
            </div>
          </header>

          <div className="relative h-[430px] overflow-hidden rounded-[34px] border border-white/80 bg-gradient-to-b from-[#ffdba6] via-[#9fd4ed] to-[#1c8aa9] shadow-inner">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 720 430" preserveAspectRatio="none">
              <defs>
                <linearGradient id="galileeSky" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ffe8b6" />
                  <stop offset="45%" stopColor="#9fd4ed" />
                  <stop offset="100%" stopColor="#68bad2" />
                </linearGradient>
                <linearGradient id="galileeWater" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#63b9d0" />
                  <stop offset="55%" stopColor="#248dad" />
                  <stop offset="100%" stopColor="#0d5c75" />
                </linearGradient>
                <radialGradient id="sunGlow" cx="18%" cy="18%" r="28%">
                  <stop offset="0%" stopColor="#fff7b8" stopOpacity="1" />
                  <stop offset="100%" stopColor="#fff7b8" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="shore" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#66513d" />
                  <stop offset="45%" stopColor="#d0a271" />
                  <stop offset="100%" stopColor="#594837" />
                </linearGradient>
              </defs>

              <rect width="720" height="430" fill="url(#galileeSky)" />
              <rect width="720" height="190" fill="url(#sunGlow)" />
              <circle cx="115" cy="78" r="32" fill="#ffe27a" opacity="0.95" />
              <path d="M0 156 C95 108 155 141 240 103 C319 67 395 108 473 88 C575 64 642 92 720 52 L720 224 L0 224Z" fill="#806b55" opacity="0.42" />
              <path d="M0 185 C85 139 174 164 256 135 C353 101 423 148 523 119 C603 96 658 115 720 91 L720 224 L0 224Z" fill="#604d3e" opacity="0.5" />
              <rect y="205" width="720" height="225" fill="url(#galileeWater)" />
              {Array.from({ length: 10 }).map((_, index) => (
                <path
                  key={index}
                  d={`M ${-80 + index * 45} ${238 + index * 16} C ${55 + index * 26} ${220 + index * 12}, ${190 + index * 22} ${260 + index * 8}, ${820 - index * 28} ${236 + index * 17}`}
                  fill="none"
                  stroke={index % 2 === 0 ? "#dbfbff" : "#a7e5f0"}
                  strokeWidth={index < 4 ? 2 : 1.2}
                  opacity={0.22}
                />
              ))}
              <path d="M0 390 C150 344 272 406 411 367 C531 333 642 367 720 345 L720 430 L0 430Z" fill="url(#shore)" opacity="0.96" />
              <path d="M0 404 C95 384 148 396 224 382 C312 363 391 408 480 383 C584 352 655 380 720 365 L720 430 L0 430Z" fill="#3f342d" opacity="0.42" />
            </svg>

            <div className="absolute left-5 right-5 top-5 z-30 rounded-[24px] border border-white/75 bg-white/75 p-3 text-center shadow-sm backdrop-blur-md">
              <p className="text-[11px] font-bold leading-relaxed text-[#4f433d]">{message}</p>
              {(castState === "bite" || castState === "reeling") && (
                <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
                  <div className="h-2 overflow-hidden rounded-full bg-sky-100">
                    <div
                      className={`h-full rounded-full transition-all ${castState === "bite" ? (hookAccuracy > 70 ? "bg-emerald-400" : "bg-amber-400") : reelAccuracy === 100 ? "bg-emerald-400" : "bg-rose-400"}`}
                      style={{ width: `${castState === "bite" ? hookAccuracy : reelAccuracy}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-[#5f4b42]">{timeLeft}s</span>
                </div>
              )}
            </div>

            <motion.div
              className="absolute z-20 h-24 w-24 -translate-x-1/2 rounded-full border-4 border-amber-200/75 bg-amber-100/15"
              style={{ left: `${rippleX}%`, bottom: "150px" }}
              animate={castState === "bite" ? { scale: [0.65, 1.35, 0.85], opacity: [0.8, 0.35, 0.75] } : { opacity: 0 }}
              transition={{ repeat: castState === "bite" ? Infinity : 0, duration: 0.88 }}
            />

            {(castState === "waiting" || castState === "bite" || castState === "reeling") && (
              <motion.div
                className="absolute z-30 -translate-x-1/2 text-3xl drop-shadow-lg"
                style={{ left: `${bobberX}%`, bottom: "172px" }}
                animate={{ y: castState === "bite" ? [0, -14, 8, -4, 0] : [0, 4, 0], rotate: castState === "bite" ? [-8, 12, -10, 8, 0] : 0 }}
                transition={{ repeat: Infinity, duration: castState === "bite" ? 0.55 : 1.9 }}
              >
                🪝
              </motion.div>
            )}

            {castState === "reeling" && currentCatch && (
              <div className="absolute bottom-24 left-5 right-5 z-40 rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-lg backdrop-blur-md">
                <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-[#5f4b42]">
                  <span>Line Control</span>
                  <span>{reelProgress}/{requiredTaps} steady pulls • misses {misses}/3</span>
                </div>
                <div className="relative h-8 overflow-hidden rounded-full border border-sky-200 bg-gradient-to-r from-sky-100 via-white to-sky-100">
                  <div
                    className="absolute top-0 h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-300 shadow-[0_0_18px_rgba(52,211,153,.45)]"
                    style={{ left: `${targetStart}%`, width: `${targetWidth}%` }}
                  />
                  <div
                    className="absolute top-[-4px] h-10 w-1.5 rounded-full bg-[#3f332e] shadow-lg transition-all duration-100"
                    style={{ left: `${reelCursor}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-[10px] font-bold text-warm-grey/65">
                  {currentCatch.rarity === "miracle" ? "Miracle catch: tiny zone, fast line." : "Tap Reel when the dark marker crosses the glowing zone."}
                </p>
              </div>
            )}

            <motion.div
              className="absolute inset-x-0 bottom-0 z-30 h-44"
              animate={castState === "casting" ? { y: [0, -8, 0] } : castState === "reeling" ? { x: [-2, 3, -1, 2, 0] } : {}}
              transition={{ duration: castState === "casting" ? 0.8 : 0.4, repeat: castState === "reeling" ? Infinity : 0 }}
            >
              <svg className="h-full w-full overflow-visible" viewBox="0 0 720 180" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="skinA" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#b87955" />
                    <stop offset="100%" stopColor="#8a543b" />
                  </linearGradient>
                  <linearGradient id="rod" x1="0" x2="1" y1="1" y2="0">
                    <stop offset="0%" stopColor="#3f2b22" />
                    <stop offset="62%" stopColor="#6d4430" />
                    <stop offset="100%" stopColor="#201611" />
                  </linearGradient>
                </defs>
                <path d="M308 170 C292 125 310 94 346 103 C382 111 386 149 368 180Z" fill="url(#skinA)" opacity="0.98" />
                <path d="M410 180 C385 143 392 107 428 101 C463 95 477 132 457 180Z" fill="url(#skinA)" opacity="0.98" />
                <ellipse cx="356" cy="119" rx="32" ry="20" fill="#c88a63" opacity="0.9" />
                <ellipse cx="428" cy="119" rx="32" ry="20" fill="#c88a63" opacity="0.9" />
                <path d="M372 126 C452 78 526 35 654 -44" fill="none" stroke="url(#rod)" strokeWidth="12" strokeLinecap="round" />
                <path d="M389 130 C482 82 548 43 664 -36" fill="none" stroke="#f4d6a4" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
                {(castState === "waiting" || castState === "bite" || castState === "reeling") && (
                  <path d={`M650 -42 C612 45, 580 105, ${bobberX * 7.2} 255`} fill="none" stroke="#f8f4df" strokeWidth="1.4" strokeDasharray="4 5" opacity="0.9" />
                )}
                <circle cx="389" cy="123" r="24" fill="none" stroke="#2b211c" strokeWidth="7" />
                <circle cx="389" cy="123" r="9" fill="#d59a58" stroke="#2b211c" strokeWidth="4" />
              </svg>
            </motion.div>

            <AnimatePresence>
              {castState === "caught" && currentCatch && (
                <motion.div
                  className="absolute left-1/2 top-24 z-50 w-[min(86%,360px)] -translate-x-1/2 rounded-[30px] border-4 border-white bg-white/92 px-6 py-4 text-center shadow-2xl"
                  initial={{ y: 28, scale: 0.72, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  exit={{ y: -20, scale: 0.8, opacity: 0 }}
                >
                  <div className="text-6xl">{currentCatch.emoji}</div>
                  <div className="mt-1 font-serif text-xl font-black">{currentCatch.name}</div>
                  <div className="mt-1 text-[10px] font-bold italic leading-relaxed text-warm-grey/70">&ldquo;{currentCatch.verse}&rdquo;</div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute bottom-5 left-5 right-5 z-50 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={castLine}
                disabled={castState !== "idle"}
                className="rounded-2xl border border-white/70 bg-gradient-to-r from-sky-600 to-cyan-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Cast Line
              </button>
              <button
                type="button"
                onClick={setHook}
                disabled={castState !== "bite"}
                className="rounded-2xl border border-white/70 bg-gradient-to-r from-amber-500 to-rose-400 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Set Hook {castState === "bite" ? `(${timeLeft})` : ""}
              </button>
              <button
                type="button"
                onClick={reelTap}
                disabled={castState !== "reeling"}
                className="rounded-2xl border border-white/70 bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Reel
              </button>
              <button
                type="button"
                onClick={() => setShowJournal(true)}
                className="rounded-2xl border border-white/70 bg-white/80 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#5f4b42] shadow-sm transition-all active:scale-95"
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
              <p className="text-[11px] italic text-warm-grey/50">Your basket is waiting. The new controls are intentionally harder.</p>
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
