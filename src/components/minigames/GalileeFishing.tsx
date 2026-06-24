"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, Coins, Fish, ShoppingBag, Waves } from "lucide-react";
import Image from "next/image";

type Direction = "down" | "up" | "left" | "right";
type GamePhase = "explore" | "casting" | "bite" | "caught" | "missed";
type Rarity = "common" | "blessed" | "miracle";
type BaitId = "plain" | "honey" | "pearl" | "miracle" | "royal";
type RodId = "reed" | "cedar" | "silver" | "golden" | "sapphire";

interface CatchItem {
  id: string;
  name: string;
  rarity: Rarity;
  points: number;
  verse: string;
  reference: string;
  color: string;
  description: string;
}

interface SaveData {
  coins?: number;
  pearls?: number;
  lifetime?: number;
  journal?: string[];
  baitInventory?: Partial<Record<BaitId, number>>;
  selectedBait?: BaitId;
  ownedRods?: RodId[];
  selectedRod?: RodId;
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

interface MapPoint {
  x: number;
  y: number;
}

interface BaitItem {
  id: BaitId;
  name: string;
  price: number;
  bonus: number;
  description: string;
}

interface RodItem {
  id: RodId;
  name: string;
  price: number;
  biteBonus: number;
  reelBonus: number;
  description: string;
}

interface CoinPack {
  id: string;
  name: string;
  pearls: number;
  coins: number;
  description: string;
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
    description: "A bright little shore fish that reminds new fishers to begin with faith and patience.",
  },
  {
    id: "peace",
    name: "Peace Minnow",
    rarity: "common",
    points: 11,
    verse: "Peace I leave with you; my peace I give unto you.",
    reference: "John 14:27",
    color: "#a7f3d0",
    description: "A calm green-blue minnow that swims slowly near quiet water.",
  },
  {
    id: "mercy",
    name: "Mercy Koi",
    rarity: "common",
    points: 12,
    verse: "His mercies are new every morning.",
    reference: "Lamentations 3:23",
    color: "#f9a8d4",
    description: "A rosy koi with gentle fins, usually found when the water is still.",
  },
  {
    id: "patience",
    name: "Patience Perch",
    rarity: "common",
    points: 13,
    verse: "In your patience possess ye your souls.",
    reference: "Luke 21:19",
    color: "#fbcfe8",
    description: "A slow perch that teaches the value of quiet waiting on the shore.",
  },
  {
    id: "joy",
    name: "Joy Guppy",
    rarity: "common",
    points: 14,
    verse: "For the joy of the Lord is your strength.",
    reference: "Nehemiah 8:10",
    color: "#fed7aa",
    description: "A cheerful guppy that leaps out of the water, spreading pure joy.",
  },
  {
    id: "grace",
    name: "Grace Goldfish",
    rarity: "common",
    points: 15,
    verse: "For by grace are ye saved through faith.",
    reference: "Ephesians 2:8",
    color: "#fde68a",
    description: "A glittering goldfish that represents abundant, free gift catches.",
  },
  {
    id: "hope",
    name: "Hope Halibut",
    rarity: "common",
    points: 16,
    verse: "Which hope we have as an anchor of the soul.",
    reference: "Hebrews 6:19",
    color: "#bae6fd",
    description: "A steady bottom-dwelling halibut that remains anchored in the shallows.",
  },
  {
    id: "truth",
    name: "Truth Trout",
    rarity: "common",
    points: 17,
    verse: "And ye shall know the truth, and the truth shall make you free.",
    reference: "John 8:32",
    color: "#99f6e4",
    description: "A silver trout that swims in straight paths against active shore currents.",
  },
  {
    id: "kindness",
    name: "Kindness Carp",
    rarity: "common",
    points: 18,
    verse: "Put on therefore... kindness, humbleness of mind.",
    reference: "Colossians 3:12",
    color: "#f5d0fe",
    description: "A friendly, social carp that travels peacefully in shallow waters.",
  },
  {
    id: "loaves",
    name: "Loaves & Fishes Basket",
    rarity: "blessed",
    points: 24,
    verse: "They did all eat, and were filled.",
    reference: "Matthew 14:20",
    color: "#fde047",
    description: "A blessed basket catch from deeper water, representing overflow and providence.",
  },
  {
    id: "pearl",
    name: "Pearl of Great Price",
    rarity: "blessed",
    points: 28,
    verse: "The kingdom of heaven is like unto a merchant seeking goodly pearls.",
    reference: "Matthew 13:45",
    color: "#e9d5ff",
    description: "A rare shining catch with pearl colors, representing value beyond measure.",
  },
  {
    id: "praise",
    name: "Praise Pike",
    rarity: "blessed",
    points: 25,
    verse: "Let every thing that hath breath praise the Lord.",
    reference: "Psalm 150:6",
    color: "#a7f3d0",
    description: "A strong, active pike that fights hard and leaps for joy.",
  },
  {
    id: "wisdom",
    name: "Wisdom Wrasse",
    rarity: "blessed",
    points: 26,
    verse: "Happy is the man that findeth wisdom.",
    reference: "Proverbs 3:13",
    color: "#ddd6fe",
    description: "A clever, colorful fish that hides among deeper lake corals.",
  },
  {
    id: "shepherd",
    name: "Shepherd Salmon",
    rarity: "blessed",
    points: 27,
    verse: "The Lord is my shepherd; I shall not want.",
    reference: "Psalm 23:1",
    color: "#fca5a5",
    description: "A migrating salmon that instinctively knows the safe path home.",
  },
  {
    id: "covenant",
    name: "Covenant Catfish",
    rarity: "blessed",
    points: 28,
    verse: "I do set my bow in the cloud... for a token of a covenant.",
    reference: "Genesis 9:13",
    color: "#fed7aa",
    description: "A patient whiskered catfish that rests near deep-water covenants.",
  },
  {
    id: "tabernacle",
    name: "Tabernacle Tilapia",
    rarity: "blessed",
    points: 30,
    verse: "And let them make me a sanctuary; that I may dwell among them.",
    reference: "Exodus 25:8",
    color: "#cbd5e1",
    description: "Also known as St. Peter's fish, a native Galilee tilapia representing sanctuary.",
  },
  {
    id: "net",
    name: "Overflowing Net",
    rarity: "miracle",
    points: 46,
    verse: "They enclosed a great multitude of fishes.",
    reference: "Luke 5:6",
    color: "#c4b5fd",
    description: "A miracle catch that strains the net, appearing when gear and timing align.",
  },
  {
    id: "livingwater",
    name: "Living Water Bass",
    rarity: "miracle",
    points: 45,
    verse: "The water that I shall give him shall be in him a well of water springing up.",
    reference: "John 4:14",
    color: "#67e8f9",
    description: "A glowing bass that shines from within, caught only in the deepest, cleanest waters.",
  },
  {
    id: "temple",
    name: "Temple Tuna",
    rarity: "miracle",
    points: 48,
    verse: "Know ye not that your body is the temple of the Holy Ghost?",
    reference: "1 Corinthians 6:19",
    color: "#c084fc",
    description: "A massive, powerful tuna that requires advanced rod handling and endurance.",
  },
  {
    id: "anchor",
    name: "Anchor Sturgeon",
    rarity: "miracle",
    points: 50,
    verse: "Which hope we have as an anchor of the soul, both sure and steadfast.",
    reference: "Hebrews 6:19",
    color: "#94a3b8",
    description: "An ancient, heavy sturgeon that represents steadfast hope in deep waters.",
  },
  {
    id: "lightray",
    name: "Light of the World Ray",
    rarity: "miracle",
    points: 52,
    verse: "Ye are the light of the world. A city that is set on a hill cannot be hid.",
    reference: "Matthew 5:14",
    color: "#fde047",
    description: "An ethereal golden ray that glides gracefully in the deep east waters.",
  },
];

