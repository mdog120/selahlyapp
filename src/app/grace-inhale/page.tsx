"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Compass, Heart, Sparkles, Wind } from "lucide-react";
import { Button } from "@/components/ui/Button";

const affirmations = [
    { text: "You are fearfully and wonderfully made.", reference: "Psalm 139:14" },
    { text: "You are clothed with strength and dignity, and you can laugh at the days to come.", reference: "Proverbs 31:25" },
    { text: "You are chosen, holy, and dearly loved.", reference: "Colossians 3:12" },
    { text: "You are a masterpiece, created in Christ Jesus to do good works.", reference: "Ephesians 2:10" },
    { text: "His grace is sufficient for you, for His power is made perfect in weakness.", reference: "2 Corinthians 12:9" },
    { text: "You are more precious than rubies; nothing you desire compares to you.", reference: "Proverbs 3:15" },
    { text: "He will keep you in perfect peace when your mind is stayed on Him.", reference: "Isaiah 26:3" },
    { text: "For God has not given you a spirit of fear, but of power, love, and a sound mind.", reference: "2 Timothy 1:7" }
];

export default function GraceInhalePage() {
    const router = useRouter();
    const [elapsedTime, setElapsedTime] = useState(0);
    const [fadeState, setFadeState] = useState("opacity-100 scale-100");
    const [displayIndex, setDisplayIndex] = useState(0);
    const [isActive, setIsActive] = useState(true);

    const totalDuration = 60; // 60 seconds
    const intervalTime = 7.5; // seconds per affirmation

    // 1. Core Timer logic
    useEffect(() => {
        if (!isActive || elapsedTime >= totalDuration) return;

        const timer = setInterval(() => {
            setElapsedTime(prev => {
                if (prev >= totalDuration - 1) {
                    clearInterval(timer);
                    return totalDuration;
                }
                return prev + 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isActive, elapsedTime]);

    // 2. Affirmations cross-fade index logic
    const activeIndex = Math.min(Math.floor(elapsedTime / intervalTime), affirmations.length - 1);

    useEffect(() => {
        if (activeIndex !== displayIndex && elapsedTime < totalDuration) {
            // Start fade out
            setFadeState("opacity-0 scale-95");
            const timeout = setTimeout(() => {
                setDisplayIndex(activeIndex);
                // Start fade in
                setFadeState("opacity-100 scale-100");
            }, 600); // 600ms transition
            return () => clearTimeout(timeout);
        }
    }, [activeIndex, displayIndex, elapsedTime]);

    // 3. Dynamic background interpolation: Rose Pink to Warm Paper
    // 0s: Rose Pink HSL(350, 70%, 90%)
    // 60s: Warm Paper HSL(396, 30%, 98%) -> HSL(36, 30%, 98%)
    const progressRatio = Math.min(elapsedTime / totalDuration, 1);
    const currentHue = (350 + progressRatio * 46) % 360; // moves HSL hue from 350 to 396 (36)
    const currentSat = 70 - progressRatio * 40;        // 70% to 30%
    const currentLight = 90 + progressRatio * 8;       // 90% to 98%

    // 4. Breathing Inhale/Exhale indicator
    // Breathing cycle is 6 seconds (3s inhale, 3s exhale)
    const isInhale = (elapsedTime % 6) < 3;
    const isCompleted = elapsedTime >= totalDuration;

    return (
        <div 
            className="min-h-screen w-full flex flex-col justify-between p-6 transition-all duration-1000 ease-out select-none relative overflow-hidden"
            style={{ 
                backgroundColor: `hsl(${currentHue}, ${currentSat}%, ${currentLight}%)`,
                backgroundImage: isCompleted 
                    ? "radial-gradient(circle at top left, rgba(253, 242, 242, 0.4), transparent)" 
                    : "radial-gradient(circle at top left, rgba(255, 255, 255, 0.3), transparent)"
            }}
        >
            {/* Top Header Controls */}
            <header className="flex justify-between items-center w-full max-w-4xl mx-auto z-10">
                <button 
                    onClick={() => router.push("/home")}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 hover:bg-white/60 text-warm-cocoa/80 text-xs font-medium border border-white/20 transition-all active:scale-95"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Exit Early
                </button>
                <div className="flex items-center gap-1.5 text-warm-cocoa/60 text-xs tracking-widest font-serif uppercase">
                    <Compass className="w-4 h-4 animate-spin-slow" />
                    <span>Grace Inhale</span>
                </div>
            </header>

            {/* Central Content */}
            <main className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full z-10 py-12">
                {!isCompleted ? (
                    <div className="flex flex-col items-center gap-12 text-center w-full">
                        {/* 1. Breathing ring / progress guide */}
                        <div className="relative w-48 h-48 flex items-center justify-center">
                            {/* Outer Circular Progress SVG */}
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle 
                                    cx="96" 
                                    cy="96" 
                                    r="88" 
                                    className="stroke-warm-cocoa/5 fill-none" 
                                    strokeWidth="4"
                                />
                                <circle 
                                    cx="96" 
                                    cy="96" 
                                    r="88" 
                                    className="stroke-muted-rose fill-none transition-all duration-1000 ease-out" 
                                    strokeWidth="4"
                                    strokeDasharray={2 * Math.PI * 88}
                                    strokeDashoffset={2 * Math.PI * 88 * (1 - progressRatio)}
                                    strokeLinecap="round"
                                />
                            </svg>

                            {/* Inner Pulsing Breathing Circle */}
                            <div 
                                className={`w-36 h-36 rounded-full flex flex-col items-center justify-center text-center shadow-lg border border-white/40 transition-all duration-[3000ms] ease-in-out ${
                                    isInhale 
                                        ? "scale-110 bg-white/70 shadow-muted-rose/10 text-muted-rose" 
                                        : "scale-95 bg-white/45 shadow-transparent text-warm-cocoa/80"
                                }`}
                            >
                                <Wind className={`w-6 h-6 mb-1.5 transition-transform duration-1000 ${isInhale ? "translate-y-[-2px] animate-pulse" : "translate-y-[2px]"}`} />
                                <span className="text-xs font-bold tracking-wider uppercase">
                                    {isInhale ? "Inhale" : "Exhale"}
                                </span>
                                <span className="text-[10px] opacity-75 mt-0.5">
                                    {isInhale ? "His peace" : "your worries"}
                                </span>
                            </div>
                        </div>

                        {/* 2. Text Affirmation Section */}
                        <div className="min-h-[140px] flex flex-col items-center justify-center px-4 w-full">
                            <div className={`transition-all duration-700 transform flex flex-col items-center ${fadeState}`}>
                                <Heart className="w-5 h-5 text-muted-rose/60 mb-4 fill-muted-rose/10" />
                                <p className="font-serif text-2xl text-warm-cocoa/90 leading-relaxed max-w-lg mb-3">
                                    "{affirmations[displayIndex].text}"
                                </p>
                                <span className="text-xs tracking-wider uppercase text-warm-grey/50 font-medium">
                                    — {affirmations[displayIndex].reference}
                                </span>
                            </div>
                        </div>

                        {/* 3. Tiny status label */}
                        <p className="text-[10px] text-warm-grey/40 uppercase tracking-widest font-semibold mt-4">
                            {totalDuration - elapsedTime} seconds remaining
                        </p>
                    </div>
                ) : (
                    // Complete / Done view
                    <div className="flex flex-col items-center text-center gap-8 animate-in fade-in zoom-in-95 duration-1000">
                        <div className="w-20 h-20 rounded-full bg-muted-rose/10 border border-muted-rose/20 flex items-center justify-center text-muted-rose shadow-md shadow-muted-rose/5 mb-2 animate-bounce-slow">
                            <Sparkles className="w-10 h-10" />
                        </div>

                        <div className="space-y-3 px-4">
                            <h2 className="font-serif text-3xl text-warm-cocoa">Peace Be With You</h2>
                            <p className="text-sm text-warm-grey/70 max-w-md leading-relaxed">
                                "Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid."
                            </p>
                            <span className="text-xs tracking-wider uppercase text-warm-grey/50 font-medium block">
                                — John 14:27
                            </span>
                        </div>

                        {/* Done button fading in */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 delay-500 duration-1000 fill-mode-both mt-4">
                            <Button 
                                onClick={() => router.push("/home")}
                                className="bg-gradient-to-r from-muted-rose to-rose-400 hover:from-muted-rose/90 hover:to-rose-400/90 text-white rounded-2xl px-10 py-6 text-sm font-serif tracking-widest shadow-xl shadow-muted-rose/25 transition-transform hover:scale-[1.03] active:scale-95 flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" /> DONE
                            </Button>
                        </div>
                    </div>
                )}
            </main>

            {/* Bottom Footer Quote */}
            <footer className="w-full text-center py-4 z-10">
                <p className="text-[10px] font-medium tracking-widest text-warm-grey/40 uppercase">
                    {!isCompleted ? "Breathe in grace, exhale anxiety" : "You are loved • You are kept"}
                </p>
            </footer>
        </div>
    );
}
