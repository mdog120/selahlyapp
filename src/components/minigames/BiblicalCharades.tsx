"use client";

import { useState, useEffect, useRef } from "react";
import { X, Play, RotateCw, Check, Sparkles, RefreshCw, Trophy, Heart, HelpCircle, Timer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import confetti from "canvas-confetti";

interface WomanCharacter {
    name: string;
    desc: string;
    category: "Famous" | "Brave & Wise" | "Prophetesses";
}

const CHARACTERS: WomanCharacter[] = [
    { name: "Esther", desc: "Queen of Persia, saved her nation from Haman, 'for such a time as this.'", category: "Brave & Wise" },
    { name: "Ruth", desc: "Loyal daughter-in-law of Naomi, gleaned fields of Boaz, ancestor of David.", category: "Famous" },
    { name: "Deborah", desc: "Judges prophetess and judge of Israel who led victory alongside Barak.", category: "Prophetesses" },
    { name: "Hannah", desc: "Prayed fervently for a child at Shiloh, mother of Samuel.", category: "Famous" },
    { name: "Mary (Mother of Jesus)", desc: "Chosen virgin, sang the Magnificat, kept things in her heart.", category: "Famous" },
    { name: "Abigail", desc: "Wise wife who brought gifts of food to appease David's anger.", category: "Brave & Wise" },
    { name: "Lydia", desc: "Merchant of purple fabrics in Philippi, first convert in Europe.", category: "Brave & Wise" },
    { name: "Sarah", desc: "Wife of Abraham, gave birth to Isaac in her old age, laughed at the promise.", category: "Famous" },
    { name: "Miriam", desc: "Sister of Moses, led women dancing with timbrels after crossing Red Sea.", category: "Prophetesses" },
    { name: "Priscilla", desc: "Teacher and tentmaker who instructed Apollos with husband Aquila.", category: "Brave & Wise" },
    { name: "Jael", desc: "Brave heroine who defeated Sisera with a tent peg and mallet.", category: "Brave & Wise" },
    { name: "Elizabeth", desc: "Mother of John the Baptist, cousin of Mary, righteous in old age.", category: "Famous" },
    { name: "Tabitha (Dorcas)", desc: "Almsgiver raised from the dead by Peter, made coats for widows.", category: "Brave & Wise" },
    { name: "Rebecca", desc: "Wife of Isaac, mother of Jacob and Esau, met at the well.", category: "Famous" },
    { name: "Rachel", desc: "Beloved wife of Jacob, mother of Joseph, met at the well.", category: "Famous" },
    { name: "Anna", desc: "Elderly prophetess in the temple who praised God on seeing baby Jesus.", category: "Prophetesses" },
    { name: "Mary Magdalene", desc: "Devoted follower out of whom seven demons were cast, first to see the risen Christ.", category: "Famous" },
    { name: "Rahab", desc: "Bravely hid Israelite spies in Jericho, ancestor of David and Jesus.", category: "Brave & Wise" }
];

interface BiblicalCharadesProps {
    onBack?: () => void;
}

export function BiblicalCharades({ onBack }: BiblicalCharadesProps) {
    const [gameState, setGameState] = useState<"lobby" | "countdown" | "playing" | "results">("lobby");
    const [deckFilter, setDeckFilter] = useState<"all" | "Famous" | "Brave & Wise" | "Prophetesses">("all");
    const [gameDeck, setGameDeck] = useState<WomanCharacter[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    const [lobbyCoins, setLobbyCoins] = useState(0);

    // Round summaries
    const [roundSummary, setRoundSummary] = useState<{ name: string; guessed: boolean }[]>([]);

    // Timer refs
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const countdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lobbyCountdownVal = useRef(3);
    const [countdownValDisplay, setCountdownValDisplay] = useState(3);

    // Audio effects
    const playSuccessChime = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const playNote = (freq: number, start: number, duration: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.1, start + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + duration);
            };
            const now = ctx.currentTime;
            playNote(587.33, now, 0.35);       // D5
            playNote(783.99, now + 0.1, 0.5);  // G5
        } catch (e) {}
    };

    const playPassChime = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(260, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        } catch (e) {}
    };

    const playTickSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            gain.gain.setValueAtTime(0.03, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } catch (e) {}
    };

    const loadCoins = () => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("selahly_talking_lamb_house_v2");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setLobbyCoins(parsed.coins ?? 50);
                } catch (e) {}
            }
        }
    };

    useEffect(() => {
        loadCoins();
    }, [gameState]);

    const addCoinsToLamb = (rewardAmount: number) => {
        if (typeof window === "undefined") return;
        const saved = localStorage.getItem("selahly_talking_lamb_house_v2");
        let currentData: any = {};
        if (saved) {
            try {
                currentData = JSON.parse(saved);
            } catch (e) {
                console.error(e);
            }
        }
        const currentCoins = currentData.coins ?? 50;
        const newCoins = currentCoins + rewardAmount;
        currentData.coins = newCoins;
        localStorage.setItem("selahly_talking_lamb_house_v2", JSON.stringify(currentData));
        setLobbyCoins(newCoins);
    };

    const handleStartGame = () => {
        // Shuffle deck based on filters
        const filtered = deckFilter === "all" 
            ? CHARACTERS 
            : CHARACTERS.filter(c => c.category === deckFilter);
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        
        setGameDeck(shuffled);
        setCurrentIndex(0);
        setScore(0);
        setTimeLeft(60);
        setRoundSummary([]);
        setGameState("countdown");
        lobbyCountdownVal.current = 3;
        setCountdownValDisplay(3);

        const tickCountdown = () => {
            if (lobbyCountdownVal.current > 1) {
                lobbyCountdownVal.current -= 1;
                setCountdownValDisplay(lobbyCountdownVal.current);
                playTickSound();
                countdownTimeoutRef.current = setTimeout(tickCountdown, 1000);
            } else {
                setGameState("playing");
                playSuccessChime();
                startRoundTimer();
            }
        };

        playTickSound();
        countdownTimeoutRef.current = setTimeout(tickCountdown, 1000);
    };

    const startRoundTimer = () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        
        timerIntervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    handleEndRound();
                    return 0;
                }
                if (prev <= 6) {
                    playTickSound(); // Final countdown ticks
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleEndRound = () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        setGameState("results");
        confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 }
        });
        
        // Award coins: +5 coins per correct guess
        // We will compute the score inside local state first to ensure accuracy
    };

    const handleGuess = (correct: boolean) => {
        if (gameState !== "playing" || gameDeck.length === 0) return;

        const currentWord = gameDeck[currentIndex];
        
        // Save round summary
        setRoundSummary(prev => [...prev, { name: currentWord.name, guessed: correct }]);

        if (correct) {
            setScore(prev => prev + 1);
            playSuccessChime();
            confetti({
                particleCount: 10,
                spread: 30,
                colors: ["#D4A5A5", "#E3E9E2"]
            });
        } else {
            playPassChime();
        }

        // Advance card or end game if out of words
        if (currentIndex + 1 < gameDeck.length) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Recycled wrap-around if they complete all 18 characters under 60 seconds
            const reshuffled = [...gameDeck].sort(() => Math.random() - 0.5);
            setGameDeck(reshuffled);
            setCurrentIndex(0);
        }
    };

    const handleFinishGame = () => {
        setGameState("lobby");
    };

    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            if (countdownTimeoutRef.current) clearTimeout(countdownTimeoutRef.current);
        };
    }, []);

    const activeChar = gameDeck[currentIndex];

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in text-warm-grey">
            
            {/* Countdown State */}
            {gameState === "countdown" && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-soft-blush/90 backdrop-blur-md animate-fade-in">
                    <div className="text-center flex flex-col items-center gap-4">
                        <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-muted-rose">Prepare to shout clues!</span>
                        <h2 className="font-serif text-8xl font-bold text-warm-cocoa animate-pulse">
                            {countdownValDisplay}
                        </h2>
                        <p className="text-xs text-warm-grey/60 max-w-xs leading-relaxed mt-2">
                            Hold the phone up to your forehead facing your friends, or let a friend hold the screen! ౨ৎ
                        </p>
                    </div>
                </div>
            )}

            {/* Lobby / Setup State */}
            {gameState === "lobby" && (
                <div className="flex flex-col gap-5 text-center animate-fade-in-up">
                    <div className="glass-card p-6 rounded-3xl border border-white/60 bg-white/40 max-w-md mx-auto relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-soft-blush/10 rounded-bl-full pointer-events-none" />
                        <div className="w-12 h-12 bg-rose-100/60 rounded-full flex items-center justify-center text-xl mx-auto mb-3 shadow-inner">
                            🎭
                        </div>
                        <h4 className="font-serif text-lg font-bold text-warm-cocoa mb-1">Virtuous Female Charades</h4>
                        <p className="text-xs text-warm-grey/60 leading-relaxed">
                            A cozy "Heads Up" party game! Hold the device facing your sisters. They must describe the virtuous biblical woman without saying her name! Guess as many as you can in 60 seconds.
                        </p>
                    </div>

                    {/* Setup Controls */}
                    <div className="glass-card p-5 rounded-2xl max-w-md mx-auto w-full flex flex-col gap-4 text-left border border-white/60 bg-white/30">
                        <div>
                            <span className="text-[9px] uppercase font-bold text-warm-cocoa/40 tracking-wider mb-2 block">Choose Character Deck</span>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: "all", label: "✨ All Decks", emoji: "🎴" },
                                    { id: "Famous", label: "🌸 Famous Women", emoji: "👸" },
                                    { id: "Brave & Wise", label: "🛡️ Brave & Wise", emoji: "📖" },
                                    { id: "Prophetesses", label: "🕯️ Prophetesses", emoji: "✍️" }
                                ].map((deck) => (
                                    <button
                                        key={deck.id}
                                        onClick={() => setDeckFilter(deck.id as any)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                            deckFilter === deck.id
                                                ? "bg-[#D4A5A5] border-[#D4A5A5] text-white"
                                                : "bg-white border-warm-grey/15 text-warm-grey/70 hover:bg-stone-50"
                                        }`}
                                    >
                                        <span>{deck.emoji}</span>
                                        <span>{deck.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            onClick={handleStartGame}
                            className="bg-warm-cocoa text-white hover:bg-warm-cocoa/90 w-full rounded-xl py-3 text-xs tracking-wider font-bold shadow-sm mt-1"
                        >
                            <Play className="w-3.5 h-3.5 fill-current mr-1.5" /> Start 60s Round
                        </Button>
                    </div>
                </div>
            )}

            {/* Gameplay State */}
            {gameState === "playing" && activeChar && (
                <div className="flex flex-col gap-5 items-center animate-fade-in-up">
                    
                    {/* Header bar */}
                    <div className="w-full flex justify-between items-center bg-white/60 border border-stone-100 p-3 rounded-2xl shadow-xs px-4">
                        <div className="flex items-center gap-2 text-xs font-bold">
                            <Timer className={`w-4 h-4 ${timeLeft <= 6 ? 'text-red-500 animate-pulse' : 'text-warm-grey/50'}`} />
                            <span className={timeLeft <= 6 ? 'text-red-500 font-bold font-mono' : 'font-mono'}>{timeLeft}s</span>
                        </div>
                        <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-muted-rose">
                            Deck: {deckFilter === "all" ? "All Decks" : deckFilter}
                        </span>
                        <div className="text-xs font-bold text-warm-cocoa">
                            Score: <span className="font-mono text-base font-extrabold">{score}</span>
                        </div>
                    </div>

                    {/* Heads-up Card View */}
                    <div className="w-full h-80 rounded-[3rem] p-6 shadow-xl border border-white/70 flex flex-col justify-between items-center text-center relative overflow-hidden bg-gradient-to-br from-soft-blush/30 to-amber-50/20">
                        {/* Cozy graphics details */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-100/10 rounded-bl-full pointer-events-none" />
                        <div className="absolute -bottom-10 -left-10 text-rose-100/10 rotate-12 pointer-events-none select-none text-9xl font-bold">
                            ౨ৎ
                        </div>

                        {/* Top banner instruction */}
                        <span className="text-[9px] uppercase font-bold tracking-widest text-[#BE185D] px-3.5 py-1 bg-rose-50 border border-rose-100 rounded-full">
                            Shout Clues! Describe this woman:
                        </span>

                        {/* Main heads-up name display */}
                        <div className="my-auto select-none pointer-events-none px-4">
                            <h2 className="font-serif text-4xl md:text-5xl font-extrabold text-warm-cocoa tracking-tight leading-snug drop-shadow-xs">
                                {activeChar.name}
                            </h2>
                            <p className="text-[10.5px] text-warm-grey/50 max-w-sm mt-3.5 leading-relaxed italic">
                                "{activeChar.desc}"
                            </p>
                        </div>

                        {/* Bottom helper navigation */}
                        <span className="text-[8.5px] font-bold uppercase tracking-widest text-warm-grey/40 select-none">
                            Tap Left for PASS • Tap Right for CORRECT
                        </span>
                    </div>

                    {/* Large Easy-tap Actions */}
                    <div className="grid grid-cols-2 gap-4 w-full h-24">
                        <button
                            onClick={() => handleGuess(false)}
                            className="bg-red-50 hover:bg-red-100/70 border-2 border-red-200/50 rounded-[2rem] text-red-700 font-serif text-sm font-bold flex flex-col items-center justify-center gap-1 shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
                        >
                            <span className="text-xl">❌</span>
                            <span className="text-[10px] uppercase font-sans tracking-widest font-bold">Pass (Skip)</span>
                        </button>
                        <button
                            onClick={() => handleGuess(true)}
                            className="bg-emerald-50 hover:bg-emerald-100/70 border-2 border-emerald-200/50 rounded-[2rem] text-emerald-800 font-serif text-sm font-bold flex flex-col items-center justify-center gap-1 shadow-md hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
                        >
                            <span className="text-xl">✅</span>
                            <span className="text-[10px] uppercase font-sans tracking-widest font-bold">Correct</span>
                        </button>
                    </div>

                    {/* Urgent exit button */}
                    <button
                        onClick={handleEndRound}
                        className="text-[10px] uppercase font-bold text-warm-grey/40 hover:text-warm-grey transition-colors mt-2 cursor-pointer"
                    >
                        Stop Round Early
                    </button>
                </div>
            )}

            {/* Results summary state */}
            {gameState === "results" && (
                <div className="flex flex-col gap-5 items-center text-center animate-fade-in-up max-w-md mx-auto w-full">
                    
                    <div className="glass-card p-6 rounded-[2.5rem] bg-emerald-50/25 border border-emerald-100/40 w-full flex flex-col items-center gap-3">
                        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-2xl animate-bounce">
                            🏆
                        </div>
                        <div>
                            <h4 className="font-serif text-lg font-bold text-emerald-800 mb-0.5">Round Finished!</h4>
                            <p className="text-xs text-warm-grey/60 max-w-xs leading-normal">
                                Excellent job! You guessed **{score}** biblical characters correctly.
                            </p>
                        </div>

                        <div className="w-full flex flex-col gap-2.5 mt-2 bg-white/60 p-4 rounded-2xl border border-stone-100 text-left text-xs">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-warm-cocoa">Guessed Correctly</span>
                                <span className="font-bold text-emerald-700">{score} / {roundSummary.length} characters</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Scroll list */}
                    {roundSummary.length > 0 && (
                        <div className="w-full bg-white/70 p-4 rounded-3xl border border-stone-100 text-left flex flex-col gap-2 shadow-xs">
                            <span className="text-[9px] uppercase font-bold text-warm-cocoa/40 tracking-wider mb-1 block">Round Summary Details</span>
                            <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                                {roundSummary.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-stone-50 last:border-0">
                                        <span className="font-medium text-warm-grey">{item.name}</span>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                            item.guessed 
                                                ? "bg-emerald-50 text-emerald-700" 
                                                : "bg-red-50 text-red-600"
                                        }`}>
                                            {item.guessed ? "Correct" : "Passed"}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <Button
                        onClick={handleFinishGame}
                        className="bg-warm-cocoa hover:bg-warm-cocoa/90 text-white w-full rounded-2xl py-4 text-xs font-sans font-bold tracking-wide shadow-md"
                    >
                        Finish Game ౨ৎ
                    </Button>
                </div>
            )}

        </div>
    );
}
