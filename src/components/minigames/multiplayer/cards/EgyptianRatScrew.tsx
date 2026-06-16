"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { PlayingCard } from "./PlayingCard";
import { CardPile } from "./CardPile";
import { PlayerHand } from "./PlayerHand";
import { createDeck, dealCards, isFaceCard, type Card, type Rank } from "./bibleCards";
import {
    canSlap,
    getFaceCardChances,
    processChallenge,
    getNextActivePlayer,
    checkWinner,
    WRONG_SLAP_PENALTY,
    getSlapReasonText,
    type ChallengeState,
} from "./ersLogic";
import { Trophy, RotateCcw, ArrowLeft, Hand, Loader2, Eye, Shuffle, LogOut } from "lucide-react";
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

interface EgyptianRatScrewProps {
    room: GameRoom;
    currentUserId: string;
    isHost: boolean;
    onGameEnd: () => void;
    onCloseRoom: () => void;
}

interface GameState {
    phase: "dealing" | "playing" | "ended";
    turnOrder: string[];
    currentTurn: string;
    pile: Card[];
    playerCardCounts: Record<string, number>;
    challenge: ChallengeState | null;
    winnerId: string | null;
    lastAction: string;
}

interface SlapResultDisplay {
    valid: boolean;
    playerName: string;
    reason: string;
}

// ─── Helpers ────────────────────────────────────────────────

const getMemberName = (members: RoomMember[], userId: string) =>
    members.find((m) => m.user_id === userId)?.first_name || "Someone";

const getMemberAvatar = (members: RoomMember[], userId: string) =>
    members.find((m) => m.user_id === userId)?.avatar_url || "";

const POSITIONS: ("bottom" | "left" | "top" | "right")[] = ["bottom", "left", "top", "right"];

function getPlayerPosition(
    playerId: string,
    currentUserId: string,
    turnOrder: string[]
): "bottom" | "left" | "top" | "right" {
    const myIndex = turnOrder.indexOf(currentUserId);
    const theirIndex = turnOrder.indexOf(playerId);
    const relative = (theirIndex - myIndex + turnOrder.length) % turnOrder.length;
    return POSITIONS[relative % POSITIONS.length];
}

// ─── Component ──────────────────────────────────────────────

