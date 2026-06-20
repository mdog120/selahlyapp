"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, Loader2, Check } from "lucide-react";

interface OnlineSister {
  user_id: string;
  first_name: string;
  username: string;
  avatar_url: string;
  location: string;
  online_at: string;
}

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (gameType: string, invitedUserIds: string[]) => void;
  onlineSisters: OnlineSister[];
  isCreating: boolean;
}

const GAMES = [
  {
    emoji: "🎨",
    label: "Sisters Sketch",
    game_type: "sisters_sketch",
    description: "Draw faith words and guess together",
  },
  {
    emoji: "📡",
    label: "Wavelength",
    game_type: "wavelength",
    description: "Guess where Bible concepts fall on the spectrum",
  },
  {
    emoji: "🃏",
    label: "Egyptian Rat Screw",
    game_type: "card_rooms",
    description: "Bible character card slap game",
  },
  {
    emoji: "🎴",
    label: "Christian Crazy 8s",
    game_type: "crazy_8s",
    description: "Match virtues & Bible characters",
  },
  {
    emoji: "🕵️",
    label: "Bible Spyfall",
    game_type: "spyfall",
    description: "Find the spy among Bible characters",
  },
  {
    emoji: "🎲",
    label: "Bible Monopoly Lite",
    game_type: "bible_monopoly",
    description: "Buy Bible lands and collect rent",
  },
  {
    emoji: "🌸",
    label: "Bible Hangman",
    game_type: "hangman",
    description: "Guess Bible terms together to save the blooming flower",
  },
];

const MAX_INVITES = 4;

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

export function CreateRoomModal({
  isOpen,
  onClose,
  onCreateRoom,
  onlineSisters,
  isCreating,
}: CreateRoomModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<string[]>([]);

  const handleClose = () => {
    if (isCreating) return;
    setStep(1);
    setSelectedGame(null);
    setInvitedIds([]);
    onClose();
  };

  const handleToggleInvite = (userId: string) => {
    setInvitedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : prev.length < MAX_INVITES
          ? [...prev, userId]
          : prev
    );
  };

  const handleCreate = () => {
    if (!selectedGame || isCreating) return;
    onCreateRoom(selectedGame, invitedIds);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-warm-cocoa/40 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleClose}
        >
          <motion.div
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-150 relative"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              disabled={isCreating}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-warm-grey/5 transition-colors text-warm-grey/40 hover:text-warm-grey/70 disabled:opacity-40"
            >
              <X size={18} />
            </button>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Step 1 — Pick a Game */}
                  <h2 className="font-serif text-lg text-warm-cocoa mb-4">
                    Choose a Game
                  </h2>

                  <div className="grid grid-cols-1 gap-3">
                    {GAMES.map((game) => {
                      const isSelected = selectedGame === game.game_type;
                      return (
                        <button
                          key={game.game_type}
                          onClick={() => setSelectedGame(game.game_type)}
                          className={`
                            rounded-2xl p-4 border text-left transition-all cursor-pointer
                            ${
                              isSelected
                                ? "ring-2 ring-amber-400 bg-amber-50/40 border-amber-200/60"
                                : "border-warm-grey/10 bg-white/50 hover:bg-warm-grey/5 hover:border-warm-grey/15"
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl leading-none mt-0.5">
                              {game.emoji}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-warm-cocoa">
                                {game.label}
                              </p>
                              <p className="text-[11px] text-warm-grey/50 mt-0.5">
                                {game.description}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="ml-auto shrink-0">
                                <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                                  <Check size={12} className="text-white" strokeWidth={3} />
                                </div>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedGame}
                    className="mt-5 w-full py-2.5 rounded-xl bg-warm-cocoa text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    Next
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Step 2 — Invite Sisters */}
                  <h2 className="font-serif text-lg text-warm-cocoa">
                    Invite Sisters
                  </h2>
                  <p className="text-[11px] text-warm-grey/50 mb-4">
                    (Optional — up to {MAX_INVITES})
                  </p>

                  {onlineSisters.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-3xl mb-3">👭</p>
                      <p className="text-xs text-warm-grey/50 max-w-[260px] mx-auto leading-relaxed">
                        Add some friends first to invite them to play together! 🌸
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[240px] overflow-y-auto -mx-1 px-1 space-y-1.5">
                      {onlineSisters.map((sister) => {
                        const isInvited = invitedIds.includes(sister.user_id);
                        const isDisabled =
                          !isInvited && invitedIds.length >= MAX_INVITES;

                        return (
                          <button
                            key={sister.user_id}
                            onClick={() =>
                              !isDisabled && handleToggleInvite(sister.user_id)
                            }
                            disabled={isDisabled}
                            className={`
                              w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left
                              ${isInvited ? "bg-amber-50/50" : "hover:bg-warm-grey/5"}
                              ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                            `}
                          >
                            {/* Avatar */}
                            {sister.avatar_url ? (
                              <img
                                src={sister.avatar_url}
                                alt={sister.first_name}
                                className="w-9 h-9 rounded-full border border-warm-grey/10 object-cover shrink-0"
                              />
                            ) : (
                              <div
                                className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarBg(sister.user_id)}`}
                              >
                                {sister.first_name?.charAt(0)?.toUpperCase() ||
                                  "?"}
                              </div>
                            )}

                            {/* Name & username */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-semibold text-warm-cocoa truncate">
                                  {sister.first_name}
                                </p>
                                <span 
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${sister.online_at ? "bg-emerald-400 animate-pulse" : "bg-warm-grey/30"}`} 
                                  title={sister.online_at ? "Online" : "Offline"}
                                />
                              </div>
                              <p className="text-[10px] text-warm-grey/40 truncate">
                                @{sister.username}
                              </p>
                            </div>

                            {/* Checkbox */}
                            <div
                              className={`
                                w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                                ${
                                  isInvited
                                    ? "bg-amber-400 border-amber-400"
                                    : "border-warm-grey/20 bg-white"
                                }
                              `}
                            >
                              {isInvited && (
                                <Check
                                  size={12}
                                  className="text-white"
                                  strokeWidth={3}
                                />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Bottom actions */}
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <button
                      onClick={() => setStep(1)}
                      disabled={isCreating}
                      className="flex items-center gap-1 text-xs text-warm-grey/50 hover:text-warm-cocoa transition-colors disabled:opacity-40"
                    >
                      <ChevronLeft size={14} />
                      Back
                    </button>

                    <button
                      onClick={handleCreate}
                      disabled={isCreating}
                      className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-warm-cocoa text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Creating…
                        </>
                      ) : (
                        "Create Room ✨"
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
