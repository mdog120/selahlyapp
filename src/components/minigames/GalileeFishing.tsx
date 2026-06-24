"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Fish, Waves } from "lucide-react";
import Image from "next/image";

type Direction = "down" | "up" | "left" | "right";
type GamePhase = "explore" | "casting" | "bite" | "caught" | "missed";
type Rarity = "common" | "blessed" | "miracle";

interface CatchItem {
  id: string;
  name: string;
  rarity: Rarity;
  points: number;
  verse: string;
  reference: string;
  color: string;
}

interface SaveData {
  pearls?: number;
  lifetime?: number;
  journal?: string[];
}

interface WaterZone {
  id: string;
  minX: number;
  maxX: number;
  label: string;
  rarityBias: Rarity;
}

interface Player {
  x: number;
  y: number;
  direction: Direction;
  walking: boolean;
}

const SAVE_KEY = "selahly_galilee_fishing_v5";
const STEP = 1.7;
const BRIDGE_MIN_X = 8;
const BRIDGE_MAX_X = 92;
const BRIDGE_MIN_Y = 39;
const BRIDGE_MAX_Y = 52;
const SHORE_MIN_Y = 63;

const CATCHES: CatchItem[] = [
  {
    id: "faith",
    name: "Faith Fish",
    rarity: "common",
    points: 10,
    verse: "Follow me, and I will make you fishers of men.",
    reference: "Matthew 4:19",
    color: "#73d2de",
  },
  {
    id: "peace",
    name: "Peace Minnow",
    rarity: "common",
    points: 11,
    verse: "Peace I leave with you; my peace I give unto you.",
    reference: "John 14:27",
    color: "#a7f3d0",
  },
  {
    id: "mercy",
    name: "Mercy Koi",
    rarity: "common",
    points: 12,
    verse: "His mercies are new every morning.",
    reference: "Lamentations 3:23",
    color: "#f9a8d4",
  },
  {
    id: "loaves",
    name: "Loaves & Fishes Basket",
    rarity: "blessed",
    points: 24,
    verse: "They did all eat, and were filled.",
    reference: "Matthew 14:20",
    color: "#fde047",
  },
  {
    id: "pearl",
    name: "Pearl of Great Price",
    rarity: "blessed",
    points: 28,
    verse: "The kingdom of heaven is like unto a merchant seeking goodly pearls.",
    reference: "Matthew 13:45",
    color: "#e9d5ff",
  },
  {
    id: "net",
    name: "Overflowing Net",
    rarity: "miracle",
    points: 46,
    verse: "They enclosed a great multitude of fishes.",
    reference: "Luke 5:6",
    color: "#c4b5fd",
  },
];

const WATER_ZONES: WaterZone[] = [
  { id: "west", minX: 8, maxX: 34, label: "west shallows", rarityBias: "common" },
  { id: "middle", minX: 34, maxX: 67, label: "deep middle water", rarityBias: "blessed" },
  { id: "east", minX: 67, maxX: 92, label: "quiet east water", rarityBias: "miracle" },
];

