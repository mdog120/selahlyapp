"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Sparkles, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

type Profile = {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    created_at: string;
};

const isNewUser = (createdAtStr: string) => {
    if (!createdAtStr) return false;
    const createdAt = new Date(createdAtStr);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return createdAt > oneWeekAgo;
};

type SuggestedProfile = Profile & {
    mutual_count: number;
    status: 'none' | 'pending' | 'accepted';
};

export function SuggestedFriends() {
    const [suggestions, setSuggestions] = useState<SuggestedProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchSuggestions = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Get my friends (ids)
            const { data: friendships } = await supabase
                .from("friendships")
                .select("user_id_1, user_id_2")
                .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
                .eq("status", "accepted");

            const myFriendIds = new Set<string>();
            friendships?.forEach(f => {
                myFriendIds.add(f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1);
            });

            // 2. Get people I've already requested or rejected (to exclude)
            const { data: otherStatuses } = await supabase
                .from("friendships")
                .select("user_id_1, user_id_2")
                .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`);

            const excludedIds = new Set<string>([user.id]); // Exclude self
            otherStatuses?.forEach(f => {
                excludedIds.add(f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1);
            });

            // 3. Find friends of friends (Candidates)
            // We want friendships where ONE party is in myFriendIds AND the OTHER is NOT me and NOT already a friend/requested
            if (myFriendIds.size === 0) {
                // Cold start: Just fetch random users if no friends yet? 
                // For now, let's just fetch recent active users as a fallback
                const { data: randoms } = await supabase
                    .from("profiles")
                    .select("*")
                    .neq("id", user.id)
                    .limit(10);

                if (randoms) {
                    // Filter out excluded
                    const validRandoms = randoms.filter(p => !excludedIds.has(p.id)).map(p => ({
                        ...p,
                        mutual_count: 0,
                        status: 'none' as const
                    }));
                    setSuggestions(validRandoms);
                }
                setLoading(false);
                return;
            }

            // Fetch friendships involving my friends
            const { data: fofData } = await supabase
                .from("friendships")
                .select("user_id_1, user_id_2")
                .or(`user_id_1.in.(${Array.from(myFriendIds).join(',')}),user_id_2.in.(${Array.from(myFriendIds).join(',')})`)
                .eq("status", "accepted");

            const candidateCounts = new Map<string, number>();

            fofData?.forEach(f => {
                const p1 = f.user_id_1;
                const p2 = f.user_id_2;

                // If p1 is my friend, then p2 is the candidate (and vice versa)
                let candidateId = null;
                if (myFriendIds.has(p1) && !excludedIds.has(p2)) candidateId = p2;
                else if (myFriendIds.has(p2) && !excludedIds.has(p1)) candidateId = p1;

                if (candidateId) {
                    candidateCounts.set(candidateId, (candidateCounts.get(candidateId) || 0) + 1);
                }
            });

            // 4. Fetch Profiles for top candidates
            const topCandidateIds = Array.from(candidateCounts.entries())
                .sort((a, b) => b[1] - a[1]) // Sort by mutual count desc
                .slice(0, 10)
                .map(e => e[0]);

            if (topCandidateIds.length > 0) {
                const { data: profiles } = await supabase
                    .from("profiles")
                    .select("*")
                    .in("id", topCandidateIds);

                if (profiles) {
                    const finalSuggestions = profiles.map(p => ({
                        ...p,
                        mutual_count: candidateCounts.get(p.id) || 0,
                        status: 'none' as const
                    }));
                    setSuggestions(finalSuggestions);
                }
            } else {
                // Fallback if no mutuals found e.g. unconnected graph
                const { data: randoms } = await supabase
                    .from("profiles")
                    .select("*")
                    .not("id", "in", `(${Array.from(excludedIds).join(',')})`)
                    .limit(5);

                if (randoms) {
                    const validRandoms = randoms.map(p => ({
                        ...p,
                        mutual_count: 0,
                        status: 'none' as const
                    }));
                    setSuggestions(validRandoms);
                }
            }

            setLoading(false);
        };

        fetchSuggestions();
    }, []);

    const handleAddFriend = async (targetId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic update
        setSuggestions(prev => prev.map(p => p.id === targetId ? { ...p, status: 'pending' } : p));

        const { error } = await supabase.from("friendships").insert({
            user_id_1: user.id,
            user_id_2: targetId,
            status: 'pending'
        });

        if (error) {
            // Revert
            setSuggestions(prev => prev.map(p => p.id === targetId ? { ...p, status: 'none' } : p));
            alert("Could not send request.");
        }
    };

    if (loading) return (
        <div className="py-10 text-center text-warm-grey/40 animate-pulse flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-sm">Finding sisters...</p>
        </div>
    );

    if (suggestions.length === 0) return null;

    return (
        <div className="mb-12 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-6">
                <Sparkles className="w-5 h-5 text-muted-rose" />
                <h2 className="font-serif text-xl text-warm-cocoa">Suggested for You</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {suggestions.map(profile => (
                    <div key={profile.id} className="bg-white/80 p-4 rounded-2xl border border-white hover:shadow-md transition-all flex items-center justify-between group">
                        <Link href={`/profile/${profile.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-full bg-stone-200 overflow-hidden border-2 border-white shadow-sm">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="w-full h-full flex items-center justify-center text-warm-grey text-lg font-serif">
                                        {profile.first_name?.[0]}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-warm-grey truncate group-hover:text-warm-cocoa transition-colors">
                                    {profile.first_name} {profile.last_name}
                                </p>
                                {profile.mutual_count > 0 ? (
                                    <p className="text-xs text-muted-rose font-medium">
                                        {profile.mutual_count} mutual friend{profile.mutual_count !== 1 ? 's' : ''}
                                    </p>
                                ) : isNewUser(profile.created_at) ? (
                                    <p className="text-xs text-warm-grey/40">New to Selahly</p>
                                ) : (
                                    <p className="text-xs text-warm-grey/40">Selahly Sister</p>
                                )}
                            </div>
                        </Link>

                        <Button
                            size="sm"
                            onClick={() => handleAddFriend(profile.id)}
                            disabled={profile.status === 'pending'}
                            className={`rounded-full px-4 h-8 text-xs transition-all ${profile.status === 'pending'
                                    ? "bg-stone-100 text-warm-grey/40"
                                    : "bg-muted-rose/10 text-muted-rose hover:bg-muted-rose hover:text-white"
                                }`}
                        >
                            {profile.status === 'pending' ? "Sent" : "Add"}
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
