"use client";

import { useEffect, useState } from "react";
import { getDecorationKind, EVENT_EMOJIS, DecorationKind } from "@/lib/eventDecorations";

const WORLD_CUP_TEAMS = ["Brazil", "USA", "France", "Argentina", "England", "Spain"];

export function Greeting({ displayName }: { displayName: string }) {
    const [greeting, setGreeting] = useState("Good Morning");
    const [emoji, setEmoji] = useState("☁️");
    const [eventKind, setEventKind] = useState<DecorationKind | null>(null);
    const [isWorldCupPromptOpen, setIsWorldCupPromptOpen] = useState(false);
    const [teamPick, setTeamPick] = useState<string | null>(null);
    const [isBouncing, setIsBouncing] = useState(false);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 18) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");

        // Determine current event emoji
        const kind = getDecorationKind(new Date());
        setEventKind(kind);
        if (kind && EVENT_EMOJIS[kind]) {
            setEmoji(EVENT_EMOJIS[kind]);
        } else {
            setEmoji("☁️");
        }
    }, []);

    const handleClickEmoji = () => {
        if (eventKind === "world-cup") {
            setIsWorldCupPromptOpen(true);
        } else {
            // Trigger a cute bounce animation for non-modal emojis
            setIsBouncing(true);
            setTimeout(() => setIsBouncing(false), 500);
        }
    };

    return (
        <>
            <h1 className="font-serif text-3xl md:text-4xl text-warm-grey mb-2 flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1">
                <span>{greeting},</span>
                <span className="flex items-center gap-1.5">
                    <span className="text-warm-cocoa italic">{displayName}</span>
                    <button
                        type="button"
                        onClick={handleClickEmoji}
                        className={`relative inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-stone-100/50 active:scale-95 transition-all duration-300 focus:outline-none ${
                            isBouncing ? "animate-[selahly-hop_0.5s_ease-in-out]" : "animate-wiggle-periodic"
                        }`}
                        title={eventKind === "world-cup" ? "Make a World Cup winner prediction" : "Selahly Event Accent"}
                    >
                        {/* Cute iconic bow (౨ৎ) positioned directly ON the top-left corner of the emoji */}
                        <span 
                            className="absolute top-[2px] left-[2px] text-[10px] font-serif text-muted-rose select-none font-bold z-10 pointer-events-none"
                            style={{ transform: "rotate(-15deg)" }}
                        >
                            ౨ৎ
                        </span>
                        <span className="text-2xl select-none leading-none">{emoji}</span>
                    </button>
                </span>
            </h1>

            {isWorldCupPromptOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-grey/20 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-3xl border border-white/70 bg-warm-paper p-6 text-center shadow-xl">
                        <p className="text-4xl" aria-hidden="true">⚽</p>
                        <h2 className="mt-3 font-serif text-2xl text-warm-cocoa">
                            Which team do you think will win?
                        </h2>

                        <div className="mt-5 grid grid-cols-2 gap-2">
                            {WORLD_CUP_TEAMS.map((team) => (
                                <button
                                    key={team}
                                    type="button"
                                    onClick={() => setTeamPick(team)}
                                    className={`rounded-full border px-3 py-2 text-sm font-semibold transition-all ${
                                        teamPick === team
                                            ? "border-muted-rose/50 bg-soft-blush text-warm-cocoa"
                                            : "border-warm-grey/10 bg-white/70 text-warm-grey/70 hover:border-muted-rose/35 hover:text-warm-cocoa"
                                    }`}
                                >
                                    {team}
                                </button>
                            ))}
                        </div>

                        {teamPick && (
                            <p className="mt-4 rounded-2xl bg-white/65 px-4 py-3 text-sm font-medium text-warm-grey">
                                Locked in: {teamPick}. We will see.
                            </p>
                        )}

                        <button
                            type="button"
                            onClick={() => setIsWorldCupPromptOpen(false)}
                            className="mt-5 text-xs font-bold uppercase tracking-widest text-warm-grey/50 transition-colors hover:text-warm-cocoa"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
