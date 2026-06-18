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
import { Trophy, RotateCcw, ArrowLeft, AlertCircle, Loader2, Shuffle, LogOut } from "lucide-react";
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
    onCloseRoom: () => void;
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
    const sizeClasses = size === "sm" ? "w-14 h-[78px]" : "w-[72px] h-[102px]";
    const textSize = size === "sm" ? "text-[8px]" : "text-[10px]";
    const emojiSize = size === "sm" ? "text-xl" : "text-2xl";
    const rankSize = size === "sm" ? "text-[7px]" : "text-[9px]";

    const isWild = card.type === "wild";
    const isPlus4 = card.type === "plus4";

    let bgGradient = "";
    if (isWild) bgGradient = "bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50";
    else if (isPlus4) bgGradient = "bg-gradient-to-br from-red-50 via-rose-50 to-orange-50";
    else if (card.suit) bgGradient = SUITS[card.suit].bgColor;

    const wildBorderStyle = isWild ? {
        background: "linear-gradient(135deg, #a855f7, #6366f1, #ec4899, #a855f7)",
        backgroundSize: "300% 300%",
        animation: "shimmer 3s ease infinite",
        padding: "2px",
        borderRadius: "14px",
    } : undefined;

    const plus4BorderStyle = isPlus4 ? {
        background: "linear-gradient(135deg, #ef4444, #f97316, #ef4444)",
        backgroundSize: "200% 200%",
        animation: "shimmer 2s ease infinite",
        padding: "2px",
        borderRadius: "14px",
    } : undefined;

    const outerStyle = wildBorderStyle || plus4BorderStyle;
    const cardBg = bgGradient || "linear-gradient(180deg, #ffffff 0%, #f7f6ff 100%)";
    const cardBorder = getCardBorder(card);
    const cornerLabel = card.type === "number"
        ? `${card.rank}`
        : card.type === "wild"
            ? "WILD"
            : card.type === "plus4"
                ? "+4"
                : card.type === "skip"
                    ? "SKIP"
                    : card.type === "reverse"
                        ? "REV"
                        : card.type === "draw2"
                            ? "+2"
                            : card.label;

    const cardInner = (
        <button
            onClick={onClick}
            disabled={!playable && !!onClick}
            className={`
                ${sizeClasses} rounded-[18px] border flex flex-col items-center justify-center gap-1 p-2
                transition-all duration-200 relative overflow-hidden shrink-0
                ${playable ? "cursor-pointer hover:scale-105 hover:-translate-y-1 active:scale-95 hover:z-10" : ""}
                ${playable === false ? "opacity-80 cursor-not-allowed" : ""}
            `}
            style={{
                background: cardBg,
                boxShadow: playable
                    ? "0 12px 30px rgba(0,0,0,0.16)"
                    : "0 6px 16px rgba(0,0,0,0.08)",
                borderColor: cardBorder,
            }}
        >
            <div className="absolute inset-0 rounded-[18px] border border-white/70 pointer-events-none" />
            <div className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 text-left">
                {cornerLabel}
                {card.suit ? <span className="block mt-1 text-[12px]">{SUITS[card.suit].symbol}</span> : ""}
            </div>
            <div className="absolute bottom-2 right-2 rotate-180 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 text-right">
                {cornerLabel}
                {card.suit ? <span className="block mt-1 text-[12px]">{SUITS[card.suit].symbol}</span> : ""}
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                <span className={emojiSize} style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.12))" }}>{card.emoji}</span>
                <span className={`${textSize} font-bold ${getCardColor(card)} leading-tight text-center`}>
                    {card.type === "number" ? card.rank : card.label}
                </span>
                {card.character && (
                    <span className={`${rankSize} ${getCardColor(card)}/70 leading-none text-center max-w-full`}>
                        {card.character}
                    </span>
                )}
            </div>

            <div className="absolute inset-x-4 bottom-4 h-0.5 rounded-full bg-slate-200/60" />
            {(isWild || isPlus4) && (
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-400 via-amber-400 via-emerald-400 to-blue-400 opacity-80" />
            )}
        </button>
    );

    if (outerStyle) {
        return (
            <div
                style={outerStyle}
                className="shrink-0 rounded-[20px]"
            >
                {cardInner}
            </div>
        );
    }
    return cardInner;
}

// ─── Card Back ──────────────────────────────────────────────

