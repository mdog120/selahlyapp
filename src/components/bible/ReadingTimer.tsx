"use client";

import { useState } from "react";
import { Play, Pause, RotateCcw, Clock, Check, Sparkles, BookOpen, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/Button";
import { BowLogo } from "@/components/ui/BowLogo";

interface ReadingTimerProps {
    isOpen: boolean;
    onClose: () => void;
    currentBook: string;
    currentChapter: number;
    duration: number;
    setDuration: (duration: number) => void;
    timeLeft: number;
    setTimeLeft: (timeLeft: number) => void;
    isRunning: boolean;
    setIsRunning: (running: boolean) => void;
    isCompleted: boolean;
    setIsCompleted: (completed: boolean) => void;
}

const PRESET_MINUTES = [5, 10, 15, 20, 30, 60];

export function ReadingTimer({
    isOpen,
    onClose,
    currentBook,
    currentChapter,
    duration,
    setDuration,
    timeLeft,
    setTimeLeft,
    isRunning,
    setIsRunning,
    isCompleted,
    setIsCompleted
}: ReadingTimerProps) {
    const [reflectionText, setReflectionText] = useState("");
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    if (!isOpen) return null;

    const handleStartPause = () => {
        const nextRunning = !isRunning;
        setIsRunning(nextRunning);
        if (nextRunning) {
            onClose();
        }
    };

    const handleReset = () => {
        setIsRunning(false);
        setIsCompleted(false);
        setTimeLeft(duration);
    };

    const selectPreset = (mins: number) => {
        setIsRunning(false);
        setIsCompleted(false);
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

        const noteComment = `Selah Reflection:\n${reflectionText.trim()}`;
        const { error } = await supabase.from('bible_notes').insert({
            user_id: user.id,
            book: currentBook,
            chapter: currentChapter,
            comment: noteComment,
            selected_text: `Selah Timer completed (${Math.round(duration / 60)}m)`
        });

        if (error) {
            alert("Could not save notes: " + error.message);
        } else {
            setReflectionText("");
            setIsCompleted(false);
            onClose();
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div 
                className="relative w-full max-w-md rounded-[2.5rem] border border-white/80 shadow-2xl p-6 md:p-8 flex flex-col gap-5 overflow-hidden animate-scale-up"
                style={{
                    backgroundImage: "linear-gradient(90deg, rgba(212,165,165,0.03) 50%, transparent 50%), linear-gradient(rgba(212,165,165,0.03) 50%, transparent 50%)",
                    backgroundSize: "24px 24px",
                    backgroundColor: "#fcfaf6"
                }}
            >
                {/* Decorative bow background */}
                <div className="absolute top-0 right-0 w-28 h-28 bg-muted-rose/5 rounded-bl-full pointer-events-none" />

                {/* Faded giant bow watermark in background */}
                <div className="absolute -bottom-10 -left-10 text-muted-rose/5 -rotate-12 pointer-events-none z-0 select-none">
                    <BowLogo size="160px" />
                </div>

                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-stone-200/50 text-warm-grey/60 transition-colors z-20 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                {isCompleted ? (
                    /* Reflection / Celebration Mode */
                    <div className="flex flex-col gap-5 mt-4">
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className="w-14 h-14 bg-soft-blush rounded-full flex items-center justify-center border border-muted-rose/10 text-muted-rose animate-bounce-slow">
                                <Sparkles className="w-6 h-6 fill-current" />
                            </div>
                            <h2 className="font-serif text-2xl text-warm-cocoa font-bold">Well Done, Sister! ౨ৎ</h2>
                            <p className="text-xs text-warm-grey/70 leading-relaxed max-w-xs">
                                You spent {Math.round(duration / 60)} minutes reading God's word today. Let's record what you learned!
                            </p>
                        </div>

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
                                    onClick={() => {
                                        setIsCompleted(false);
                                        onClose();
                                    }}
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
                ) : (
                    /* Active Timer Mode */
                    <div className="flex flex-col items-center gap-5 mt-4 z-10">
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3.5 rounded-full bg-white/90 shadow-sm border border-[#FCEADE]/30 animate-bounce-slow mb-1">
                                <BowLogo className="text-3xl text-muted-rose" />
                            </div>
                            <div className="flex items-center gap-2 text-warm-cocoa">
                                <Clock className="w-4 h-4 text-muted-rose" />
                                <h3 className="font-serif text-lg font-bold">Selah Timer</h3>
                            </div>
                        </div>

                        {/* Circular Timer Visualizer */}
                        <div className="relative w-36 h-36 flex items-center justify-center">
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
                            <div className="flex flex-wrap gap-1.5 justify-center">
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
                        <div className="flex justify-center gap-3 w-full max-w-[200px]">
                            <Button
                                onClick={handleStartPause}
                                className={`flex-1 rounded-2xl py-2.5 font-sans text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 ${isRunning ? 'bg-stone-200 text-warm-cocoa hover:bg-stone-300/80' : 'bg-warm-cocoa text-white hover:bg-warm-cocoa/90'}`}
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
                    </div>
                )}
            </div>
        </div>
    );
}
