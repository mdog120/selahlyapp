"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Users, ShieldAlert, Sparkles } from "lucide-react";

const MOCK_ONLINE_SISTERS = [
    { name: "Hannah 🌿", status: "In Prayer Pocket", avatarColor: "bg-emerald-100 text-emerald-800" },
    { name: "Esther 👑", status: "Reflecting in Diaries", avatarColor: "bg-amber-100 text-amber-800" },
    { name: "Sarah ౨ৎ", status: "Browsing Lily Pad", avatarColor: "bg-pink-100 text-pink-850" },
    { name: "Deborah ✨", status: "Active in Garden", avatarColor: "bg-purple-100 text-purple-800" }
];

export default function MultiplayerGamesPage() {
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
                    <div className="md:col-span-4 bg-white/50 border border-warm-grey/5 p-6 rounded-3xl shadow-sm flex flex-col gap-4 text-left">
                        <h3 className="font-serif text-sm font-bold text-warm-cocoa border-b border-warm-grey/5 pb-2 flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-rose" /> Sisters Online
                        </h3>

                        <div className="flex flex-col gap-3">
                            {MOCK_ONLINE_SISTERS.map((sister, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-white/80 border border-stone-100 shadow-sm transition-all hover:scale-[1.01]">
                                    <div className={`w-8 h-8 rounded-full ${sister.avatarColor} flex items-center justify-center text-xs font-bold font-sans shadow-inner`}>
                                        {sister.name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="text-[11px] font-bold text-warm-cocoa truncate">{sister.name}</h5>
                                        <p className="text-[9px] text-warm-grey/40 truncate">{sister.status}</p>
                                    </div>
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                </div>
                            ))}
                        </div>

                        <p className="text-[9px] text-warm-grey/40 text-center italic mt-2">
                            Simulated real-time status tracker ⚡
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
