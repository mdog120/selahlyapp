"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getRandomPrompt, type WavelengthPrompt } from "./wavelengthPrompts";
import { Trophy, RotateCcw, ArrowLeft, Send, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

// ─── Types ──────────────────────────────────────────────────

interface RoomMember {
    user_id: string;
    first_name: string;
    username: string;
    avatar_url: string;
    joined_at: string;
}

interface GameRoom {
    id: string;
    host_id: string;
    game_type: string;
    status: string;
    members: RoomMember[];
    max_players: number;
    created_at: string;
}

interface WavelengthProps {
    room: GameRoom;
    currentUserId: string;
    isHost: boolean;
    onGameEnd: () => void;
}

type Phase = "waiting_clue" | "guessing" | "reveal" | "scores" | "ended";

// ─── Helpers ────────────────────────────────────────────────

const getMemberName = (members: RoomMember[], userId: string) =>
    members.find((m) => m.user_id === userId)?.first_name || "Someone";

const PLAYER_COLORS = [
    { bg: "bg-pink-400", text: "text-pink-700", ring: "ring-pink-300" },
    { bg: "bg-emerald-400", text: "text-emerald-700", ring: "ring-emerald-300" },
    { bg: "bg-purple-400", text: "text-purple-700", ring: "ring-purple-300" },
    { bg: "bg-amber-400", text: "text-amber-700", ring: "ring-amber-300" },
    { bg: "bg-sky-400", text: "text-sky-700", ring: "ring-sky-300" },
];

function getPlayerColor(userId: string, members: RoomMember[]) {
    const idx = members.findIndex((m) => m.user_id === userId);
    return PLAYER_COLORS[idx % PLAYER_COLORS.length];
}

function getAvatarBg(id: string) {
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
}

function getScore(target: number, avgGuess: number): { points: number; label: string; emoji: string } {
    const diff = Math.abs(target - avgGuess);
    if (diff <= 5) return { points: 4, label: "Bullseye!", emoji: "🎯" };
    if (diff <= 12) return { points: 3, label: "So close!", emoji: "🔥" };
    if (diff <= 25) return { points: 2, label: "Warm!", emoji: "☀️" };
    return { points: 0, label: "Miss!", emoji: "❄️" };
}

const TOTAL_ROUNDS = 8;

// ─── Component ──────────────────────────────────────────────

export function Wavelength({ room, currentUserId, isHost, onGameEnd }: WavelengthProps) {
    const supabase = createClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // ─── ALL mutable game state in refs (host source of truth) ──
    const roundRef = useRef(1);
    const psychicIndexRef = useRef(0);
    const targetRef = useRef(50);
    const promptRef = useRef<WavelengthPrompt | null>(null);
    const clueRef = useRef("");
    const guessesRef = useRef<Record<string, number>>({});
    const scoresRef = useRef<Record<string, number>>({});
    const usedPromptsRef = useRef<string[]>([]);
    const phaseRef = useRef<Phase>("waiting_clue");
    const turnOrderRef = useRef<string[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // ─── Display state (for rendering) ──
    const [phase, setPhase] = useState<Phase>("waiting_clue");
    const [round, setRound] = useState(1);
    const [currentPrompt, setCurrentPrompt] = useState<WavelengthPrompt | null>(null);
    const [psychicId, setPsychicId] = useState("");
    const [clue, setClue] = useState("");
    const [target, setTarget] = useState<number | null>(null); // null until reveal
    const [myGuess, setMyGuess] = useState(50);
    const [allGuesses, setAllGuesses] = useState<Record<string, number>>({});
    const [scores, setScores] = useState<Record<string, number>>({});
    const [lastRoundResult, setLastRoundResult] = useState<{ points: number; label: string; emoji: string } | null>(null);
    const [winnerId, setWinnerId] = useState<string | null>(null);
    const [clueInput, setClueInput] = useState("");
    const [hasGuessed, setHasGuessed] = useState(false);
    const [guessCount, setGuessCount] = useState(0);
    const [timer, setTimer] = useState(0);
    const [turnOrder, setTurnOrder] = useState<string[]>([]);

    // ─── Broadcast helper ──
    const broadcast = useCallback((event: string, payload: any) => {
        channelRef.current?.send({ type: "broadcast", event, payload });
    }, []);

    // ═══════════════════════════════════════════════════════
    // HOST PROCESSING FUNCTIONS
    // ═══════════════════════════════════════════════════════

    function hostStartRound() {
        const order = turnOrderRef.current;
        const prompt = getRandomPrompt(usedPromptsRef.current);
        const newTarget = Math.floor(Math.random() * 81) + 10; // 10-90 to avoid extremes
        const psychicIdx = psychicIndexRef.current % order.length;
        const psychicPlayerId = order[psychicIdx];

        promptRef.current = prompt;
        targetRef.current = newTarget;
        clueRef.current = "";
        guessesRef.current = {};
        phaseRef.current = "waiting_clue";
        usedPromptsRef.current.push(prompt.id);

        const payload = {
            round: roundRef.current,
            prompt: { id: prompt.id, left: prompt.left, right: prompt.right },
            psychicId: psychicPlayerId,
            scores: scoresRef.current,
            target: newTarget, // only psychic should use this
        };

        broadcast("wl_round_start", payload);

        // Host display
        setPhase("waiting_clue");
        setRound(roundRef.current);
        setCurrentPrompt(prompt);
        setPsychicId(psychicPlayerId);
        setClue("");
        setTarget(psychicPlayerId === currentUserId ? newTarget : null);
        setMyGuess(50);
        setAllGuesses({});
        setHasGuessed(false);
        setGuessCount(0);
        setLastRoundResult(null);
        setScores({ ...scoresRef.current });

        // Start 30s clue timer
        startTimer(30, () => {
            // Auto-skip if no clue given
            processClueOnHost(psychicPlayerId, "🤷 (no clue)");
        });
    }

    function processClueOnHost(playerId: string, submittedClue: string) {
        if (phaseRef.current !== "waiting_clue") return;
        clueRef.current = submittedClue;
        phaseRef.current = "guessing";

        clearTimer();

        broadcast("wl_clue_given", { clue: submittedClue });

        // Host display
        setPhase("guessing");
        setClue(submittedClue);

        // Start 20s guess timer
        const order = turnOrderRef.current;
        const psychicPlayerId = order[psychicIndexRef.current % order.length];
        const totalGuessers = order.filter((id) => id !== psychicPlayerId).length;

        startTimer(20, () => {
            // Auto-submit for anyone who hasn't guessed
            processRevealOnHost();
        });
    }

    function processGuessOnHost(playerId: string, guess: number) {
        if (phaseRef.current !== "guessing") return;
        guessesRef.current[playerId] = guess;

        // Check if all non-psychic players have guessed
        const order = turnOrderRef.current;
        const psychicPlayerId = order[psychicIndexRef.current % order.length];
        const totalGuessers = order.filter((id) => id !== psychicPlayerId).length;
        const guessedCount = Object.keys(guessesRef.current).length;

        // Broadcast guess count update
        broadcast("wl_guess_count", { count: guessedCount, total: totalGuessers });
        setGuessCount(guessedCount);

        if (guessedCount >= totalGuessers) {
            clearTimer();
            // Small delay for dramatic effect
            setTimeout(() => processRevealOnHost(), 500);
        }
    }

    function processRevealOnHost() {
        if (phaseRef.current !== "guessing") return;
        clearTimer();
        phaseRef.current = "reveal";

        const guesses = guessesRef.current;
        const targetVal = targetRef.current;
        const values = Object.values(guesses);
        const avgGuess = values.length > 0
            ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
            : 50;

        const result = getScore(targetVal, avgGuess);

        // Add points to ALL players
        const order = turnOrderRef.current;
        order.forEach((id) => {
            scoresRef.current[id] = (scoresRef.current[id] || 0) + result.points;
        });

        const payload = {
            target: targetVal,
            guesses,
            avgGuess,
            roundScore: result,
            scores: { ...scoresRef.current },
            action: `${result.emoji} ${result.label} (${result.points} pts) — Target was at ${targetVal}`,
        };

        broadcast("wl_reveal", payload);

        // Host display
        setPhase("reveal");
        setTarget(targetVal);
        setAllGuesses({ ...guesses });
        setLastRoundResult(result);
        setScores({ ...scoresRef.current });
    }

    function hostNextRound() {
        roundRef.current += 1;
        psychicIndexRef.current += 1;

        if (roundRef.current > TOTAL_ROUNDS) {
            // Game over
            const finalScores = { ...scoresRef.current };
            const maxScore = Math.max(...Object.values(finalScores));
            const winner = Object.keys(finalScores).find((id) => finalScores[id] === maxScore) || "";

            phaseRef.current = "ended";
            broadcast("wl_game_over", { scores: finalScores, winnerId: winner });

            setPhase("ended");
            setWinnerId(winner);
            setScores(finalScores);
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else {
            hostStartRound();
        }
    }

    // ─── Timer helpers ──
    function startTimer(seconds: number, onExpire: () => void) {
        clearTimer();
        setTimer(seconds);
        let remaining = seconds;
        timerRef.current = setInterval(() => {
            remaining -= 1;
            setTimer(remaining);
            if (remaining <= 0) {
                clearTimer();
                onExpire();
            }
        }, 1000);
    }

    function clearTimer() {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setTimer(0);
    }

    // Cleanup timer on unmount
    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    // ═══════════════════════════════════════════════════════
    // SINGLE CHANNEL SETUP — ALL listeners registered ONCE
    // ═══════════════════════════════════════════════════════
    useEffect(() => {
        const channel = supabase.channel(`wavelength_game:${room.id}`);

        channel
            .on("broadcast", { event: "wl_round_start" }, ({ payload }) => {
                setPhase("waiting_clue");
                setRound(payload.round);
                setCurrentPrompt(payload.prompt);
                setPsychicId(payload.psychicId);
                setClue("");
                setTarget(payload.psychicId === currentUserId ? payload.target : null);
                setMyGuess(50);
                setAllGuesses({});
                setHasGuessed(false);
                setGuessCount(0);
                setLastRoundResult(null);
                setScores(payload.scores || {});
            })
            .on("broadcast", { event: "wl_clue_given" }, ({ payload }) => {
                setPhase("guessing");
                setClue(payload.clue);
            })
            .on("broadcast", { event: "wl_guess_count" }, ({ payload }) => {
                setGuessCount(payload.count);
            })
            .on("broadcast", { event: "wl_reveal" }, ({ payload }) => {
                setPhase("reveal");
                setTarget(payload.target);
                setAllGuesses(payload.guesses);
                setLastRoundResult(payload.roundScore);
                setScores(payload.scores);
            })
            .on("broadcast", { event: "wl_game_over" }, ({ payload }) => {
                setPhase("ended");
                setWinnerId(payload.winnerId);
                setScores(payload.scores);
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            })

            // HOST ONLY: process requests from other players
            .on("broadcast", { event: "wl_submit_clue" }, ({ payload }) => {
                if (!isHost) return;
                processClueOnHost(payload.playerId, payload.clue);
            })
            .on("broadcast", { event: "wl_submit_guess" }, ({ payload }) => {
                if (!isHost) return;
                processGuessOnHost(payload.playerId, payload.guess);
            })
            .subscribe();

        channelRef.current = channel;
        return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room.id, currentUserId, isHost]);

    // ─── Host: Initialize and start game ──
    useEffect(() => {
        if (!isHost) return;

        const timer = setTimeout(() => {
            const order = room.members.map((m) => m.user_id);
            turnOrderRef.current = order;
            setTurnOrder(order);

            const initScores: Record<string, number> = {};
            order.forEach((id) => { initScores[id] = 0; });
            scoresRef.current = initScores;

            roundRef.current = 1;
            psychicIndexRef.current = 0;

            hostStartRound();
        }, 1000);

        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHost, room.members]);

    // ─── Client actions ──
    const handleSubmitClue = useCallback(() => {
        if (!clueInput.trim()) return;
        if (isHost) {
            processClueOnHost(currentUserId, clueInput.trim());
        } else {
            broadcast("wl_submit_clue", { playerId: currentUserId, clue: clueInput.trim() });
        }
        setClueInput("");
    }, [clueInput, currentUserId, isHost, broadcast]);

    const handleSubmitGuess = useCallback(() => {
        if (hasGuessed) return;
        setHasGuessed(true);
        if (isHost) {
            processGuessOnHost(currentUserId, myGuess);
        } else {
            broadcast("wl_submit_guess", { playerId: currentUserId, guess: myGuess });
        }
    }, [myGuess, hasGuessed, currentUserId, isHost, broadcast]);

    const handlePlayAgain = useCallback(() => {
        roundRef.current = 1;
        psychicIndexRef.current = 0;
        usedPromptsRef.current = [];
        const initScores: Record<string, number> = {};
        turnOrderRef.current.forEach((id) => { initScores[id] = 0; });
        scoresRef.current = initScores;

        setWinnerId(null);
        hostStartRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ═══════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════

    const isPsychic = psychicId === currentUserId;
    const psychicName = getMemberName(room.members, psychicId);
    const nonPsychicCount = room.members.filter((m) => m.user_id !== psychicId).length;

    // ─── End Screen ──
    if (phase === "ended" && winnerId) {
        const winnerName = getMemberName(room.members, winnerId);
        const isWinner = winnerId === currentUserId;
        const sortedScores = Object.entries(scores)
            .sort(([, a], [, b]) => b - a);

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full bg-white/50 border border-warm-grey/5 rounded-3xl p-6 shadow-sm text-center"
            >
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-3xl mx-auto mb-4 border border-amber-100">
                    <Trophy className="w-8 h-8 text-amber-600" />
                </div>

                <h2 className="font-serif text-2xl text-warm-cocoa font-bold mb-2">
                    {isWinner ? "You Win! 🎉" : `${winnerName} Wins!`}
                </h2>
                <p className="text-xs text-warm-grey/50 mb-6">
                    After {TOTAL_ROUNDS} rounds of tuning in! 📡
                </p>

                {/* Scoreboard */}
                <div className="space-y-2 mb-6 max-w-xs mx-auto">
                    {sortedScores.map(([id, score], idx) => (
                        <motion.div
                            key={id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl ${
                                idx === 0 ? "bg-amber-50 border border-amber-200/50" : "bg-white/60 border border-stone-200/30"
                            }`}
                        >
                            <span className="text-sm font-bold text-warm-grey/40 w-5">
                                {idx === 0 ? "👑" : `#${idx + 1}`}
                            </span>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatarBg(id)}`}>
                                {getMemberName(room.members, id).charAt(0)}
                            </div>
                            <span className="flex-1 text-left text-xs font-bold text-warm-cocoa">
                                {getMemberName(room.members, id)}
                                {id === currentUserId && " (You)"}
                            </span>
                            <span className="text-sm font-bold text-warm-cocoa">{score} pts</span>
                        </motion.div>
                    ))}
                </div>

                {isHost && (
                    <div className="flex flex-col gap-2 mt-4">
                        <button
                            onClick={handlePlayAgain}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-warm-cocoa text-white font-serif text-sm font-bold transition-all active:scale-95 shadow-lg shadow-warm-cocoa/20"
                        >
                            <RotateCcw className="w-4 h-4" /> Play Again
                        </button>
                        <button
                            onClick={onGameEnd}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-100 text-warm-grey text-xs font-bold transition-all active:scale-95"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Room
                        </button>
                    </div>
                )}

                {!isHost && (
                    <p className="text-[10px] text-warm-grey/40 italic mt-4">Waiting for the host to continue...</p>
                )}
            </motion.div>
        );
    }

    // ─── Main Game ──
    return (
        <div className="w-full flex flex-col gap-4">
            {/* Status Bar */}
            <div className="flex items-center justify-between bg-white/50 border border-warm-grey/5 rounded-2xl px-4 py-2.5 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-bold text-warm-grey/50">
                    📡 Wavelength
                </div>
                <div className="text-[10px] text-warm-cocoa font-bold">
                    Round {round}/{TOTAL_ROUNDS}
                </div>
                {timer > 0 && (
                    <div className={`text-xs font-bold ${timer <= 5 ? "text-rose-500 animate-pulse" : "text-warm-grey/50"}`}>
                        ⏱️ {timer}s
                    </div>
                )}
            </div>

            {/* Psychic Badge */}
            <div className="bg-white/50 border border-amber-200/30 rounded-2xl px-4 py-3 text-center">
                <div className="flex items-center justify-center gap-2">
                    <Radio className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-warm-cocoa">
                        {isPsychic ? "You're the Psychic! 🔮" : `${psychicName} is the Psychic 🔮`}
                    </span>
                </div>
                {isPsychic && phase === "waiting_clue" && (
                    <p className="text-[10px] text-warm-grey/50 mt-1">
                        You can see where the target is. Give a clue!
                    </p>
                )}
            </div>

            {/* Spectrum */}
            {currentPrompt && (
                <div className="bg-white/50 border border-warm-grey/5 rounded-3xl p-5 shadow-sm">
                    {/* Labels */}
                    <div className="flex justify-between mb-3">
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full">
                            {currentPrompt.left}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                            {currentPrompt.right}
                        </span>
                    </div>

                    {/* Spectrum Bar */}
                    <div className="relative h-8 rounded-full bg-gradient-to-r from-rose-300 via-amber-300 to-emerald-300 overflow-visible shadow-inner">
                        {/* Scoring zones (shown during reveal) */}
                        {phase === "reveal" && target !== null && (
                            <>
                                {/* Warm zone (25) */}
                                <div
                                    className="absolute top-0 h-full bg-amber-400/15 rounded-full"
                                    style={{
                                        left: `${Math.max(0, target - 25)}%`,
                                        width: `${Math.min(50, target > 25 ? 50 : target + 25)}%`,
                                    }}
                                />
                                {/* Close zone (12) */}
                                <div
                                    className="absolute top-0 h-full bg-amber-400/25 rounded-full"
                                    style={{
                                        left: `${Math.max(0, target - 12)}%`,
                                        width: `${Math.min(24, target > 12 ? 24 : target + 12)}%`,
                                    }}
                                />
                                {/* Bullseye zone (5) */}
                                <div
                                    className="absolute top-0 h-full bg-amber-400/40 rounded-full"
                                    style={{
                                        left: `${Math.max(0, target - 5)}%`,
                                        width: `${Math.min(10, target > 5 ? 10 : target + 5)}%`,
                                    }}
                                />
                            </>
                        )}

                        {/* Target marker — visible to psychic during clue, everyone during reveal */}
                        {((isPsychic && phase === "waiting_clue") || phase === "reveal") && target !== null && (
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute top-[-6px] w-1.5 h-[44px] z-20"
                                style={{ left: `calc(${target}% - 3px)` }}
                            >
                                <div className="w-full h-full bg-amber-500 rounded-full shadow-lg shadow-amber-500/50">
                                    <div className="absolute inset-0 bg-amber-400 rounded-full animate-pulse" />
                                </div>
                                {phase === "reveal" && (
                                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                        Target: {target}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Player guess markers — during reveal */}
                        {phase === "reveal" &&
                            Object.entries(allGuesses).map(([id, guess]) => {
                                const color = getPlayerColor(id, room.members);
                                return (
                                    <motion.div
                                        key={id}
                                        initial={{ y: -30, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3, type: "spring" }}
                                        className="absolute top-[-4px] z-10"
                                        style={{ left: `calc(${guess}% - 8px)` }}
                                    >
                                        <div className={`w-4 h-4 rounded-full ${color.bg} border-2 border-white shadow-sm`} />
                                        <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 text-[7px] font-bold ${color.text} whitespace-nowrap`}>
                                            {getMemberName(room.members, id)}
                                        </div>
                                    </motion.div>
                                );
                            })}

                        {/* Guess slider — for non-psychic during guessing phase */}
                        {phase === "guessing" && !isPsychic && !hasGuessed && (
                            <motion.div
                                className="absolute top-[-4px] z-30 cursor-grab active:cursor-grabbing"
                                style={{ left: `calc(${myGuess}% - 10px)` }}
                                animate={{ scale: [1, 1.1, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                <div className="w-5 h-5 rounded-full bg-warm-cocoa border-2 border-white shadow-lg" />
                            </motion.div>
                        )}
                    </div>

                    {/* Slider input — for guessing phase */}
                    {phase === "guessing" && !isPsychic && !hasGuessed && (
                        <div className="mt-4">
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={myGuess}
                                onChange={(e) => setMyGuess(parseInt(e.target.value))}
                                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-warm-cocoa [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-grab"
                            />
                        </div>
                    )}

                    {/* Clue display */}
                    <AnimatePresence>
                        {clue && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 text-center"
                            >
                                <p className="text-[9px] text-warm-grey/40 uppercase tracking-wider font-bold mb-1">
                                    {psychicName}&apos;s Clue
                                </p>
                                <p className="font-serif text-xl text-warm-cocoa font-bold">
                                    &ldquo;{clue}&rdquo;
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Reveal score */}
                    <AnimatePresence>
                        {phase === "reveal" && lastRoundResult && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="mt-4 text-center"
                            >
                                <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200/50 rounded-2xl px-5 py-3">
                                    <span className="text-2xl">{lastRoundResult.emoji}</span>
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-amber-800">{lastRoundResult.label}</p>
                                        <p className="text-[10px] text-amber-600">+{lastRoundResult.points} points for everyone!</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Action Area */}
            <div className="bg-white/50 border border-warm-grey/5 rounded-2xl p-4 shadow-sm">
                {/* Waiting for clue — Psychic input */}
                {phase === "waiting_clue" && isPsychic && (
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-xs font-bold text-warm-cocoa">Give a clue to help others find the target!</p>
                        <div className="flex gap-2 w-full max-w-sm">
                            <input
                                type="text"
                                value={clueInput}
                                onChange={(e) => setClueInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSubmitClue()}
                                placeholder="Type your clue..."
                                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm font-serif text-warm-cocoa placeholder:text-warm-grey/30 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                                maxLength={50}
                            />
                            <button
                                onClick={handleSubmitClue}
                                disabled={!clueInput.trim()}
                                className="px-4 py-2.5 rounded-xl bg-warm-cocoa text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-40"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Waiting for clue — Other players */}
                {phase === "waiting_clue" && !isPsychic && (
                    <div className="text-center">
                        <motion.div
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                        >
                            <p className="text-xs font-bold text-warm-grey/50">
                                🔮 Waiting for {psychicName} to give a clue...
                            </p>
                        </motion.div>
                    </div>
                )}

                {/* Guessing — Non-psychic submit */}
                {phase === "guessing" && !isPsychic && (
                    <div className="flex flex-col items-center gap-3">
                        {!hasGuessed ? (
                            <>
                                <p className="text-xs text-warm-grey/50">
                                    Slide to where you think the target is, then lock it in!
                                </p>
                                <button
                                    onClick={handleSubmitGuess}
                                    className="px-6 py-2.5 rounded-xl bg-warm-cocoa text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-warm-cocoa/20"
                                >
                                    Lock In Guess 🔒
                                </button>
                            </>
                        ) : (
                            <p className="text-xs font-bold text-emerald-600">
                                ✅ Guess locked! Waiting for others...
                                ({guessCount}/{nonPsychicCount} guessed)
                            </p>
                        )}
                    </div>
                )}

                {/* Guessing — Psychic waiting */}
                {phase === "guessing" && isPsychic && (
                    <div className="text-center">
                        <p className="text-xs font-bold text-warm-grey/50">
                            Others are guessing... ({guessCount}/{nonPsychicCount})
                        </p>
                        <div className="flex items-center justify-center gap-1.5 mt-2">
                            <div className="w-2 h-2 bg-warm-cocoa/30 rounded-full animate-bounce [animation-delay:0ms]" />
                            <div className="w-2 h-2 bg-warm-cocoa/30 rounded-full animate-bounce [animation-delay:150ms]" />
                            <div className="w-2 h-2 bg-warm-cocoa/30 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                    </div>
                )}

                {/* Reveal — Next round */}
                {phase === "reveal" && (
                    <div className="text-center">
                        {isHost ? (
                            <button
                                onClick={() => hostNextRound()}
                                className="px-6 py-2.5 rounded-xl bg-warm-cocoa text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-warm-cocoa/20"
                            >
                                {round >= TOTAL_ROUNDS ? "See Final Scores 🏆" : "Next Round →"}
                            </button>
                        ) : (
                            <p className="text-[10px] text-warm-grey/40 italic">Waiting for host to continue...</p>
                        )}
                    </div>
                )}
            </div>

            {/* Scoreboard */}
            {Object.keys(scores).length > 0 && (
                <div className="bg-white/50 border border-warm-grey/5 rounded-2xl p-3 shadow-sm">
                    <p className="text-[9px] text-warm-grey/40 uppercase tracking-wider font-bold mb-2 text-center">Scores</p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {Object.entries(scores)
                            .sort(([, a], [, b]) => b - a)
                            .map(([id, score]) => (
                                <div
                                    key={id}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold ${
                                        id === currentUserId
                                            ? "bg-amber-50 border border-amber-200/50 text-amber-800"
                                            : "bg-stone-50 border border-stone-200/30 text-warm-grey"
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${getAvatarBg(id)}`}>
                                        {getMemberName(room.members, id).charAt(0)}
                                    </div>
                                    {getMemberName(room.members, id)}: {score}
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