export function EgyptianRatScrew({ room, currentUserId, isHost, onGameEnd, onCloseRoom }: EgyptianRatScrewProps) {
    const supabase = createClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // ─── ALL mutable game state in refs (no stale closures) ──
    const playerHandsRef = useRef<Record<string, Card[]>>({});
    const pileRef = useRef<Card[]>([]);
    const turnOrderRef = useRef<string[]>([]);
    const currentTurnRef = useRef<string>("");
    const challengeRef = useRef<ChallengeState | null>(null);
    const processingRef = useRef(false);

    // ─── Display state (for rendering only) ──
    const [phase, setPhase] = useState<"dealing" | "playing" | "ended">("dealing");
    const [turnOrder, setTurnOrder] = useState<string[]>([]);
    const [currentTurn, setCurrentTurn] = useState<string>("");
    const [pile, setPile] = useState<Card[]>([]);
    const [playerCardCounts, setPlayerCardCounts] = useState<Record<string, number>>({});
    const [challenge, setChallenge] = useState<ChallengeState | null>(null);
    const [winnerId, setWinnerId] = useState<string | null>(null);
    const [lastAction, setLastAction] = useState<string>("");
    const [lastSlapResult, setLastSlapResult] = useState<SlapResultDisplay | null>(null);
    const [myCards, setMyCards] = useState<Card[]>([]);
    const [isPlayingCard, setIsPlayingCard] = useState(false);

    // ─── Broadcast helper (uses ref) ──
    const broadcast = useCallback((event: string, payload: any) => {
        channelRef.current?.send({ type: "broadcast", event, payload });
    }, []);

    // ═══════════════════════════════════════════════════════
    // SINGLE CHANNEL SETUP — ALL listeners registered ONCE
    // ═══════════════════════════════════════════════════════
    useEffect(() => {
        const channel = supabase.channel(`card_game:${room.id}`);

        channel
            .on("broadcast", { event: "game_state" }, ({ payload }) => {
                const gs = payload as GameState;
                setPhase(gs.phase);
                setTurnOrder(gs.turnOrder);
                setCurrentTurn(gs.currentTurn);
                setPile(gs.pile);
                setPlayerCardCounts(gs.playerCardCounts);
                setChallenge(gs.challenge);
                setWinnerId(gs.winnerId);
                setLastAction(gs.lastAction);
                // Sync refs
                turnOrderRef.current = gs.turnOrder;
                currentTurnRef.current = gs.currentTurn;
                pileRef.current = gs.pile;
                challengeRef.current = gs.challenge;
            })
            .on("broadcast", { event: "deal_hand" }, ({ payload }) => {
                if (payload.playerId === currentUserId) {
                    setMyCards(payload.cards as Card[]);
                }
            })
            .on("broadcast", { event: "card_played" }, ({ payload }) => {
                setPile(payload.pile as Card[]);
                setCurrentTurn(payload.nextTurn);
                setPlayerCardCounts(payload.playerCardCounts);
                setChallenge(payload.challenge || null);
                setLastAction(payload.action);
                setLastSlapResult(null);
                // Sync refs
                pileRef.current = payload.pile;
                currentTurnRef.current = payload.nextTurn;
                challengeRef.current = payload.challenge || null;
            })
            .on("broadcast", { event: "slap_result" }, ({ payload }) => {
                setLastSlapResult({
                    valid: payload.valid,
                    playerName: payload.playerName,
                    reason: payload.reason,
                });
                setPile(payload.pile as Card[]);
                setPlayerCardCounts(payload.playerCardCounts);
                setCurrentTurn(payload.currentTurn);
                setChallenge(payload.challenge || null);
                setLastAction(payload.action);
                // Sync refs
                pileRef.current = payload.pile;
                currentTurnRef.current = payload.currentTurn;
                challengeRef.current = payload.challenge || null;

                if (payload.updatedHand && payload.targetPlayerId === currentUserId) {
                    setMyCards(payload.updatedHand as Card[]);
                }
                setTimeout(() => setLastSlapResult(null), 2000);
            })
            .on("broadcast", { event: "pile_collected" }, ({ payload }) => {
                setPile([]);
                setPlayerCardCounts(payload.playerCardCounts);
                setCurrentTurn(payload.currentTurn);
                setChallenge(null);
                setLastAction(payload.action);
                // Sync refs
                pileRef.current = [];
                currentTurnRef.current = payload.currentTurn;
                challengeRef.current = null;

                if (payload.collectorId === currentUserId && payload.collectorHand) {
                    setMyCards(payload.collectorHand as Card[]);
                }
            })
            .on("broadcast", { event: "game_over" }, ({ payload }) => {
                setPhase("ended");
                setWinnerId(payload.winnerId);
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            })
            .on("broadcast", { event: "update_my_hand" }, ({ payload }) => {
                if (payload.playerId === currentUserId) {
                    setMyCards(payload.cards as Card[]);
                }
            })

            // ─── HOST ONLY: process play requests (from OTHER players) ───
            .on("broadcast", { event: "play_card_request" }, ({ payload }) => {
                if (!isHost) return;
                processPlayCardOnHost(payload.playerId, payload.card);
            })

            // ─── HOST ONLY: process slap requests (from OTHER players) ───
            .on("broadcast", { event: "slap_request" }, ({ payload }) => {
                if (!isHost) return;
                processSlapOnHost(payload.playerId);
            })
            .subscribe();

        channelRef.current = channel;
        return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room.id, currentUserId, isHost]);

    // ─── Host: Deal and start game ──────────────────────────
    useEffect(() => {
        if (!isHost) return;

        const timer = setTimeout(() => {
            const deck = createDeck();
            const order = room.members.map((m) => m.user_id);
            const hands = dealCards(deck, order.length);

            const handsMap: Record<string, Card[]> = {};
            const counts: Record<string, number> = {};
            order.forEach((id, i) => {
                handsMap[id] = hands[i];
                counts[id] = hands[i].length;
            });

            // Set ALL refs
            playerHandsRef.current = handsMap;
            turnOrderRef.current = order;
            currentTurnRef.current = order[0];
            pileRef.current = [];
            challengeRef.current = null;

            order.forEach((id) => {
                broadcast("deal_hand", { playerId: id, cards: handsMap[id] });
            });
            if (handsMap[currentUserId]) setMyCards(handsMap[currentUserId]);

            broadcast("game_state", {
                phase: "playing",
                turnOrder: order,
                currentTurn: order[0],
                pile: [],
                playerCardCounts: counts,
                challenge: null,
                winnerId: null,
                lastAction: "Cards dealt! Game on! 🃏",
            });

            setPhase("playing");
            setTurnOrder(order);
            setCurrentTurn(order[0]);
            setPlayerCardCounts(counts);
            setPile([]);
            setLastAction("Cards dealt! Game on! 🃏");
        }, 1500);

        return () => clearTimeout(timer);
    }, [isHost, room.members, currentUserId, broadcast]);

    // ═══════════════════════════════════════════════════════
    // HOST PROCESSING FUNCTIONS
    // ═══════════════════════════════════════════════════════

    function processPlayCardOnHost(playerId: string, card: Card) {
        if (processingRef.current) return;
        processingRef.current = true;

        try {
            const hands = playerHandsRef.current;
            const currentChallenge = challengeRef.current;
            const order = turnOrderRef.current;

            // Remove card from player's hand
            if (hands[playerId]) {
                hands[playerId] = hands[playerId].filter((c) => c.id !== card.id);
            }

            // Add to pile
            const newPile = [...pileRef.current, card];
            pileRef.current = newPile;

            const counts: Record<string, number> = {};
            Object.keys(hands).forEach((id) => {
                counts[id] = hands[id]?.length || 0;
            });

            // Process challenge if active
            let newChallenge = currentChallenge;
            let pileWinnerId: string | null = null;

            if (currentChallenge && currentChallenge.active) {
                const result = processChallenge(
                    currentChallenge,
                    card,
                    playerId,
                    (id) => getNextActivePlayer(id, order, counts)
                );
                newChallenge = result.challenge;
                pileWinnerId = result.pileWinnerId;
            } else if (isFaceCard(card.rank)) {
                const nextPlayer = getNextActivePlayer(playerId, order, counts);
                newChallenge = {
                    active: true,
                    challengerId: playerId,
                    defenderId: nextPlayer,
                    chancesRemaining: getFaceCardChances(card.rank),
                    faceCardRank: card.rank,
                };
            }

            if (pileWinnerId) {
                // Challenger wins the pile
                const collectorHand = [...(hands[pileWinnerId] || []), ...newPile];
                hands[pileWinnerId] = collectorHand;
                pileRef.current = [];

                const updatedCounts: Record<string, number> = {};
                Object.keys(hands).forEach((id) => {
                    updatedCounts[id] = hands[id]?.length || 0;
                });

                const nextTurn = getNextActivePlayer(pileWinnerId, order, updatedCounts);
                currentTurnRef.current = nextTurn;
                challengeRef.current = null;

                const action = `${getMemberName(room.members, pileWinnerId)} takes the pile! (${newPile.length} cards)`;

                broadcast("pile_collected", {
                    collectorId: pileWinnerId,
                    collectorHand: pileWinnerId === currentUserId ? collectorHand : undefined,
                    playerCardCounts: updatedCounts,
                    currentTurn: nextTurn,
                    action,
                });

                if (pileWinnerId !== currentUserId) {
                    broadcast("update_my_hand", { playerId: pileWinnerId, cards: collectorHand });
                } else {
                    setMyCards(collectorHand);
                }

                // Host display
                setPile([]);
                setPlayerCardCounts(updatedCounts);
                setCurrentTurn(nextTurn);
                setChallenge(null);
                setLastAction(action);

                const winner = checkWinner(order, updatedCounts, 52);
                if (winner) {
                    broadcast("game_over", { winnerId: winner });
                    setPhase("ended");
                    setWinnerId(winner);
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }
                return;
            }

            // Determine next turn — skip eliminated players
            let nextTurn: string;
            if (newChallenge && newChallenge.active) {
                nextTurn = newChallenge.defenderId;
            } else {
                nextTurn = getNextActivePlayer(playerId, order, counts);
            }

            currentTurnRef.current = nextTurn;
            challengeRef.current = newChallenge;

            const characterName = card.character
                ? `${card.character} (${card.rank})`
                : `${card.rank}`;
            const actionText = `${getMemberName(room.members, playerId)} played ${characterName}`;

            broadcast("card_played", {
                pile: newPile,
                nextTurn,
                playerCardCounts: counts,
                challenge: newChallenge,
                action: actionText,
            });

            // Host display
            setPile(newPile);
            setCurrentTurn(nextTurn);
            setPlayerCardCounts(counts);
            setChallenge(newChallenge);
            setLastAction(actionText);

            const winner = checkWinner(order, counts, 52);
            if (winner) {
                setTimeout(() => {
                    broadcast("game_over", { winnerId: winner });
                    setPhase("ended");
                    setWinnerId(winner);
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }, 500);
            }
        } finally {
            processingRef.current = false;
        }
    }

    function processSlapOnHost(playerId: string) {
        if (processingRef.current) return;
        processingRef.current = true;

        try {
            const hands = playerHandsRef.current;
            const currentPile = pileRef.current;
            const order = turnOrderRef.current;
            const slapResult = canSlap(currentPile);

            if (slapResult.valid) {
                const collectorHand = [...(hands[playerId] || []), ...currentPile];
                hands[playerId] = collectorHand;
                pileRef.current = [];

                const counts: Record<string, number> = {};
                Object.keys(hands).forEach((id) => {
                    counts[id] = hands[id]?.length || 0;
                });

                const nextTurn = getNextActivePlayer(playerId, order, counts);
                currentTurnRef.current = nextTurn;
                challengeRef.current = null;

                const action = `${getMemberName(room.members, playerId)} slapped — ${getSlapReasonText(slapResult.reason)} Takes ${currentPile.length} cards!`;

                broadcast("slap_result", {
                    valid: true,
                    playerName: getMemberName(room.members, playerId),
                    reason: getSlapReasonText(slapResult.reason),
                    pile: [],
                    playerCardCounts: counts,
                    currentTurn: nextTurn,
                    challenge: null,
                    action,
                    targetPlayerId: playerId,
                    updatedHand: playerId === currentUserId ? undefined : collectorHand,
                });

                if (playerId === currentUserId) {
                    setMyCards(collectorHand);
                } else {
                    broadcast("update_my_hand", { playerId, cards: collectorHand });
                }

                // Host display
                setPile([]);
                setPlayerCardCounts(counts);
                setCurrentTurn(nextTurn);
                setChallenge(null);
                setLastAction(action);

                const winner = checkWinner(order, counts, 52);
                if (winner) {
                    setTimeout(() => {
                        broadcast("game_over", { winnerId: winner });
                        setPhase("ended");
                        setWinnerId(winner);
                    }, 1000);
                }
            } else {
                // Wrong slap — penalty
                const playerHand = hands[playerId] || [];
                const penaltyCards = playerHand.splice(0, Math.min(WRONG_SLAP_PENALTY, playerHand.length));
                const newPile = [...penaltyCards, ...currentPile];
                hands[playerId] = playerHand;
                pileRef.current = newPile;

                const counts: Record<string, number> = {};
                Object.keys(hands).forEach((id) => {
                    counts[id] = hands[id]?.length || 0;
                });

                const action = `${getMemberName(room.members, playerId)} slapped wrong! Penalty: ${penaltyCards.length} cards to the pile.`;

                broadcast("slap_result", {
                    valid: false,
                    playerName: getMemberName(room.members, playerId),
                    reason: "Wrong slap! ❌",
                    pile: newPile,
                    playerCardCounts: counts,
                    currentTurn: currentTurnRef.current,
                    challenge: challengeRef.current,
                    action,
                    targetPlayerId: playerId,
                    updatedHand: playerHand,
                });

                if (playerId === currentUserId) {
                    setMyCards([...playerHand]);
                } else {
                    broadcast("update_my_hand", { playerId, cards: playerHand });
                }

                // Host display
                setPile(newPile);
                setPlayerCardCounts(counts);
                setLastAction(action);
            }
        } finally {
            processingRef.current = false;
        }
    }

    // ─── Play a card (client side) ──────────────────────────
    const handlePlayCard = useCallback(() => {
        if (myCards.length === 0 || isPlayingCard) return;

        // In a challenge, only the defender can play
        if (challenge && challenge.defenderId !== currentUserId) return;
        // Otherwise, must be your turn
        if (!challenge && currentTurn !== currentUserId) return;

        setIsPlayingCard(true);

        const cardToPlay = myCards[0];
        setMyCards(prev => prev.slice(1));

        if (isHost) {
            // ★ Host: process directly (broadcast won't echo back)
            processPlayCardOnHost(currentUserId, cardToPlay);
        } else {
            broadcast("play_card_request", {
                playerId: currentUserId,
                card: cardToPlay,
            });
        }

        setTimeout(() => setIsPlayingCard(false), 300);
    }, [myCards, currentTurn, currentUserId, challenge, isPlayingCard, broadcast, isHost]);

    // ─── Slap the pile (client side) ────────────────────────
    const handleSlap = useCallback(() => {
        if (isHost) {
            // ★ Host: process directly
            processSlapOnHost(currentUserId);
        } else {
            broadcast("slap_request", {
                playerId: currentUserId,
                timestamp: Date.now(),
            });
        }
    }, [currentUserId, broadcast, isHost]);

    // ─── Play again ─────────────────────────────────────────
    const handlePlayAgain = useCallback(() => {
        setPhase("dealing");
        setPile([]);
        setChallenge(null);
        setWinnerId(null);
        setMyCards([]);
        setLastAction("");
        setLastSlapResult(null);
        playerHandsRef.current = {};
        pileRef.current = [];
        challengeRef.current = null;

        broadcast("game_state", {
            phase: "dealing",
            turnOrder: [],
            currentTurn: "",
            pile: [],
            playerCardCounts: {},
            challenge: null,
            winnerId: null,
            lastAction: "Shuffling cards... 🃏",
        });

        setTimeout(() => {
            const deck = createDeck();
            const order = room.members.map((m) => m.user_id);
            const hands = dealCards(deck, order.length);

            const handsMap: Record<string, Card[]> = {};
            const counts: Record<string, number> = {};
            order.forEach((id, i) => {
                handsMap[id] = hands[i];
                counts[id] = hands[i].length;
            });

            playerHandsRef.current = handsMap;
            turnOrderRef.current = order;
            currentTurnRef.current = order[0];
            pileRef.current = [];
            challengeRef.current = null;

            order.forEach((id) => {
                broadcast("deal_hand", { playerId: id, cards: handsMap[id] });
            });
            if (handsMap[currentUserId]) setMyCards(handsMap[currentUserId]);

            broadcast("game_state", {
                phase: "playing",
                turnOrder: order,
                currentTurn: order[0],
                pile: [],
                playerCardCounts: counts,
                challenge: null,
                winnerId: null,
                lastAction: "New round! Game on! 🃏",
            });

            setPhase("playing");
            setTurnOrder(order);
            setCurrentTurn(order[0]);
            setPlayerCardCounts(counts);
        }, 1500);
    }, [room.members, currentUserId, broadcast]);

    // ═══════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════

    const isMyTurn = currentTurn === currentUserId;
    const amDefender = challenge?.defenderId === currentUserId;
    const canPlayCard = (isMyTurn && !challenge) || amDefender;
    const canSlapPile = pile.length >= 2;
    const isEliminated = myCards.length === 0 && phase === "playing" && Object.keys(playerCardCounts).length > 0;

    // ─── Dealing Phase ──────────────────────────────────────
    if (phase === "dealing") {
        return (
            <div className="w-full bg-white/50 border border-warm-grey/5 rounded-3xl p-8 shadow-sm text-center">
                <motion.div
                    animate={{ rotateY: [0, 360] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="text-5xl mb-4 inline-block"
                >
                    🃏
                </motion.div>
                <h3 className="font-serif text-lg font-bold text-warm-cocoa mb-2">Dealing Cards...</h3>
                <p className="text-xs text-warm-grey/50">Shuffling the Bible deck ✨</p>
                <div className="mt-4 flex items-center justify-center gap-1.5">
                    <div className="w-2 h-2 bg-warm-cocoa/30 rounded-full animate-bounce [animation-delay:0ms]" />
                    <div className="w-2 h-2 bg-warm-cocoa/30 rounded-full animate-bounce [animation-delay:150ms]" />
                    <div className="w-2 h-2 bg-warm-cocoa/30 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
            </div>
        );
    }

    // ─── End Screen ─────────────────────────────────────────
    if (phase === "ended" && winnerId) {
        const winnerName = getMemberName(room.members, winnerId);
        const isWinner = winnerId === currentUserId;

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
                    {isWinner
                        ? "You collected all 52 cards! Amazing! ✨"
                        : `${winnerName} collected all the cards!`}
                </p>

                <div className="bg-gradient-to-br from-amber-50 to-stone-50 rounded-2xl p-5 mb-6 border border-amber-100 inline-flex items-center gap-3">
                    <span className="text-3xl">🃏</span>
                    <div className="text-left">
                        <p className="text-[10px] text-warm-grey/50 uppercase tracking-wider font-bold">Winner</p>
                        <p className="font-serif text-lg text-warm-cocoa font-bold">{winnerName}</p>
                    </div>
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

                {!isHost && (
                    <p className="text-[10px] text-warm-grey/40 italic mt-4">Waiting for the host to continue...</p>
                )}
            </motion.div>
        );
    }

    // ─── Playing Phase ──────────────────────────────────────
    return (
        <div className="w-full flex flex-col gap-4">
            {/* Status Bar */}
            <div className="flex items-center justify-between bg-white/50 border border-warm-grey/5 rounded-2xl px-4 py-2.5 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-bold text-warm-grey/50">
                    🃏 Egyptian Rat Screw
                </div>
                <div className="text-[10px] text-warm-cocoa font-bold max-w-[200px] truncate">
                    {lastAction}
                </div>
                <div className="text-[10px] font-bold text-warm-grey/40">
                    {isEliminated ? "👁️ Spectating" : `Your cards: ${myCards.length}`}
                </div>
            </div>

            {/* Spectator Banner */}
            <AnimatePresence>
                {isEliminated && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-stone-100 border border-stone-200/50 rounded-2xl px-4 py-3 text-center"
                    >
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-warm-grey">
                            <Eye className="w-4 h-4" />
                            You&apos;re out of cards! Spectating the game...
                        </div>
                        <p className="text-[9px] text-warm-grey/50 mt-1">
                            Watch the action unfold! 👀
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Challenge Info */}
            <AnimatePresence>
                {challenge && challenge.active && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-amber-50 border border-amber-200/50 rounded-2xl px-4 py-2.5 text-center"
                    >
                        <p className="text-xs font-bold text-amber-800">
                            ⚡ Face card challenge! {getMemberName(room.members, challenge.defenderId)} has{" "}
                            <span className="text-amber-900 text-sm">{challenge.chancesRemaining}</span>{" "}
                            {challenge.chancesRemaining === 1 ? "chance" : "chances"} to play a face card
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Game Table */}
            <div className="relative bg-white/30 border border-warm-grey/5 rounded-3xl p-4 shadow-sm min-h-[400px] flex flex-col items-center justify-center gap-6">
                {/* Other Players (top/sides) */}
                <div className="w-full flex flex-wrap items-center justify-center gap-3 mb-2">
                    {turnOrder
                        .filter((id) => id !== currentUserId)
                        .map((id) => (
                            <PlayerHand
                                key={id}
                                playerId={id}
                                name={getMemberName(room.members, id)}
                                avatarUrl={getMemberAvatar(room.members, id)}
                                cardCount={playerCardCounts[id] || 0}
                                isActive={
                                    challenge
                                        ? challenge.defenderId === id
                                        : currentTurn === id
                                }
                                isCurrentUser={false}
                                isEliminated={(playerCardCounts[id] || 0) === 0}
                                position={getPlayerPosition(id, currentUserId, turnOrder)}
                            />
                        ))}
                </div>

                {/* Center Pile */}
                <div className="flex-1 flex items-center justify-center min-h-[160px]">
                    <CardPile pile={pile} lastSlapResult={lastSlapResult} />
                </div>

                {/* Current Player (bottom) */}
                <div className="w-full flex flex-col items-center gap-3">
                    {/* Your info */}
                    <PlayerHand
                        playerId={currentUserId}
                        name={getMemberName(room.members, currentUserId)}
                        avatarUrl={getMemberAvatar(room.members, currentUserId)}
                        cardCount={myCards.length}
                        isActive={canPlayCard}
                        isCurrentUser={true}
                        isEliminated={isEliminated}
                        position="bottom"
                    />

                    {/* Action Buttons — hidden when spectating */}
                    {!isEliminated && (
                        <div className="flex items-center gap-3">
                            {/* Play Card Button */}
                            <button
                                onClick={handlePlayCard}
                                disabled={!canPlayCard || myCards.length === 0 || isPlayingCard}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                                    canPlayCard && myCards.length > 0
                                        ? "bg-warm-cocoa text-white shadow-lg shadow-warm-cocoa/20 hover:bg-warm-cocoa/90"
                                        : "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                                }`}
                            >
                                {isPlayingCard ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <span className="text-lg">🃏</span>
                                )}
                                {canPlayCard ? "Play Card" : "Wait..."}
                            </button>

                            {/* Slap Button — anyone can slap, even when not their turn */}
                            <button
                                onClick={handleSlap}
                                disabled={!canSlapPile}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                                    canSlapPile
                                        ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600 animate-pulse"
                                        : "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                                }`}
                            >
                                <Hand className="w-4 h-4" />
                                SLAP!
                            </button>
                        </div>
                    )}

                    {/* No card preview — in ERS you play blind! */}
                </div>
            </div>
        </div>
    );
}
