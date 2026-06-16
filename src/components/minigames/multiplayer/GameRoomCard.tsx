"use client";

import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GameRoomCardProps {
  room: {
    id: string;
    host_id: string;
    game_type: string; // 'sisters_sketch' | 'wavelength' | 'card_rooms'
    status: string; // 'waiting' | 'playing' | 'finished'
    members: Array<{
      user_id: string;
      first_name: string;
      username: string;
      avatar_url: string;
      joined_at: string;
    }>;
    max_players: number;
    created_at: string;
    host_profile?: {
      first_name: string;
      username: string;
      avatar_url: string;
    };
  };
  currentUserId: string;
  onJoin: (roomId: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const GAME_META: Record<string, { emoji: string; label: string }> = {
  sisters_sketch: { emoji: "🎨", label: "Sisters Sketch" },
  wavelength: { emoji: "📡", label: "Wavelength" },
  card_rooms: { emoji: "🃏", label: "Egyptian Rat Screw" },
  crazy_8s: { emoji: "🎴", label: "Christian Crazy 8s" },
  spyfall: { emoji: "🕵️", label: "Bible Spyfall" },
};

const getAvatarBg = (id: string) => {
  const colors = [
    "bg-pink-100 text-pink-700 border-pink-200/50",
    "bg-emerald-100 text-emerald-800 border-emerald-200/50",
    "bg-purple-100 text-purple-800 border-purple-200/50",
    "bg-amber-100 text-amber-800 border-amber-200/50",
    "bg-rose-100 text-rose-800 border-rose-200/50",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash += id.charCodeAt(i);
  }
  return colors[hash % colors.length];
};

/* ---- Game-specific theming ---- */

interface GameTheme {
  accentGradient: string;   // top accent bar
  bgTint: string;           // subtle card background
  ringColor: string;        // avatar ring
  buttonGradient: string;   // join button
  buttonGlow: string;       // hover glow shadow
  iconBg: string;           // emoji icon background
  pillBorder: string;       // count pill border
}

const GAME_THEMES: Record<string, GameTheme> = {
  sisters_sketch: {
    accentGradient: "linear-gradient(135deg, #fb7185, #f43f5e, #e11d48)",
    bgTint: "linear-gradient(180deg, rgba(251,113,133,0.06) 0%, rgba(255,255,255,0) 60%)",
    ringColor: "ring-rose-300",
    buttonGradient: "linear-gradient(135deg, #f43f5e, #e11d48)",
    buttonGlow: "0 0 20px rgba(244,63,94,0.35)",
    iconBg: "bg-rose-100/80",
    pillBorder: "border-rose-200/60",
  },
  wavelength: {
    accentGradient: "linear-gradient(135deg, #60a5fa, #3b82f6, #2563eb)",
    bgTint: "linear-gradient(180deg, rgba(96,165,250,0.06) 0%, rgba(255,255,255,0) 60%)",
    ringColor: "ring-blue-300",
    buttonGradient: "linear-gradient(135deg, #3b82f6, #2563eb)",
    buttonGlow: "0 0 20px rgba(59,130,246,0.35)",
    iconBg: "bg-blue-100/80",
    pillBorder: "border-blue-200/60",
  },
  card_rooms: {
    accentGradient: "linear-gradient(135deg, #34d399, #10b981, #059669)",
    bgTint: "linear-gradient(180deg, rgba(52,211,153,0.06) 0%, rgba(255,255,255,0) 60%)",
    ringColor: "ring-emerald-300",
    buttonGradient: "linear-gradient(135deg, #10b981, #059669)",
    buttonGlow: "0 0 20px rgba(16,185,129,0.35)",
    iconBg: "bg-emerald-100/80",
    pillBorder: "border-emerald-200/60",
  },
  crazy_8s: {
    accentGradient: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)",
    bgTint: "linear-gradient(180deg, rgba(251,191,36,0.06) 0%, rgba(255,255,255,0) 60%)",
    ringColor: "ring-amber-300",
    buttonGradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    buttonGlow: "0 0 20px rgba(245,158,11,0.35)",
    iconBg: "bg-amber-100/80",
    pillBorder: "border-amber-200/60",
  },
  spyfall: {
    accentGradient: "linear-gradient(135deg, #a78bfa, #8b5cf6, #7c3aed)",
    bgTint: "linear-gradient(180deg, rgba(167,139,250,0.06) 0%, rgba(255,255,255,0) 60%)",
    ringColor: "ring-purple-300",
    buttonGradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    buttonGlow: "0 0 20px rgba(139,92,246,0.35)",
    iconBg: "bg-purple-100/80",
    pillBorder: "border-purple-200/60",
  },
};

const DEFAULT_THEME: GameTheme = {
  accentGradient: "linear-gradient(135deg, #a8a29e, #78716c, #57534e)",
  bgTint: "linear-gradient(180deg, rgba(168,162,158,0.06) 0%, rgba(255,255,255,0) 60%)",
  ringColor: "ring-stone-300",
  buttonGradient: "linear-gradient(135deg, #78716c, #57534e)",
  buttonGlow: "0 0 20px rgba(120,113,108,0.35)",
  iconBg: "bg-stone-100/80",
  pillBorder: "border-stone-200/60",
};

/* ---- Status indicator config ---- */

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; pulse?: boolean }> = {
  waiting: {
    label: "Waiting",
    dot: "bg-emerald-400",
    bg: "bg-emerald-50/80 border-emerald-200/60",
    text: "text-emerald-700",
    pulse: true,
  },
  playing: {
    label: "Playing",
    dot: "bg-amber-400",
    bg: "bg-amber-50/80 border-amber-200/60",
    text: "text-amber-700",
  },
  finished: {
    label: "Finished",
    dot: "bg-stone-400",
    bg: "bg-stone-50/80 border-stone-200/60",
    text: "text-stone-500",
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function GameRoomCard({
  room,
  currentUserId,
  onJoin,
}: GameRoomCardProps) {
  const game = GAME_META[room.game_type] ?? { emoji: "🎮", label: room.game_type };
  const theme = GAME_THEMES[room.game_type] ?? DEFAULT_THEME;
  const status = STATUS_CONFIG[room.status] ?? STATUS_CONFIG.finished;

  const isMember = room.members.some((m) => m.user_id === currentUserId);
  const isFull = room.members.length >= room.max_players;
  const isWaiting = room.status === "waiting";

  const hostName =
    room.host_profile?.first_name ??
    room.members.find((m) => m.user_id === room.host_id)?.first_name ??
    "Someone";

  const createdAgo = formatDistanceToNow(new Date(room.created_at), {
    addSuffix: true,
  });

  /* Visible avatars (max 5) */
  const visibleMembers = room.members.slice(0, 5);
  const overflow = room.members.length - 5;

  /* Button state */
  let buttonLabel = "Join Room";
  let buttonIcon = "→";
  let disabled = false;

  if (isMember) {
    buttonLabel = "Enter Room";
    buttonIcon = "↗";
  } else if (isFull) {
    buttonLabel = "Room Full";
    buttonIcon = "✕";
    disabled = true;
  } else if (room.status === "playing") {
    buttonLabel = "Watch & Wait";
    buttonIcon = "👀";
  } else if (room.status === "finished") {
    buttonLabel = "Finished";
    buttonIcon = "✓";
    disabled = true;
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="relative rounded-3xl overflow-hidden border border-white/40"
      style={{
        background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow:
          "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
      }}
    >
      {/* ---- Accent gradient bar ---- */}
      <div
        className="h-1.5 w-full"
        style={{ background: theme.accentGradient }}
      />

      {/* ---- Themed tint overlay ---- */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: theme.bgTint }}
      />

      {/* ---- Card body ---- */}
      <div className="relative p-4 pt-3.5">
        {/* ---- Top row: Game info + Status ---- */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {/* Emoji badge */}
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-2xl ${theme.iconBg}`}
              style={{
                boxShadow: "inset 0 1px 2px rgba(255,255,255,0.6), 0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <span className="text-xl leading-none">{game.emoji}</span>
            </div>

            <div className="flex flex-col">
              <span className="font-serif text-[15px] font-bold text-warm-cocoa leading-tight">
                {game.label}
              </span>
              <span className="text-[10px] text-warm-grey/50 mt-0.5">
                {createdAgo}
              </span>
            </div>
          </div>

          {/* Status pill */}
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold border ${status.bg} ${status.text}`}
          >
            <span className="relative flex h-2 w-2">
              {status.pulse && (
                <span
                  className={`absolute inset-0 rounded-full ${status.dot} animate-ping opacity-60`}
                />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${status.dot}`} />
            </span>
            {status.label}
          </div>
        </div>

        {/* ---- Host info ---- */}
        <div className="mb-3.5 flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-warm-grey/40 font-medium">
              Hosted by
            </span>
            <span className="text-sm font-semibold text-warm-cocoa/90 font-serif">
              {hostName}
            </span>
          </div>
          <span
            className={`ml-auto text-[10px] font-semibold text-warm-grey/60 border ${theme.pillBorder} bg-white/60 rounded-full px-2.5 py-0.5`}
          >
            {room.members.length}/{room.max_players} 🧑‍🤝‍🧑
          </span>
        </div>

        {/* ---- Avatar stack ---- */}
        <div className="flex items-center mb-4">
          <div className="flex -space-x-2.5">
            {visibleMembers.map((member) => (
              <div
                key={member.user_id}
                className={`relative h-9 w-9 rounded-full ring-2 ${theme.ringColor} ring-offset-1 ring-offset-white shrink-0`}
                title={member.first_name || member.username}
                style={{
                  boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                }}
              >
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt={member.first_name || member.username}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <span
                    className={`flex h-full w-full items-center justify-center rounded-full text-xs font-bold border ${getAvatarBg(member.user_id)}`}
                  >
                    {(member.first_name?.[0] ?? member.username?.[0] ?? "?").toUpperCase()}
                  </span>
                )}
              </div>
            ))}

            {overflow > 0 && (
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full ring-2 ${theme.ringColor} ring-offset-1 ring-offset-white bg-warm-paper text-[10px] font-bold text-warm-grey/70 shrink-0`}
                style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}
              >
                +{overflow}
              </span>
            )}
          </div>
        </div>

        {/* ---- Join/Enter button ---- */}
        <motion.button
          whileTap={!disabled ? { scale: 0.96 } : undefined}
          whileHover={!disabled ? { boxShadow: theme.buttonGlow } : undefined}
          onClick={() => onJoin(room.id)}
          disabled={disabled}
          className={`
            relative w-full rounded-2xl py-2.5 text-[13px] font-bold text-white
            transition-all duration-200
            flex items-center justify-center gap-2
            ${disabled ? "opacity-35 cursor-not-allowed saturate-0" : "cursor-pointer"}
          `}
          style={{
            background: isMember && !disabled
              ? "linear-gradient(135deg, #A3BE8C, #7DA668)"
              : disabled
                ? "#a8a29e"
                : theme.buttonGradient,
            boxShadow: disabled
              ? "none"
              : "0 2px 8px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.2)",
          }}
        >
          <span>{buttonLabel}</span>
          <span className="text-sm opacity-80">{buttonIcon}</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
