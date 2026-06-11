"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { PushNotificationManager } from "@/components/ui/PushNotificationManager";

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
                <PushNotificationManager />
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
            <PushNotificationManager />
        </div>
    );
}
