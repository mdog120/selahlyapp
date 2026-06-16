"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    createCrazy8Deck,
    dealHands,
    canPlay,
    hasPlayableCard,
    SUITS,
    type GameCard,
    type Suit,
    getCardColor,
    getCardBg,
    getCardBorder,
} from "./crazy8Cards";
import { Trophy, RotateCcw, ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
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

interface ChristianCrazy8Props {
    room: GameRoom;
    currentUserId: string;
    isHost: boolean;
    onGameEnd: () => void;
}

// ─── Helpers ────────────────────────────────────────────────

const getMemberName = (members: RoomMember[], id: string) =>
    members.find((m) => m.user_id === id)?.first_name || "Someone";

const getMemberAvatar = (members: RoomMember[], id: string) =>
    members.find((m) => m.user_id === id)?.avatar_url || "";

const getAvatarBg = (id: string) => {
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
};

const ALL_SUITS: Suit[] = ["love", "faith", "hope", "grace"];

// ─── Inline Card Component ─────────────────────────────────

function Crazy8CardView({
    card,
    playable,
    onClick,
    size = "md",
}: {
    card: GameCard;
    playable?: boolean;
    onClick?: () => void;
    size?: "sm" | "md";
}) {
    const sizeClasses = size === "sm" ? "w-12 h-[68px]" : "w-16 h-[92px]";
    const textSize = size === "sm" ? "text-[8px]" : "text-[10px]";
    const emojiSize = size === "sm" ? "text-lg" : "text-2xl";
    const rankSize = size === "sm" ? "text-[7px]" : "text-[9px]";

    const isWild = card.type === "wild";
    const isPlus4 = card.type === "plus4";

    let bgGradient = "";
    if (isWild) bgGradient = "bg-gradient-to-br from-purple-50 to-violet-50";
    else if (isPlus4) bgGradient = "bg-gradient-to-br from-red-50 to-rose-50";
    else if (card.suit) bgGradient = SUITS[card.suit].bgColor;

    return (
        <button
            onClick={onClick}
            disabled={!playable && !!onClick}
            className={`
                ${sizeClasses} rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 p-1
                transition-all relative overflow-hidden shrink-0
                ${bgGradient}
                ${getCardBorder(card)}
                ${playable ? "cursor-pointer hover:scale-110 hover:-translate-y-2 hover:shadow-lg active:scale-95 hover:z-10" : ""}
                ${playable === false ? "opacity-50 cursor-not-allowed" : ""}
                ${isWild ? "border-purple-300" : ""}
                ${isPlus4 ? "border-red-300" : ""}
            `}
        >
            {card.suit && (
                <span className={`absolute top-0.5 left-1 ${rankSize} leading-none`}>
                    {SUITS[card.suit].symbol}
                </span>
            )}
            <span className={emojiSize}>{card.emoji}</span>
            <span className={`${textSize} font-bold ${getCardColor(card)} leading-tight text-center`}>
                {card.type === "number" ? card.rank : card.label}
            </span>
            <span className={`${rankSize} ${getCardColor(card)}/60 leading-none truncate max-w-full`}>
                {card.character}
            </span>
            {(isWild || isPlus4) && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-400 via-amber-400 via-emerald-400 to-blue-400" />
            )}
        </button>
    );
}

// ─── Card Back ──────────────────────────────────────────────

function CardBack({ count }: { count: number }) {
    return (
        <div className="relative w-12 h-[68px] rounded-xl bg-gradient-to-br from-warm-cocoa to-warm-cocoa/80 border-2 border-warm-cocoa/40 flex items-center justify-center shadow-sm">
            <span className="text-white/30 text-lg">✝</span>
            {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-warm-cocoa text-white text-[8px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                    {count}
                </span>
            )}
        </div>
    );
}

// ─── Suit Picker Modal ──────────────────────────────────────

