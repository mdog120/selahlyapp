"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

// ─── Types ──────────────────────────────────────────────────

interface MemoryCard {
    id: number;
    pairId: number;
    emoji: string;
    label: string;
    flipped: boolean;
    matched: boolean;
}

type Difficulty = "easy" | "medium" | "hard";

// ─── Bible-themed pairs ─────────────────────────────────────

const ALL_PAIRS = [
    { emoji: "✝️", label: "The Cross" },
    { emoji: "🕊️", label: "Holy Spirit" },
    { emoji: "🍞", label: "Bread of Life" },
    { emoji: "🐑", label: "Lamb of God" },
    { emoji: "🌊", label: "Baptism" },
    { emoji: "🔥", label: "Burning Bush" },
    { emoji: "🌿", label: "Olive Branch" },
    { emoji: "👑", label: "King of Kings" },
    { emoji: "📜", label: "The Scrolls" },
    { emoji: "⭐", label: "Star of Bethlehem" },
    { emoji: "🪨", label: "The Rock" },
    { emoji: "🏛️", label: "The Temple" },
    { emoji: "🐟", label: "Ichthys" },
    { emoji: "🍷", label: "New Covenant" },
    { emoji: "💧", label: "Living Water" },
    { emoji: "🌈", label: "God's Promise" },
    { emoji: "🎺", label: "Trumpet of God" },
    { emoji: "🕯️", label: "Light of the World" },
    { emoji: "🗝️", label: "Keys of the Kingdom" },
    { emoji: "⚔️", label: "Sword of the Spirit" },
    { emoji: "🛡️", label: "Shield of Faith" },
    { emoji: "👼", label: "Angels" },
    { emoji: "🏔️", label: "Mount Sinai" },
    { emoji: "🌾", label: "Harvest" },
    { emoji: "🫒", label: "Garden of Gethsemane" },
    { emoji: "🪄", label: "Staff of Moses" },
    { emoji: "🎵", label: "Psalms" },
    { emoji: "💎", label: "Pearl of Great Price" },
    { emoji: "🌅", label: "Resurrection Morning" },
    { emoji: "🏹", label: "Armor of God" },
];

const DIFFICULTY_CONFIG: Record<Difficulty, { pairs: number; cols: number; label: string }> = {
    easy: { pairs: 6, cols: 3, label: "Easy" },
    medium: { pairs: 10, cols: 4, label: "Medium" },
    hard: { pairs: 15, cols: 5, label: "Hard" },
};

// ─── Helpers ────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function buildDeck(difficulty: Difficulty): MemoryCard[] {
    const config = DIFFICULTY_CONFIG[difficulty];
    const selectedPairs = shuffle(ALL_PAIRS).slice(0, config.pairs);
    const cards: MemoryCard[] = [];
    selectedPairs.forEach((pair, idx) => {
        cards.push({ id: idx * 2, pairId: idx, emoji: pair.emoji, label: pair.label, flipped: false, matched: false });
        cards.push({ id: idx * 2 + 1, pairId: idx, emoji: pair.emoji, label: pair.label, flipped: false, matched: false });
    });
    return shuffle(cards);
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Component ──────────────────────────────────────────────

