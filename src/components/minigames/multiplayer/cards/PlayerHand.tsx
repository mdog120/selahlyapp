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

/* ── Mini card-back shape ─────────────────────────────── */
function MiniCardBack({
  rotation,
  offsetX,
  delay,
}: {
  rotation: number;
  offsetX: number;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className="absolute"
      style={{
        width: 18,
        height: 26,
        borderRadius: 3,
        background:
          "linear-gradient(135deg, #7c5e3c 0%, #5a3f28 50%, #7c5e3c 100%)",
        border: "1px solid rgba(92,62,36,0.6)",
        boxShadow:
          "inset 0 0 4px rgba(255,255,255,0.12), 0 1px 3px rgba(0,0,0,0.18)",
        transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
        transformOrigin: "bottom center",
      }}
    >
      {/* Card-back pattern – small diamond ornament */}
      <div
        className="absolute inset-[3px] rounded-[2px] opacity-30"
        style={{
          border: "0.5px solid rgba(255,215,140,0.5)",
          background:
            "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,215,140,0.08) 2px, rgba(255,215,140,0.08) 4px)",
        }}
      />
    </motion.div>
  );
}

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
  const cardCountColor = () => {
    if (cardCount === 0) return "bg-stone-200 text-stone-500";
    if (cardCount < 5) return "bg-rose-100 text-rose-700 ring-1 ring-rose-200/60";
    if (cardCount <= 15)
      return "bg-amber-100 text-amber-800 ring-1 ring-amber-200/60";
    return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/60";
  };

  const isHorizontal = position === "left" || position === "right";

  /* How many mini card-backs to show (max 3) */
  const visibleCards = Math.min(cardCount, 3);
  const cardFanData = [
    { rotation: -12, offsetX: -6, delay: 0.1 },
    { rotation: 0, offsetX: 0, delay: 0.18 },
    { rotation: 12, offsetX: 6, delay: 0.26 },
  ].slice(3 - visibleCards); // show from centre outward

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{
        opacity: isEliminated ? 0.55 : 1,
        scale: 1,
        y: 0,
        filter: isEliminated
          ? "grayscale(0.7) saturate(0.5) sepia(0.25)"
          : "grayscale(0) saturate(1) sepia(0)",
      }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`
        relative rounded-2xl shadow-md border backdrop-blur-sm transition-colors
        ${
          isActive && !isEliminated
            ? "bg-amber-50/40 border-amber-300/60"
            : "bg-white/70 border-stone-200/50"
        }
        ${isCurrentUser && !isActive ? "border-warm-cocoa/30" : ""}
        ${isHorizontal ? "flex flex-col items-center p-3 gap-2" : "flex items-center p-3 gap-3"}
      `}
      style={{
        boxShadow: isActive && !isEliminated
          ? "0 0 14px rgba(217,161,60,0.25), 0 2px 8px rgba(0,0,0,0.08)"
          : "0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* ── Ambient active-turn glow ring ── */}
      {isActive && !isEliminated && (
        <motion.div
          className="absolute -inset-[2px] rounded-[18px] pointer-events-none"
          style={{
            border: "2px solid rgba(217,161,60,0.5)",
            boxShadow: "0 0 12px rgba(217,161,60,0.3)",
          }}
          animate={{
            boxShadow: [
              "0 0 8px rgba(217,161,60,0.2)",
              "0 0 18px rgba(217,161,60,0.45)",
              "0 0 8px rgba(217,161,60,0.2)",
            ],
            borderColor: [
              "rgba(217,161,60,0.4)",
              "rgba(217,161,60,0.7)",
              "rgba(217,161,60,0.4)",
            ],
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* ── Avatar with decorative ring ── */}
      <div className="relative flex-shrink-0">
        {/* Outer decorative ring */}
        <div
          className={`
            w-12 h-12 rounded-full flex items-center justify-center
            ${
              isActive && !isEliminated
                ? "bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-500"
                : isEliminated
                ? "bg-gradient-to-br from-stone-300 to-stone-400"
                : "bg-gradient-to-br from-stone-200 via-stone-300 to-stone-200"
            }
            shadow-sm
          `}
          style={{
            padding: 2,
          }}
        >
          {/* Inner ring / gap */}
          <div
            className="w-full h-full rounded-full flex items-center justify-center bg-white"
            style={{ padding: 1.5 }}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div
                className={`w-full h-full rounded-full flex items-center justify-center text-sm font-bold ${getAvatarBg(playerId)}`}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Online / active indicator dot */}
        {isActive && !isEliminated && (
          <motion.span
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"
            animate={{ scale: [1, 1.25, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            style={{ boxShadow: "0 0 6px rgba(16,185,129,0.5)" }}
          />
        )}

        {/* ── Eliminated "OUT" badge ── */}
        {isEliminated && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="absolute -top-1 -right-1.5 px-1.5 py-[1px] rounded-md text-[8px] font-black tracking-wider text-white uppercase"
            style={{
              background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
              boxShadow: "0 1px 4px rgba(220,38,38,0.4)",
              letterSpacing: "0.08em",
            }}
          >
            OUT
          </motion.div>
        )}
      </div>

      {/* ── Card fan + info column ── */}
      <div className={`min-w-0 flex-1 ${isHorizontal ? "text-center" : ""}`}>
        {/* Player name */}
        <p className="text-xs font-bold text-warm-cocoa truncate leading-snug tracking-tight">
          {name}
          {isCurrentUser && (
            <span className="ml-0.5 text-[10px] text-warm-grey/50 font-semibold italic">
              {" "}
              (You)
            </span>
          )}
        </p>

        {/* ── Mini card fan with count badge ── */}
        <div className={`mt-1.5 ${isHorizontal ? "flex justify-center" : ""}`}>
          <div className="relative flex items-end justify-center" style={{ height: 30, width: 52 }}>
            {/* Card backs */}
            {!isEliminated &&
              cardFanData.map((card, i) => (
                <MiniCardBack
                  key={i}
                  rotation={card.rotation}
                  offsetX={card.offsetX}
                  delay={card.delay}
                />
              ))}

            {/* Eliminated – empty slot look */}
            {isEliminated && (
              <div
                className="absolute rounded-[3px] opacity-30"
                style={{
                  width: 18,
                  height: 26,
                  border: "1.5px dashed rgba(120,113,108,0.4)",
                }}
              />
            )}

            {/* Card count badge — sits on top of the fan */}
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 350, damping: 15 }}
              className={`
                absolute -top-1.5 -right-1 z-10
                min-w-[18px] h-[18px] flex items-center justify-center
                text-[10px] font-extrabold rounded-full leading-none
                shadow-sm
                ${cardCountColor()}
              `}
            >
              {cardCount}
            </motion.span>
          </div>
        </div>

        {/* ── Turn indicator ── */}
        {isActive && !isEliminated && (
          <motion.div
            className="mt-1.5 flex items-center gap-1 justify-center"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500"
              style={{ boxShadow: "0 0 4px rgba(217,161,60,0.6)" }}
            />
            <span
              className="text-[10px] font-bold tracking-wide uppercase"
              style={{
                background: "linear-gradient(90deg, #92400e, #b45309)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {isCurrentUser ? "Your turn" : "Playing…"}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
