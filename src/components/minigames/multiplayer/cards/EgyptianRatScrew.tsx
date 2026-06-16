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
            <div className="w-full rounded-3xl p-10 text-center relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #1a5c2e 0%, #0d3b1c 70%, #082810 100%)' }}>
                {/* Noise overlay */}
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '128px 128px' }} />
                {/* Inner glow ring */}
                <div className="absolute inset-3 rounded-2xl border border-white/10 pointer-events-none" />
                <motion.div
                    animate={{ rotateY: [0, 360], scale: [1, 1.1, 1] }}
                    transition={{ rotateY: { repeat: Infinity, duration: 1.5, ease: "linear" }, scale: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
                    className="text-7xl mb-5 inline-block drop-shadow-[0_0_24px_rgba(255,215,0,0.5)] relative z-10"
                >
                    🃏
                </motion.div>
                <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.25) 0%, transparent 70%)' }}
                />
                <h3 className="font-serif text-2xl font-bold text-white mb-2 relative z-10 drop-shadow-md">Dealing Cards...</h3>
                <p className="text-sm text-emerald-200/70 relative z-10">Shuffling the Bible deck ✨</p>
                <div className="mt-5 flex items-center justify-center gap-2 relative z-10">
                    <div className="w-2.5 h-2.5 bg-emerald-300/60 rounded-full animate-bounce [animation-delay:0ms]" />
                    <div className="w-2.5 h-2.5 bg-emerald-300/60 rounded-full animate-bounce [animation-delay:150ms]" />
                    <div className="w-2.5 h-2.5 bg-emerald-300/60 rounded-full animate-bounce [animation-delay:300ms]" />
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
                className="w-full rounded-3xl p-8 text-center relative overflow-hidden border border-amber-200/30"
                style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 30%, #fde68a 100%)' }}
            >
                {/* Decorative shimmer */}
                <motion.div
                    animate={{ opacity: [0.15, 0.35, 0.15] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 50% 30%, rgba(245,158,11,0.3) 0%, transparent 60%)' }}
                />
                <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 relative z-10"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 0 30px rgba(245,158,11,0.4), 0 4px 15px rgba(0,0,0,0.1)' }}
                >
                    <Trophy className="w-10 h-10 text-white drop-shadow-md" />
                </motion.div>

                <h2 className="font-serif text-3xl font-bold mb-2 relative z-10" style={{ color: '#92400e', textShadow: '0 0 20px rgba(245,158,11,0.3)' }}>
                    {isWinner ? "🎉 You Win! 🎉" : `${winnerName} Wins! 👑`}
                </h2>
                <p className="text-sm text-amber-800/60 mb-6 relative z-10">
                    {isWinner
                        ? "You collected all 52 cards! Amazing! ✨"
                        : `${winnerName} collected all the cards!`}
                </p>

                <div className="relative z-10 rounded-2xl p-5 mb-6 inline-flex items-center gap-4 border border-amber-300/50" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(254,243,199,0.8))', backdropFilter: 'blur(8px)' }}>
                    <span className="text-4xl drop-shadow-md">🃏</span>
                    <div className="text-left">
                        <p className="text-[10px] text-amber-700/60 uppercase tracking-wider font-bold">🏆 Winner</p>
                        <p className="font-serif text-xl text-amber-900 font-bold">{winnerName}</p>
                    </div>
                </div>

                {isHost && (
                    <div className="flex flex-col gap-2.5 mt-5 relative z-10">
                        <button onClick={handlePlayAgain} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-serif text-sm font-bold transition-all active:scale-95" style={{ background: 'linear-gradient(135deg, #78350f, #92400e)', boxShadow: '0 4px 15px rgba(120,53,15,0.3)' }}>
                            <RotateCcw className="w-4 h-4" /> Play Again
                        </button>
                        <button onClick={onGameEnd} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/70 hover:bg-white/90 border border-amber-300/50 text-xs font-bold text-amber-800 transition-all active:scale-95 backdrop-blur-sm">
                            <Shuffle className="w-3.5 h-3.5" /> Choose Another Game
                        </button>
                        <button onClick={onCloseRoom} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50/80 hover:bg-rose-100 border border-rose-300/50 text-xs font-bold text-rose-700 transition-all active:scale-95 backdrop-blur-sm">
                            <LogOut className="w-3.5 h-3.5" /> Close Room
                        </button>
                    </div>
                )}

                {!isHost && (
                    <p className="text-[11px] text-amber-700/50 italic mt-5 relative z-10">Waiting for the host to continue...</p>
                )}
            </motion.div>
        );
    }

    // ─── Playing Phase ──────────────────────────────────────
    return (
        <div className="w-full flex flex-col gap-4">
            {/* Status Bar */}
            <div className="flex items-center justify-between rounded-2xl px-4 py-3 border border-amber-200/30" style={{ background: 'linear-gradient(135deg, #fefce8, #fef9c3, #fef3c7)', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800/70">
                    <span className="text-base">🃏</span> Egyptian Rat Screw
                </div>
                <div className="text-xs text-warm-cocoa font-bold max-w-[200px] truncate">
                    {lastAction}
                </div>
                <div className="text-xs font-bold text-amber-700/50">
                    {isEliminated ? "👁️ Spectating" : `🎴 ${myCards.length} cards`}
                </div>
            </div>

            {/* Spectator Banner */}
            <AnimatePresence>
                {isEliminated && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="rounded-2xl px-4 py-3.5 text-center border border-indigo-200/50"
                        style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff, #c7d2fe)' }}
                    >
                        <div className="flex items-center justify-center gap-2 text-sm font-bold text-indigo-800">
                            <Eye className="w-4.5 h-4.5 text-indigo-500" />
                            You&apos;re out of cards! Spectating the game...
                        </div>
                        <p className="text-[10px] text-indigo-600/50 mt-1">
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
                        className="rounded-2xl px-4 py-3 text-center border border-amber-300/60"
                        style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7, #fde68a)', boxShadow: '0 2px 12px rgba(245,158,11,0.15)' }}
                    >
                        <p className="text-sm font-bold text-amber-900">
                            ⚡ Face card challenge! {getMemberName(room.members, challenge.defenderId)} has{" "}
                            <span className="text-amber-950 text-base font-extrabold">{challenge.chancesRemaining}</span>{" "}
                            {challenge.chancesRemaining === 1 ? "chance" : "chances"} to play a face card
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Game Table */}
            <div className="relative rounded-3xl p-4 min-h-[400px] flex flex-col items-center justify-center gap-6 overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #1a5c2e 0%, #0d3b1c 70%, #082810 100%)', boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.3), 0 4px 20px rgba(0,0,0,0.15)' }}>
                {/* Felt texture overlay */}
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '128px 128px' }} />
                {/* Inner table edge */}
                <div className="absolute inset-2 rounded-2xl border border-white/[0.07] pointer-events-none" style={{ boxShadow: 'inset 0 0 30px rgba(0,0,0,0.15)' }} />
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
                        <div className="flex items-center gap-3 relative z-10">
                            {/* Play Card Button */}
                            <button
                                onClick={handlePlayCard}
                                disabled={!canPlayCard || myCards.length === 0 || isPlayingCard}
                                className={`flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                                    canPlayCard && myCards.length > 0
                                        ? "text-white"
                                        : "bg-stone-200/80 text-stone-400 cursor-not-allowed shadow-none"
                                }`}
                                style={canPlayCard && myCards.length > 0 ? { background: 'linear-gradient(135deg, #78350f, #92400e, #a16207)', boxShadow: '0 4px 15px rgba(120,53,15,0.35)' } : undefined}
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
                                className={`flex items-center gap-2 px-8 py-4 rounded-xl font-extrabold text-base transition-all active:scale-90 ${
                                    canSlapPile
                                        ? "text-white"
                                        : "bg-stone-200/80 text-stone-400 cursor-not-allowed shadow-none"
                                }`}
                                style={canSlapPile ? { background: 'linear-gradient(135deg, #dc2626, #b91c1c, #991b1b)', boxShadow: '0 0 20px rgba(220,38,38,0.4), 0 4px 15px rgba(220,38,38,0.3)' } : undefined}
                            >
                                <span className="text-xl">👋</span>
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