const BAITS: BaitItem[] = [
  { id: "plain", name: "Plain Crumbs", price: 0, bonus: 0, description: "Free starter bait. Simple, but it still works." },
  { id: "honey", name: "Honey Bait", price: 18, bonus: 0.08, description: "Sweet bait that slightly improves your bite chance." },
  { id: "pearl", name: "Pearl Bait", price: 42, bonus: 0.16, description: "Shimmering bait that helps blessed catches show up more often." },
  { id: "miracle", name: "Miracle Bait", price: 75, bonus: 0.25, description: "Rare bait with the best chance for unusual fish." },
  { id: "royal", name: "Royal Nectar", price: 120, bonus: 0.38, description: "Ethereal bait that deeply attracts blessed and miracle fish." },
];

const RODS: RodItem[] = [
  { id: "reed", name: "Reed Rod", price: 0, biteBonus: 0, reelBonus: 0, description: "A humble starter rod from the shore." },
  { id: "cedar", name: "Cedar Rod", price: 90, biteBonus: 0.06, reelBonus: 0.06, description: "A smoother rod with a steadier cast." },
  { id: "silver", name: "Silverline Rod", price: 180, biteBonus: 0.1, reelBonus: 0.12, description: "A polished rod with better bite and reel control." },
  { id: "golden", name: "Golden Net Rod", price: 320, biteBonus: 0.16, reelBonus: 0.18, description: "A top-tier rod made for deep water and miracle catches." },
  { id: "sapphire", name: "Sapphire Miracle Rod", price: 500, biteBonus: 0.24, reelBonus: 0.28, description: "An ancient blue-gemmed rod. Perfect line tension and near-instant bites." },
];

