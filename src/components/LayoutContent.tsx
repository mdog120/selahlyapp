"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";

interface LayoutContentProps {
    children: React.ReactNode;
}

export function LayoutContent({ children }: LayoutContentProps) {
    const pathname = usePathname();
    const isGraceInhale = pathname === "/grace-inhale";

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
            <main className="flex-1 pt-[calc(4rem+env(safe-area-inset-top,0px))]">
                {children}
            </main>
        </div>
    );
}
