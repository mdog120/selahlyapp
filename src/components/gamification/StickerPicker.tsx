"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Smile } from "lucide-react";

type Badge = {
    id: string;
    name: string;
    description: string;
    icon_name: string;
    category: string;
};

type UserBadge = {
    badge_id: string;
    badge: Badge;
};

export function StickerPicker({ onSelect }: { onSelect: (badge: Badge) => void }) {
    const [stickers, setStickers] = useState<UserBadge[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        if (isOpen && stickers.length === 0) {
            fetchStickers();
        }
    }, [isOpen]);

    const fetchStickers = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from("user_badges")
            .select(`
                badge_id,
                badge:badges(*)
            `)
            .eq("user_id", user.id);

        if (data) {
            setStickers(data as any);
        }
        setLoading(false);
    };

    // Helper to render icon based on name (same as BadgeGrid logic, ideally shared)
    const getIcon = (name: string) => {
        // Simple mapping for now, assuming emoji or lucide names
        // Ideally we use actual image assets for "stickers"
        switch (name) {
            case 'Candle': return '🕯️';
            case 'Feather': return '🪶';
            case 'Users': return '👯‍♀️';
            case 'Heart': return '💖';
            default: return '✨';
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-warm-grey/60 hover:text-warm-cocoa transition-colors"
                title="Add Sticker"
            >
                <Smile className="w-5 h-5" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute bottom-full mb-2 left-0 z-50 w-64 bg-white rounded-2xl shadow-xl border border-warm-grey/10 p-4 animate-fade-in-up">
                        <h3 className="text-xs font-bold text-warm-grey/40 uppercase tracking-wider mb-3">Your Stickers</h3>

                        {loading ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="w-5 h-5 animate-spin text-muted-rose" />
                            </div>
                        ) : stickers.length === 0 ? (
                            <div className="text-center py-4 text-xs text-warm-grey/60 italic">
                                No stickers yet.
                                <br />Keep engaging to earn!
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {stickers.map((s) => (
                                    <button
                                        key={s.badge_id}
                                        onClick={() => {
                                            onSelect(s.badge);
                                            setIsOpen(false);
                                        }}
                                        className="aspect-square flex items-center justify-center text-2xl hover:scale-125 transition-transform bg-stone-50 rounded-lg hover:bg-stone-100"
                                        title={s.badge.name}
                                    >
                                        <span className="drop-shadow-sticker filter">
                                            {getIcon(s.badge.icon_name)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
