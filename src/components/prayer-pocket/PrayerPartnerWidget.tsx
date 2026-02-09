"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sparkles, MessageCircle, UserPlus, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

type PrayerPartner = {
    partner_id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    prayer_content: string;
    similarity_score: number;
};

export function PrayerPartnerWidget() {
    const [partners, setPartners] = useState<PrayerPartner[]>([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const [hasPrayer, setHasPrayer] = useState<boolean | null>(null);

    const findPartners = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            setLoading(false);
            return;
        }

        // Check if user has posted a prayer
        const { count } = await supabase
            .from('prayers')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (!count || count === 0) {
            setHasPrayer(false);
            setSearched(true);
            setLoading(false);
            return;
        }

        setHasPrayer(true);
        const { data, error } = await supabase.rpc('match_prayer_partners');

        if (error) {
            console.error("Error finding partners:", error);
        } else {
            setPartners(data || []);
        }
        setSearched(true);
        setLoading(false);
    };

    const handleMessage = (userId: string) => {
        router.push(`/messages/${userId}`);
    };

    if (!searched) {
        return (
            <div className="glass-card p-6 rounded-3xl border border-white/60 bg-gradient-to-br from-purple-50/40 to-white/40 mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-serif text-lg text-warm-grey">Find a Prayer Partner</h3>
                        <p className="text-xs text-warm-grey/60">Connect with someone praying for similar things.</p>
                    </div>
                </div>
                <Button
                    onClick={findPartners}
                    className="w-full bg-purple-400 hover:bg-purple-500 text-white shadow-lg shadow-purple-200/50"
                    disabled={loading}
                >
                    {loading ? "Searching..." : "Find My Match ✨"}
                </Button>
            </div>
        );
    }

    if (hasPrayer === false) {
        return (
            <div className="glass-card p-6 rounded-3xl border border-white/60 bg-white/40 mb-8 text-center animate-fade-in">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif text-lg text-warm-grey">Prayer Partners</h3>
                    <button onClick={() => setSearched(false)} className="text-warm-grey/40 hover:text-warm-grey">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-sm text-warm-grey/60 mb-4">
                    You haven't posted a prayer request yet! Share your heart above so we can match you with a sister praying for similar things. 🤍
                </p>
                <Button
                    onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    variant="outline"
                    className="w-full text-xs"
                >
                    Write a Prayer
                </Button>
            </div>
        );
    }

    if (partners.length === 0) {
        return (
            <div className="glass-card p-6 rounded-3xl border border-white/60 bg-white/40 mb-8 text-center">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-serif text-lg text-warm-grey">Prayer Partners</h3>
                    <button onClick={findPartners} className="text-warm-grey/40 hover:text-warm-grey">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-sm text-warm-grey/60 mb-4">
                    We couldn't find a close match right now. Keep praying and check back later! 🤍
                </p>
            </div>
        );
    }

    return (
        <div className="glass-card p-6 rounded-3xl border border-white/60 bg-white/60 mb-8 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-serif text-lg text-warm-grey flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    Your Matches
                </h3>
                <button onClick={findPartners} title="Refresh matches" className="text-warm-grey/40 hover:text-warm-grey">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-4">
                {partners.map((partner) => (
                    <div key={partner.partner_id} className="bg-white/50 p-4 rounded-2xl border border-white/60">
                        <div className="flex items-start gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-soft-blush flex items-center justify-center text-warm-cocoa text-sm font-serif">
                                {partner.avatar_url ? (
                                    <Image
                                        src={partner.avatar_url}
                                        alt={partner.first_name}
                                        width={40}
                                        height={40}
                                        className="rounded-full object-cover"
                                    />
                                ) : (
                                    partner.first_name[0]
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-warm-grey text-sm">
                                    {partner.first_name} {partner.last_name?.[0]}.
                                </p>
                                <p className="text-[10px] text-purple-400 uppercase tracking-wider font-bold">
                                    {Math.round(partner.similarity_score * 100)}% Match
                                </p>
                            </div>
                        </div>

                        <p className="text-xs text-warm-grey/70 italic mb-4 line-clamp-2">
                            "{partner.prayer_content}"
                        </p>

                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs h-8 border-purple-200 text-purple-600 hover:bg-purple-50"
                            onClick={() => handleMessage(partner.partner_id)}
                        >
                            <MessageCircle className="w-3 h-3 mr-2" />
                            Message
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
