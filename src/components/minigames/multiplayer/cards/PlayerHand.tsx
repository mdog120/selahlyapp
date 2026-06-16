"use client";

import { motion } from "framer-motion";

interface PlayerHandProps {
  playerId: string;
  name: string;
  avatarUrl: string;
  cardCount: number;
  isActive: boolean;
  isCurrentUser: boolean;
  isEliminated: boolean;
  position: "bottom" | "left" | "top" | "right";
}

const getAvatarBg = (id: string) => {
  const colors = [
    "bg-pink-100 text-pink-700",
    "bg-emerald-100 text-emerald-800",
    "bg-purple-100 text-purple-800",
    "bg-amber-100 text-amber-800",
    "bg-rose-100 text-rose-800",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
  return colors[hash % colors.length];
};

export function PlayerHand({
  playerId,
  name,
  avatarUrl,
  cardCount,
  isActive,
  isCurrentUser,
  isEliminated,
  position,
}: PlayerHandProps) {
  const cardCountBadge = () => {
    if (cardCount === 0) {
      return "bg-stone-100 text-stone-400";
    }
    if (cardCount < 5) {
      return "bg-rose-50 text-rose-700";
    }
    if (cardCount <= 15) {
      return "bg-amber-50 text-amber-700";
    }
    return "bg-emerald-50 text-emerald-700";
  };

  const isHorizontal = position === "left" || position === "right";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: isEliminated ? 0.4 : 1,
        scale: 1,
        filter: isEliminated ? "grayscale(1)" : "grayscale(0)",
      }}
      transition={{ duration: 0.3 }}
      className={`
        relative rounded-2xl p-2.5 shadow-sm border transition-all
        ${
          isActive && !isEliminated
            ? "ring-2 ring-amber-400 bg-amber-50/20 border-amber-200/40"
            : "bg-white/60 border-stone-200/40"
        }
        ${isCurrentUser && !isActive ? "border-warm-cocoa/30" : ""}
        ${isHorizontal ? "flex flex-col items-center gap-1.5" : "flex items-center gap-2"}
      `}
    >
      {/* Active pulse ring */}
      {isActive && !isEliminated && (
        <motion.div
          className="absolute inset-0 rounded-2xl ring-2 ring-amber-400/50"
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-8 h-8 rounded-full object-cover border border-stone-200/50"
          />
        ) : (
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border border-stone-200/50 ${getAvatarBg(playerId)}`}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Online dot when active */}
        {isActive && !isEliminated && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </div>

      {/* Info */}
      <div className={`min-w-0 flex-1 ${isHorizontal ? "text-center" : ""}`}>
        {/* Name */}
        <p className="text-[11px] font-bold text-warm-cocoa truncate leading-tight">
          {name}
          {isCurrentUser && (
            <span className="text-warm-grey/50 font-medium"> (You)</span>
          )}
        </p>

        {/* Card count badge */}
        <div className={`mt-0.5 ${isHorizontal ? "flex justify-center" : ""}`}>
          <span
            className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${cardCountBadge()}`}
          >
            {cardCount === 0 ? "Out" : `${cardCount} cards`}
          </span>
        </div>

        {/* Turn indicator */}
        {isActive && !isEliminated && (
          <motion.p
            className="text-[9px] text-amber-700 mt-0.5 leading-tight"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            🃏 {isCurrentUser ? "Your turn!" : "Playing..."}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
