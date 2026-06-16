"use client";

import { motion, AnimatePresence } from "framer-motion";
import { PlayingCard } from "./PlayingCard";
import type { Card } from "./bibleCards";

interface CardPileProps {
  pile: Card[];
  lastSlapResult?: { valid: boolean; playerName: string; reason: string } | null;
}

// Deterministic-ish random from card id so rotations stay stable across re-renders
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return ((hash % 1000) / 1000) * 2 - 1; // -1 to 1
}

function getCardRotation(card: Card): number {
  return seededRandom(card.id) * 5; // -5 to 5 degrees
}

function getCardOffset(card: Card): { x: number; y: number } {
  const r1 = seededRandom(card.id + "x");
  const r2 = seededRandom(card.id + "y");
  return { x: r1 * 3, y: r2 * 2 }; // slight jitter
}

function getEntryRotation(card: Card): number {
  return seededRandom(card.id + "entry") * 10; // -10 to 10 degrees
}

export function CardPile({ pile, lastSlapResult }: CardPileProps) {
  const topCard = pile.length > 0 ? pile[pile.length - 1] : null;
  // Show up to 2 cards beneath the top
  const underCards = pile.length > 1
    ? pile.slice(Math.max(0, pile.length - 3), pile.length - 1)
    : [];

  return (
    <div className="relative flex flex-col items-center">
      {/* Card stack area */}
      <div className="relative w-28 h-36">
        {/* Empty state */}
        {pile.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-28 rounded-2xl border-2 border-dashed border-warm-grey/15 flex items-center justify-center">
              <span className="text-[9px] text-warm-grey/30 font-medium tracking-wide">
                Pile
              </span>
            </div>
          </div>
        )}

        {/* Under-cards (the 1-2 cards beneath top) */}
        {underCards.map((card) => {
          const rotation = getCardRotation(card);
          const offset = getCardOffset(card);
          return (
            <div
              key={card.id}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `rotate(${rotation}deg) translate(${offset.x}px, ${offset.y}px)`,
              }}
            >
              <PlayingCard card={card} faceUp />
            </div>
          );
        })}

        {/* Top card with entry animation */}
        <AnimatePresence mode="popLayout">
          {topCard && (
            <motion.div
              key={topCard.id}
              className="absolute inset-0 flex items-center justify-center"
              initial={{
                y: -100,
                opacity: 0,
                rotateZ: getEntryRotation(topCard),
              }}
              animate={{
                y: 0,
                opacity: 1,
                rotateZ: getCardRotation(topCard),
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
                mass: 0.8,
              }}
            >
              <PlayingCard card={topCard} faceUp animate />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card count badge */}
        {pile.length > 0 && (
          <div className="absolute -bottom-1 -right-1 z-10">
            <div className="text-[8px] font-bold bg-stone-100 text-warm-cocoa/70 rounded-full px-1.5 py-0.5 border border-stone-200/50 shadow-sm">
              {pile.length}
            </div>
          </div>
        )}
      </div>

      {/* Slap result overlay */}
      <AnimatePresence>
        {lastSlapResult && (
          <motion.div
            key={`slap-${lastSlapResult.reason}-${lastSlapResult.playerName}`}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
            }}
          >
            {lastSlapResult.valid ? (
              /* ── Valid slap: golden glow burst ── */
              <motion.div
                className="flex flex-col items-center gap-1"
                animate={{
                  scale: [1, 1.08, 1],
                }}
                transition={{
                  duration: 0.6,
                  repeat: 1,
                }}
              >
                {/* Glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-3xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(251,191,36,0.25) 0%, transparent 70%)",
                  }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.4, opacity: [0, 0.8, 0] }}
                  transition={{ duration: 0.8 }}
                />
                <div className="text-xs font-bold text-amber-800 bg-amber-100 rounded-full px-3 py-1 shadow-md border border-amber-200/60">
                  {lastSlapResult.reason} 🎯
                </div>
                <span className="text-[9px] text-amber-700/70 font-medium">
                  {lastSlapResult.playerName}
                </span>
              </motion.div>
            ) : (
              /* ── Invalid slap: red shake ── */
              <motion.div
                className="flex flex-col items-center gap-1"
                animate={{
                  x: [0, -4, 4, -3, 3, -1, 1, 0],
                }}
                transition={{
                  duration: 0.5,
                }}
              >
                <div className="text-xs font-bold text-rose-700 bg-rose-50 rounded-full px-3 py-1 shadow-md border border-rose-200/60">
                  Wrong slap! ❌
                </div>
                <span className="text-[9px] text-rose-600/70 font-medium">
                  {lastSlapResult.playerName}
                </span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
