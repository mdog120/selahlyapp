"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Users, ShieldAlert, Sparkles, Compass } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getFriendlyLocation } from "@/lib/location";

type OnlineSister = {
    user_id: string;
    first_name: string;
    username: string;
    avatar_url: string;
    location: string;
    online_at: string;
};

const getAvatarBg = (id: string) => {
    const colors = [
        "bg-pink-100 text-pink-700 border-pink-200/50",
        "bg-emerald-100 text-emerald-800 border-emerald-200/50",
        "bg-purple-100 text-purple-800 border-purple-200/50",
        "bg-amber-100 text-amber-800 border-amber-200/50",
        "bg-rose-100 text-rose-800 border-rose-200/50",
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash += id.charCodeAt(i);
    }
    return colors[hash % colors.length];
};

export default function MultiplayerGamesPage() {
    const supabase = createClient();
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
    const [onlineSisters, setOnlineSisters] = useState<OnlineSister[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase
                        .from("profiles")
                        .select("id, first_name, username, avatar_url")
                        .eq("id", user.id)
                        .single();
                    if (data) {
                        setCurrentUserProfile(data);
                    }
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (!currentUserProfile) return;

        // Subscribing to channel sisters_online when visiting the multiplayer lobby
        const channel = supabase.channel("sisters_online", {
            config: {
                presence: {
                    key: currentUserProfile.id,
                },
            },
        });

        const syncPresence = () => {
            const state = channel.presenceState();
            const sistersList: OnlineSister[] = [];

            Object.values(state).forEach((presences: any) => {
                if (presences && presences.length > 0) {
                    sistersList.push(presences[0] as OnlineSister);
                }
            });

            // Sort by active time (most recent first)
            sistersList.sort((a, b) => new Date(b.online_at).getTime() - new Date(a.online_at).getTime());
            setOnlineSisters(sistersList);
        };

        channel
            .on("presence", { event: "sync" }, syncPresence)
            .on("presence", { event: "join" }, () => syncPresence())
            .on("presence", { event: "leave" }, () => syncPresence())
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({
                        user_id: currentUserProfile.id,
                        first_name: currentUserProfile.first_name || "Sister",
                        username: currentUserProfile.username || "",
                        avatar_url: currentUserProfile.avatar_url || "",
                        location: "/minigames/multiplayer",
                        online_at: new Date().toISOString()
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserProfile]);

    const otherSisters = onlineSisters.filter(sister => sister.user_id !== currentUserProfile?.id);
    const currentUserPresence = onlineSisters.find(sister => sister.user_id === currentUserProfile?.id);

    return (
        <div className="min-h-screen bg-warm-paper pb-20 animate-fade-in">
            <Navbar />

            <div className="container mx-auto px-4 pt-24 max-w-4xl">
                <header className="mb-6 flex flex-col items-start gap-4">
                    <Link
                        href="/minigames"
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/60 hover:bg-white border border-stone-200/40 text-xs text-warm-cocoa font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-95 duration-200 cursor-pointer"
                    >
                        ← Back to Arcade
                    </Link>
                    
                    <div className="text-center w-full">
                        <h1 className="font-serif text-3xl text-warm-cocoa font-bold mb-1 flex items-center justify-center gap-2">
                            <span className="text-2xl">👥</span> Multiplayer Lobby <span className="text-2xl">👥</span>
                        </h1>
                        <p className="text-xs text-warm-grey/50 italic">
                            "Where two or three gather in my name..." — Matthew 18:20
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mt-8">
                    {/* Coming Soon Features Card (Left 8 Columns) */}
                    <div className="md:col-span-8 bg-white/50 border border-warm-grey/5 p-6 rounded-3xl shadow-sm flex flex-col gap-6 text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/10 rounded-bl-full pointer-events-none" />
                        
                        <div className="flex items-center gap-2 text-purple-700">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                            <h3 className="font-serif text-lg font-bold text-warm-cocoa">Real-time Connection</h3>
                        </div>

                        <p className="text-xs text-warm-grey/75 leading-relaxed">
                            We are currently designing and testing cozy co-op card games, table tennis, and collaborative drawing challenges for the Selahly community. Soon, you will be able to invite any online sister to play side-by-side!
                        </p>

                        <div className="border-t border-stone-200/40 pt-4 flex flex-col gap-3">
                            <div className="flex items-start gap-3">
                                <span className="text-lg shrink-0">🎓</span>
                                <div>
                                    <h5 className="text-xs font-bold text-warm-cocoa">Sisters Sketch (Pictionary)</h5>
                                    <p className="text-[10px] text-warm-grey/50">Draw faith words and guess with sisters in real-time chat.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-lg shrink-0">🏓</span>
                                <div>
                                    <h5 className="text-xs font-bold text-warm-cocoa">Selah Table Tennis</h5>
                                    <p className="text-[10px] text-warm-grey/50">Cozy paddle bounce duels with visualizer audio tracks.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-lg shrink-0">🃏</span>
                                <div>
                                    <h5 className="text-xs font-bold text-warm-cocoa">Cozy Card Rooms</h5>
                                    <p className="text-[10px] text-warm-grey/50">Play card games like Egyptian Ratscrew or Crazy Eights together.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-rose-50 border border-rose-100/50 p-4 rounded-2xl flex items-center gap-3 mt-2">
                            <ShieldAlert className="w-5 h-5 text-muted-rose shrink-0" />
                            <span className="text-[10px] font-semibold text-muted-rose leading-relaxed">
                                Note: Real-time matches are under construction to guarantee maximum security, stability, and clean channel connections. Stay tuned!
                            </span>
                        </div>
                    </div>

                    {/* Sisters Online Card (Right 4 Columns) */}
                    <div className="md:col-span-4 flex flex-col gap-6">
                        {/* Current User Status */}
                        {currentUserProfile && (
                            <div className="bg-white/50 border border-warm-grey/5 p-4 rounded-3xl shadow-sm text-left flex flex-col gap-3">
                                <h4 className="text-[10px] font-bold tracking-wider text-warm-grey/40 uppercase">Your Status</h4>
                                <div className="flex items-center gap-3 p-2 rounded-2xl bg-white border border-stone-100 shadow-sm">
                                    <div className="relative">
                                        {currentUserProfile.avatar_url ? (
                                            <img
                                                src={currentUserProfile.avatar_url}
                                                alt={currentUserProfile.first_name}
                                                className="w-10 h-10 rounded-full object-cover border border-stone-200"
                                            />
                                        ) : (
                                            <div className={`w-10 h-10 rounded-full ${getAvatarBg(currentUserProfile.id)} flex items-center justify-center text-sm font-bold font-sans border shadow-inner`}>
                                                {currentUserProfile.first_name?.[0]?.toUpperCase() || "S"}
                                            </div>
                                        )}
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-xs font-bold text-warm-cocoa truncate">
                                            {currentUserProfile.first_name}
                                        </h5>
                                        <p className="text-[9px] text-warm-grey/40 truncate">
                                            @{currentUserProfile.username}
                                        </p>
                                        <p className="text-[9px] text-purple-700 font-medium mt-0.5 flex items-center gap-1">
                                            <Compass className="w-2.5 h-2.5" />
                                            {getFriendlyLocation(currentUserPresence?.location || "/minigames/multiplayer")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Other Sisters Online */}
                        <div className="bg-white/50 border border-warm-grey/5 p-5 rounded-3xl shadow-sm flex flex-col gap-4 text-left">
                            <h3 className="font-serif text-sm font-bold text-warm-cocoa border-b border-warm-grey/5 pb-2 flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-rose" /> Sisters in Lobby
                            </h3>

                            {loading ? (
                                <div className="flex flex-col gap-3 py-4 items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-warm-grey/20 border-t-warm-grey/80 rounded-full animate-spin" />
                                    <p className="text-[10px] text-warm-grey/50">Knocking on lobby door...</p>
                                </div>
                            ) : otherSisters.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 px-4 text-center bg-white/40 border border-dashed border-stone-200/60 rounded-2xl">
                                    <span className="text-xl mb-1">🕊️</span>
                                    <p className="text-[10px] leading-relaxed text-warm-grey/60 italic">
                                        No other sisters in the lobby right now. A quiet, peaceful moment. 🤍
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                                    {otherSisters.map((sister, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-stone-100 shadow-sm transition-all hover:scale-[1.01]">
                                            <div className="relative">
                                                {sister.avatar_url ? (
                                                    <img
                                                        src={sister.avatar_url}
                                                        alt={sister.first_name}
                                                        className="w-8 h-8 rounded-full object-cover border border-stone-200"
                                                    />
                                                ) : (
                                                    <div className={`w-8 h-8 rounded-full ${getAvatarBg(sister.user_id)} flex items-center justify-center text-xs font-bold font-sans border shadow-inner`}>
                                                        {sister.first_name?.[0]?.toUpperCase() || "S"}
                                                    </div>
                                                )}
                                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="text-[11px] font-bold text-warm-cocoa truncate">{sister.first_name}</h5>
                                                <p className="text-[9px] text-warm-grey/40 truncate">@{sister.username}</p>
                                                <p className="text-[9px] text-emerald-800 font-medium mt-0.5">{getFriendlyLocation(sister.location)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="text-[9px] text-warm-grey/40 text-center italic mt-1 border-t border-warm-grey/5 pt-2 flex items-center justify-center gap-1">
                                ⚡ Active Lobby Tracker
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
