"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Trash2, Lock } from "lucide-react";
import { format } from "date-fns";
import { AddStickyModal } from "@/components/profile/AddStickyModal";
import { motion } from "framer-motion";

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
    yellow: "text-yellow-900 border border-yellow-200/50 shadow-sm",
    pink: "text-pink-900 border border-pink-200/50 shadow-sm",
    blue: "text-blue-900 border border-blue-200/50 shadow-sm",
    green: "text-green-900 border border-green-200/50 shadow-sm",
    purple: "text-purple-900 border border-purple-200/50 shadow-sm",
};

const WASHI_TAPES = {
    yellow: "bg-yellow-200/50 border-x border-yellow-300/40 text-yellow-800/30 font-bold",
    pink: "bg-pink-200/50 border-x border-pink-300/40 text-pink-800/35",
    blue: "bg-blue-200/50 border-x border-blue-300/40 text-blue-800/30",
    green: "bg-green-200/50 border-x border-green-300/40 text-green-800/30",
    purple: "bg-purple-200/50 border-x border-purple-300/40 text-purple-800/30",
};

const PAPER_PATTERNS = {
    yellow: {
        backgroundColor: "#fefce8",
        backgroundImage: "radial-gradient(#eab308 0.5px, transparent 0.5px), radial-gradient(#eab308 0.5px, #fefce8 0.5px)",
        backgroundSize: "8px 8px",
        backgroundPosition: "0 0, 4px 4px",
    },
    pink: {
        backgroundColor: "#fdf2f2",
        // Notebook lined paper
        backgroundImage: "linear-gradient(rgba(244, 63, 94, 0.08) 1px, transparent 1px)",
        backgroundSize: "100% 1.25rem",
    },
    blue: {
        backgroundColor: "#eff6ff",
        // Dot grid
        backgroundImage: "radial-gradient(rgba(59, 130, 246, 0.08) 1.5px, transparent 1.5px)",
        backgroundSize: "10px 10px",
    },
    green: {
        backgroundColor: "#f0fdf4",
        // Sage Linen grid
        backgroundImage: "linear-gradient(90deg, rgba(34, 197, 94, 0.04) 1px, transparent 1px), linear-gradient(rgba(34, 197, 94, 0.04) 1px, transparent 1px)",
        backgroundSize: "4px 4px",
    },
    purple: {
        backgroundColor: "#faf5ff",
        // Lavender double border trim
        border: "3px double rgba(168, 85, 247, 0.25)",
    }
};

export function StickyBoard({ profileId, isOwner, viewerId }: StickyBoardProps) {
    const [stickies, setStickies] = useState<Sticky[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchStickies = async () => {
        // Use !author_id to specify which FK to use for the join (resolves ambiguity)
        const { data, error } = await supabase
            .from('profile_stickies')
            .select('*, author:profiles!author_id(first_name, last_name)')
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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-2">
                    {stickies.map((sticky, idx) => {
                        const isAuthor = viewerId === sticky.author_id;
                        const canDelete = isOwner || isAuthor;
                        
                        // Alternate base tilt angles for an organic board feel
                        const baseRotation = idx % 3 === 0 ? "rotate-1" : idx % 3 === 1 ? "-rotate-1" : "rotate-0.5";

                        return (
                            <motion.div
                                key={sticky.id}
                                whileHover={{ 
                                    scale: 1.04, 
                                    rotate: idx % 2 === 0 ? -0.5 : 0.5,
                                    y: -3 
                                }}
                                transition={{ type: "spring", stiffness: 350, damping: 15 }}
                                className={`relative p-4 rounded-sm cursor-default transition-shadow hover:shadow-md ${baseRotation} ${COLORS[sticky.color] || "bg-yellow-50 text-yellow-900"}`}
                                style={PAPER_PATTERNS[sticky.color]}
                            >
                                {/* Washi Tape Strip */}
                                <div 
                                    className={`absolute -top-3 left-1/2 -translate-x-1/2 w-14 h-4 shadow-[0_1px_2px_rgba(0,0,0,0.05)] opacity-85 backdrop-blur-[0.5px] border-x border-stone-200/20 flex items-center justify-center text-[7px] font-sans tracking-widest select-none overflow-hidden ${WASHI_TAPES[sticky.color] || "bg-white/40"}`}
                                    style={{
                                        transform: `rotate(${idx % 2 === 0 ? '-2deg' : '2deg'})`,
                                        backgroundImage: sticky.color === 'yellow' 
                                            ? 'repeating-linear-gradient(45deg, rgba(141,123,104,0.06) 0px, rgba(141,123,104,0.06) 2px, transparent 2px, transparent 4px)' 
                                            : sticky.color === 'pink'
                                            ? 'repeating-linear-gradient(90deg, rgba(212,165,165,0.08) 0px, rgba(212,165,165,0.08) 3px, transparent 3px, transparent 6px)'
                                            : sticky.color === 'blue'
                                            ? 'radial-gradient(rgba(59,130,246,0.12) 1.2px, transparent 1.2px)'
                                            : sticky.color === 'green'
                                            ? 'repeating-linear-gradient(-45deg, rgba(143,151,121,0.08) 0px, rgba(143,151,121,0.08) 1.5px, transparent 1.5px, transparent 3px)'
                                            : 'radial-gradient(rgba(168,85,247,0.1) 1.2px, transparent 1.2px)',
                                        backgroundSize: sticky.color === 'blue' || sticky.color === 'purple' ? '5px 5px' : 'auto'
                                    }}
                                >
                                    {sticky.color === 'pink' && "౨ৎ"}
                                    {sticky.color === 'yellow' && "SELAH"}
                                    {sticky.color === 'blue' && "✨"}
                                    {sticky.color === 'green' && "🌿"}
                                    {sticky.color === 'purple' && "🌸"}
                                </div>

                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest font-sans">
                                        {format(new Date(sticky.created_at), 'MMM d')}
                                    </span>
                                    <div className="flex gap-1">
                                        {sticky.is_private && <Lock className="w-3 h-3 opacity-50 text-warm-grey" />}
                                        {canDelete && (
                                            <button
                                                onClick={() => handleDelete(sticky.id)}
                                                className="opacity-20 hover:opacity-100 transition-opacity text-warm-grey"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <p className="font-handwriting text-base leading-relaxed mb-4 font-medium relative z-10 text-warm-grey">
                                    {sticky.content}
                                </p>

                                <p className="text-right text-xs opacity-60 font-bold relative z-10 font-sans text-warm-grey">
                                    - {sticky.author?.first_name || "Sister"}
                                </p>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
