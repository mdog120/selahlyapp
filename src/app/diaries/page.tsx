"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BookOpen, PenLine, Save, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getDailyVerse } from "@/lib/dailyVerse";
import { BadgeUnlockModal } from "@/components/gamification/BadgeUnlockModal";
import { Flame, Flower2 } from "lucide-react";
import { GlowingCandle } from "@/components/diaries/GlowingCandle";

type Verse = {
    reference: string;
    text: string;
};

type HistoryEntry = {
    id: string;
    content: string;
    verse_reference: string;
    created_at: string;
};

export default function Diaries() {
    const [verse, setVerse] = useState<Verse | null>(null);
    const [entry, setEntry] = useState("");
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingStreak, setLoadingStreak] = useState(true);
    const [streak, setStreak] = useState(0);
    const [hasJournaledToday, setHasJournaledToday] = useState(false);
    const [animatingStreak, setAnimatingStreak] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);

    // Badge State
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [justEarnedBadge, setJustEarnedBadge] = useState<{ name: string, description: string } | null>(null);

    const supabase = createClient();

    useEffect(() => {
        // Use the shared deterministic verse (KJV)
        const v = getDailyVerse();
        setVerse(v);
        loadUserData();
    }, []);

    const loadUserData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Load Profile (Streak)
        const { data: profile } = await supabase
            .from("profiles")
            .select("streak_count, last_journal_date")
            .eq("id", user.id)
            .single();

        if (profile) {
            let currentStreak = profile.streak_count || 0;

            if (profile.last_journal_date) {
                // Check if streak should be reset
                const lastDate = new Date(profile.last_journal_date);
                const today = new Date();

                // Reset hours to compare dates only
                lastDate.setHours(0, 0, 0, 0);
                today.setHours(0, 0, 0, 0);

                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);

                // If last journal was not today AND not yesterday, streak relies broken
                if (lastDate.getTime() < yesterday.getTime()) {
                    currentStreak = 0;
                    // Optimistically update local view, DB will correct on next save if logic mirrors
                }

                if (lastDate.getTime() === today.getTime()) {
                    setHasJournaledToday(true);
                    setEntry("You've already reflected today. See you tomorrow! 🤍");
                }
            }

            setStreak(currentStreak);
        }

        // 3. Load Journal History
        const { data: diaries } = await supabase
            .from("diaries")
            .select("id, content, verse_reference, created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (diaries) {
            setHistory(diaries);
        }

        setLoading(false);
        setLoadingStreak(false);
    };

    const handleSave = async () => {
        if (hasJournaledToday) return;

        setSaved(true);
        setAnimatingStreak(true); // Trigger fire animation

        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !entry.trim()) return;

        // 1. Save Entry
        await supabase.from("diaries").insert({
            user_id: user.id,
            verse_reference: verse?.reference,
            content: entry
        });

        // 2. Update Streak Logic Manually for immediate feedback
        // If hasJournaledToday is true, we returned early, so this is a new entry for today.
        // If streak was 0 (reset) -> becomes 1
        // If streak was N (continued) -> becomes N + 1

        const newStreak = streak + 1;

        const updates = {
            streak_count: newStreak,
            last_journal_date: new Date().toISOString()
        };

        const { error: updateError } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", user.id);

        if (updateError) {
            console.error("Error updating streak:", updateError);
            // Fallback to RPC if direct update fails (e.g. RLS issues)
            await supabase.rpc("update_journal_streak", { user_uuid: user.id });
        }

        // 3. Check for First Glow Badge
        const { data: badgeAwarded } = await supabase.rpc("award_badge", {
            p_user_id: user.id,
            p_badge_name: 'First Glow'
        });

        if (badgeAwarded) {
            setJustEarnedBadge({
                name: "First Glow",
                description: "Completed your first Grace & Glow diary entry."
            });
            setShowBadgeModal(true);
        }

        // 4. Check for Bloom Badge (3-day streak)
        if (newStreak === 3) {
            const { data: bloomAwarded } = await supabase.rpc("award_badge", {
                p_user_id: user.id,
                p_badge_name: 'Bloom'
            });

            if (bloomAwarded) {
                // If we already showed a modal for First Glow (unlikely to get both at same exact moment unless 1st entry somehow counts as 3rd streak? Impossible logic unless manual hack), 
                // but if we did, we might want to queue them.
                // For now, let's assume valid flow: First Glow is day 1. Bloom is day 3. They won't overlap.
                setJustEarnedBadge({
                    name: "Bloom",
                    description: "You've grown in grace with a 3-day streak! 🌸"
                });
                setShowBadgeModal(true);
            }
        }

        // Update local state
        setStreak(newStreak);
        setHasJournaledToday(true);

        setTimeout(() => {
            setSaved(false);
            setAnimatingStreak(false);
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-warm-paper">
            <Navbar />

            <main className="container mx-auto px-4 pt-24 pb-20 max-w-4xl">
                {/* Header with Streak Display */}
                <div className="flex flex-col items-center mb-10 animate-fade-in-up">
                    <div className="w-16 h-16 bg-sage-green/20 rounded-full flex items-center justify-center text-3xl mb-4 text-sage-green">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <h1 className="font-serif text-4xl text-warm-grey mb-2">Grace & Glow</h1>

                    {/* Streak Counter */}
                    <div className="flex items-center gap-2 bg-white/50 px-4 py-1.5 rounded-full border border-white/60 shadow-sm mt-2">
                        <div className={`text-xl transition-all duration-700 ${animatingStreak ? "scale-150 rotate-12" : ""}`}>
                            🔥
                        </div>
                        <span className={`font-serif font-bold text-warm-cocoa transition-all duration-500 ${animatingStreak ? "text-orange-500 scale-110" : ""}`}>
                            {streak} {streak === 1 ? "Day" : "Days"}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Scripture Card */}
                    <div className="glass-card p-8 rounded-3xl border border-white/60 flex flex-col justify-center text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-sage-green/5 group-hover:bg-sage-green/10 transition-colors" />

                        {loading ? (
                            <div className="animate-pulse flex flex-col items-center">
                                <div className="h-4 w-3/4 bg-warm-grey/10 rounded mb-4" />
                                <div className="h-4 w-1/2 bg-warm-grey/10 rounded" />
                            </div>
                        ) : (
                            <div className="relative z-10 flex flex-col items-center">
                                <GlowingCandle isLit={hasJournaledToday} streak={streak} />
                                <span className="text-xs font-bold uppercase tracking-widest text-sage-green mb-4 block mt-4">Verse of the Day (KJV)</span>
                                <p className="font-serif text-2xl md:text-3xl text-warm-grey leading-relaxed mb-6">
                                    "{verse?.text?.trim()}"
                                </p>
                                <p className="font-medium text-warm-cocoa">— {verse?.reference}</p>
                                <Link
                                    href={`/bible?book=${encodeURIComponent(verse?.reference.split(' ')[0] || '')}&chapter=${encodeURIComponent(verse?.reference.split(' ')[1]?.split(':')[0] || '1')}`}
                                    className="inline-flex items-center gap-1 mt-4 text-xs font-serif italic text-warm-grey/60 hover:text-warm-cocoa transition-colors"
                                >
                                    <BookOpen className="w-3 h-3" /> Read Full Chapter
                                </Link>
                            </div>
                        )}
                        <BookOpen className="absolute -bottom-10 -right-10 w-48 h-48 text-sage-green/5 -rotate-12 pointer-events-none" />
                    </div>

                    {/* Right: Journaling Area */}
                    <div className="glass-card p-6 rounded-3xl border border-white/60 flex flex-col h-[500px]">
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-warm-grey/5">
                            <PenLine className="w-5 h-5 text-warm-grey/60" />
                            <h2 className="font-serif text-xl text-warm-grey">Daily Reflection</h2>
                            <span className="ml-auto text-xs text-warm-grey/40">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </span>
                        </div>

                        <textarea
                            value={entry}
                            onChange={(e) => setEntry(e.target.value)}
                            disabled={hasJournaledToday}
                            placeholder="What is God speaking to you through this verse?"
                            className={`flex-1 bg-transparent border-none resize-none focus:ring-0 text-warm-grey placeholder:text-warm-grey/30 leading-relaxed font-serif text-lg custom-scrollbar p-0 ${hasJournaledToday ? "opacity-50 italic cursor-not-allowed" : ""}`}
                        />

                        <div className="pt-4 flex justify-end">
                            {hasJournaledToday && !saved ? (
                                <span className="text-sm text-sage-green font-medium flex items-center bg-sage-green/10 px-3 py-2 rounded-full">
                                    <Check className="w-4 h-4 mr-2" /> Completed for today
                                </span>
                            ) : (
                                <Button
                                    onClick={handleSave}
                                    disabled={saved || hasJournaledToday || !entry.trim()}
                                    className={`transition-all duration-500 ${saved ? "bg-orange-400 hover:bg-orange-500 text-white w-full" : ""}`}
                                >
                                    {saved ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="text-lg animate-bounce">🔥</span>
                                            <span>Streak Updated!</span>
                                        </div>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4 mr-2" /> Save Entry
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Past Reflections Section */}
                <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center gap-3 mb-8">
                        <BookOpen className="w-6 h-6 text-warm-cocoa" />
                        <h2 className="font-serif text-3xl text-warm-cocoa">Past Reflection</h2>
                    </div>

                    {history.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {history.map((entry) => (
                                <div key={entry.id} className="glass-card p-6 rounded-2xl border border-white/60 hover:shadow-md transition-all duration-300 group">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-xs font-bold uppercase tracking-widest text-sage-green">
                                            {new Date(entry.created_at).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                        <span className="text-xs text-warm-grey/40 font-serif italic">
                                            {entry.verse_reference || "No Verse"}
                                        </span>
                                    </div>

                                    <p className="text-warm-grey font-serif leading-relaxed line-clamp-4 group-hover:line-clamp-none transition-all">
                                        {entry.content}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white/30 rounded-3xl border border-white/40 dashed-border">
                            <BookOpen className="w-12 h-12 text-warm-grey/20 mx-auto mb-4" />
                            <p className="font-serif text-warm-grey text-xl italic mb-2">Your journey begins today.</p>
                            <p className="text-sm text-warm-grey/60">Journal entries you save will appear here.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Unlock Modal */}
            <BadgeUnlockModal
                isOpen={showBadgeModal}
                onClose={() => setShowBadgeModal(false)}
                badgeName={justEarnedBadge?.name || ""}
                badgeDescription={justEarnedBadge?.description || ""}
                icon={justEarnedBadge?.name === "Bloom" ? <Flower2 className="w-12 h-12 text-pink-400 fill-pink-400/20" /> : <Flame className="w-12 h-12 text-orange-400 fill-orange-400/20" />}
            />
        </div>
    );
}
