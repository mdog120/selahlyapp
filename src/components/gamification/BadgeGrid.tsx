"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Flame, Feather, Users, Heart, Sparkles } from "lucide-react";

type Badge = {
    id: string;
    name: string;
    description: string;
    icon_name: string;
    category: string;
};

type UserBadge = {
    badge_id: string;
    earned_at: string;
    badge: Badge; // Joined
};

export function BadgeGrid({ userId }: { userId: string }) {
    const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
    const [allBadges, setAllBadges] = useState<Badge[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            // 1. Fetch All Badges (to show locked state)
            const { data: badges } = await supabase.from("badges").select("*").order("name");
            if (badges) setAllBadges(badges);

            // 2. Fetch User Badges
            const { data: userBadges } = await supabase
                .from("user_badges")
                .select(`
                    badge_id,
                    earned_at,
                    badge:badges(*)
                `)
                .eq("user_id", userId);

            if (userBadges) {
                setEarnedBadges(userBadges as any);
            }
            setLoading(false);
        };
        fetchData();
    }, [userId]);

    const getIcon = (name: string) => {
        const props = { className: "w-8 h-8 drop-shadow-sm filter" };
        switch (name) {
            case 'Candle': return <Flame {...props} className="w-8 h-8 text-orange-400 fill-orange-400/20" />;
            case 'Feather': return <Feather {...props} className="w-8 h-8 text-blue-400 fill-blue-400/20" />;
            case 'Users': return <Users {...props} className="w-8 h-8 text-sage-green fill-sage-green/20" />;
            case 'Heart': return <Heart {...props} className="w-8 h-8 text-muted-rose fill-muted-rose/20" />;
            default: return <Sparkles {...props} className="w-8 h-8 text-yellow-400 fill-yellow-400/20" />;
        }
    };

    if (loading) return <div className="h-20 animate-pulse bg-stone-100/50 rounded-xl w-full" />;

    return (
        <div className="space-y-4">
            <h3 className="font-serif text-xl text-warm-cocoa">Your Stickers</h3>

            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-4">
                {allBadges.map((badge) => {
                    const earned = earnedBadges.find(ub => ub.badge_id === badge.id);
                    const icon = getIcon(badge.icon_name);

                    return (
                        <div key={badge.id} className="flex flex-col items-center group relative">
                            <div
                                className={`w-16 h-16 flex items-center justify-center text-3xl rounded-full transition-all duration-300 relative
                                ${earned
                                        ? "bg-white shadow-sm border-2 border-white scale-100 hover:scale-110 hover:-rotate-6 cursor-pointer"
                                        : "bg-stone-100 grayscale opacity-40 scale-90"
                                    }`}
                                title={earned ? `Earned: ${new Date(earned.earned_at).toLocaleDateString()}` : badge.description}
                            >
                                {/* Sticker Effect: White outline simulated via text-shadow or SVG filter */}
                                <span className={earned ? "drop-shadow-sticker filter" : ""}>
                                    {icon}
                                </span>

                                {/* Locked Icon */}
                                {!earned && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-full">
                                        <span className="text-xs">🔒</span>
                                    </div>
                                )}
                            </div>

                            {/* Caption */}
                            <span className={`text-[10px] text-center mt-2 font-medium leading-tight max-w-[80px] ${earned ? "text-warm-grey" : "text-warm-grey/40 italic"}`}>
                                {earned ? badge.description : `Unlock: ${badge.description}`}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