function SuitPicker({ onPick }: { onPick: (suit: Suit) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-warm-cocoa/40 backdrop-blur-sm p-4"
        >
            <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-stone-150"
            >
                <h3 className="font-serif text-lg text-warm-cocoa text-center mb-4 font-bold">Choose a Virtue</h3>
                <div className="grid grid-cols-2 gap-3">
                    {ALL_SUITS.map((suit) => (
                        <button
                            key={suit}
                            onClick={() => onPick(suit)}
                            className={`${SUITS[suit].bgColor} ${SUITS[suit].borderColor} border-2 rounded-2xl p-4 flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95 cursor-pointer`}
                        >
                            <span className="text-2xl">{SUITS[suit].symbol}</span>
                            <span className={`text-xs font-bold ${SUITS[suit].color}`}>{SUITS[suit].name}</span>
                        </button>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════

export function ChristianCrazy8({ room, currentUserId, isHost, onGameEnd }: ChristianCrazy8Props) {
    const supabase = createClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // ─── ALL mutable game state lives in refs (no stale closures) ──
    const allHandsRef = useRef<Record<string, GameCard[]>>({});
    const drawPileRef = useRef<GameCard[]>([]);
    const directionRef = useRef<1 | -1>(1);
    const turnOrderRef = useRef<string[]>([]);
    const currentTurnRef = useRef<string>("");
    const discardTopRef = useRef<GameCard | null>(null);
    const currentSuitRef = useRef<Suit>("love");
    const processingRef = useRef(false);

    // ─── Display state (for rendering only) ──
    const [phase, setPhase] = useState<"dealing" | "playing" | "ended">("dealing");
    const [turnOrder, setTurnOrder] = useState<string[]>([]);
    const [currentTurn, setCurrentTurn] = useState("");
    const [direction, setDirection] = useState<1 | -1>(1);
    const [discardTop, setDiscardTop] = useState<GameCard | null>(null);
    const [currentSuit, setCurrentSuit] = useState<Suit>("love");
    const [myHand, setMyHand] = useState<GameCard[]>([]);
    const [playerCardCounts, setPlayerCardCounts] = useState<Record<string, number>>({});
    const [lastAction, setLastAction] = useState("");
    const [winnerId, setWinnerId] = useState<string | null>(null);
    const [drawPileCount, setDrawPileCount] = useState(0);
    const [showSuitPicker, setShowSuitPicker] = useState(false);
    const [pendingWildCard, setPendingWildCard] = useState<GameCard | null>(null);
    const [oneCardAlert, setOneCardAlert] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    const isMyTurn = currentTurn === currentUserId;

    // ─── Ref-based next player (reads from refs, no stale closure) ──
    function getNextPlayerRef(fromId: string, skip = false): string {
        const order = turnOrderRef.current;
        const dir = directionRef.current;
        const idx = order.indexOf(fromId);
        if (idx === -1 || order.length === 0) return fromId;
        const step = skip ? 2 : 1;
        const nextIdx = ((idx + dir * step) % order.length + order.length) % order.length;
        return order[nextIdx];
    }

    // ─── Stable broadcast (uses ref so channel is always current) ──
    const broadcast = useCallback((event: string, payload: any) => {
        channelRef.current?.send({ type: "broadcast", event, payload });
    }, []);

    // ═══════════════════════════════════════════════════════
    // SINGLE CHANNEL SETUP — ALL listeners registered ONCE
    // ═══════════════════════════════════════════════════════
    useEffect(() => {
        const channel = supabase.channel(`crazy8_game:${room.id}`);

        channel
            // ─── All clients: display state updates ─────
            .on("broadcast", { event: "game_start" }, ({ payload }) => {
                setPhase("playing");
                setTurnOrder(payload.turnOrder);
                setCurrentTurn(payload.currentTurn);
                setDiscardTop(payload.discardTop);
                setCurrentSuit(payload.currentSuit);
                setPlayerCardCounts(payload.playerCardCounts);
                setDrawPileCount(payload.drawPileCount);
                setDirection(payload.direction || 1);
                setLastAction("Game started! 🃏");
                // Sync refs
                turnOrderRef.current = payload.turnOrder;
                currentTurnRef.current = payload.currentTurn;
                discardTopRef.current = payload.discardTop;
                currentSuitRef.current = payload.currentSuit;
                directionRef.current = payload.direction || 1;
            })
            .on("broadcast", { event: "deal_hand" }, ({ payload }) => {
                if (payload.playerId === currentUserId) {
                    setMyHand(payload.cards);
                }
            })
            .on("broadcast", { event: "card_played" }, ({ payload }) => {
                setDiscardTop(payload.discardTop);
                setCurrentSuit(payload.currentSuit);
                setCurrentTurn(payload.currentTurn);
                setPlayerCardCounts(payload.playerCardCounts);
                setDrawPileCount(payload.drawPileCount);
                setDirection(payload.direction);
                setLastAction(payload.action);
                // Sync refs
                discardTopRef.current = payload.discardTop;
                currentSuitRef.current = payload.currentSuit;
                currentTurnRef.current = payload.currentTurn;
                directionRef.current = payload.direction;
            })
            .on("broadcast", { event: "card_drawn" }, ({ payload }) => {
                setCurrentTurn(payload.currentTurn);
                setPlayerCardCounts(payload.playerCardCounts);
                setDrawPileCount(payload.drawPileCount);
                setLastAction(payload.action);
                currentTurnRef.current = payload.currentTurn;
            })
            .on("broadcast", { event: "update_hand" }, ({ payload }) => {
                if (payload.playerId === currentUserId) {
                    setMyHand(payload.cards);
                }
            })
            .on("broadcast", { event: "one_card" }, ({ payload }) => {
                setOneCardAlert(payload.playerName);
                setTimeout(() => setOneCardAlert(null), 3000);
            })
            .on("broadcast", { event: "game_over" }, ({ payload }) => {
                setPhase("ended");
                setWinnerId(payload.winnerId);
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            })

            // ─── HOST ONLY: process play requests ───────
            .on("broadcast", { event: "play_card_request" }, ({ payload }) => {
                if (!isHost || processingRef.current) return;
                processingRef.current = true;

                try {
                    const { playerId, card, chosenSuit } = payload;

                    // ★ TURN VALIDATION — reject if not this player's turn
                    if (playerId !== currentTurnRef.current) return;

                    const hands = allHandsRef.current;

                    // Remove card from player's hand
                    if (hands[playerId]) {
                        hands[playerId] = hands[playerId].filter((c: GameCard) => c.id !== card.id);
                    }

                    const counts: Record<string, number> = {};
                    Object.keys(hands).forEach((id) => { counts[id] = hands[id]?.length || 0; });

                    let nextPlayer: string;
                    const newSuit = chosenSuit as Suit;

                    switch (card.type) {
                        case "skip":
                            nextPlayer = getNextPlayerRef(playerId, true);
                            break;
                        case "reverse":
                            directionRef.current = (directionRef.current * -1) as 1 | -1;
                            nextPlayer = getNextPlayerRef(playerId);
                            break;
                        case "draw2": {
                            const victim = getNextPlayerRef(playerId);
                            for (let i = 0; i < 2; i++) {
                                const c = drawPileRef.current.shift();
                                if (c && hands[victim]) hands[victim] = [...hands[victim], c];
                            }
                            counts[victim] = hands[victim]?.length || 0;
                            channel.send({ type: "broadcast", event: "update_hand", payload: { playerId: victim, cards: hands[victim] } });
                            if (victim === currentUserId) setMyHand([...hands[victim]]);
                            nextPlayer = getNextPlayerRef(playerId, true);
                            break;
                        }
                        case "plus4": {
                            const victim4 = getNextPlayerRef(playerId);
                            for (let i = 0; i < 4; i++) {
                                const c = drawPileRef.current.shift();
                                if (c && hands[victim4]) hands[victim4] = [...hands[victim4], c];
                            }
                            counts[victim4] = hands[victim4]?.length || 0;
                            channel.send({ type: "broadcast", event: "update_hand", payload: { playerId: victim4, cards: hands[victim4] } });
                            if (victim4 === currentUserId) setMyHand([...hands[victim4]]);
                            nextPlayer = getNextPlayerRef(playerId, true);
                            break;
                        }
                        default:
                            nextPlayer = getNextPlayerRef(playerId);
                    }

                    // ★ Update refs BEFORE broadcasting
                    currentTurnRef.current = nextPlayer;
                    discardTopRef.current = card;
                    currentSuitRef.current = newSuit;

                    const charLabel = card.character;
                    const actionText = card.type === "wild"
                        ? `${getMemberName(room.members, playerId)} played Wild ${charLabel}! Chose ${SUITS[newSuit].name} ${SUITS[newSuit].symbol}`
                        : card.type === "plus4"
                            ? `${getMemberName(room.members, playerId)} played ${card.label}! +4! Chose ${SUITS[newSuit].name}`
                            : card.type === "skip"
                                ? `${getMemberName(room.members, playerId)} played ${charLabel} — Skip! ⏭️`
                                : card.type === "reverse"
                                    ? `${getMemberName(room.members, playerId)} played ${charLabel} — Reverse! 🔄`
                                    : card.type === "draw2"
                                        ? `${getMemberName(room.members, playerId)} played ${charLabel} — +2!`
                                        : `${getMemberName(room.members, playerId)} played ${charLabel}`;

                    channel.send({
                        type: "broadcast", event: "card_played", payload: {
                            discardTop: card, currentSuit: newSuit, currentTurn: nextPlayer,
                            playerCardCounts: counts, drawPileCount: drawPileRef.current.length,
                            direction: directionRef.current, action: actionText,
                        }
                    });

                    // Host display update
                    setDiscardTop(card);
                    setCurrentSuit(newSuit);
                    setCurrentTurn(nextPlayer);
                    setPlayerCardCounts(counts);
                    setDrawPileCount(drawPileRef.current.length);
                    setDirection(directionRef.current);
                    setLastAction(actionText);

                    // One card alert
                    if (counts[playerId] === 1) {
                        const name = getMemberName(room.members, playerId);
                        channel.send({ type: "broadcast", event: "one_card", payload: { playerName: name } });
                        setOneCardAlert(name);
                        setTimeout(() => setOneCardAlert(null), 3000);
                    }

                    // Win check
                    if (counts[playerId] === 0) {
                        channel.send({ type: "broadcast", event: "game_over", payload: { winnerId: playerId } });
                        setPhase("ended");
                        setWinnerId(playerId);
                        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                    }
                } finally {
                    processingRef.current = false;
                }
            })

            // ─── HOST ONLY: process draw requests ───────
            .on("broadcast", { event: "draw_request" }, ({ payload }) => {
                if (!isHost || processingRef.current) return;
                processingRef.current = true;

                try {
                    const { playerId } = payload;

                    // ★ TURN VALIDATION
                    if (playerId !== currentTurnRef.current) return;

                    const hands = allHandsRef.current;
                    const drawn = drawPileRef.current.shift();
                    if (!drawn) return;

                    if (hands[playerId]) hands[playerId] = [...hands[playerId], drawn];

                    const counts: Record<string, number> = {};
                    Object.keys(hands).forEach((id) => { counts[id] = hands[id]?.length || 0; });

                    channel.send({ type: "broadcast", event: "update_hand", payload: { playerId, cards: hands[playerId] } });
                    if (playerId === currentUserId) setMyHand([...(hands[playerId] || [])]);

                    const nextPlayer = getNextPlayerRef(playerId);
                    currentTurnRef.current = nextPlayer;

                    const action = `${getMemberName(room.members, playerId)} drew a card`;

                    channel.send({
                        type: "broadcast", event: "card_drawn", payload: {
                            currentTurn: nextPlayer, playerCardCounts: counts,
                            drawPileCount: drawPileRef.current.length, action,
                        }
                    });

                    setCurrentTurn(nextPlayer);
                    setPlayerCardCounts(counts);
                    setDrawPileCount(drawPileRef.current.length);
                    setLastAction(action);
                } finally {
                    processingRef.current = false;
                }
            })
            .subscribe();

        channelRef.current = channel;
        return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room.id, currentUserId, isHost]);

    // ─── Host: Deal Cards on mount ──────────────────────────
    useEffect(() => {
        if (!isHost) return;

        const timer = setTimeout(() => {
            const deck = createCrazy8Deck();
            const order = room.members.map((m) => m.user_id);
            const { hands, drawPile, firstDiscard } = dealHands(deck, order.length, 7);

            const handsMap: Record<string, GameCard[]> = {};
            const counts: Record<string, number> = {};
            order.forEach((id, i) => { handsMap[id] = hands[i]; counts[id] = hands[i].length; });

            // Set ALL refs
            allHandsRef.current = handsMap;
            drawPileRef.current = drawPile;
            directionRef.current = 1;
            turnOrderRef.current = order;
            currentTurnRef.current = order[0];
            discardTopRef.current = firstDiscard;
            currentSuitRef.current = (firstDiscard.suit || "love") as Suit;

            const startSuit = firstDiscard.suit || "love";

            order.forEach((id) => {
                broadcast("deal_hand", { playerId: id, cards: handsMap[id] });
            });
            if (handsMap[currentUserId]) setMyHand(handsMap[currentUserId]);

            broadcast("game_start", {
                turnOrder: order, currentTurn: order[0], discardTop: firstDiscard,
                currentSuit: startSuit, playerCardCounts: counts,
                drawPileCount: drawPile.length, direction: 1,
            });

            setPhase("playing");
            setTurnOrder(order);
            setCurrentTurn(order[0]);
            setDiscardTop(firstDiscard);
            setCurrentSuit(startSuit as Suit);
            setPlayerCardCounts(counts);
            setDrawPileCount(drawPile.length);
        }, 1500);

        return () => clearTimeout(timer);
    }, [isHost, room.members, currentUserId, broadcast]);

    // ─── Play a card (client side) ──────────────────────────
    const handlePlayCard = useCallback(
        (card: GameCard) => {
            if (!isMyTurn || !discardTop) return;

            if (card.type === "wild" || card.type === "plus4") {
                setPendingWildCard(card);
                setShowSuitPicker(true);
                return;
            }

            if (!canPlay(card, discardTop, currentSuit)) return;

            // Optimistically remove from hand & disable further plays
            setMyHand((prev) => prev.filter((c) => c.id !== card.id));
            setCurrentTurn(""); // ★ Prevent double-play on client

            broadcast("play_card_request", {
                playerId: currentUserId,
                card,
                chosenSuit: card.suit,
            });
        },
        [isMyTurn, discardTop, currentSuit, currentUserId, broadcast]
    );

    const handleSuitPicked = useCallback(
        (suit: Suit) => {
            setShowSuitPicker(false);
            if (!pendingWildCard) return;

            setMyHand((prev) => prev.filter((c) => c.id !== pendingWildCard.id));
            setCurrentTurn(""); // ★ Prevent double-play on client

            broadcast("play_card_request", {
                playerId: currentUserId,
                card: pendingWildCard,
                chosenSuit: suit,
            });

            setPendingWildCard(null);
        },
        [pendingWildCard, currentUserId, broadcast]
    );

    // ─── Draw a card (client side) ──────────────────────────
    const handleDraw = useCallback(() => {
        if (!isMyTurn || isDrawing) return;
        setIsDrawing(true);
        setCurrentTurn(""); // ★ Prevent double-play on client

        broadcast("draw_request", { playerId: currentUserId });

        setTimeout(() => setIsDrawing(false), 500);
    }, [isMyTurn, isDrawing, currentUserId, broadcast]);

    // ─── Play again ─────────────────────────────────────────
    const handlePlayAgain = useCallback(() => {
        setPhase("dealing");
        setMyHand([]);
        setDiscardTop(null);
        setWinnerId(null);
        setLastAction("Shuffling...");

        setTimeout(() => {
            const deck = createCrazy8Deck();
            const order = room.members.map((m) => m.user_id);
            const { hands, drawPile, firstDiscard } = dealHands(deck, order.length, 7);

            const handsMap: Record<string, GameCard[]> = {};
            const counts: Record<string, number> = {};
            order.forEach((id, i) => { handsMap[id] = hands[i]; counts[id] = hands[i].length; });

            allHandsRef.current = handsMap;
            drawPileRef.current = drawPile;
            directionRef.current = 1;
            turnOrderRef.current = order;
            currentTurnRef.current = order[0];
            discardTopRef.current = firstDiscard;
            currentSuitRef.current = (firstDiscard.suit || "love") as Suit;

            const startSuit = firstDiscard.suit || "love";

            order.forEach((id) => broadcast("deal_hand", { playerId: id, cards: handsMap[id] }));
            if (handsMap[currentUserId]) setMyHand(handsMap[currentUserId]);

            broadcast("game_start", {
                turnOrder: order, currentTurn: order[0], discardTop: firstDiscard,
                currentSuit: startSuit, playerCardCounts: counts,
                drawPileCount: drawPile.length, direction: 1,
            });

            setPhase("playing");
            setTurnOrder(order);
            setCurrentTurn(order[0]);
            setDiscardTop(firstDiscard);
            setCurrentSuit(startSuit as Suit);
            setPlayerCardCounts(counts);
            setDrawPileCount(drawPile.length);
        }, 1500);
    }, [room.members, currentUserId, broadcast]);

    // ═══════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════

    // ─── Dealing ────────────────────────────────────────────
    if (phase === "dealing") {
        return (
            <div className="w-full bg-white/50 border border-warm-grey/5 rounded-3xl p-8 shadow-sm text-center">
                <motion.div animate={{ rotateY: [0, 360] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="text-5xl mb-4 inline-block">🃏</motion.div>
                <h3 className="font-serif text-lg font-bold text-warm-cocoa mb-2">Dealing Cards...</h3>
                <p className="text-xs text-warm-grey/50">Shuffling the virtues ✨</p>
            </div>
        );
    }

    // ─── Ended ──────────────────────────────────────────────
    if (phase === "ended" && winnerId) {
        const winnerName = getMemberName(room.members, winnerId);
        const isWinner = winnerId === currentUserId;

        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full bg-white/50 border border-warm-grey/5 rounded-3xl p-6 shadow-sm text-center">
                <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-3xl mx-auto mb-4 border border-amber-100">
                    <Trophy className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="font-serif text-2xl text-warm-cocoa font-bold mb-2">
                    {isWinner ? "You Win! 🎉" : `${winnerName} Wins!`}
                </h2>
                <p className="text-xs text-warm-grey/50 mb-6">
                    {isWinner ? "You played all your cards! Amazing! ✨" : `${winnerName} played all their cards!`}
                </p>
                {isHost ? (
                    <div className="flex flex-col gap-2">
                        <button onClick={handlePlayAgain} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-warm-cocoa text-white font-serif text-sm font-bold transition-all active:scale-95 shadow-lg shadow-warm-cocoa/20">
                            <RotateCcw className="w-4 h-4" /> Play Again
                        </button>
                        <button onClick={onGameEnd} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-100 text-warm-grey text-xs font-bold transition-all active:scale-95">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back to Room
                        </button>
                    </div>
                ) : (
                    <p className="text-[10px] text-warm-grey/40 italic mt-4">Waiting for the host to continue...</p>
                )}
            </motion.div>
        );
    }

    // ─── Playing ────────────────────────────────────────────
    const canIPlay = isMyTurn && discardTop ? hasPlayableCard(myHand, discardTop, currentSuit) : false;

    return (
        <div className="w-full flex flex-col gap-3">
            {/* One Card Alert */}
            <AnimatePresence>
                {oneCardAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -50, scale: 0.8 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-rose-500 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2"
                    >
                        <AlertCircle className="w-5 h-5" />
                        🚨 {oneCardAlert} has ONE CARD LEFT! 🚨
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Suit Picker */}
            <AnimatePresence>
                {showSuitPicker && <SuitPicker onPick={handleSuitPicked} />}
            </AnimatePresence>

            {/* Status Bar */}
            <div className="flex items-center justify-between bg-white/50 border border-warm-grey/5 rounded-2xl px-4 py-2.5 shadow-sm flex-wrap gap-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-warm-grey/50">
                    🃏 Crazy 8s
                    <span className="text-warm-grey/30">•</span>
                    <span className={direction === 1 ? "" : "scale-x-[-1] inline-block"}>{direction === 1 ? "→" : "←"}</span>
                </div>
                <div className="text-[10px] text-warm-cocoa font-bold max-w-[180px] truncate">{lastAction}</div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-warm-grey/40">Current virtue:</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${SUITS[currentSuit].bgColor} ${SUITS[currentSuit].color} border ${SUITS[currentSuit].borderColor}`}>
                        {SUITS[currentSuit].symbol} {SUITS[currentSuit].name}
                    </span>
                </div>
            </div>

            {/* Other Players */}
            <div className="flex flex-wrap justify-center gap-2">
                {turnOrder.filter((id) => id !== currentUserId).map((id) => {
                    const isActive = currentTurn === id;
                    const avatar = getMemberAvatar(room.members, id);
                    const name = getMemberName(room.members, id);
                    const count = playerCardCounts[id] || 0;

                    return (
                        <div key={id} className={`flex items-center gap-2 px-3 py-2 rounded-2xl border transition-all ${
                            isActive ? "ring-2 ring-amber-400 bg-amber-50/30 border-amber-200" : "bg-white/60 border-stone-200/40"
                        }`}>
                            {avatar ? (
                                <img src={avatar} alt={name} className="w-7 h-7 rounded-full border border-stone-200/50 object-cover" />
                            ) : (
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatarBg(id)}`}>
                                    {name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] font-bold text-warm-cocoa">{name}</p>
                                <p className={`text-[9px] font-bold ${count <= 2 ? "text-rose-600" : "text-warm-grey/50"}`}>
                                    {count} {count === 1 ? "card" : "cards"}
                                    {count === 1 && " 🔥"}
                                </p>
                            </div>
                            {isActive && <span className="text-[8px] text-amber-700 animate-pulse font-bold">🃏</span>}
                        </div>
                    );
                })}
            </div>

            {/* Center Area: Discard + Draw */}
            <div className="flex items-center justify-center gap-6 py-4">
                {/* Draw Pile */}
                <button
                    onClick={handleDraw}
                    disabled={!isMyTurn || isDrawing}
                    className={`flex flex-col items-center gap-1.5 transition-all ${
                        isMyTurn && !canIPlay ? "animate-pulse" : ""
                    } ${isMyTurn ? "cursor-pointer hover:scale-105" : "cursor-not-allowed opacity-60"}`}
                >
                    <CardBack count={drawPileCount} />
                    <span className="text-[9px] font-bold text-warm-grey/40">
                        {isMyTurn && !canIPlay ? "Draw!" : "Draw pile"}
                    </span>
                </button>

                {/* Discard Pile */}
                <div className="flex flex-col items-center gap-1.5">
                    {discardTop ? (
                        <motion.div key={discardTop.id} initial={{ scale: 0.5, rotateZ: -10 }} animate={{ scale: 1, rotateZ: 0 }} transition={{ type: "spring", damping: 15 }}>
                            <Crazy8CardView card={discardTop} size="md" />
                        </motion.div>
                    ) : (
                        <div className="w-16 h-[92px] rounded-xl border-2 border-dashed border-stone-200/50 flex items-center justify-center text-[9px] text-warm-grey/30">
                            Discard
                        </div>
                    )}
                    <span className="text-[9px] font-bold text-warm-grey/40">Discard</span>
                </div>
            </div>

            {/* Turn Indicator */}
            <div className="text-center">
                {isMyTurn ? (
                    <motion.p animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-xs font-bold text-amber-700">
                        ✨ Your turn! {canIPlay ? "Play a card!" : "No matches — draw a card!"}
                    </motion.p>
                ) : (
                    <p className="text-[10px] text-warm-grey/40">
                        Waiting for {getMemberName(room.members, currentTurn)}...
                    </p>
                )}
            </div>

            {/* My Hand */}
            <div className="bg-white/50 border border-warm-grey/5 rounded-2xl p-3 shadow-sm">
                <p className="text-[9px] font-bold text-warm-grey/40 uppercase tracking-wider mb-2 text-center">
                    Your Hand ({myHand.length} cards)
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 max-h-[240px] overflow-y-auto">
                    {myHand.map((card) => {
                        const playable = isMyTurn && discardTop ? canPlay(card, discardTop, currentSuit) : false;
                        return (
                            <Crazy8CardView
                                key={card.id}
                                card={card}
                                playable={isMyTurn ? playable : undefined}
                                onClick={playable ? () => handlePlayCard(card) : undefined}
                                size="sm"
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
