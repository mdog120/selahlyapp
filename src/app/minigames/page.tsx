"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/Navbar";
import { BlockBlast } from "@/components/minigames/BlockBlast";
import { Crosswords } from "@/components/minigames/Crosswords";
import { WordSearch } from "@/components/minigames/WordSearch";
import { Sudoku } from "@/components/minigames/Sudoku";
import { Pong } from "@/components/minigames/Pong";
import { Pictionary } from "@/components/minigames/Pictionary";
import { Button } from "@/components/ui/Button";
import { Users, Gamepad2, Volume2, VolumeX, LogOut, Send } from "lucide-react";

type Profile = {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
};

type Invite = {
    id: string;
    inviterId: string;
    inviterName: string;
    gameType: "pong" | "pictionary";
    roomId: string;
};

export default function MiniGamesPage() {
    const supabase = createClient();

    // User profile state
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [activeTab, setActiveTab] = useState<"lobby" | "blockblast" | "crosswords" | "wordsearch" | "sudoku" | "pong" | "pictionary">("lobby");

    // Realtime lobby states
    const [lobbyPlayers, setLobbyPlayers] = useState<{ id: string; name: string; avatar: string }[]>([]);
    const [activeInvite, setActiveInvite] = useState<Invite | null>(null);
    const [inviteSending, setInviteSending] = useState(false);

    // Active multiplayer match state
    const [match, setMatch] = useState<{
        roomId: string;
        gameType: "pong" | "pictionary";
        isHost: boolean;
    } | null>(null);

    const lobbyChannelRef = useRef<any>(null);

    // 1. Fetch user identity on mount
    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("id, username, first_name, last_name, avatar_url")
                    .eq("id", user.id)
                    .single();

                if (profile) {
                    setUserProfile(profile as Profile);
                }
            }
        };
        loadProfile();
    }, []);

    // 2. Setup Supabase Presence for global minigames lobby
    useEffect(() => {
        if (!userProfile) return;

        const lobbyChannel = supabase.channel("minigames_lobby", {
            config: {
                presence: {
                    key: userProfile.id,
                },
            },
        });
        lobbyChannelRef.current = lobbyChannel;

        // Listen for online player syncs and game invites
        lobbyChannel
            .on("presence", { event: "sync" }, () => {
                const state = lobbyChannel.presenceState();
                const onlinePlayers = Object.keys(state)
                    .filter(id => id !== userProfile.id) // Exclude myself
                    .map(id => {
                        const pres = state[id][0] as any;
                        return {
                            id,
                            name: pres.name || "Sister",
                            avatar: pres.avatar || ""
                        };
                    });
                setLobbyPlayers(onlinePlayers);
            })
            .on("broadcast", { event: "game-invite" }, (payload: any) => {
                const data = payload.payload;
                if (data.targetId === userProfile.id) {
                    setActiveInvite({
                        id: Math.random().toString(),
                        inviterId: data.inviterId,
                        inviterName: data.inviterName,
                        gameType: data.gameType,
                        roomId: data.roomId
                    });
                }
            })
            .on("broadcast", { event: "invite-reply" }, (payload: any) => {
                const data = payload.payload;
                if (data.inviterId === userProfile.id) {
                    setInviteSending(false);
                    if (data.accepted) {
                        // Launch the multiplayer game room!
                        setMatch({
                            roomId: data.roomId,
                            gameType: data.gameType,
                            isHost: true
                        });
                        setActiveTab(data.gameType);
                    } else {
                        alert(`${data.targetName} declined your invite.`);
                    }
                }
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await lobbyChannel.track({
                        name: userProfile.first_name || userProfile.username || "Sister",
                        avatar: userProfile.avatar_url || ""
                    });
                }
            });

        return () => {
            lobbyChannel.unsubscribe();
        };
    }, [userProfile]);

    // Send game invitation
    const handleSendInvite = (targetId: string, gameType: "pong" | "pictionary") => {
        if (!userProfile || !lobbyChannelRef.current) return;

        const roomId = `room_${Math.random().toString(36).substr(2, 9)}`;
        setInviteSending(true);

        lobbyChannelRef.current.send({
            type: "broadcast",
            event: "game-invite",
            payload: {
                targetId,
                inviterId: userProfile.id,
                inviterName: userProfile.first_name || userProfile.username || "Sister",
                gameType,
                roomId
            }
        });

        // Autocancel invite after 15s if no response
        setTimeout(() => {
            setInviteSending(prev => {
                if (prev) {
                    alert("No response received from sister. Invite timed out.");
                    return false;
                }
                return false;
            });
        }, 15000);
    };

    // Accept invite
    const handleAcceptInvite = () => {
        if (!activeInvite || !userProfile || !lobbyChannelRef.current) return;

        lobbyChannelRef.current.send({
            type: "broadcast",
            event: "invite-reply",
            payload: {
                inviterId: activeInvite.inviterId,
                targetName: userProfile.first_name || userProfile.username || "Sister",
                accepted: true,
                gameType: activeInvite.gameType,
                roomId: activeInvite.roomId
            }
        });

        // Join match locally
        setMatch({
            roomId: activeInvite.roomId,
            gameType: activeInvite.gameType,
            isHost: false
        });
        setActiveTab(activeInvite.gameType);
        setActiveInvite(null);
    };

    // Decline invite
    const handleDeclineInvite = () => {
        if (!activeInvite || !userProfile || !lobbyChannelRef.current) return;

        lobbyChannelRef.current.send({
            type: "broadcast",
            event: "invite-reply",
            payload: {
                inviterId: activeInvite.inviterId,
                targetName: userProfile.first_name || userProfile.username || "Sister",
                accepted: false,
                gameType: activeInvite.gameType,
                roomId: activeInvite.roomId
            }
        });

        setActiveInvite(null);
    };

    // Leave multiplayer room
    const handleLeaveMatch = () => {
        if (confirm("Are you sure you want to leave the game session?")) {
            setMatch(null);
            setActiveTab("lobby");
        }
    };

    return (
        <div className="min-h-screen bg-warm-paper pb-20">
            <Navbar />

            <div className="container mx-auto px-4 pt-24 max-w-4xl">
                {/* Header */}
                <header className="mb-8 text-center animate-fade-in-up">
                    <h1 className="font-serif text-3xl text-warm-cocoa font-bold mb-1">౨ৎ Mini Games ౨ৎ</h1>
                    <p className="text-xs text-warm-grey/50 italic">
                        "A cheerful heart is good medicine..." — Proverbs 17:22
                    </p>
                </header>

                {/* Main panel layout */}
                {match ? (
                    // ------------------ Active Multiplayer Room View ------------------
                    <div className="flex flex-col items-center">
                        <div className="w-full flex items-center justify-between bg-white/40 p-4 border border-warm-grey/5 rounded-2xl mb-6 shadow-sm">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-warm-grey/50">
                                Active Matchroom: <span className="font-mono">{match.roomId}</span>
                            </span>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleLeaveMatch}
                                className="text-red-400 hover:text-red-500 flex items-center gap-1 font-bold text-xs"
                            >
                                <LogOut className="w-4 h-4" /> Leave Match
                            </Button>
                        </div>

                        {match.gameType === "pong" ? (
                            <Pong 
                                roomId={match.roomId} 
                                userId={userProfile?.id} 
                                isHost={match.isHost} 
                            />
                        ) : (
                            <Pictionary 
                                roomId={match.roomId} 
                                userId={userProfile?.id || ""} 
                                userName={userProfile?.first_name || "Sister"} 
                            />
                        )}
                    </div>
                ) : (
                    // ------------------ Standard Dashboard Hub ------------------
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                        
                        {/* Tab Content (left 8 columns) */}
                        <div className="md:col-span-8 flex flex-col gap-6">
                            {activeTab === "lobby" && (
                                <div className="glass-card p-6 rounded-3xl border border-white/60 bg-white/40 text-center animate-fade-in-up">
                                    <div className="w-16 h-16 rounded-full bg-soft-blush/30 flex items-center justify-center text-3xl mx-auto mb-4">🎮</div>
                                    <h4 className="font-serif text-xl font-bold text-warm-cocoa mb-2">Welcome to the Arcade!</h4>
                                    <p className="text-xs text-warm-grey/60 max-w-sm mx-auto leading-relaxed mb-6">
                                        Select a game from the menu below to start playing, or invite any online sister in the sidebar to join a multiplayer match!
                                    </p>
                                    
                                    {/* Game lists buttons */}
                                    <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                                        <Button onClick={() => setActiveTab("blockblast")} className="bg-rose-100 hover:bg-rose-200/80 text-rose-800 border border-rose-200/40 text-xs font-serif py-3 rounded-2xl shadow-sm transition-all hover:scale-[1.02]">
                                            🌸 Block Blast
                                        </Button>
                                        <Button onClick={() => setActiveTab("crosswords")} className="bg-lavender-100 hover:bg-lavender-200/80 text-lavender-800 border border-lavender-200/40 text-xs font-serif py-3 rounded-2xl shadow-sm transition-all hover:scale-[1.02]">
                                            📖 Crosswords
                                        </Button>
                                        <Button onClick={() => setActiveTab("wordsearch")} className="bg-sky-100 hover:bg-sky-200/80 text-sky-800 border border-sky-200/40 text-xs font-serif py-3 rounded-2xl shadow-sm transition-all hover:scale-[1.02]">
                                            ✨ Word Search
                                        </Button>
                                        <Button onClick={() => setActiveTab("sudoku")} className="bg-mint-100 hover:bg-mint-200/80 text-mint-800 border border-mint-200/40 text-xs font-serif py-3 rounded-2xl shadow-sm transition-all hover:scale-[1.02]">
                                            🌿 Sudoku
                                        </Button>
                                        <Button onClick={() => setActiveTab("pong")} className="col-span-2 bg-stone-100 hover:bg-stone-200 text-warm-cocoa border border-stone-200/50 text-xs font-serif py-3 rounded-2xl shadow-sm transition-all hover:scale-[1.02]">
                                            🏓 Table Tennis (Solo vs. AI)
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {activeTab === "blockblast" && <BlockBlast />}
                            {activeTab === "crosswords" && <Crosswords />}
                            {activeTab === "wordsearch" && <WordSearch />}
                            {activeTab === "sudoku" && <Sudoku />}
                            {activeTab === "pong" && <Pong />}
                        </div>

                        {/* Sidebar (right 4 columns) */}
                        <div className="md:col-span-4 flex flex-col gap-6">
                            {/* Sisters Online Lobby Sidebar */}
                            <div className="glass-card p-6 rounded-3xl border border-white/60 bg-white/40 flex flex-col gap-4 text-left">
                                <h3 className="font-serif text-sm font-bold text-warm-cocoa border-b border-warm-grey/5 pb-2 flex items-center gap-1.5">
                                    <Users className="w-4 h-4 text-muted-rose" /> Sisters Online
                                </h3>

                                {lobbyPlayers.length === 0 ? (
                                    <p className="text-[10px] text-warm-grey/40 italic py-2 text-center">
                                        No other sisters online in games. Open a second window to test!
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {lobbyPlayers.map(player => (
                                            <div key={player.id} className="flex items-center justify-between gap-3 bg-white/60 border border-stone-200/30 p-2.5 rounded-2xl shadow-sm">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className="w-7 h-7 rounded-full bg-soft-blush flex-shrink-0 overflow-hidden flex items-center justify-center text-[10px] text-warm-grey/60">
                                                        {player.avatar ? (
                                                            <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            player.name[0]
                                                        )}
                                                    </div>
                                                    <span className="text-xs font-bold text-warm-grey truncate">{player.name}</span>
                                                </div>

                                                <div className="flex gap-1 shrink-0">
                                                    <button
                                                        onClick={() => handleSendInvite(player.id, "pong")}
                                                        disabled={inviteSending}
                                                        className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-warm-cocoa font-bold text-[9px] rounded-lg border border-stone-200/50 transition-all cursor-pointer"
                                                        title="Invite to Table Tennis"
                                                    >
                                                        🏓
                                                    </button>
                                                    <button
                                                        onClick={() => handleSendInvite(player.id, "pictionary")}
                                                        disabled={inviteSending}
                                                        className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-muted-rose font-bold text-[9px] rounded-lg border border-rose-200/30 transition-all cursor-pointer"
                                                        title="Invite to Pictionary"
                                                    >
                                                        🎨
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}
            </div>

            {/* Global game invite popup overlay modal */}
            {activeInvite && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-sm border border-warm-grey/10 flex flex-col gap-4 animate-fade-in-up text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-soft-blush/20 rounded-bl-full pointer-events-none" />
                        
                        <div className="w-14 h-14 rounded-full bg-soft-blush/30 flex items-center justify-center text-xl mx-auto shadow-sm">
                            {activeInvite.gameType === "pong" ? "🏓" : "🎨"}
                        </div>
                        
                        <h4 className="font-serif text-lg font-bold text-warm-cocoa">Game Invitation!</h4>
                        <p className="text-xs text-warm-grey/60 leading-relaxed max-w-xs mx-auto">
                            <span className="font-bold text-warm-cocoa">{activeInvite.inviterName}</span> is inviting you to a match of{" "}
                            <span className="font-bold text-muted-rose">{activeInvite.gameType === "pong" ? "Table Tennis" : "Pictionary"}</span>!
                        </p>

                        <div className="flex gap-3 pt-2">
                            <Button 
                                variant="ghost" 
                                onClick={handleDeclineInvite}
                                className="flex-1 border border-stone-200 text-warm-grey/70 text-xs py-2 rounded-xl"
                            >
                                Decline
                            </Button>
                            <Button 
                                onClick={handleAcceptInvite}
                                className="flex-1 bg-warm-cocoa text-white font-bold text-xs py-2 rounded-xl shadow-md hover:scale-[1.01] active:scale-95 transition-all"
                            >
                                Accept Match 🕊️
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Waiting for accept status modal */}
            {inviteSending && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                    <div className="bg-white/95 rounded-2xl p-6 shadow-xl w-64 border border-warm-grey/10 flex flex-col items-center gap-3 text-center animate-fade-in-up">
                        <div className="w-8 h-8 rounded-full border-2 border-muted-rose/20 border-t-muted-rose animate-spin" />
                        <p className="text-xs text-warm-grey font-bold">Sending Invitation...</p>
                        <p className="text-[10px] text-warm-grey/40">Waiting for response from sister</p>
                    </div>
                </div>
            )}

            {/* Bottom menu bar selector for solo tabs */}
            {!match && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/85 backdrop-blur-xl px-4 py-2.5 rounded-full shadow-lg border border-white/60 flex gap-2 md:gap-4 max-w-[90%] overflow-x-auto scrollbar-none">
                    <button
                        onClick={() => setActiveTab("lobby")}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active-press-shrink shrink-0 ${
                            activeTab === "lobby" ? "bg-warm-cocoa text-white" : "text-warm-grey/50 hover:text-warm-grey/80"
                        }`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab("blockblast")}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active-press-shrink shrink-0 ${
                            activeTab === "blockblast" ? "bg-rose-100 text-rose-800" : "text-warm-grey/50 hover:text-warm-grey/80"
                        }`}
                    >
                        Block Blast
                    </button>
                    <button
                        onClick={() => setActiveTab("crosswords")}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active-press-shrink shrink-0 ${
                            activeTab === "crosswords" ? "bg-lavender-100 text-lavender-800" : "text-warm-grey/50 hover:text-warm-grey/80"
                        }`}
                    >
                        Crosswords
                    </button>
                    <button
                        onClick={() => setActiveTab("wordsearch")}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active-press-shrink shrink-0 ${
                            activeTab === "wordsearch" ? "bg-sky-100 text-sky-800" : "text-warm-grey/50 hover:text-warm-grey/80"
                        }`}
                    >
                        Word Search
                    </button>
                    <button
                        onClick={() => setActiveTab("sudoku")}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all active-press-shrink shrink-0 ${
                            activeTab === "sudoku" ? "bg-mint-100 text-mint-800" : "text-warm-grey/50 hover:text-warm-grey/80"
                        }`}
                    >
                        Sudoku
                    </button>
                </div>
            )}
        </div>
    );
}
