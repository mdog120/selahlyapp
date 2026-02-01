"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Prayer = {
    id: string;
    content: string;
    pray_count: number;
    is_anonymous: boolean;
    user: {
        first_name: string;
        last_name: string;
    } | null;
    created_at: string;
};

export function PrayerRequestList() {
    const [prayers, setPrayers] = useState<Prayer[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchPrayers = async () => {
            const { data } = await supabase
                .from("prayers")
                .select(`
                    id,
                    content,
                    pray_count,
                    is_anonymous,
                    created_at,
                    user:profiles!prayers_user_id_fkey (first_name, last_name)
                `)
                .order("created_at", { ascending: false })
                .limit(2);

            if (data) {
                setPrayers(data as any);
            }
            setLoading(false);
        };

        fetchPrayers();
    }, []);

    const handlePray = async (id: string, currentCount: number) => {
        // Optimistic UI
        setPrayers(prev => prev.map(p =>
            p.id === id ? { ...p, pray_count: currentCount + 1 } : p
        ));

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Check interaction
        const { error: matchError } = await supabase
            .from("prayer_interactions")
            .insert({ prayer_id: id, user_id: user.id });

        if (!matchError) {
            // If success (not duplicate), increment count
            await supabase.rpc('increment_prayer_count', { prayer_uuid: id });
        }
    };

    return (
        <div className="glass-card p-6 rounded-3xl border border-white/60">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-muted-rose">
                    <Heart className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">Prayer Pocket</span>
                </div>
                <a href="/prayer-pocket" className="text-[10px] text-warm-grey/40 hover:text-warm-grey underline">View All</a>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-xs text-warm-grey/40 italic">Loading prayers...</div>
                ) : prayers.length === 0 ? (
                    <div className="text-xs text-warm-grey/40">No prayers yet. Be the first?</div>
                ) : (
                    prayers.map(prayer => (
                        <div key={prayer.id} className="pb-3 border-b border-warm-grey/5 last:border-0 last:pb-0">
                            <p className="text-sm text-warm-grey mb-2 line-clamp-2">{prayer.content}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-warm-grey/40">
                                    {prayer.is_anonymous
                                        ? "Anonymous Sister"
                                        : `${prayer.user?.first_name || "Sister"} ${prayer.user?.last_name?.[0] || ""}.`
                                    }
                                </span>
                                <button
                                    onClick={() => handlePray(prayer.id, prayer.pray_count)}
                                    className="text-[10px] bg-soft-blush/30 px-2 py-1 rounded-full text-warm-grey hover:bg-soft-blush transition-colors"
                                >
                                    Praying ({prayer.pray_count})
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
