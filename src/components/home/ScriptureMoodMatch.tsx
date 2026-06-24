"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Heart, RefreshCw } from "lucide-react";

const MOOD_MATCHES = [
    {
        mood: "Anxious",
        verse: "Peace I leave with you; my peace I give you.",
        reference: "John 14:27",
        note: "Take one slow breath and hand God the next little thing."
    },
    {
        mood: "Tired",
        verse: "Come to me, all you who are weary and burdened, and I will give you rest.",
        reference: "Matthew 11:28",
        note: "Let rest count as obedience today."
    },
    {
        mood: "Lonely",
        verse: "You hem me in behind and before, and you lay your hand upon me.",
        reference: "Psalm 139:5",
        note: "You are seen, held, and not forgotten."
    },
    {
        mood: "Grateful",
        verse: "Praise the Lord, my soul, and forget not all his benefits.",
        reference: "Psalm 103:2",
        note: "Name one tiny mercy before you keep scrolling."
    },
    {
        mood: "Unsure",
        verse: "If any of you lacks wisdom, you should ask God.",
        reference: "James 1:5",
        note: "Ask for the next right step, not the whole map."
    },
    {
        mood: "Hopeful",
        verse: "May the God of hope fill you with all joy and peace as you trust in him.",
        reference: "Romans 15:13",
        note: "Let hope be quiet and steady today."
    }
];

export function ScriptureMoodMatch() {
    const [selectedMood, setSelectedMood] = useState(MOOD_MATCHES[0].mood);
    const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const selected = useMemo(
        () => MOOD_MATCHES.find((match) => match.mood === selectedMood) ?? MOOD_MATCHES[0],
        [selectedMood]
    );

    const renderMobileModal = () => {
        if (!mounted || !isMobileModalOpen) return null;

        return createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 p-4 backdrop-blur-sm lg:hidden animate-fade-in">
                <div className="relative w-full max-w-sm rounded-3xl border border-white/75 bg-warm-paper p-6 shadow-2xl animate-scale-in">
                    {/* Modal Header */}
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div className="text-left">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-rose/70">
                                Scripture Match
                            </p>
                            <h2 className="font-serif text-xl text-warm-cocoa">How is your heart?</h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsMobileModalOpen(false)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-warm-grey transition-colors text-xs font-bold"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Mood selections */}
                    <div className="mb-5 grid grid-cols-2 gap-2">
                        {MOOD_MATCHES.map((match) => {
                            const isSelected = selected.mood === match.mood;

                            return (
                                <button
                                    key={match.mood}
                                    type="button"
                                    onClick={() => setSelectedMood(match.mood)}
                                    className={`rounded-full border px-3 py-2.5 text-xs font-semibold transition-all ${
                                        isSelected
                                            ? "border-muted-rose/40 bg-soft-blush/70 text-warm-cocoa shadow-sm"
                                            : "border-warm-grey/10 bg-white/70 text-warm-grey/65 hover:border-muted-rose/30 hover:text-warm-cocoa"
                                    }`}
                                >
                                    {match.mood}
                                </button>
                            );
                        })}
                    </div>

                    {/* Scripture result card */}
                    <div className="rounded-2xl border border-soft-blush/50 bg-soft-blush/20 p-4 text-left">
                        <p className="font-serif text-base leading-relaxed text-warm-cocoa">
                            &ldquo;{selected.verse}&rdquo;
                        </p>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-warm-grey/50">
                            {selected.reference}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-warm-grey/75">
                            {selected.note}
                        </p>
                    </div>

                    {/* Modal Footer actions */}
                    <div className="mt-5 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => {
                                const currentIndex = MOOD_MATCHES.findIndex((match) => match.mood === selected.mood);
                                const next = MOOD_MATCHES[(currentIndex + 1) % MOOD_MATCHES.length];
                                setSelectedMood(next.mood);
                            }}
                            className="inline-flex items-center gap-2 text-xs font-bold text-warm-grey/55 transition-colors hover:text-warm-cocoa"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Another mood
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsMobileModalOpen(false)}
                            className="rounded-full bg-warm-cocoa px-4 py-2 text-xs font-bold text-white hover:bg-warm-cocoa/90 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    return (
        <>
            {/* Desktop View (visible on desktop, hidden on mobile/tablet) */}
            <section className="hidden lg:block rounded-3xl border border-white/70 bg-white/55 p-5 shadow-sm backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-rose/70">
                            Scripture Match
                        </p>
                        <h2 className="font-serif text-xl text-warm-cocoa">How is your heart?</h2>
                    </div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-soft-blush/50 text-muted-rose">
                        <Heart className="h-4 w-4" />
                    </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2">
                    {MOOD_MATCHES.map((match) => {
                        const isSelected = selected.mood === match.mood;

                        return (
                            <button
                                key={match.mood}
                                type="button"
                                onClick={() => setSelectedMood(match.mood)}
                                className={`rounded-full border px-3 py-2 text-xs font-semibold transition-all ${
                                    isSelected
                                        ? "border-muted-rose/40 bg-soft-blush/70 text-warm-cocoa shadow-sm"
                                        : "border-warm-grey/10 bg-white/70 text-warm-grey/65 hover:border-muted-rose/30 hover:text-warm-cocoa"
                                }`}
                            >
                                {match.mood}
                            </button>
                        );
                    })}
                </div>

                <div className="rounded-2xl border border-soft-blush/50 bg-soft-blush/20 p-4">
                    <p className="font-serif text-base leading-relaxed text-warm-cocoa">
                        &ldquo;{selected.verse}&rdquo;
                    </p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-warm-grey/50">
                        {selected.reference}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-warm-grey/75">
                        {selected.note}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        const currentIndex = MOOD_MATCHES.findIndex((match) => match.mood === selected.mood);
                        const next = MOOD_MATCHES[(currentIndex + 1) % MOOD_MATCHES.length];
                        setSelectedMood(next.mood);
                    }}
                    className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-warm-grey/55 transition-colors hover:text-warm-cocoa"
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Another mood
                </button>
            </section>

            {/* Mobile Trigger (visible on mobile/tablet, hidden on desktop) */}
            <button
                type="button"
                onClick={() => setIsMobileModalOpen(true)}
                className="w-full text-left lg:hidden rounded-3xl border border-white/70 bg-white/55 p-5 shadow-sm backdrop-blur-sm flex items-center justify-between gap-3 hover:bg-white/60 active:scale-98 transition-all"
            >
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-rose/70">
                        Scripture Match
                    </p>
                    <h2 className="font-serif text-lg text-warm-cocoa">How is your heart?</h2>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-soft-blush/50 text-muted-rose">
                    <Heart className="h-4 w-4 fill-current" />
                </div>
            </button>

            {/* Mobile Modal/Lightbox */}
            {renderMobileModal()}
        </>
    );
}
