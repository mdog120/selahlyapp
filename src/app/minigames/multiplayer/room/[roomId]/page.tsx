"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { Users, Crown, LogOut, Play, Loader2, ArrowLeft, Gamepad2, Shuffle, MessageCircle, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SistersSketch } from "@/components/minigames/multiplayer/sketch/SistersSketch";
import { EgyptianRatScrew } from "@/components/minigames/multiplayer/cards/EgyptianRatScrew";
import { ChristianCrazy8 } from "@/components/minigames/multiplayer/cards/ChristianCrazy8";
import { Wavelength } from "@/components/minigames/multiplayer/wavelength/Wavelength";
import { Spyfall } from "@/components/minigames/multiplayer/spyfall/Spyfall";
import { BibleMonopoly } from "@/components/minigames/multiplayer/monopoly/BibleMonopoly";

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
    spyfall: { emoji: "🕵️", name: "Bible Spyfall", description: "Find the spy among the Bible characters" },
    bible_monopoly: { emoji: "🎲", name: "Bible Monopoly Lite", description: "Buy Bible lands and collect rent" },
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
    const [showGamePicker, setShowGamePicker] = useState(false);

    // Chat state
    type ChatMessage = { id: string; userId: string; name: string; avatarUrl: string; text: string; timestamp: number };
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const joinedDuringGame = useRef(false);

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
            // If the room is already playing when we join, mark as spectator
            if (data.status === "playing") {
                joinedDuringGame.current = true;
            }
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
                        const updated = payload.new as GameRoom;
                        // If game just ended (went back to waiting), clear spectator flag
                        if (updated.status === "waiting") {
                            joinedDuringGame.current = false;
                        }
                        // Check if current user was kicked
                        const stillMember = updated.members?.some((m: any) => m.user_id === currentUserId);
                        if (!stillMember && currentUserId) {
                            // User was removed from the room
                            router.push("/minigames/multiplayer");
                            return;
                        }
                        setRoom(updated);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUserId, roomId]);

    // Chat broadcast channel
    useEffect(() => {
        if (!currentUserId || !roomId) return;

        const chatChannel = supabase.channel(`room_chat:${roomId}`);
        chatChannelRef.current = chatChannel;

        chatChannel
            .on("broadcast", { event: "chat_message" }, (payload) => {
                const msg = payload.payload as ChatMessage;
                setChatMessages((prev) => [...prev, msg]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(chatChannel);
            chatChannelRef.current = null;
        };
    }, [currentUserId, roomId]);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages]);

    const handleSendChat = useCallback(() => {
        if (!chatInput.trim() || !chatChannelRef.current || !room || !currentUserId) return;

        const myProfile = room.members.find((m) => m.user_id === currentUserId);
        const msg: ChatMessage = {
            id: `${Date.now()}-${currentUserId}`,
            userId: currentUserId,
            name: myProfile?.first_name || "Sister",
            avatarUrl: myProfile?.avatar_url || "",
            text: chatInput.trim(),
            timestamp: Date.now(),
        };

        // Add locally immediately
        setChatMessages((prev) => [...prev, msg]);

        // Broadcast to others
        chatChannelRef.current.send({
            type: "broadcast",
            event: "chat_message",
            payload: msg,
        });

        setChatInput("");
    }, [chatInput, room, currentUserId]);

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

    // Change game (host only)
    const handleChangeGame = useCallback(async (newGameType: string) => {
        if (!room || !isHost) return;
        setIsStarting(false);
        setRoom((prev) => prev ? { ...prev, game_type: newGameType, status: "waiting" } : prev);
        setShowGamePicker(false);
        await supabase
            .from("game_rooms")
            .update({ game_type: newGameType, status: "waiting" })
            .eq("id", room.id);
    }, [room, isHost]);

    // ─── Keep the page behind the fullscreen game from scrolling ─
    const isPlaying = room?.status === "playing";
    useEffect(() => {
        if (!isPlaying) return;

        const html = document.documentElement;
        const body = document.body;

        const origHtmlOverflow = html.style.overflow;
        const origBodyOverflow = body.style.overflow;

        // Avoid position: fixed here. It prevents nested momentum scrolling
        // inside fullscreen overlays on iOS Safari and iOS webviews.
        html.style.overflow = "hidden";
        body.style.overflow = "hidden";

        return () => {
            html.style.overflow = origHtmlOverflow;
            body.style.overflow = origBodyOverflow;
        };
    }, [isPlaying]);

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

    // If playing, check if user is spectating (joined mid-game)
    const isSpectating = isPlaying && joinedDuringGame.current;

    // If spectating, show waiting screen
    if (isSpectating) {
        return (
            <div className="min-h-screen bg-warm-paper pb-20 animate-fade-in">
                <Navbar />
                <div className="container mx-auto px-4 pt-24 max-w-2xl">
                    <button
                        onClick={handleLeave}
                        disabled={isLeaving}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/60 hover:bg-white border border-stone-200/40 text-xs text-warm-cocoa font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-95 duration-200 cursor-pointer mb-6"
                    >
                        {isLeaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowLeft className="w-3 h-3" />}
                        Leave Room
                    </button>

                    {/* Game in Progress Card */}
                    <div className="bg-white/50 border border-warm-grey/5 rounded-3xl p-8 shadow-sm text-center relative overflow-hidden mb-6">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/10 rounded-bl-full pointer-events-none" />

                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-50 to-emerald-50 flex items-center justify-center text-4xl mx-auto mb-4 shadow-md border border-amber-100 relative">
                            <span className="relative z-10">{gameInfo?.emoji}</span>
                            <span className="absolute inset-0 rounded-full bg-emerald-100/20 blur-md animate-pulse" />
                        </div>

                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200/50 mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Game in Progress
                        </span>

                        <h1 className="font-serif text-2xl text-warm-cocoa font-bold mb-2">{gameInfo?.name}</h1>
                        <p className="text-xs text-warm-grey/50 italic mb-4">
                            A game is currently being played. You&apos;ll join the next round!
                        </p>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-50 border border-stone-100 text-xs font-bold text-warm-cocoa">
                            <Users className="w-3.5 h-3.5" />
                            {memberCount} / {room.max_players} Players
                        </div>

                        {/* Waiting animation */}
                        <div className="mt-6 flex items-center justify-center gap-1.5">
                            <div className="w-2 h-2 bg-emerald-400/50 rounded-full animate-bounce [animation-delay:0ms]" />
                            <div className="w-2 h-2 bg-emerald-400/50 rounded-full animate-bounce [animation-delay:150ms]" />
                            <div className="w-2 h-2 bg-emerald-400/50 rounded-full animate-bounce [animation-delay:300ms]" />
                        </div>
                        <p className="text-[10px] text-warm-grey/40 mt-2">Waiting for the current game to finish...</p>
                    </div>

                    {/* Chat while waiting */}
                    <div className="bg-white/50 border border-warm-grey/5 rounded-3xl p-5 shadow-sm mb-6">
                        <h3 className="font-serif text-sm font-bold text-warm-cocoa mb-3 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-muted-rose" />
                            Room Chat
                        </h3>

                        <div className="bg-warm-paper/50 rounded-2xl border border-stone-100 p-3 mb-3 max-h-[200px] min-h-[100px] overflow-y-auto">
                            {chatMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <span className="text-2xl mb-1">💬</span>
                                    <p className="text-[10px] text-warm-grey/40 italic">Chat while you wait for the game to finish!</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {chatMessages.map((msg) => {
                                        const isMe = msg.userId === currentUserId;
                                        return (
                                            <div key={msg.id} className={`flex items-start gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                                                <div className="flex-shrink-0">
                                                    {msg.avatarUrl ? (
                                                        <img src={msg.avatarUrl} alt={msg.name} className="w-6 h-6 rounded-full object-cover border border-stone-200" />
                                                    ) : (
                                                        <div className={`w-6 h-6 rounded-full ${getAvatarBg(msg.userId)} flex items-center justify-center text-[8px] font-bold border`}>
                                                            {msg.name[0]?.toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`max-w-[70%] px-3 py-1.5 rounded-2xl ${
                                                    isMe ? "bg-warm-cocoa text-white rounded-br-md" : "bg-white border border-stone-100 text-warm-cocoa rounded-bl-md"
                                                }`}>
                                                    {!isMe && <p className="text-[8px] font-bold opacity-60 mb-0.5">{msg.name}</p>}
                                                    <p className="text-[11px] leading-snug">{msg.text}</p>
                                                    <p className={`text-[7px] mt-0.5 ${isMe ? "text-white/40" : "text-warm-grey/30"}`}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={chatEndRef} />
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-2.5 rounded-2xl bg-white border border-stone-200/60 text-xs text-warm-cocoa placeholder:text-warm-grey/30 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-300/50 transition-all"
                                maxLength={200}
                            />
                            <button
                                onClick={handleSendChat}
                                disabled={!chatInput.trim()}
                                className="flex items-center justify-center w-9 h-9 rounded-full bg-warm-cocoa text-white transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-warm-cocoa/90 shadow-sm"
                            >
                                <Send className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleLeave}
                        disabled={isLeaving}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200/50 text-xs font-bold text-rose-700 transition-all active:scale-95"
                    >
                        {isLeaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                        Leave Room
                    </button>
                </div>
            </div>
        );
    }

    // If playing (and NOT spectating), render fullscreen game container
    if (isPlaying) {
        return (
            <div
                className="fixed inset-0 z-50 h-[100dvh] max-h-[100dvh] overflow-hidden bg-warm-paper flex flex-col"
                style={{ touchAction: "pan-y" }}
            >
                {/* Minimal top bar during gameplay */}
                <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-white/80 backdrop-blur-sm border-b border-stone-200/30 relative z-20">
                    <button
                        onClick={handleLeave}
                        disabled={isLeaving}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/60 hover:bg-white border border-stone-200/40 text-[10px] text-warm-cocoa font-bold transition-all active:scale-95"
                    >
                        {isLeaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowLeft className="w-3 h-3" />}
                        Leave
                    </button>
                    <span className="text-xs font-serif font-bold text-warm-cocoa flex items-center gap-1.5">
                        <span className="text-base">{gameInfo?.emoji}</span>
                        {gameInfo?.name}
                    </span>
                    {isHost && (
                        <div className="relative">
                            <button
                                onClick={() => setShowGamePicker(!showGamePicker)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-50/80 hover:bg-amber-100 border border-amber-200/50 text-[10px] font-bold text-amber-800 transition-all active:scale-95"
                            >
                                <Shuffle className="w-3 h-3" />
                                Switch
                            </button>
                            <AnimatePresence>
                                {showGamePicker && (
                                    <>
                                        {/* Backdrop to catch taps outside */}
                                        <div
                                            className="fixed inset-0 z-[998]"
                                            onClick={() => setShowGamePicker(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-1 z-[999] w-56"
                                        >
                                            <div className="bg-white border border-stone-200/60 rounded-2xl p-2 shadow-xl flex flex-col gap-1">
                                                {Object.entries(GAME_INFO)
                                                    .filter(([key]) => key !== room.game_type)
                                                    .map(([key, info]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => handleChangeGame(key)}
                                                        className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-left transition-all active:scale-[0.98] hover:bg-stone-50 cursor-pointer"
                                                    >
                                                        <span className="text-base">{info.emoji}</span>
                                                        <p className="text-[11px] font-bold text-warm-cocoa">{info.name}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                    {!isHost && <div className="w-14" />}
                </div>

                {/* Game area — fills remaining space, scrollable only internally */}
                <div
                    data-game-scroll
                    className="flex-1 min-h-0 h-0 overflow-y-scroll overflow-x-hidden px-3 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] relative z-10"
                    style={{
                        WebkitOverflowScrolling: "touch",
                        overscrollBehaviorY: "auto",
                    }}
                >
                    {room.game_type === "sisters_sketch" && (
                        <SistersSketch room={room} currentUserId={currentUserId!} isHost={isHost}
                            onGameEnd={() => { setIsStarting(false); setRoom((prev) => prev ? { ...prev, status: "waiting" } : prev); supabase.from("game_rooms").update({ status: "waiting" }).eq("id", room.id); }}
                            onCloseRoom={handleLeave} />
                    )}
                    {room.game_type === "card_rooms" && (
                        <EgyptianRatScrew room={room} currentUserId={currentUserId!} isHost={isHost}
                            onGameEnd={() => { setIsStarting(false); setRoom((prev) => prev ? { ...prev, status: "waiting" } : prev); supabase.from("game_rooms").update({ status: "waiting" }).eq("id", room.id); }}
                            onCloseRoom={handleLeave} />
                    )}
                    {room.game_type === "crazy_8s" && (
                        <ChristianCrazy8 room={room} currentUserId={currentUserId!} isHost={isHost}
                            onGameEnd={() => { setIsStarting(false); setRoom((prev) => prev ? { ...prev, status: "waiting" } : prev); supabase.from("game_rooms").update({ status: "waiting" }).eq("id", room.id); }}
                            onCloseRoom={handleLeave} />
                    )}
                    {room.game_type === "wavelength" && (
                        <Wavelength room={room} currentUserId={currentUserId!} isHost={isHost}
                            onGameEnd={() => { setIsStarting(false); setRoom((prev) => prev ? { ...prev, status: "waiting" } : prev); supabase.from("game_rooms").update({ status: "waiting" }).eq("id", room.id); }}
                            onCloseRoom={handleLeave} />
                    )}
                    {room.game_type === "spyfall" && (
                        <Spyfall room={room} currentUserId={currentUserId!} isHost={isHost}
                            onGameEnd={() => { setIsStarting(false); setRoom((prev) => prev ? { ...prev, status: "waiting" } : prev); supabase.from("game_rooms").update({ status: "waiting" }).eq("id", room.id); }}
                            onCloseRoom={handleLeave} />
                    )}
                    {room.game_type === "bible_monopoly" && (
                        <BibleMonopoly room={room} currentUserId={currentUserId!} isHost={isHost}
                            onGameEnd={() => { setIsStarting(false); setRoom((prev) => prev ? { ...prev, status: "waiting" } : prev); supabase.from("game_rooms").update({ status: "waiting" }).eq("id", room.id); }}
                            onCloseRoom={handleLeave} />
                    )}
                    {!["sisters_sketch", "card_rooms", "crazy_8s", "wavelength", "spyfall", "bible_monopoly"].includes(room.game_type) && (
                        <div className="w-full bg-white/50 border border-warm-grey/5 rounded-3xl p-8 shadow-sm text-center">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-3xl mx-auto mb-4 border border-emerald-100">
                                <Gamepad2 className="w-8 h-8 text-emerald-600" />
                            </div>
                            <h3 className="font-serif text-lg font-bold text-warm-cocoa mb-2">Game Starting!</h3>
                            <p className="text-xs text-warm-grey/50 max-w-xs mx-auto leading-relaxed">
                                {gameInfo?.name} is loading for all players. The full game experience is coming soon — stay tuned! 🌸
                            </p>
                        </div>
                    )}
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

                {/* Room Chat */}
                {room.status === "waiting" && (
                    <div className="bg-white/50 border border-warm-grey/5 rounded-3xl p-5 shadow-sm mb-6">
                        <h3 className="font-serif text-sm font-bold text-warm-cocoa mb-3 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-muted-rose" />
                            Room Chat
                        </h3>

                        {/* Messages area */}
                        <div className="bg-warm-paper/50 rounded-2xl border border-stone-100 p-3 mb-3 max-h-[200px] min-h-[100px] overflow-y-auto">
                            {chatMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-6 text-center">
                                    <span className="text-2xl mb-1">💬</span>
                                    <p className="text-[10px] text-warm-grey/40 italic">Say hi while you wait! Messages are live.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {chatMessages.map((msg) => {
                                        const isMe = msg.userId === currentUserId;
                                        return (
                                            <div key={msg.id} className={`flex items-start gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                                                {/* Avatar */}
                                                <div className="flex-shrink-0">
                                                    {msg.avatarUrl ? (
                                                        <img src={msg.avatarUrl} alt={msg.name} className="w-6 h-6 rounded-full object-cover border border-stone-200" />
                                                    ) : (
                                                        <div className={`w-6 h-6 rounded-full ${getAvatarBg(msg.userId)} flex items-center justify-center text-[8px] font-bold border`}>
                                                            {msg.name[0]?.toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                {/* Bubble */}
                                                <div className={`max-w-[70%] px-3 py-1.5 rounded-2xl ${
                                                    isMe
                                                        ? "bg-warm-cocoa text-white rounded-br-md"
                                                        : "bg-white border border-stone-100 text-warm-cocoa rounded-bl-md"
                                                }`}>
                                                    {!isMe && (
                                                        <p className="text-[8px] font-bold opacity-60 mb-0.5">{msg.name}</p>
                                                    )}
                                                    <p className="text-[11px] leading-snug">{msg.text}</p>
                                                    <p className={`text-[7px] mt-0.5 ${isMe ? "text-white/40" : "text-warm-grey/30"}`}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={chatEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                                placeholder="Type a message..."
                                className="flex-1 px-4 py-2.5 rounded-2xl bg-white border border-stone-200/60 text-xs text-warm-cocoa placeholder:text-warm-grey/30 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-300/50 transition-all"
                                maxLength={200}
                            />
                            <button
                                onClick={handleSendChat}
                                disabled={!chatInput.trim()}
                                className="flex items-center justify-center w-9 h-9 rounded-full bg-warm-cocoa text-white transition-all active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-warm-cocoa/90 shadow-sm"
                            >
                                <Send className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-3 items-center">
                    {/* Host: Start Game button */}
                    {isHost && room.status === "waiting" && (
                        <div className="w-full max-w-xs flex flex-col gap-3">
                            <button
                                onClick={handleStartGame}
                                disabled={memberCount < 2 || isStarting}
                                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-serif text-sm font-bold transition-all active:scale-95 shadow-lg ${
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

                            {/* Change Game Button */}
                            <button
                                onClick={() => setShowGamePicker(!showGamePicker)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/60 hover:bg-white border border-stone-200/40 text-xs font-bold text-warm-cocoa transition-all active:scale-95"
                            >
                                <Shuffle className="w-3.5 h-3.5" />
                                {showGamePicker ? "Cancel" : "Change Game"}
                            </button>

                            {/* Game Picker */}
                            <AnimatePresence>
                                {showGamePicker && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="bg-white/60 border border-stone-200/40 rounded-2xl p-3 flex flex-col gap-2">
                                            <p className="text-[9px] text-warm-grey/40 uppercase tracking-wider font-bold text-center mb-1">
                                                Pick a different game
                                            </p>
                                            {Object.entries(GAME_INFO).map(([key, info]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => handleChangeGame(key)}
                                                    disabled={room.game_type === key}
                                                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all active:scale-[0.98] ${
                                                        room.game_type === key
                                                            ? "bg-amber-50 border border-amber-200/50 ring-2 ring-amber-400/50"
                                                            : "bg-white hover:bg-stone-50 border border-stone-200/30 cursor-pointer"
                                                    }`}
                                                >
                                                    <span className="text-2xl">{info.emoji}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-warm-cocoa">
                                                            {info.name}
                                                            {room.game_type === key && (
                                                                <span className="ml-1.5 text-[8px] text-amber-600 font-bold uppercase">
                                                                    Current
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-[9px] text-warm-grey/50 truncate">{info.description}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* Host: Floating Switch Game button during active gameplay */}
                    {isHost && room.status === "playing" && (
                        <div className="w-full flex justify-end mb-2">
                            <div className="relative">
                                <button
                                    onClick={() => setShowGamePicker(!showGamePicker)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50/80 hover:bg-amber-100 border border-amber-200/50 text-[10px] font-bold text-amber-800 transition-all active:scale-95 backdrop-blur-sm"
                                >
                                    <Shuffle className="w-3 h-3" />
                                    {showGamePicker ? "Cancel" : "Switch Game"}
                                </button>
                                <AnimatePresence>
                                    {showGamePicker && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -5, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-1 z-50 w-64"
                                        >
                                            <div className="bg-white border border-stone-200/60 rounded-2xl p-2 shadow-xl flex flex-col gap-1">
                                                {Object.entries(GAME_INFO)
                                                    .filter(([key]) => key !== room.game_type)
                                                    .map(([key, info]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => handleChangeGame(key)}
                                                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-left transition-all active:scale-[0.98] hover:bg-stone-50 cursor-pointer"
                                                    >
                                                        <span className="text-lg">{info.emoji}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-[11px] font-bold text-warm-cocoa">{info.name}</p>
                                                            <p className="text-[9px] text-warm-grey/50 truncate">{info.description}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
