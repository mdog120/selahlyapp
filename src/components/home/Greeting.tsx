"use client";

import { useEffect, useState } from "react";

export function Greeting({ displayName }: { displayName: string }) {
    const [greeting, setGreeting] = useState("Good Morning");

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good Morning");
        else if (hour < 18) setGreeting("Good Afternoon");
        else setGreeting("Good Evening");
    }, []);

    return (
        <h1 className="font-serif text-3xl md:text-4xl text-warm-grey mb-2">
            {greeting}, <span className="text-warm-cocoa italic">{displayName}</span> ☁️
        </h1>
    );
}
