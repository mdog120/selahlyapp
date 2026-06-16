"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface GameInvite {
  room_id: string;
  host_name: string;
  host_avatar_url: string;
  game_type: string; // 'sisters_sketch' | 'table_tennis' | 'card_rooms'
}

interface InviteToastProps {
  invite: GameInvite | null;
  onAccept: (roomId: string) => void;
  onDecline: () => void;
}

const GAME_NAME_MAP: Record<string, string> = {
  sisters_sketch: "🎨 Sisters Sketch",
  table_tennis: "🏓 Selah Table Tennis",
  card_rooms: "🃏 Egyptian Rat Screw",
  crazy_8s: "🎴 Christian Crazy 8s",
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

export function InviteToast({ invite, onAccept, onDecline }: InviteToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (invite) {
      timerRef.current = setTimeout(() => {
        onDecline();
      }, 15000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [invite, onDecline]);

  const gameName = invite
    ? GAME_NAME_MAP[invite.game_type] ?? invite.game_type
    : "";

  return (
    <AnimatePresence>
      {invite && (
        <motion.div
          key={invite.room_id}
          initial={{ y: -100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 22, stiffness: 300 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
        >
          {/* Ambient amber glow behind card */}
          <div className="absolute -inset-2 rounded-3xl bg-amber-300/20 blur-xl animate-pulse pointer-events-none" />

          <div className="relative bg-white rounded-2xl shadow-2xl border border-amber-200/50 p-4 min-w-[300px] max-w-sm">
            {/* Subtle inner glow border */}
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-amber-100/60 pointer-events-none" />

            <div className="flex items-center gap-3">
              {/* Host avatar */}
              <div className="flex-shrink-0">
                {invite.host_avatar_url ? (
                  <img
                    src={invite.host_avatar_url}
                    alt={invite.host_name}
                    className="w-10 h-10 rounded-full border-2 border-amber-200/50 object-cover"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm ${getAvatarBg(invite.room_id)}`}
                  >
                    {invite.host_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Invite message */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-warm-cocoa leading-snug">
                  <span className="font-extrabold">{invite.host_name}</span>{" "}
                  invited you to play {gameName}!
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => {
                  if (timerRef.current) {
                    clearTimeout(timerRef.current);
                    timerRef.current = null;
                  }
                  onAccept(invite.room_id);
                }}
                className="flex-1 bg-sage-green text-white rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 hover:brightness-110 cursor-pointer"
              >
                Accept ✨
              </button>
              <button
                onClick={() => {
                  if (timerRef.current) {
                    clearTimeout(timerRef.current);
                    timerRef.current = null;
                  }
                  onDecline();
                }}
                className="flex-1 bg-stone-100 text-warm-grey rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 hover:bg-stone-200 cursor-pointer"
              >
                Decline
              </button>
            </div>

            {/* Auto-dismiss progress bar */}
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 15, ease: "linear" }}
              className="absolute bottom-0 left-0 right-0 h-[2px] bg-amber-300/60 origin-left rounded-b-2xl"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
