"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Anchor, BookOpen, Fish, Sparkles, Waves } from "lucide-react";

type Phase = "ready" | "casting" | "waiting" | "hook" | "reeling" | "caught" | "lost";
type Rarity = "common" | "blessed" | "miracle";

interface CatchItem {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  points: number;
  verse: string;
  reference: string;
  gradient: string;
}

interface SaveData {
  pearls?: number;
  bestStreak?: number;
  lifetime?: number;
  journal?: string[];
}

interface BasketItem extends CatchItem {
  catchId: string;
}

const SAVE_KEY = "selahly_galilee_fishing_v3";

const CATCHES: CatchItem[] = [
  {
    id: "faith",
    name: "Faith Fish",
    emoji: "🐟",
    rarity: "common",
    points: 10,
    verse: "Follow me, and I will make you fishers of men.",
    reference: "Matthew 4:19",
    gradient: "from-sky-200 to-cyan-300",
  },
  {
    id: "peace",
    name: "Peace Minnow",
    emoji: "🐠",
    rarity: "common",
    points: 11,
    verse: "Peace I leave with you; my peace I give unto you.",
    reference: "John 14:27",
    gradient: "from-teal-200 to-emerald-300",
  },
  {
    id: "mercy",
    name: "Mercy Koi",
    emoji: "🐡",
    rarity: "common",
    points: 12,
    verse: "His mercies are new every morning.",
    reference: "Lamentations 3:23",
    gradient: "from-rose-200 to-orange-200",
  },
  {
    id: "loaves",
    name: "Loaves & Fishes Basket",
    emoji: "🧺",
    rarity: "blessed",
    points: 24,
    verse: "They did all eat, and were filled.",
    reference: "Matthew 14:20",
    gradient: "from-amber-200 to-yellow-300",
  },
  {
    id: "pearl",
    name: "Pearl of Great Price",
    emoji: "🦪",
    rarity: "blessed",
    points: 28,
    verse: "The kingdom of heaven is like unto a merchant seeking goodly pearls.",
    reference: "Matthew 13:45",
    gradient: "from-violet-200 to-rose-200",
  },
  {
    id: "net",
    name: "Overflowing Net",
    emoji: "🕸️",
    rarity: "miracle",
    points: 46,
    verse: "They enclosed a great multitude of fishes.",
    reference: "Luke 5:6",
    gradient: "from-indigo-200 via-sky-200 to-amber-200",
  },
];

