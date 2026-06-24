"use client";

import { useEffect, useState } from "react";
import { getDecorationKind, EVENT_EMOJIS } from "@/lib/eventDecorations";

export function Greeting({ displayName }: { displayName: string }) {
    const [greeting, setGreeting] = useState("Good Morning");
    const [emoji, setEmoji] = useState("☁️");

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 18) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");

        // Determine current event emoji
        const kind = getDecorationKind(new Date());
        if (kind && EVENT_EMOJIS[kind]) {
            setEmoji(EVENT_EMOJIS[kind]);
        } else {
            setEmoji("☁️");
        }
    }, []);

    return (
        <h1 className="font-serif text-3xl md:text-4xl text-warm-grey mb-2">
            {greeting}, <span className="text-warm-cocoa italic">{displayName}</span>{" "}
            <span className="relative inline-block ml-1.5 align-middle">
                {/* Cute iconic bow (౨ৎ) on the top-left */}
                <span 
                    className="absolute -top-2.5 -left-2 text-[11px] font-serif text-muted-rose select-none font-bold"
                    style={{ transform: "rotate(-15deg)" }}
                >
                    ౨ৎ
                </span>
                <span className="text-2xl select-none">{emoji}</span>
            </span>
        </h1>
    );
}