const PLAYER_FRAMES: Record<Direction, string[]> = {
  up: ["a1", "a2", "a3", "a4"],
  down: ["c1", "c6", "c7", "c8"],
  left: ["b1", "b2", "b6", "b7"],
  right: ["d1", "d2", "d6", "d7"],
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const isOnBridge = (player: Player) =>
  player.x >= BRIDGE_MIN_X && player.x <= BRIDGE_MAX_X && player.y >= BRIDGE_MIN_Y && player.y <= BRIDGE_MAX_Y;
const isWalkable = (player: Player) => isOnBridge(player) || player.y >= SHORE_MIN_Y;

function getWaterZone(player: Player) {
  if (!isOnBridge(player)) return null;
  return WATER_ZONES.find((zone) => player.x >= zone.minX && player.x < zone.maxX) ?? WATER_ZONES[1];
}

function chooseCatch(zone: WaterZone) {
  const roll = Math.random();
  const miracleChance = zone.rarityBias === "miracle" ? 0.13 : zone.rarityBias === "blessed" ? 0.06 : 0.025;
  const blessedChance = zone.rarityBias === "miracle" ? 0.28 : zone.rarityBias === "blessed" ? 0.36 : 0.17;
  const rarity: Rarity = roll < miracleChance ? "miracle" : roll < blessedChance ? "blessed" : "common";
  const pool = CATCHES.filter((item) => item.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

function PixelFish({ color = "#73d2de", flip = false }: { color?: string; flip?: boolean }) {
  return (
    <div className="pixel-sprite relative h-5 w-9" style={{ transform: flip ? "scaleX(-1)" : undefined }}>
      <div className="absolute left-1 top-1 h-3 w-6 border-2 border-[#2f2a2d]" style={{ background: color }} />
      <div className="absolute right-0 top-2 h-2 w-2 rotate-45 border-r-2 border-t-2 border-[#2f2a2d]" style={{ background: color }} />
      <div className="absolute left-2 top-2 h-1 w-1 bg-[#2f2a2d]" />
      <div className="absolute left-4 top-0 h-1 w-2 bg-white/75" />
    </div>
  );
}

function PixelPlayer({
  direction,
  walking,
  casting,
  pulse,
}: {
  direction: Direction;
  walking: boolean;
  casting: boolean;
  pulse: number;
}) {
  const frames = PLAYER_FRAMES[direction];
  const costume = casting ? "playerhold" : frames[walking ? Math.floor(pulse / 2) % frames.length : 0];

  return (
    <motion.div
      className="pixel-sprite relative h-[78px] w-[60px]"
      animate={{ y: walking ? [0, -2, 0] : 0 }}
      transition={{ repeat: walking ? Infinity : 0, duration: 0.34, ease: "linear" }}
    >
      <Image
        alt=""
        src={`/minigames/fishing/player_${costume}.png`}
        className="absolute bottom-0 left-1/2 max-w-none -translate-x-1/2 object-contain"
        width={88}
        height={144}
        unoptimized
        style={{
          width: casting ? 70 : 52,
          height: "auto",
          imageRendering: "pixelated",
        }}
      />
    </motion.div>
  );
}

function PixelMap({
  player,
  phase,
  caught,
  onSwipe,
  pulse,
}: {
  player: Player;
  phase: GamePhase;
  caught: CatchItem | null;
  onSwipe: (direction: Direction) => void;
  pulse: number;
}) {
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const rodTipX = clamp(player.x + (player.direction === "left" ? -4 : player.direction === "right" ? 4 : 5), 4, 96);
  const rodTipY = player.y - 8;
  const bobberX = clamp(player.x + (player.direction === "left" ? -12 : player.direction === "right" ? 12 : 8), 6, 94);
  const bobberY = player.direction === "up" ? 28 : 58;

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStart.current) return;
    const dx = event.clientX - pointerStart.current.x;
    const dy = event.clientY - pointerStart.current.y;
    pointerStart.current = null;
    if (Math.hypot(dx, dy) < 18) return;
    onSwipe(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  };

  return (
    <div
      className="pixel-map relative h-[640px] overflow-hidden border-[5px] border-[#2f2a2d] bg-[#77cbd6] shadow-[7px_7px_0_#2f2a2d]"
      onPointerDown={(event) => {
        pointerStart.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerUp={handlePointerUp}
    >
      <div className="absolute inset-x-0 top-0 h-[66%] scratch-water" />
      <div className="absolute inset-x-0 top-[60%] h-[8%] scratch-sand" />
      <div className="absolute inset-x-0 top-[64%] h-[36%] scratch-grass" />

      {Array.from({ length: 20 }).map((_, index) => (
        <div
          key={index}
          className="absolute h-2 bg-[#d9fbff]/60"
          style={{
            left: `${5 + ((index * 17) % 88)}%`,
            top: `${8 + (index % 8) * 5}%`,
            width: `${24 + (index % 4) * 18}px`,
          }}
        />
      ))}

      {Array.from({ length: 8 }).map((_, index) => (
        <motion.div
          key={index}
          className="absolute h-3 w-8 opacity-50"
          style={{
            left: `${10 + index * 11}%`,
            top: `${18 + (index % 3) * 9}%`,
            background: index % 2 ? "#348da0" : "#3aa7a7",
          }}
          animate={{ x: [0, 8, 0], opacity: [0.25, 0.55, 0.25] }}
          transition={{ repeat: Infinity, duration: 4 + index * 0.35, ease: "linear" }}
        />
      ))}

      <div className="absolute left-[4%] right-[4%] top-[40%] h-[13%] border-y-[5px] border-[#2f2a2d] bg-[#b67a4a] shadow-[0_9px_0_#7f5238]">
        {Array.from({ length: 13 }).map((_, index) => (
          <div key={index} className="absolute top-0 h-full w-[3px] bg-[#7f5238]" style={{ left: `${index * 8}%` }} />
        ))}
        <div className="absolute inset-x-0 top-1/2 h-[4px] bg-[#e2aa6b]" />
      </div>
      <div className="absolute left-[2%] top-[36%] h-[21%] w-[4%] border-[5px] border-[#2f2a2d] bg-[#91613e]" />
      <div className="absolute right-[2%] top-[36%] h-[21%] w-[4%] border-[5px] border-[#2f2a2d] bg-[#91613e]" />

      <div className="absolute left-[7%] bottom-[15%] h-8 w-8 bg-[#6a7d36] shadow-[14px_6px_0_#8ba545,29px_-2px_0_#526c31]" />
      <div className="absolute right-[14%] bottom-[19%] h-7 w-11 bg-[#607a32] shadow-[-14px_6px_0_#8faa4f]" />
      {Array.from({ length: 28 }).map((_, index) => {
        const colors = ["#fff7ad", "#f8a5c8", "#c7b6ff", "#ffffff"];
        return (
          <div
            key={index}
            className="pixel-flower absolute z-10"
            style={{
              left: `${7 + ((index * 19) % 86)}%`,
              top: `${68 + ((index * 11) % 25)}%`,
              color: colors[index % colors.length],
            }}
          />
        );
      })}

      <AnimatePresence>
        {(phase === "casting" || phase === "bite") && (
          <>
            <svg className="pointer-events-none absolute inset-0 z-40 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <motion.line
                x1={rodTipX}
                y1={rodTipY}
                x2={bobberX}
                y2={bobberY}
                stroke="#2f2a2d"
                strokeWidth="0.35"
                strokeLinecap="square"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              />
            </svg>
            <motion.div
              className="absolute z-40 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${bobberX}%`, top: `${bobberY}%` }}
              initial={{ opacity: 0, y: -22, scale: 0.7 }}
              animate={{
                opacity: 1,
                y: phase === "bite" ? [0, 7, -2, 6, 0] : [0, -3, 0],
                rotate: phase === "bite" ? [0, -8, 8, -6, 0] : 0,
              }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ repeat: Infinity, duration: phase === "bite" ? 0.42 : 1.35, ease: "linear" }}
            >
              <div className="relative h-7 w-4">
                <div className="absolute left-1 top-0 h-3 w-2 border-2 border-[#2f2a2d] bg-[#fff3d6]" />
                <div className={`absolute left-0 top-3 h-4 w-4 border-2 border-[#2f2a2d] ${phase === "bite" ? "bg-[#e84d5b]" : "bg-[#f7c76d]"}`} />
              </div>
              {phase === "bite" && (
                <>
                  <div className="absolute -left-4 top-4 h-1 w-3 bg-[#d9fbff]" />
                  <div className="absolute left-5 top-5 h-1 w-4 bg-[#d9fbff]" />
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "caught" && caught && (
          <motion.div
            className="absolute z-50 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${player.x}%`, top: `${player.y - 11}%` }}
            initial={{ y: 8, opacity: 0, scale: 0.6 }}
            animate={{ y: -24, opacity: 1, scale: 1.15 }}
            exit={{ opacity: 0, scale: 0.4 }}
          >
            <PixelFish color={caught.color} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="absolute z-50 -translate-x-1/2 -translate-y-full"
        style={{ left: `${player.x}%`, top: `${player.y}%` }}
        transition={{ type: "spring", stiffness: 460, damping: 36 }}
      >
        <PixelPlayer direction={player.direction} walking={player.walking} casting={phase === "casting" || phase === "bite"} pulse={pulse} />
      </motion.div>

    </div>
  );
}

export function GalileeFishing() {
  const [player, setPlayer] = useState<Player>({ x: 50, y: 46, direction: "down", walking: false });
  const [phase, setPhase] = useState<GamePhase>("explore");
  const [message, setMessage] = useState("Walk the bridge. Cast only when your line can land in the water.");
  const [caught, setCaught] = useState<CatchItem | null>(null);
  const [score, setScore] = useState(0);
  const [pearls, setPearls] = useState(0);
  const [lifetime, setLifetime] = useState(0);
  const [journal, setJournal] = useState<string[]>([]);
  const [basket, setBasket] = useState<CatchItem[]>([]);
  const [showJournal, setShowJournal] = useState(false);
  const [pulse, setPulse] = useState(0);

  const keysRef = useRef(new Set<string>());
  const castTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const biteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef(player);
  const phaseRef = useRef(phase);
  const activeZoneRef = useRef<WaterZone | null>(null);

  const waterZone = useMemo(() => getWaterZone(player), [player]);
  const canFish = Boolean(waterZone && phase === "explore");
  const discovered = useMemo(() => CATCHES.filter((item) => journal.includes(item.id)), [journal]);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as SaveData;
      queueMicrotask(() => {
        setPearls(saved.pearls ?? 0);
        setLifetime(saved.lifetime ?? 0);
        setJournal(saved.journal ?? []);
      });
    } catch {
      localStorage.removeItem(SAVE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ pearls, lifetime, journal }));
  }, [journal, lifetime, pearls]);

  const clearFishingTimers = useCallback(() => {
    if (castTimerRef.current) clearTimeout(castTimerRef.current);
    if (biteTimerRef.current) clearTimeout(biteTimerRef.current);
    castTimerRef.current = null;
    biteTimerRef.current = null;
  }, []);

  const finishMiss = useCallback((text = "The fish slipped away. Wait for the bite, then reel fast.") => {
    clearFishingTimers();
    setPhase("missed");
    setCaught(null);
    setMessage(text);
    castTimerRef.current = setTimeout(() => {
      setPhase("explore");
      setMessage("Walk along the bridge and try another cast into the water.");
    }, 1100);
  }, [clearFishingTimers]);

  const reel = useCallback(() => {
    if (phaseRef.current !== "bite" || !activeZoneRef.current) return;
    clearFishingTimers();

    if (Math.random() > 0.62) {
      finishMiss("So close. The line tugged hard, but the fish got free.");
      return;
    }

    const catchItem = chooseCatch(activeZoneRef.current);
    const earned = catchItem.points;
    setCaught(catchItem);
    setPhase("caught");
    setScore((value) => value + earned);
    setPearls((value) => value + (catchItem.rarity === "miracle" ? 5 : catchItem.rarity === "blessed" ? 3 : 1));
    setLifetime((value) => value + 1);
    setJournal((items) => Array.from(new Set([...items, catchItem.id])));
    setBasket((items) => [catchItem, ...items].slice(0, 5));
    setMessage(`${catchItem.name} caught! +${earned} points. ${catchItem.reference}`);

    castTimerRef.current = setTimeout(() => {
      setPhase("explore");
      setCaught(null);
      setMessage("Walk the bridge to fish a different part of the water.");
    }, 1700);
  }, [clearFishingTimers, finishMiss]);

  const cast = useCallback(() => {
    if (phaseRef.current === "bite") {
      reel();
      return;
    }

    const zone = getWaterZone(playerRef.current);
    if (!zone || phaseRef.current !== "explore") {
      setMessage(zone ? "Let this cast finish first." : "You can only fish from the bridge where the line lands in water.");
      return;
    }

    activeZoneRef.current = zone;
    setPhase("casting");
    setCaught(null);
    setMessage(`Casting into the ${zone.label}. Wait for the bobber to turn red.`);
    clearFishingTimers();

    const biteDelay = 1600 + Math.random() * 2200;
    castTimerRef.current = setTimeout(() => {
      if (Math.random() < 0.27) {
        finishMiss("No bite this time. Try another part of the bridge.");
        return;
      }

      setPhase("bite");
      setMessage("Bite! Press Fish or Space now.");
      biteTimerRef.current = setTimeout(() => {
        finishMiss("Too slow. The bobber sank and the fish swam off.");
      }, 900);
    }, biteDelay);
  }, [clearFishingTimers, finishMiss, reel]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "].includes(key)) {
        event.preventDefault();
      }
      keysRef.current.add(key === " " ? "space" : key);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keysRef.current.delete(key === " " ? "space" : key);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const movePlayer = useCallback((direction: Direction, amount = STEP) => {
    if (phaseRef.current !== "explore") return;
    setPulse((value) => value + 1);
    setPlayer((current) => {
      const next = {
        x: clamp(current.x + (direction === "left" ? -amount : direction === "right" ? amount : 0), 7, 93),
        y: clamp(current.y + (direction === "up" ? -amount : direction === "down" ? amount : 0), BRIDGE_MIN_Y, 88),
        direction,
        walking: true,
      };
      return isWalkable(next) ? next : { ...current, direction, walking: false };
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const keys = keysRef.current;
      if (keys.has("space")) {
        keys.delete("space");
        cast();
      }

      if (phaseRef.current !== "explore") return;

      let dx = 0;
      let dy = 0;
      if (keys.has("arrowleft") || keys.has("a")) dx -= STEP;
      if (keys.has("arrowright") || keys.has("d")) dx += STEP;
      if (keys.has("arrowup") || keys.has("w")) dy -= STEP;
      if (keys.has("arrowdown") || keys.has("s")) dy += STEP;

      if (dx === 0 && dy === 0) {
        setPlayer((current) => (current.walking ? { ...current, walking: false } : current));
        return;
      }

      setPulse((value) => value + 1);
      setPlayer((current) => {
        const direction: Direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up";
        const next = {
          x: clamp(current.x + dx, 7, 93),
          y: clamp(current.y + dy, BRIDGE_MIN_Y, 88),
          direction,
          walking: true,
        };
        return isWalkable(next) ? next : { ...current, direction, walking: false };
      });
    }, 70);

    return () => clearInterval(interval);
  }, [cast]);

  useEffect(() => () => clearFishingTimers(), [clearFishingTimers]);

  const moveBy = (direction: Direction) => {
    movePlayer(direction, 4.5);
    window.setTimeout(() => setPlayer((current) => ({ ...current, walking: false })), 180);
  };

  const fishButtonLabel = phase === "bite" ? "Reel" : phase === "casting" ? "Wait" : "Fish";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 text-warm-cocoa">
      <section className="relative overflow-hidden border-[6px] border-[#fff3d6] bg-[#f4c7d8] p-3 shadow-[0_28px_80px_rgba(70,96,112,0.22)] sm:p-4">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%)", backgroundSize: "12px 12px" }} />
        <div className="relative z-10 grid gap-4 xl:grid-cols-[1fr_300px]">
          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-[#2b7885]">8-bit bridge fishing</p>
                <h2 className="font-serif text-2xl font-black text-[#2f2a2d]">Pixel Galilee</h2>
              </div>
              <div className="flex gap-2 text-[10px] font-black uppercase tracking-wider">
                <span className="border-2 border-[#2f2a2d] bg-[#fff3d6] px-3 py-1 shadow-[2px_2px_0_#2f2a2d]">Score {score}</span>
                <span className="border-2 border-[#2f2a2d] bg-[#fff3d6] px-3 py-1 shadow-[2px_2px_0_#2f2a2d]">Pearls {pearls}</span>
              </div>
            </div>

            <PixelMap player={player} phase={phase} caught={caught} onSwipe={moveBy} pulse={pulse} />

            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
              <div className="border-[3px] border-[#2f2a2d] bg-[#fff3d6] px-4 py-3 shadow-[4px_4px_0_#2f2a2d]">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2b7885]">Guide</p>
                <p className="mt-1 min-h-10 text-[12px] font-bold leading-relaxed text-[#4f3b34]">{message}</p>
              </div>
              <button
                type="button"
                onClick={cast}
                disabled={(!canFish && phase !== "bite") || phase === "casting" || phase === "caught" || phase === "missed"}
                className="border-[3px] border-[#2f2a2d] bg-[#f2a8bd] px-8 py-3 text-[11px] font-black uppercase tracking-widest text-[#2f2a2d] shadow-[4px_4px_0_#2f2a2d] transition active:translate-y-0.5 active:shadow-none disabled:opacity-45"
              >
                {fishButtonLabel}
              </button>
            </div>
          </div>

          <aside className="flex flex-col gap-3">
            <div className="border-[3px] border-[#2f2a2d] bg-[#fff3d6] p-4 shadow-[4px_4px_0_#2f2a2d]">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#2b7885]">
                  <Waves className="h-4 w-4" /> Controls
                </span>
                <span className="bg-[#cfeeed] px-2 py-1 text-[8px] font-black uppercase">Swipe</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span />
                <button className="pixel-control" type="button" onClick={() => moveBy("up")}>↑</button>
                <span />
                <button className="pixel-control" type="button" onClick={() => moveBy("left")}>←</button>
                <button className="pixel-control" type="button" onClick={() => moveBy("down")}>↓</button>
                <button className="pixel-control" type="button" onClick={() => moveBy("right")}>→</button>
              </div>
              <p className="mt-3 text-[10px] font-bold leading-relaxed text-[#5f4d43]">Move with WASD, arrows, buttons, or swipe on the map. Fish only from the bridge when the line lands in water.</p>
            </div>

            <div className="border-[3px] border-[#2f2a2d] bg-[#f7dfbe] p-4 shadow-[4px_4px_0_#2f2a2d]">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8f4f73]">
                  <Fish className="h-4 w-4" /> Basket
                </span>
                <span className="text-[9px] font-black uppercase text-[#5f4d43]">{lifetime} caught</span>
              </div>
              <div className="space-y-2">
                {basket.length ? basket.map((item, index) => (
                  <div key={`${item.id}-${index}-${pulse}`} className="flex items-center gap-2 border-2 border-[#2f2a2d]/25 bg-[#fff3d6] px-2 py-2">
                    <PixelFish color={item.color} flip={index % 2 === 0} />
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-black text-[#2f2a2d]">{item.name}</p>
                      <p className="text-[8px] font-bold uppercase text-[#8f4f73]">{item.rarity}</p>
                    </div>
                  </div>
                )) : (
                  <p className="border-2 border-dashed border-[#2f2a2d]/25 bg-[#fff3d6]/70 px-3 py-4 text-center text-[10px] font-bold italic text-[#715f56]">Your basket is waiting.</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowJournal(true)}
              className="flex items-center justify-center gap-2 border-[3px] border-[#2f2a2d] bg-[#cfeeed] px-4 py-3 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_#2f2a2d] active:translate-y-0.5 active:shadow-none"
            >
              <BookOpen className="h-4 w-4" /> Fish Journal
            </button>
          </aside>
        </div>
      </section>

      <AnimatePresence>
        {showJournal && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-[#263238]/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 18, opacity: 0, scale: 0.96 }}
              className="w-full max-w-xl border-4 border-[#2f2a2d] bg-[#fff3d6] p-5 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#2b7885]">Collection</p>
                  <h3 className="font-serif text-xl font-black text-[#2f2a2d]">Fish Journal</h3>
                </div>
                <button type="button" onClick={() => setShowJournal(false)} className="border-2 border-[#2f2a2d] bg-[#f2a8bd] px-3 py-1 text-[10px] font-black">Close</button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {CATCHES.map((item) => {
                  const found = discovered.some((entry) => entry.id === item.id);
                  return (
                    <div key={item.id} className={`border-2 border-[#2f2a2d] p-3 ${found ? "bg-[#f7dfbe]" : "bg-[#d9cfc2] opacity-60"}`}>
                      <div className="mb-2 flex items-center gap-2">
                        {found ? <PixelFish color={item.color} /> : <div className="h-5 w-9 border-2 border-[#2f2a2d] bg-[#8f8379]" />}
                        <p className="text-[11px] font-black">{found ? item.name : "Unknown catch"}</p>
                      </div>
                      <p className="text-[9px] font-bold leading-relaxed text-[#5f4d43]">{found ? `"${item.verse}" - ${item.reference}` : "Keep fishing different parts of the water."}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .pixel-map,
        .pixel-sprite,
        .pixel-grid {
          image-rendering: pixelated;
          image-rendering: crisp-edges;
          touch-action: none;
        }
        .scratch-water {
          background-color: #75ced9;
          background-image: url("/minigames/fishing/water_tile.png");
          background-size: 192px 192px;
          background-position: center;
        }
        .scratch-sand {
          background-color: #dfc184;
          background-image: url("/minigames/fishing/sand_tile.png");
          background-size: 192px 94px;
          background-position: center;
        }
        .scratch-grass {
          background-color: #6eb242;
          background-image: url("/minigames/fishing/grass_tile.png");
          background-size: 192px 192px;
          background-position: center;
        }
        .pixel-flower {
          width: 4px;
          height: 4px;
          background: currentColor;
          box-shadow:
            4px 0 0 currentColor,
            -4px 0 0 currentColor,
            0 4px 0 currentColor,
            0 -4px 0 currentColor,
            0 0 0 2px #5f8d39;
        }
        .pixel-grid {
          background-image:
            linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px);
          background-size: 16px 16px;
        }
        .pixel-control {
          height: 44px;
          border: 3px solid #2f2a2d;
          background: #fff3d6;
          box-shadow: 4px 4px 0 #2f2a2d;
          border-radius: 0;
          font-weight: 900;
          color: #2f2a2d;
        }
        .pixel-control:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0 #2f2a2d;
        }
      `}</style>
    </div>
  );
}
