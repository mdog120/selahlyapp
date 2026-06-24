"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { getDailySelahSister, SelahSister } from "@/data/selahSisters";

export function SelahSisterCard() {
    const [sister] = useState<SelahSister | null>(() => getDailySelahSister());

    if (!sister) return null;

    const getCardStyles = () => {
        return {
            backgroundColor: "#f5f8f5",
            backgroundImage: "linear-gradient(90deg, rgba(143,151,121,0.06) 50%, transparent 50%), linear-gradient(rgba(143,151,121,0.06) 50%, transparent 50%)",
            backgroundSize: "20px 20px",
            borderColor: "rgba(167, 243, 167, 0.3)"
        };
    };

    const getWashiTapeClasses = () => {
        return "bg-emerald-100/50 border-emerald-200/20 text-emerald-800/60";
    };

    const getWashiTapeBgImage = () => {
        return 'repeating-linear-gradient(-45deg, rgba(143,151,121,0.08) 0px, rgba(143,151,121,0.08) 1.5px, transparent 1.5px, transparent 3px)';
    };

    return (
        <div 
            className="group relative z-30 overflow-hidden p-6 rounded-3xl border shadow-sm transition-all duration-300 hover:shadow-md"
            style={getCardStyles()}
        >
            {/* Top Washi Tape accent */}
            <div 
                className={`absolute top-2 left-6 w-14 h-4 border-x -rotate-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-center text-[7px] font-sans tracking-widest select-none z-10 ${getWashiTapeClasses()}`}
                style={{
                    backgroundImage: getWashiTapeBgImage()
                }}
            >
                🌿 SISTER
            </div>

            {/* Inner Content Card */}
            <div className="bg-white/95 border border-white/80 rounded-2xl p-5 shadow-[0_4px_12px_rgba(143,151,121,0.03)] relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-1.5 mb-3 text-emerald-700/80">
                    <span className="text-sm">ᥫ᭡</span>
                    <h3 className="text-[10px] font-bold tracking-widest text-emerald-800/60 uppercase font-sans">Selah Sister Spotlight</h3>
                </div>

                <h2 className="font-serif text-2xl text-warm-cocoa mb-3 flex items-center gap-1.5 font-bold">
                    {sister.name} <span className="text-xs text-muted-rose font-sans">౨ৎ</span>
                </h2>

                <p className="text-warm-grey text-sm mb-6 leading-relaxed flex-1">
                    {sister.biography}
                </p>

                <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-800/50">
                        Reflection
                    </p>
                    <p className="mt-1 font-serif text-base leading-snug text-warm-cocoa">
                        What can I learn from {sister.name} today?
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-warm-grey/70">
                        Where can I practice her kind of faith in my real life?
                    </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-stone-100/60 mt-auto">
                    <span className="text-[10px] text-sage-green font-bold flex items-center gap-1 font-sans bg-sage-green/10 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3 fill-current" />
                        Virtuous Woman
                    </span>

                    <Link
                        href={`/bible?book=${encodeURIComponent(sister.book)}&chapter=${sister.chapter}`}
                        className="flex items-center gap-1 text-xs font-bold text-warm-cocoa hover:text-emerald-700 transition-colors font-sans"
                    >
                        Read Story <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-2 right-4 text-[10px] text-warm-grey/15 pointer-events-none select-none">
                ❤︎
            </div>
        </div>
    );
}
