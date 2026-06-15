"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Users, Sparkles, Compass, Plus, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getFriendlyLocation } from "@/lib/location";
import { GameRoomCard } from "@/components/minigames/multiplayer/GameRoomCard";
import { CreateRoomModal } from "@/components/minigames/multiplayer/CreateRoomModal";
import { InviteToast } from "@/components/minigames/multiplayer/InviteToast";

type OnlineSister = {
    user_id: string;
    first_name: string;
    username: string;
    avatar_url: string;
    location: string;
    online_at: string;
};

interface GameRoom {
    id: string;
    host_id: string;
    game_type: string;
    status: string;
    members: Array<{ user_id: string; first_name: string; username: string; avatar_url: string; joined_at: string }>;
    max_players: number;
    created_at: string;
}

interface GameInvite {
    room_id: string;
    host_name: string;
    host_avatar_url: string;
    game_type: string;
}

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
    const router = useRouter();
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
    const [onlineSisters, setOnlineSisters] = useState<OnlineSister[]>([]);
    const [loading, setLoading] = useState(true);

    // Game Rooms
    const [gameRooms, setGameRooms] = useState<GameRoom[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCreatingRoom, setIsCreatingRoom] = useState(false);
    const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

    // Invite Toast
    const [pendingInvite, setPendingInvite] = useState<GameInvite | null>(null);

    // ─── Fetch current user ─────────────────────────────────
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

    // ─── Presence tracking (sisters_online) ─────────────────
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
            // Listen for game invite broadcasts
            .on("broadcast", { event: "game_invite" }, (payload) => {
                const invite = payload.payload as GameInvite & { target_user_id: string };
                if (invite.target_user_id === currentUserProfile.id) {
                    setPendingInvite({
                        room_id: invite.room_id,
                        host_name: invite.host_name,
                        host_avatar_url: invite.host_avatar_url,
                        game_type: invite.game_type,
                    });
                }
            })
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

    // ─── Fetch game rooms + realtime subscription ───────────
    useEffect(() => {
        // Fetch existing waiting rooms
        const fetchRooms = async () => {
            const { data } = await supabase
                .from("game_rooms")
                .select("*")
                .in("status", ["waiting", "playing"])
                .order("created_at", { ascending: false });

            if (data) {
                setGameRooms(data as GameRoom[]);
            }
        };

        fetchRooms();

        // Subscribe to game_rooms changes
        const channel = supabase
            .channel("lobby_game_rooms")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "game_rooms",
                },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        setGameRooms((prev) => [payload.new as GameRoom, ...prev]);
                    } else if (payload.eventType === "UPDATE") {
                        setGameRooms((prev) =>
                            prev.map((r) => (r.id === (payload.new as GameRoom).id ? (payload.new as GameRoom) : r))
                        );
                    } else if (payload.eventType === "DELETE") {
                        setGameRooms((prev) => prev.filter((r) => r.id !== (payload.old as any).id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // ─── Create a room ──────────────────────────────────────
    const handleCreateRoom = useCallback(async (gameType: string, invitedUserIds: string[]) => {
        if (!currentUserProfile) return;
        setIsCreatingRoom(true);

        try {
            const hostMember = {
                user_id: currentUserProfile.id,
                first_name: currentUserProfile.first_name || "Sister",
                username: currentUserProfile.username || "",
                avatar_url: currentUserProfile.avatar_url || "",
                joined_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from("game_rooms")
                .insert({
                    host_id: currentUserProfile.id,
                    game_type: gameType,
                    status: "waiting",
                    members: [hostMember],
                    max_players: 5,
                })
                .select()
                .single();

            if (error) {
                console.error("Error creating room:", error);
                setIsCreatingRoom(false);
                return;
            }

            // Send broadcast invites to each invited user
            if (invitedUserIds.length > 0 && data) {
                const channel = supabase.channel("sisters_online");
                for (const userId of invitedUserIds) {
                    await channel.send({
                        type: "broadcast",
                        event: "game_invite",
                        payload: {
                            target_user_id: userId,
                            room_id: data.id,
                            host_name: currentUserProfile.first_name || "A sister",
                            host_avatar_url: currentUserProfile.avatar_url || "",
                            game_type: gameType,
                        },
                    });
                }
            }

            setShowCreateModal(false);
            setIsCreatingRoom(false);

            // Navigate to the room
            if (data) {
                router.push(`/minigames/multiplayer/room/${data.id}`);
            }
        } catch (err) {
            console.error("Error creating room:", err);
            setIsCreatingRoom(false);
        }
    }, [currentUserProfile, router]);

    // ─── Join a room ────────────────────────────────────────
    const handleJoinRoom = useCallback(async (roomId: string) => {
        if (!currentUserProfile) return;
        setJoiningRoomId(roomId);

        try {
            // Fetch latest room data
            const { data: room } = await supabase
                .from("game_rooms")
                .select("*")
                .eq("id", roomId)
                .single();

            if (!room) {
                setJoiningRoomId(null);
                return;
            }

            const members = (room.members || []) as GameRoom["members"];

            // Check if already a member
            if (members.some((m) => m.user_id === currentUserProfile.id)) {
                router.push(`/minigames/multiplayer/room/${roomId}`);
                setJoiningRoomId(null);
                return;
            }

            // Check if room is full
            if (members.length >= room.max_players) {
                setJoiningRoomId(null);
                return;
            }

            // Add self to members
            const updatedMembers = [
                ...members,
                {
                    user_id: currentUserProfile.id,
                    first_name: currentUserProfile.first_name || "Sister",
                    username: currentUserProfile.username || "",
                    avatar_url: currentUserProfile.avatar_url || "",
                    joined_at: new Date().toISOString(),
                },
            ];

            await supabase
                .from("game_rooms")
                .update({ members: updatedMembers })
                .eq("id", roomId);

            router.push(`/minigames/multiplayer/room/${roomId}`);
        } catch (err) {
            console.error("Error joining room:", err);
        } finally {
            setJoiningRoomId(null);
        }
    }, [currentUserProfile, router]);

    // ─── Accept invite ──────────────────────────────────────
    const handleAcceptInvite = useCallback((roomId: string) => {
        setPendingInvite(null);
        handleJoinRoom(roomId);
    }, [handleJoinRoom]);

    const handleDeclineInvite = useCallback(() => {
        setPendingInvite(null);
    }, []);

    // ─── Derived state ──────────────────────────────────────
    const otherSisters = onlineSisters.filter(sister => sister.user_id !== currentUserProfile?.id);
    const currentUserPresence = onlineSisters.find(sister => sister.user_id === currentUserProfile?.id);
    const waitingRooms = gameRooms.filter((r) => r.status === "waiting");

    return (
        <div className="min-h-screen bg-warm-paper pb-20 animate-fade-in">
            <Navbar />

            {/* Invite Toast */}
            <InviteToast
                invite={pendingInvite}
                onAccept={handleAcceptInvite}
                onDecline={handleDeclineInvite}
            />

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
                    {/* LEFT: Game Rooms */}
                    <div className="md:col-span-8 flex flex-col gap-6">
                        {/* Create Room Button */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="w-full group flex items-center justify-center gap-2 py-4 rounded-3xl bg-gradient-to-r from-warm-cocoa to-warm-cocoa/90 text-white font-serif text-sm font-bold transition-all hover:shadow-lg hover:shadow-warm-cocoa/20 active:scale-[0.98] duration-200 relative overflow-hidden"
                        >
                            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            <Plus className="w-4 h-4" />
                            Create a Game Room
                        </button>

                        {/* Active Rooms List */}
                        <div className="bg-white/50 border border-warm-grey/5 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-serif text-sm font-bold text-warm-cocoa flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    Open Game Rooms
                                </h3>
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/30">
                                    {waitingRooms.length} {waitingRooms.length === 1 ? "room" : "rooms"}
                                </span>
                            </div>

                            {waitingRooms.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-white/40 border border-dashed border-stone-200/60 rounded-2xl">
                                    <span className="text-3xl mb-2">🏠</span>
                                    <h5 className="text-xs font-bold text-warm-cocoa/70 font-serif mb-1">No rooms open yet</h5>
                                    <p className="text-[10px] leading-relaxed text-warm-grey/50 italic max-w-xs">
                                        Be the first to create a game room and invite your sisters to play together! 🌸
                                    </p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {waitingRooms.map((room) => (
                                        <GameRoomCard
                                            key={room.id}
                                            room={room}
                                            currentUserId={currentUserProfile?.id || ""}
                                            onJoin={handleJoinRoom}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT: Sisters Online */}
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

            {/* Create Room Modal */}
            <CreateRoomModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreateRoom={handleCreateRoom}
                onlineSisters={otherSisters}
                isCreating={isCreatingRoom}
            />
        </div>
    );
}
