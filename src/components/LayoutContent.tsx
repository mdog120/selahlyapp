"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";

interface LayoutContentProps {
    children: React.ReactNode;
}

export function LayoutContent({ children }: LayoutContentProps) {
    const pathname = usePathname();
    const isGraceInhale = pathname === "/grace-inhale";
    const isMultiplayerRoom = pathname.startsWith("/minigames/multiplayer/room/");

    useEffect(() => {
        document.body.classList.remove("theme-sunrise", "theme-sunset", "theme-night");
        document.body.classList.add("theme-midday");
        document.documentElement.classList.remove("theme-sunrise", "theme-sunset", "theme-night");
        document.documentElement.classList.add("theme-midday");
    }, []);

    if (isGraceInhale) {
        return (
            <div className="flex flex-col min-h-screen">
                <main className="flex-1 w-full h-full">
                    {children}
                </main>
            </div>
        );
    }

    // Hide nav and bottom nav in multiplayer game rooms
    if (isMultiplayerRoom) {
        return (
            <div className="flex flex-col min-h-screen">
                <main className="flex-1 w-full h-full">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] md:pt-[calc(4rem+env(safe-area-inset-top,0px))] pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
