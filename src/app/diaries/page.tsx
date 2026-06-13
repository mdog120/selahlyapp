"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { BookOpen, PenLine, Save, Check, Flame, Flower2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getDailyVerse } from "@/lib/dailyVerse";
import { BadgeUnlockModal } from "@/components/gamification/BadgeUnlockModal";
import { GlowingCandle } from "@/components/diaries/GlowingCandle";
import { VerseWallpaperModal } from "@/components/home/VerseWallpaperModal";
import { QuietTimeAudio } from "@/components/ui/QuietTimeAudio";
import { motion, AnimatePresence } from "framer-motion";

const REFLECTION_PROMPTS = [
    "Where did you see God's quiet kindness today?",
    "What is a promise you are holding onto in this season?",
    "Write a prayer of release for things you cannot control.",
    "What was the most peaceful moment of your day today?",
    "How has a sister in faith encouraged you recently?",
    "What is a verse or word that has been anchoring your thoughts?",
    "What area of your heart is God inviting you to surrender today?",
    "List three small blessings from today that made you smile."
];

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

const parseEntryContent = (rawContent: string) => {
    const match = rawContent.match(/\n\n\[SelahlySeal:(.*)\]$/);
    if (match) {
        try {
            const sealData = JSON.parse(match[1]);
            const content = rawContent.replace(/\n\n\[SelahlySeal:(.*)\]$/, "");
            return { content, seal: sealData };
        } catch (e) {
            console.error("Failed to parse seal data", e);
        }
    }
    return { content: rawContent, seal: null };
};

