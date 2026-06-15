"use client";

import { useEffect } from "react";
import { MessagesSidebar } from "@/components/messaging/MessagesSidebar";

export default function MessagesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    useEffect(() => {
        // Lock body and html scrolling on messages pages
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
            document.documentElement.style.overflow = "";
        };
    }, []);

    return (
        <div className="w-full flex px-2 md:px-4 pb-2 md:pb-4 max-w-6xl mx-auto h-[calc(100vh-7.5rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] md:h-[calc(100vh-5rem-env(safe-area-inset-top,0px))] overflow-hidden">
            <div className="bg-white rounded-3xl shadow-sm border border-white/50 w-full flex overflow-hidden h-full">
                {/* Desktop Sidebar */}
                <div className="hidden md:block w-80 flex-shrink-0 h-full border-r border-warm-grey/5">
                    <MessagesSidebar />
                </div>

                {/* Main Content Area */}
                <main className="flex-1 h-full relative overflow-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
