"use client";

import { Navbar } from "@/components/Navbar";
import { VibeFeed } from "@/components/vibe/VibeFeed";
import { MannaMachine } from "@/components/manna/MannaMachine";
import { Sparkles } from "lucide-react";

export default function VibeBoardPage() {
    return (
        <div className="min-h-screen bg-warm-paper font-sans selection:bg-sage-green/20">
            <Navbar />

            <main className="container mx-auto px-4 pt-24 pb-20 max-w-6xl">
                {/* Header */}
                <div className="text-center mb-10 animate-fade-in-up">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage-green/10 text-sage-green text-xs font-medium tracking-wide mb-4 border border-sage-green/20">
                        <Sparkles className="w-3 h-3" /> The Vibe Board
                    </span>
                    <h1 className="font-serif text-4xl md:text-5xl text-warm-cocoa mb-4">
                        Curated for your <span className="italic text-sage-green">Soul.</span>
                    </h1>
                    <p className="text-warm-grey max-w-lg mx-auto leading-relaxed">
                        Discover music, podcasts, and creators that help you grow.
                        Share what's inspiring you lately. 🌱
                    </p>
                </div>

                {/* Manna Machine */}
                <div className="mb-16 animate-fade-in-up delay-100">
                    <MannaMachine />
                </div>

                {/* Feed */}
                <VibeFeed />
            </main>
        </div>
    );
}
