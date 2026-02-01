"use client";

import { useEffect, useState } from "react";
import { getDailyVerse } from "@/lib/dailyVerse";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Verse = {
    reference: string;
    text: string;
};

export function DailyVerseCard() {
    const [verse, setVerse] = useState<Verse | null>(null);

    useEffect(() => {
        setVerse(getDailyVerse());
    }, []);

    if (!verse) return null; // Hydration gap prevention

    return (
        <div className="group relative overflow-hidden glass-card p-6 rounded-3xl border border-white/60">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-warm-cocoa">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Grace & Glow</span>
                </div>
                <a href="/diaries" className="text-[10px] text-warm-grey/40 hover:text-warm-grey underline">Open Journal</a>
            </div>
            <h3 className="font-serif text-xl mb-2">Verse of the Day</h3>
            <p className="font-serif italic text-warm-grey/80 mb-4 h-16 line-clamp-3">
                "{verse.text}"
            </p>
            <p className="text-xs text-right text-warm-grey/40 mb-4">— {verse.reference}</p>
            <a href="/diaries" className="block w-full">
                <Button variant="outline" size="sm" className="w-full">Reflect & Journal</Button>
            </a>
        </div>
    );
}
