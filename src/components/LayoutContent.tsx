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

    useEffect(() => {
        const updateTheme = () => {
            const hour = new Date().getHours();
            let theme = "theme-midday";
            if (hour >= 5 && hour < 10) {
                theme = "theme-sunrise";
            } else if (hour >= 10 && hour < 17) {
                theme = "theme-midday";
            } else if (hour >= 17 && hour < 21) {
                theme = "theme-sunset";
            } else {
                theme = "theme-night";
            }

            document.body.classList.remove("theme-sunrise", "theme-midday", "theme-sunset", "theme-night");
            document.body.classList.add(theme);
        };

        updateTheme();
        const interval = setInterval(updateTheme, 60000); // update every minute
        return () => clearInterval(interval);
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
