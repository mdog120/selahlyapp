"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────

interface RoomMember {
    user_id: string;
    first_name: string;
    username: string;
    avatar_url: string;
    joined_at: string;
}

interface SketchSetupProps {
    members: RoomMember[];
    isHost: boolean;
    onStartGame: (config: {
        mode: "together" | "verses";
        teamA?: string[];
        teamB?: string[];
    }) => void;
}

// ─── Helpers ─────────────────────────────────────────────────

const getAvatarBg = (id: string) => {
    const colors = [
        "bg-pink-100 text-pink-700 border-pink-200/50",
        "bg-emerald-100 text-emerald-800 border-emerald-200/50",
        "bg-purple-100 text-purple-800 border-purple-200/50",
        "bg-amber-100 text-amber-800 border-amber-200/50",
        "bg-rose-100 text-rose-800 border-rose-200/50",
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
    return colors[hash % colors.length];
};

function shuffleArray<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

// ─── Sub-components ──────────────────────────────────────────

function PlayerChip({
    member,
    onClick,
    showCrown,
}: {
    member: RoomMember;
    onClick?: () => void;
    showCrown?: boolean;
}) {
    return (
        <motion.button
            layout
            onClick={onClick}
            whileTap={onClick ? { scale: 0.95 } : undefined}
            className={`flex items-center gap-2 rounded-xl border border-warm-grey/5 bg-white/60 px-3 py-2 text-left transition-all ${
                onClick
                    ? "cursor-pointer hover:bg-white/80 hover:shadow-sm active:scale-95"
                    : "cursor-default"
            }`}
        >
            {member.avatar_url ? (
                <img
                    src={member.avatar_url}
                    alt={member.first_name}
                    className="h-7 w-7 rounded-full border border-warm-grey/10 object-cover"
                />
            ) : (
                <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold ${getAvatarBg(
                        member.user_id
                    )}`}
                >
                    {member.first_name.charAt(0).toUpperCase()}
                </div>
            )}
            <span className="text-xs font-medium text-warm-cocoa truncate max-w-[80px]">
                {member.first_name}
            </span>
            {showCrown && (
                <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" />
            )}
        </motion.button>
    );
}

// ─── Step Transition Variants ────────────────────────────────

const stepVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 120 : -120,
        opacity: 0,
    }),
    center: {
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -120 : 120,
        opacity: 0,
    }),
};

// ─── Main Component ──────────────────────────────────────────

export function SketchSetup({ members, isHost, onStartGame }: SketchSetupProps) {
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [mode, setMode] = useState<"together" | "verses">("together");
    const [teamA, setTeamA] = useState<string[]>([]);
    const [teamB, setTeamB] = useState<string[]>([]);
    const [isManual, setIsManual] = useState(false);

    const canVerse = members.length >= 4;

    // ── Auto-assign teams ────────────────────────────────────
    const autoAssign = useCallback(() => {
        const shuffled = shuffleArray(members.map((m) => m.user_id));
        const mid = Math.ceil(shuffled.length / 2);
        setTeamA(shuffled.slice(0, mid));
        setTeamB(shuffled.slice(mid));
        setIsManual(false);
    }, [members]);

    // ── Manual toggle ────────────────────────────────────────
    const startManual = useCallback(() => {
        setTeamA([]);
        setTeamB([]);
        setIsManual(true);
    }, []);

    // ── Unassigned members (manual mode) ─────────────────────
    const unassigned = useMemo(
        () =>
            members.filter(
                (m) => !teamA.includes(m.user_id) && !teamB.includes(m.user_id)
            ),
        [members, teamA, teamB]
    );

    // ── Move player between teams ────────────────────────────
    const togglePlayer = useCallback(
        (userId: string) => {
            if (teamA.includes(userId)) {
                setTeamA((prev) => prev.filter((id) => id !== userId));
                setTeamB((prev) => [...prev, userId]);
            } else if (teamB.includes(userId)) {
                setTeamB((prev) => prev.filter((id) => id !== userId));
            } else {
                // Unassigned → add to team with fewer members
                if (teamA.length <= teamB.length) {
                    setTeamA((prev) => [...prev, userId]);
                } else {
                    setTeamB((prev) => [...prev, userId]);
                }
            }
        },
        [teamA, teamB]
    );

    const teamsValid = teamA.length >= 2 && teamB.length >= 2;

    const goToStep2 = () => {
        setDirection(1);
        setStep(2);
        autoAssign();
    };

    const goBack = () => {
        setDirection(-1);
        setStep(1);
    };

    const handleStart = () => {
        if (mode === "together") {
            onStartGame({ mode: "together" });
        } else {
            onStartGame({ mode: "verses", teamA, teamB });
        }
    };

    const getMember = (userId: string) =>
        members.find((m) => m.user_id === userId);

    // ── Non-host waiting screen ──────────────────────────────
    if (!isHost) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 px-6"
            >
                <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    className="text-4xl mb-4"
                >
                    🎨
                </motion.div>
                <p className="font-serif text-lg text-warm-cocoa font-bold mb-2">
                    Hang tight!
                </p>
                <p className="text-xs text-warm-grey/50 flex items-center gap-1">
                    Host is choosing game settings
                    <motion.span
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        ...
                    </motion.span>
                    🎨
                </p>
            </motion.div>
        );
    }

    // ── Host setup flow ──────────────────────────────────────
    return (
        <div className="w-full max-w-md mx-auto px-1">
            <AnimatePresence mode="wait" custom={direction}>
                {step === 1 && (
                    <motion.div
                        key="step-1"
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                        className="flex flex-col gap-5"
                    >
                        {/* Header */}
                        <div className="text-center pt-2">
                            <h2 className="font-serif text-xl text-warm-cocoa font-bold">
                                🎨 Sisters Sketch
                            </h2>
                            <p className="text-xs text-warm-grey/50 mt-1">
                                Choose how to play
                            </p>
                        </div>

                        {/* Mode Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Together */}
                            <button
                                onClick={() => setMode("together")}
                                className={`relative flex flex-col items-center gap-2 rounded-3xl border p-4 text-center transition-all active:scale-95 ${
                                    mode === "together"
                                        ? "ring-2 ring-amber-400 bg-amber-50/30 border-amber-200/40"
                                        : "bg-white/60 border-warm-grey/5 hover:bg-white/80"
                                }`}
                            >
                                <span className="text-2xl">🤝</span>
                                <span className="font-serif text-sm font-bold text-warm-cocoa">
                                    Together
                                </span>
                                <span className="text-[10px] leading-snug text-warm-grey/50">
                                    Everyone works as one team to guess!
                                </span>
                            </button>

                            {/* Verses */}
                            <div className="relative">
                                <button
                                    onClick={() => canVerse && setMode("verses")}
                                    disabled={!canVerse}
                                    className={`relative flex w-full flex-col items-center gap-2 rounded-3xl border p-4 text-center transition-all ${
                                        !canVerse
                                            ? "opacity-40 cursor-not-allowed"
                                            : mode === "verses"
                                            ? "ring-2 ring-amber-400 bg-amber-50/30 border-amber-200/40 active:scale-95"
                                            : "bg-white/60 border-warm-grey/5 hover:bg-white/80 active:scale-95"
                                    }`}
                                >
                                    <span className="text-2xl">⚔️</span>
                                    <span className="font-serif text-sm font-bold text-warm-cocoa">
                                        Verses
                                    </span>
                                    <span className="text-[10px] leading-snug text-warm-grey/50">
                                        Two teams compete head-to-head!
                                    </span>
                                </button>
                                {!canVerse && (
                                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-warm-cocoa/80 px-2 py-0.5 text-[9px] text-white">
                                        Need 4+ players
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Action */}
                        <div className="pt-2">
                            {mode === "together" ? (
                                <button
                                    onClick={handleStart}
                                    className="w-full rounded-xl bg-warm-cocoa py-3 text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
                                >
                                    Start Game 🎨
                                </button>
                            ) : (
                                <button
                                    onClick={goToStep2}
                                    className="w-full rounded-xl bg-warm-cocoa py-3 text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
                                >
                                    Next →
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step-2"
                        custom={direction}
                        variants={stepVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                        className="flex flex-col gap-4"
                    >
                        {/* Back + Header */}
                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={goBack}
                                className="rounded-full bg-white/60 border border-warm-grey/5 px-3 py-1.5 text-[10px] font-bold text-warm-grey/60 transition-all hover:bg-white/80 active:scale-95"
                            >
                                ← Back
                            </button>
                            <h2 className="font-serif text-lg text-warm-cocoa font-bold">
                                Pick Your Teams
                            </h2>
                        </div>

                        {/* Assignment Options */}
                        <div className="flex gap-2">
                            <button
                                onClick={autoAssign}
                                className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-all active:scale-95 ${
                                    !isManual
                                        ? "bg-amber-50/50 border-amber-200/40 text-warm-cocoa"
                                        : "bg-white/60 border-warm-grey/5 text-warm-grey/60 hover:bg-white/80"
                                }`}
                            >
                                Auto-assign 🎲
                            </button>
                            <button
                                onClick={startManual}
                                className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-all active:scale-95 ${
                                    isManual
                                        ? "bg-amber-50/50 border-amber-200/40 text-warm-cocoa"
                                        : "bg-white/60 border-warm-grey/5 text-warm-grey/60 hover:bg-white/80"
                                }`}
                            >
                                Pick manually ✋
                            </button>
                        </div>

                        {/* Unassigned pool (manual mode) */}
                        {isManual && unassigned.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="rounded-2xl border border-warm-grey/5 bg-white/40 p-3"
                            >
                                <p className="text-[10px] font-bold text-warm-grey/40 uppercase tracking-wide mb-2">
                                    Tap to assign
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {unassigned.map((m) => (
                                        <PlayerChip
                                            key={m.user_id}
                                            member={m}
                                            onClick={() => togglePlayer(m.user_id)}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Team Columns */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Team A */}
                            <div className="rounded-2xl border border-pink-100/60 bg-pink-50/20 p-3">
                                <p className="text-xs font-bold text-warm-cocoa mb-2 text-center">
                                    Team A 🌸
                                </p>
                                <div className="flex flex-col gap-1.5 min-h-[60px]">
                                    <AnimatePresence mode="popLayout">
                                        {teamA.map((id) => {
                                            const member = getMember(id);
                                            if (!member) return null;
                                            return (
                                                <PlayerChip
                                                    key={id}
                                                    member={member}
                                                    onClick={
                                                        isManual
                                                            ? () => togglePlayer(id)
                                                            : undefined
                                                    }
                                                />
                                            );
                                        })}
                                    </AnimatePresence>
                                    {teamA.length === 0 && (
                                        <p className="text-[10px] text-warm-grey/30 text-center py-3">
                                            No players yet
                                        </p>
                                    )}
                                </div>
                                <p className="text-[9px] text-warm-grey/30 text-center mt-2">
                                    {teamA.length} player{teamA.length !== 1 ? "s" : ""}
                                </p>
                            </div>

                            {/* Team B */}
                            <div className="rounded-2xl border border-purple-100/60 bg-purple-50/20 p-3">
                                <p className="text-xs font-bold text-warm-cocoa mb-2 text-center">
                                    Team B 💜
                                </p>
                                <div className="flex flex-col gap-1.5 min-h-[60px]">
                                    <AnimatePresence mode="popLayout">
                                        {teamB.map((id) => {
                                            const member = getMember(id);
                                            if (!member) return null;
                                            return (
                                                <PlayerChip
                                                    key={id}
                                                    member={member}
                                                    onClick={
                                                        isManual
                                                            ? () => togglePlayer(id)
                                                            : undefined
                                                    }
                                                />
                                            );
                                        })}
                                    </AnimatePresence>
                                    {teamB.length === 0 && (
                                        <p className="text-[10px] text-warm-grey/30 text-center py-3">
                                            No players yet
                                        </p>
                                    )}
                                </div>
                                <p className="text-[9px] text-warm-grey/30 text-center mt-2">
                                    {teamB.length} player{teamB.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>

                        {/* Start Button */}
                        <button
                            onClick={handleStart}
                            disabled={!teamsValid}
                            className={`w-full rounded-xl py-3 text-xs font-bold transition-all ${
                                teamsValid
                                    ? "bg-warm-cocoa text-white hover:opacity-90 active:scale-95"
                                    : "bg-warm-grey/10 text-warm-grey/30 cursor-not-allowed"
                            }`}
                        >
                            {teamsValid
                                ? "Start Game 🎨"
                                : "Each team needs at least 2 players"}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
