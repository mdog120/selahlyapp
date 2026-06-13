"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, MessageCircle, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

type Profile = {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    bio?: string;
    created_at: string;
};

export function SisterSpotlight() {
    const [spotlighted, setSpotlighted] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchSpotlight = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                
                // Fetch profiles
                const { data: profiles, error } = await supabase
                    .from("profiles")
                    .select("*");

                if (error || !profiles || profiles.length === 0) {
                    setLoading(false);
                    return;
                }

                // Filter out the current user
                const otherProfiles = user 
                    ? profiles.filter((p) => p.id !== user.id)
                    : profiles;

                if (otherProfiles.length === 0) {
                    setLoading(false);
                    return;
                }

                // Deterministically hash by date (YYYY-MM-DD)
                const todayStr = new Date().toISOString().split("T")[0];
                let dateHash = 0;
                for (let i = 0; i < todayStr.length; i++) {
                    dateHash = todayStr.charCodeAt(i) + ((dateHash << 5) - dateHash);
                }

                const index = Math.abs(dateHash) % otherProfiles.length;
                setSpotlighted(otherProfiles[index]);
            } catch (err) {
                console.error("Error setting spotlight sister:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSpotlight();
    }, []);

    if (loading) {
        return (
            <div className="bg-white/80 p-6 rounded-[2.5rem] border border-white/60 shadow-sm flex flex-col items-center justify-center min-h-[220px] text-center text-warm-grey/40 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-muted-rose/60 mb-2" />
                <p className="text-xs font-serif italic">Preparing today's spotlight...</p>
            </div>
        );
    }

    if (!spotlighted) return null;

    const formattedName = `${spotlighted.first_name} ${spotlighted.last_name || ""}`.trim();

    return (
        <div className="bg-gradient-to-br from-white/90 to-soft-blush/10 p-6 rounded-[2.5rem] border border-white/80 shadow-sm relative overflow-hidden group animate-fade-in-up">
            {/* Elegant bow branding in upper corner */}
            <div className="absolute -top-1 -right-2 text-[60px] text-muted-rose/5 select-none font-serif leading-none rotate-12 transition-transform group-hover:scale-105 duration-300">
                ౨ৎ
            </div>
            
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-full bg-soft-blush/40 text-muted-rose">
                    <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-rose font-sans">
                    Selah Sister Spotlight
                </span>
            </div>

            <div className="flex flex-col items-center text-center">
                <Link href={`/profile/${spotlighted.username}`} className="relative group/avatar cursor-pointer">
                    <div className="w-18 h-18 rounded-full overflow-hidden border-2 border-white shadow-md transition-all duration-300 group-hover/avatar:scale-105 group-hover/avatar:shadow-lg relative z-10">
                        {spotlighted.avatar_url ? (
                            <img src={spotlighted.avatar_url} alt={spotlighted.username} className="w-full h-full object-cover" />
                        ) : (
                            <span className="w-full h-full flex items-center justify-center text-warm-grey text-2xl font-serif bg-soft-blush/30">
                                {spotlighted.first_name?.[0]}
                            </span>
                        )}
                    </div>
                    {/* Tiny bow badge */}
                    <div className="absolute -bottom-1 -right-1 bg-white border border-soft-blush shadow-sm w-6 h-6 rounded-full flex items-center justify-center z-20">
                        <span className="text-[10px] text-muted-rose font-bold select-none">౨ৎ</span>
                    </div>
                </Link>

                <Link href={`/profile/${spotlighted.username}`} className="mt-3 block group/name hover:underline">
                    <h3 className="font-serif text-lg text-warm-cocoa font-bold group-hover/name:text-muted-rose transition-colors leading-snug">
                        {formattedName}
                    </h3>
                    <p className="text-xs text-warm-grey/50">@{spotlighted.username}</p>
                </Link>

                <p className="text-xs text-warm-grey/70 mt-3 leading-relaxed max-w-xs font-serif italic line-clamp-3 px-2">
                    {spotlighted.bio ? `"${spotlighted.bio}"` : "Growing in grace and seeking quiet moments of reflection."}
                </p>

                <div className="w-full h-px bg-warm-grey/10 my-4" />

                <Link href={`/messages/${spotlighted.id}`} className="w-full">
                    <Button 
                        size="sm"
                        className="w-full bg-muted-rose hover:bg-muted-rose/90 text-white rounded-full py-5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.02]"
                    >
                        <MessageCircle className="w-4 h-4" />
                        Send Encouragement ౨ৎ
                    </Button>
                </Link>
            </div>
        </div>
    );
}
