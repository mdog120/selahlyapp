"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { Users, Crown, LogOut, Play, Loader2, ArrowLeft, Gamepad2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SistersSketch } from "@/components/minigames/multiplayer/sketch/SistersSketch";
import { EgyptianRatScrew } from "@/components/minigames/multiplayer/cards/EgyptianRatScrew";
import { ChristianCrazy8 } from "@/components/minigames/multiplayer/cards/ChristianCrazy8";
import { Wavelength } from "@/components/minigames/multiplayer/wavelength/Wavelength";

interface RoomMember {
    user_id: string;
    first_name: string;
    username: string;
    avatar_url: string;
    joined_at: string;
}

interface GameRoom {
    id: string;
    host_id: string;
    game_type: string;
    status: string;
    members: RoomMember[];
    max_players: number;
    created_at: string;
}

const GAME_INFO: Record<string, { emoji: string; name: string; description: string }> = {
    sisters_sketch: { emoji: "🎨", name: "Sisters Sketch", description: "Draw faith words and guess together in real-time" },
    wavelength: { emoji: "📡", name: "Wavelength", description: "Guess where Bible concepts fall on the spectrum" },
    card_rooms: { emoji: "🃏", name: "Egyptian Rat Screw", description: "Bible character card slap game" },
    crazy_8s: { emoji: "🎴", name: "Christian Crazy 8s", description: "Match virtues & Bible characters" },
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

export default function GameRoomPage() {
    const params = useParams();
    const router = useRouter();
    const supabase = createClient();
    const roomId = params.roomId as string;

    const [room, setRoom] = useState<GameRoom | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    // Fetch current user
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
            } else {
                router.push("/login");
            }
        };
        fetchUser();
    }, []);

    // Fetch room data + subscribe to realtime changes
    useEffect(() => {
        if (!currentUserId) return;

        const fetchRoom = async () => {
            const { data, error: fetchError } = await supabase
                .from("game_rooms")
                .select("*")
                .eq("id", roomId)
                .single();

            if (fetchError || !data) {
                setError("This room no longer exists.");
                setLoading(false);
                return;
            }

            setRoom(data as GameRoom);
            setLoading(false);
        };

        fetchRoom();

        // Subscribe to realtime changes on this specific room
        const channel = supabase
            .channel(`game_room:${roomId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "game_rooms",
                    filter: `id=eq.${roomId}`,
                },
                (payload) => {
                    if (payload.eventType === "DELETE") {
                        // Room was deleted (host left)
                        setRoom(null);
                        setError("The host closed this room.");
                    } else if (payload.eventType === "UPDATE") {
                        setRoom(payload.new as GameRoom);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId, roomId]);

    const isHost = room?.host_id === currentUserId;
    const isMember = room?.members?.some((m) => m.user_id === currentUserId) ?? false;
    const gameInfo = room ? GAME_INFO[room.game_type] || { emoji: "🎮", name: room.game_type, description: "" } : null;
    const memberCount = room?.members?.length ?? 0;

    // Leave room
    const handleLeave = useCallback(async () => {
        if (!room || !currentUserId) return;
        setIsLeaving(true);

        try {
            if (isHost) {
                // Host leaves → delete the room entirely
                await supabase.from("game_rooms").delete().eq("id", room.id);
            } else {
                // Member leaves → remove from members array
                const updatedMembers = room.members.filter((m) => m.user_id !== currentUserId);
                await supabase
                    .from("game_rooms")
                    .update({ members: updatedMembers })
                    .eq("id", room.id);
            }
            router.push("/minigames/multiplayer");
        } catch (err) {
            console.error("Error leaving room:", err);
            setIsLeaving(false);
        }
    }, [room, currentUserId, isHost]);

    // Kick a member (host only)
    const handleKick = useCallback(async (userId: string) => {
        if (!room || !isHost) return;
        const updatedMembers = room.members.filter((m) => m.user_id !== userId);
        await supabase
            .from("game_rooms")
            .update({ members: updatedMembers })
            .eq("id", room.id);
    }, [room, isHost]);

    // Start game (host only)
    const handleStartGame = useCallback(async () => {
        if (!room || !isHost) return;
        setIsStarting(true);
        await supabase
            .from("game_rooms")
            .update({ status: "playing" })
            .eq("id", room.id);
    }, [room, isHost]);

    // ─── RENDER ─────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-warm-paper pb-20 animate-fade-in">
                <Navbar />
                <div className="container mx-auto px-4 pt-24 max-w-2xl flex flex-col items-center justify-center gap-4 mt-20">
                    <div className="w-8 h-8 border-3 border-warm-grey/20 border-t-warm-cocoa rounded-full animate-spin" />
                    <p className="text-xs text-warm-grey/50 font-serif">Entering room...</p>
                </div>
            </div>
        );
    }

    if (error || !room) {
        return (
            <div className="min-h-screen bg-warm-paper pb-20 animate-fade-in">
                <Navbar />
                <div className="container mx-auto px-4 pt-24 max-w-2xl flex flex-col items-center justify-center gap-4 mt-20">
                    <span className="text-4xl">🚪</span>
                    <h2 className="font-serif text-xl text-warm-cocoa font-bold">{error || "Room not found"}</h2>
                    <p className="text-xs text-warm-grey/50 mb-4">This game room may have been closed by the host.</p>
                    <Link
                        href="/minigames/multiplayer"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-warm-cocoa text-white text-xs font-bold transition-all hover:bg-warm-cocoa/90 active:scale-95 shadow-lg shadow-warm-cocoa/20"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Lobby
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-warm-paper pb-20 animate-fade-in">
            <Navbar />

            <div className="container mx-auto px-4 pt-24 max-w-2xl">
                {/* Back Button */}
                <button
                    onClick={handleLeave}
                    disabled={isLeaving}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/60 hover:bg-white border border-stone-200/40 text-xs text-warm-cocoa font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-95 duration-200 cursor-pointer mb-6"
                >
                    {isLeaving ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <ArrowLeft className="w-3 h-3" />
                    )}
                    Leave Room
                </button>

                {/* Game Room Header */}
                <div className="bg-white/50 border border-warm-grey/5 rounded-3xl p-6 shadow-sm text-center relative overflow-hidden mb-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/10 rounded-bl-full pointer-events-none" />

                    {/* Status Badge */}
                    <div className="flex justify-center mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            room.status === "waiting"
                                ? "bg-amber-50 text-amber-800 border border-amber-200/50"
                                : room.status === "playing"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200/50"
                                : "bg-stone-100 text-stone-500 border border-stone-200/50"
                        }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                                room.status === "waiting" ? "bg-amber-500 animate-pulse" :
                                room.status === "playing" ? "bg-emerald-500 animate-pulse" :
                                "bg-stone-400"
                            }`} />
                            {room.status === "waiting" ? "Waiting for Players" : room.status === "playing" ? "Game in Progress" : "Finished"}
                        </span>
                    </div>

                    {/* Game Icon */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-50 to-stone-50 flex items-center justify-center text-4xl mx-auto mb-4 shadow-md border border-amber-100 relative">
                        <span className="relative z-10">{gameInfo?.emoji}</span>
                        <span className="absolute inset-0 rounded-full bg-amber-100/20 blur-md animate-pulse" />
                    </div>

                    <h1 className="font-serif text-2xl text-warm-cocoa font-bold mb-1">{gameInfo?.name}</h1>
                    <p className="text-[10px] text-warm-grey/50 italic mb-3">{gameInfo?.description}</p>

                    {/* Player Count */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-50 border border-stone-100 text-xs font-bold text-warm-cocoa">
                        <Users className="w-3.5 h-3.5" />
                        {memberCount} / {room.max_players} Players
                    </div>
                </div>

                {/* Members List */}
                <div className="bg-white/50 border border-warm-grey/5 rounded-3xl p-5 shadow-sm mb-6">
                    <h3 className="font-serif text-sm font-bold text-warm-cocoa mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-rose" />
                        Room Members
                    </h3>

                    <div className="flex flex-col gap-3">
                        <AnimatePresence mode="popLayout">
                            {room.members.map((member) => {
                                const memberIsHost = member.user_id === room.host_id;
                                const isCurrentUser = member.user_id === currentUserId;

                                return (
                                    <motion.div
                                        key={member.user_id}
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, x: -50, scale: 0.9 }}
                                        transition={{ type: "spring", damping: 20 }}
                                        className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-stone-100 shadow-sm"
                                    >
                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            {member.avatar_url ? (
                                                <img
                                                    src={member.avatar_url}
                                                    alt={member.first_name}
                                                    className="w-10 h-10 rounded-full object-cover border border-stone-200"
                                                />
                                            ) : (
                                                <div className={`w-10 h-10 rounded-full ${getAvatarBg(member.user_id)} flex items-center justify-center text-sm font-bold font-sans border shadow-inner`}>
                                                    {member.first_name?.[0]?.toUpperCase() || "S"}
                                                </div>
                                            )}
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <h5 className="text-xs font-bold text-warm-cocoa truncate">
                                                    {member.first_name}
                                                    {isCurrentUser && <span className="text-warm-grey/40 ml-1">(You)</span>}
                                                </h5>
                                                {memberIsHost && (
                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200/50 text-[8px] font-bold text-amber-800 uppercase tracking-wider">
                                                        <Crown className="w-2 h-2" /> Host
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[9px] text-warm-grey/40 truncate">@{member.username}</p>
                                        </div>

                                        {/* Kick Button (host only, can't kick self) */}
                                        {isHost && !isCurrentUser && room.status === "waiting" && (
                                            <button
                                                onClick={() => handleKick(member.user_id)}
                                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-[9px] font-bold text-rose-700 transition-all active:scale-95"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Empty Slots */}
                        {Array.from({ length: room.max_players - memberCount }).map((_, i) => (
                            <div
                                key={`empty-${i}`}
                                className="flex items-center gap-3 p-3 rounded-2xl border border-dashed border-stone-200/60 bg-white/30"
                            >
                                <div className="w-10 h-10 rounded-full bg-stone-100 border border-dashed border-stone-200/60 flex items-center justify-center">
                                    <span className="text-stone-300 text-sm">?</span>
                                </div>
                                <span className="text-[10px] text-warm-grey/30 italic">Waiting for a sister to join...</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 items-center">
                    {/* Host: Start Game button */}
                    {isHost && room.status === "waiting" && (
                        <button
                            onClick={handleStartGame}
                            disabled={memberCount < 2 || isStarting}
                            className={`w-full max-w-xs flex items-center justify-center gap-2 py-3.5 rounded-xl font-serif text-sm font-bold transition-all active:scale-95 shadow-lg ${
                                memberCount < 2
                                    ? "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none"
                                    : "bg-warm-cocoa text-white hover:bg-warm-cocoa/90 shadow-warm-cocoa/20"
                            }`}
                        >
                            {isStarting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4" />
                            )}
                            {memberCount < 2 ? "Need at least 2 players" : "Start Game"}
                        </button>
                    )}

                    {/* Playing state — Sisters Sketch */}
                    {room.status === "playing" && room.game_type === "sisters_sketch" && (
                        <SistersSketch
                            room={room}
                            currentUserId={currentUserId!}
                            isHost={isHost}
                            onGameEnd={() => {
                                supabase.from("game_rooms").update({ status: "waiting" }).eq("id", room.id);
                            }}
                        />
                    )}

                    {/* Playing state — Egyptian Rat Screw (Card Rooms) */}
                    {room.status === "playing" && room.game_type === "card_rooms" && (
                        <EgyptianRatScrew
                            room={room}
                            currentUserId={currentUserId!}
                            isHost={isHost}
                            onGameEnd={() => {
                                supabase.from("game_rooms").update({ status: "waiting" }).eq("id", room.id);
                            }}
                        />
                    )}

                    {/* Playing state — Christian Crazy 8s */}
                    {room.status === "playing" && room.game_type === "crazy_8s" && (
                        <ChristianCrazy8
                            room={room}
                            currentUserId={currentUserId!}
                            isHost={isHost}
                            onGameEnd={() => {
                                supabase.from("game_rooms").update({ status: "waiting" }).eq("id", room.id);
                            }}
                        />
                    )}

                    {/* Playing state — Wavelength */}
                    {room.status === "playing" && room.game_type === "wavelength" && (
                        <Wavelength
                            room={room}
                            currentUserId={currentUserId!}
                            isHost={isHost}
                            onGameEnd={() => {
                                supabase.from("game_rooms").update({ status: "waiting" }).eq("id", room.id);
                            }}
                        />
                    )}

                    {/* Playing state placeholder for unimplemented games */}
                    {room.status === "playing" && !["sisters_sketch", "card_rooms", "crazy_8s", "wavelength"].includes(room.game_type) && (
                        <div className="w-full bg-white/50 border border-warm-grey/5 rounded-3xl p-8 shadow-sm text-center">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-3xl mx-auto mb-4 border border-emerald-100">
                                <Gamepad2 className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="font-serif text-lg font-bold text-warm-cocoa mb-2">Game Starting!</h3>
                            <p className="text-xs text-warm-grey/50 max-w-xs mx-auto leading-relaxed">
                                {gameInfo?.name} is loading for all players. The full game experience is coming soon — stay tuned! 🌸
                            </p>
                            <div className="mt-4 flex items-center justify-center gap-1.5">
                                <div className="w-2 h-2 bg-warm-cocoa/30 rounded-full animate-bounce [animation-delay:0ms]" />
                                <div className="w-2 h-2 bg-warm-cocoa/30 rounded-full animate-bounce [animation-delay:150ms]" />
                                <div className="w-2 h-2 bg-warm-cocoa/30 rounded-full animate-bounce [animation-delay:300ms]" />
                            </div>
                        </div>
                    )}

                    {/* Leave Button */}
                    <button
                        onClick={handleLeave}
                        disabled={isLeaving}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-xs font-bold text-rose-700 transition-all active:scale-95"
                    >
                        {isLeaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <LogOut className="w-3.5 h-3.5" />
                        )}
                        {isHost ? "Close Room" : "Leave Room"}
                    </button>
                </div>
            </div>
        </div>
    );
}
