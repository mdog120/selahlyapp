"use client";

import { formatDistanceToNow } from "date-fns";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface GameRoomCardProps {
  room: {
    id: string;
    host_id: string;
    game_type: string; // 'sisters_sketch' | 'table_tennis' | 'card_rooms'
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
  table_tennis: { emoji: "🏓", label: "Selah Table Tennis" },
  card_rooms: { emoji: "🃏", label: "Cozy Card Rooms" },
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

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function GameRoomCard({
  room,
  currentUserId,
  onJoin,
}: GameRoomCardProps) {
  const game = GAME_META[room.game_type] ?? { emoji: "🎮", label: room.game_type };

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
  let buttonClass =
    "bg-warm-cocoa text-white rounded-xl py-2 text-xs font-bold w-full transition-all active:scale-95";
  let disabled = false;

  if (isMember) {
    buttonLabel = "Enter Room";
    buttonClass =
      "bg-sage-green text-white rounded-xl py-2 text-xs font-bold w-full transition-all active:scale-95";
  } else if (isFull) {
    buttonLabel = "Room Full";
    disabled = true;
  } else if (!isWaiting) {
    buttonLabel = room.status === "playing" ? "In Progress" : "Finished";
    disabled = true;
  }

  if (disabled) {
    buttonClass += " opacity-40 cursor-not-allowed";
  }

  return (
    <div className="rounded-3xl bg-white/60 border border-stone-200/40 p-4 hover:shadow-md transition-all">
      {/* ---- Top row ---- */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">{game.emoji}</span>
          <span className="font-serif text-sm font-semibold text-warm-cocoa">
            {game.label}
          </span>
        </div>

        <span className="text-[11px] text-warm-grey/60 bg-warm-paper/60 rounded-full px-2.5 py-0.5 font-medium">
          {room.members.length}/{room.max_players} 🧑‍🤝‍🧑
        </span>
      </div>

      {/* ---- Middle ---- */}
      <div className="mb-3">
        <p className="text-[10px] text-warm-grey/50 mb-0.5">Hosted by</p>
        <p className="text-xs font-medium text-warm-cocoa">{hostName}</p>
      </div>

      {/* Avatar stack */}
      <div className="flex items-center mb-3">
        <div className="flex -space-x-2">
          {visibleMembers.map((member) => (
            <div
              key={member.user_id}
              className="relative h-7 w-7 rounded-full border-2 border-white shrink-0"
              title={member.first_name || member.username}
            >
              {member.avatar_url ? (
                <img
                  src={member.avatar_url}
                  alt={member.first_name || member.username}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span
                  className={`flex h-full w-full items-center justify-center rounded-full text-[10px] font-bold border ${getAvatarBg(member.user_id)}`}
                >
                  {(member.first_name?.[0] ?? member.username?.[0] ?? "?").toUpperCase()}
                </span>
              )}
            </div>
          ))}

          {overflow > 0 && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-warm-paper text-[9px] font-bold text-warm-grey/70 shrink-0">
              +{overflow}
            </span>
          )}
        </div>

        <span className="ml-auto text-[9px] text-warm-grey/40">
          {createdAgo}
        </span>
      </div>

      {/* ---- Bottom ---- */}
      <button
        onClick={() => onJoin(room.id)}
        disabled={disabled}
        className={buttonClass}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
