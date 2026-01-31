"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { VibeCard } from "./VibeCard";
import { AddVibe } from "./AddVibe";
import { Search } from "lucide-react";

type Vibe = {
    id: string;
    title: string;
    url: string;
    category: string;
    description: string;
    created_at: string;
    author: {
        username: string;
        first_name: string;
        last_name: string;
        avatar_url: string;
    };
};

export function VibeFeed() {
    const [vibes, setVibes] = useState<Vibe[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");

    const supabase = createClient();

    const fetchVibes = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("vibes")
            .select(`
                *,
                author:profiles!vibes_user_id_fkey (username, first_name, last_name, avatar_url)
            `)
            .order("created_at", { ascending: false });

        if (!error && data) {
            setVibes(data as any);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchVibes();
    }, []);

    const filteredVibes = filter === "All"
        ? vibes
        : vibes.filter(v => v.category === filter);

    const filters = ["All", "Music", "Podcast", "Video", "Influencer"];

    return (
        <div className="flex flex-col gap-8">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-center animate-fade-in-up delay-100 sticky top-20 z-30 bg-warm-paper/95 backdrop-blur-sm p-4 rounded-3xl border border-white/50 shadow-sm">
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
                    {filters.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap ${filter === f
                                    ? "bg-sage-green text-white shadow-md shadow-sage-green/20"
                                    : "bg-white text-warm-grey hover:bg-stone-50"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <AddVibe onVibeAdded={fetchVibes} />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up delay-200">
                {loading ? (
                    <div className="col-span-full text-center py-20 text-warm-grey/40 italic">Calibration valid vibes...</div>
                ) : filteredVibes.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-white/40 rounded-3xl border border-white/50">
                        <p className="text-warm-grey mb-2">No vibes here yet.</p>
                        <p className="text-sm text-warm-grey/60">Share your first favorite!</p>
                    </div>
                ) : (
                    filteredVibes.map(vibe => (
                        <VibeCard key={vibe.id} vibe={vibe} />
                    ))
                )}
            </div>
        </div>
    );
}
