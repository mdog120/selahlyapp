"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { getDailySelahSister, SelahSister } from "@/data/selahSisters";

export function SelahSisterCard() {
    const [sister, setSister] = useState<SelahSister | null>(null);
    const [theme, setTheme] = useState<"sunrise" | "midday" | "sunset" | "night">("midday");

    useEffect(() => {
        setSister(getDailySelahSister());
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 10) {
            setTheme("sunrise");
        } else if (hour >= 10 && hour < 17) {
            setTheme("midday");
        } else if (hour >= 17 && hour < 21) {
            setTheme("sunset");
        } else {
            setTheme("night");
        }
    }, []);

    if (!sister) return null;

    const getCardStyles = () => {
        switch (theme) {
            case "sunrise":
            case "midday":
                return {
                    backgroundColor: "#f5f8f5",
                    backgroundImage: "linear-gradient(90deg, rgba(143,151,121,0.06) 50%, transparent 50%), linear-gradient(rgba(143,151,121,0.06) 50%, transparent 50%)",
                    backgroundSize: "20px 20px",
                    borderColor: "rgba(167, 243, 167, 0.3)"
                };
            case "sunset":
                // Hot pink gingham
                return {
                    backgroundColor: "#FFF0F5",
                    backgroundImage: "linear-gradient(90deg, rgba(255,105,180,0.05) 50%, transparent 50%), linear-gradient(rgba(255,105,180,0.05) 50%, transparent 50%)",
                    backgroundSize: "20px 20px",
                    borderColor: "rgba(255, 105, 180, 0.2)"
                };
            case "night":
                // Dark blue gingham
                return {
                    backgroundColor: "#111827",
                    backgroundImage: "linear-gradient(90deg, rgba(50,100,220,0.15) 50%, transparent 50%), linear-gradient(rgba(50,100,220,0.15) 50%, transparent 50%)",
                    backgroundSize: "20px 20px",
                    borderColor: "rgba(50, 100, 220, 0.3)"
                };
        }
    };

    const getWashiTapeClasses = () => {
        switch (theme) {
            case "sunrise":
            case "midday":
                return "bg-emerald-100/50 border-emerald-200/20 text-emerald-800/60";
            case "sunset":
                return "bg-pink-100/50 border-pink-200/20 text-pink-700/80";
            case "night":
                return "bg-blue-900/40 border-blue-800/30 text-blue-300";
        }
    };

    const getWashiTapeBgImage = () => {
        switch (theme) {
            case "sunrise":
            case "midday":
                return 'repeating-linear-gradient(-45deg, rgba(143,151,121,0.08) 0px, rgba(143,151,121,0.08) 1.5px, transparent 1.5px, transparent 3px)';
            case "sunset":
                return 'repeating-linear-gradient(-45deg, rgba(255,105,180,0.08) 0px, rgba(255,105,180,0.08) 1.5px, transparent 1.5px, transparent 3px)';
            case "night":
                return 'repeating-linear-gradient(-45deg, rgba(50,100,220,0.15) 0px, rgba(50,100,220,0.15) 1.5px, transparent 1.5px, transparent 3px)';
        }
    };

    return (
        <div 
            className="group relative overflow-hidden p-6 rounded-3xl border shadow-sm transition-all duration-300 hover:shadow-md"
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