const RARITY_META: Record<Rarity, { label: string; badge: string; taps: number; zone: number; speed: number; seconds: number; pearls: number }> = {
  common: {
    label: "Gentle",
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    taps: 3,
    zone: 24,
    speed: 4.2,
    seconds: 10,
    pearls: 1,
  },
  blessed: {
    label: "Blessed",
    badge: "border-amber-200 bg-amber-50 text-amber-800",
    taps: 4,
    zone: 19,
    speed: 5.2,
    seconds: 9,
    pearls: 3,
  },
  miracle: {
    label: "Miracle",
    badge: "border-violet-200 bg-violet-50 text-violet-800",
    taps: 5,
    zone: 15,
    speed: 6.4,
    seconds: 8,
    pearls: 5,
  },
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

function chooseCatch(streak: number) {
  const roll = Math.random();
  const miracleChance = Math.min(0.035 + streak * 0.007, 0.12);
  const blessedChance = Math.min(0.22 + streak * 0.012, 0.36);
  const rarity: Rarity = roll < miracleChance ? "miracle" : roll < blessedChance ? "blessed" : "common";
  const pool = CATCHES.filter((item) => item.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function GalileeFishing() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [message, setMessage] = useState("Cast from the shore. Watch the bobber, then set the hook when the ripple blooms.");
  const [currentCatch, setCurrentCatch] = useState<CatchItem | null>(null);
  const [score, setScore] = useState(0);
  const [pearls, setPearls] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lifetime, setLifetime] = useState(0);
  const [journal, setJournal] = useState<string[]>([]);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [showJournal, setShowJournal] = useState(false);

  const [bobberX, setBobberX] = useState(56);
  const [rippleX, setRippleX] = useState(56);
  const [hookWindow, setHookWindow] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [meterCursor, setMeterCursor] = useState(10);
  const [targetStart, setTargetStart] = useState(40);
  const [targetWidth, setTargetWidth] = useState(22);
  const [reelHits, setReelHits] = useState(0);
  const [requiredHits, setRequiredHits] = useState(3);
  const [mistakes, setMistakes] = useState(0);
  const [tension, setTension] = useState(42);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervalsRef = useRef<ReturnType<typeof setInterval>[]>([]);
  const cursorRef = useRef(10);
  const cursorDirectionRef = useRef<1 | -1>(1);
  const targetStartRef = useRef(40);
  const targetWidthRef = useRef(22);
  const activeCatchRef = useRef<CatchItem | null>(null);

  const discovered = useMemo(() => CATCHES.filter((item) => journal.includes(item.id)), [journal]);

  const clearClock = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    intervalsRef.current.forEach(clearInterval);
    timersRef.current = [];
    intervalsRef.current = [];
  }, []);

  const addTimer = useCallback((timer: ReturnType<typeof setTimeout>) => {
    timersRef.current.push(timer);
  }, []);

  const addInterval = useCallback((interval: ReturnType<typeof setInterval>) => {
    intervalsRef.current.push(interval);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as SaveData;
      queueMicrotask(() => {
        setPearls(saved.pearls ?? 0);
        setBestStreak(saved.bestStreak ?? 0);
        setLifetime(saved.lifetime ?? 0);
        setJournal(saved.journal ?? []);
      });
    } catch {
      localStorage.removeItem(SAVE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ pearls, bestStreak, lifetime, journal }));
  }, [bestStreak, journal, lifetime, pearls]);

  useEffect(() => () => clearClock(), [clearClock]);

  const resetRound = useCallback((text = "The water is calm again. Cast when you are ready.") => {
    clearClock();
    activeCatchRef.current = null;
    setCurrentCatch(null);
    setHookWindow(0);
    setTimeLeft(0);
    setReelHits(0);
    setMistakes(0);
    setTension(42);
    setPhase("ready");
    setMessage(text);
  }, [clearClock]);

  const loseRound = useCallback((text: string) => {
    clearClock();
    setPhase("lost");
    setStreak(0);
    setMessage(text);
    addTimer(setTimeout(() => resetRound("Try again with a slower rhythm. Grace, not panic."), 1500));
  }, [addTimer, clearClock, resetRound]);

  const finishCatch = useCallback((catchItem: CatchItem) => {
    clearClock();
    const meta = RARITY_META[catchItem.rarity];
    const earned = catchItem.points + Math.min(streak * 3, 24);
    const caught: BasketItem = { ...catchItem, catchId: crypto.randomUUID() };

    setPhase("caught");
    setScore((value) => value + earned);
    setPearls((value) => value + meta.pearls);
    setLifetime((value) => value + 1);
    setStreak((value) => {
      const next = value + 1;
      setBestStreak((best) => Math.max(best, next));
      return next;
    });
    setJournal((items) => Array.from(new Set([...items, catchItem.id])));
    setBasket((items) => [caught, ...items].slice(0, 4));
    setMessage(`${catchItem.emoji} ${catchItem.name} landed! +${earned} points • ${catchItem.reference}`);
    addTimer(setTimeout(() => resetRound("Beautiful catch. The lake is ready for another cast."), 2100));
  }, [addTimer, clearClock, resetRound, streak]);

  const startReeling = useCallback((catchItem: CatchItem) => {
    clearClock();
    const meta = RARITY_META[catchItem.rarity];
    const start = 14 + Math.random() * (78 - meta.zone);

    activeCatchRef.current = catchItem;
    cursorRef.current = 8;
    cursorDirectionRef.current = 1;
    targetStartRef.current = start;
    targetWidthRef.current = meta.zone;

    setPhase("reeling");
    setMeterCursor(8);
    setTargetStart(start);
    setTargetWidth(meta.zone);
    setReelHits(0);
    setRequiredHits(meta.taps);
    setMistakes(0);
    setTension(44);
    setTimeLeft(meta.seconds);
    setMessage("Now reel steadily. Tap only when the marker passes through the gold zone.");

    addInterval(setInterval(() => {
      cursorRef.current += meta.speed * cursorDirectionRef.current;
      if (cursorRef.current >= 98) {
        cursorRef.current = 98;
        cursorDirectionRef.current = -1;
      }
      if (cursorRef.current <= 2) {
        cursorRef.current = 2;
        cursorDirectionRef.current = 1;
      }
      setMeterCursor(cursorRef.current);
      setTension((value) => clamp(value + 2.8));
      setTimeLeft((value) => {
        if (value <= 1) {
          loseRound("The fish dove deep and the line went slack.");
          return 0;
        }
        return value - 1;
      });
    }, 650));
  }, [addInterval, clearClock, loseRound]);

  const beginBite = useCallback(() => {
    clearClock();
    const catchItem = chooseCatch(streak);
    const ripple = 24 + Math.random() * 52;
    const bobber = clamp(ripple + (Math.random() * 24 - 12), 18, 82);

    activeCatchRef.current = catchItem;
    setCurrentCatch(catchItem);
    setRippleX(ripple);
    setBobberX(bobber);
    setHookWindow(100);
    setTimeLeft(3);
    setPhase("hook");
    setMessage("Bite! Wait until the bobber is close to the glowing ripple, then set the hook.");

    addInterval(setInterval(() => {
      setBobberX((value) => clamp(value + (Math.random() * 18 - 9), 16, 84));
      setHookWindow((value) => Math.max(0, value - 23));
      setTimeLeft((value) => Math.max(0, value - 1));
    }, 600));

    addTimer(setTimeout(() => {
      loseRound("Too slow — the fish felt the hook and slipped away.");
    }, 2900));
  }, [addInterval, addTimer, clearClock, loseRound, streak]);

  const castLine = () => {
    if (phase !== "ready") return;

    clearClock();
    setPhase("casting");
    setCurrentCatch(null);
    setRippleX(55);
    setBobberX(55);
    setMessage("Casting...");

    addTimer(setTimeout(() => {
      setPhase("waiting");
      setMessage("Line is in. Watch the bobber and wait for a bite.");
      addTimer(setTimeout(beginBite, 1500 + Math.random() * 2200));
    }, 700));
  };

  const setHook = () => {
    if (phase !== "hook" || !activeCatchRef.current) return;

    const accuracy = Math.abs(bobberX - rippleX);
    if (accuracy > 13 || hookWindow <= 0) {
      loseRound("Missed hook set. Wait for the bobber to line up with the ripple.");
      return;
    }

    startReeling(activeCatchRef.current);
  };

  const reel = () => {
    const catchItem = activeCatchRef.current;
    if (phase !== "reeling" || !catchItem) return;

    const inZone =
      cursorRef.current >= targetStartRef.current &&
      cursorRef.current <= targetStartRef.current + targetWidthRef.current;

    if (!inZone) {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      setTension((value) => clamp(value + 16));
      setMessage(nextMistakes >= 3 ? "Too many rough pulls — the line snapped." : "Easy. Wait for the gold zone before reeling.");
      if (nextMistakes >= 3) {
        loseRound("The line snapped from rough reeling.");
      }
      return;
    }

    const nextHits = reelHits + 1;
    const meta = RARITY_META[catchItem.rarity];
    const nextZone = Math.max(12, meta.zone - nextHits * 1.8);
    const nextTarget = 10 + Math.random() * (84 - nextZone);

    setReelHits(nextHits);
    setMistakes(0);
    setTension((value) => clamp(value - 18));
    setTargetStart(nextTarget);
    setTargetWidth(nextZone);
    targetStartRef.current = nextTarget;
    targetWidthRef.current = nextZone;

    if (nextHits >= requiredHits) {
      finishCatch(catchItem);
    } else {
      setMessage(`Good pull. ${requiredHits - nextHits} more clean reel${requiredHits - nextHits === 1 ? "" : "s"}.`);
    }
  };

  const phaseLabel: Record<Phase, string> = {
    ready: "Ready",
    casting: "Casting",
    waiting: "Waiting",
    hook: "Set hook",
    reeling: "Reeling",
    caught: "Caught",
    lost: "Lost",
  };

  const hookAccuracy = clamp(100 - Math.abs(bobberX - rippleX) * 6);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 text-warm-cocoa">
      <section className="relative overflow-hidden rounded-[34px] border border-white/80 bg-gradient-to-br from-[#fff6df] via-[#e9f8ff] to-[#d8f3f0] p-4 shadow-[0_24px_70px_rgba(55,93,118,0.2)]">
        <div className="absolute -left-20 top-16 h-60 w-60 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="absolute -right-20 -top-16 h-64 w-64 rounded-full bg-amber-200/45 blur-3xl" />

        <div className="relative z-10 grid gap-4 lg:grid-cols-[1fr_230px]">
          <div className="overflow-hidden rounded-[28px] border-4 border-white/80 bg-[#bde6f2] shadow-inner">
            <div className="relative h-[460px] overflow-hidden">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 460" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="fofSky" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#ffe7b0" />
                    <stop offset="45%" stopColor="#9bd8ef" />
                    <stop offset="100%" stopColor="#5fb8d0" />
                  </linearGradient>
                  <linearGradient id="fofWater" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#64c4dc" />
                    <stop offset="58%" stopColor="#2387a6" />
                    <stop offset="100%" stopColor="#0f536d" />
                  </linearGradient>
                  <linearGradient id="fofRod" x1="0" x2="1" y1="1" y2="0">
                    <stop offset="0%" stopColor="#2b1f1a" />
                    <stop offset="55%" stopColor="#7a4b2d" />
                    <stop offset="100%" stopColor="#1f1713" />
                  </linearGradient>
                  <linearGradient id="fofSkin" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#c88c63" />
                    <stop offset="100%" stopColor="#8f593f" />
                  </linearGradient>
                </defs>

                <rect width="760" height="460" fill="url(#fofSky)" />
                <circle cx="112" cy="82" r="34" fill="#ffe680" />
                <circle cx="112" cy="82" r="72" fill="#ffe680" opacity="0.16" />
                <path d="M0 166 C110 112 171 144 256 104 C340 66 418 106 504 86 C614 61 684 88 760 50 L760 232 L0 232Z" fill="#806c53" opacity="0.45" />
                <path d="M0 194 C98 145 177 169 276 137 C376 105 462 148 552 121 C638 95 696 118 760 92 L760 232 L0 232Z" fill="#534335" opacity="0.48" />
                <rect y="218" width="760" height="242" fill="url(#fofWater)" />
                {Array.from({ length: 9 }).map((_, index) => (
                  <path
                    key={index}
                    d={`M ${-120 + index * 58} ${252 + index * 20} C ${76 + index * 22} ${232 + index * 12}, ${245 + index * 25} ${278 + index * 9}, ${900 - index * 38} ${252 + index * 18}`}
                    fill="none"
                    stroke={index % 2 === 0 ? "#d9fbff" : "#92ddeb"}
                    strokeWidth={index < 4 ? 2.2 : 1.3}
                    opacity={0.24}
                  />
                ))}
                <path d="M0 408 C145 360 282 420 428 382 C548 350 644 374 760 348 L760 460 L0 460Z" fill="#5f4635" opacity="0.9" />
                <path d="M0 424 C110 398 175 414 260 394 C352 374 440 423 542 393 C642 365 704 388 760 374 L760 460 L0 460Z" fill="#302923" opacity="0.4" />
              </svg>

              <div className="absolute left-4 top-4 rounded-2xl border border-white/70 bg-white/75 px-3 py-2 shadow-sm backdrop-blur-md">
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-sky-700">
                  <Waves className="h-3.5 w-3.5" /> Sea of Galilee
                </div>
                <div className="font-serif text-lg font-black text-[#3f332e]">Fishers of Faith</div>
              </div>

              <div className="absolute right-4 top-4 rounded-2xl border border-white/70 bg-white/75 px-3 py-2 text-right shadow-sm backdrop-blur-md">
                <div className="text-[8px] font-black uppercase tracking-[0.18em] text-warm-grey/55">Phase</div>
                <div className="text-sm font-black text-[#3f332e]">{phaseLabel[phase]}</div>
              </div>

              <AnimatePresence>
                {phase === "hook" && (
                  <motion.div
                    className="absolute z-20 h-24 w-24 -translate-x-1/2 rounded-full border-4 border-amber-200/80 bg-amber-100/20 shadow-[0_0_35px_rgba(251,191,36,0.42)]"
                    style={{ left: `${rippleX}%`, top: "232px" }}
                    initial={{ opacity: 0, scale: 0.45 }}
                    animate={{ opacity: [0.9, 0.35, 0.9], scale: [0.72, 1.28, 0.86] }}
                    exit={{ opacity: 0, scale: 0.3 }}
                    transition={{ repeat: Infinity, duration: 0.82 }}
                  />
                )}
              </AnimatePresence>

              {(phase === "waiting" || phase === "hook" || phase === "reeling") && (
                <motion.div
                  className="absolute z-30 -translate-x-1/2 text-3xl drop-shadow-lg"
                  style={{ left: `${bobberX}%`, top: "255px" }}
                  animate={{ y: phase === "hook" ? [0, -16, 10, -5, 0] : [0, 4, 0], rotate: phase === "hook" ? [-8, 14, -12, 6, 0] : 0 }}
                  transition={{ repeat: Infinity, duration: phase === "hook" ? 0.54 : 1.8 }}
                >
                  🪝
                </motion.div>
              )}

              <motion.svg
                className="absolute inset-x-0 bottom-0 z-40 h-52 w-full overflow-visible"
                viewBox="0 0 760 210"
                preserveAspectRatio="none"
                animate={phase === "casting" ? { y: [0, -12, 0] } : phase === "reeling" ? { x: [-2, 3, -2, 1, 0] } : {}}
                transition={{ duration: phase === "casting" ? 0.75 : 0.42, repeat: phase === "reeling" ? Infinity : 0 }}
              >
                <ellipse cx="382" cy="208" rx="230" ry="42" fill="#1d1714" opacity="0.24" />
                <path d="M292 205 C275 153 297 110 342 120 C383 129 389 171 369 220Z" fill="url(#fofSkin)" />
                <path d="M432 220 C396 173 405 124 448 116 C490 109 511 159 482 220Z" fill="url(#fofSkin)" />
                <ellipse cx="350" cy="135" rx="36" ry="22" fill="#d79a70" opacity="0.92" />
                <ellipse cx="444" cy="134" rx="38" ry="23" fill="#d79a70" opacity="0.92" />
                <path d="M384 142 C480 78 560 29 720 -58" fill="none" stroke="url(#fofRod)" strokeWidth="13" strokeLinecap="round" />
                <path d="M403 146 C497 87 583 38 730 -50" fill="none" stroke="#f6d7a0" strokeWidth="2" strokeLinecap="round" opacity="0.42" />
                {(phase === "waiting" || phase === "hook" || phase === "reeling") && (
                  <path d={`M710 -54 C662 62, 612 155, ${bobberX * 7.6} 290`} fill="none" stroke="#fff8df" strokeWidth="1.45" strokeDasharray="4 5" opacity="0.9" />
                )}
                <circle cx="405" cy="140" r="27" fill="none" stroke="#261c17" strokeWidth="8" />
                <circle cx="405" cy="140" r="10" fill="#d89b56" stroke="#261c17" strokeWidth="4" />
              </motion.svg>

              {phase === "reeling" && (
                <div className="absolute bottom-24 left-5 right-5 z-50 rounded-[22px] border border-white/80 bg-white/86 p-4 shadow-xl backdrop-blur-md">
                  <div className="mb-2 flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wider text-[#4d4039]">
                    <span>Reel timing</span>
                    <span>{reelHits}/{requiredHits} pulls • {mistakes}/3 misses</span>
                  </div>
                  <div className="relative h-9 overflow-hidden rounded-full border border-sky-200 bg-gradient-to-r from-sky-100 via-white to-sky-100">
                    <div
                      className="absolute top-0 h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-300 shadow-[0_0_18px_rgba(52,211,153,.4)]"
                      style={{ left: `${targetStart}%`, width: `${targetWidth}%` }}
                    />
                    <div
                      className="absolute top-[-5px] h-11 w-1.5 rounded-full bg-[#3f332e] shadow-lg transition-all duration-100"
                      style={{ left: `${meterCursor}%` }}
                    />
                  </div>
                </div>
              )}

              <AnimatePresence>
                {(phase === "caught" || phase === "lost") && (
                  <motion.div
                    className="absolute left-1/2 top-[118px] z-[60] w-[min(86%,380px)] -translate-x-1/2 rounded-[28px] border-4 border-white bg-white/92 px-6 py-4 text-center shadow-2xl"
                    initial={{ y: 18, scale: 0.82, opacity: 0 }}
                    animate={{ y: 0, scale: 1, opacity: 1 }}
                    exit={{ y: -12, scale: 0.86, opacity: 0 }}
                  >
                    <div className="text-5xl">{phase === "caught" && currentCatch ? currentCatch.emoji : "🌊"}</div>
                    <div className="mt-1 font-serif text-xl font-black text-[#3f332e]">
                      {phase === "caught" && currentCatch ? currentCatch.name : "It slipped away"}
                    </div>
                    <p className="mt-1 text-[10px] font-bold italic leading-relaxed text-warm-grey/70">
                      {phase === "caught" && currentCatch ? `“${currentCatch.verse}” — ${currentCatch.reference}` : "Resetting the line..."}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <aside className="flex flex-col gap-3">
            <div className="rounded-[26px] border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur-md">
              <div className="mb-2 text-[9px] font-black uppercase tracking-[0.22em] text-sky-700">Guide</div>
              <p className="min-h-[54px] text-[11px] font-bold leading-relaxed text-[#4f433d]">{message}</p>

              {phase === "hook" && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[9px] font-black uppercase tracking-wider text-warm-grey/55">
                    <span>Hook window</span>
                    <span>{timeLeft}s</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-sky-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-300" style={{ width: `${Math.min(hookAccuracy, hookWindow)}%` }} />
                  </div>
                </div>
              )}

              {phase === "reeling" && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[9px] font-black uppercase tracking-wider text-warm-grey/55">
                    <span>Tension</span>
                    <span>{timeLeft}s</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-sky-100">
                    <div className={`h-full rounded-full ${tension > 78 ? "bg-rose-400" : tension > 55 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${tension}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl border border-white/80 bg-white/70 px-2 py-2 shadow-sm">
                <span className="block text-[8px] font-black uppercase tracking-wider text-sky-700/65">Points</span>
                <span className="text-sm font-black">{score}</span>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/70 px-2 py-2 shadow-sm">
                <span className="block text-[8px] font-black uppercase tracking-wider text-amber-700/65">Pearls</span>
                <span className="text-sm font-black">{pearls}</span>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/70 px-2 py-2 shadow-sm">
                <span className="block text-[8px] font-black uppercase tracking-wider text-rose-700/65">Streak</span>
                <span className="text-sm font-black">{streak}/{bestStreak}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={castLine}
                disabled={phase !== "ready"}
                className="rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-white shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Cast
              </button>
              <button
                type="button"
                onClick={setHook}
                disabled={phase !== "hook"}
                className="rounded-2xl bg-gradient-to-r from-amber-500 to-rose-400 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-white shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Set Hook
              </button>
              <button
                type="button"
                onClick={reel}
                disabled={phase !== "reeling"}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-white shadow-lg transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Reel
              </button>
              <button
                type="button"
                onClick={() => setShowJournal(true)}
                className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-[#4d4039] shadow-sm transition active:scale-95"
              >
                Journal
              </button>
            </div>

            {currentCatch && (phase === "hook" || phase === "reeling") && (
              <div className="rounded-[22px] border border-white/80 bg-white/70 p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-2xl">{currentCatch.emoji}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${RARITY_META[currentCatch.rarity].badge}`}>
                    {RARITY_META[currentCatch.rarity].label}
                  </span>
                </div>
                <div className="mt-1 text-xs font-black">{currentCatch.name}</div>
              </div>
            )}
          </aside>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-3xl border border-white/70 bg-white/60 p-4 shadow-sm sm:col-span-2">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-sky-700">
            <Fish className="h-4 w-4" /> Basket
          </div>
          <div className="flex min-h-14 flex-wrap gap-2">
            {basket.length === 0 ? (
              <p className="text-[11px] italic text-warm-grey/50">No catches yet. Start with a clean cast and steady timing.</p>
            ) : (
              basket.map((item) => (
                <div key={item.catchId} className={`rounded-2xl border bg-gradient-to-br ${item.gradient} px-3 py-2 shadow-sm`}>
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
          <p className="text-2xl font-black">{lifetime}</p>
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
              className="max-h-[82vh] w-full max-w-lg overflow-y-auto rounded-[34px] border border-white/80 bg-[#fffaf0] p-5 shadow-2xl"
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
                            <span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider ${RARITY_META[item.rarity].badge}`}>
                              {RARITY_META[item.rarity].label}
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
