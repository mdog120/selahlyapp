"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Flame, Feather, Users, Heart, Sparkles, HandHeart, MessageCircle, Sun, Flower2, TreeDeciduous, Star, CloudSun, HeartHandshake, Lock, X, Award, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BowLogo } from "@/components/ui/BowLogo";

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
    const [selectedBadge, setSelectedBadge] = useState<{ badge: Badge; earned: UserBadge | null } | null>(null);
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

    const getIcon = (name: string, isBig = false) => {
        const size = isBig ? "w-12 h-12" : "w-8 h-8";
        const props = { className: `${size} drop-shadow-sm filter` };
        switch (name) {
            case 'Candle': return <Flame {...props} className={`${size} text-orange-400 fill-orange-400/20`} />;
            case 'Feather': return <Feather {...props} className={`${size} text-blue-400 fill-blue-400/20`} />;
            case 'Users': return <Users {...props} className={`${size} text-sage-green fill-sage-green/20`} />;
            case 'Heart': return <Heart {...props} className={`${size} text-muted-rose fill-muted-rose/20`} />;
            case 'Prayer Warrior': return <HandHeart {...props} className={`${size} text-blue-400 fill-blue-400/20`} />;
            case 'Encourager': return <MessageCircle {...props} className={`${size} text-purple-400 fill-purple-400/20`} />;
            case 'Sunshine': return <Sun {...props} className={`${size} text-yellow-500 fill-yellow-500/20`} />;
            case 'Bloom': return <Flower2 {...props} className={`${size} text-pink-400 fill-pink-400/20`} />;
            case 'Peace': return <CloudSun {...props} className={`${size} text-sky-400 fill-sky-400/20`} />;
            case 'Rooted': return <TreeDeciduous {...props} className={`${size} text-green-600 fill-green-600/20`} />;
            case 'Star': return <Star {...props} className={`${size} text-yellow-400 fill-yellow-400/20`} />;
            case 'Selah Circle': return <Users {...props} className={`${size} text-sage-green fill-sage-green/20`} />;
            case 'Social Butterfly': return <HeartHandshake {...props} className={`${size} text-blue-400 fill-blue-400/20`} />;
            default: return <Sparkles {...props} className={`${size} text-yellow-400 fill-yellow-400/20`} />;
        }
    };

    // Deterministic rotation for each sticker slot so they look hand-stuck!
    const getRotationAngle = (id: string) => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return (hash % 10) - 5; // -5 to +5 degrees
    };

    if (loading) return <div className="h-20 animate-pulse bg-stone-100/50 rounded-xl w-full" />;

    return (
        <div className="space-y-6">
            {/* Sticker Book Frame */}
            <div className="relative bg-[#FAF6EE] border-2 border-[#EADFCB] rounded-[2.5rem] p-6 sm:p-8 shadow-xl overflow-hidden min-h-[360px]">
                
                {/* Vintage Binder Rings decoration on top edge */}
                <div className="absolute top-0 inset-x-0 h-4 flex justify-around px-8 pointer-events-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="w-2.5 h-6 bg-gradient-to-b from-stone-400 via-stone-200 to-stone-500 rounded-full shadow-sm -translate-y-2 border border-stone-600/20" />
                    ))}
                </div>
                
                {/* Sketchbook grid paper pattern overlay */}
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(#8d7b68_1px,transparent_1px)] [background-size:16px_16px] mt-4" />

                <div className="flex justify-between items-center mb-6 relative pt-2">
                    <h3 className="font-serif text-2xl text-warm-cocoa flex items-center gap-2">
                        <span>🎀</span> Sticker Album
                    </h3>
                    <span className="text-[10px] bg-warm-cocoa/10 text-warm-cocoa border border-warm-cocoa/20 px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                        Collected: {earnedBadges.length} / {allBadges.length}
                    </span>
                </div>

                {/* Sticker Slots Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-6 relative">
                    {allBadges.map((badge) => {
                        const earned = earnedBadges.find(ub => ub.badge_id === badge.id);
                        const icon = getIcon(badge.icon_name);
                        const rotation = getRotationAngle(badge.id);

                        return (
                            <div key={badge.id} className="flex flex-col items-center">
                                <motion.div
                                    style={{ rotate: earned ? `${rotation}deg` : '0deg' }}
                                    whileHover={earned ? { scale: 1.15, rotate: rotation + (rotation > 0 ? 5 : -5) } : { scale: 1.05 }}
                                    onClick={() => setSelectedBadge({ badge, earned: earned || null })}
                                    className={`w-16 h-16 flex items-center justify-center text-3xl rounded-2xl transition-all duration-300 relative select-none
                                    ${earned
                                            ? "bg-white shadow-[0_4px_10px_rgba(0,0,0,0.08)] border-4 border-white cursor-pointer hover:shadow-[0_8px_16px_rgba(0,0,0,0.12)]"
                                            : "bg-stone-100/50 border-4 border-dashed border-stone-200 text-stone-300 cursor-pointer hover:border-stone-300"
                                        }`}
                                >
                                    {earned ? (
                                        <span className="drop-shadow-sticker filter">
                                            {icon}
                                        </span>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/[0.02] rounded-xl">
                                            <Lock className="w-4 h-4 text-stone-300/80" />
                                        </div>
                                    )}
                                </motion.div>

                                {/* Mini Label */}
                                <span className={`text-[9px] text-center mt-2 font-bold leading-tight max-w-[68px] truncate ${earned ? "text-warm-grey/85" : "text-stone-300"}`}>
                                    {badge.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sticker Detail Popover Modal */}
            <AnimatePresence>
                {selectedBadge && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-warm-cocoa/40 backdrop-blur-sm"
                            onClick={() => setSelectedBadge(null)}
                        />

                        {/* Modal Card */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl overflow-hidden border border-warm-grey/10 text-center"
                        >
                            {/* Top bow emoji deco */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2">
                                <BowLogo size={24} />
                            </div>

                            <button
                                onClick={() => setSelectedBadge(null)}
                                className="absolute top-4 right-4 p-1.5 text-warm-grey/40 hover:text-warm-grey hover:bg-stone-100 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex flex-col items-center mt-4">
                                {/* Sticker Circle display */}
                                <div className="mb-4 relative">
                                    <div className="absolute inset-0 bg-yellow-100 rounded-full blur-xl opacity-40 animate-pulse" />
                                    <div className="w-24 h-24 bg-white rounded-full shadow-md border-4 border-white flex items-center justify-center relative z-10 drop-shadow-sticker filter">
                                        {getIcon(selectedBadge.badge.icon_name, true)}
                                    </div>
                                    {!selectedBadge.earned && (
                                        <div className="absolute -top-1 -right-1 bg-amber-500 text-white p-1 rounded-full shadow-sm z-20">
                                            <Lock className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                </div>

                                <h3 className="font-serif text-2xl text-warm-cocoa mb-1">
                                    {selectedBadge.badge.name}
                                </h3>
                                <span className="text-[10px] bg-stone-100 text-warm-grey/60 px-3 py-0.5 rounded-full font-bold uppercase tracking-wider mb-4 border border-stone-200">
                                    Category: {selectedBadge.badge.category}
                                </span>

                                <div className="bg-stone-50 rounded-2xl p-4 w-full border border-stone-100/50 mb-5 text-left">
                                    <p className="text-xs text-warm-grey/40 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
                                        <Award className="w-3.5 h-3.5" /> Description
                                    </p>
                                    <p className="text-sm text-warm-grey/85 font-medium leading-relaxed mb-3">
                                        {selectedBadge.badge.description}
                                    </p>

                                    {selectedBadge.earned ? (
                                        <div className="border-t border-stone-200/50 pt-2 flex items-center gap-1 text-[10px] text-green-600 font-bold uppercase tracking-wider">
                                            <Calendar className="w-3 h-3 text-green-500" />
                                            Collected: {new Date(selectedBadge.earned.earned_at).toLocaleDateString()}
                                        </div>
                                    ) : (
                                        <div className="border-t border-stone-200/50 pt-2 text-[10px] text-amber-600 font-bold uppercase tracking-wider flex items-center gap-1">
                                            <span>✨</span> Hint: {selectedBadge.badge.description}
                                        </div>
                                    )}
                                </div>

                                {selectedBadge.earned ? (
                                    <p className="text-xs text-warm-grey/50 italic font-serif px-4">
                                        "You stuck this sticker in your journal of grace! We are so blessed by you, sister! ౨ৎ"
                                    </p>
                                ) : (
                                    <p className="text-xs text-warm-grey/50 italic font-serif px-4">
                                        "Keep engaging in prayer, journaling, and community to collect this sticker!"
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
