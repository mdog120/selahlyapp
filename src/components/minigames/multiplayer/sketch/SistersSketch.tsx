"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { DrawingCanvas, Stroke } from "./DrawingCanvas";
import { SketchChat } from "./SketchChat";
import { SketchSetup } from "./SketchSetup";
import { pickRandomPrompt, getHiddenWord, SketchPrompt } from "./sketchPrompts";
import { Trophy, RotateCcw, ArrowLeft, Clock, Palette, Users, Sparkles, Shuffle, LogOut } from "lucide-react";
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

interface SistersSketchProps {
    room: GameRoom;
    currentUserId: string;
    isHost: boolean;
    onGameEnd: () => void;
    onCloseRoom: () => void;
}

interface ChatMessage {
    id: string;
    user_id: string;
    name: string;
    avatar_url: string;
    text: string;
    isCorrect?: boolean;
    isSystem?: boolean;
    timestamp: number;
}

interface TogetherGameState {
    phase: "setup" | "playing" | "round_transition" | "ended";
    mode: "together";
    currentDrawer: string;
    currentPrompt: SketchPrompt;
    round: number;
    score: number;
    timeRemaining: number;
    drawerQueue: string[];
    usedWords: string[];
}

interface VersesGameState {
    phase: "setup" | "playing" | "round_transition" | "ended";
    mode: "verses";
    teamA: { members: string[]; drawer: string; score: number };
    teamB: { members: string[]; drawer: string; score: number };
    currentPrompt: SketchPrompt;
    round: number;
    timeRemaining: number;
    usedWords: string[];
}

type GameState = TogetherGameState | VersesGameState;

// Broadcast payload (prompt word hidden from guessers)
interface BroadcastGameState {
    phase: string;
    mode: string;
    currentDrawer?: string;
    promptHidden: string;
    promptCategory: string;
    promptHint: string;
    promptWord?: string; // only included for drawers
    round: number;
    score?: number;
    timeRemaining: number;
    drawerQueue?: string[];
    teamA?: { members: string[]; drawer: string; score: number };
    teamB?: { members: string[]; drawer: string; score: number };
    teamAPromptWord?: string; // only for teamA drawer
    teamBPromptWord?: string; // only for teamB drawer
}

// ─── Helpers ────────────────────────────────────────────────

const getMemberName = (members: RoomMember[], userId: string) =>
    members.find((m) => m.user_id === userId)?.first_name || "Someone";

const getMemberAvatar = (members: RoomMember[], userId: string) =>
    members.find((m) => m.user_id === userId)?.avatar_url || "";

function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ─── Component ──────────────────────────────────────────────

