"use client";

import { Navbar } from "@/components/Navbar";
import { VaultFeed } from "@/components/vault/VaultFeed";
import { Sparkles } from "lucide-react";

export default function VelvetVaultPage() {
    return (
        <div className="min-h-screen bg-warm-paper font-sans selection:bg-muted-rose/20">
            <Navbar />

            <main className="container mx-auto px-4 pt-24 pb-20 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-10 animate-fade-in-up">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-deep-velvet/5 text-deep-velvet text-xs font-medium tracking-wide mb-4 border border-deep-velvet/10">
                        <Sparkles className="w-3 h-3" /> The Velvet Vault
                    </span>
                    <h1 className="font-serif text-4xl md:text-5xl text-warm-cocoa mb-4">
                        Deep Questions,<br />
                        <span className="italic text-deep-velvet">Honest Answers.</span>
                    </h1>
                    <p className="text-warm-grey max-w-lg mx-auto leading-relaxed">
                        A safe space to ask the hard questions about faith, life, and relationships.
                        Iron sharpens iron. ✨
                    </p>
                </div>

                {/* Feed */}
                <VaultFeed />
            </main>
        </div>
    );
}
