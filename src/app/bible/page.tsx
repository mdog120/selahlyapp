"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BibleReader } from "../../components/bible/BibleReader";
import { CommunityHighlights } from "@/components/bible/CommunityHighlights";
import { YourNotes } from "@/components/bible/YourNotes";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { QuietTimeAudio } from "@/components/ui/QuietTimeAudio";
import { ReadingTimer } from "@/components/bible/ReadingTimer";
import confetti from "canvas-confetti";
import { FruitTeaSteeper } from "@/components/bible/FruitTeaSteeper";
import { CopyworkModal } from "@/components/bible/CopyworkModal";

const BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
    "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
    "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

import { Suspense } from "react";

// ... existing imports ...

// ... existing constants ...

const normalizeBookName = (name: string | null): string => {
    if (!name) return "Genesis";
    const trimmed = name.trim();
    if (trimmed.toLowerCase() === "psalm") return "Psalms";
    // Capitalize first letter to match BOOKS options
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

function BiblePageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const initialBook = normalizeBookName(searchParams.get("book"));
    const initialChapter = parseInt(searchParams.get("chapter") || "1");

    const [book, setBook] = useState(initialBook);
    const [chapter, setChapter] = useState(initialChapter);
    const [loading, setLoading] = useState(false);

    // Timer States
    const [duration, setDuration] = useState(15 * 60); // default 15 mins (900 seconds)
    const [timeLeft, setTimeLeft] = useState(15 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isTimerCompleted, setIsTimerCompleted] = useState(false);
    const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
    const [isCopyworkOpen, setIsCopyworkOpen] = useState(false);

    // Sync timeLeft when duration changes (only if not running & not completed)
    useEffect(() => {
        if (!isTimerRunning && !isTimerCompleted) {
            setTimeLeft(duration);
        }
    }, [duration, isTimerRunning, isTimerCompleted]);

    // Synthesized chime audio sweep
    const playQuietTimeChime = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const playNote = (freq: number, start: number, durationSec: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, start);
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.2, start + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + durationSec);
            };
            const now = ctx.currentTime;
            playNote(523.25, now, 1.5);       // C5
            playNote(659.25, now + 0.25, 1.5); // E5
            playNote(783.99, now + 0.5, 1.5);  // G5
            playNote(1046.50, now + 0.8, 2.0); // C6
        } catch (e) {
            console.error("Failed to play synthesized chime:", e);
        }
    };

    // Confetti explosion trigger
    const triggerConfettiExplosion = () => {
        const end = Date.now() + 2 * 1000;
        const frame = () => {
            confetti({
                particleCount: 4,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.8 },
                colors: ["#D4A5A5", "#E3E9E2", "#8D7B68", "#FCEADE"]
            });
            confetti({
                particleCount: 4,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.8 },
                colors: ["#D4A5A5", "#E3E9E2", "#8D7B68", "#FCEADE"]
            });
            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    };

    // Countdown interval useEffect
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isTimerRunning && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsTimerRunning(false);
                        setIsTimerCompleted(true);
                        setIsTimerModalOpen(true);
                        playQuietTimeChime();
                        triggerConfettiExplosion();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTimerRunning, timeLeft]);

    // Sync state with URL if params change externally
    useEffect(() => {
        const b = searchParams.get("book");
        const c = searchParams.get("chapter");
        if (b) setBook(normalizeBookName(b));
        if (c) setChapter(parseInt(c));
    }, [searchParams]);

    // Warning alert on close/refresh if timer is running
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isTimerRunning) {
                e.preventDefault();
                e.returnValue = "Are you sure you want to end your quiet reading time early? ౨ৎ";
                return e.returnValue;
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isTimerRunning]);

    // Warning alert on leaving the page (for SPA transitions)
    useEffect(() => {
        if (!isTimerRunning) return;

        const handleAnchorClick = (e: MouseEvent) => {
            let target = e.target as HTMLElement | null;
            while (target && target.tagName !== 'A') {
                target = target.parentElement;
            }

            if (target && target instanceof HTMLAnchorElement) {
                const href = target.getAttribute('href');
                if (href) {
                    try {
                        const url = new URL(href, window.location.href);
                        if (url.pathname !== '/bible') {
                            const confirmExit = confirm("Are you sure you want to end your quiet reading time early? ౨ৎ");
                            if (!confirmExit) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        }
                    } catch (err) {
                        // Ignore relative/malformed URL errors
                    }
                }
            }
        };

        document.addEventListener('click', handleAnchorClick, true);
        return () => {
            document.removeEventListener('click', handleAnchorClick, true);
        };
    }, [isTimerRunning]);

    const handleNavigate = (newBook: string, newChapter: number) => {
        // No exit confirmation check when changing chapters/books! It keeps ticking in the background.
        setBook(newBook);
        setChapter(newChapter);
        router.push(`/bible?book=${encodeURIComponent(newBook)}&chapter=${newChapter}`);
    };

    const nextChapter = () => {
        handleNavigate(book, chapter + 1);
    };

    const prevChapter = () => {
        if (chapter > 1) {
            handleNavigate(book, chapter - 1);
        }
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, "0");
        const s = (secs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    return (
        <div className="min-h-screen bg-warm-paper font-serif transition-colors duration-500 max-w-full overflow-x-hidden">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="flex items-center justify-between mb-8 bg-white/50 p-3 sm:p-4 rounded-2xl backdrop-blur-sm border border-warm-grey/10 sticky top-4 z-40 shadow-sm max-w-full">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsTimerModalOpen(true)} 
                        className={`px-2 sm:px-3 flex items-center gap-1.5 transition-all duration-300 ${isTimerRunning ? 'text-muted-rose animate-pulse font-mono font-bold' : 'text-warm-grey/50 hover:text-warm-cocoa font-sans'}`}
                    >
                        <Clock className={`w-4 h-4 ${isTimerRunning ? 'text-muted-rose' : 'text-warm-grey/50'}`} />
                        <span className="text-xs">
                            {isTimerRunning || timeLeft < duration ? formatTime(timeLeft) : "Set Timer"}
                        </span>
                    </Button>

                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                        <select
                            value={book}
                            onChange={(e) => handleNavigate(e.target.value, 1)}
                            className="bg-transparent font-serif font-bold text-warm-cocoa border-none outline-none cursor-pointer hover:bg-white/50 rounded-lg p-1 w-[90px] sm:w-auto truncate"
                        >
                            {BOOKS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <span className="text-warm-grey/40 text-sm sm:text-base">Ch.</span>
                        <input
                            type="number"
                            value={chapter}
                            onChange={(e) => handleNavigate(book, parseInt(e.target.value) || 1)}
                            className="w-10 sm:w-16 bg-transparent font-serif font-bold text-warm-cocoa border-none outline-none p-1 text-center"
                        />
                    </div>

                    <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="sm" disabled={chapter <= 1} onClick={prevChapter} className="p-1 sm:p-2">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={nextChapter} className="p-1 sm:p-2">
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Content: Bible Reader */}
                    <div className="lg:col-span-8">
                        <div className="min-h-[60vh] bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-warm-grey/5 mb-8 relative">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-soft-rose/10 to-transparent rounded-tr-3xl pointer-events-none" />
                            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-indigo-50/20 to-transparent rounded-tl-3xl pointer-events-none" />

                            <BibleReader book={book} chapter={chapter} onLoading={setLoading} />
                        </div>

                        {/* Navigation & Copywork Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-20 bg-white/45 p-4 rounded-2xl border border-warm-grey/5 shadow-sm">
                            <Button 
                                variant="outline" 
                                size="sm"
                                disabled={chapter <= 1} 
                                onClick={prevChapter}
                                className="w-full sm:w-auto font-sans font-bold text-xs tracking-wider"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" /> Previous Chapter
                            </Button>

                            <Button
                                onClick={() => setIsCopyworkOpen(true)}
                                size="sm"
                                className="w-full sm:w-auto bg-muted-rose hover:bg-muted-rose/90 text-white font-sans font-bold text-xs tracking-wider px-6 py-2.5 rounded-2xl shadow-md active:scale-95"
                            >
                                Practice Copywork ✍️
                            </Button>

                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={nextChapter}
                                className="w-full sm:w-auto font-sans font-bold text-xs tracking-wider"
                            >
                                Next Chapter <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>

                    {/* Sidebar: Widgets */}
                    <div className="lg:col-span-4 space-y-6">
                        <FruitTeaSteeper onSelectScripture={handleNavigate} />
                        <CommunityHighlights />
                        <YourNotes />
                    </div>
                </div>
            </div>
            <QuietTimeAudio />
            <ReadingTimer
                isOpen={isTimerModalOpen}
                onClose={() => setIsTimerModalOpen(false)}
                currentBook={book}
                currentChapter={chapter}
                duration={duration}
                setDuration={setDuration}
                timeLeft={timeLeft}
                setTimeLeft={setTimeLeft}
                isRunning={isTimerRunning}
                setIsRunning={setIsTimerRunning}
                isCompleted={isTimerCompleted}
                setIsCompleted={setIsTimerCompleted}
            />
            <CopyworkModal
                isOpen={isCopyworkOpen}
                onClose={() => setIsCopyworkOpen(false)}
                currentBook={book}
                currentChapter={chapter}
            />
        </div>
    );
}

export default function BiblePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-warm-paper flex items-center justify-center text-warm-grey">Loading Scripture...</div>}>
            <BiblePageContent />
        </Suspense>
    );
}