export function SistersSketch({ room, currentUserId, isHost, onGameEnd, onCloseRoom }: SistersSketchProps) {
    const supabase = createClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const gameStateRef = useRef<GameState | null>(null);

    // ─── State ──────────────────────────────────────────────
    const [phase, setPhase] = useState<"setup" | "playing" | "round_transition" | "ended">("setup");
    const [mode, setMode] = useState<"together" | "verses">("together");
    const [currentDrawer, setCurrentDrawer] = useState<string>("");
    const [promptDisplay, setPromptDisplay] = useState<string>(""); // hidden or revealed word
    const [promptCategory, setPromptCategory] = useState<string>("");
    const [promptHint, setPromptHint] = useState<string>("");
    const [promptWord, setPromptWord] = useState<string>(""); // actual word (drawer only)
    const [round, setRound] = useState(1);
    const [score, setScore] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(180);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    // Verses mode
    const [teamA, setTeamA] = useState<{ members: string[]; drawer: string; score: number }>({ members: [], drawer: "", score: 0 });
    const [teamB, setTeamB] = useState<{ members: string[]; drawer: string; score: number }>({ members: [], drawer: "", score: 0 });

    // Drawing
    const [incomingStroke, setIncomingStroke] = useState<Stroke | null>(null);
    const [incomingClear, setIncomingClear] = useState(0);

    // Determine if current user is a drawer
    const amIDrawer = mode === "together"
        ? currentDrawer === currentUserId
        : (teamA.drawer === currentUserId || teamB.drawer === currentUserId);

    // ─── Channel setup ──────────────────────────────────────
    useEffect(() => {
        const channel = supabase.channel(`sketch_game:${room.id}`);

        channel
            .on("broadcast", { event: "game_state" }, ({ payload }) => {
                const gs = payload as BroadcastGameState;
                setPhase(gs.phase as any);
                setMode(gs.mode as any);
                setRound(gs.round);
                setTimeRemaining(gs.timeRemaining);
                setPromptDisplay(gs.promptHidden);
                setPromptCategory(gs.promptCategory);
                setPromptHint(gs.promptHint);

                if (gs.mode === "together") {
                    setCurrentDrawer(gs.currentDrawer || "");
                    setScore(gs.score || 0);
                    // Only the drawer gets the actual word
                    if (gs.currentDrawer === currentUserId && gs.promptWord) {
                        setPromptWord(gs.promptWord);
                    } else {
                        setPromptWord("");
                    }
                } else {
                    // Verses mode
                    if (gs.teamA) setTeamA(gs.teamA);
                    if (gs.teamB) setTeamB(gs.teamB);
                    // Drawers get their word
                    if (gs.teamA?.drawer === currentUserId && gs.teamAPromptWord) {
                        setPromptWord(gs.teamAPromptWord);
                    } else if (gs.teamB?.drawer === currentUserId && gs.teamBPromptWord) {
                        setPromptWord(gs.teamBPromptWord);
                    } else {
                        setPromptWord("");
                    }
                }
            })
            .on("broadcast", { event: "draw_stroke" }, ({ payload }) => {
                setIncomingStroke(payload as Stroke);
            })
            .on("broadcast", { event: "draw_clear" }, () => {
                setIncomingClear((c) => c + 1);
            })
            .on("broadcast", { event: "guess" }, ({ payload }) => {
                const msg = payload as ChatMessage;
                setChatMessages((prev) => [...prev, msg]);
            })
            .on("broadcast", { event: "correct_guess" }, ({ payload }) => {
                const msg = payload as ChatMessage;
                setChatMessages((prev) => [...prev, { ...msg, isCorrect: true }]);
            })
            .on("broadcast", { event: "system_message" }, ({ payload }) => {
                setChatMessages((prev) => [
                    ...prev,
                    {
                        id: Math.random().toString(36).slice(2),
                        user_id: "system",
                        name: "",
                        avatar_url: "",
                        text: payload.text,
                        isSystem: true,
                        timestamp: Date.now(),
                    },
                ]);
            })
            .on("broadcast", { event: "timer_tick" }, ({ payload }) => {
                setTimeRemaining(payload.t);
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [room.id, currentUserId]);

    // ─── Host: broadcast helpers ────────────────────────────
    const broadcast = useCallback(
        (event: string, payload: any) => {
            channelRef.current?.send({ type: "broadcast", event, payload });
        },
        []
    );

    const broadcastSystemMessage = useCallback(
        (text: string) => {
            broadcast("system_message", { text });
            // Also add locally for the host
            setChatMessages((prev) => [
                ...prev,
                {
                    id: Math.random().toString(36).slice(2),
                    user_id: "system",
                    name: "",
                    avatar_url: "",
                    text,
                    isSystem: true,
                    timestamp: Date.now(),
                },
            ]);
        },
        [broadcast]
    );

    // ─── Host: Start game ───────────────────────────────────
    const handleStartGame = useCallback(
        (config: { mode: "together" | "verses"; teamA?: string[]; teamB?: string[] }) => {
            if (!isHost) return;

            const prompt = pickRandomPrompt([]);
            const usedWords = [prompt.word];

            if (config.mode === "together") {
                const queue = shuffleArray(room.members.map((m) => m.user_id));
                const drawer = queue[0];

                const state: TogetherGameState = {
                    phase: "playing",
                    mode: "together",
                    currentDrawer: drawer,
                    currentPrompt: prompt,
                    round: 1,
                    score: 0,
                    timeRemaining: 180,
                    drawerQueue: queue,
                    usedWords,
                };
                gameStateRef.current = state;

                // Broadcast to all (hide word from non-drawers)
                broadcast("game_state", {
                    phase: "playing",
                    mode: "together",
                    currentDrawer: drawer,
                    promptHidden: getHiddenWord(prompt.word),
                    promptCategory: prompt.category,
                    promptHint: prompt.hint,
                    promptWord: prompt.word, // drawers filter client-side
                    round: 1,
                    score: 0,
                    timeRemaining: 180,
                    drawerQueue: queue,
                });

                // Set local state for host
                setPhase("playing");
                setMode("together");
                setCurrentDrawer(drawer);
                setRound(1);
                setScore(0);
                setTimeRemaining(180);
                setPromptDisplay(getHiddenWord(prompt.word));
                setPromptCategory(prompt.category);
                setPromptHint(prompt.hint);
                if (drawer === currentUserId) {
                    setPromptWord(prompt.word);
                }

                broadcastSystemMessage(`🎨 ${getMemberName(room.members, drawer)} is drawing!`);
                startTimer();
            } else {
                // Verses mode
                const tA = config.teamA || [];
                const tB = config.teamB || [];
                const drawerA = tA[0];
                const drawerB = tB[0];

                const state: VersesGameState = {
                    phase: "playing",
                    mode: "verses",
                    teamA: { members: tA, drawer: drawerA, score: 0 },
                    teamB: { members: tB, drawer: drawerB, score: 0 },
                    currentPrompt: prompt,
                    round: 1,
                    timeRemaining: 180,
                    usedWords,
                };
                gameStateRef.current = state;

                broadcast("game_state", {
                    phase: "playing",
                    mode: "verses",
                    teamA: { members: tA, drawer: drawerA, score: 0 },
                    teamB: { members: tB, drawer: drawerB, score: 0 },
                    promptHidden: getHiddenWord(prompt.word),
                    promptCategory: prompt.category,
                    promptHint: prompt.hint,
                    teamAPromptWord: prompt.word,
                    teamBPromptWord: prompt.word,
                    round: 1,
                    timeRemaining: 180,
                });

                setPhase("playing");
                setMode("verses");
                setTeamA({ members: tA, drawer: drawerA, score: 0 });
                setTeamB({ members: tB, drawer: drawerB, score: 0 });
                setRound(1);
                setTimeRemaining(180);
                setPromptDisplay(getHiddenWord(prompt.word));
                setPromptCategory(prompt.category);
                setPromptHint(prompt.hint);
                if (drawerA === currentUserId || drawerB === currentUserId) {
                    setPromptWord(prompt.word);
                }

                broadcastSystemMessage(`🎨 Team A: ${getMemberName(room.members, drawerA)} draws! Team B: ${getMemberName(room.members, drawerB)} draws!`);
                startTimer();
            }
        },
        [isHost, room.members, currentUserId, broadcast, broadcastSystemMessage]
    );

    // ─── Host: Timer ────────────────────────────────────────
    const startTimer = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        let time = 180;

        timerRef.current = setInterval(() => {
            time--;
            setTimeRemaining(time);

            // Broadcast time every second so all clients stay synced
            broadcast("timer_tick", { t: time });

            const gs = gameStateRef.current;
            if (gs) {
                gs.timeRemaining = time;
            }

            if (time <= 0) {
                if (timerRef.current) clearInterval(timerRef.current);
                endGame();
            }
        }, 1000);
    }, [broadcast]);

    const endGame = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase("ended");

        const gs = gameStateRef.current;
        broadcast("game_state", {
            phase: "ended",
            mode: gs?.mode || "together",
            currentDrawer: "",
            promptHidden: "",
            promptCategory: "",
            promptHint: "",
            round: gs ? ("round" in gs ? gs.round : 0) : 0,
            score: gs && "score" in gs ? gs.score : 0,
            timeRemaining: 0,
            teamA: gs && "teamA" in gs ? gs.teamA : undefined,
            teamB: gs && "teamB" in gs ? gs.teamB : undefined,
        });

        // Confetti!
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }, [broadcast]);

    // ─── Host: Next round ───────────────────────────────────
    const nextRound = useCallback(() => {
        if (!isHost || !gameStateRef.current) return;
        const gs = gameStateRef.current;
        const usedWords = "usedWords" in gs ? gs.usedWords : [];
        const prompt = pickRandomPrompt(usedWords);
        usedWords.push(prompt.word);

        // Clear canvas for everyone
        broadcast("draw_clear", {});
        setIncomingClear((c) => c + 1);

        if (gs.mode === "together") {
            const tgs = gs as TogetherGameState;
            const nextIndex = (tgs.drawerQueue.indexOf(tgs.currentDrawer) + 1) % tgs.drawerQueue.length;
            const nextDrawer = tgs.drawerQueue[nextIndex];
            const nextRound = tgs.round + 1;

            tgs.currentDrawer = nextDrawer;
            tgs.currentPrompt = prompt;
            tgs.round = nextRound;

            broadcast("game_state", {
                phase: "playing",
                mode: "together",
                currentDrawer: nextDrawer,
                promptHidden: getHiddenWord(prompt.word),
                promptCategory: prompt.category,
                promptHint: prompt.hint,
                promptWord: prompt.word,
                round: nextRound,
                score: tgs.score,
                timeRemaining: tgs.timeRemaining,
                drawerQueue: tgs.drawerQueue,
            });

            setCurrentDrawer(nextDrawer);
            setRound(nextRound);
            setPromptDisplay(getHiddenWord(prompt.word));
            setPromptCategory(prompt.category);
            setPromptHint(prompt.hint);
            setPromptWord(nextDrawer === currentUserId ? prompt.word : "");

            broadcastSystemMessage(`🎨 Round ${nextRound}! ${getMemberName(room.members, nextDrawer)} is drawing!`);
        } else {
            const vgs = gs as VersesGameState;
            // Rotate drawers within each team
            const aIdx = (vgs.teamA.members.indexOf(vgs.teamA.drawer) + 1) % vgs.teamA.members.length;
            const bIdx = (vgs.teamB.members.indexOf(vgs.teamB.drawer) + 1) % vgs.teamB.members.length;
            vgs.teamA.drawer = vgs.teamA.members[aIdx];
            vgs.teamB.drawer = vgs.teamB.members[bIdx];
            vgs.currentPrompt = prompt;
            vgs.round += 1;

            broadcast("game_state", {
                phase: "playing",
                mode: "verses",
                teamA: vgs.teamA,
                teamB: vgs.teamB,
                promptHidden: getHiddenWord(prompt.word),
                promptCategory: prompt.category,
                promptHint: prompt.hint,
                teamAPromptWord: prompt.word,
                teamBPromptWord: prompt.word,
                round: vgs.round,
                timeRemaining: vgs.timeRemaining,
            });

            setTeamA({ ...vgs.teamA });
            setTeamB({ ...vgs.teamB });
            setRound(vgs.round);
            setPromptDisplay(getHiddenWord(prompt.word));
            setPromptCategory(prompt.category);
            setPromptHint(prompt.hint);
            setPromptWord(
                vgs.teamA.drawer === currentUserId || vgs.teamB.drawer === currentUserId
                    ? prompt.word
                    : ""
            );

            broadcastSystemMessage(`🎨 Round ${vgs.round}! New prompt!`);
        }
    }, [isHost, currentUserId, room.members, broadcast, broadcastSystemMessage]);

    // ─── Send guess ─────────────────────────────────────────
    const handleSendGuess = useCallback(
        (text: string) => {
            if (!text.trim()) return;

            const msg: ChatMessage = {
                id: Math.random().toString(36).slice(2),
                user_id: currentUserId,
                name: getMemberName(room.members, currentUserId),
                avatar_url: getMemberAvatar(room.members, currentUserId),
                text: text.trim(),
                timestamp: Date.now(),
            };

            // Broadcast the guess to all
            broadcast("guess", msg);
            // Add locally
            setChatMessages((prev) => [...prev, msg]);

            // Host validates the guess
            if (isHost && gameStateRef.current && gameStateRef.current.phase === "playing") {
                const gs = gameStateRef.current;
                const answer = gs.currentPrompt.word.toLowerCase().trim();
                const guess = text.toLowerCase().trim();

                if (guess === answer) {
                    handleCorrectGuess(msg);
                }
            }
        },
        [currentUserId, room.members, isHost, broadcast]
    );

    // Also validate guesses from other players (host only)
    useEffect(() => {
        if (!isHost) return;
        // Listen for guesses from the broadcast and validate
        // We handle this in the channel listener by checking incoming guesses
    }, [isHost]);

    // Override: host validates all incoming guesses too
    useEffect(() => {
        if (!isHost || !channelRef.current) return;

        const handler = ({ payload }: any) => {
            const msg = payload as ChatMessage;
            if (msg.user_id === currentUserId) return; // already validated locally
            if (!gameStateRef.current || gameStateRef.current.phase !== "playing") return;

            const answer = gameStateRef.current.currentPrompt.word.toLowerCase().trim();
            const guess = msg.text.toLowerCase().trim();

            if (guess === answer) {
                handleCorrectGuess(msg);
            }
        };

        const channel = channelRef.current;
        // We can't add another listener to the same event after subscribe,
        // so we'll validate in the main broadcast listener instead.
        // This is handled by checking chatMessages updates.
    }, [isHost, currentUserId]);

    // Validate guesses from chat messages (host only)
    const lastValidatedRef = useRef(0);
    useEffect(() => {
        if (!isHost || !gameStateRef.current || gameStateRef.current.phase !== "playing") return;

        const newMessages = chatMessages.slice(lastValidatedRef.current);
        lastValidatedRef.current = chatMessages.length;

        for (const msg of newMessages) {
            if (msg.isSystem || msg.isCorrect || msg.user_id === currentUserId) continue;

            const answer = gameStateRef.current.currentPrompt.word.toLowerCase().trim();
            const guess = msg.text.toLowerCase().trim();

            if (guess === answer) {
                handleCorrectGuess(msg);
                break;
            }
        }
    }, [chatMessages, isHost, currentUserId]);

    const handleCorrectGuess = useCallback(
        (msg: ChatMessage) => {
            if (!isHost || !gameStateRef.current) return;
            const gs = gameStateRef.current;

            // Broadcast correct guess
            broadcast("correct_guess", {
                ...msg,
                text: `${msg.name} guessed it! The answer was: ${gs.currentPrompt.word}`,
                isCorrect: true,
            });

            // Add locally
            setChatMessages((prev) => [
                ...prev,
                {
                    id: Math.random().toString(36).slice(2),
                    user_id: msg.user_id,
                    name: msg.name,
                    avatar_url: msg.avatar_url,
                    text: `${msg.name} guessed it! The answer was: ${gs.currentPrompt.word}`,
                    isCorrect: true,
                    timestamp: Date.now(),
                },
            ]);

            if (gs.mode === "together") {
                const tgs = gs as TogetherGameState;
                tgs.score += 1;
                setScore(tgs.score);
            } else {
                const vgs = gs as VersesGameState;
                // Which team does the guesser belong to?
                if (vgs.teamA.members.includes(msg.user_id)) {
                    vgs.teamA.score += 1;
                    setTeamA({ ...vgs.teamA });
                } else if (vgs.teamB.members.includes(msg.user_id)) {
                    vgs.teamB.score += 1;
                    setTeamB({ ...vgs.teamB });
                }
            }

            // Small confetti burst
            confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });

            // Move to next round after a brief pause
            setTimeout(() => {
                if (gameStateRef.current && gameStateRef.current.timeRemaining > 0) {
                    nextRound();
                }
            }, 2000);
        },
        [isHost, broadcast, nextRound]
    );

    // ─── Drawing events ─────────────────────────────────────
    const handleStroke = useCallback(
        (stroke: Stroke) => {
            broadcast("draw_stroke", stroke);
        },
        [broadcast]
    );

    const handleClear = useCallback(() => {
        broadcast("draw_clear", {});
    }, [broadcast]);

    // ─── Play again ─────────────────────────────────────────
    const handlePlayAgain = useCallback(() => {
        setChatMessages([]);
        setPhase("setup");
        setScore(0);
        setRound(1);
        setTimeRemaining(180);
        setIncomingClear((c) => c + 1);

        broadcast("game_state", {
            phase: "setup",
            mode: "together",
            currentDrawer: "",
            promptHidden: "",
            promptCategory: "",
            promptHint: "",
            round: 0,
            score: 0,
            timeRemaining: 180,
        });
    }, [broadcast]);

    // ─── Format time ────────────────────────────────────────
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    // ═══════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════

    // ─── Setup Phase ────────────────────────────────────────
    if (phase === "setup") {
        return (
            <div className="w-full">
                <SketchSetup
                    members={room.members}
                    isHost={isHost}
                    onStartGame={handleStartGame}
                />
            </div>
        );
    }

    // ─── End Screen ─────────────────────────────────────────
    if (phase === "ended") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full bg-white/50 border border-warm-grey/5 rounded-3xl p-6 shadow-sm text-center"
            >
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-3xl mx-auto mb-4 border border-amber-100">
                    <Trophy className="w-8 h-8 text-amber-600" />
                </div>

                <h2 className="font-serif text-2xl text-warm-cocoa font-bold mb-2">Time's Up!</h2>
                <p className="text-xs text-warm-grey/50 mb-6">
                    {round} {round === 1 ? "round" : "rounds"} completed
                </p>

                {mode === "together" ? (
                    <div className="bg-gradient-to-br from-amber-50 to-stone-50 rounded-2xl p-5 mb-6 border border-amber-100">
                        <p className="text-[10px] text-warm-grey/50 uppercase tracking-wider font-bold mb-1">Group Score</p>
                        <p className="font-serif text-4xl text-warm-cocoa font-bold">{score}</p>
                        <p className="text-xs text-warm-grey/50 mt-1">correct guesses ✨</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className={`rounded-2xl p-4 border ${teamA.score >= teamB.score ? "bg-amber-50 border-amber-200" : "bg-stone-50 border-stone-200/50"}`}>
                            <p className="text-[10px] font-bold text-warm-grey/50 uppercase tracking-wider mb-1">Team A 🌸</p>
                            <p className="font-serif text-3xl text-warm-cocoa font-bold">{teamA.score}</p>
                        </div>
                        <div className={`rounded-2xl p-4 border ${teamB.score >= teamA.score ? "bg-amber-50 border-amber-200" : "bg-stone-50 border-stone-200/50"}`}>
                            <p className="text-[10px] font-bold text-warm-grey/50 uppercase tracking-wider mb-1">Team B 💜</p>
                            <p className="font-serif text-3xl text-warm-cocoa font-bold">{teamB.score}</p>
                        </div>
                        {teamA.score !== teamB.score && (
                            <div className="col-span-2 text-center">
                                <p className="text-xs font-bold text-amber-800">
                                    🎉 {teamA.score > teamB.score ? "Team A" : "Team B"} wins!
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {isHost && (
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handlePlayAgain}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-warm-cocoa text-white font-serif text-sm font-bold transition-all active:scale-95 shadow-lg shadow-warm-cocoa/20"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Play Again
                        </button>
                        <button onClick={onGameEnd} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/50 text-xs font-bold text-amber-800 transition-all active:scale-95">
                            <Shuffle className="w-3.5 h-3.5" /> Choose Another Game
                        </button>
                        <button onClick={onCloseRoom} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-xs font-bold text-rose-700 transition-all active:scale-95">
                            <LogOut className="w-3.5 h-3.5" /> Close Room
                        </button>
                    </div>
                )}

                {!isHost && (
                    <p className="text-[10px] text-warm-grey/40 italic mt-4">Waiting for the host to continue...</p>
                )}
            </motion.div>
        );
    }

    // ─── Playing Phase ──────────────────────────────────────
    return (
        <div className="w-full flex flex-col gap-3">
            {/* Top Bar: Timer + Score + Round */}
            <div className="flex items-center justify-between bg-white/50 border border-warm-grey/5 rounded-2xl px-4 py-2.5 shadow-sm">
                {/* Timer */}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    timeRemaining <= 30
                        ? "bg-rose-50 text-rose-700 border border-rose-200/50 animate-pulse"
                        : "bg-stone-50 text-warm-cocoa border border-stone-200/30"
                }`}>
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(timeRemaining)}
                </div>

                {/* Round */}
                <span className="text-[10px] font-bold text-warm-grey/40 uppercase tracking-wider">
                    Round {round}
                </span>

                {/* Score */}
                {mode === "together" ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/30 text-xs font-bold">
                        <Sparkles className="w-3 h-3" />
                        {score} pts
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200/30">A: {teamA.score}</span>
                        <span className="text-warm-grey/30">vs</span>
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200/30">B: {teamB.score}</span>
                    </div>
                )}
            </div>

            {/* Prompt Display */}
            <div className="bg-white/50 border border-warm-grey/5 rounded-2xl px-4 py-3 shadow-sm text-center">
                {amIDrawer ? (
                    <div>
                        <p className="text-[9px] text-warm-grey/40 uppercase tracking-wider font-bold mb-0.5">Draw this:</p>
                        <p className="font-serif text-xl text-warm-cocoa font-bold">{promptWord}</p>
                        <p className="text-[9px] text-warm-grey/40 mt-0.5 capitalize">{promptCategory}</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-[9px] text-warm-grey/40 uppercase tracking-wider font-bold mb-0.5">Guess the {promptCategory}:</p>
                        <p className="font-mono text-lg text-warm-cocoa font-bold tracking-[0.3em]">{promptDisplay}</p>
                        <p className="text-[9px] text-warm-grey/40 mt-0.5 italic">💡 {promptHint}</p>
                    </div>
                )}
            </div>

            {/* Canvas + Chat */}
            <div className="flex flex-col md:flex-row gap-3 min-h-[400px] md:h-[420px]">
                {/* Canvas */}
                <div className="flex-1 flex flex-col min-h-[280px] md:min-h-0">
                    <DrawingCanvas
                        isDrawer={amIDrawer}
                        onStroke={handleStroke}
                        onClear={handleClear}
                        incomingStroke={incomingStroke}
                        incomingClear={incomingClear}
                        drawerName={
                            mode === "together"
                                ? getMemberName(room.members, currentDrawer)
                                : undefined
                        }
                    />
                </div>

                {/* Chat */}
                <div className="w-full md:w-72 flex flex-col bg-white/50 border border-warm-grey/5 rounded-2xl shadow-sm overflow-hidden min-h-[200px] md:min-h-0">
                    <div className="px-3 py-2 border-b border-stone-200/30 text-[10px] font-bold text-warm-grey/50 uppercase tracking-wider flex items-center gap-1.5">
                        <Palette className="w-3 h-3" />
                        Guesses
                    </div>
                    <div className="flex-1 min-h-0">
                        <SketchChat
                            messages={chatMessages}
                            onSendGuess={handleSendGuess}
                            disabled={amIDrawer}
                            disabledMessage="You're drawing! No guessing 🎨"
                            currentUserId={currentUserId}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
