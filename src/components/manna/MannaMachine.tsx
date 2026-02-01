"use client";

import { useState } from "react";
import { MANNA_DATA, MannaPrescription } from "@/lib/manna-data";
import { Button } from "@/components/ui/Button";
import { Music, RefreshCw, Heart } from "lucide-react";

export function MannaMachine() {
    const [selectedMood, setSelectedMood] = useState<MannaPrescription | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleMoodSelect = (prescription: MannaPrescription) => {
        setIsAnimating(true);
        setTimeout(() => {
            setSelectedMood(prescription);
            setIsAnimating(false);
        }, 300); // Short animation delay
    };

    const reset = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setSelectedMood(null);
            setIsAnimating(false);
        }, 300);
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-white/50 backdrop-blur-sm border border-white/60 rounded-3xl p-6 md:p-8 shadow-sm">
            <h3 className="font-serif text-2xl text-warm-cocoa mb-2 text-center">
                {selectedMood ? "Your Prescription 🥣" : "How is your heart today?"}
            </h3>
            <p className="text-center text-warm-grey/60 mb-8 text-sm">
                {selectedMood
                    ? "Take what you need for the journey."
                    : "Select a feeling to receive custom encouragement."
                }
            </p>

            <div className={`transition-opacity duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                {!selectedMood ? (
                    // Mood Selection Grid
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {MANNA_DATA.map((item) => (
                            <button
                                key={item.mood}
                                onClick={() => handleMoodSelect(item)}
                                className="flex flex-col items-center justify-center p-4 bg-white hover:bg-soft-blush/20 border border-warm-grey/5 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 group"
                            >
                                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{item.emoji}</span>
                                <span className="font-medium text-warm-grey">{item.mood}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    // Prescription Card
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Verse Card */}
                        <div className="bg-white p-6 rounded-2xl border border-warm-grey/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-soft-sage/10 rounded-bl-full" />
                            <p className="font-serif text-lg leading-relaxed text-warm-cocoa mb-2 relative z-10">
                                "{selectedMood.verse.text}"
                            </p>
                            <p className="text-xs font-bold text-warm-grey uppercase tracking-widest">
                                {selectedMood.verse.reference}
                            </p>
                        </div>

                        {/* Prayer */}
                        <div className="bg-soft-sage/10 p-5 rounded-2xl border border-soft-sage/20">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-soft-sage mb-2 uppercase tracking-wide">
                                <Heart className="w-4 h-4" /> A Prayer for You
                            </h4>
                            <p className="text-warm-grey/80 text-sm italic">
                                "{selectedMood.prayer}"
                            </p>
                        </div>

                        {/* Song */}
                        <a
                            href={selectedMood.song.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 bg-warm-cocoa/5 p-4 rounded-xl hover:bg-warm-cocoa/10 transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-full bg-warm-cocoa/10 flex items-center justify-center text-warm-cocoa group-hover:scale-110 transition-transform">
                                <Music className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-warm-cocoa text-sm">{selectedMood.song.title}</p>
                                <p className="text-xs text-warm-grey">{selectedMood.song.artist}</p>
                            </div>
                            <span className="text-xs font-medium text-warm-cocoa/60 group-hover:translate-x-1 transition-transform">Listen →</span>
                        </a>

                        {/* Reset Button */}
                        <div className="pt-4 flex justify-center">
                            <Button variant="ghost" size="sm" onClick={reset} className="text-warm-grey/50 hover:text-warm-grey">
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Choose Another
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
