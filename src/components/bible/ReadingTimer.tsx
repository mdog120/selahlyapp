"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Clock, Check, Sparkles, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/Button";

interface ReadingTimerProps {
    currentBook: string;
    currentChapter: number;
    isRunning: boolean;
    setIsRunning: (running: boolean) => void;
}

const PRESET_MINUTES = [1, 5, 10, 15, 20, 30];

export function ReadingTimer({ currentBook, currentChapter, isRunning, setIsRunning }: ReadingTimerProps) {
    const [duration, setDuration] = useState(10 * 60); // default 10 minutes in seconds
    const [timeLeft, setTimeLeft] = useState(10 * 60);
    const [showReflectionModal, setShowReflectionModal] = useState(false);
    const [reflectionText, setReflectionText] = useState("");
    const [saving, setSaving] = useState(false);
    
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const supabase = createClient();

    // Sync timeLeft when duration changes (only if not running)
    useEffect(() => {
        if (!isRunning) {
            setTimeLeft(duration);
        }
    }, [duration, isRunning]);

    // Handle countdown timer interval
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleTimerComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning]);

    const handleTimerComplete = () => {
        setIsRunning(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        
        // 1. Play Synthesized Chime (Web Audio API - 100% safe, no external files)
        playQuietTimeChime();

        // 2. Trigger Confetti
        triggerConfettiExplosion();

        // 3. Open Reflection Modal
        setShowReflectionModal(true);
    };

    const playQuietTimeChime = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            
            // Soft chime sequence (three warm, soothing bell notes)
            const playNote = (freq: number, start: number, duration: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, start);
                
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.2, start + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(start);
                osc.stop(start + duration);
            };

            // Soothing chord sweep: C5 -> E5 -> G5 -> C6
            const now = ctx.currentTime;
            playNote(523.25, now, 1.5);       // C5
            playNote(659.25, now + 0.25, 1.5); // E5
            playNote(783.99, now + 0.5, 1.5);  // G5
            playNote(1046.50, now + 0.8, 2.0); // C6
        } catch (e) {
            console.error("Failed to play synthesized chime:", e);
        }
    };

    const triggerConfettiExplosion = () => {
        const end = Date.now() + 2 * 1000;
        const frame = () => {
            confetti({
                particleCount: 4,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ["#D4A5A5", "#E3E9E2", "#8D7B68", "#FCEADE"]
            });
            confetti({
                particleCount: 4,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ["#D4A5A5", "#E3E9E2", "#8D7B68", "#FCEADE"]
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    const handleStartPause = () => {
        setIsRunning(!isRunning);
    };

    const handleReset = () => {
        setIsRunning(false);
        setTimeLeft(duration);
    };

    const selectPreset = (mins: number) => {
        setIsRunning(false);
        setDuration(mins * 60);
        setTimeLeft(mins * 60);
    };

    const handleSaveReflection = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reflectionText.trim() || saving) return;

        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Please sign in to save reflections.");
            setSaving(false);
            return;
        }

        const noteComment = `Quiet Time Reflection:\n${reflectionText.trim()}`;
        const { error } = await supabase.from('bible_notes').insert({
            user_id: user.id,
            book: currentBook,
            chapter: currentChapter,
            comment: noteComment,
            selected_text: `Quiet Time completed (${Math.round(duration / 60)}m)`
        });

        if (error) {
            alert("Could not save notes: " + error.message);
        } else {
            setReflectionText("");
            setShowReflectionModal(false);
            // Confetti check
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 }
            });
        }
        setSaving(false);
    };

    // Formats seconds into MM:SS
    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = (secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    // Calculate SVG circular progress percentages
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const progressOffset = circumference - (timeLeft / duration) * circumference;

    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-warm-grey/10 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-soft-blush/10 rounded-bl-full pointer-events-none" />

            <div className="flex items-center gap-2 mb-4 text-warm-cocoa justify-center">
                <Clock className="w-5 h-5 text-muted-rose" />
                <h3 className="font-serif text-lg font-bold">Quiet Time Timer</h3>
            </div>

            {/* Circular Timer Visualizer */}
            <div className="relative w-36 h-36 mx-auto mb-5 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="72"
                        cy="72"
                        r={radius}
                        className="stroke-stone-100"
                        strokeWidth="5"
                        fill="transparent"
                    />
                    <circle
                        cx="72"
                        cy="72"
                        r={radius}
                        className="stroke-muted-rose transition-all duration-300"
                        strokeWidth="5"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={isNaN(progressOffset) ? 0 : progressOffset}
                        strokeLinecap="round"
                    />
                </svg>
                
                {/* Time Display */}
                <div className="absolute flex flex-col items-center">
                    <span className="font-mono text-2xl font-bold text-warm-grey tracking-wide">
                        {formatTime(timeLeft)}
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-warm-grey/40 mt-0.5">
                        {isRunning ? "Reading" : "Paused"}
                    </span>
                </div>
            </div>

            {/* Duration presets */}
            {!isRunning && (
                <div className="flex flex-wrap gap-1.5 justify-center mb-5">
                    {PRESET_MINUTES.map(mins => (
                        <button
                            key={mins}
                            type="button"
                            onClick={() => selectPreset(mins)}
                            className={`px-2.5 py-1 text-[10px] font-sans font-bold border rounded-lg transition-all active:scale-95 cursor-pointer ${duration === mins * 60 ? 'bg-muted-rose border-muted-rose text-white shadow-sm' : 'bg-white hover:bg-stone-50 border-warm-grey/10 text-warm-grey/70'}`}
                        >
                            {mins}m
                        </button>
                    ))}
                </div>
            )}

            {/* Timer Controls */}
            <div className="flex justify-center gap-3">
                <Button
                    onClick={handleStartPause}
                    className={`rounded-2xl px-6 py-2.5 font-sans text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 ${isRunning ? 'bg-stone-200 text-warm-cocoa hover:bg-stone-300/80' : 'bg-warm-cocoa text-white hover:bg-warm-cocoa/90'}`}
                >
                    {isRunning ? (
                        <>
                            <Pause className="w-3.5 h-3.5 fill-current" /> Pause
                        </>
                    ) : (
                        <>
                            <Play className="w-3.5 h-3.5 fill-current" /> Start
                        </>
                    )}
                </Button>
                
                <button
                    onClick={handleReset}
                    className="p-2.5 border border-warm-grey/10 rounded-2xl hover:bg-stone-50 text-warm-grey/60 transition-colors active:scale-95 cursor-pointer shadow-sm"
                    title="Reset"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>

            {/* Reflection / Celebration Modal */}
            {showReflectionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
                    <div className="relative w-full max-w-md bg-warm-paper rounded-[2.5rem] border border-white/80 shadow-2xl p-6 md:p-8 flex flex-col gap-5 overflow-hidden animate-scale-up">
                        
                        {/* Decorative Bow */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-muted-rose/5 rounded-bl-full pointer-events-none" />

                        {/* Modal Header */}
                        <div className="flex flex-col items-center text-center gap-3 mt-4">
                            <div className="w-14 h-14 bg-soft-blush rounded-full flex items-center justify-center border border-muted-rose/10 text-muted-rose animate-bounce-slow">
                                <Sparkles className="w-6 h-6 fill-current" />
                            </div>
                            <h2 className="font-serif text-2xl text-warm-cocoa font-bold">Well Done, Sister! ౨ৎ</h2>
                            <p className="text-xs text-warm-grey/70 leading-relaxed max-w-xs">
                                You spent {Math.round(duration / 60)} minutes reading God's word today. Let's record what you learned!
                            </p>
                        </div>

                        {/* Reflection Form */}
                        <form onSubmit={handleSaveReflection} className="flex flex-col gap-4">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-warm-cocoa block mb-1.5 flex items-center gap-1">
                                    <BookOpen className="w-3 h-3 text-indigo-400" /> Reflect on {currentBook} {currentChapter}
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    value={reflectionText}
                                    onChange={(e) => setReflectionText(e.target.value)}
                                    placeholder="Write down a verse that stood out, a prayer, or what God spoke to your heart..."
                                    className="w-full p-4 bg-white border border-warm-grey/10 rounded-2xl outline-none text-sm text-warm-grey focus:ring-2 ring-muted-rose/20 transition-all font-serif italic leading-relaxed shadow-inner"
                                />
                            </div>

                            <div className="flex gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowReflectionModal(false)}
                                    className="flex-1 py-4 border border-warm-grey/15 rounded-2xl text-xs font-sans font-bold text-warm-grey/60 hover:bg-stone-50 active:scale-95 transition-all cursor-pointer"
                                >
                                    Skip & Close
                                </button>
                                <Button
                                    type="submit"
                                    disabled={!reflectionText.trim() || saving}
                                    className="flex-1 bg-warm-cocoa hover:bg-warm-cocoa/90 text-white rounded-2xl py-4 text-xs font-sans font-bold tracking-wide shadow-md"
                                >
                                    {saving ? "SAVING..." : "SAVE REFLECTION"}
                                </Button>
                            </div>
                        </form>

                    </div>
                </div>
            )}
        </div>
    );
}
