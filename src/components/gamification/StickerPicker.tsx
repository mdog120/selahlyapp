"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Smile, Flame, Feather, Users, Heart, Sparkles, MessageCircle, HandHeart, Sun, Flower2, TreeDeciduous, Star, CloudSun } from "lucide-react";

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
        const props = { className: "w-8 h-8 drop-shadow-sm filter" };
        switch (name) {
            case 'Candle': return <Flame {...props} className="w-8 h-8 text-orange-400 fill-orange-400/20" />;
            case 'Feather': return <Feather {...props} className="w-8 h-8 text-blue-400 fill-blue-400/20" />;
            case 'Users': return <Users {...props} className="w-8 h-8 text-sage-green fill-sage-green/20" />;
            case 'Heart': return <Heart {...props} className="w-8 h-8 text-muted-rose fill-muted-rose/20" />;
            case 'Prayer Warrior': return <HandHeart {...props} className="w-8 h-8 text-blue-400 fill-blue-400/20" />;
            case 'Encourager': return <MessageCircle {...props} className="w-8 h-8 text-purple-400 fill-purple-400/20" />;
            case 'Sunshine': return <Sun {...props} className="w-8 h-8 text-yellow-500 fill-yellow-500/20" />;
            case 'Bloom': return <Flower2 {...props} className="w-8 h-8 text-pink-400 fill-pink-400/20" />;
            case 'Peace': return <CloudSun {...props} className="w-8 h-8 text-sky-400 fill-sky-400/20" />;
            case 'Rooted': return <TreeDeciduous {...props} className="w-8 h-8 text-green-600 fill-green-600/20" />;
            case 'Star': return <Star {...props} className="w-8 h-8 text-yellow-400 fill-yellow-400/20" />;
            default: return <Sparkles {...props} className="w-8 h-8 text-yellow-400 fill-yellow-400/20" />;
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
