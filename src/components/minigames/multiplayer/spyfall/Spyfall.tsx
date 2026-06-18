"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getRandomScenario, type SpyfallScenario, type SpyfallRole } from "./spyfallScenarios";
import { Trophy, RotateCcw, ArrowLeft, Send, Eye, EyeOff, Vote, Timer, MessageCircle, UserX, Users, Shuffle, LogOut } from "lucide-react";
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
        "bg-pink-100 text-pink-700 border-pink-200/50",
        "bg-emerald-100 text-emerald-800 border-emerald-200/50",
        "bg-purple-100 text-purple-800 border-purple-200/50",
        "bg-amber-100 text-amber-800 border-amber-200/50",
        "bg-rose-100 text-rose-800 border-rose-200/50",
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
            <div className="w-full flex flex-col gap-4">
                <div className="bg-white/50 border border-warm-grey/5 rounded-3xl p-6 shadow-sm text-center">
                    <motion.div
                        initial={{ scale: 0, rotateY: 180 }}
                        animate={{ scale: 1, rotateY: 0 }}
                        transition={{ type: "spring", damping: 15 }}
                        className="mb-4"
                    >
                        <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-5xl border-4 ${
                            isSpy
                                ? "bg-red-50 border-red-300 shadow-lg shadow-red-200/50"
                                : "bg-amber-50 border-amber-300 shadow-lg shadow-amber-200/50"
                        }`}>
                            {isSpy ? "🕵️" : (myRole?.emoji || "❓")}
                        </div>
                    </motion.div>

                    {isSpy ? (
                        <>
                            <h2 className="font-serif text-2xl text-red-700 font-bold mb-2">You&apos;re the Spy! 🕵️</h2>
                            <p className="text-xs text-warm-grey/50 max-w-xs mx-auto">
                                You don&apos;t know the event or your role. Ask clever questions and
                                figure it out — but don&apos;t blow your cover!
                            </p>
                        </>
                    ) : (
                        <>
                            <h2 className="font-serif text-xl text-warm-cocoa font-bold mb-1">
                                {scenarioEmoji} {scenarioEvent}
                            </h2>
                            <p className="text-[10px] text-warm-grey/50 italic mb-3">{scenarioDesc}</p>
                            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200/50 rounded-xl px-4 py-2">
                                <span className="text-lg">{myRole?.emoji}</span>
                                <div className="text-left">
                                    <p className="text-[9px] text-warm-grey/40 uppercase tracking-wider font-bold">Your Role</p>
                                    <p className="text-sm font-bold text-warm-cocoa">{myRole?.name}</p>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="mt-5 flex items-center justify-center gap-1.5">
                        <div className="w-2 h-2 bg-warm-cocoa/30 rounded-full animate-bounce [animation-delay:0ms]" />
                        <div className="w-2 h-2 bg-warm-cocoa/30 rounded-full animate-bounce [animation-delay:150ms]" />
                        <div className="w-2 h-2 bg-warm-cocoa/30 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                    <p className="text-[9px] text-warm-grey/40 mt-2">Starting soon...</p>
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full bg-white/50 border border-warm-grey/5 rounded-3xl p-6 shadow-sm text-center"
            >
                {/* Result banner */}
                <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl mb-4 border-2 ${
                    result.spyCaught
                        ? "bg-emerald-50 border-emerald-300"
                        : "bg-red-50 border-red-300"
                }`}>
                    {result.spyCaught ? "🎉" : "🕵️"}
                </div>

                <h2 className="font-serif text-2xl text-warm-cocoa font-bold mb-2">
                    {result.spyCaught
                        ? (iWasSpy ? "You Got Caught! 😅" : "Spy Caught! 🎉")
                        : (iWasSpy ? "You Got Away! 😎" : "The Spy Escaped! 😱")
                    }
                </h2>

                <p className="text-xs text-warm-grey/50 mb-4">
                    The spy was <span className="font-bold text-warm-cocoa">{spyName}</span>
                </p>

                {/* Scenario reveal */}
                <div className="bg-amber-50 border border-amber-200/50 rounded-2xl p-4 mb-4 inline-block">
                    <span className="text-2xl">{result.scenario.emoji}</span>
                    <p className="text-xs font-bold text-amber-800 mt-1">{result.scenario.event}</p>
                    <p className="text-[9px] text-amber-600">{result.scenario.description}</p>
                </div>

                {/* Vote breakdown */}
                <div className="bg-stone-50 rounded-2xl p-3 mb-4 text-left max-w-xs mx-auto">
                    <p className="text-[9px] text-warm-grey/40 uppercase tracking-wider font-bold mb-2 text-center">Votes</p>
                    {Object.entries(votes).map(([voterId, votedFor]) => (
                        <div key={voterId} className="flex items-center gap-2 text-[10px] py-1">
                            <span className="font-bold text-warm-cocoa">{getMemberName(room.members, voterId)}</span>
                            <span className="text-warm-grey/40">voted for</span>
                            <span className={`font-bold ${votedFor === result.spyId ? "text-emerald-600" : "text-rose-500"}`}>
                                {getMemberName(room.members, votedFor)}
                                {votedFor === result.spyId ? " ✓" : " ✗"}
                            </span>
                        </div>
                    ))}
                </div>

                {isHost && (
                    <div className="flex flex-col gap-2 mt-4">
                        <button onClick={handlePlayAgain} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-warm-cocoa text-white font-serif text-sm font-bold transition-all active:scale-95 shadow-lg shadow-warm-cocoa/20">
                            <RotateCcw className="w-4 h-4" /> Play Again
                        </button>
                        <button onClick={onGameEnd} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/50 text-xs font-bold text-amber-800 transition-all active:scale-95">
                            <Shuffle className="w-3.5 h-3.5" /> Choose Another Game
                        </button>
                        <button onClick={onCloseRoom} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-xs font-bold text-rose-700 transition-all active:scale-95">
                            <LogOut className="w-3.5 h-3.5" /> Close Room
                        </button>
                    </div>
                )}
                {!isHost && <p className="text-[10px] text-warm-grey/40 italic mt-4">Waiting for the host to continue...</p>}
            </motion.div>
        );
    }

    // ─── Voting Phase ──
    if (phase === "voting") {
        return (
            <div className="w-full flex flex-col gap-4">
                <div className="flex items-center justify-between bg-white/50 border border-warm-grey/5 rounded-2xl px-4 py-2.5 shadow-sm">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-warm-grey/50">🕵️ Bible Spyfall</div>
                    <div className="text-xs font-bold text-rose-600">⏱️ Voting Time!</div>
                    <div className="text-[10px] font-bold text-warm-grey/40">
                        {voteCount}/{room.members.length} voted
                    </div>
                </div>

                <div className="bg-white/50 border border-warm-grey/5 rounded-3xl p-5 shadow-sm text-center">
                    <Vote className="w-8 h-8 text-warm-cocoa mx-auto mb-3" />
                    <h3 className="font-serif text-lg font-bold text-warm-cocoa mb-1">
                        {myVote ? "Vote Submitted!" : "Who is the Spy?"}
                    </h3>
                    <p className="text-[10px] text-warm-grey/50 mb-4">
                        {myVote ? "Waiting for everyone to vote..." : "Click on who you think is the spy"}
                    </p>

                    <div className="flex flex-col gap-2 max-w-xs mx-auto">
                        {room.members.map((m) => (
                            <button
                                key={m.user_id}
                                onClick={() => handleVote(m.user_id)}
                                disabled={!!myVote || m.user_id === currentUserId}
                                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all active:scale-[0.98] ${
                                    myVote === m.user_id
                                        ? "bg-rose-50 border-2 border-rose-400 ring-2 ring-rose-200"
                                        : m.user_id === currentUserId
                                        ? "bg-stone-50 border border-stone-200/30 opacity-40"
                                        : myVote
                                        ? "bg-white border border-stone-200/30 opacity-40"
                                        : "bg-white hover:bg-rose-50 border border-stone-200/30 cursor-pointer hover:border-rose-200"
                                }`}
                            >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarBg(m.user_id)}`}>
                                    {m.first_name.charAt(0)}
                                </div>
                                <span className="text-xs font-bold text-warm-cocoa flex-1 text-left">
                                    {m.first_name}
                                    {m.user_id === currentUserId && " (You)"}
                                </span>
                                {myVote === m.user_id && (
                                    <span className="text-xs text-rose-600 font-bold">🗳️</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ─── Asking Phase ──
    return (
        <div className="w-full flex flex-col gap-4">
            {/* Status Bar */}
            <div className="flex items-center justify-between bg-white/50 border border-warm-grey/5 rounded-2xl px-4 py-2.5 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-bold text-warm-grey/50">
                    🕵️ Bible Spyfall
                </div>
                <div className={`text-xs font-bold ${timeLeft <= 60 ? "text-rose-500 animate-pulse" : "text-warm-cocoa"}`}>
                    ⏱️ {minutes}:{seconds.toString().padStart(2, "0")}
                </div>
                <button
                    onClick={() => setShowRole(!showRole)}
                    className="flex items-center gap-1 text-[10px] font-bold text-warm-grey/50 hover:text-warm-cocoa transition-colors"
                >
                    {showRole ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showRole ? "Hide" : "Role"}
                </button>
            </div>

            {/* Role reminder (toggleable) */}
            <AnimatePresence>
                {showRole && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className={`rounded-2xl px-4 py-3 text-center ${
                            isSpy ? "bg-red-50 border border-red-200/50" : "bg-amber-50 border border-amber-200/50"
                        }`}>
                            {isSpy ? (
                                <p className="text-xs font-bold text-red-700">🕵️ You&apos;re the Spy!</p>
                            ) : (
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-lg">{myRole?.emoji}</span>
                                    <div className="text-left">
                                        <p className="text-[9px] text-amber-600">{scenarioEmoji} {scenarioEvent}</p>
                                        <p className="text-xs font-bold text-amber-800">{myRole?.name}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Current turn indicator */}
            <div className="bg-white/50 border border-warm-grey/5 rounded-2xl px-4 py-2.5 shadow-sm text-center">
                {pendingQuestion ? (
                    <p className="text-xs font-bold text-warm-cocoa">
                        💬 {getMemberName(room.members, pendingQuestion.askerId)} asked{" "}
                        {getMemberName(room.members, pendingQuestion.targetId)} a question...
                    </p>
                ) : (
                    <p className="text-xs font-bold text-warm-cocoa">
                        {isMyTurnToAsk
                            ? "🎯 Your turn! Pick someone to ask a question"
                            : `🎯 ${getMemberName(room.members, currentAskerId)}'s turn to ask`
                        }
                    </p>
                )}
            </div>

            {/* Q&A Log */}
            <div className="bg-white/50 border border-warm-grey/5 rounded-3xl p-4 shadow-sm max-h-[300px] overflow-y-auto">
                {qaLog.length === 0 && !pendingQuestion ? (
                    <div className="text-center py-6">
                        <MessageCircle className="w-6 h-6 text-warm-grey/20 mx-auto mb-2" />
                        <p className="text-[10px] text-warm-grey/30">No questions yet. Start asking!</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {qaLog.map((entry) => (
                            <div key={entry.id} className="border-b border-stone-100/60 pb-3 last:border-0 last:pb-0">
                                <div className="flex items-start gap-2 mb-1.5">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${getAvatarBg(entry.askerId)}`}>
                                        {getMemberName(room.members, entry.askerId).charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-warm-grey/40">
                                            <span className="font-bold text-warm-cocoa">{getMemberName(room.members, entry.askerId)}</span>
                                            {" → "}
                                            <span className="font-bold text-warm-cocoa">{getMemberName(room.members, entry.targetId)}</span>
                                        </p>
                                        <p className="text-xs text-warm-cocoa font-medium">&ldquo;{entry.question}&rdquo;</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 ml-8">
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0 ${getAvatarBg(entry.targetId)}`}>
                                        {getMemberName(room.members, entry.targetId).charAt(0)}
                                    </div>
                                    <p className="text-xs text-warm-grey italic">&ldquo;{entry.answer}&rdquo;</p>
                                </div>
                            </div>
                        ))}

                        {/* Pending question (waiting for answer) */}
                        {pendingQuestion && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="border-b border-stone-100/60 pb-3"
                            >
                                <div className="flex items-start gap-2 mb-1.5">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${getAvatarBg(pendingQuestion.askerId)}`}>
                                        {getMemberName(room.members, pendingQuestion.askerId).charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-warm-grey/40">
                                            <span className="font-bold text-warm-cocoa">{getMemberName(room.members, pendingQuestion.askerId)}</span>
                                            {" → "}
                                            <span className="font-bold text-warm-cocoa">{getMemberName(room.members, pendingQuestion.targetId)}</span>
                                        </p>
                                        <p className="text-xs text-warm-cocoa font-medium">&ldquo;{pendingQuestion.question}&rdquo;</p>
                                    </div>
                                </div>
                                {isMyTurnToAnswer ? (
                                    <div className="ml-8 mt-1 flex gap-2">
                                        <input
                                            type="text"
                                            value={answerInput}
                                            onChange={(e) => setAnswerInput(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleSendAnswer()}
                                            placeholder="Type your answer..."
                                            className="flex-1 px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs text-warm-cocoa placeholder:text-warm-grey/30 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                                            autoFocus
                                        />
                                        <button onClick={handleSendAnswer} disabled={!answerInput.trim()}
                                            className="px-3 py-2 rounded-xl bg-warm-cocoa text-white text-xs font-bold transition-all active:scale-95 disabled:opacity-40">
                                            <Send className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="ml-8 mt-1 flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-warm-cocoa/30 rounded-full animate-bounce [animation-delay:0ms]" />
                                        <div className="w-2 h-2 bg-warm-cocoa/30 rounded-full animate-bounce [animation-delay:150ms]" />
                                        <div className="w-2 h-2 bg-warm-cocoa/30 rounded-full animate-bounce [animation-delay:300ms]" />
                                        <span className="text-[9px] text-warm-grey/40 ml-1">
                                            Waiting for {getMemberName(room.members, pendingQuestion.targetId)} to answer...
                                        </span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                )}
            </div>

            {/* Ask a question (my turn, no pending question) */}
            {isMyTurnToAsk && !pendingQuestion && (
                <div className="bg-white/50 border border-amber-200/30 rounded-3xl p-4 shadow-sm">
                    <p className="text-[9px] text-warm-grey/40 uppercase tracking-wider font-bold text-center mb-3">
                        Pick someone to ask
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                        {room.members
                            .filter((m) => m.user_id !== currentUserId)
                            .map((m) => (
                                <button
                                    key={m.user_id}
                                    onClick={() => setSelectedTarget(m.user_id)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                                        selectedTarget === m.user_id
                                            ? "bg-amber-50 border-2 border-amber-400 text-amber-800"
                                            : "bg-white border border-stone-200/30 text-warm-cocoa hover:border-amber-200"
                                    }`}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold ${getAvatarBg(m.user_id)}`}>
                                        {m.first_name.charAt(0)}
                                    </div>
                                    {m.first_name}
                                </button>
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
                                className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm text-warm-cocoa placeholder:text-warm-grey/30 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                                autoFocus
                            />
                            <button onClick={handleSendQuestion} disabled={!questionInput.trim()}
                                className="px-4 py-2.5 rounded-xl bg-warm-cocoa text-white font-bold text-xs transition-all active:scale-95 disabled:opacity-40">
                                <Send className="w-4 h-4" />
                            </button>
                        </motion.div>
                    )}
                </div>
            )}

            {/* Ready to vote button */}
            <div className="flex items-center justify-center gap-3">
                <button
                    onClick={handleReadyToVote}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-xs font-bold text-rose-700 transition-all active:scale-95"
                >
                    <Vote className="w-3.5 h-3.5" />
                    Ready to Vote ({readyToVoteCount}/{Math.ceil(room.members.length / 2)} needed)
                </button>
            </div>
        </div>
    );
}
