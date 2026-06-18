"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getRandomScenario, type SpyfallScenario, type SpyfallRole } from "./spyfallScenarios";
import { Trophy, RotateCcw, ArrowLeft, Send, Eye, EyeOff, Vote, Timer, MessageCircle, UserX, Users, Shuffle, LogOut, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

// Play SSHH sound on game start
const playSshhSound = () => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const now = audioContext.currentTime;
        const duration = 0.3;
        
        // Create filter
        const filter = audioContext.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(7000, now);
        
        // Create noise
        const bufferSize = audioContext.sampleRate * duration;
        const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        const noiseNode = audioContext.createBufferSource();
        noiseNode.buffer = noiseBuffer;
        
        // Create gain envelope
        const gain = audioContext.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
        
        // Connect
        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(audioContext.destination);
        
        // Play
        noiseNode.start(now);
        noiseNode.stop(now + duration);
    } catch (e) {
        // Fallback if audio context not available
    }
};

// ─── Moving Character Component ──────────────────────────

function MovableCharacter({ id, emoji, name, index, total }: { id: string; emoji: string; name: string; index: number; total: number }) {
    const randomX = Math.random() * 40 - 20; // -20 to 20px
    const randomY = Math.random() * 40 - 20; // -20 to 20px
    const duration = 3 + Math.random() * 2; // 3-5 seconds
    
    return (
        <motion.div
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{
                x: randomX,
                y: randomY,
                opacity: 1,
            }}
            transition={{
                duration,
                repeat: Infinity,
                repeatType: "reverse",
                delay: index * 0.2,
            }}
            className="absolute pointer-events-none"
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold border-2 ${getAvatarBg(id)} animate-pulse`}>
                {emoji}
            </div>
        </motion.div>
    );
}

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

interface SpyfallProps {
    room: GameRoom;
    currentUserId: string;
    isHost: boolean;
    onGameEnd: () => void;
    onCloseRoom: () => void;
}

interface QAEntry {
    id: string;
    askerId: string;
    targetId: string;
    question: string;
    answer: string;
}

type Phase = "roles" | "asking" | "voting" | "result";

// ─── Helpers ────────────────────────────────────────────────

const getMemberName = (members: RoomMember[], userId: string) =>
    members.find((m) => m.user_id === userId)?.first_name || "Someone";

function getAvatarBg(id: string) {
    const colors = [
        "bg-gradient-to-br from-cyan-400 to-blue-600 text-white border-cyan-300/50 shadow-lg shadow-cyan-500/50",
        "bg-gradient-to-br from-lime-400 to-green-600 text-white border-lime-300/50 shadow-lg shadow-lime-500/50",
        "bg-gradient-to-br from-purple-400 to-purple-600 text-white border-purple-300/50 shadow-lg shadow-purple-500/50",
        "bg-gradient-to-br from-pink-400 to-red-600 text-white border-pink-300/50 shadow-lg shadow-pink-500/50",
        "bg-gradient-to-br from-yellow-400 to-orange-600 text-white border-yellow-300/50 shadow-lg shadow-yellow-500/50",
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash += id.charCodeAt(i);
    return colors[hash % colors.length];
}

const GAME_DURATION = 10 * 60; // 10 minutes in seconds

// ─── Component ──────────────────────────────────────────────

export function Spyfall({ room, currentUserId, isHost, onGameEnd, onCloseRoom }: SpyfallProps) {
    const supabase = createClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // ─── ALL mutable game state in refs (host source of truth) ──
    const scenarioRef = useRef<SpyfallScenario | null>(null);
    const spyIdRef = useRef("");
    const roleMapRef = useRef<Record<string, SpyfallRole>>({});
    const turnOrderRef = useRef<string[]>([]);
    const currentAskerRef = useRef(0);
    const qaLogRef = useRef<QAEntry[]>([]);
    const votesRef = useRef<Record<string, string>>({});
    const phaseRef = useRef<Phase>("roles");
    const usedScenariosRef = useRef<string[]>([]);
    const pendingQuestionRef = useRef<{ askerId: string; targetId: string; question: string } | null>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // ─── Display state ──
    const [phase, setPhase] = useState<Phase>("roles");
    const [myRole, setMyRole] = useState<SpyfallRole | null>(null);
    const [isSpy, setIsSpy] = useState(false);
    const [scenarioEvent, setScenarioEvent] = useState("");
    const [scenarioEmoji, setScenarioEmoji] = useState("");
    const [scenarioDesc, setScenarioDesc] = useState("");
    const [currentAskerId, setCurrentAskerId] = useState("");
    const [qaLog, setQaLog] = useState<QAEntry[]>([]);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [showRole, setShowRole] = useState(false);
    const [votes, setVotes] = useState<Record<string, string>>({});
    const [voteCount, setVoteCount] = useState(0);
    const [result, setResult] = useState<{ spyId: string; spyCaught: boolean; scenario: SpyfallScenario } | null>(null);
    const [readyToVoteCount, setReadyToVoteCount] = useState(0);
    const readyToVoteRef = useRef<Set<string>>(new Set());

    // Asking phase local state
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
    const [questionInput, setQuestionInput] = useState("");
    const [answerInput, setAnswerInput] = useState("");
    const [pendingQuestion, setPendingQuestion] = useState<{ askerId: string; targetId: string; question: string } | null>(null);
    const [myVote, setMyVote] = useState<string | null>(null);
    const [turnOrder, setTurnOrder] = useState<string[]>([]);

    // ─── Broadcast helper ──
    const broadcast = useCallback((event: string, payload: any) => {
        channelRef.current?.send({ type: "broadcast", event, payload });
    }, []);

    // ═══════════════════════════════════════════════════════
    // HOST PROCESSING FUNCTIONS
    // ═══════════════════════════════════════════════════════

    function hostStartGame() {
        const order = room.members.map((m) => m.user_id);
        turnOrderRef.current = order;

        // Pick scenario
        const scenario = getRandomScenario(usedScenariosRef.current);
        scenarioRef.current = scenario;
        usedScenariosRef.current.push(scenario.id);

        // Pick spy randomly
        const spyIdx = Math.floor(Math.random() * order.length);
        const spy = order[spyIdx];
        spyIdRef.current = spy;

        // Assign roles to non-spies
        const shuffledRoles = [...scenario.roles].sort(() => Math.random() - 0.5);
        const roleMap: Record<string, SpyfallRole> = {};
        let roleIdx = 0;
        order.forEach((id) => {
            if (id !== spy) {
                roleMap[id] = shuffledRoles[roleIdx % shuffledRoles.length];
                roleIdx++;
            }
        });
        roleMapRef.current = roleMap;

        currentAskerRef.current = 0;
        qaLogRef.current = [];
        votesRef.current = {};
        phaseRef.current = "roles";
        pendingQuestionRef.current = null;
        readyToVoteRef.current = new Set();

        // Send each player their role privately
        order.forEach((id) => {
            const isSpy = id === spy;
            broadcast("sf_role", {
                playerId: id,
                isSpy,
                role: isSpy ? null : roleMap[id],
                event: isSpy ? null : scenario.event,
                eventEmoji: isSpy ? null : scenario.emoji,
                eventDesc: isSpy ? null : scenario.description,
            });
        });

        // Host sets own role
        const hostIsSpy = currentUserId === spy;
        setIsSpy(hostIsSpy);
        setMyRole(hostIsSpy ? null : roleMap[currentUserId] || null);
        setScenarioEvent(hostIsSpy ? "" : scenario.event);
        setScenarioEmoji(hostIsSpy ? "" : scenario.emoji);
        setScenarioDesc(hostIsSpy ? "" : scenario.description);

        // Broadcast game start
        broadcast("sf_game_start", {
            turnOrder: order,
            currentAskerId: order[0],
        });

        setPhase("roles");
        setTurnOrder(order);
        setCurrentAskerId(order[0]);
        setQaLog([]);
        setVotes({});
        setVoteCount(0);
        setTimeLeft(GAME_DURATION);
        setShowRole(false);
        setResult(null);
        setMyVote(null);
        setReadyToVoteCount(0);

        // Start asking phase after 8 seconds (time to read roles)
        setTimeout(() => {
            phaseRef.current = "asking";
            broadcast("sf_phase", { phase: "asking" });
            setPhase("asking");
            hostStartTimer();
        }, 8000);
    }

    function hostStartTimer() {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        let t = GAME_DURATION;
        setTimeLeft(t);
        timerIntervalRef.current = setInterval(() => {
            t -= 1;
            setTimeLeft(t);
            // Broadcast time every second to keep clients in sync
            broadcast("sf_timer", { timeLeft: t });
            if (t <= 0) {
                if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                hostStartVoting();
            }
        }, 1000);
    }

    function processQuestionOnHost(askerId: string, targetId: string, question: string) {
        if (phaseRef.current !== "asking") return;
        pendingQuestionRef.current = { askerId, targetId, question };
        broadcast("sf_question", { askerId, targetId, question });
        // Host display
        setPendingQuestion({ askerId, targetId, question });
    }

    function processAnswerOnHost(targetId: string, answer: string) {
        if (phaseRef.current !== "asking" || !pendingQuestionRef.current) return;
        const { askerId, question } = pendingQuestionRef.current;

        const entry: QAEntry = {
            id: `qa-${Date.now()}`,
            askerId,
            targetId,
            question,
            answer,
        };
        qaLogRef.current = [...qaLogRef.current, entry];
        pendingQuestionRef.current = null;

        // Advance to next asker
        const order = turnOrderRef.current;
        currentAskerRef.current = (currentAskerRef.current + 1) % order.length;
        const nextAsker = order[currentAskerRef.current];

        broadcast("sf_answer", {
            entry,
            nextAskerId: nextAsker,
        });

        // Host display
        setQaLog((prev) => [...prev, entry]);
        setPendingQuestion(null);
        setCurrentAskerId(nextAsker);
        setSelectedTarget(null);
        setQuestionInput("");
    }

    function processReadyToVote(playerId: string) {
        readyToVoteRef.current.add(playerId);
        const count = readyToVoteRef.current.size;
        broadcast("sf_ready_count", { count });
        setReadyToVoteCount(count);

        // If majority ready, start voting
        if (count >= Math.ceil(room.members.length / 2)) {
            hostStartVoting();
        }
    }

    function hostStartVoting() {
        if (phaseRef.current === "voting" || phaseRef.current === "result") return;
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        phaseRef.current = "voting";
        votesRef.current = {};
        broadcast("sf_phase", { phase: "voting" });
        setPhase("voting");
        setVotes({});
        setVoteCount(0);
    }

    function processVoteOnHost(playerId: string, votedFor: string) {
        if (phaseRef.current !== "voting") return;
        votesRef.current[playerId] = votedFor;
        const count = Object.keys(votesRef.current).length;

        broadcast("sf_vote_count", { count });
        setVoteCount(count);

        // Check if all voted
        if (count >= room.members.length) {
            hostRevealResult();
        }
    }

    function hostRevealResult() {
        if (phaseRef.current === "result") return;
        phaseRef.current = "result";

        const spy = spyIdRef.current;
        const allVotes = votesRef.current;

        // Count votes per player
        const voteCounts: Record<string, number> = {};
        Object.values(allVotes).forEach((v) => {
            voteCounts[v] = (voteCounts[v] || 0) + 1;
        });

        // Find who got the most votes — ties mean spy escapes
        const maxVotes = Math.max(...Object.values(voteCounts));
        const topVoted = Object.keys(voteCounts).filter((id) => voteCounts[id] === maxVotes);
        // If there's a tie (multiple people with the same top votes), spy is NOT caught
        const isTie = topVoted.length > 1;
        const mostVoted = topVoted[0] || "";
        const spyCaught = !isTie && mostVoted === spy;

        const resultPayload = {
            spyId: spy,
            spyCaught,
            scenario: scenarioRef.current!,
            votes: allVotes,
            roleMap: roleMapRef.current,
        };

        broadcast("sf_result", resultPayload);

        setResult({
            spyId: spy,
            spyCaught,
            scenario: scenarioRef.current!,
        });
        setVotes(allVotes);
        setPhase("result");

        if (spyCaught) {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
    }

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, []);

    // ═══════════════════════════════════════════════════════
    // SINGLE CHANNEL SETUP — ALL listeners ONCE
    // ═══════════════════════════════════════════════════════
    useEffect(() => {
        const channel = supabase.channel(`spyfall_game:${room.id}`);

        channel
            .on("broadcast", { event: "sf_role" }, ({ payload }) => {
                if (payload.playerId === currentUserId) {
                    setIsSpy(payload.isSpy);
                    setMyRole(payload.role);
                    setScenarioEvent(payload.event || "");
                    setScenarioEmoji(payload.eventEmoji || "");
                    setScenarioDesc(payload.eventDesc || "");
                }
            })
            .on("broadcast", { event: "sf_game_start" }, ({ payload }) => {
                setPhase("roles");
                setTurnOrder(payload.turnOrder);
                setCurrentAskerId(payload.currentAskerId);
                setQaLog([]);
                setTimeLeft(GAME_DURATION);
                setShowRole(false);
                setVotes({});
                setResult(null);
                setMyVote(null);
                setVoteCount(0);
                setReadyToVoteCount(0);
            })
            .on("broadcast", { event: "sf_phase" }, ({ payload }) => {
                setPhase(payload.phase);
                if (payload.phase === "voting") {
                    setMyVote(null);
                    setVoteCount(0);
                }
            })
            .on("broadcast", { event: "sf_timer" }, ({ payload }) => {
                setTimeLeft(payload.timeLeft);
            })
            .on("broadcast", { event: "sf_question" }, ({ payload }) => {
                setPendingQuestion({
                    askerId: payload.askerId,
                    targetId: payload.targetId,
                    question: payload.question,
                });
            })
            .on("broadcast", { event: "sf_answer" }, ({ payload }) => {
                setQaLog((prev) => [...prev, payload.entry]);
                setPendingQuestion(null);
                setCurrentAskerId(payload.nextAskerId);
                setSelectedTarget(null);
                setQuestionInput("");
                setAnswerInput("");
            })
            .on("broadcast", { event: "sf_vote_count" }, ({ payload }) => {
                setVoteCount(payload.count);
            })
            .on("broadcast", { event: "sf_ready_count" }, ({ payload }) => {
                setReadyToVoteCount(payload.count);
            })
            .on("broadcast", { event: "sf_result" }, ({ payload }) => {
                setResult({
                    spyId: payload.spyId,
                    spyCaught: payload.spyCaught,
                    scenario: payload.scenario,
                });
                setVotes(payload.votes);
                setPhase("result");
                if (payload.spyCaught) {
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }
            })
            // HOST ONLY: process requests
            .on("broadcast", { event: "sf_send_question" }, ({ payload }) => {
                if (!isHost) return;
                processQuestionOnHost(payload.askerId, payload.targetId, payload.question);
            })
            .on("broadcast", { event: "sf_send_answer" }, ({ payload }) => {
                if (!isHost) return;
                processAnswerOnHost(payload.targetId, payload.answer);
            })
            .on("broadcast", { event: "sf_send_vote" }, ({ payload }) => {
                if (!isHost) return;
                processVoteOnHost(payload.playerId, payload.votedFor);
            })
            .on("broadcast", { event: "sf_request_vote" }, ({ payload }) => {
                if (!isHost) return;
                processReadyToVote(payload.playerId);
            })
            .subscribe();

        channelRef.current = channel;
        return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room.id, currentUserId, isHost]);

    // ─── Host: init game on mount ──
    useEffect(() => {
        if (!isHost) return;
        playSshhSound();
        const timer = setTimeout(() => hostStartGame(), 1500);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isHost]);

    // ─── Client actions ──
    const handleSendQuestion = useCallback(() => {
        if (!selectedTarget || !questionInput.trim()) return;
        if (isHost) {
            processQuestionOnHost(currentUserId, selectedTarget, questionInput.trim());
        } else {
            broadcast("sf_send_question", {
                askerId: currentUserId,
                targetId: selectedTarget,
                question: questionInput.trim(),
            });
        }
        setQuestionInput("");
    }, [selectedTarget, questionInput, currentUserId, isHost, broadcast]);

    const handleSendAnswer = useCallback(() => {
        if (!answerInput.trim()) return;
        if (isHost) {
            processAnswerOnHost(currentUserId, answerInput.trim());
        } else {
            broadcast("sf_send_answer", {
                targetId: currentUserId,
                answer: answerInput.trim(),
            });
        }
        setAnswerInput("");
    }, [answerInput, currentUserId, isHost, broadcast]);

    const handleVote = useCallback((votedFor: string) => {
        if (myVote) return;
        setMyVote(votedFor);
        if (isHost) {
            processVoteOnHost(currentUserId, votedFor);
        } else {
            broadcast("sf_send_vote", { playerId: currentUserId, votedFor });
        }
    }, [myVote, currentUserId, isHost, broadcast]);

    const handleReadyToVote = useCallback(() => {
        if (isHost) {
            processReadyToVote(currentUserId);
        } else {
            broadcast("sf_request_vote", { playerId: currentUserId });
        }
    }, [currentUserId, isHost, broadcast]);

    const handlePlayAgain = useCallback(() => {
        hostStartGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ═══════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════

    const isMyTurnToAsk = currentAskerId === currentUserId;
    const isMyTurnToAnswer = pendingQuestion?.targetId === currentUserId;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    // ─── Role Reveal Phase ──
    if (phase === "roles") {
        return (
            <div className="w-full flex flex-col gap-4 relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 -z-10" />
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,0,128,.5))] -z-10" />
                
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.1 }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                    className="absolute inset-0 -z-10 bg-purple-600"
                />

                <div className="relative bg-gradient-to-br from-slate-800/80 via-purple-900/60 to-slate-800/80 border border-purple-500/30 rounded-3xl p-8 shadow-2xl shadow-purple-900/50 text-center backdrop-blur-sm overflow-hidden">
                    {/* Glowing background effect */}
                    <div className="absolute -inset-full bg-gradient-to-r from-purple-600/0 via-purple-600/20 to-purple-600/0 blur-3xl animate-pulse -z-10" />
                    
                    {/* Moving characters in background */}
                    <div className="absolute inset-0 opacity-20 -z-10">
                        {room.members.slice(0, 3).map((m, i) => (
                            <MovableCharacter
                                key={m.user_id}
                                id={m.user_id}
                                emoji={isSpy ? "🕵️" : (myRole?.emoji || "❓")}
                                name={m.first_name}
                                index={i}
                                total={3}
                            />
                        ))}
                    </div>

                    <motion.div
                        initial={{ scale: 0, rotateY: 180 }}
                        animate={{ scale: 1, rotateY: 0 }}
                        transition={{ type: "spring", damping: 12, delay: 0.2 }}
                        className="mb-6 relative z-10"
                    >
                        <motion.div
                            animate={{ boxShadow: ["0 0 20px rgba(168, 85, 247, 0.5)", "0 0 40px rgba(168, 85, 247, 0.8)", "0 0 20px rgba(168, 85, 247, 0.5)"] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center text-6xl border-4 relative ${
                                isSpy
                                    ? "bg-gradient-to-br from-red-600 to-red-900 border-red-400 shadow-lg shadow-red-500/80"
                                    : "bg-gradient-to-br from-cyan-400 to-blue-700 border-cyan-300 shadow-lg shadow-cyan-500/80"
                            }`}>
                            {isSpy ? "🕵️" : (myRole?.emoji || "❓")}
                        </motion.div>
                    </motion.div>

                    {isSpy ? (
                        <>
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="font-serif text-3xl text-red-300 font-bold mb-2 drop-shadow-lg">
                                You&apos;re the SPY! 🕵️
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-sm text-purple-200/80 max-w-xs mx-auto leading-relaxed">
                                You don&apos;t know the event or your role. Ask clever questions and figure it out — but don&apos;t blow your cover!
                            </motion.p>
                        </>
                    ) : (
                        <>
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="font-serif text-2xl text-cyan-300 font-bold mb-1 drop-shadow-lg">
                                {scenarioEmoji} {scenarioEvent}
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-xs text-purple-300/60 italic mb-4">
                                {scenarioDesc}
                            </motion.p>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6 }}
                                className="inline-flex items-center gap-3 bg-gradient-to-r from-cyan-600/40 to-blue-600/40 border border-cyan-400/50 rounded-2xl px-6 py-3 backdrop-blur-sm">
                                <span className="text-2xl animate-bounce">{myRole?.emoji}</span>
                                <div className="text-left">
                                    <p className="text-[10px] text-cyan-300/60 uppercase tracking-widest font-bold">Your Role</p>
                                    <p className="text-base font-bold text-cyan-100">{myRole?.name}</p>
                                </div>
                            </motion.div>
                        </>
                    )}

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-7 flex items-center justify-center gap-2"
                    >
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-2.5 h-2.5 bg-purple-400 rounded-full" />
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-2.5 h-2.5 bg-cyan-400 rounded-full" />
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-2.5 h-2.5 bg-red-400 rounded-full" />
                    </motion.div>
                    <p className="text-xs text-purple-300/50 mt-3 font-semibold tracking-wider">STARTING SOON...</p>
                </div>
            </div>
        );
    }

    // ─── Result Phase ──
    if (phase === "result" && result) {
        const spyName = getMemberName(room.members, result.spyId);
        const iWasSpy = result.spyId === currentUserId;

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 -z-10" />
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,0,128,.5))] -z-10" />
                
                <div className={`border rounded-3xl p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden ${
                    result.spyCaught
                        ? "bg-gradient-to-br from-emerald-600/40 via-emerald-800/40 to-emerald-900/60 border-emerald-400/50"
                        : "bg-gradient-to-br from-red-600/40 via-red-800/40 to-red-900/60 border-red-400/50"
                }`}>
                    
                    {result.spyCaught && (
                        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }} className="absolute inset-0 -z-10 bg-emerald-500/10" />
                    )}

                    <div className="text-center">
                        {/* Result banner */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: "spring", damping: 10 }}
                            className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-5xl mb-6 border-4 shadow-2xl ${
                                result.spyCaught
                                    ? "bg-gradient-to-br from-emerald-400 to-green-600 border-emerald-300 shadow-emerald-500/50"
                                    : "bg-gradient-to-br from-red-500 to-red-700 border-red-400 shadow-red-500/50"
                            }`}>
                            {result.spyCaught ? "🎉" : "🕵️"}
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className={`font-serif text-3xl font-bold mb-2 drop-shadow-lg ${
                                result.spyCaught
                                    ? (iWasSpy ? "text-red-200" : "text-emerald-200")
                                    : (iWasSpy ? "text-cyan-200" : "text-red-200")
                            }`}>
                            {result.spyCaught
                                ? (iWasSpy ? "You Got CAUGHT! 😅" : "SPY CAUGHT! 🎉")
                                : (iWasSpy ? "You ESCAPED! 😎" : "The SPY ESCAPED! 😱")
                            }
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-lg text-purple-200/80 mb-6">
                            The spy was <span className={`font-bold ${result.spyCaught ? "text-emerald-300" : "text-red-300"}`}>{spyName}</span>
                        </motion.p>

                        {/* Scenario reveal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-gradient-to-r from-purple-600/40 to-pink-600/40 border border-purple-400/50 rounded-2xl p-5 mb-6 backdrop-blur-sm inline-block"
                        >
                            <span className="text-4xl block mb-2">{result.scenario.emoji}</span>
                            <p className="text-base font-bold text-purple-200 mb-1">{result.scenario.event}</p>
                            <p className="text-sm text-purple-300/80">{result.scenario.description}</p>
                        </motion.div>

                        {/* Vote breakdown */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-slate-800/60 border border-slate-600/50 rounded-2xl p-4 mb-6 text-left max-w-sm mx-auto backdrop-blur-sm"
                        >
                            <p className="text-[11px] text-purple-300 uppercase tracking-widest font-bold mb-3 text-center">Voting Results</p>
                            <div className="space-y-2">
                                {Object.entries(votes).map(([voterId, votedFor]) => (
                                    <motion.div
                                        key={voterId}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex items-center gap-3 text-sm py-1"
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${getAvatarBg(voterId)}`}>
                                            {getMemberName(room.members, voterId).charAt(0)}
                                        </div>
                                        <span className="text-purple-300">{getMemberName(room.members, voterId)}</span>
                                        <span className="text-purple-400/60">→</span>
                                        <span className={`font-bold ${votedFor === result.spyId ? "text-emerald-400" : "text-red-400"}`}>
                                            {getMemberName(room.members, votedFor)}
                                            {votedFor === result.spyId ? " ✓" : " ✗"}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {isHost && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="flex flex-col gap-3 mt-4"
                            >
                                <button
                                    onClick={handlePlayAgain}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-serif text-base font-bold transition-all active:scale-95 shadow-lg shadow-purple-500/50"
                                >
                                    <RotateCcw className="w-4 h-4" /> Play Again
                                </button>
                                <button
                                    onClick={onGameEnd}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-600/80 border border-slate-500/50 text-sm font-bold text-purple-200 transition-all active:scale-95"
                                >
                                    <Shuffle className="w-3.5 h-3.5" /> Choose Another Game
                                </button>
                                <button
                                    onClick={onCloseRoom}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600/40 hover:bg-red-600/60 border border-red-400/50 text-sm font-bold text-red-200 transition-all active:scale-95"
                                >
                                    <LogOut className="w-3.5 h-3.5" /> Close Room
                                </button>
                            </motion.div>
                        )}
                        {!isHost && <p className="text-sm text-purple-300/60 italic mt-4">Waiting for the host to continue...</p>}
                    </div>
                </div>
            </motion.div>
        );
    }

    // ─── Voting Phase ──
    if (phase === "voting") {
        return (
            <div className="w-full flex flex-col gap-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-red-900/30 to-slate-900 -z-10" />
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,0,128,.5))] -z-10" />
                
                <div className="flex items-center justify-between bg-gradient-to-r from-slate-800/80 to-red-900/40 border border-red-400/50 rounded-2xl px-5 py-3 shadow-lg shadow-red-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">🕵️ SPYFALL</div>
                    <div className="text-sm font-bold text-red-300 drop-shadow-lg animate-pulse">🗳️ VOTING TIME!</div>
                    <div className="text-xs font-bold text-purple-300/70">
                        {voteCount}/{room.members.length} voted
                    </div>
                </div>

                <div className="bg-gradient-to-br from-slate-800/80 via-purple-900/50 to-slate-800/80 border border-purple-500/30 rounded-3xl p-6 shadow-2xl shadow-purple-900/50 text-center backdrop-blur-sm">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    >
                        <Vote className="w-10 h-10 text-red-400 mx-auto mb-4 drop-shadow-lg" />
                    </motion.div>
                    <motion.h3
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-serif text-2xl font-bold text-red-300 mb-2 drop-shadow-lg">
                        {myVote ? "Vote Submitted!" : "WHO IS THE SPY?"}
                    </motion.h3>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-sm text-purple-200/70 mb-6">
                        {myVote ? "Waiting for everyone to vote..." : "Click on who you think is the spy"}
                    </motion.p>

                    <div className="flex flex-col gap-2.5 max-w-sm mx-auto">
                        {room.members.map((m, idx) => (
                            <motion.button
                                key={m.user_id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => handleVote(m.user_id)}
                                disabled={!!myVote || m.user_id === currentUserId}
                                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all active:scale-95 border-2 ${
                                    myVote === m.user_id
                                        ? "bg-gradient-to-r from-red-600/60 to-red-700/60 border-red-400 shadow-lg shadow-red-500/50 ring-2 ring-red-300"
                                        : m.user_id === currentUserId
                                        ? "bg-slate-700/40 border-slate-600/30 opacity-40 cursor-not-allowed"
                                        : myVote
                                        ? "bg-slate-700/40 border-slate-600/30 opacity-40 cursor-not-allowed"
                                        : "bg-slate-700/60 border-slate-600/50 hover:bg-red-700/40 hover:border-red-500 cursor-pointer"
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${getAvatarBg(m.user_id)}`}>
                                    {m.first_name.charAt(0)}
                                </div>
                                <span className="text-sm font-bold text-purple-200 flex-1 text-left">
                                    {m.first_name}
                                    {m.user_id === currentUserId && " (You)"}
                                </span>
                                {myVote === m.user_id && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="text-lg font-bold text-red-300">
                                        🗳️
                                    </motion.span>
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ─── Asking Phase ──
    return (
        <div className="w-full flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 -z-10" />
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,0,128,.5))] -z-10" />
            
            {/* Status Bar */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between bg-gradient-to-r from-slate-800/80 to-purple-900/40 border border-purple-500/30 rounded-2xl px-5 py-3 shadow-lg shadow-purple-900/50 backdrop-blur-sm"
            >
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                    🕵️ SPYFALL
                </div>
                <div className={`text-sm font-bold drop-shadow-lg ${timeLeft <= 60 ? "text-red-400 animate-pulse" : "text-cyan-300"}`}>
                    ⏱️ {minutes}:{seconds.toString().padStart(2, "0")}
                </div>
                <button
                    onClick={() => setShowRole(!showRole)}
                    className="flex items-center gap-1.5 text-xs font-bold text-purple-300 hover:text-cyan-300 transition-colors bg-slate-700/40 hover:bg-slate-600/60 px-2.5 py-1.5 rounded-lg border border-slate-600/30"
                >
                    {showRole ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {showRole ? "Hide" : "Role"}
                </button>
            </motion.div>

            {/* Role reminder (toggleable) */}
            <AnimatePresence>
                {showRole && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className={`rounded-2xl px-5 py-3 text-center border backdrop-blur-sm ${
                            isSpy
                                ? "bg-red-900/40 border-red-400/50 shadow-lg shadow-red-900/50"
                                : "bg-cyan-900/40 border-cyan-400/50 shadow-lg shadow-cyan-900/50"
                        }`}>
                            {isSpy ? (
                                <p className="text-sm font-bold text-red-300">🕵️ You&apos;re the SPY!</p>
                            ) : (
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-xl animate-bounce">{myRole?.emoji}</span>
                                    <div className="text-left">
                                        <p className="text-xs text-cyan-300/70">{scenarioEmoji} {scenarioEvent}</p>
                                        <p className="text-sm font-bold text-cyan-200">{myRole?.name}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Current turn indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-slate-800/80 to-purple-900/40 border border-purple-400/40 rounded-2xl px-5 py-3 shadow-lg shadow-purple-900/30 text-center backdrop-blur-sm"
            >
                {pendingQuestion ? (
                    <p className="text-sm font-bold text-purple-300">
                        💬 <span className="text-cyan-300">{getMemberName(room.members, pendingQuestion.askerId)}</span> asked{" "}
                        <span className="text-cyan-300">{getMemberName(room.members, pendingQuestion.targetId)}</span> a question...
                    </p>
                ) : (
                    <p className="text-sm font-bold text-purple-300">
                        {isMyTurnToAsk
                            ? "🎯 <span className='text-red-300'>Your turn!</span> Pick someone to ask a question"
                            : `🎯 ${getMemberName(room.members, currentAskerId)}'s turn to ask`
                        }
                    </p>
                )}
            </motion.div>

            {/* Q&A Log */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-slate-800/80 via-purple-900/40 to-slate-800/80 border border-purple-500/30 rounded-3xl p-5 shadow-2xl shadow-purple-900/50 max-h-[300px] overflow-y-auto backdrop-blur-sm"
            >
                {qaLog.length === 0 && !pendingQuestion ? (
                    <div className="text-center py-8">
                        <MessageCircle className="w-8 h-8 text-purple-400/30 mx-auto mb-3" />
                        <p className="text-sm text-purple-300/40">No questions yet. Start asking!</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {qaLog.map((entry) => (
                            <motion.div
                                key={entry.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="border-b border-slate-700/60 pb-4 last:border-0 last:pb-0"
                            >
                                <div className="flex items-start gap-3 mb-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${getAvatarBg(entry.askerId)}`}>
                                        {getMemberName(room.members, entry.askerId).charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-purple-300/60">
                                            <span className="font-bold text-cyan-300">{getMemberName(room.members, entry.askerId)}</span>
                                            {" → "}
                                            <span className="font-bold text-cyan-300">{getMemberName(room.members, entry.targetId)}</span>
                                        </p>
                                        <p className="text-sm text-purple-200 font-medium italic">&ldquo;{entry.question}&rdquo;</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 ml-10">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${getAvatarBg(entry.targetId)}`}>
                                        {getMemberName(room.members, entry.targetId).charAt(0)}
                                    </div>
                                    <p className="text-xs text-purple-300/80 italic">&ldquo;{entry.answer}&rdquo;</p>
                                </div>
                            </motion.div>
                        ))}

                        {/* Pending question (waiting for answer) */}
                        {pendingQuestion && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="border-b border-slate-700/60 pb-4"
                            >
                                <div className="flex items-start gap-3 mb-2">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${getAvatarBg(pendingQuestion.askerId)}`}>
                                        {getMemberName(room.members, pendingQuestion.askerId).charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-purple-300/60">
                                            <span className="font-bold text-cyan-300">{getMemberName(room.members, pendingQuestion.askerId)}</span>
                                            {" → "}
                                            <span className="font-bold text-cyan-300">{getMemberName(room.members, pendingQuestion.targetId)}</span>
                                        </p>
                                        <p className="text-sm text-purple-200 font-medium italic">&ldquo;{pendingQuestion.question}&rdquo;</p>
                                    </div>
                                </div>
                                {isMyTurnToAnswer ? (
                                    <div className="ml-10 mt-2 flex gap-2">
                                        <input
                                            type="text"
                                            value={answerInput}
                                            onChange={(e) => setAnswerInput(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSendAnswer()}
                                            placeholder="Type your answer..."
                                            className="flex-1 px-3 py-2 rounded-lg border border-purple-500/30 bg-slate-700/60 text-sm text-purple-200 placeholder:text-purple-400/40 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 backdrop-blur-sm"
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleSendAnswer}
                                            disabled={!answerInput.trim()}
                                            className="px-3 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-40 shadow-lg shadow-cyan-500/30"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="ml-10 mt-2 flex items-center gap-2">
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }} className="w-2 h-2 bg-purple-400 rounded-full" />
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 bg-cyan-400 rounded-full" />
                                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 bg-purple-400 rounded-full" />
                                        <span className="text-[10px] text-purple-300/50 ml-1">
                                            Waiting for {getMemberName(room.members, pendingQuestion.targetId)} to answer...
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Ask a question (my turn, no pending question) */}
            {isMyTurnToAsk && !pendingQuestion && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-slate-800/80 via-red-900/30 to-slate-800/80 border border-red-400/40 rounded-3xl p-5 shadow-2xl shadow-red-900/30 backdrop-blur-sm"
                >
                    <p className="text-[10px] text-purple-300/60 uppercase tracking-widest font-bold text-center mb-4">
                        Pick someone to ask
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                        {room.members
                            .filter((m) => m.user_id !== currentUserId)
                            .map((m) => (
                                <motion.button
                                    key={m.user_id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedTarget(m.user_id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border-2 ${
                                        selectedTarget === m.user_id
                                            ? "bg-gradient-to-r from-red-600 to-red-700 border-red-400 text-white shadow-lg shadow-red-500/50"
                                            : "bg-slate-700/60 border-slate-600/50 text-purple-200 hover:border-red-400 hover:bg-red-900/30"
                                    }`}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold ${getAvatarBg(m.user_id)}`}>
                                        {m.first_name.charAt(0)}
                                    </div>
                                    {m.first_name}
                                </motion.button>
                            ))}
                    </div>
                    {selectedTarget && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-2"
                        >
                            <input
                                type="text"
                                value={questionInput}
                                onChange={(e) => setQuestionInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSendQuestion()}
                                placeholder={`Ask ${getMemberName(room.members, selectedTarget)} a question...`}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-red-400/40 bg-slate-700/60 text-base text-purple-200 placeholder:text-purple-400/40 focus:outline-none focus:ring-2 focus:ring-red-400/50 backdrop-blur-sm"
                                autoFocus
                            />
                            <button
                                onClick={handleSendQuestion}
                                disabled={!questionInput.trim()}
                                className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-40 shadow-lg shadow-red-600/30"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* Ready to vote button */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-3"
            >
                <button
                    onClick={handleReadyToVote}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border border-red-400/50 text-sm font-bold text-white transition-all active:scale-95 shadow-lg shadow-red-600/50"
                >
                    <Vote className="w-4 h-4" />
                    Ready to Vote ({readyToVoteCount}/{Math.ceil(room.members.length / 2)} needed)
                </button>
            </motion.div>
        </div>
    );
}
