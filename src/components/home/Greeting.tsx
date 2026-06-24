"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getDecorationKind, EVENT_EMOJIS, EVENT_DETAILS, DecorationKind } from "@/lib/eventDecorations";

const WORLD_CUP_TEAMS = ["Brazil", "USA", "France", "Argentina", "England", "Spain"];

export function Greeting({ displayName }: { displayName: string }) {
    const [greeting, setGreeting] = useState("Good Morning");
    const [emoji, setEmoji] = useState("☁️");
    const [eventKind, setEventKind] = useState<DecorationKind | null>(null);
    const [isWorldCupPromptOpen, setIsWorldCupPromptOpen] = useState(false);
    const [isGeneralModalOpen, setIsGeneralModalOpen] = useState(false);
    const [teamPick, setTeamPick] = useState<string | null>(null);
    const [isBouncing, setIsBouncing] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
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
        // Trigger visual hop feedback on click
        setIsBouncing(true);
        setTimeout(() => setIsBouncing(false), 500);

        // Open appropriate lightbox modal
        if (eventKind === "world-cup") {
            setIsWorldCupPromptOpen(true);
        } else {
            setIsGeneralModalOpen(true);
        }
    };

    const renderModals = () => {
        if (!mounted) return null;

        return createPortal(
            <>
                {/* World Cup Prediction Lightbox */}
                {isWorldCupPromptOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 px-4 backdrop-blur-sm animate-fade-in">
                        <div className="relative w-full max-w-sm rounded-[2.5rem] border border-white/70 bg-warm-paper p-8 text-center shadow-2xl animate-scale-in">
                            <div className="mb-4 text-center">
                                <span className="relative inline-flex items-center justify-center w-14 h-14 bg-white/80 rounded-full shadow-sm">
                                    <span className="absolute top-[2px] left-[2px] text-xs font-serif text-muted-rose font-bold select-none rotate-[-15deg]">
                                        ౨ৎ
                                    </span>
                                    <span className="text-3xl select-none">{emoji}</span>
                                </span>
                            </div>
                            
                            <h2 className="font-serif text-2xl text-warm-cocoa font-bold mb-3">
                                {eventKind && EVENT_DETAILS[eventKind] ? EVENT_DETAILS[eventKind].title : "World Cup Winner"}
                            </h2>

                            <p className="text-warm-grey text-sm leading-relaxed mb-5 font-sans">
                                Which team do you think will win the World Cup?
                            </p>

                            <div className="mt-4 grid grid-cols-2 gap-2">
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
                                className="mt-6 w-full rounded-full bg-warm-cocoa px-5 py-2.5 text-xs font-bold text-white hover:bg-warm-cocoa/90 transition-all active:scale-98"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* General Themed Lightbox for other events & the default cloud */}
                {isGeneralModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 px-4 backdrop-blur-sm animate-fade-in">
                        <div className="relative w-full max-w-sm rounded-[2.5rem] border border-white/75 bg-warm-paper p-8 text-center shadow-2xl animate-scale-in">
                            <div className="mb-4 text-center">
                                <span className="relative inline-flex items-center justify-center w-14 h-14 bg-white/80 rounded-full shadow-sm">
                                    <span className="absolute top-[2px] left-[2px] text-xs font-serif text-muted-rose font-bold select-none rotate-[-15deg]">
                                        ౨ৎ
                                    </span>
                                    <span className="text-3xl select-none">{emoji}</span>
                                </span>
                            </div>
                            
                            <h2 className="font-serif text-2xl text-warm-cocoa font-bold mb-3 leading-snug">
                                {eventKind && EVENT_DETAILS[eventKind] ? EVENT_DETAILS[eventKind].title : "Selahly Sanctuary ౨ৎ"}
                            </h2>
                            
                            <p className="text-warm-grey text-sm leading-relaxed mb-6 font-sans text-center">
                                {eventKind && EVENT_DETAILS[eventKind] ? EVENT_DETAILS[eventKind].message : "Take a slow breath, rest in His presence, and remember: 'She is clothed with strength and dignity; she can laugh at the days to come.' — Proverbs 31:25"}
                            </p>

                            <button
                                type="button"
                                onClick={() => setIsGeneralModalOpen(false)}
                                className="w-full rounded-full bg-warm-cocoa px-5 py-2.5 text-xs font-bold text-white hover:bg-warm-cocoa/90 transition-all active:scale-98"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </>,
            document.body
        );
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
            {renderModals()}
        </>
    );
}
