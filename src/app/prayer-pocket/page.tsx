"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/Button";
import { Heart, Plus, X, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ShareModal } from "@/components/messaging/ShareModal";
import { PrayerPartnerWidget } from "@/components/prayer-pocket/PrayerPartnerWidget";

type Prayer = {
    id: string;
    content: string;
    is_anonymous: boolean;
    pray_count: number;
    created_at: string;
    profiles: {
        first_name: string;
        last_name: string;
        username: string; // fallback
    } | null;
    user_prayed?: boolean; // Virtual field for UI state
};

export default function PrayerPocket() {
    const [prayers, setPrayers] = useState<Prayer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [newPrayer, setNewPrayer] = useState("");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        fetchPrayers();
    }, []);

    const fetchPrayers = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        // Fetch prayers with profile info
        // We use the explicit foreign key name because there are multiple relationships
        const { data, error } = await supabase
            .from("prayers")
            .select(`
                *,
                profiles:prayers_user_id_fkey (first_name, last_name, username)
            `)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching prayers:", error);
        } else {
            // Check which ones the user has prayed for
            if (user && data) {
                const { data: interactions } = await supabase
                    .from("prayer_interactions")
                    .select("prayer_id")
                    .eq("user_id", user.id);

                const prayedIds = new Set(interactions?.map(i => i.prayer_id));
                const enriched = data.map(p => ({
                    ...p,
                    user_prayed: prayedIds.has(p.id)
                }));
                setPrayers(enriched);
            } else {
                setPrayers(data || []);
            }
        }
        setLoading(false);
    };

    const handlePray = async (prayerId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic update
        setPrayers(prev => prev.map(p => {
            if (p.id === prayerId) {
                return {
                    ...p,
                    pray_count: (p.pray_count || 0) + 1,
                    user_prayed: true
                };
            }
            return p;
        }));

        // DB Call
        const { error } = await supabase
            .from("prayer_interactions")
            .insert({ prayer_id: prayerId, user_id: user.id });

        if (!error) {
            await supabase.rpc("increment_prayer_count", { row_id: prayerId });

            // Award "Peace" Badge (Reply to a prayer request)
            // Description says "Reply to a prayer request" (singular). 
            // So we award it on the first one. RPC handles idempotency (only awards once).
            await supabase.rpc("award_badge", {
                p_user_id: user.id,
                p_badge_name: 'Peace'
            });
        }
    };

    const handleSubmit = async () => {
        if (!newPrayer.trim()) return;
        setSubmitting(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.error("User not found during submit");
            return;
        }

        console.log("Submitting prayer payload:", {
            user_id: user.id,
            content: newPrayer,
            is_anonymous: isAnonymous
        });

        const { error } = await supabase.from("prayers").insert({
            user_id: user.id,
            content: newPrayer,
            is_anonymous: isAnonymous
        });

        if (!error) {
            setNewPrayer("");
            setIsComposeOpen(false);
            fetchPrayers(); // Refresh
        } else {
            console.error("Error submitting prayer:", JSON.stringify(error, null, 2));
        }
        setSubmitting(false);
    };

    const [shareTarget, setShareTarget] = useState<Prayer | null>(null);

    return (
        <div className="min-h-screen bg-warm-paper">
            <Navbar />

            <main className="container mx-auto px-4 pt-24 pb-20 max-w-2xl">
                {/* Header */}
                <div className="text-center mb-10 animate-fade-in-up">
                    <div className="w-16 h-16 bg-soft-blush/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 text-muted-rose">
                        <Heart className="w-8 h-8 fill-current" />
                    </div>
                    <h1 className="font-serif text-4xl text-warm-grey mb-3">Prayer Pocket</h1>
                    <p className="text-warm-grey/60 max-w-md mx-auto">
                        "Carry each other’s burdens, and in this way you will fulfill the law of Christ." — Galatians 6:2
                    </p>
                </div>

                {/* Prayer Partner Widget */}
                <PrayerPartnerWidget />

                {/* Compose Button */}
                <button
                    onClick={() => setIsComposeOpen(true)}
                    className="w-full glass-card p-4 rounded-2xl mb-8 flex items-center gap-4 text-warm-grey/60 hover:text-warm-grey hover:bg-white/60 transition-all group"
                >
                    <div className="w-10 h-10 rounded-full bg-sage-green/20 flex items-center justify-center text-sage-green group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Submit a prayer request...</span>
                </button>

                {/* Modals */}
                {isComposeOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-grey/20 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl animate-fade-in-up">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-serif text-xl text-warm-grey">New Request</h3>
                                <button onClick={() => setIsComposeOpen(false)} className="text-warm-grey/40 hover:text-warm-grey">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <textarea
                                value={newPrayer}
                                onChange={(e) => setNewPrayer(e.target.value)}
                                placeholder="How can we pray for you today, sister?"
                                className="w-full h-32 p-4 rounded-xl bg-warm-paper/50 border-none focus:ring-1 focus:ring-sage-green resize-none mb-4 text-warm-grey placeholder:text-warm-grey/30"
                            />
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer text-sm text-warm-grey/70 select-none">
                                    <input
                                        type="checkbox"
                                        className="rounded border-warm-grey/30 text-sage-green focus:ring-sage-green"
                                        checked={isAnonymous}
                                        onChange={(e) => setIsAnonymous(e.target.checked)}
                                    />
                                    Post anonymously
                                </label>
                                <Button onClick={handleSubmit} disabled={submitting || !newPrayer.trim()}>
                                    {submitting ? "Sharing..." : "Share Request"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feed */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="text-center py-10 text-warm-grey/40">Gathering requests...</div>
                    ) : prayers.map((prayer) => (
                        <div key={prayer.id} className="glass-card p-6 rounded-3xl animate-fade-in-up">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-serif ${prayer.is_anonymous ? "bg-warm-grey/10 text-warm-grey/40" : "bg-soft-blush text-warm-cocoa"}`}>
                                        {prayer.is_anonymous ? "?" : (prayer.profiles?.first_name?.[0] || "S")}
                                    </div>
                                    <div>
                                        <p className="font-medium text-warm-grey text-sm">
                                            {prayer.is_anonymous ? "Anonymous Sister" : `${prayer.profiles?.first_name} ${prayer.profiles?.last_name?.[0] || ""}.`}
                                        </p>
                                        <p className="text-xs text-warm-grey/40">
                                            {formatDistanceToNow(new Date(prayer.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShareTarget(prayer)}
                                    className="p-2 rounded-full hover:bg-stone-100 text-warm-grey/40 hover:text-warm-grey transition-colors"
                                >
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>

                            <p className="font-serif text-lg text-warm-grey mb-6 leading-relaxed">
                                {prayer.content}
                            </p>

                            <button
                                onClick={() => !prayer.user_prayed && handlePray(prayer.id)}
                                disabled={prayer.user_prayed}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${prayer.user_prayed
                                    ? "bg-sage-green text-white cursor-default"
                                    : "bg-sage-green/10 text-sage-green hover:bg-sage-green hover:text-white"
                                    }`}
                            >
                                <Heart className={`w-4 h-4 ${prayer.user_prayed ? "fill-current" : ""}`} />
                                <span className="text-sm font-medium">
                                    {prayer.user_prayed ? "Prayed" : "I'm Praying"}
                                </span>
                            </button>

                            {(prayer.pray_count > 0 || prayer.user_prayed) && (
                                <span className="text-sm text-warm-grey/60 underline decoration-warm-grey/30">
                                    {prayer.pray_count || (prayer.user_prayed ? 1 : 0)} Praying
                                </span>
                            )}
                        </div>

                    ))}

                    {!loading && prayers.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-warm-grey/40 mb-4">No requests yet.</p>
                            <p className="font-serif text-xl text-warm-grey">Be the first to ask for prayer. 🤍</p>
                        </div>
                    )}
                </div>
            </main >

            {shareTarget && (
                <ShareModal
                    isOpen={!!shareTarget}
                    onClose={() => setShareTarget(null)}
                    content={{
                        type: 'post',
                        id: shareTarget.id,
                        title: "Prayer Request",
                        content: shareTarget.content
                    }}
                />
            )
            }
        </div >
    );
}
