"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { getDailySelahSister, SelahSister } from "@/data/selahSisters";

export function SelahSisterCard() {
    const [sister, setSister] = useState<SelahSister | null>(null);

    useEffect(() => {
        setSister(getDailySelahSister());
    }, []);

    if (!sister) return null;

    return (
        <div className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-white/40">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-soft-blush/30 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">ᥫ᭡</span>
                    <h3 className="text-xs font-bold tracking-widest text-warm-grey/60 uppercase">Selah Sister</h3>
                </div>

                <h2 className="font-serif text-3xl text-warm-cocoa mb-3 italic">
                    {sister.name} <span className="text-sm not-italic ml-2">♡</span>
                </h2>

                <p className="text-warm-grey text-sm mb-6 leading-relaxed">
                    {sister.biography}
                </p>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-sage-green font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Feature
                    </span>

                    <Link
                        href={`/bible?book=${encodeURIComponent(sister.book)}&chapter=${sister.chapter}`}
                        className="flex items-center gap-2 text-sm font-medium text-warm-cocoa hover:text-sage-green transition-colors group-hover:translate-x-1 duration-300"
                    >
                        Read Story <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-2 right-4 text-[10px] text-warm-grey/20">
                ❤︎
            </div>
        </div>
    );
}
