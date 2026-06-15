"use client";

import { useEffect, useState } from "react";
import { getDailyVerse } from "@/lib/dailyVerse";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VerseWallpaperModal } from "./VerseWallpaperModal";

type Verse = {
    reference: string;
    text: string;
};

export function DailyVerseCard() {
    const [verse, setVerse] = useState<Verse | null>(null);
    const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);

    useEffect(() => {
        setVerse(getDailyVerse());
    }, []);

    if (!verse) return null; // Hydration gap prevention

    const getCardStyles = () => {
        return {
            backgroundColor: "#fefaf6",
            backgroundImage: "linear-gradient(90deg, rgba(212,165,165,0.06) 50%, transparent 50%), linear-gradient(rgba(212,165,165,0.06) 50%, transparent 50%)",
            backgroundSize: "20px 20px",
            borderColor: "rgba(244, 197, 197, 0.4)"
        };
    };

    const getWashiTapeClasses = () => {
        return "bg-pink-100/60 border-pink-200/30 text-muted-rose";
    };

    return (
        <div 
            className="group relative overflow-hidden p-6 rounded-3xl border shadow-sm transition-all duration-300 hover:shadow-md"
            style={getCardStyles()}
        >
            {/* Top Washi Tape accent */}
            <div className={`absolute top-2 right-6 w-14 h-4 border-x rotate-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-center text-[8px] font-bold select-none z-10 ${getWashiTapeClasses()}`}>
                ౨ৎ SELAH
            </div>

            {/* Inner Content Card */}
            <div className="bg-white/95 border border-white/80 rounded-2xl p-5 shadow-[0_4px_12px_rgba(141,123,104,0.03)] relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5 text-muted-rose">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest font-sans">Grace & Glow</span>
                    </div>
                    <a href="/diaries" className="text-[10px] text-warm-grey/40 hover:text-warm-cocoa font-bold font-sans transition-colors">Open Journal ✏️</a>
                </div>

                <h3 className="font-serif text-lg text-warm-cocoa font-bold mb-2">Verse of the Day</h3>
                
                {/* Verse Text on a lined paper background style */}
                <div 
                    className="p-4 rounded-xl mb-4 border border-stone-100"
                    style={{
                        backgroundColor: "#fdfdfd",
                        backgroundImage: "linear-gradient(rgba(212,165,165,0.08) 1px, transparent 1px)",
                        backgroundSize: "100% 1.35rem",
                        lineHeight: "1.35rem"
                    }}
                >
                    <p className="font-serif italic text-warm-grey/85 text-[15px] leading-relaxed line-clamp-3">
                        "{verse.text}"
                    </p>
                </div>
                
                <p className="text-[10px] text-right font-sans font-bold text-warm-grey/40 mb-5">— {verse.reference}</p>
                
                <div className="flex gap-3 w-full mt-auto">
                    <a href="/diaries" className="flex-1">
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full text-xs font-bold border-warm-grey/10 text-warm-grey hover:bg-stone-50 h-9 flex items-center justify-center gap-1 font-sans"
                        >
                            <span>Journal</span>
                            <span className="text-[10px]">✏️</span>
                        </Button>
                    </a>
                    <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setIsWallpaperModalOpen(true)}
                        className="flex-1 text-xs font-bold border-muted-rose/20 text-muted-rose hover:bg-muted-rose hover:text-white h-9 flex items-center justify-center gap-1 font-sans"
                    >
                        <span>Wallpaper</span>
                        <span className="text-[10px]">✨</span>
                    </Button>
                </div>
            </div>

            <VerseWallpaperModal
                isOpen={isWallpaperModalOpen}
                onClose={() => setIsWallpaperModalOpen(false)}
                verseText={verse.text}
                verseReference={verse.reference}
            />
        </div>
    );
}