export function MemoryMatch() {
    const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
    const [cards, setCards] = useState<MemoryCard[]>([]);
    const [flippedIds, setFlippedIds] = useState<number[]>([]);
    const [matchedPairs, setMatchedPairs] = useState(0);
    const [moves, setMoves] = useState(0);
    const [timer, setTimer] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [bestScores, setBestScores] = useState<Record<Difficulty, number | null>>({ easy: null, medium: null, hard: null });
    const [recentMatch, setRecentMatch] = useState<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const lockRef = useRef(false);

    // Load best scores from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem("selahly_memory_best");
            if (saved) setBestScores(JSON.parse(saved));
        } catch {}
    }, []);

    // Timer
    useEffect(() => {
        if (difficulty && !gameOver) {
            timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [difficulty, gameOver]);

    // Start game
    const startGame = useCallback((diff: Difficulty) => {
        setDifficulty(diff);
        setCards(buildDeck(diff));
        setFlippedIds([]);
        setMatchedPairs(0);
        setMoves(0);
        setTimer(0);
        setGameOver(false);
        setRecentMatch(null);
        lockRef.current = false;
    }, []);

    // Handle card flip
    const handleFlip = useCallback((cardId: number) => {
        if (lockRef.current) return;
        if (flippedIds.length >= 2) return;

        const card = cards.find((c) => c.id === cardId);
        if (!card || card.flipped || card.matched) return;

        const newFlipped = [...flippedIds, cardId];
        setFlippedIds(newFlipped);
        setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, flipped: true } : c)));

        if (newFlipped.length === 2) {
            lockRef.current = true;
            setMoves((m) => m + 1);

            const [first, second] = newFlipped;
            const card1 = cards.find((c) => c.id === first)!;
            const card2 = cards.find((c) => c.id === second)!;

            if (card1.pairId === card2.pairId) {
                // Match!
                setRecentMatch(card1.label);
                setTimeout(() => setRecentMatch(null), 1500);

                setTimeout(() => {
                    setCards((prev) =>
                        prev.map((c) =>
                            c.pairId === card1.pairId ? { ...c, matched: true, flipped: true } : c
                        )
                    );
                    setFlippedIds([]);
                    lockRef.current = false;

                    setMatchedPairs((prev) => {
                        const newCount = prev + 1;
                        const totalPairs = DIFFICULTY_CONFIG[difficulty!].pairs;

                        if (newCount >= totalPairs) {
                            // Game won!
                            setGameOver(true);
                            confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

                            // Save best score
                            setBestScores((prev) => {
                                const current = prev[difficulty!];
                                // We use `timer` at this point - but we need the ref approach
                                // Actually just compute moves as score
                                if (current === null || newCount < current) {
                                    const updated = { ...prev, [difficulty!]: newCount };
                                    try { localStorage.setItem("selahly_memory_best", JSON.stringify(updated)); } catch {}
                                    return updated;
                                }
                                return prev;
                            });
                        }
                        return newCount;
                    });
                }, 500);
            } else {
                // No match — flip back
                setTimeout(() => {
                    setCards((prev) =>
                        prev.map((c) =>
                            newFlipped.includes(c.id) ? { ...c, flipped: false } : c
                        )
                    );
                    setFlippedIds([]);
                    lockRef.current = false;
                }, 800);
            }
        }
    }, [cards, flippedIds, difficulty]);

    const totalPairs = difficulty ? DIFFICULTY_CONFIG[difficulty].pairs : 0;
    const cols = difficulty ? DIFFICULTY_CONFIG[difficulty].cols : 4;

    // ─── Difficulty Selection ──
    if (!difficulty) {
        return (
            <div className="w-full flex flex-col gap-5 animate-fade-in">
                {/* Header */}
                <div className="glass-card p-6 rounded-3xl border border-white/60 bg-white/40 text-center relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/10 rounded-bl-full pointer-events-none" />
                    <div className="w-16 h-16 rounded-full bg-indigo-100/40 flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm relative">
                        <span className="relative z-10">🧠</span>
                        <span className="absolute inset-0 rounded-full bg-indigo-100/20 blur-md animate-pulse" />
                    </div>
                    <h2 className="font-serif text-xl font-bold text-warm-cocoa mb-2">Memory Match</h2>
                    <p className="text-xs text-warm-grey/50 max-w-xs mx-auto leading-relaxed">
                        Flip cards to find matching Bible symbols. Test your memory and discover
                        the beautiful imagery of scripture.
                    </p>
                </div>

                {/* Difficulty Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => {
                        const config = DIFFICULTY_CONFIG[diff];
                        const best = bestScores[diff];
                        const colors = {
                            easy: { bg: "bg-emerald-50", border: "border-emerald-200/50", text: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700" },
                            medium: { bg: "bg-amber-50", border: "border-amber-200/50", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
                            hard: { bg: "bg-rose-50", border: "border-rose-200/50", text: "text-rose-700", badge: "bg-rose-100 text-rose-700" },
                        }[diff];

                        return (
                            <button
                                key={diff}
                                onClick={() => startGame(diff)}
                                className={`flex flex-col items-center gap-2 p-5 rounded-2xl ${colors.bg} border ${colors.border} hover:scale-[1.02] active:scale-95 transition-all shadow-sm`}
                            >
                                <span className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                                    {config.label}
                                </span>
                                <span className="text-2xl">
                                    {diff === "easy" ? "🌸" : diff === "medium" ? "🌿" : "🔥"}
                                </span>
                                <span className="text-[10px] text-warm-grey/50">
                                    {config.pairs} pairs ({config.pairs * 2} cards)
                                </span>
                                {best !== null && (
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                                        Best: {best} moves
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    // ─── Game Over ──
    if (gameOver) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full flex flex-col gap-5 animate-fade-in"
            >
                <div className="glass-card p-6 rounded-3xl border border-white/60 bg-white/40 text-center relative overflow-hidden shadow-sm">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/10 rounded-bl-full pointer-events-none" />

                    <div className="w-16 h-16 rounded-full bg-amber-100/40 flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm">
                        🏆
                    </div>

                    <h2 className="font-serif text-2xl font-bold text-warm-cocoa mb-2">All Pairs Found! 🎉</h2>
                    <p className="text-xs text-warm-grey/50 mb-4">
                        &ldquo;Your word is a lamp for my feet, a light on my path.&rdquo; — Psalm 119:105
                    </p>

                    <div className="flex items-center justify-center gap-4 mb-5">
                        <div className="bg-white/60 rounded-xl px-4 py-2 border border-stone-200/30">
                            <p className="text-[9px] text-warm-grey/40 uppercase font-bold">Moves</p>
                            <p className="text-lg font-bold text-warm-cocoa">{moves}</p>
                        </div>
                        <div className="bg-white/60 rounded-xl px-4 py-2 border border-stone-200/30">
                            <p className="text-[9px] text-warm-grey/40 uppercase font-bold">Time</p>
                            <p className="text-lg font-bold text-warm-cocoa">{formatTime(timer)}</p>
                        </div>
                        <div className="bg-white/60 rounded-xl px-4 py-2 border border-stone-200/30">
                            <p className="text-[9px] text-warm-grey/40 uppercase font-bold">Stars</p>
                            <p className="text-lg font-bold text-amber-600">
                                {moves <= totalPairs + 2 ? "⭐⭐⭐" : moves <= totalPairs * 2 ? "⭐⭐" : "⭐"}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 max-w-xs mx-auto">
                        <button
                            onClick={() => startGame(difficulty)}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-warm-cocoa text-white font-serif text-sm font-bold transition-all active:scale-95 shadow-lg shadow-warm-cocoa/20"
                        >
                            🔄 Play Again
                        </button>
                        <button
                            onClick={() => setDifficulty(null)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-stone-100 text-warm-grey text-xs font-bold transition-all active:scale-95"
                        >
                            ← Change Difficulty
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    // ─── Game Board ──
    return (
        <div className="w-full flex flex-col gap-4 animate-fade-in">
            {/* Status Bar */}
            <div className="flex items-center justify-between bg-white/50 border border-warm-grey/5 rounded-2xl px-4 py-2.5 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-bold text-warm-grey/50">
                    🧠 Memory Match
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-warm-cocoa">
                        {matchedPairs}/{totalPairs} pairs
                    </span>
                    <span className="text-xs font-bold text-warm-grey/50">
                        {moves} moves
                    </span>
                    <span className="text-xs font-bold text-warm-cocoa">
                        ⏱️ {formatTime(timer)}
                    </span>
                </div>
            </div>

            {/* Match announcement */}
            <AnimatePresence>
                {recentMatch && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="bg-emerald-50 border border-emerald-200/50 rounded-xl px-4 py-2 text-center"
                    >
                        <p className="text-xs font-bold text-emerald-700">✨ Matched: {recentMatch}!</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(matchedPairs / totalPairs) * 100}%` }}
                    transition={{ type: "spring", damping: 20 }}
                />
            </div>

            {/* Card Grid */}
            <div
                className="grid gap-2 mx-auto w-full"
                style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    maxWidth: cols <= 3 ? "320px" : cols <= 4 ? "400px" : "500px",
                }}
            >
                {cards.map((card) => (
                    <motion.button
                        key={card.id}
                        onClick={() => handleFlip(card.id)}
                        disabled={card.flipped || card.matched}
                        className="relative aspect-square cursor-pointer"
                        whileTap={{ scale: 0.9 }}
                        layout
                    >
                        <AnimatePresence mode="wait">
                            {card.flipped || card.matched ? (
                                <motion.div
                                    key="front"
                                    initial={{ rotateY: 90 }}
                                    animate={{ rotateY: 0 }}
                                    exit={{ rotateY: 90 }}
                                    transition={{ duration: 0.25 }}
                                    className={`absolute inset-0 rounded-xl flex flex-col items-center justify-center border shadow-sm ${
                                        card.matched
                                            ? "bg-emerald-50 border-emerald-300/50 shadow-emerald-100"
                                            : "bg-white border-amber-200/50 shadow-amber-50"
                                    }`}
                                >
                                    <span className="text-2xl sm:text-3xl mb-0.5">{card.emoji}</span>
                                    <span className="text-[7px] sm:text-[8px] font-bold text-warm-cocoa/60 leading-tight text-center px-1">
                                        {card.label}
                                    </span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="back"
                                    initial={{ rotateY: -90 }}
                                    animate={{ rotateY: 0 }}
                                    exit={{ rotateY: -90 }}
                                    transition={{ duration: 0.25 }}
                                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-200/40 flex items-center justify-center shadow-sm hover:shadow-md hover:border-indigo-300/60 transition-all"
                                >
                                    <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center">
                                        <span className="text-indigo-400 text-sm font-bold">✦</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                ))}
            </div>

            {/* Restart button */}
            <div className="flex justify-center gap-3 mt-2">
                <button
                    onClick={() => startGame(difficulty)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/60 hover:bg-white border border-stone-200/40 text-xs font-bold text-warm-cocoa transition-all active:scale-95"
                >
                    🔄 Restart
                </button>
                <button
                    onClick={() => setDifficulty(null)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/60 hover:bg-white border border-stone-200/40 text-xs font-bold text-warm-cocoa transition-all active:scale-95"
                >
                    ← Difficulty
                </button>
            </div>
        </div>
    );
}
