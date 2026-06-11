"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

type Highlight = {
    id: string;
    book: string;
    chapter: number;
    verse: number;
    text: string;
    color: string;
    created_at: string;
    user_id: string;
    profiles: {
        first_name: string;
        username?: string;
        avatar_url?: string;
    }
};

export function CommunityHighlights() {
    const [highlights, setHighlights] = useState<Highlight[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<'global' | 'friends'>('global');
    const supabase = createClient();

    const fetchHighlights = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase
            .from('bible_highlights')
            .select(`
                id, book, chapter, verse, text, color, created_at, user_id,
                profiles (first_name, username, avatar_url)
            `);

        if (filterType === 'friends') {
            // Fetch accepted friendships involving the current user
            const { data: friendships } = await supabase
                .from('friendships')
                .select('user_id_1, user_id_2')
                .eq('status', 'accepted')
                .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

            const friendIds = friendships 
                ? friendships.map((f: any) => f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1)
                : [];
            
            // Allow user to see their own highlights in circle
            const allowedIds = [...friendIds, user.id];
            query = query.in('user_id', allowedIds);
        }

        const { data, error } = await query
            .order('created_at', { ascending: false })
            .limit(5);

        if (data) {
            // @ts-ignore
            setHighlights(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchHighlights();

        // Realtime subscription
        const channel = supabase
            .channel('highlights_feed')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bible_highlights' }, () => {
                fetchHighlights();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); }
    }, [filterType]);

    if (loading) return <div className="h-48 bg-white/50 rounded-3xl animate-pulse" />;

    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-warm-grey/10">
            <div className="flex items-center justify-between mb-4 border-b border-warm-grey/5 pb-2">
                <div className="flex items-center gap-2 text-warm-cocoa">
                    <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-100" />
                    <h3 className="font-serif text-lg">Word Whispers</h3>
                </div>
                
                {/* Filter Toggle */}
                <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-full border border-warm-grey/5">
                    <button
                        onClick={() => setFilterType('global')}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                            filterType === 'global' 
                                ? 'bg-white shadow-sm text-warm-cocoa' 
                                : 'text-warm-grey/50 hover:text-warm-grey'
                        }`}
                    >
                        Global
                    </button>
                    <button
                        onClick={() => setFilterType('friends')}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                            filterType === 'friends' 
                                ? 'bg-white shadow-sm text-warm-cocoa' 
                                : 'text-warm-grey/50 hover:text-warm-grey'
                        }`}
                    >
                        Sisters
                    </button>
                </div>
            </div>

            {highlights.length === 0 ? (
                <div className="text-center py-8">
                    <div className="w-10 h-10 bg-soft-blush/20 rounded-full flex items-center justify-center mx-auto mb-2 text-warm-cocoa">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <p className="text-xs text-warm-grey/50 italic">No highlights in this circle yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {highlights.map((h) => (
                        <div key={h.id} className="group relative pl-4 border-l-2 border-warm-grey/10 hover:border-soft-blush transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-5 h-5 rounded-full bg-stone-100 overflow-hidden">
                                    {h.profiles?.avatar_url ? (
                                        <img src={h.profiles.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-warm-grey/40">
                                            {h.profiles?.first_name?.[0]}
                                        </div>
                                    )}
                                </div>
                                <span className="text-xs font-bold text-warm-grey">
                                    {h.profiles?.first_name || "A Sister"}
                                </span>
                                <span className="text-[10px] text-warm-grey/40">highlighted</span>
                            </div>

                            <Link
                                href={`/bible?book=${encodeURIComponent(h.book)}&chapter=${h.chapter}`}
                                className="block"
                            >
                                <p className="text-xs text-warm-grey/80 italic mb-1 line-clamp-2 hover:text-warm-cocoa transition-colors">"{h.text}"</p>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-soft-rose uppercase tracking-wider group-hover:underline">
                                    {h.book} {h.chapter}:{h.verse} <ArrowRight className="w-3 h-3" />
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
