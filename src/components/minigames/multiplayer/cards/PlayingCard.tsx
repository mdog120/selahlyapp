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
    rankText: "text-[8px]",
    suitCorner: "text-[6px]",
    centerSymbol: "text-lg",
    centerEmoji: "text-xl",
    characterName: "text-[5px]",
    cornerGap: "gap-0",
    cornerPadding: "p-1",
    accentHeight: "h-0.5",
    backSymbol: "text-xs",
    backBorder: "inset-[3px]",
    innerPattern: "text-[4px] gap-0.5",
  },
  md: {
    container: "w-20 h-28",
    rankText: "text-xs",
    suitCorner: "text-[8px]",
    centerSymbol: "text-2xl",
    centerEmoji: "text-3xl",
    characterName: "text-[7px]",
    cornerGap: "gap-0.5",
    cornerPadding: "p-1.5",
    accentHeight: "h-1",
    backSymbol: "text-base",
    backBorder: "inset-[5px]",
    innerPattern: "text-[5px] gap-1",
  },
  lg: {
    container: "w-24 h-34",
    rankText: "text-sm",
    suitCorner: "text-[10px]",
    centerSymbol: "text-3xl",
    centerEmoji: "text-4xl",
    characterName: "text-[8px]",
    cornerGap: "gap-0.5",
    cornerPadding: "p-2",
    accentHeight: "h-1.5",
    backSymbol: "text-lg",
    backBorder: "inset-[6px]",
    innerPattern: "text-[6px] gap-1",
  },
} as const;

// ─── Helpers ────────────────────────────────────────────────

function isFaceRank(rank: string): rank is "A" | "K" | "Q" | "J" {
  return rank === "A" || rank === "K" || rank === "Q" || rank === "J";
}

// Suit-specific gradient for the top accent strip
function getAccentGradient(suit: Suit): string {
  const gradients: Record<Suit, string> = {
    patriarchs: "from-emerald-300 via-emerald-200 to-emerald-100",
    kingdom: "from-amber-300 via-amber-200 to-amber-100",
    prophets: "from-blue-300 via-blue-200 to-blue-100",
    gospel: "from-pink-300 via-pink-200 to-pink-100",
  };
  return gradients[suit];
}

// ─── Card Back ──────────────────────────────────────────────

function CardBack({ size }: { size: "sm" | "md" | "lg" }) {
  const s = SIZE_MAP[size];

  return (
    <div className="relative w-full h-full rounded-xl bg-gradient-to-br from-warm-cocoa to-warm-cocoa/80 overflow-hidden">
      {/* Decorative dashed inner border */}
      <div
        className={`absolute ${s.backBorder} rounded-lg border border-dashed border-white/20 pointer-events-none`}
      />

      {/* Subtle repeating pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 4px,
            rgba(255,255,255,0.5) 4px,
            rgba(255,255,255,0.5) 5px
          )`,
        }}
      />

      {/* Diamond pattern overlay */}
      <div className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 4px,
            rgba(255,255,255,0.5) 4px,
            rgba(255,255,255,0.5) 5px
          )`,
        }}
      />

      {/* Center cross / dove symbol */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-0.5">
          <span className={`${s.backSymbol} text-white/30 leading-none`}>✝</span>
          <span className="text-[5px] text-white/15 tracking-widest uppercase font-bold">
            Selahly
          </span>
        </div>
      </div>

      {/* Corner accents */}
      <div className="absolute top-1 left-1">
        <span className="text-[5px] text-white/20">🕊</span>
      </div>
      <div className="absolute bottom-1 right-1 rotate-180">
        <span className="text-[5px] text-white/20">🕊</span>
      </div>
    </div>
  );
}

// ─── Card Front ─────────────────────────────────────────────

function CardFront({ card, size }: { card: Card; size: "sm" | "md" | "lg" }) {
  const s = SIZE_MAP[size];
  const suit = SUITS[card.suit];
  const isFace = isFaceRank(card.rank);

  return (
    <div
      className={`relative w-full h-full rounded-xl bg-white border ${suit.borderColor} overflow-hidden`}
    >
      {/* Top accent gradient strip */}
      <div
        className={`absolute top-0 left-0 right-0 ${s.accentHeight} bg-gradient-to-r ${getAccentGradient(card.suit)} opacity-80`}
      />

      {/* Subtle suit-tinted background */}
      <div className={`absolute inset-0 ${suit.bgColor} opacity-20 pointer-events-none`} />

      {/* Top-left corner: rank + suit */}
      <div
        className={`absolute top-0 left-0 ${s.cornerPadding} flex flex-col items-center ${s.cornerGap}`}
      >
        <span className={`${s.rankText} font-bold leading-none ${suit.color}`}>
          {card.rank}
        </span>
        <span className={`${s.suitCorner} leading-none`}>
          {suit.symbol}
        </span>
      </div>

      {/* Bottom-right corner: rank + suit (rotated 180°) */}
      <div
        className={`absolute bottom-0 right-0 ${s.cornerPadding} flex flex-col items-center ${s.cornerGap} rotate-180`}
      >
        <span className={`${s.rankText} font-bold leading-none ${suit.color}`}>
          {card.rank}
        </span>
        <span className={`${s.suitCorner} leading-none`}>
          {suit.symbol}
        </span>
      </div>

      {/* Center area */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isFace ? (
          /* Face card: emoji + character name */
          <div className="flex flex-col items-center gap-0.5">
            <span className={`${s.centerEmoji} leading-none drop-shadow-sm`}>
              {card.emoji}
            </span>
            <span
              className={`${s.characterName} font-bold ${suit.color} tracking-wide uppercase leading-none`}
            >
              {card.character}
            </span>
          </div>
        ) : (
          /* Number card: large suit symbol */
          <span className={`${s.centerSymbol} leading-none drop-shadow-sm`}>
            {suit.symbol}
          </span>
        )}
      </div>

      {/* Subtle inner vignette for depth */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          boxShadow: "inset 0 0 12px rgba(0,0,0,0.03)",
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
