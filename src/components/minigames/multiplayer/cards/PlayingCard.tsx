"use client";

import { motion } from "framer-motion";
import { SUITS, FACE_CARDS, type Card, type Suit } from "./bibleCards";

// ─── Types ──────────────────────────────────────────────────

interface PlayingCardProps {
  card: Card | null; // null = show back
  faceUp?: boolean; // default true
  size?: "sm" | "md" | "lg"; // default "md"
  className?: string;
  animate?: boolean; // enable flip animation
}

// ─── Size Config ────────────────────────────────────────────

const SIZE_MAP = {
  sm: {
    container: "w-14 h-20",
    rankText: "text-[9px]",
    suitCorner: "text-[7px]",
    centerSymbol: "text-base",
    centerEmoji: "text-xl",
    characterName: "text-[5px]",
    cornerGap: "gap-0",
    cornerPadding: "p-[3px]",
    accentHeight: "h-0.5",
    backSymbol: "text-sm",
    backBorder: "inset-[3px]",
    innerPattern: "text-[4px] gap-0.5",
    pipSize: "text-[6px]",
    pipGap: "gap-[1px]",
    faceFrame: "w-8 h-8",
  },
  md: {
    container: "w-20 h-28",
    rankText: "text-sm",
    suitCorner: "text-[9px]",
    centerSymbol: "text-xl",
    centerEmoji: "text-2xl",
    characterName: "text-[6px]",
    cornerGap: "gap-0",
    cornerPadding: "p-1",
    accentHeight: "h-0.5",
    backSymbol: "text-lg",
    backBorder: "inset-[4px]",
    innerPattern: "text-[5px] gap-1",
    pipSize: "text-[9px]",
    pipGap: "gap-[2px]",
    faceFrame: "w-10 h-11",
  },
  lg: {
    container: "w-24 h-34",
    rankText: "text-base",
    suitCorner: "text-[11px]",
    centerSymbol: "text-2xl",
    centerEmoji: "text-3xl",
    characterName: "text-[7px]",
    cornerGap: "gap-0",
    cornerPadding: "p-1.5",
    accentHeight: "h-1",
    backSymbol: "text-xl",
    backBorder: "inset-[5px]",
    innerPattern: "text-[6px] gap-1",
    pipSize: "text-[11px]",
    pipGap: "gap-[3px]",
    faceFrame: "w-12 h-14",
  },
} as const;

// ─── Helpers ────────────────────────────────────────────────

function isFaceRank(rank: string): rank is "A" | "K" | "Q" | "J" {
  return rank === "A" || rank === "K" || rank === "Q" || rank === "J";
}

// Suit colors for pips and rank text
function getSuitTextColor(suit: Suit): string {
  const colors: Record<Suit, string> = {
    patriarchs: "#047857", // emerald-700
    kingdom: "#b45309",    // amber-700
    prophets: "#1d4ed8",   // blue-700
    gospel: "#be185d",     // pink-700
  };
  return colors[suit];
}

// Suit-specific subtle background gradient
function getCardBg(suit: Suit): string {
  const bgs: Record<Suit, string> = {
    patriarchs: "linear-gradient(145deg, #fff 60%, #ecfdf5 100%)",
    kingdom: "linear-gradient(145deg, #fff 60%, #fffbeb 100%)",
    prophets: "linear-gradient(145deg, #fff 60%, #eff6ff 100%)",
    gospel: "linear-gradient(145deg, #fff 60%, #fdf2f8 100%)",
  };
  return bgs[suit];
}

// ─── Pip Layouts (like real playing cards) ────────────────────

// Grid positions for pips — each pip is placed at [row, col] in a 3-col × 5-row grid
// row 0 = top, row 4 = bottom; col 0 = left, col 1 = center, col 2 = right
const PIP_LAYOUTS: Record<string, [number, number][]> = {
  "A":  [[2, 1]],
  "2":  [[0, 1], [4, 1]],
  "3":  [[0, 1], [2, 1], [4, 1]],
  "4":  [[0, 0], [0, 2], [4, 0], [4, 2]],
  "5":  [[0, 0], [0, 2], [2, 1], [4, 0], [4, 2]],
  "6":  [[0, 0], [0, 2], [2, 0], [2, 2], [4, 0], [4, 2]],
  "7":  [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2], [4, 0], [4, 2]],
  "8":  [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2], [3, 1], [4, 0], [4, 2]],
  "9":  [[0, 0], [0, 2], [1, 0], [1, 2], [2, 1], [3, 0], [3, 2], [4, 0], [4, 2]],
  "10": [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2], [3, 0], [3, 1], [3, 2], [4, 0], [4, 2]],
};