const COIN_PACKS: CoinPack[] = [
  { id: "small", name: "Small Coin Pouch", pearls: 2, coins: 40, description: "Trade a few pearls for bait money." },
  { id: "large", name: "Full Coin Pouch", pearls: 5, coins: 115, description: "A better exchange for saving up pearls." },
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
const isBridgePoint = (point: MapPoint) =>
  point.x >= BRIDGE_MIN_X && point.x <= BRIDGE_MAX_X && point.y >= BRIDGE_MIN_Y && point.y <= BRIDGE_MAX_Y;
const isWaterPoint = (point: MapPoint) => point.y < 60;

function getWaterZone(player: Player) {
  if (!isOnBridge(player)) return null;
  return WATER_ZONES.find((zone) => player.x >= zone.minX && player.x < zone.maxX) ?? WATER_ZONES[1];
}

function getWaterZoneForX(x: number) {
  return WATER_ZONES.find((zone) => x >= zone.minX && x < zone.maxX) ?? WATER_ZONES[1];
}

function chooseCatch(zone: WaterZone, bait: BaitItem, rod: RodItem) {
  const roll = Math.random();
  const miracleChance = Math.min((zone.rarityBias === "miracle" ? 0.13 : zone.rarityBias === "blessed" ? 0.06 : 0.025) + bait.bonus * 0.28 + rod.biteBonus * 0.35, 0.34);
  const blessedChance = Math.min((zone.rarityBias === "miracle" ? 0.28 : zone.rarityBias === "blessed" ? 0.36 : 0.17) + bait.bonus * 0.45 + rod.biteBonus * 0.4, 0.62);
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
  castTarget,
  moveTarget,
  onMapTap,
  pulse,
}: {
  player: Player;
  phase: GamePhase;
  caught: CatchItem | null;
  castTarget: MapPoint | null;
  moveTarget: MapPoint | null;
  onMapTap: (point: MapPoint) => void;
  pulse: number;
}) {
  const rodTipX = clamp(player.x + (player.direction === "left" ? -4 : player.direction === "right" ? 4 : 5), 4, 96);
  const rodTipY = player.y - 8;
  const bobberX = castTarget?.x ?? clamp(player.x + (player.direction === "left" ? -12 : player.direction === "right" ? 12 : 8), 6, 94);
  const bobberY = castTarget?.y ?? (player.direction === "up" ? 28 : 58);

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onMapTap({
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    });
  };

  return (
    <div
      className="pixel-map relative h-[640px] overflow-hidden border-[5px] border-[#2f2a2d] bg-[#77cbd6] shadow-[7px_7px_0_#2f2a2d]"
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

      {moveTarget && phase === "explore" && (
        <motion.div
          className="absolute z-40 h-3 w-3 -translate-x-1/2 -translate-y-1/2 border-2 border-[#2f2a2d] bg-[#fff3d6]"
          style={{ left: `${moveTarget.x}%`, top: `${moveTarget.y}%` }}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0.45, 1, 0.45], scale: [0.9, 1.15, 0.9] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
      )}

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
  const [coins, setCoins] = useState(75);
  const [pearls, setPearls] = useState(0);
  const [lifetime, setLifetime] = useState(0);
  const [journal, setJournal] = useState<string[]>([]);
  const [basket, setBasket] = useState<CatchItem[]>([]);
  const [showJournal, setShowJournal] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [baitInventory, setBaitInventory] = useState<Record<BaitId, number>>({ plain: 999, honey: 0, pearl: 0, miracle: 0, royal: 0 });
  const [selectedBait, setSelectedBait] = useState<BaitId>("plain");
  const [ownedRods, setOwnedRods] = useState<RodId[]>(["reed"]);
  const [selectedRod, setSelectedRod] = useState<RodId>("reed");
  const [newDiscovery, setNewDiscovery] = useState<CatchItem | null>(null);
  const [pulse, setPulse] = useState(0);
  const [moveTarget, setMoveTarget] = useState<MapPoint | null>(null);
  const [castTarget, setCastTarget] = useState<MapPoint | null>(null);

  const keysRef = useRef(new Set<string>());
  const castTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const biteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef(player);
  const phaseRef = useRef(phase);
  const activeZoneRef = useRef<WaterZone | null>(null);
  const moveTargetRef = useRef<MapPoint | null>(null);

  const waterZone = useMemo(() => getWaterZone(player), [player]);
  const canFish = Boolean(waterZone && phase === "explore");
  const discovered = useMemo(() => CATCHES.filter((item) => journal.includes(item.id)), [journal]);
  const activeBait = useMemo(() => BAITS.find((bait) => bait.id === selectedBait) ?? BAITS[0], [selectedBait]);
  const activeRod = useMemo(() => RODS.find((rod) => rod.id === selectedRod) ?? RODS[0], [selectedRod]);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    moveTargetRef.current = moveTarget;
  }, [moveTarget]);

  useEffect(() => {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;

    try {
      const saved = JSON.parse(raw) as SaveData;
      queueMicrotask(() => {
        setPearls(saved.pearls ?? 0);
        setCoins(saved.coins ?? 75);
        setLifetime(saved.lifetime ?? 0);
        setJournal(saved.journal ?? []);
        const savedInv = saved.baitInventory || {};
        setBaitInventory({
          plain: 999,
          honey: savedInv.honey ?? 0,
          pearl: savedInv.pearl ?? 0,
          miracle: savedInv.miracle ?? 0,
          royal: savedInv.royal ?? 0,
        });
        setSelectedBait(saved.selectedBait ?? "plain");
        setOwnedRods(saved.ownedRods?.length ? saved.ownedRods : ["reed"]);
        setSelectedRod(saved.selectedRod ?? "reed");
      });
    } catch {
      localStorage.removeItem(SAVE_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ coins, pearls, lifetime, journal, baitInventory, selectedBait, ownedRods, selectedRod }));
  }, [baitInventory, coins, journal, lifetime, ownedRods, pearls, selectedBait, selectedRod]);

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
      setCastTarget(null);
      setMessage("Walk along the bridge and try another cast into the water.");
    }, 1100);
  }, [clearFishingTimers]);

  const reel = useCallback(() => {
    if (phaseRef.current !== "bite" || !activeZoneRef.current) return;
    clearFishingTimers();

    const bait = BAITS.find((item) => item.id === selectedBait) ?? BAITS[0];
    const rod = RODS.find((item) => item.id === selectedRod) ?? RODS[0];
    if (Math.random() > Math.min(0.96, 0.62 + bait.bonus * 0.45 + rod.reelBonus * 0.8)) {
      finishMiss("So close. The line tugged hard, but the fish got free.");
      return;
    }

    const catchItem = chooseCatch(activeZoneRef.current, bait, rod);
    const earned = catchItem.points;
    const coinEarned = Math.round(earned * (catchItem.rarity === "miracle" ? 1.4 : catchItem.rarity === "blessed" ? 1.15 : 1));
    const isNewFish = !journal.includes(catchItem.id);
    setCaught(catchItem);
    setPhase("caught");
    setScore((value) => value + earned);
    setCoins((value) => value + coinEarned);
    setPearls((value) => value + (catchItem.rarity === "miracle" ? 5 : catchItem.rarity === "blessed" ? 3 : 1));
    setLifetime((value) => value + 1);
    setJournal((items) => Array.from(new Set([...items, catchItem.id])));
    setBasket((items) => [catchItem, ...items].slice(0, 5));
    setMessage(`${catchItem.name} caught! +${earned} points, +${coinEarned} coins. ${catchItem.reference}`);
    if (isNewFish) setNewDiscovery(catchItem);

    castTimerRef.current = setTimeout(() => {
      setPhase("explore");
      setCaught(null);
      setCastTarget(null);
      setMessage("Walk the bridge to fish a different part of the water.");
    }, 1700);
  }, [clearFishingTimers, finishMiss, journal, selectedBait, selectedRod]);

  const buyBait = (bait: BaitItem) => {
    if (bait.id === "plain") {
      setSelectedBait("plain");
      setMessage("Plain Crumbs are equipped.");
      return;
    }
    if (coins < bait.price) {
      setMessage(`Need ${bait.price - coins} more coins for ${bait.name}.`);
      return;
    }
    setCoins((value) => value - bait.price);
    setBaitInventory((items) => ({ ...items, [bait.id]: (items[bait.id] ?? 0) + 3 }));
    setSelectedBait(bait.id);
    setMessage(`${bait.name} bought and equipped. You got 3 casts.`);
  };

  const buyOrEquipRod = (rod: RodItem) => {
    if (ownedRods.includes(rod.id)) {
      setSelectedRod(rod.id);
      setMessage(`${rod.name} equipped.`);
      return;
    }
    if (coins < rod.price) {
      setMessage(`Need ${rod.price - coins} more coins for ${rod.name}.`);
      return;
    }
    setCoins((value) => value - rod.price);
    setOwnedRods((items) => [...items, rod.id]);
    setSelectedRod(rod.id);
    setMessage(`${rod.name} bought and equipped.`);
  };

  const buyCoinPack = (pack: CoinPack) => {
    if (pearls < pack.pearls) {
      setMessage(`Need ${pack.pearls - pearls} more pearls for ${pack.name}.`);
      return;
    }
    setPearls((value) => value - pack.pearls);
    setCoins((value) => value + pack.coins);
    setMessage(`${pack.name} opened for +${pack.coins} coins.`);
  };

  const cast = useCallback((target?: MapPoint) => {
    if (phaseRef.current === "bite") {
      reel();
      return;
    }

    const zone = target ? getWaterZoneForX(target.x) : getWaterZone(playerRef.current);
    if (!zone || phaseRef.current !== "explore") {
      setMessage(zone ? "Let this cast finish first." : "You can only fish from the bridge where the line lands in water.");
      return;
    }
    if (!isOnBridge(playerRef.current)) {
      setMessage("Stand on the bridge first, then tap the water to cast.");
      return;
    }

    activeZoneRef.current = zone;
    setMoveTarget(null);
    if (selectedBait !== "plain") {
      const remaining = baitInventory[selectedBait] ?? 0;
      if (remaining <= 0) {
        setSelectedBait("plain");
        setMessage("That bait is out, so Plain Crumbs are back on the hook.");
        return;
      }
      setBaitInventory((items) => ({ ...items, [selectedBait]: Math.max((items[selectedBait] ?? 0) - 1, 0) }));
    }
    setCastTarget(target ?? {
      x: clamp(playerRef.current.x + (playerRef.current.direction === "left" ? -12 : playerRef.current.direction === "right" ? 12 : 8), 6, 94),
      y: playerRef.current.direction === "up" ? 28 : 58,
    });
    setPhase("casting");
    setCaught(null);
    setMessage(`Casting into the ${zone.label}. Wait for the bobber to turn red.`);
    clearFishingTimers();

    const biteDelay = Math.max(900, 1600 + Math.random() * 2200 - activeRod.biteBonus * 1800 - activeBait.bonus * 1200);
    castTimerRef.current = setTimeout(() => {
      if (Math.random() < Math.max(0.08, 0.27 - activeRod.biteBonus - activeBait.bonus)) {
        finishMiss("No bite this time. Try another part of the bridge.");
        return;
      }

      setPhase("bite");
      setMessage("Bite! Press Fish or Space now.");
      biteTimerRef.current = setTimeout(() => {
        finishMiss("Too slow. The bobber sank and the fish swam off.");
      }, 950 + activeRod.reelBonus * 2200);
    }, biteDelay);
  }, [activeBait, activeRod, baitInventory, clearFishingTimers, finishMiss, reel, selectedBait]);

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
      if (dx !== 0 || dy !== 0) {
        setMoveTarget(null);
      }

      const target = moveTargetRef.current;
      if (dx === 0 && dy === 0 && target) {
        setPlayer((current) => {
          const toX = target.x - current.x;
          const toY = target.y - current.y;
          const remaining = Math.hypot(toX, toY);
          if (remaining < 1.4) {
            moveTargetRef.current = null;
            queueMicrotask(() => setMoveTarget(null));
            return { ...current, x: target.x, y: target.y, walking: false };
          }

          const amount = Math.min(2.2, remaining);
          const nextDx = (toX / remaining) * amount;
          const nextDy = (toY / remaining) * amount;
          const direction: Direction = Math.abs(nextDx) > Math.abs(nextDy)
            ? nextDx > 0 ? "right" : "left"
            : nextDy > 0 ? "down" : "up";
          const next = {
            x: clamp(current.x + nextDx, 7, 93),
            y: clamp(current.y + nextDy, BRIDGE_MIN_Y, 88),
            direction,
            walking: true,
          };
          return isWalkable(next) ? next : { ...current, direction, walking: false };
        });
        setPulse((value) => value + 1);
        return;
      }

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
    setMoveTarget(null);
    movePlayer(direction, 4.5);
    window.setTimeout(() => setPlayer((current) => ({ ...current, walking: false })), 180);
  };

  const handleMapTap = useCallback((point: MapPoint) => {
    if (phaseRef.current === "bite") {
      reel();
      return;
    }
    if (phaseRef.current !== "explore") return;

    if (isBridgePoint(point)) {
      setMoveTarget({
        x: clamp(point.x, BRIDGE_MIN_X, BRIDGE_MAX_X),
        y: clamp(point.y, BRIDGE_MIN_Y, BRIDGE_MAX_Y),
      });
      setMessage("Walking to that spot on the bridge.");
      return;
    }

    if (isWaterPoint(point)) {
      if (!isOnBridge(playerRef.current)) {
        setMessage("Tap the bridge first so she can walk into position, then tap the water to cast.");
        return;
      }
      const target = {
        x: clamp(point.x, 6, 94),
        y: clamp(point.y, 8, 59),
      };
      setPlayer((current) => ({
        ...current,
        direction: Math.abs(target.x - current.x) > Math.abs(target.y - current.y)
          ? target.x > current.x ? "right" : "left"
          : target.y > current.y ? "down" : "up",
      }));
      cast(target);
      return;
    }

    setMessage("Tap the bridge to walk, or tap the water to cast.");
  }, [cast, reel]);

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
                <span className="border-2 border-[#2f2a2d] bg-[#fff3d6] px-3 py-1 shadow-[2px_2px_0_#2f2a2d]">Coins {coins}</span>
                <span className="border-2 border-[#2f2a2d] bg-[#fff3d6] px-3 py-1 shadow-[2px_2px_0_#2f2a2d]">Pearls {pearls}</span>
              </div>
            </div>

            <PixelMap
              player={player}
              phase={phase}
              caught={caught}
              castTarget={castTarget}
              moveTarget={moveTarget}
              onMapTap={handleMapTap}
              pulse={pulse}
            />

            <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
              <div className="border-[3px] border-[#2f2a2d] bg-[#fff3d6] px-4 py-3 shadow-[4px_4px_0_#2f2a2d]">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2b7885]">Guide</p>
                <p className="mt-1 min-h-10 text-[12px] font-bold leading-relaxed text-[#4f3b34]">{message}</p>
              </div>
              <button
                type="button"
                onClick={() => cast()}
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
                <span className="bg-[#cfeeed] px-2 py-1 text-[8px] font-black uppercase">Tap</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span />
                <button className="pixel-control" type="button" onClick={() => moveBy("up")}>↑</button>
                <span />
                <button className="pixel-control" type="button" onClick={() => moveBy("left")}>←</button>
                <button className="pixel-control" type="button" onClick={() => moveBy("down")}>↓</button>
                <button className="pixel-control" type="button" onClick={() => moveBy("right")}>→</button>
              </div>
              <p className="mt-3 text-[10px] font-bold leading-relaxed text-[#5f4d43]">Tap the bridge to walk there. Tap water to cast. WASD, arrows, and buttons still work.</p>
            </div>

            <div className="border-[3px] border-[#2f2a2d] bg-[#fff3d6] p-4 shadow-[4px_4px_0_#2f2a2d]">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8f4f73]">
                  <ShoppingBag className="h-4 w-4" /> Gear
                </span>
                <span className="flex items-center gap-1 bg-[#f7dfbe] px-2 py-1 text-[8px] font-black uppercase">
                  <Coins className="h-3 w-3" /> {coins}
                </span>
              </div>
              <div className="space-y-2 text-[10px] font-bold text-[#5f4d43]">
                <div className="border-2 border-[#2f2a2d]/20 bg-[#f7dfbe] p-2">
                  <p className="font-black text-[#2f2a2d]">{activeBait.name}</p>
                  <p>{selectedBait === "plain" ? "Unlimited" : `${baitInventory[selectedBait] ?? 0} casts left`}</p>
                </div>
                <div className="border-2 border-[#2f2a2d]/20 bg-[#cfeeed] p-2">
                  <p className="font-black text-[#2f2a2d]">{activeRod.name}</p>
                  <p>{activeRod.description}</p>
                </div>
              </div>
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

            <button
              type="button"
              onClick={() => setShowShop(true)}
              className="flex items-center justify-center gap-2 border-[3px] border-[#2f2a2d] bg-[#f2a8bd] px-4 py-3 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_#2f2a2d] active:translate-y-0.5 active:shadow-none"
            >
              <ShoppingBag className="h-4 w-4" /> Bait & Rod Shop
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
                      <p className="text-[9px] font-bold leading-relaxed text-[#5f4d43]">{found ? item.description : "Keep fishing different parts of the water."}</p>
                      {found && <p className="mt-2 text-[8px] font-black uppercase tracking-wider text-[#8f4f73]">{item.reference}</p>}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShop && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-[#263238]/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 18, opacity: 0, scale: 0.96 }}
              className="max-h-[88vh] w-full max-w-3xl overflow-y-auto border-4 border-[#2f2a2d] bg-[#fff3d6] p-5 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#2b7885]">Coins {coins} | Pearls {pearls}</p>
                  <h3 className="font-serif text-xl font-black text-[#2f2a2d]">Bait & Rod Shop</h3>
                </div>
                <button type="button" onClick={() => setShowShop(false)} className="border-2 border-[#2f2a2d] bg-[#f2a8bd] px-3 py-1 text-[10px] font-black">Close</button>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <section>
                  <h4 className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8f4f73]">Bait</h4>
                  <div className="space-y-2">
                    {BAITS.map((bait) => (
                      <div key={bait.id} className="border-2 border-[#2f2a2d] bg-[#f7dfbe] p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[12px] font-black text-[#2f2a2d]">{bait.name}</p>
                            <p className="mt-1 text-[9px] font-bold leading-relaxed text-[#5f4d43]">{bait.description}</p>
                            <p className="mt-1 text-[8px] font-black uppercase text-[#8f4f73]">{bait.id === "plain" ? "Unlimited" : `${baitInventory[bait.id] ?? 0} owned | ${bait.price} coins for 3`}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => buyBait(bait)}
                            className="shrink-0 border-2 border-[#2f2a2d] bg-[#fff3d6] px-3 py-2 text-[9px] font-black uppercase shadow-[2px_2px_0_#2f2a2d] active:translate-y-0.5 active:shadow-none disabled:opacity-45"
                            disabled={bait.id !== "plain" && coins < bait.price}
                          >
                            {bait.id === selectedBait ? "Equipped" : bait.id === "plain" ? "Equip" : "Buy"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h4 className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#2b7885]">Rods</h4>
                  <div className="space-y-2">
                    {RODS.map((rod) => {
                      const owned = ownedRods.includes(rod.id);
                      return (
                        <div key={rod.id} className="border-2 border-[#2f2a2d] bg-[#cfeeed] p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[12px] font-black text-[#2f2a2d]">{rod.name}</p>
                              <p className="mt-1 text-[9px] font-bold leading-relaxed text-[#5f4d43]">{rod.description}</p>
                              <p className="mt-1 text-[8px] font-black uppercase text-[#2b7885]">{owned ? "Owned" : `${rod.price} coins`} | Bite +{Math.round(rod.biteBonus * 100)} | Reel +{Math.round(rod.reelBonus * 100)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => buyOrEquipRod(rod)}
                              className="shrink-0 border-2 border-[#2f2a2d] bg-[#fff3d6] px-3 py-2 text-[9px] font-black uppercase shadow-[2px_2px_0_#2f2a2d] active:translate-y-0.5 active:shadow-none disabled:opacity-45"
                              disabled={!owned && coins < rod.price}
                            >
                              {selectedRod === rod.id ? "Equipped" : owned ? "Equip" : "Buy"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              <section className="mt-4">
                <h4 className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#8f4f73]">Coin Pouches</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {COIN_PACKS.map((pack) => (
                    <div key={pack.id} className="border-2 border-[#2f2a2d] bg-[#f7dfbe] p-3">
                      <p className="text-[12px] font-black text-[#2f2a2d]">{pack.name}</p>
                      <p className="mt-1 text-[9px] font-bold leading-relaxed text-[#5f4d43]">{pack.description}</p>
                      <button
                        type="button"
                        onClick={() => buyCoinPack(pack)}
                        className="mt-2 border-2 border-[#2f2a2d] bg-[#fff3d6] px-3 py-2 text-[9px] font-black uppercase shadow-[2px_2px_0_#2f2a2d] active:translate-y-0.5 active:shadow-none disabled:opacity-45"
                        disabled={pearls < pack.pearls}
                      >
                        {pack.pearls} pearls to {pack.coins} coins
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {newDiscovery && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-[#263238]/50 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 18, opacity: 0, scale: 0.96 }}
              className="w-full max-w-md border-4 border-[#2f2a2d] bg-[#fff3d6] p-5 text-[#2f2a2d] shadow-2xl"
            >
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8f4f73]">New Fish Discovered</p>
              <div className="my-4 flex items-center gap-3">
                <PixelFish color={newDiscovery.color} />
                <div>
                  <h3 className="font-serif text-xl font-black">{newDiscovery.name}</h3>
                  <p className="text-[9px] font-black uppercase text-[#2b7885]">{newDiscovery.rarity}</p>
                </div>
              </div>
              <p className="text-[12px] font-bold leading-relaxed text-[#5f4d43]">{newDiscovery.description}</p>
              <p className="mt-3 text-[10px] font-black uppercase tracking-wider text-[#8f4f73]">{newDiscovery.reference}</p>
              <button
                type="button"
                onClick={() => setNewDiscovery(null)}
                className="mt-5 w-full border-2 border-[#2f2a2d] bg-[#f2a8bd] px-3 py-2 text-[10px] font-black uppercase shadow-[3px_3px_0_#2f2a2d] active:translate-y-0.5 active:shadow-none"
              >
                Add to Journal
              </button>
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
