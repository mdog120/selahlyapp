"use client";

import { useState } from "react";
import { Coffee, RotateCcw, Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface VerseItem {
    ref: string;
    book: string;
    chapter: number;
    text: string;
}

interface TeaRecipe {
    fruit: string;
    name: string;
    color: string;
    washiColor: string;
    verses: VerseItem[];
}

const TEA_RECIPES: TeaRecipe[] = [
    {
        fruit: "Love",
        name: "Strawberry Love Tea 🍓",
        color: "rgba(239, 68, 68, 0.3)", // Red
        washiColor: "bg-red-50 text-red-600 border-red-100",
        verses: [
            { ref: "1 Corinthians 13:4", book: "1 Corinthians", chapter: 13, text: "Love is patient, love is kind. It does not envy, it does not boast..." },
            { ref: "1 John 4:19", book: "1 John", chapter: 4, text: "We love because he first loved us." },
            { ref: "John 15:12", book: "John", chapter: 15, text: "This is my commandment, that you love one another as I have loved you." }
        ]
    },
    {
        fruit: "Joy",
        name: "Sweet Orange Joy Tea 🍊",
        color: "rgba(249, 115, 22, 0.3)", // Orange
        washiColor: "bg-orange-50 text-orange-600 border-orange-100",
        verses: [
            { ref: "Psalms 16:11", book: "Psalms", chapter: 16, text: "You make known to me the path of life; in your presence there is fullness of joy." },
            { ref: "Nehemiah 8:10", book: "Nehemiah", chapter: 8, text: "Do not grieve, for the joy of the Lord is your strength." },
            { ref: "Philippians 4:4", book: "Philippians", chapter: 4, text: "Rejoice in the Lord always; again I will say, rejoice." }
        ]
    },
    {
        fruit: "Peace",
        name: "White Peach Peace Tea 🍑",
        color: "rgba(251, 146, 60, 0.25)", // Peach
        washiColor: "bg-amber-50 text-amber-600 border-amber-100",
        verses: [
            { ref: "John 14:27", book: "John", chapter: 14, text: "Peace I leave with you; my peace I give to you. Not as the world gives..." },
            { ref: "Philippians 4:7", book: "Philippians", chapter: 4, text: "And the peace of God, which surpasses all understanding, will guard your hearts..." },
            { ref: "Isaiah 26:3", book: "Isaiah", chapter: 26, text: "You keep him in perfect peace whose mind is stayed on you..." }
        ]
    },
    {
        fruit: "Patience",
        name: "Sage Leaf Patience Tea 🌿",
        color: "rgba(143, 151, 121, 0.35)", // Sage
        washiColor: "bg-emerald-50 text-emerald-600 border-emerald-100",
        verses: [
            { ref: "Psalms 37:7", book: "Psalms", chapter: 37, text: "Be still before the Lord and wait patiently for him..." },
            { ref: "Romans 12:12", book: "Romans", chapter: 12, text: "Rejoice in hope, be patient in tribulation, be constant in prayer." },
            { ref: "James 5:7", book: "James", chapter: 5, text: "Be patient, therefore, brothers, until the coming of the Lord..." }
        ]
    },
    {
        fruit: "Kindness",
        name: "Wild Honey Kindness Tea 🍯",
        color: "rgba(245, 158, 11, 0.3)", // Gold
        washiColor: "bg-yellow-50 text-yellow-600 border-yellow-100",
        verses: [
            { ref: "Ephesians 4:32", book: "Ephesians", chapter: 4, text: "Be kind to one another, tenderhearted, forgiving one another..." },
            { ref: "Colossians 3:12", book: "Colossians", chapter: 3, text: "Put on then, as God's chosen ones, compassionate hearts, kindness..." },
            { ref: "Proverbs 31:26", book: "Proverbs", chapter: 31, text: "She opens her mouth with wisdom, and the teaching of kindness is on her tongue." }
        ]
    },
    {
        fruit: "Goodness",
        name: "Green Apple Goodness Tea 🍏",
        color: "rgba(34, 197, 94, 0.25)", // Light Green
        washiColor: "bg-green-50 text-green-600 border-green-100",
        verses: [
            { ref: "Psalms 23:6", book: "Psalms", chapter: 23, text: "Surely goodness and mercy shall follow me all the days of my life..." },
            { ref: "Galatians 6:9", book: "Galatians", chapter: 6, text: "And let us not grow weary of doing good, for in due season we will reap..." },
            { ref: "Psalms 27:13", book: "Psalms", chapter: 27, text: "I believe that I shall look upon the goodness of the Lord in the land of the living!" }
        ]
    },
    {
        fruit: "Faithfulness",
        name: "Autumn Grape Faithfulness Tea 🍇",
        color: "rgba(168, 85, 247, 0.25)", // Purple
        washiColor: "bg-purple-50 text-purple-600 border-purple-100",
        verses: [
            { ref: "Lamentations 3:22-23", book: "Lamentations", chapter: 3, text: "The steadfast love of the Lord never ceases... great is your faithfulness." },
            { ref: "Psalms 36:5", book: "Psalms", chapter: 36, text: "Your steadfast love, O Lord, extends to the heavens, your faithfulness..." },
            { ref: "2 Thessalonians 3:3", book: "2 Thessalonians", chapter: 3, text: "But the Lord is faithful. He will establish you and guard you..." }
        ]
    },
    {
        fruit: "Gentleness",
        name: "Rosewater Gentleness Tea 🌸",
        color: "rgba(244, 63, 94, 0.2)", // Rose
        washiColor: "bg-rose-50 text-rose-600 border-rose-100",
        verses: [
            { ref: "Philippians 4:5", book: "Philippians", chapter: 4, text: "Let your gentleness be known to everyone. The Lord is at hand." },
            { ref: "Colossians 3:13", book: "Colossians", chapter: 3, text: "bearing with one another and, if one has a complaint, forgiving..." },
            { ref: "1 Peter 3:15", book: "1 Peter", chapter: 3, text: "but in your hearts honor Christ... do it with gentleness and respect." }
        ]
    },
    {
        fruit: "Self-Control",
        name: "Meyer Lemon Self-Control Tea 🍋",
        color: "rgba(234, 179, 8, 0.25)", // Yellow
        washiColor: "bg-yellow-100/60 text-yellow-700 border-yellow-200/50",
        verses: [
            { ref: "Proverbs 25:28", book: "Proverbs", chapter: 25, text: "A man without self-control is like a city broken into and left without walls." },
            { ref: "2 Timothy 1:7", book: "2 Timothy", chapter: 1, text: "for God gave us a spirit not of fear but of power and love and self-control." },
            { ref: "Titus 2:12", book: "Titus", chapter: 2, text: "training us to renounce ungodliness and worldly passions... to live self-controlled..." }
        ]
    }
];

interface FruitTeaSteeperProps {
    onSelectScripture: (book: string, chapter: number) => void;
}

export function FruitTeaSteeper({ onSelectScripture }: FruitTeaSteeperProps) {
    const [selectedTea, setSelectedTea] = useState<TeaRecipe | null>(null);
    const [steeping, setSteeping] = useState(false);
    const [steeped, setSteeped] = useState(false);
    const [sips, setSips] = useState(0);

    const handleDrawTea = () => {
        setSteeped(false);
        setSteeping(true);
        setSips(0);
        
        // Pick random recipe
        const randomIdx = Math.floor(Math.random() * TEA_RECIPES.length);
        setSelectedTea(TEA_RECIPES[randomIdx]);

        // Steep delay (breathing steam animation)
        setTimeout(() => {
            setSteeping(false);
            setSteeped(true);
        }, 2200);
    };

    const handleSelectSpecificTea = (tea: TeaRecipe) => {
        setSteeped(false);
        setSteeping(true);
        setSips(0);
        setSelectedTea(tea);

        setTimeout(() => {
            setSteeping(false);
            setSteeped(true);
        }, 2200);
    };

    const playSipSound = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = "sine";
            // Soft swallow sound (downward pitch sweep)
            osc.frequency.setValueAtTime(350, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.18);
            
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.18);
        } catch (e) {
            // Context blocked or unsupported
        }
    };

    const handleSip = () => {
        if (sips < 5) {
            setSips(prev => prev + 1);
            playSipSound();
        }
    };

    const handleReset = () => {
        setSelectedTea(null);
        setSteeping(false);
        setSteeped(false);
        setSips(0);
    };

    // Calculate vertical fill height percentage based on sips (5 sips total)
    const teaHeight = steeped ? Math.max(0, 100 - sips * 20) : 0;

    return (
        <div 
            className="group relative overflow-hidden p-6 rounded-3xl border border-warm-grey/10 shadow-sm bg-white/60 backdrop-blur-sm relative"
            style={{
                backgroundImage: "linear-gradient(90deg, rgba(212,165,165,0.02) 50%, transparent 50%), linear-gradient(rgba(212,165,165,0.02) 50%, transparent 50%)",
                backgroundSize: "20px 20px"
            }}
        >
            <div className="absolute top-0 right-0 w-16 h-16 bg-muted-rose/5 rounded-bl-full pointer-events-none" />

            <div className="flex items-center gap-2 mb-4 text-warm-cocoa justify-center">
                <span className="text-base">🫖</span>
                <h3 className="font-serif text-lg font-bold">Fruit Tea Steeper</h3>
            </div>

            {!selectedTea && !steeping && (
                <div className="flex flex-col gap-4 text-center">
                    <p className="text-xs text-warm-grey/70 leading-relaxed">
                        Brew a Fruit of the Spirit tea card. Sip it slowly during scripture meditation. ౨ৎ
                    </p>

                    {/* Tea list selector */}
                    <div className="grid grid-cols-3 gap-1.5 justify-center my-2">
                        {TEA_RECIPES.map((recipe) => (
                            <button
                                key={recipe.fruit}
                                onClick={() => handleSelectSpecificTea(recipe)}
                                className="px-1 py-1.5 text-[9px] font-sans font-bold border border-warm-grey/10 rounded-xl bg-white hover:bg-stone-50 active:scale-95 transition-all text-warm-grey/70 truncate cursor-pointer"
                                title={recipe.name}
                            >
                                {recipe.fruit}
                            </button>
                        ))}
                    </div>

                    <Button 
                        onClick={handleDrawTea} 
                        className="bg-warm-cocoa text-white hover:bg-warm-cocoa/90 rounded-2xl py-2.5 text-xs font-sans font-bold shadow-sm"
                    >
                        Draw a Random Tea Bag
                    </Button>
                </div>
            )}

            {steeping && (
                <div className="flex flex-col items-center gap-4 py-8 text-center animate-pulse">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        {/* Animated steam lines */}
                        <div className="absolute -top-3 left-1/3 w-1.5 h-4 bg-muted-rose/20 rounded-full animate-bounce" style={{ animationDuration: '1.2s' }} />
                        <div className="absolute -top-4 left-1/2 w-1.5 h-5 bg-muted-rose/25 rounded-full animate-bounce" style={{ animationDuration: '0.8s' }} />
                        <div className="absolute -top-2 left-2/3 w-1.5 h-3.5 bg-muted-rose/20 rounded-full animate-bounce" style={{ animationDuration: '1.5s' }} />
                        
                        <Coffee className="w-12 h-12 text-muted-rose animate-spin" style={{ animationDuration: '3s' }} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-xs font-serif font-bold text-warm-cocoa">Steeping {selectedTea?.fruit} Tea...</span>
                        <span className="text-[10px] text-warm-grey/50 italic">Inhaling grace, exhaling praise...</span>
                    </div>
                </div>
            )}

            {steeped && selectedTea && (
                <div className="flex flex-col gap-4">
                    {/* Active Recipe Header */}
                    <div className="flex flex-col items-center text-center gap-2">
                        <div className={`px-3 py-1 rounded-full border text-[10px] font-sans font-bold uppercase tracking-wider ${selectedTea.washiColor}`}>
                            {selectedTea.name}
                        </div>
                    </div>

                    {/* Interactive Cup */}
                    <div className="relative w-28 h-20 mx-auto flex items-end justify-center">
                        <svg className="w-24 h-16 border-b-4 border-stone-200 rounded-b-full overflow-hidden relative" style={{ borderLeftWidth: '6px', borderRightWidth: '6px' }}>
                            {/* Tea liquid layer */}
                            <rect
                                x="0"
                                y={64 - (64 * teaHeight) / 100}
                                width="100"
                                height="64"
                                fill={selectedTea.color}
                                className="transition-all duration-500 ease-out"
                            />
                        </svg>
                        
                        {/* Saucer */}
                        <div className="absolute bottom-0 w-32 h-1 bg-stone-300 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.05)]" />
                        
                        {/* Sip counter badge */}
                        <div className="absolute -top-2 right-0 bg-stone-100 border border-warm-grey/10 text-warm-grey/50 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold">
                            {sips}/5 Sips
                        </div>
                    </div>

                    {/* Interactive Sip Button */}
                    {sips < 5 ? (
                        <Button
                            onClick={handleSip}
                            className="bg-white border border-warm-grey/10 hover:bg-stone-50 text-warm-grey text-xs rounded-2xl py-2 font-sans font-bold transition-all"
                        >
                            Take a Sip ☕
                        </Button>
                    ) : (
                        <div className="text-center p-2.5 bg-sage-green/5 border border-sage-green/10 rounded-2xl animate-fade-in flex flex-col gap-1">
                            <span className="text-xs font-serif font-bold text-sage-green">Tea Cup Empty! ౨ৎ</span>
                            <span className="text-[9px] text-warm-grey/60 italic leading-relaxed">
                                Pick a verse below to read its full chapter in the Bible Reader.
                            </span>
                        </div>
                    )}

                    {/* Scriptures display */}
                    <div className="flex flex-col gap-2.5 border-t border-stone-100 pt-3.5 mt-1">
                        <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-warm-grey/40">Meditation Verses:</span>
                        {selectedTea.verses.map((verse, idx) => (
                            <div 
                                key={idx}
                                onClick={() => sips >= 5 && onSelectScripture(verse.book, verse.chapter)}
                                className={`p-3 rounded-xl border text-left transition-all ${sips >= 5 ? 'bg-white hover:bg-soft-blush/10 hover:border-muted-rose border-warm-grey/10 cursor-pointer hover:scale-[1.01] active:scale-95' : 'bg-stone-50/50 border-stone-100 text-warm-grey/50 select-none opacity-85'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`text-[10px] font-sans font-bold uppercase tracking-wider ${sips >= 5 ? 'text-muted-rose' : 'text-warm-grey/40'}`}>{verse.ref}</span>
                                    {sips >= 5 && <Compass className="w-3.5 h-3.5 text-muted-rose animate-pulse" />}
                                </div>
                                <p className="font-serif italic text-xs leading-relaxed line-clamp-2">
                                    "{verse.text}"
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Reset Button */}
                    <button
                        onClick={handleReset}
                        className="flex items-center justify-center gap-1 text-[10px] font-sans font-bold text-warm-grey/40 hover:text-warm-grey/70 transition-colors mt-1 cursor-pointer self-center"
                    >
                        <RotateCcw className="w-3 h-3" /> Brew Another Tea
                    </button>
                </div>
            )}
        </div>
    );
}
