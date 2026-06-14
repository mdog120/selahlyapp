"use client";

import { useState, useEffect, useRef } from "react";
import { X, Sparkles, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { BowLogo } from "@/components/ui/BowLogo";
import confetti from "canvas-confetti";

interface CopyworkModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentBook: string;
    currentChapter: number;
}

const DEFAULT_VERSE = {
    text: "She is clothed with strength and dignity, and she laughs without fear of the future.",
    reference: "Proverbs 31:25"
};

const normalizePunctuation = (text: string): string => {
    return text
        // curly double quotes
        .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"')
        // curly single quotes and apostrophes
        .replace(/[\u2018\u2019\u201A\u201B\u2039\u203A]/g, "'")
        // long dashes
        .replace(/[\u2013\u2014]/g, "-")
        // normalize any double/multiple spaces to single spaces
        .replace(/\s+/g, " ")
        .trim();
};

const isCharMatch = (a: string, b: string) => {
    if (a === b) return true;
    if (!a || !b) return false;
    const clean = (c: string) => {
        if (c === '“' || c === '”' || c === '„' || c === '‟' || c === '«' || c === '»') return '"';
        if (c === '‘' || c === '’' || c === '‚' || c === '‛' || c === '‹' || c === '›') return "'";
        if (c === '–' || c === '—') return '-';
        return c;
    };
    return clean(a) === clean(b);
};