const getFontClass = (font: string) => {
    if (font === 'sans') return 'font-sans';
    if (font === 'handwriting') return 'font-handwriting';
    return 'font-serif';
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
    const [isDiariesWallpaperOpen, setIsDiariesWallpaperOpen] = useState(false);

    // Cozy Upgrades State
    const [selectedSeal, setSelectedSeal] = useState<'bow' | 'cross' | 'branch' | 'heart'>('bow');
    const [selectedSealColor, setSelectedSealColor] = useState<'gold' | 'rose' | 'sage' | 'lavender'>('gold');
    const [diaryFont, setDiaryFont] = useState<'sans' | 'serif' | 'handwriting'>('serif');
    const [activePrompt, setActivePrompt] = useState<string | null>(null);

    const handleDrawPrompt = () => {
        const remainingPrompts = activePrompt 
            ? REFLECTION_PROMPTS.filter(p => p !== activePrompt)
            : REFLECTION_PROMPTS;
        const randomPrompt = remainingPrompts[Math.floor(Math.random() * remainingPrompts.length)];
        setActivePrompt(randomPrompt);
    };

    const handleInsertPrompt = () => {
        if (!activePrompt) return;
        const prefix = `Prompt: ${activePrompt}\n\n`;
        setEntry(prev => {
            if (prev.startsWith("Prompt:")) {
                const parts = prev.split("\n\n");
                parts[0] = `Prompt: ${activePrompt}`;
                return parts.join("\n\n");
            }
            return prefix + prev;
        });
    };

    // Badge State
    const [showBadgeModal, setShowBadgeModal] = useState(false);
    const [justEarnedBadge, setJustEarnedBadge] = useState<{ name: string, description: string } | null>(null);

    const supabase = createClient();

    useEffect(() => {
        // Use the shared deterministic verse (KJV)
        const v = getDailyVerse();
        setVerse(v);
        loadUserData();

        // Load font preference from localStorage
        const storedFont = localStorage.getItem("selahly_diary_font");
        if (storedFont === "sans" || storedFont === "serif" || storedFont === "handwriting") {
            setDiaryFont(storedFont);
        }
    }, []);

    const handleFontChange = (font: 'sans' | 'serif' | 'handwriting') => {
        setDiaryFont(font);
        localStorage.setItem("selahly_diary_font", font);
    };

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
                const lastDate = new Date(profile.last_journal_date);
                const today = new Date();
                
                const getLocalDayDifference = (d1: Date, d2: Date) => {
                    const date1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
                    const date2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
                    return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
                };

                const dayDiff = getLocalDayDifference(lastDate, today);

                // If last journal was older than yesterday, streak is broken
                if (dayDiff > 1) {
                    currentStreak = 0;
                }

                if (dayDiff === 0) {
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

        // 1. Save Entry with Wax Seal Metadata
        const contentWithSeal = `${entry.trim()}\n\n[SelahlySeal:${JSON.stringify({ seal: selectedSeal, color: selectedSealColor })}]`;
        
        await supabase.from("diaries").insert({
            user_id: user.id,
            verse_reference: verse?.reference,
            content: contentWithSeal
        });

        // Add to local history list dynamically so it renders immediately
        const newHistoryItem: HistoryEntry = {
            id: Math.random().toString(), // temp ID
            content: contentWithSeal,
            verse_reference: verse?.reference || "",
            created_at: new Date().toISOString()
        };
        setHistory(prev => [newHistoryItem, ...prev]);

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
        }, 2500);
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
                                <GlowingCandle 
                                    isLit={streak > 0 || hasJournaledToday} 
                                    streak={streak} 
                                    hasJournaledToday={hasJournaledToday}
                                    isCelebrating={animatingStreak}
                                />
                                <span className="text-xs font-bold uppercase tracking-widest text-sage-green mb-4 block mt-4">Verse of the Day (KJV)</span>
                                <p className="font-serif text-2xl md:text-3xl text-warm-grey leading-relaxed mb-6">
                                    "{verse?.text?.trim()}"
                                </p>
                                <p className="font-medium text-warm-cocoa">— {verse?.reference}</p>
                                <div className="flex flex-wrap gap-4 items-center justify-center mt-4">
                                    <Link
                                        href={`/bible?book=${encodeURIComponent(verse?.reference.split(' ')[0] || '')}&chapter=${encodeURIComponent(verse?.reference.split(' ')[1]?.split(':')[0] || '1')}`}
                                        className="inline-flex items-center gap-1 text-xs font-serif italic text-warm-grey/60 hover:text-warm-cocoa transition-colors"
                                    >
                                        <BookOpen className="w-3 h-3" /> Read Full Chapter
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setIsDiariesWallpaperOpen(true)}
                                        className="inline-flex items-center gap-1 text-xs font-serif italic text-muted-rose hover:text-muted-rose/85 transition-colors font-semibold"
                                    >
                                        <span>✨</span> Create Wallpaper
                                    </button>
                                </div>
                            </div>
                        )}
                        <BookOpen className="absolute -bottom-10 -right-10 w-48 h-48 text-sage-green/5 -rotate-12 pointer-events-none" />
                    </div>

                    {/* Right: Journaling Area */}
                    <div className="glass-card p-6 rounded-3xl border border-white/60 flex flex-col h-[520px]">
                        <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-warm-grey/5">
                            <div className="flex items-center gap-3">
                                <PenLine className="w-5 h-5 text-warm-grey/60" />
                                <h2 className="font-serif text-xl text-warm-grey">Daily Reflection</h2>
                            </div>
                            {!hasJournaledToday ? (
                                <button
                                    type="button"
                                    onClick={handleDrawPrompt}
                                    className="text-[10px] bg-soft-blush/30 hover:bg-soft-blush/60 text-muted-rose border border-muted-rose/10 font-bold font-sans px-2.5 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                                >
                                    <span>౨ৎ</span> Draw a Prompt
                                </button>
                            ) : (
                                <span className="text-xs text-warm-grey/40 font-sans">
                                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </span>
                            )}
                        </div>

                        <AnimatePresence>
                            {activePrompt && (
                                <motion.div 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-4 p-4 bg-soft-blush/20 border border-muted-rose/20 rounded-2xl relative overflow-hidden flex flex-col gap-2.5 text-left"
                                >
                                    <div className="absolute top-0 right-0 w-8 h-8 bg-muted-rose/5 rounded-bl-full pointer-events-none" />
                                    <div className="flex justify-between items-start">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-rose font-sans flex items-center gap-1">
                                            <span>౨ৎ</span> Quiet-Time Prompt
                                        </span>
                                        <button 
                                            onClick={() => setActivePrompt(null)}
                                            className="text-warm-grey/40 hover:text-warm-grey text-[10px] font-bold font-sans"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <p className="font-serif italic text-xs text-warm-cocoa leading-relaxed">
                                        "{activePrompt}"
                                    </p>
                                    <div className="flex gap-2 mt-1">
                                        <button
                                            type="button"
                                            onClick={handleInsertPrompt}
                                            className="px-2.5 py-1 bg-white hover:bg-stone-50 border border-warm-grey/10 rounded-lg text-[10px] font-medium text-warm-cocoa font-sans transition-all active:scale-95 cursor-pointer"
                                        >
                                            Insert into Diary
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDrawPrompt}
                                            className="px-2.5 py-1 bg-warm-cocoa/5 hover:bg-warm-cocoa/10 border border-warm-cocoa/10 rounded-lg text-[10px] font-medium text-warm-cocoa font-sans transition-all active:scale-95 cursor-pointer"
                                        >
                                            Draw Another
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <textarea
                            value={entry}
                            onChange={(e) => setEntry(e.target.value)}
                            disabled={hasJournaledToday}
                            placeholder="What is God speaking to you through this verse?"
                            className={`flex-1 bg-transparent border-none resize-none focus:ring-0 text-warm-grey placeholder:text-warm-grey/30 leading-relaxed text-lg custom-scrollbar p-0 ${getFontClass(diaryFont)} ${hasJournaledToday ? "opacity-50 italic cursor-not-allowed" : ""}`}
                        />

                        {/* Editor Controls & Wax Seal Options */}
                        <div className="border-t border-warm-grey/5 pt-3 mt-auto flex flex-col gap-2">
                            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                                {/* Font Selector */}
                                <div className="flex gap-1 bg-stone-100/60 p-0.5 rounded-lg text-[10px] font-sans">
                                    <button
                                        onClick={() => handleFontChange('sans')}
                                        className={`px-1.5 py-0.5 rounded transition-all ${diaryFont === 'sans' ? 'bg-white shadow-sm font-bold text-warm-cocoa' : 'text-warm-grey/60 hover:text-warm-grey'}`}
                                    >
                                        Sans
                                    </button>
                                    <button
                                        onClick={() => handleFontChange('serif')}
                                        className={`px-1.5 py-0.5 rounded transition-all ${diaryFont === 'serif' ? 'bg-white shadow-sm font-bold text-warm-cocoa font-serif' : 'text-warm-grey/60 hover:text-warm-grey font-serif'}`}
                                    >
                                        Serif
                                    </button>
                                    <button
                                        onClick={() => handleFontChange('handwriting')}
                                        className={`px-1.5 py-0.5 rounded transition-all font-handwriting ${diaryFont === 'handwriting' ? 'bg-white shadow-sm font-bold text-warm-cocoa' : 'text-warm-grey/60 hover:text-warm-grey'}`}
                                    >
                                        Write
                                    </button>
                                </div>

                                {/* Wax Seal Selector Controls */}
                                {!hasJournaledToday && (
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-1 items-center">
                                            {(['bow', 'cross', 'branch', 'heart'] as const).map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setSelectedSeal(s)}
                                                    title={`Stamp: ${s}`}
                                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-all ${selectedSeal === s ? 'bg-muted-rose text-white scale-110 shadow-sm' : 'bg-stone-50 border border-warm-grey/5 hover:bg-stone-100 text-warm-grey/60'}`}
                                                >
                                                    {s === 'bow' ? '౨ৎ' : s === 'cross' ? '✝' : s === 'branch' ? '🌿' : '♥'}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-1 items-center">
                                            {(['gold', 'rose', 'sage', 'lavender'] as const).map(c => {
                                                const colorHex = c === 'gold' ? '#eab308' : c === 'rose' ? '#f43f5e' : c === 'sage' ? '#10b981' : '#a855f7';
                                                return (
                                                    <button
                                                        key={c}
                                                        onClick={() => setSelectedSealColor(c)}
                                                        title={`Color: ${c}`}
                                                        className={`w-3.5 h-3.5 rounded-full border transition-all ${selectedSealColor === c ? 'ring-2 ring-muted-rose ring-offset-1 scale-125' : 'hover:scale-110'}`}
                                                        style={{ backgroundColor: colorHex, borderColor: 'rgba(0,0,0,0.1)' }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between mt-1 pt-2 border-t border-stone-100/60">
                                {/* Active Seal Preview */}
                                {!hasJournaledToday ? (
                                    <div className="flex items-center gap-1.5 text-xs text-warm-grey/50 font-sans">
                                        <span>Seal:</span>
                                        <div className="flex items-center gap-1">
                                            <span 
                                                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] text-white shadow-sm border border-black/5"
                                                style={{
                                                    background: selectedSealColor === 'gold' 
                                                        ? 'linear-gradient(135deg, #fbbf24, #b45309)' 
                                                        : selectedSealColor === 'rose'
                                                        ? 'linear-gradient(135deg, #fda4af, #be123c)'
                                                        : selectedSealColor === 'sage'
                                                        ? 'linear-gradient(135deg, #a7f3d0, #047857)'
                                                        : 'linear-gradient(135deg, #ddd6fe, #6d28d9)'
                                                }}
                                            >
                                                {selectedSeal === 'bow' ? '౨ৎ' : selectedSeal === 'cross' ? '✝' : selectedSeal === 'branch' ? '🌿' : '♥'}
                                            </span>
                                            <span className="font-semibold capitalize text-warm-cocoa/80">{selectedSealColor} {selectedSeal}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-xs text-sage-green font-medium font-sans">
                                        ✨ Sealed in Grace
                                    </div>
                                )}

                                {/* Save Button */}
                                <div>
                                    {hasJournaledToday && !saved ? (
                                        <span className="text-xs text-sage-green font-medium flex items-center bg-sage-green/10 px-3 py-1.5 rounded-full font-sans">
                                            <Check className="w-3.5 h-3.5 mr-1" /> Completed
                                        </span>
                                    ) : (
                                        <Button
                                            onClick={handleSave}
                                            disabled={saved || hasJournaledToday || !entry.trim()}
                                            className={`transition-all duration-500 font-sans ${saved ? "bg-orange-400 hover:bg-orange-500 text-white w-full" : ""}`}
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
                            {history.map((entry) => {
                                const { content: cleanContent, seal } = parseEntryContent(entry.content);
                                return (
                                    <div key={entry.id} className="glass-card p-6 pb-14 rounded-2xl border border-white/60 hover:shadow-md transition-all duration-300 group relative flex flex-col justify-between min-h-[180px]">
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-sage-green font-sans">
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

                                            <p className={`text-warm-grey leading-relaxed line-clamp-5 group-hover:line-clamp-none transition-all ${getFontClass(diaryFont)}`}>
                                                {cleanContent}
                                            </p>
                                        </div>

                                        {seal && (
                                            <motion.div
                                                whileHover={{ scale: 1.15, rotate: 12 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 10 }}
                                                className="absolute bottom-3 right-3 flex items-center justify-center cursor-default select-none pointer-events-auto"
                                                title={`Sealed with ${seal.color} ${seal.seal}`}
                                            >
                                                <div 
                                                    className="w-9 h-9 rounded-[45%_55%_48%_52%] relative flex items-center justify-center shadow-[inset_-2px_-2px_4px_rgba(0,0,0,0.35),2px_3px_6px_rgba(0,0,0,0.2)] border border-black/5"
                                                    style={{
                                                        background: seal.color === 'gold' 
                                                            ? 'linear-gradient(135deg, #fbbf24, #b45309, #d97706)' 
                                                            : seal.color === 'rose'
                                                            ? 'linear-gradient(135deg, #fda4af, #be123c, #e11d48)'
                                                            : seal.color === 'sage'
                                                            ? 'linear-gradient(135deg, #a7f3d0, #047857, #059669)'
                                                            : 'linear-gradient(135deg, #ddd6fe, #6d28d9, #7c3aed)'
                                                    }}
                                                >
                                                    {/* Inner Ring Stamp */}
                                                    <div className="w-7 h-7 rounded-full border border-white/25 flex items-center justify-center shadow-[inset_1px_1px_3px_rgba(0,0,0,0.4)]">
                                                        <span className="text-white text-[10px] font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                                                            {seal.seal === 'bow' ? '౨ৎ' : seal.seal === 'cross' ? '✝' : seal.seal === 'branch' ? '🌿' : '♥'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                );
                            })}
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

            {verse && (
                <VerseWallpaperModal
                    isOpen={isDiariesWallpaperOpen}
                    onClose={() => setIsDiariesWallpaperOpen(false)}
                    verseText={verse.text}
                    verseReference={verse.reference}
                />
            )}

            <QuietTimeAudio />
        </div>
    );
}