function PipGrid({ suit, rank, size }: { suit: Suit; rank: string; size: "sm" | "md" | "lg" }) {
  const s = SIZE_MAP[size];
  const layout = PIP_LAYOUTS[rank];
  if (!layout) return null;

  const suitInfo = SUITS[suit];

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="grid grid-rows-5 grid-cols-3 items-center justify-items-center"
        style={{
          width: size === "sm" ? 30 : size === "md" ? 42 : 52,
          height: size === "sm" ? 40 : size === "md" ? 58 : 72,
        }}
      >
        {Array.from({ length: 15 }).map((_, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const hasPip = layout.some(([r, c]) => r === row && c === col);
          const isBottomHalf = row >= 3;

          return (
            <span
              key={i}
              className={`${s.pipSize} leading-none select-none ${isBottomHalf ? "rotate-180" : ""}`}
              style={{ visibility: hasPip ? "visible" : "hidden" }}
            >
              {suitInfo.symbol}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Card Back ──────────────────────────────────────────────

function CardBack({ size }: { size: "sm" | "md" | "lg" }) {
  const s = SIZE_MAP[size];

  return (
    <div
      className="relative w-full h-full rounded-lg overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #5b3a29 0%, #3d2317 40%, #4a2c1a 100%)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      {/* Ornate inner border */}
      <div
        className={`absolute ${s.backBorder} rounded-md`}
        style={{
          border: "1.5px solid rgba(212,175,120,0.35)",
        }}
      />

      {/* Inner double border */}
      <div
        className="absolute rounded-sm"
        style={{
          top: size === "sm" ? 5 : size === "md" ? 7 : 9,
          left: size === "sm" ? 5 : size === "md" ? 7 : 9,
          right: size === "sm" ? 5 : size === "md" ? 7 : 9,
          bottom: size === "sm" ? 5 : size === "md" ? 7 : 9,
          border: "0.5px solid rgba(212,175,120,0.15)",
        }}
      />

      {/* Diamond crosshatch pattern */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(212,175,120,0.8) 3px, rgba(212,175,120,0.8) 3.5px),
            repeating-linear-gradient(-45deg, transparent, transparent 3px, rgba(212,175,120,0.8) 3px, rgba(212,175,120,0.8) 3.5px)
          `,
        }}
      />

      {/* Center medallion */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="flex flex-col items-center justify-center rounded-full"
          style={{
            width: size === "sm" ? 22 : size === "md" ? 32 : 40,
            height: size === "sm" ? 22 : size === "md" ? 32 : 40,
            background: "radial-gradient(circle, rgba(212,175,120,0.15) 0%, transparent 70%)",
            border: "1px solid rgba(212,175,120,0.2)",
          }}
        >
          <span className={`${s.backSymbol} leading-none`} style={{ color: "rgba(212,175,120,0.45)" }}>✝</span>
        </div>
      </div>

      {/* Corner flourishes */}
      <div className="absolute top-[2px] left-[3px]">
        <span style={{ fontSize: size === "sm" ? 5 : 7, color: "rgba(212,175,120,0.3)" }}>❧</span>
      </div>
      <div className="absolute bottom-[2px] right-[3px] rotate-180">
        <span style={{ fontSize: size === "sm" ? 5 : 7, color: "rgba(212,175,120,0.3)" }}>❧</span>
      </div>

      {/* Subtle shine */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)",
        }}
      />
    </div>
  );
}

// ─── Card Front ─────────────────────────────────────────────

function CardFront({ card, size }: { card: Card; size: "sm" | "md" | "lg" }) {
  const s = SIZE_MAP[size];
  const suit = SUITS[card.suit];
  const isFace = isFaceRank(card.rank);
  const textColor = getSuitTextColor(card.suit);
  const isAce = card.rank === "A";

  return (
    <div
      className="relative w-full h-full rounded-lg overflow-hidden"
      style={{
        background: getCardBg(card.suit),
        boxShadow: "0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.6)",
        border: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      {/* Top-left corner: rank + suit */}
      <div
        className={`absolute top-0 left-0 ${s.cornerPadding} flex flex-col items-center ${s.cornerGap} leading-none`}
      >
        <span className={`${s.rankText} font-bold`} style={{ color: textColor }}>
          {card.rank}
        </span>
        <span className={`${s.suitCorner}`}>
          {suit.symbol}
        </span>
      </div>

      {/* Bottom-right corner: rank + suit (rotated 180°) */}
      <div
        className={`absolute bottom-0 right-0 ${s.cornerPadding} flex flex-col items-center ${s.cornerGap} rotate-180 leading-none`}
      >
        <span className={`${s.rankText} font-bold`} style={{ color: textColor }}>
          {card.rank}
        </span>
        <span className={`${s.suitCorner}`}>
          {suit.symbol}
        </span>
      </div>

      {/* Center area */}
      {isFace && !isAce ? (
        /* ── Face card: decorative frame with emoji + character ── */
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`${s.faceFrame} flex flex-col items-center justify-center rounded-md relative`}
            style={{
              background: `linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(0,0,0,0.02) 100%)`,
              border: `1.5px solid ${textColor}22`,
            }}
          >
            {/* Decorative top/bottom lines */}
            <div
              className="absolute top-0 left-1 right-1 h-[1px]"
              style={{ background: `${textColor}20` }}
            />
            <div
              className="absolute bottom-0 left-1 right-1 h-[1px]"
              style={{ background: `${textColor}20` }}
            />

            <span className={`${s.centerEmoji} leading-none drop-shadow-sm`}>
              {card.emoji}
            </span>
            <span
              className={`${s.characterName} font-bold tracking-wider uppercase leading-none mt-0.5`}
              style={{ color: textColor }}
            >
              {card.character}
            </span>
          </div>
        </div>
      ) : isAce ? (
        /* ── Ace: large ornate center suit symbol ── */
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <span
              className="leading-none drop-shadow-md"
              style={{ fontSize: size === "sm" ? 28 : size === "md" ? 38 : 48 }}
            >
              {suit.symbol}
            </span>
            {card.character && (
              <span
                className={`${s.characterName} font-bold tracking-widest uppercase leading-none mt-0.5`}
                style={{ color: textColor, opacity: 0.6 }}
              >
                {card.character}
              </span>
            )}
          </div>
        </div>
      ) : (
        /* ── Number card: pip layout ── */
        <PipGrid suit={card.suit} rank={card.rank} size={size} />
      )}

      {/* Subtle card texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-lg"
        style={{
          boxShadow: "inset 0 0 15px rgba(0,0,0,0.03)",
        }}
      />

      {/* Top edge shine */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
        }}
      />
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export function PlayingCard({
  card,
  faceUp = true,
  size = "md",
  className = "",
  animate = false,
}: PlayingCardProps) {
  const s = SIZE_MAP[size];
  const showFront = card !== null && faceUp;

  if (animate) {
    return (
      <div
        className={`${s.container} ${className}`}
        style={{ perspective: 600 }}
      >
        <motion.div
          className="relative w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: showFront ? 0 : 180 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
        >
          {/* Front face */}
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: "hidden" }}
          >
            {card ? (
              <CardFront card={card} size={size} />
            ) : (
              <CardBack size={size} />
            )}
          </div>

          {/* Back face */}
          <div
            className="absolute inset-0"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <CardBack size={size} />
          </div>
        </motion.div>
      </div>
    );
  }

  // Non-animated variant
  return (
    <div
      className={`${s.container} ${className} select-none`}
    >
      {showFront && card ? (
        <CardFront card={card} size={size} />
      ) : (
        <CardBack size={size} />
      )}
    </div>
  );
}