export function CopyworkModal({ isOpen, onClose, currentBook, currentChapter }: CopyworkModalProps) {
    const [verseText, setVerseText] = useState(DEFAULT_VERSE.text);
    const [verseRef, setVerseRef] = useState(DEFAULT_VERSE.reference);
    const [loading, setLoading] = useState(false);
    const [typedText, setTypedText] = useState("");
    const [completed, setCompleted] = useState(false);
    const [saving, setSaving] = useState(false);

    const supabase = createClient();
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Auto-scroll long verses to keep currently typed word in view
    useEffect(() => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const activeSpan = container.querySelector('[data-active="true"]');
        if (activeSpan) {
            activeSpan.scrollIntoView({
                block: "nearest",
                inline: "nearest"
            });
        }
    }, [typedText.length]);

    // Fetch a random verse of the current chapter when modal opens
    useEffect(() => {
        if (!isOpen) return;

        const fetchRandomVerse = async () => {
            setLoading(true);
            setTypedText("");
            setCompleted(false);
            try {
                const res = await fetch(`https://bible-api.com/${encodeURIComponent(currentBook)}+${currentChapter}`);
                if (!res.ok) throw new Error("Verse not found");
                const json = await res.json();
                if (json.verses && json.verses.length > 0) {
                    // Choose a random verse from the chapter for variety
                    const randomIdx = Math.floor(Math.random() * json.verses.length);
                    const selectedVerse = json.verses[randomIdx];
                    const cleanText = normalizePunctuation(selectedVerse.text);
                    setVerseText(cleanText);
                    setVerseRef(`${currentBook} ${currentChapter}:${selectedVerse.verse}`);
                } else {
                    throw new Error("Empty verses");
                }
            } catch (err) {
                setVerseText(DEFAULT_VERSE.text);
                setVerseRef(DEFAULT_VERSE.reference);
            } finally {
                setLoading(false);
            }
        };

        fetchRandomVerse();
    }, [isOpen, currentBook, currentChapter]);

    if (!isOpen) return null;

    // Synthesized pencil-writing scratch sound
    const playPencilScribble = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const bufferSize = ctx.sampleRate * 0.06; // 60ms duration
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            
            // White noise
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noiseNode = ctx.createBufferSource();
            noiseNode.buffer = buffer;
            
            const filter = ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.value = 1400 + Math.random() * 300; // randomized scratch frequency
            filter.Q.value = 4;
            
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.02, ctx.currentTime); // very soft
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
            
            noiseNode.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);
            
            noiseNode.start();
        } catch (e) {
            // Audio Context blocked or unsupported
        }
    };

    // Synthesized chime
    const playSuccessChime = () => {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const playNote = (freq: number, start: number, duration: number) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.15, start + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + duration);
            };
            const now = ctx.currentTime;
            playNote(587.33, now, 1.2);       // D5
            playNote(659.25, now + 0.15, 1.2); // E5
            playNote(880.00, now + 0.3, 1.5);  // A5
        } catch (e) {
            console.error(e);
        }
    };

    const handleTextChange = (val: string) => {
        if (completed) return;
        setTypedText(val);
        playPencilScribble();

        // Check if finished (using normalized punctuation for a forgiving match)
        if (normalizePunctuation(val) === normalizePunctuation(verseText)) {
            setCompleted(true);
            playSuccessChime();
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.65 },
                colors: ["#D4A5A5", "#E3E9E2", "#8D7B68", "#FCEADE"]
            });
        }
    };

    const handleSaveCopywork = async () => {
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Please sign in to save completed copywork.");
            setSaving(false);
            return;
        }

        const noteComment = `Scripture Copywork:\n"${verseText}"\n\nReflection: Practiced writing and memorized this verse. ౨ৎ`;
        const { error } = await supabase.from('bible_notes').insert({
            user_id: user.id,
            book: currentBook,
            chapter: currentChapter,
            comment: noteComment,
            selected_text: `Scripture Copywork Completed (${verseRef})`
        });

        if (error) {
            alert("Could not save copywork: " + error.message);
        } else {
            onClose();
        }
        setSaving(false);
    };

    // Render character comparisons
    const renderTargetText = () => {
        return verseText.split("").map((char, index) => {
            let color = "text-warm-grey/30"; // not typed
            let isTypo = false;

            if (index < typedText.length) {
                if (isCharMatch(typedText[index], char)) {
                    color = "text-warm-cocoa font-bold";
                } else {
                    color = "text-red-500 font-bold bg-red-100/70 rounded-xs";
                    isTypo = true;
                }
            }

            // For spaces, display a non-collapsing character and border indicator on typo
            const content = char === " " ? "\u00A0" : char;

            return (
                <span 
                    key={index} 
                    data-active={index === typedText.length ? "true" : "false"}
                    className={`${color} transition-colors duration-100 ${char === " " && isTypo ? "border-b-2 border-red-400" : ""}`}
                >
                    {content}
                </span>
            );
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div 
                className="relative w-full max-w-lg rounded-[2.5rem] border border-white/80 shadow-2xl p-6 md:p-8 flex flex-col gap-5 overflow-hidden animate-scale-up"
                style={{
                    backgroundImage: "linear-gradient(90deg, rgba(212,165,165,0.03) 50%, transparent 50%), linear-gradient(rgba(212,165,165,0.03) 50%, transparent 50%)",
                    backgroundSize: "24px 24px",
                    backgroundColor: "#fcfaf6"
                }}
            >
                {/* Decorative background bow */}
                <div className="absolute top-0 right-0 w-28 h-28 bg-muted-rose/5 rounded-bl-full pointer-events-none" />

                {/* Giant faded watermark */}
                <div className="absolute -bottom-12 -right-12 text-muted-rose/5 rotate-12 pointer-events-none select-none z-0">
                    <BowLogo size="200px" />
                </div>

                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-stone-200/50 text-warm-grey/60 transition-colors z-20 cursor-pointer"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center gap-2 relative z-10 text-center">
                    <div className="p-3.5 rounded-full bg-white/90 shadow-sm border border-[#FCEADE]/30 animate-bounce-slow mb-1">
                        <BowLogo className="text-3xl text-muted-rose" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-warm-cocoa">Scripture Copywork</h3>
                    <p className="text-xs text-warm-grey/50 max-w-xs leading-relaxed">
                        Practice writing and memorizing God's Word. Type the cursive text exactly as shown. ౨ৎ
                    </p>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-3 text-warm-grey/40 relative z-10">
                        <div className="w-6 h-6 border-2 border-muted-rose/30 border-t-muted-rose rounded-full animate-spin" />
                        <span className="text-xs font-sans font-bold">Unrolling scroll...</span>
                    </div>
                ) : (
                    <div className="flex flex-col gap-5 relative z-10">
                        {/* Reference Badge */}
                        <div className="self-center bg-muted-rose/10 px-3 py-1 rounded-full border border-muted-rose/10 flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3 text-muted-rose" />
                            <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-muted-rose">{verseRef}</span>
                        </div>

                        {/* Interactive cursive verse container */}
                        <div 
                            ref={containerRef}
                            className="bg-white/80 p-5 rounded-2xl border border-warm-grey/10 font-serif italic text-lg leading-relaxed text-center shadow-inner max-h-36 overflow-y-auto select-none whitespace-pre-wrap"
                        >
                            {renderTargetText()}
                        </div>

                        {/* Input Area */}
                        <div className="flex flex-col gap-2">
                            <textarea
                                required
                                rows={3}
                                value={typedText}
                                onChange={(e) => handleTextChange(e.target.value)}
                                disabled={completed}
                                placeholder="Type the verse here..."
                                className={`w-full p-4 bg-white border rounded-2xl outline-none text-sm text-warm-grey focus:ring-2 focus:ring-muted-rose/20 transition-all font-serif italic leading-relaxed shadow-sm ${completed ? 'border-sage-green ring-2 ring-sage-green/10 bg-sage-green/5' : 'border-warm-grey/10'}`}
                            />
                        </div>

                        {completed && (
                            <div className="flex flex-col items-center gap-3 animate-fade-in p-4 bg-sage-green/5 rounded-2xl border border-sage-green/10">
                                <div className="w-8 h-8 rounded-full bg-sage-green flex items-center justify-center text-white text-sm animate-bounce">
                                    ✓
                                </div>
                                <span className="font-serif text-sm font-bold text-sage-green text-center">Well Done, Sister! You have completed the copywork. ౨ৎ</span>
                                <Button
                                    onClick={handleSaveCopywork}
                                    disabled={saving}
                                    className="w-full bg-warm-cocoa hover:bg-warm-cocoa/90 text-white rounded-2xl py-3 text-xs font-sans font-bold tracking-wide shadow-md mt-1"
                                >
                                    {saving ? "SAVING..." : "SAVE TO NOTES"}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
