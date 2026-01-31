"use client";

import { MessageCircle } from "lucide-react";
import { MessagesSidebar } from "@/components/messaging/MessagesSidebar";

export default function MessagesPage() {
    return (
        <div className="h-full flex flex-col md:flex-row">
            {/* Mobile Sidebar (Visible only on mobile) */}
            <div className="md:hidden w-full h-full">
                <MessagesSidebar />
            </div>

            {/* Desktop Empty State (Hidden on mobile) */}
            <div className="hidden md:flex flex-col items-center justify-center text-warm-grey/40 p-8 text-center h-full w-full animate-fade-in">
                <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-warm-grey/20" />
                </div>
                <h2 className="font-serif text-xl text-warm-grey mb-2">Your Conversations</h2>
                <p className="text-sm">Select a friend from the left to start chatting!</p>
            </div>
        </div>
    );
}
