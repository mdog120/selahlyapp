"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, BookOpen, RotateCw, Check, Sparkles, RefreshCw, Trophy, Heart, Shield, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import confetti from "canvas-confetti";

interface Verse {
    ref: string;
    text: string;
    blanks: string[]; // Words to blank out in scramble mode
}

const CATEGORIES: Record<string, { name: string; emoji: string; color: string; washiColor: string; bgStyle: any; verses: Verse[] }> = {
    peace: {
        name: "Peace & Rest",
        emoji: "☁️",
        color: "rgba(227, 233, 226, 0.4)",
        washiColor: "bg-emerald-50 text-emerald-700 border-emerald-100",
        bgStyle: {
            backgroundColor: "#F4F8F5",
            backgroundImage: "linear-gradient(90deg, rgba(143,151,121,0.06) 50%, transparent 50%), linear-gradient(rgba(143,151,121,0.06) 50%, transparent 50%)",
            backgroundSize: "20px 20px"
        },
        verses: [
            { ref: "Isaiah 26:3", text: "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.", blanks: ["perfect", "peace", "trusteth"] },
            { ref: "John 14:27", text: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you.", blanks: ["Peace", "world", "give"] },
            { ref: "Philippians 4:6-7", text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.", blanks: ["prayer", "thanksgiving", "requests"] },
            { ref: "Psalms 4:8", text: "I will both lay me down in peace, and sleep: for thou, Lord, only makest me dwell in safety.", blanks: ["peace", "sleep", "safety"] },
            { ref: "Colossians 3:15", text: "And let the peace of God rule in your hearts, to the which also ye are called in one body; and be ye thankful.", blanks: ["peace", "hearts", "thankful"] }
        ]
    },
    strength: {
        name: "Strength & Courage",
        emoji: "🛡️",
        color: "rgba(212, 165, 165, 0.3)",
        washiColor: "bg-rose-50 text-rose-700 border-rose-100",
        bgStyle: {
            backgroundColor: "#FFF5F5",
            backgroundImage: "linear-gradient(90deg, rgba(212,165,165,0.08) 50%, transparent 50%), linear-gradient(rgba(212,165,165,0.08) 50%, transparent 50%)",
            backgroundSize: "20px 20px"
        },
        verses: [
            { ref: "Proverbs 31:25", text: "Strength and honour are her clothing; and she shall rejoice in time to come.", blanks: ["Strength", "clothing", "rejoice"] },
            { ref: "Isaiah 40:31", text: "But they that wait upon the Lord shall renew their strength; they shall mount up with wings as eagles.", blanks: ["wait", "strength", "eagles"] },
            { ref: "Joshua 1:9", text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed.", blanks: ["commanded", "strong", "afraid"] },
            { ref: "Psalms 28:7", text: "The Lord is my strength and my shield; my heart trusted in him, and I am helped: therefore my heart greatly rejoiceth; and with my song will I praise him.", blanks: ["strength", "shield", "rejoiceth"] },
            { ref: "Ephesians 6:10", text: "Finally, my brethren, be strong in the Lord, and in the power of his might.", blanks: ["strong", "power", "might"] }
        ]
    },
    love: {
        name: "Love & Sisterhood",
        emoji: "🌸",
        color: "rgba(244, 63, 94, 0.1)",
        washiColor: "bg-pink-50 text-pink-700 border-pink-100",
        bgStyle: {
            backgroundColor: "#FFF2F5",
            backgroundImage: "linear-gradient(90deg, rgba(244,143,177,0.08) 50%, transparent 50%), linear-gradient(rgba(244,143,177,0.08) 50%, transparent 50%)",
            backgroundSize: "20px 20px"
        },
        verses: [
            { ref: "1 John 4:19", text: "We love him, because he first loved us.", blanks: ["love", "first", "loved"] },
            { ref: "1 Corinthians 13:4", text: "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up.", blanks: ["kind", "envieth", "puffed"] },
            { ref: "Proverbs 17:17", text: "A friend loveth at all times, and a brother is born for adversity.", blanks: ["friend", "loveth", "adversity"] },
            { ref: "John 15:13", text: "Greater love hath no man than this, that a man lay down his life for his friends.", blanks: ["love", "life", "friends"] },
            { ref: "Proverbs 10:12", text: "Hatred stirreth up strifes: but love covereth all sins.", blanks: ["strifes", "love", "sins"] }
        ]
    },
    joy: {
        name: "Joy & Praise",
        emoji: "☀️",
        color: "rgba(245, 158, 11, 0.15)",
        washiColor: "bg-amber-50 text-amber-800 border-amber-100",
        bgStyle: {
            backgroundColor: "#FFFFF2",
            backgroundImage: "linear-gradient(90deg, rgba(251,191,36,0.08) 50%, transparent 50%), linear-gradient(rgba(251,191,36,0.08) 50%, transparent 50%)",
            backgroundSize: "20px 20px"
        },
        verses: [
            { ref: "Nehemiah 8:10", text: "Go your way, eat the fat, and drink the sweet... for the joy of the Lord is your strength.", blanks: ["sweet", "joy", "strength"] },
            { ref: "Psalms 16:11", text: "Thou wilt shew me the path of life: in thy presence is fulness of joy; at thy right hand there are pleasures for evermore.", blanks: ["presence", "fulness", "pleasures"] },
            { ref: "Romans 15:13", text: "Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope.", blanks: ["hope", "joy", "abound"] },
            { ref: "Psalms 30:5", text: "For his anger endureth but a moment; in his favour is life: weeping may endure for a night, but joy cometh in the morning.", blanks: ["life", "weeping", "joy"] },
            { ref: "Philippians 4:4", text: "Rejoice in the Lord alway: and again I say, Rejoice.", blanks: ["Rejoice", "alway", "Rejoice"] }
        ]
    },
    wisdom: {
        name: "Wisdom & Hope",
        emoji: "🕯️",
        color: "rgba(168, 85, 247, 0.1)",
        washiColor: "bg-purple-50 text-purple-700 border-purple-100",
        bgStyle: {
            backgroundColor: "#FAF5FF",
            backgroundImage: "linear-gradient(90deg, rgba(206,147,216,0.08) 50%, transparent 50%), linear-gradient(rgba(206,147,216,0.08) 50%, transparent 50%)",
            backgroundSize: "20px 20px"
        },
        verses: [
            { ref: "Proverbs 3:5-6", text: "Trust in the Lord with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.", blanks: ["Trust", "understanding", "direct"] },
            { ref: "James 1:5", text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.", blanks: ["wisdom", "liberally", "given"] },
            { ref: "Proverbs 4:7", text: "Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding.", blanks: ["principal", "wisdom", "understanding"] },
            { ref: "James 3:17", text: "But the wisdom that is from above is first pure, then peaceable, gentle, and easy to be intreated, full of mercy and good fruits, without partiality, and without hypocrisy.", blanks: ["wisdom", "pure", "peaceable"] },
            { ref: "Psalms 111:10", text: "The fear of the Lord is the beginning of wisdom: a good understanding have all they that do his commandments: his praise endureth for ever.", blanks: ["fear", "wisdom", "commandments"] }
        ]
    }
};

interface ScriptureFlashcardsProps {
    onBack?: () => void;
}

export function ScriptureFlashcards({ onBack }: ScriptureFlashcardsProps) {
    const [category, setCategory] = useState<string | null>(null);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [gameMode, setGameMode] = useState<"card" | "scramble">("card");
    const [earnedCoins, setEarnedCoins] = useState(0);
    const [coinsRewarded, setCoinsRewarded] = useState(false);
    const [isCompletedCategory, setIsCompletedCategory] = useState(false);

    // Dynamic verification tracker: keeps indices of verses correctly solved in scramble mode
    const [solvedCards, setSolvedCards] = useState<Set<number>>(new Set());

    // Scramble Mode States
    const [scrambleOptions, setScrambleOptions] = useState<string[]>([]);
    const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
    const [scrambleStatus, setScrambleStatus] = useState<"playing" | "success" | "fail">("playing");
    const [shakeTrigger, setShakeTrigger] = useState(false);

    // Load active coins from lamb save file to display in lobby
    const [lambCoins, setLambCoins] = useState(0);

    const getLambCoins = () => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("selahly_talking_lamb_house_v2");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setLambCoins(parsed.coins ?? 50);
                } catch (e) {
                    // ignore
                }
            }
        }
    };

    useEffect(() => {
        getLambCoins();
    }, [category]);

    // Handle initial selection / resets when changing categories
    useEffect(() => {
        setSolvedCards(new Set());
        setCurrentCardIndex(0);
        setIsCompletedCategory(false);
        setIsFlipped(false);
        setEarnedCoins(0);
        setGameMode("card");
    }, [category]);

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
        setLambCoins(newCoins);
        setEarnedCoins(prev => prev + rewardAmount);
    };

    const activeCategory = category ? CATEGORIES[category] : null;
    const currentVerse = activeCategory ? activeCategory.verses[currentCardIndex] : null;

    // Trigger synthesis audio sound
    const playSuccessSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const playNote = (freq: number, start: number, duration: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.12, start + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + duration);
            };
            const now = ctx.currentTime;
            playNote(523.25, now, 0.4);       // C5
            playNote(659.25, now + 0.12, 0.4); // E5
            playNote(783.99, now + 0.24, 0.6); // G5
        } catch (e) {}
    };

    const playErrorSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(140, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.25);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } catch (e) {}
    };

    const playFlipSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(260, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.12);
            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.12);
        } catch (e) {}
    };

    // Scramble Setup
    useEffect(() => {
        if (!currentVerse || gameMode !== "scramble") return;
        
        // Blank options are target words + a few decoy biblical words
        const targets = currentVerse.blanks;
        const decoys = ["Lord", "grace", "faith", "hope", "peace", "blessing", "wisdom"].filter(
            d => !targets.map(t => t.toLowerCase()).includes(d.toLowerCase())
        ).slice(0, 2);

        const allOptions = [...targets, ...decoys];
        // Shuffle
        const shuffled = [...allOptions].sort(() => Math.random() - 0.5);
        setScrambleOptions(shuffled);
        setSelectedAnswers([]);
        setScrambleStatus("playing");
        setCoinsRewarded(false);
    }, [currentVerse, gameMode]);

    const handleSelectOption = (word: string) => {
        if (scrambleStatus !== "playing") return;
        
        const newAnswers = [...selectedAnswers, word];
        setSelectedAnswers(newAnswers);

        // Check if finished
        if (currentVerse && newAnswers.length === currentVerse.blanks.length) {
            const targets = currentVerse.blanks;
            const isCorrect = newAnswers.every((ans, idx) => ans === targets[idx]);
            
            if (isCorrect) {
                setScrambleStatus("success");
                playSuccessSound();
                confetti({
                    particleCount: 15,
                    spread: 45,
                    colors: ["#D4A5A5", "#E3E9E2", "#8D7B68", "#FCEADE"]
                });
                
                // Add to solvedCards!
                setSolvedCards(prev => {
                    const next = new Set(prev);
                    next.add(currentCardIndex);
                    return next;
                });

                // Add coin reward!
                if (!coinsRewarded) {
                    addCoinsToLamb(15);
                    setCoinsRewarded(true);
                }
            } else {
                setScrambleStatus("fail");
                playErrorSound();
                setShakeTrigger(true);
                setTimeout(() => setShakeTrigger(false), 500);
            }
        }
    };

    const handleUndo = () => {
        if (scrambleStatus !== "playing") return;
        setSelectedAnswers(prev => prev.slice(0, -1));
    };

    const handleResetScramble = () => {
        setSelectedAnswers([]);
        setScrambleStatus("playing");
    };

    const handleNextCard = () => {
        if (!activeCategory) return;
        setIsFlipped(false);
        setGameMode("card");
        
        if (currentCardIndex + 1 < activeCategory.verses.length) {
            setCurrentCardIndex(prev => prev + 1);
        } else {
            // Category Completed!
            setIsCompletedCategory(true);
            playSuccessSound();
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
            });
            // Large completion bonus ONLY if they solved ALL cards in scramble mode!
            const allSolved = solvedCards.size === activeCategory.verses.length;
            if (allSolved) {
                addCoinsToLamb(50);
            }
        }
    };

    const handleResetCategory = () => {
        setSolvedCards(new Set());
        setCurrentCardIndex(0);
        setIsCompletedCategory(false);
        setIsFlipped(false);
        setGameMode("card");
    };

    const getScrambledText = () => {
        if (!currentVerse) return "";
        let text = currentVerse.text;
        
        currentVerse.blanks.forEach((blank, idx) => {
            // Replace exact matches with blank spaces placeholders
            const regex = new RegExp(`\\b${blank}\\b`, "i");
            const answer = selectedAnswers[idx] ? `[ ${selectedAnswers[idx]} ]` : "_______";
            text = text.replace(regex, answer);
        });
        
        return text;
    };

    const isAllCategorySolved = activeCategory ? solvedCards.size === activeCategory.verses.length : false;

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 animate-fade-in text-warm-grey">
            
            {/* Header / Lobby Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-warm-grey/5">
                {category ? (
                    <button
                        onClick={() => {
                            setCategory(null);
                            setIsCompletedCategory(false);
                        }}
                        className="flex items-center gap-1 text-xs font-bold text-warm-grey/50 hover:text-warm-grey transition-colors cursor-pointer"
                    >
                        ← Exit Category
                    </button>
                ) : (
                    // Emit empty space instead of a duplicate Back to Lobby button
                    <div />
                )}
                
                <div className="flex items-center gap-2">
                    {/* Coin display */}
                    <div 
                        className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-xs font-bold text-amber-800 shadow-sm"
                        title="Your virtual lamb wallet"
                    >
                        <span>🪙</span>
                        <span>{lambCoins} Gold Coins</span>
                    </div>
                </div>
            </div>

            {!category ? (
                // ------------------ LOBBY: CATEGORY SELECTION ------------------
                <div className="flex flex-col gap-5 text-center animate-fade-in-up">
                    <div className="glass-card p-6 rounded-3xl border border-white/60 bg-white/40 max-w-md mx-auto">
                        <div className="w-12 h-12 bg-rose-100/60 rounded-full flex items-center justify-center text-xl mx-auto mb-3 shadow-inner">
                            📖
                        </div>
                        <h4 className="font-serif text-lg font-bold text-warm-cocoa mb-1">Scripture Memory Cards</h4>
                        <p className="text-xs text-warm-grey/60 leading-relaxed">
                            Select a faith topic below. Learn the verses, complete the interactive blanks challenge, and earn Gold Coins for your virtual pet Lamb! 🐑✨
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        {Object.entries(CATEGORIES).map(([key, item]) => (
                            <div
                                key={key}
                                onClick={() => {
                                    setCategory(key);
                                }}
                                className="group relative flex items-center justify-between p-5 rounded-3xl bg-white/60 hover:bg-white border border-white/80 hover:border-rose-250/20 transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                                        {item.emoji}
                                    </div>
                                    <div>
                                        <h5 className="font-serif text-sm font-bold text-warm-cocoa">{item.name}</h5>
                                        <p className="text-[10px] text-warm-grey/40">{item.verses.length} verses to memorize</p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-warm-cocoa/40 group-hover:text-warm-cocoa transition-colors">Start →</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : isCompletedCategory ? (
                // ------------------ CATEGORY COMPLETED VIEW ------------------
                <div className="flex flex-col items-center gap-5 text-center py-12 glass-card rounded-[2.5rem] bg-emerald-50/25 border border-emerald-100/40 animate-scale-up max-w-md mx-auto w-full px-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl mb-1 animate-bounce">
                        {isAllCategorySolved ? "🏆" : "🌸"}
                    </div>
                    <div>
                        <h4 className="font-serif text-xl font-bold text-emerald-800 mb-1">
                            {isAllCategorySolved ? "Topic Fully Solved!" : "Practice Finished"}
                        </h4>
                        <p className="text-xs text-warm-grey/60 max-w-xs mx-auto leading-relaxed">
                            {isAllCategorySolved 
                                ? `Praise God! You completed the **${activeCategory?.name}** set in interactive scramble mode and earned your completion bonus!` 
                                : `You've run through all the cards in **${activeCategory?.name}**. Good job reviewing the scriptures!`}
                        </p>
                    </div>

                    <div className="w-full flex flex-col gap-2.5 mt-2 bg-white/60 p-4 rounded-2xl border border-stone-100 text-left text-xs">
                        <div className="flex justify-between items-center border-b pb-2 border-stone-100">
                            <span className="font-bold text-warm-cocoa">Topic</span>
                            <span className="font-medium text-warm-grey/70">{activeCategory?.name}</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2 border-stone-100">
                            <span className="font-bold text-warm-cocoa">Scramble Completed</span>
                            <span className="font-bold text-warm-grey/70">{solvedCards.size} / {activeCategory?.verses.length} Verses</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-2 border-stone-100">
                            <span className="font-bold text-warm-cocoa">Completion Bonus</span>
                            {isAllCategorySolved ? (
                                <span className="font-bold text-emerald-700 flex items-center gap-0.5">🪙 50 Gold Coins</span>
                            ) : (
                                <span className="font-bold text-red-500/70" title="Solve all cards in scramble mode to get this bonus">Locked (0/5 Solved)</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-warm-cocoa">Session Earnings</span>
                            <span className="font-bold text-amber-700 flex items-center gap-0.5">🪙 {earnedCoins} Total</span>
                        </div>
                    </div>

                    {!isAllCategorySolved && (
                        <p className="text-[10px] text-warm-grey/50 italic leading-normal max-w-xs mt-1">
                            💡 Tip: Switch to **Interactive Scramble** mode on all verses in this category to unlock the 50 Gold Coins completion bonus! Clicking "I Know It" on the flashcard side does not reward bonus coins.
                        </p>
                    )}

                    <div className="flex flex-col gap-2 w-full mt-2">
                        <Button 
                            onClick={() => {
                                setCategory(null);
                                setIsCompletedCategory(false);
                            }}
                            className="bg-warm-cocoa text-white hover:bg-warm-cocoa/90 w-full"
                        >
                            Return to Lobby
                        </Button>
                        <Button 
                            onClick={handleResetCategory}
                            variant="secondary"
                            className="w-full"
                        >
                            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Practice Again
                        </Button>
                    </div>
                </div>
            ) : (
                // ------------------ MAIN INTERACTIVE GAMEPLAY ------------------
                <div className="flex flex-col gap-5 animate-fade-in-up">
                    
                    {/* Progress Bar / Verse count */}
                    <div className="flex flex-col gap-1 text-left px-1">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-warm-cocoa/50">
                            <span>Topic: {activeCategory?.name}</span>
                            <span>Verse {currentCardIndex + 1} of {activeCategory?.verses.length}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden">
                            <div 
                                className="h-full bg-muted-rose transition-all duration-500 ease-out" 
                                style={{ width: `${((currentCardIndex + 1) / (activeCategory?.verses.length || 1)) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Mode Selector Tab */}
                    <div className="flex bg-stone-100/60 p-0.5 rounded-xl self-center text-xs font-sans">
                        <button
                            onClick={() => setGameMode("card")}
                            className={`px-4 py-1.5 rounded-lg transition-all font-bold cursor-pointer ${gameMode === "card" ? 'bg-white shadow-sm text-warm-cocoa' : 'text-warm-grey/50 hover:text-warm-grey'}`}
                        >
                            🎴 Flashcard
                        </button>
                        <button
                            onClick={() => setGameMode("scramble")}
                            className={`px-4 py-1.5 rounded-lg transition-all font-bold cursor-pointer ${gameMode === "scramble" ? 'bg-white shadow-sm text-warm-cocoa' : 'text-warm-grey/50 hover:text-warm-grey'}`}
                        >
                            🧩 Interactive Scramble
                        </button>
                    </div>

                    {gameMode === "card" ? (
                        // =================== TAB: 3D FLASHCARD ===================
                        <div className="flex flex-col items-center gap-6">
                            
                            {/* 3D Card Container */}
                            <div 
                                onClick={() => {
                                    setIsFlipped(!isFlipped);
                                    playFlipSound();
                                }}
                                className="w-full max-w-sm h-64 cursor-pointer relative"
                                style={{ perspective: "1000px" }}
                            >
                                <div 
                                    className="w-full h-full relative rounded-[2.5rem] transition-transform duration-700 shadow-lg border border-white/60"
                                    style={{ 
                                        transformStyle: "preserve-3d",
                                        transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                                    }}
                                >
                                    
                                    {/* CARD FRONT: Scripture Reference */}
                                    <div 
                                        className="absolute inset-0 rounded-[2.5rem] p-6 flex flex-col items-center justify-between bg-white text-center"
                                        style={{ 
                                            backfaceVisibility: "hidden",
                                            ...activeCategory?.bgStyle 
                                        }}
                                    >
                                        {/* Gingham Ribbon Header */}
                                        <div className={`px-4 py-1 rounded-full border text-[9px] font-sans font-bold uppercase tracking-wider ${activeCategory?.washiColor}`}>
                                            Topic: {activeCategory?.name}
                                        </div>

                                        <div className="flex flex-col items-center gap-2.5 my-auto">
                                            <div className="w-11 h-11 rounded-full bg-stone-100 flex items-center justify-center text-xl shadow-inner">
                                                {activeCategory?.emoji}
                                            </div>
                                            <h3 className="font-serif text-3xl font-bold text-warm-cocoa tracking-tight">
                                                {currentVerse?.ref}
                                            </h3>
                                            <p className="text-[10px] text-warm-grey/40 italic">
                                                {solvedCards.has(currentCardIndex) ? "✓ Solved in Scramble Mode" : "Click to reveal scripture text ౨ৎ"}
                                            </p>
                                        </div>

                                        <span className="text-[9px] uppercase font-bold text-warm-cocoa/40 tracking-wider flex items-center gap-1 select-none pointer-events-none">
                                            <RotateCw className="w-3 h-3 text-warm-grey/30" /> Tap to Flip
                                        </span>
                                    </div>

                                    {/* CARD BACK: Scripture Text */}
                                    <div 
                                        className="absolute inset-0 rounded-[2.5rem] p-6 flex flex-col items-center justify-between bg-white text-center"
                                        style={{ 
                                            backfaceVisibility: "hidden",
                                            transform: "rotateY(180deg)",
                                            ...activeCategory?.bgStyle 
                                        }}
                                    >
                                        {/* Reference header */}
                                        <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-muted-rose">
                                            {currentVerse?.ref}
                                        </span>

                                        <p className="font-serif italic text-base md:text-lg leading-relaxed text-warm-grey/90 max-w-xs my-auto select-text">
                                            "{currentVerse?.text}"
                                        </p>

                                        <span className="text-[9px] uppercase font-bold text-warm-cocoa/40 tracking-wider flex items-center gap-1 select-none pointer-events-none">
                                            <RotateCw className="w-3 h-3 text-warm-grey/30" /> Tap to Flip
                                        </span>
                                    </div>

                                </div>
                            </div>

                            {/* Flashcard Actions */}
                            <div className="flex gap-3 w-full max-w-sm">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setIsFlipped(!isFlipped);
                                        playFlipSound();
                                    }}
                                    className="flex-1 text-xs"
                                >
                                    <RotateCw className="w-3.5 h-3.5 mr-1.5" /> Flip Card
                                </Button>
                                <Button
                                    onClick={handleNextCard}
                                    className="flex-1 text-xs bg-warm-cocoa hover:bg-warm-cocoa/90 text-white"
                                >
                                    <Check className="w-3.5 h-3.5 mr-1.5" /> Next / Done
                                </Button>
                            </div>

                        </div>
                    ) : (
                        // =================== TAB: SCRAMBLE GAME ===================
                        <div className={`flex flex-col items-center gap-5 ${shakeTrigger ? 'animate-shake' : ''}`}>
                            <style dangerouslySetInnerHTML={{__html: `
                                @keyframes shake {
                                    0%, 100% { transform: translateX(0); }
                                    25% { transform: translateX(-6px); }
                                    75% { transform: translateX(6px); }
                                }
                                .animate-shake {
                                    animation: shake 0.15s ease-in-out 3;
                                }
                            `}} />

                            <div 
                                className="w-full rounded-[2.5rem] p-6 border border-white/60 shadow-md text-center flex flex-col justify-between min-h-[220px]"
                                style={activeCategory?.bgStyle}
                            >
                                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-muted-rose block mb-2">
                                    Fill in the Blanks: {currentVerse?.ref}
                                </span>

                                <p className="font-serif italic text-base md:text-lg leading-relaxed text-warm-grey/90 max-w-md mx-auto my-auto py-4">
                                    "{getScrambledText()}"
                                </p>

                                {/* Scramble Game Overlays */}
                                {scrambleStatus === "success" && (
                                    <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50/70 border border-emerald-100 rounded-xl px-4 py-2 mt-2 flex items-center justify-center gap-1.5 animate-bounce shadow-sm">
                                        <span>🎉 Excellent work, sister!</span>
                                        <span>+🪙 15 Gold Coins</span>
                                    </div>
                                )}

                                {scrambleStatus === "fail" && (
                                    <div className="text-[11px] font-bold text-red-700 bg-red-50/70 border border-red-100 rounded-xl px-4 py-2 mt-2 flex items-center justify-center gap-1.5 shadow-sm">
                                        <span>Incorrect order. Try again!</span>
                                    </div>
                                )}
                            </div>

                            {/* Interaction buttons / Scramble options */}
                            {scrambleStatus === "playing" ? (
                                <div className="w-full flex flex-col items-center gap-4">
                                    {/* Selected answers undo controls */}
                                    {selectedAnswers.length > 0 && (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={handleUndo}
                                                className="text-[10px] font-bold uppercase tracking-wider text-warm-cocoa/60 hover:text-warm-cocoa border border-warm-grey/15 rounded-lg px-2.5 py-1 cursor-pointer bg-white"
                                            >
                                                Undo Word
                                            </button>
                                            <button 
                                                onClick={handleResetScramble}
                                                className="text-[10px] font-bold uppercase tracking-wider text-red-500/70 hover:text-red-500 border border-red-100 rounded-lg px-2.5 py-1 cursor-pointer bg-white"
                                            >
                                                Reset
                                            </button>
                                        </div>
                                    )}

                                    {/* Choice Word Blocks */}
                                    <div className="flex flex-wrap justify-center gap-2 max-w-md">
                                        {scrambleOptions.map((word, idx) => {
                                            // Check how many times this word has been selected in answers
                                            const timesSelected = selectedAnswers.filter(w => w === word).length;
                                            const timesInOptions = scrambleOptions.filter(w => w === word).length;
                                            const isUsed = timesSelected >= timesInOptions;

                                            return (
                                                <button
                                                    key={idx}
                                                    disabled={isUsed}
                                                    onClick={() => handleSelectOption(word)}
                                                    className={`px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all shadow-xs cursor-pointer ${
                                                        isUsed 
                                                            ? 'bg-stone-50 border-stone-100 text-stone-300 scale-95 shadow-none' 
                                                            : 'bg-white hover:bg-stone-50 active:scale-95 border-warm-grey/15 text-warm-cocoa hover:border-muted-rose/40'
                                                    }`}
                                                >
                                                    {word}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                // Scramble outcome buttons
                                <div className="flex gap-3 w-full max-w-xs justify-center">
                                    {scrambleStatus === "fail" ? (
                                        <Button
                                            onClick={handleResetScramble}
                                            className="w-full text-xs"
                                        >
                                            <RotateCw className="w-3.5 h-3.5 mr-1.5" /> Try Again
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleNextCard}
                                            className="w-full text-xs bg-warm-cocoa hover:bg-warm-cocoa/90 text-white"
                                        >
                                            Next Scripture →
                                        </Button>
                                    )}
                                </div>
                            )}

                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
