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
import { Trophy, RotateCcw, ArrowLeft, Hand, Loader2 } from "lucide-react";
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

export function EgyptianRatScrew({ room, currentUserId, isHost, onGameEnd }: EgyptianRatScrewProps) {
    const supabase = createClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // Host-side state (source of truth)
    const playerHandsRef = useRef<Record<string, Card[]>>({});

    // Client-side display state
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

    // ─── Channel setup ──────────────────────────────────────
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
            })
            .on("broadcast", { event: "deal_hand" }, ({ payload }) => {
                // Each player receives their own hand privately
                if (payload.playerId === currentUserId) {
                    setMyCards(payload.cards as Card[]);
                }
            })
            .on("broadcast", { event: "card_played" }, ({ payload }) => {
                // A card was played — update pile display
                setPile(payload.pile as Card[]);
                setCurrentTurn(payload.nextTurn);
                setPlayerCardCounts(payload.playerCardCounts);
                setChallenge(payload.challenge || null);
                setLastAction(payload.action);
                setLastSlapResult(null);
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

                // Update my cards if I was affected
                if (payload.updatedHand && payload.targetPlayerId === currentUserId) {
                    setMyCards(payload.updatedHand as Card[]);
                }

                // Clear slap result after 2 seconds
                setTimeout(() => setLastSlapResult(null), 2000);
            })
            .on("broadcast", { event: "pile_collected" }, ({ payload }) => {
                setPile([]);
                setPlayerCardCounts(payload.playerCardCounts);
                setCurrentTurn(payload.currentTurn);
                setChallenge(null);
                setLastAction(payload.action);

                // Update my cards if I collected
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
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [room.id, currentUserId]);

    // ─── Broadcast helper ───────────────────────────────────
    const broadcast = useCallback(
        (event: string, payload: any) => {
            channelRef.current?.send({ type: "broadcast", event, payload });
        },
        []
    );

    // ─── Host: Deal and start game ──────────────────────────
    useEffect(() => {
        if (!isHost) return;

        // Small delay for dealing animation feel
        const timer = setTimeout(() => {
            const deck = createDeck();
            const order = room.members.map((m) => m.user_id);
            const hands = dealCards(deck, order.length);

            // Store hands on host
            const handsMap: Record<string, Card[]> = {};
            const counts: Record<string, number> = {};
            order.forEach((id, i) => {
                handsMap[id] = hands[i];
                counts[id] = hands[i].length;
            });
            playerHandsRef.current = handsMap;

            // Send each player their hand privately
            order.forEach((id) => {
                broadcast("deal_hand", { playerId: id, cards: handsMap[id] });
            });

            // If host is a player, set own hand
            if (handsMap[currentUserId]) {
                setMyCards(handsMap[currentUserId]);
            }

            const firstPlayer = order[0];

            // Broadcast initial game state
            broadcast("game_state", {
                phase: "playing",
                turnOrder: order,
                currentTurn: firstPlayer,
                pile: [],
                playerCardCounts: counts,
                challenge: null,
                winnerId: null,
                lastAction: "Cards dealt! Game on! 🃏",
            });

            setPhase("playing");
            setTurnOrder(order);
            setCurrentTurn(firstPlayer);
            setPlayerCardCounts(counts);
            setPile([]);
            setLastAction("Cards dealt! Game on! 🃏");
        }, 1500);

        return () => clearTimeout(timer);
    }, [isHost, room.members, currentUserId, broadcast]);

    // ─── Play a card ────────────────────────────────────────
    const handlePlayCard = useCallback(() => {
        if (myCards.length === 0 || isPlayingCard) return;

        // In a challenge, only the defender can play
        if (challenge && challenge.defenderId !== currentUserId) return;
        // Otherwise, must be your turn
        if (!challenge && currentTurn !== currentUserId) return;

        setIsPlayingCard(true);

        const cardToPlay = myCards[0];
        const remainingCards = myCards.slice(1);
        setMyCards(remainingCards);

        // Send to host for processing
        broadcast("play_card_request", {
            playerId: currentUserId,
            card: cardToPlay,
        });

        setTimeout(() => setIsPlayingCard(false), 300);
    }, [myCards, currentTurn, currentUserId, challenge, isPlayingCard, broadcast]);

    // ─── Host: Process play card requests ───────────────────
    useEffect(() => {
        if (!isHost || !channelRef.current) return;

        const channel = channelRef.current;

        // We need to listen for play_card_request on the channel
        // Since we can't add listeners after subscribe easily,
        // we'll use a workaround via the existing channel
        const handlePlayCardRequest = ({ payload }: any) => {
            const { playerId, card } = payload;
            const hands = playerHandsRef.current;

            // Remove card from player's hand on host side
            if (hands[playerId]) {
                hands[playerId] = hands[playerId].filter((c) => c.id !== card.id);
            }

            // Add to pile
            const newPile = [...pile, card];

            // Update counts
            const counts: Record<string, number> = {};
            Object.keys(hands).forEach((id) => {
                counts[id] = hands[id]?.length || 0;
            });

            // Process challenge if active
            let newChallenge = challenge;
            let pileWinnerId: string | null = null;

            if (challenge && challenge.active) {
                const result = processChallenge(
                    challenge,
                    card,
                    playerId,
                    (id) => getNextActivePlayer(id, turnOrder, counts)
                );
                newChallenge = result.challenge;
                pileWinnerId = result.pileWinnerId;
            } else if (isFaceCard(card.rank)) {
                // New challenge started
                const nextPlayer = getNextActivePlayer(playerId, turnOrder, counts);
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
                const updatedCounts: Record<string, number> = {};
                Object.keys(hands).forEach((id) => {
                    updatedCounts[id] = hands[id]?.length || 0;
                });

                const nextTurn = getNextActivePlayer(pileWinnerId, turnOrder, updatedCounts);

                broadcast("pile_collected", {
                    collectorId: pileWinnerId,
                    collectorHand: pileWinnerId === currentUserId ? collectorHand : undefined,
                    playerCardCounts: updatedCounts,
                    currentTurn: nextTurn,
                    action: `${getMemberName(room.members, pileWinnerId)} takes the pile! (${newPile.length} cards)`,
                });

                // Send updated hand to collector if not host
                if (pileWinnerId !== currentUserId) {
                    broadcast("update_my_hand", { playerId: pileWinnerId, cards: collectorHand });
                } else {
                    setMyCards(collectorHand);
                }

                setPile([]);
                setPlayerCardCounts(updatedCounts);
                setCurrentTurn(nextTurn);
                setChallenge(null);
                setLastAction(`${getMemberName(room.members, pileWinnerId)} takes the pile!`);

                // Check for winner
                const winner = checkWinner(turnOrder, updatedCounts, 52);
                if (winner) {
                    broadcast("game_over", { winnerId: winner });
                    setPhase("ended");
                    setWinnerId(winner);
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }

                return;
            }

            // Determine next turn
            let nextTurn: string;
            if (newChallenge && newChallenge.active) {
                nextTurn = newChallenge.defenderId;
            } else {
                nextTurn = getNextActivePlayer(playerId, turnOrder, counts);
            }

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

            setPile(newPile);
            setCurrentTurn(nextTurn);
            setPlayerCardCounts(counts);
            setChallenge(newChallenge);
            setLastAction(actionText);

            // Check for winner
            const winner = checkWinner(turnOrder, counts, 52);
            if (winner) {
                setTimeout(() => {
                    broadcast("game_over", { winnerId: winner });
                    setPhase("ended");
                    setWinnerId(winner);
                    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }, 500);
            }
        };

        // Listen for play requests
        channel.on("broadcast", { event: "play_card_request" }, handlePlayCardRequest);

        // Cleanup — we can't easily remove individual broadcast listeners,
        // but the channel cleanup in the main effect handles it
    }, [isHost, pile, challenge, turnOrder, currentUserId, room.members, broadcast]);

    // ─── Slap the pile ──────────────────────────────────────
    const handleSlap = useCallback(() => {
        broadcast("slap_request", {
            playerId: currentUserId,
            timestamp: Date.now(),
        });
    }, [currentUserId, broadcast]);

    // ─── Host: Process slap requests ────────────────────────
    useEffect(() => {
        if (!isHost || !channelRef.current) return;

        const handleSlapRequest = ({ payload }: any) => {
            const { playerId } = payload;
            const hands = playerHandsRef.current;
            const slapResult = canSlap(pile);

            if (slapResult.valid) {
                // Valid slap — player takes the pile
                const collectorHand = [...(hands[playerId] || []), ...pile];
                hands[playerId] = collectorHand;

                const counts: Record<string, number> = {};
                Object.keys(hands).forEach((id) => {
                    counts[id] = hands[id]?.length || 0;
                });

                const nextTurn = getNextActivePlayer(playerId, turnOrder, counts);

                broadcast("slap_result", {
                    valid: true,
                    playerName: getMemberName(room.members, playerId),
                    reason: getSlapReasonText(slapResult.reason),
                    pile: [],
                    playerCardCounts: counts,
                    currentTurn: nextTurn,
                    challenge: null,
                    action: `${getMemberName(room.members, playerId)} slapped — ${getSlapReasonText(slapResult.reason)} Takes ${pile.length} cards!`,
                    targetPlayerId: playerId,
                    updatedHand: playerId === currentUserId ? undefined : collectorHand,
                });

                if (playerId === currentUserId) {
                    setMyCards(collectorHand);
                } else {
                    broadcast("update_my_hand", { playerId, cards: collectorHand });
                }

                setPile([]);
                setPlayerCardCounts(counts);
                setCurrentTurn(nextTurn);
                setChallenge(null);

                // Check winner
                const winner = checkWinner(turnOrder, counts, 52);
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
                const newPile = [...penaltyCards, ...pile];
                hands[playerId] = playerHand;

                const counts: Record<string, number> = {};
                Object.keys(hands).forEach((id) => {
                    counts[id] = hands[id]?.length || 0;
                });

                broadcast("slap_result", {
                    valid: false,
                    playerName: getMemberName(room.members, playerId),
                    reason: "Wrong slap! ❌",
                    pile: newPile,
                    playerCardCounts: counts,
                    currentTurn: currentTurn,
                    challenge,
                    action: `${getMemberName(room.members, playerId)} slapped wrong! Penalty: ${penaltyCards.length} cards to the pile.`,
                    targetPlayerId: playerId,
                    updatedHand: playerHand,
                });

                if (playerId === currentUserId) {
                    setMyCards(playerHand);
                } else {
                    broadcast("update_my_hand", { playerId, cards: playerHand });
                }

                setPile(newPile);
                setPlayerCardCounts(counts);
            }
        };

        channelRef.current.on("broadcast", { event: "slap_request" }, handleSlapRequest);
    }, [isHost, pile, challenge, turnOrder, currentTurn, currentUserId, room.members, broadcast]);

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

        // Re-deal after short delay
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

            order.forEach((id) => {
                broadcast("deal_hand", { playerId: id, cards: handsMap[id] });
            });

            if (handsMap[currentUserId]) {
                setMyCards(handsMap[currentUserId]);
            }

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
    const canPlay = (isMyTurn && !challenge) || amDefender;
    const canSlapPile = pile.length >= 2;

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
                    Your cards: {myCards.length}
                </div>
            </div>

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
                        isActive={canPlay}
                        isCurrentUser={true}
                        isEliminated={myCards.length === 0}
                        position="bottom"
                    />

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        {/* Play Card Button */}
                        <button
                            onClick={handlePlayCard}
                            disabled={!canPlay || myCards.length === 0 || isPlayingCard}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                                canPlay && myCards.length > 0
                                    ? "bg-warm-cocoa text-white shadow-lg shadow-warm-cocoa/20 hover:bg-warm-cocoa/90"
                                    : "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                            }`}
                        >
                            {isPlayingCard ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <span className="text-lg">🃏</span>
                            )}
                            {canPlay ? "Play Card" : "Wait..."}
                        </button>

                        {/* Slap Button */}
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

                    {/* Top card preview */}
                    {myCards.length > 0 && (
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-[9px] text-warm-grey/40 italic">Next card:</p>
                            <div className="scale-75 origin-left">
                                <PlayingCard card={myCards[0]} faceUp={canPlay} size="sm" />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