function CardBack({ count }: { count: number }) {
    return (
        <div className="relative" style={{ width: 56, height: 92 }}>
            <div
                className="absolute rounded-[18px]"
                style={{
                    width: 56,
                    height: 92,
                    top: 6,
                    left: 6,
                    background: "linear-gradient(145deg, rgba(0,0,0,0.08), rgba(0,0,0,0))",
                    filter: "blur(1px)",
                    opacity: 0.8,
                }}
            />
            <div
                className="relative rounded-[18px] w-full h-full overflow-hidden"
                style={{
                    background: "linear-gradient(145deg, #ffffff 0%, #ede9fe 100%)",
                    border: "1px solid rgba(148,163,184,0.25)",
                    boxShadow: "0 14px 35px rgba(0,0,0,0.18)",
                }}
            >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.15),_transparent_35%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(255,255,255,0.75),_rgba(255,255,255,0)_60%)]" />
                <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,_rgba(148,163,184,0.04),_rgba(148,163,184,0.04)_6px,_transparent_6px,_transparent_12px)]" />
                <div className="absolute inset-4 rounded-[14px] border border-white/50" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-amber-100/90 border border-amber-200/70 flex items-center justify-center text-2xl text-amber-800 shadow-inner shadow-amber-200/30">
                        ✝
                    </div>
                </div>
                {count > 0 && (
                    <span
                        className="absolute -top-1 -right-1 text-white text-[9px] font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white/70"
                        style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", boxShadow: "0 4px 12px rgba(249,115,22,0.35)" }}
                    >
                        {count}
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Suit Picker Modal ──────────────────────────────────────

const SUIT_GRADIENTS: Record<Suit, string> = {
    love: "linear-gradient(135deg, #ffe4e6 0%, #fda4af 50%, #fb7185 100%)",
    faith: "linear-gradient(135deg, #fef3c7 0%, #fbbf24 50%, #f59e0b 100%)",
    hope: "linear-gradient(135deg, #dbeafe 0%, #93c5fd 50%, #60a5fa 100%)",
    grace: "linear-gradient(135deg, #d1fae5 0%, #6ee7b7 50%, #34d399 100%)",
};

function SuitPicker({ onPick }: { onPick: (suit: Suit) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "radial-gradient(ellipse at center, rgba(45,27,78,0.7) 0%, rgba(15,9,32,0.85) 100%)" }}
        >
            <motion.div
                initial={{ scale: 0.8, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="rounded-3xl p-6 max-w-xs w-full"
                style={{
                    background: "linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(245,240,255,0.95) 100%)",
                    boxShadow: "0 25px 60px rgba(0,0,0,0.4), 0 0 40px rgba(168,85,247,0.15), inset 0 1px 0 rgba(255,255,255,0.8)",
                    border: "1px solid rgba(168,85,247,0.15)",
                }}
            >
                <div className="text-center mb-1">
                    <span className="text-3xl">🌟</span>
                </div>
                <h3 className="font-serif text-xl text-warm-cocoa text-center mb-5 font-bold">Choose a Virtue</h3>
                <div className="grid grid-cols-2 gap-3">
                    {ALL_SUITS.map((suit, i) => (
                        <motion.button
                            key={suit}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            onClick={() => onPick(suit)}
                            className="rounded-2xl p-5 flex flex-col items-center gap-2 transition-all hover:scale-105 active:scale-95 cursor-pointer border-2 border-white/50"
                            style={{
                                background: SUIT_GRADIENTS[suit],
                                boxShadow: "0 4px 15px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)",
                            }}
                        >
                            <span className="text-4xl" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}>{SUITS[suit].symbol}</span>
                            <span className={`text-sm font-bold ${SUITS[suit].color}`}>{SUITS[suit].name}</span>
                        </motion.button>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ═════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════

export function ChristianCrazy8({ room, currentUserId, isHost, onGameEnd, onCloseRoom }: ChristianCrazy8Props) {
    const supabase = createClient();
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

    // ─── ALL mutable game state lives in refs (no stale closures) ──
    const allHandsRef = useRef<Record<string, GameCard[]>>({});
    const drawPileRef = useRef<GameCard[]>([]);
    const discardPileRef = useRef<GameCard[]>([]); // tracks ALL played cards for reshuffle
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

    // ─── Reshuffle discard pile into draw pile when empty ──
    function reshuffleIfNeeded() {
        if (drawPileRef.current.length > 0) return;
        // Keep the top discard card, shuffle the rest back
        const pile = discardPileRef.current;
        if (pile.length <= 1) return; // nothing to reshuffle
        const reshuffled = pile.slice(0, -1); // everything except the last (top) card
        discardPileRef.current = pile.slice(-1); // keep only the top card
        // Shuffle
        for (let i = reshuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [reshuffled[i], reshuffled[j]] = [reshuffled[j], reshuffled[i]];
        }
        drawPileRef.current = reshuffled;
    }

    // ─── Safe draw: reshuffle if needed, then draw ──
    function drawFromPile(): GameCard | undefined {
        reshuffleIfNeeded();
        return drawPileRef.current.shift();
    }

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

            // ─── HOST ONLY: process play requests (from OTHER players) ───────
            .on("broadcast", { event: "play_card_request" }, ({ payload }) => {
                if (!isHost) return;
                processPlayCardOnHost(payload.playerId, payload.card, payload.chosenSuit);
            })

            // ─── HOST ONLY: process draw requests (from OTHER players) ───────
            .on("broadcast", { event: "draw_request" }, ({ payload }) => {
                if (!isHost) return;
                processDrawOnHost(payload.playerId);
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
            discardPileRef.current = [firstDiscard];
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

    // ═══════════════════════════════════════════════════════
    // HOST PROCESSING FUNCTIONS (called directly or from broadcast)
    // ═══════════════════════════════════════════════════════

    function processPlayCardOnHost(playerId: string, card: GameCard, chosenSuit: Suit | string) {
        if (processingRef.current) return;
        processingRef.current = true;

        try {
            // ★ TURN VALIDATION
            if (playerId !== currentTurnRef.current) return;

            const hands = allHandsRef.current;
            if (hands[playerId]) {
                hands[playerId] = hands[playerId].filter((c: GameCard) => c.id !== card.id);
            }

            // Track the played card in the discard pile
            discardPileRef.current.push(card);

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
                        const c = drawFromPile();
                        if (c && hands[victim]) hands[victim] = [...hands[victim], c];
                    }
                    counts[victim] = hands[victim]?.length || 0;
                    broadcast("update_hand", { playerId: victim, cards: hands[victim] });
                    if (victim === currentUserId) setMyHand([...hands[victim]]);
                    nextPlayer = getNextPlayerRef(playerId, true);
                    break;
                }
                case "plus4": {
                    const victim4 = getNextPlayerRef(playerId);
                    for (let i = 0; i < 4; i++) {
                        const c = drawFromPile();
                        if (c && hands[victim4]) hands[victim4] = [...hands[victim4], c];
                    }
                    counts[victim4] = hands[victim4]?.length || 0;
                    broadcast("update_hand", { playerId: victim4, cards: hands[victim4] });
                    if (victim4 === currentUserId) setMyHand([...hands[victim4]]);
                    nextPlayer = getNextPlayerRef(playerId, true);
                    break;
                }
                default:
                    nextPlayer = getNextPlayerRef(playerId);
            }

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

            // Broadcast to other players
            broadcast("card_played", {
                discardTop: card, currentSuit: newSuit, currentTurn: nextPlayer,
                playerCardCounts: counts, drawPileCount: drawPileRef.current.length,
                direction: directionRef.current, action: actionText,
            });

            // Update host display directly (broadcast won't echo back)
            setDiscardTop(card);
            setCurrentSuit(newSuit);
            setCurrentTurn(nextPlayer);
            setPlayerCardCounts(counts);
            setDrawPileCount(drawPileRef.current.length);
            setDirection(directionRef.current);
            setLastAction(actionText);

            if (counts[playerId] === 1) {
                const name = getMemberName(room.members, playerId);
                broadcast("one_card", { playerName: name });
                setOneCardAlert(name);
                setTimeout(() => setOneCardAlert(null), 3000);
            }

            if (counts[playerId] === 0) {
                broadcast("game_over", { winnerId: playerId });
                setPhase("ended");
                setWinnerId(playerId);
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            }
        } finally {
            processingRef.current = false;
        }
    }

    function processDrawOnHost(playerId: string) {
        if (processingRef.current) return;
        processingRef.current = true;

        try {
            if (playerId !== currentTurnRef.current) return;

            const hands = allHandsRef.current;
            const drawn = drawFromPile();
            if (!drawn) return; // truly no cards left at all

            if (hands[playerId]) hands[playerId] = [...hands[playerId], drawn];

            const counts: Record<string, number> = {};
            Object.keys(hands).forEach((id) => { counts[id] = hands[id]?.length || 0; });

            broadcast("update_hand", { playerId, cards: hands[playerId] });
            if (playerId === currentUserId) setMyHand([...(hands[playerId] || [])]);

            const nextPlayer = getNextPlayerRef(playerId);
            currentTurnRef.current = nextPlayer;

            const action = `${getMemberName(room.members, playerId)} drew a card`;

            broadcast("card_drawn", {
                currentTurn: nextPlayer, playerCardCounts: counts,
                drawPileCount: drawPileRef.current.length, action,
            });

            setCurrentTurn(nextPlayer);
            setPlayerCardCounts(counts);
            setDrawPileCount(drawPileRef.current.length);
            setLastAction(action);
        } finally {
            processingRef.current = false;
        }
    }

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

            // Optimistically remove from hand
            setMyHand((prev) => prev.filter((c) => c.id !== card.id));

            if (isHost) {
                // ★ Host: process directly (broadcast won't echo back to self)
                processPlayCardOnHost(currentUserId, card, card.suit!);
            } else {
                // Non-host: send request to host via broadcast
                setCurrentTurn("");
                broadcast("play_card_request", {
                    playerId: currentUserId,
                    card,
                    chosenSuit: card.suit,
                });
            }
        },
        [isMyTurn, discardTop, currentSuit, currentUserId, broadcast, isHost]
    );

    const handleSuitPicked = useCallback(
        (suit: Suit) => {
            setShowSuitPicker(false);
            if (!pendingWildCard) return;

            setMyHand((prev) => prev.filter((c) => c.id !== pendingWildCard.id));

            if (isHost) {
                processPlayCardOnHost(currentUserId, pendingWildCard, suit);
            } else {
                setCurrentTurn("");
                broadcast("play_card_request", {
                    playerId: currentUserId,
                    card: pendingWildCard,
                    chosenSuit: suit,
                });
            }

            setPendingWildCard(null);
        },
        [pendingWildCard, currentUserId, broadcast, isHost]
    );

    // ─── Draw a card (client side) ──────────────────────────
    const handleDraw = useCallback(() => {
        if (!isMyTurn || isDrawing) return;
        setIsDrawing(true);

        if (isHost) {
            processDrawOnHost(currentUserId);
        } else {
            setCurrentTurn("");
            broadcast("draw_request", { playerId: currentUserId });
        }

        setTimeout(() => setIsDrawing(false), 500);
    }, [isMyTurn, isDrawing, currentUserId, broadcast, isHost]);

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
            discardPileRef.current = [firstDiscard];
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

    // ─── Shimmer keyframe style (injected once) ─────────
    const shimmerStyle = `
        @keyframes shimmer {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 0 20px rgba(168,85,247,0.3), 0 0 40px rgba(168,85,247,0.1); }
            50% { box-shadow: 0 0 30px rgba(168,85,247,0.5), 0 0 60px rgba(168,85,247,0.2); }
        }
        @keyframes floatCards {
            0%, 100% { transform: translateY(0px) rotateY(0deg); }
            25% { transform: translateY(-8px) rotateY(90deg); }
            50% { transform: translateY(0px) rotateY(180deg); }
            75% { transform: translateY(-4px) rotateY(270deg); }
        }
    `;

    // ─── Dealing ────────────────────────────────────────────
    if (phase === "dealing") {
        return (
            <>
                <style>{shimmerStyle}</style>
                <div
                    className="w-full rounded-3xl p-10 text-center relative overflow-hidden"
                    style={{
                        background: "radial-gradient(ellipse at center, #2d1b4e 0%, #1a0f30 70%, #0f0920 100%)",
                        boxShadow: "inset 0 0 60px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.2)",
                        border: "1px solid rgba(168,85,247,0.15)",
                    }}
                >
                    {/* Ambient glow */}
                    <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 40%, rgba(168,85,247,0.08) 0%, transparent 70%)" }} />
                    <motion.div
                        animate={{ rotateY: [0, 360] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                        className="text-6xl mb-5 inline-block"
                        style={{ filter: "drop-shadow(0 4px 12px rgba(168,85,247,0.4))" }}
                    >🃏</motion.div>
                    <h3 className="font-serif text-xl font-bold text-purple-100 mb-2" style={{ textShadow: "0 2px 10px rgba(168,85,247,0.3)" }}>Dealing Cards...</h3>
                    <div className="flex justify-center gap-1 mb-3">
                        {[0,1,2].map(i => (
                            <motion.div
                                key={i}
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                                className="w-2 h-2 rounded-full bg-purple-400"
                            />
                        ))}
                    </div>
                    <p className="text-xs text-purple-300/60">Shuffling the virtues ✨</p>
                </div>
            </>
        );
    }

    // ─── Ended ──────────────────────────────────────────────
    if (phase === "ended" && winnerId) {
        const winnerName = getMemberName(room.members, winnerId);
        const isWinner = winnerId === currentUserId;

        return (
            <>
                <style>{shimmerStyle}</style>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="w-full rounded-3xl p-8 text-center relative overflow-hidden"
                    style={{
                        background: isWinner
                            ? "radial-gradient(ellipse at center, #2d1b4e 0%, #1a0f30 70%, #0f0920 100%)"
                            : "linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(245,240,255,0.9) 100%)",
                        boxShadow: isWinner
                            ? "0 0 40px rgba(168,85,247,0.2), inset 0 0 60px rgba(0,0,0,0.3)"
                            : "0 8px 32px rgba(0,0,0,0.08)",
                        border: isWinner ? "1px solid rgba(168,85,247,0.2)" : "1px solid rgba(0,0,0,0.05)",
                    }}
                >
                    {/* Celebratory ambient light */}
                    {isWinner && <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 30%, rgba(251,191,36,0.1) 0%, transparent 60%)" }} />}
                    <motion.div
                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-5"
                        style={{
                            background: isWinner
                                ? "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)"
                                : "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                            boxShadow: isWinner
                                ? "0 0 30px rgba(251,191,36,0.4), 0 4px 15px rgba(0,0,0,0.2)"
                                : "0 4px 12px rgba(251,191,36,0.15)",
                        }}
                    >
                        <Trophy className={`w-10 h-10 ${isWinner ? "text-white" : "text-amber-600"}`} style={{ filter: isWinner ? "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" : undefined }} />
                    </motion.div>
                    <h2 className={`font-serif text-3xl font-bold mb-2 ${isWinner ? "text-purple-100" : "text-warm-cocoa"}`} style={isWinner ? { textShadow: "0 2px 15px rgba(251,191,36,0.3)" } : undefined}>
                        {isWinner ? "🎉 You Win! 🎉" : `${winnerName} Wins!`}
                    </h2>
                    <p className={`text-sm mb-8 ${isWinner ? "text-purple-300/70" : "text-warm-grey/50"}`}>
                        {isWinner ? "You played all your cards! Amazing! ✨" : `${winnerName} played all their cards!`}
                    </p>
                    {isHost ? (
                        <div className="flex flex-col gap-2.5 max-w-[260px] mx-auto">
                            <button
                                onClick={handlePlayAgain}
                                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-serif text-sm font-bold transition-all active:scale-95"
                                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 4px 15px rgba(124,58,237,0.3)" }}
                            >
                                <RotateCcw className="w-4 h-4" /> Play Again
                            </button>
                            <button onClick={onGameEnd} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200/50 text-xs font-bold text-amber-800 transition-all active:scale-95">
                                <Shuffle className="w-3.5 h-3.5" /> Choose Another Game
                            </button>
                            <button onClick={onCloseRoom} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-xs font-bold text-rose-700 transition-all active:scale-95">
                                <LogOut className="w-3.5 h-3.5" /> Close Room
                            </button>
                        </div>
                    ) : (
                        <p className={`text-[11px] italic mt-4 ${isWinner ? "text-purple-400/50" : "text-warm-grey/40"}`}>Waiting for the host to continue...</p>
                    )}
                </motion.div>
            </>
        );
    }

    // ─── Playing ────────────────────────────────────────────
    const canIPlay = isMyTurn && discardTop ? hasPlayableCard(myHand, discardTop, currentSuit) : false;

    return (
        <div className="w-full flex flex-col gap-3">
            <style>{shimmerStyle}</style>
            {/* One Card Alert */}
            <AnimatePresence>
                {oneCardAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: -60, scale: 0.7 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -60, scale: 0.7 }}
                        transition={{ type: "spring", damping: 15, stiffness: 200 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-white px-8 py-4 rounded-2xl text-base font-bold flex items-center gap-3"
                        style={{
                            background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)",
                            boxShadow: "0 8px 32px rgba(239,68,68,0.4), 0 0 40px rgba(251,191,36,0.2)",
                            animation: "pulseGlow 1.5s ease-in-out infinite",
                        }}
                    >
                        <motion.span
                            animate={{ rotate: [0, -10, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                        >
                            <AlertCircle className="w-6 h-6" />
                        </motion.span>
                        <span className="text-lg">🚨 {oneCardAlert} has ONE CARD LEFT! 🚨</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Suit Picker */}
            <AnimatePresence>
                {showSuitPicker && <SuitPicker onPick={handleSuitPicked} />}
            </AnimatePresence>

            {/* Status Bar */}
            <div
                className="flex items-center justify-between rounded-2xl px-4 py-3 flex-wrap gap-2"
                style={{
                    background: "linear-gradient(135deg, #2d1b4e 0%, #3b1d5e 50%, #2d1b4e 100%)",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                    border: "1px solid rgba(168,85,247,0.15)",
                }}
            >
                <div className="flex items-center gap-2 text-[11px] font-bold text-purple-200">
                    <span className="text-base" style={{ filter: "drop-shadow(0 0 4px rgba(168,85,247,0.4))" }}>🃏</span>
                    <span>Crazy 8s</span>
                    <span className="text-purple-400/40">•</span>
                    {/* Animated Direction Arrow */}
                    <motion.span
                        animate={{ x: direction === 1 ? [0, 4, 0] : [0, -4, 0] }}
                        transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                        className="text-purple-300 text-sm"
                    >
                        {direction === 1 ? "→" : "←"}
                    </motion.span>
                </div>
                <div className="text-[10px] text-purple-200/70 font-bold max-w-[180px] truncate">{lastAction}</div>
                <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-purple-400/50">Current virtue:</span>
                    <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full ${SUITS[currentSuit].bgColor} ${SUITS[currentSuit].color} border ${SUITS[currentSuit].borderColor}`}
                        style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                    >
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
                        <motion.div
                            key={id}
                            animate={isActive ? { scale: [1, 1.03, 1] } : {}}
                            transition={isActive ? { repeat: Infinity, duration: 1.5 } : {}}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl transition-all`}
                            style={{
                                background: isActive
                                    ? "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,146,60,0.1) 100%)"
                                    : "rgba(255,255,255,0.6)",
                                border: isActive ? "2px solid rgba(251,191,36,0.4)" : "1px solid rgba(0,0,0,0.06)",
                                boxShadow: isActive
                                    ? "0 0 20px rgba(251,191,36,0.15), 0 2px 8px rgba(0,0,0,0.05)"
                                    : "0 1px 4px rgba(0,0,0,0.04)",
                            }}
                        >
                            {avatar ? (
                                <img src={avatar} alt={name} className={`w-8 h-8 rounded-full object-cover ${isActive ? "ring-2 ring-amber-400" : "border border-stone-200/50"}`} />
                            ) : (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatarBg(id)} ${isActive ? "ring-2 ring-amber-400" : ""}`}>
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
                            {isActive && (
                                <motion.span
                                    animate={{ rotate: [0, 15, -15, 0] }}
                                    transition={{ repeat: Infinity, duration: 1 }}
                                    className="text-sm"
                                >🃏</motion.span>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Center Area: Discard + Draw */}
            <div
                className="flex items-center justify-center gap-10 py-6 px-4 rounded-2xl relative"
                style={{
                    background: "radial-gradient(ellipse at center, #2d1b4e 0%, #1a0f30 70%, #0f0920 100%)",
                    boxShadow: "inset 0 0 40px rgba(0,0,0,0.3), inset 0 0 80px rgba(45,27,78,0.5), 0 4px 20px rgba(0,0,0,0.15)",
                    border: "1px solid rgba(168,85,247,0.12)",
                }}
            >
                {/* Subtle felt texture overlay */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "radial-gradient(circle at 30% 40%, rgba(168,85,247,0.05) 0%, transparent 50%)" }} />
                <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: "radial-gradient(circle at 70% 60%, rgba(139,92,246,0.04) 0%, transparent 50%)" }} />
                {/* Inner border glow */}
                <div className="absolute inset-[1px] rounded-2xl pointer-events-none" style={{ border: "1px solid rgba(168,85,247,0.06)" }} />

                {/* Draw Pile */}
                <button
                    onClick={handleDraw}
                    disabled={!isMyTurn || isDrawing}
                    className={`flex flex-col items-center gap-2 transition-all relative z-10 ${
                        isMyTurn && !canIPlay ? "animate-pulse" : ""
                    } ${isMyTurn ? "cursor-pointer hover:scale-105" : "cursor-not-allowed opacity-60"}`}
                >
                    <CardBack count={drawPileCount} />
                    <span className={`text-[10px] font-bold ${isMyTurn && !canIPlay ? "text-amber-300" : "text-purple-300/50"}`}>
                        {isMyTurn && !canIPlay ? "✨ Draw!" : "Draw pile"}
                    </span>
                </button>

                {/* Discard Pile */}
                <div className="flex flex-col items-center gap-2 relative z-10">
                    {discardTop ? (
                        <motion.div
                            key={discardTop.id}
                            initial={{ scale: 0.4, rotateZ: -15, y: -20 }}
                            animate={{ scale: 1, rotateZ: 0, y: 0 }}
                            transition={{ type: "spring", damping: 15, stiffness: 200 }}
                            style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}
                        >
                            <Crazy8CardView card={discardTop} size="md" />
                        </motion.div>
                    ) : (
                        <div
                            className="w-[72px] h-[102px] rounded-xl border-2 border-dashed flex items-center justify-center text-[9px]"
                            style={{ borderColor: "rgba(168,85,247,0.2)", color: "rgba(168,85,247,0.3)" }}
                        >
                            Discard
                        </div>
                    )}
                    <span className="text-[10px] font-bold text-purple-300/50">Discard</span>
                </div>
            </div>

            {/* Turn Indicator */}
            <div className="text-center py-1">
                {isMyTurn ? (
                    <motion.div
                        animate={{ scale: [1, 1.04, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl"
                        style={{
                            background: "linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(251,146,60,0.1) 100%)",
                            border: "1px solid rgba(251,191,36,0.3)",
                            boxShadow: "0 0 20px rgba(251,191,36,0.1)",
                        }}
                    >
                        <motion.span
                            animate={{ rotate: [0, 360] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                            className="text-base"
                        >✨</motion.span>
                        <span className="text-sm font-bold text-amber-700">
                            Your turn! {canIPlay ? "Play a card!" : "No matches — draw a card!"}
                        </span>
                        <motion.span
                            animate={{ rotate: [0, -360] }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                            className="text-base"
                        >✨</motion.span>
                    </motion.div>
                ) : (
                    <p className="text-[11px] text-warm-grey/40 flex items-center justify-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin text-warm-grey/30" />
                        Waiting for {getMemberName(room.members, currentTurn)}...
                    </p>
                )}
            </div>

            {/* My Hand */}
            <div
                className="rounded-2xl p-4"
                style={{
                    background: "linear-gradient(145deg, rgba(255,255,255,0.7) 0%, rgba(245,240,255,0.5) 100%)",
                    boxShadow: "0 -2px 20px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
                    border: "1px solid rgba(168,85,247,0.08)",
                    backdropFilter: "blur(10px)",
                }}
            >
                <p className="text-[10px] font-bold text-warm-grey/40 uppercase tracking-widest mb-3 text-center flex items-center justify-center gap-1.5">
                    <span>🎴</span> Your Hand <span className="text-warm-cocoa/60">({myHand.length})</span>
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 max-h-[260px] overflow-y-auto py-1">
                    {myHand.map((card) => {
                        const playable = isMyTurn && discardTop ? canPlay(card, discardTop, currentSuit) : false;
                        return (
                            <motion.div
                                key={card.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ type: "spring", damping: 20 }}
                            >
                                <Crazy8CardView
                                    card={card}
                                    playable={isMyTurn ? playable : undefined}
                                    onClick={playable ? () => handlePlayCard(card) : undefined}
                                    size="sm"
                                />
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
