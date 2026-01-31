"use client";

import { MessagesSidebar } from "@/components/messaging/MessagesSidebar";
import { Navbar } from "@/components/Navbar";

export default function MessagesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-warm-paper font-sans flex flex-col">
            <Navbar />

            <div className="flex-1 container mx-auto px-4 pt-20 pb-4 max-w-6xl flex overflow-hidden h-[calc(100vh-1rem)]">
                <div className="bg-white rounded-3xl shadow-sm border border-white/50 w-full flex overflow-hidden">
                    {/* Desktop Sidebar */}
                    <div className="hidden md:block w-80 flex-shrink-0 h-full">
                        <MessagesSidebar />
                    </div>

                    {/* Main Content Area */}
                    <main className="flex-1 h-full relative">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
