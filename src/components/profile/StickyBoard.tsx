"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Lock } from "lucide-react";
import { format } from "date-fns";
import { AddStickyModal } from "./AddStickyModal";

interface Sticky {
    id: string;
    content: string;
    color: 'yellow' | 'pink' | 'blue' | 'green' | 'purple';
    is_private: boolean;
    created_at: string;
    author_id: string;
    author: {
        first_name: string;
        last_name: string;
    } | null;
}

interface StickyBoardProps {
    profileId: string;
    isOwner: boolean; // Is the viewer the owner of the profile?
    viewerId: string | null;
}

const COLORS = {
    yellow: "bg-yellow-100 text-yellow-900 rotate-1",
    pink: "bg-pink-100 text-pink-900 -rotate-1",
    blue: "bg-blue-100 text-blue-900 rotate-2",
    green: "bg-green-100 text-green-900 -rotate-2",
    purple: "bg-purple-100 text-purple-900 rotate-1",
};

export function StickyBoard({ profileId, isOwner, viewerId }: StickyBoardProps) {
    const [stickies, setStickies] = useState<Sticky[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchStickies = async () => {
        const { data, error } = await supabase
            .from('profile_stickies')
            .select('*, author:profiles(first_name, last_name)')
            .eq('profile_id', profileId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching stickies:', error);
        } else {
            console.log("Fetched stickies:", data); // Debug
            setStickies(data as any || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchStickies();

        // Realtime subscription
        const channel = supabase
            .channel('public:profile_stickies')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profile_stickies',
                    filter: `profile_id=eq.${profileId}`
                },
                () => {
                    fetchStickies();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profileId]);

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this sticky note?")) return;

        const { error } = await supabase.from('profile_stickies').delete().eq('id', id);
        if (error) {
            alert("Could not delete sticky.");
        }
        // UI updates via realtime, but optimizing optimistic update is fine too
        setStickies(prev => prev.filter(s => s.id !== id));
    };

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-2xl text-warm-cocoa flex items-center gap-2">
                    💌 Encouragement Board
                </h3>
                {viewerId && (
                    <AddStickyModal profileId={profileId} viewerId={viewerId} onAdded={fetchStickies} />
                )}
            </div>

            {loading ? (
                <div className="text-center py-10 text-warm-grey/50 animate-pulse">Loading stickies...</div>
            ) : stickies.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-warm-grey/10 rounded-xl">
                    <p className="text-warm-grey/60 italic">No notes yet. Be the first to leave one! ✨</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {stickies.map((sticky) => {
                        const isAuthor = viewerId === sticky.author_id;
                        // Only show delete if owner of profile or author of sticky (RLS enforces this, but UI should match)
                        const canDelete = isOwner || isAuthor;

                        return (
                            <div
                                key={sticky.id}
                                className={`relative p-4 rounded-sm shadow-sm transition-transform hover:scale-105 ${COLORS[sticky.color] || "bg-yellow-100"}`}
                            >
                                {/* Pin visual */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-300 shadow-sm opacity-80" />

                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold opacity-60 uppercase tracking-widest">
                                        {format(new Date(sticky.created_at), 'MMM d')}
                                    </span>
                                    <div className="flex gap-1">
                                        {sticky.is_private && <Lock className="w-3 h-3 opacity-50" />}
                                        {canDelete && (
                                            <button
                                                onClick={() => handleDelete(sticky.id)}
                                                className="opacity-20 hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <p className="font-handwriting text-sm leading-relaxed mb-4 font-medium">
                                    {sticky.content}
                                </p>

                                <p className="text-right text-xs opacity-60 font-bold">
                                    - {sticky.author?.first_name || "Sister"}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
