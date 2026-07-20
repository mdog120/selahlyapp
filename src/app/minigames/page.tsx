"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { BlockBlast } from "@/components/minigames/BlockBlast";
import { Crosswords } from "@/components/minigames/Crosswords";
import { WordSearch } from "@/components/minigames/WordSearch";
import { Sudoku } from "@/components/minigames/Sudoku";
import { GraceAlchemy } from "@/components/minigames/GraceAlchemy";
import { MemoryMatch } from "@/components/minigames/MemoryMatch";
import { GardenGrid } from "@/components/garden/GardenGrid";
import { MyTalkingLamb } from "@/components/minigames/MyTalkingLamb";
import { GraceCafe } from "@/components/minigames/GraceCafe";
import { GalileeFishing } from "@/components/minigames/GalileeFishing";
import { ScriptureFlashcards } from "@/components/minigames/ScriptureFlashcards";

export default function MiniGamesPage() {
    const [activeTab, setActiveTab] = useState<"lobby" | "blockblast" | "crosswords" | "wordsearch" | "sudoku" | "gracealchemy" | "memorymatch" | "garden" | "mytalkinglamb" | "gracecafe" | "galileefishing" | "scriptureflashcards">("lobby");

    return (
        <div className="min-h-screen bg-warm-paper pb-20 animate-fade-in">
            <Navbar />

            <div className="container mx-auto px-4 pt-24 max-w-4xl">
                <header className="mb-8 text-center animate-fade-in-up">
                    <h1 className="font-serif text-3xl text-warm-cocoa font-bold mb-1 flex items-center justify-center gap-2">
                        <span className="text-2xl">🂡</span> Mini Games <span className="text-2xl">🂡</span>
                    </h1>
                    <p className="text-xs text-warm-grey/50 italic">
                        &ldquo;A cheerful heart is good medicine...&rdquo; — Proverbs 17:22
                    </p>
                </header>

                {activeTab === "lobby" ? (
                    // ------------------ Games Hub Selection ------------------
                    <div className="flex flex-col gap-6 animate-fade-in-up">
                        {/* Welcome Hero Panel */}
                        <div className="glass-card p-6 rounded-3xl border border-white/60 bg-white/40 text-center relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-soft-blush/10 rounded-bl-full pointer-events-none" />
                            <div className="w-16 h-16 rounded-full bg-soft-blush/30 flex items-center justify-center text-2xl mx-auto mb-4 shadow-sm relative">
                                <span className="relative z-10">🂡</span>
                                <span className="absolute inset-0 rounded-full bg-soft-blush/20 blur-md animate-pulse" />
                            </div>
                            <h4 className="font-serif text-xl font-bold text-warm-cocoa mb-2">Selahly Arcade Hub</h4>
                            <p className="text-xs text-warm-grey/60 max-w-sm mx-auto leading-relaxed">
                                Select any option below to play beautiful, cozy solo games. Let your heart rest, enjoy quiet focus, and grow in joy.
                            </p>
                        </div>

                        {/* Games Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Block Blast */}
                            <div
                                onClick={() => setActiveTab("blockblast")}
                                className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white/60 hover:bg-white/90 border border-white/80 hover:border-rose-250/40 transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer overflow-hidden text-left"
                            >
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-rose-100/20 to-transparent rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                                <div>
                                    <div className="w-10 h-10 rounded-2xl bg-rose-100/60 text-muted-rose flex items-center justify-center text-lg mb-3 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                        🧱
                                    </div>
                                    <h5 className="font-serif text-sm font-bold text-warm-cocoa mb-1">Block Blast</h5>
                                    <p className="text-[10px] text-warm-grey/50 leading-normal mb-3">
                                        Arrange yellow, pink, green, and purple shapes onto the board. Clearing rows rewards you with scriptural grace words!
                                    </p>
                                </div>
                                <div className="flex items-center justify-between border-t border-stone-200/20 pt-2.5 mt-2">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-rose-600/70 bg-rose-50 px-2 py-0.5 rounded-md">Solo Puzzle</span>
                                    <span className="text-[10px] font-bold text-warm-cocoa/50 group-hover:text-warm-cocoa transition-colors flex items-center gap-0.5">Play Game →</span>
                                </div>
                            </div>

                            {/* Scripture Flashcards */}
                            <div
                                onClick={() => setActiveTab("scriptureflashcards")}
                                className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white/60 hover:bg-white/90 border border-white/80 hover:border-rose-250/40 transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer overflow-hidden text-left"
                            >
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-rose-100/20 to-transparent rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                                <div>
                                    <div className="w-10 h-10 rounded-2xl bg-rose-100/60 text-muted-rose flex items-center justify-center text-lg mb-3 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                        📖
                                    </div>
                                    <h5 className="font-serif text-sm font-bold text-warm-cocoa mb-1">Scripture Cards</h5>
                                    <p className="text-[10px] text-warm-grey/50 leading-normal mb-3">
                                        Flip cards to memorize scriptures. Complete interactive blanks challenges to earn coins for your virtual pet lamb!
                                    </p>
                                </div>
                                <div className="flex items-center justify-between border-t border-stone-200/20 pt-2.5 mt-2">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-rose-600/70 bg-rose-50 px-2 py-0.5 rounded-md">Memory Game</span>
                                    <span className="text-[10px] font-bold text-warm-cocoa/50 group-hover:text-warm-cocoa transition-colors flex items-center gap-0.5">Play Game →</span>
                                </div>
                            </div>

                            {/* Sudoku */}
                            <div
                                onClick={() => setActiveTab("sudoku")}
                                className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white/60 hover:bg-white/90 border border-white/80 hover:border-emerald-250/40 transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer overflow-hidden text-left"
                            >
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-emerald-100/20 to-transparent rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                                <div>
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-100/60 text-emerald-700 flex items-center justify-center text-lg mb-3 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                        🌿
                                    </div>
                                    <h5 className="font-serif text-sm font-bold text-warm-cocoa mb-1">Sudoku</h5>
                                    <p className="text-[10px] text-warm-grey/50 leading-normal mb-3">
                                        Classic 9x9 logic puzzle grid with Easy, Medium, and Hard modes. Pencil note option and mistake limits included.
                                    </p>
                                </div>
                                <div className="flex items-center justify-between border-t border-stone-200/20 pt-2.5 mt-2">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-600/70 bg-emerald-50 px-2 py-0.5 rounded-md">Logic Board</span>
                                    <span className="text-[10px] font-bold text-warm-cocoa/50 group-hover:text-warm-cocoa transition-colors flex items-center gap-0.5">Play Game →</span>
                                </div>
                            </div>

                            {/* Word Search */}
                            <div
                                onClick={() => setActiveTab("wordsearch")}
                                className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white/60 hover:bg-white/90 border border-white/80 hover:border-sky-250/40 transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer overflow-hidden text-left"
                            >
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-sky-100/20 to-transparent rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                                <div>
                                    <div className="w-10 h-10 rounded-2xl bg-sky-100/60 text-sky-700 flex items-center justify-center text-lg mb-3 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                        ✨
                                    </div>
                                    <h5 className="font-serif text-sm font-bold text-warm-cocoa mb-1">Word Search</h5>
                                    <p className="text-[10px] text-warm-grey/50 leading-normal mb-3">
                                        Find scriptures and theological terms in a dynamic search grid. Adapts sizing and direction by difficulty.
                                    </p>
                                </div>
                                <div className="flex items-center justify-between border-t border-stone-200/20 pt-2.5 mt-2">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-sky-655/70 bg-sky-50 px-2 py-0.5 rounded-md">Theological Word</span>
                                    <span className="text-[10px] font-bold text-warm-cocoa/50 group-hover:text-warm-cocoa transition-colors flex items-center gap-0.5">Play Game →</span>
                                </div>
                            </div>

                            {/* Crosswords */}
                            <div
                                onClick={() => setActiveTab("crosswords")}
                                className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white/60 hover:bg-white/90 border border-white/80 hover:border-purple-250/40 transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer overflow-hidden text-left"
                            >
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-purple-100/20 to-transparent rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                                <div>
                                    <div className="w-10 h-10 rounded-2xl bg-purple-100/60 text-purple-700 flex items-center justify-center text-lg mb-3 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                        📖
                                    </div>
                                    <h5 className="font-serif text-sm font-bold text-warm-cocoa mb-1">Crosswords</h5>
                                    <p className="text-[10px] text-warm-grey/50 leading-normal mb-3">
                                        Challenge yourself with Bible-themed crossword puzzles. Focus movement and auto-checking included.
                                    </p>
                                </div>
                                <div className="flex items-center justify-between border-t border-stone-200/20 pt-2.5 mt-2">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-purple-650/70 bg-purple-50 px-2 py-0.5 rounded-md">Bible Trivia</span>
                                    <span className="text-[10px] font-bold text-warm-cocoa/50 group-hover:text-warm-cocoa transition-colors flex items-center gap-0.5">Play Game →</span>
                                </div>
                            </div>

                            {/* Grace Alchemy */}
                            <div
                                onClick={() => setActiveTab("gracealchemy")}
                                className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white/60 hover:bg-white/90 border border-white/80 hover:border-amber-250/40 transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer overflow-hidden text-left"
                            >
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-amber-100/20 to-transparent rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                                <div>
                                    <div className="w-10 h-10 rounded-2xl bg-amber-100/60 text-amber-800 flex items-center justify-center text-lg mb-3 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                        🏺
                                    </div>
                                    <h5 className="font-serif text-sm font-bold text-warm-cocoa mb-1">Grace Alchemy</h5>
                                    <p className="text-[10px] text-warm-grey/50 leading-normal mb-3">
                                        Combine elements to discover faith concepts, biblical figures, and covenant stories.
                                    </p>
                                </div>
                                <div className="flex items-center justify-between border-t border-stone-200/20 pt-2.5 mt-2">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-amber-700/70 bg-amber-50 px-2 py-0.5 rounded-md">Divine Discovery</span>
                                    <span className="text-[10px] font-bold text-warm-cocoa/50 group-hover:text-warm-cocoa transition-colors flex items-center gap-0.5">Play Game →</span>
                                </div>
                            </div>

                            {/* Memory Match */}
                            <div
                                onClick={() => setActiveTab("memorymatch")}
                                className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white/60 hover:bg-white/90 border border-white/80 hover:border-indigo-250/40 transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer overflow-hidden text-left"
                            >
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-indigo-100/20 to-transparent rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                                <div>
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-100/60 text-indigo-700 flex items-center justify-center text-lg mb-3 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                        🧠
                                    </div>
                                    <h5 className="font-serif text-sm font-bold text-warm-cocoa mb-1">Memory Match</h5>
                                    <p className="text-[10px] text-warm-grey/50 leading-normal mb-3">
                                        Flip cards to find matching Bible symbols. Test your memory across three difficulty levels.
                                    </p>
                                </div>
                                <div className="flex items-center justify-between border-t border-stone-200/20 pt-2.5 mt-2">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-600/70 bg-indigo-50 px-2 py-0.5 rounded-md">Card Matching</span>
                                    <span className="text-[10px] font-bold text-warm-cocoa/50 group-hover:text-warm-cocoa transition-colors flex items-center gap-0.5">Play Game →</span>
                                </div>
                            </div>

                            {/* Selah Garden */}
                            <div
                                onClick={() => setActiveTab("garden")}
                                className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white/60 hover:bg-white/90 border border-white/80 hover:border-pink-250/40 transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer overflow-hidden text-left"
                            >
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-pink-100/20 to-transparent rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                                <div>
                                    <div className="w-10 h-10 rounded-2xl bg-pink-100/60 text-pink-700 flex items-center justify-center text-lg mb-3 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                        🌸
                                    </div>
                                    <h5 className="font-serif text-sm font-bold text-warm-cocoa mb-1">Selah Garden</h5>
                                    <p className="text-[10px] text-warm-grey/50 leading-normal mb-3">
                                        Plant seeds of scripture and watch them bloom into beautiful flowers. Complete verse challenges to grow your garden.
                                    </p>
                                </div>
                                <div className="flex items-center justify-between border-t border-stone-200/20 pt-2.5 mt-2">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-pink-600/70 bg-pink-50 px-2 py-0.5 rounded-md">Faith Garden</span>
                                    <span className="text-[10px] font-bold text-warm-cocoa/50 group-hover:text-warm-cocoa transition-colors flex items-center gap-0.5">Play Game →</span>
                                </div>
                            </div>

                            {/* My Talking Lamb */}
                            <div
                                onClick={() => setActiveTab("mytalkinglamb")}
                                className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white/60 hover:bg-white/90 border border-white/80 hover:border-pink-200/40 transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer overflow-hidden text-left"
                            >
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-pink-100/20 to-transparent rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                                <div>
                                    <div className="w-10 h-10 rounded-2xl bg-pink-50 text-rose-400 flex items-center justify-center text-lg mb-3 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                        🐑
                                    </div>
                                    <h5 className="font-serif text-sm font-bold text-warm-cocoa mb-1">My Talking Lamb</h5>
                                    <p className="text-[10px] text-warm-grey/50 leading-normal mb-3">
                                        Adopt a cute digital lamb! Feed it treats, dress it up in sweet accessories, and chat with it to get biblical encouragement.
                                    </p>
                                </div>
                                <div className="flex items-center justify-between border-t border-stone-200/20 pt-2.5 mt-2">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-pink-600/70 bg-pink-50 px-2 py-0.5 rounded-md">Virtual Pet</span>
                                    <span className="text-[10px] font-bold text-warm-cocoa/50 group-hover:text-warm-cocoa transition-colors flex items-center gap-0.5">Play Game →</span>
                                </div>
                            </div>

                            {/* Grace Cafe */}
                            <div
                                onClick={() => setActiveTab("gracecafe")}
                                className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white/60 hover:bg-white/90 border border-white/80 hover:border-amber-200/40 transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer overflow-hidden text-left"
                            >
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-amber-100/20 to-transparent rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                                <div>
                                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-lg mb-3 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                        ☕
                                    </div>
                                    <h5 className="font-serif text-sm font-bold text-warm-cocoa mb-1">Grace Cafe</h5>
                                    <p className="text-[10px] text-warm-grey/50 leading-normal mb-3">
                                        Run a cozy Christian cafe! Bake scripture muffins, brew living water tea, hire helpers, and decorate with beautiful verses.
                                    </p>
                                </div>
                                <div className="flex items-center justify-between border-t border-stone-200/20 pt-2.5 mt-2">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-amber-600/70 bg-amber-50 px-2 py-0.5 rounded-md">Simulation Tycoon</span>
                                    <span className="text-[10px] font-bold text-warm-cocoa/50 group-hover:text-warm-cocoa transition-colors flex items-center gap-0.5">Play Game →</span>
                                </div>
                            </div>

                            {/* Galilee Fishing */}
                            <div
                                onClick={() => setActiveTab("galileefishing")}
                                className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white/60 hover:bg-white/90 border border-white/80 hover:border-sky-200/50 transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer overflow-hidden text-left"
                            >
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-sky-100/30 to-amber-100/20 rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                                <div>
                                    <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center text-lg mb-3 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                        🎣
                                    </div>
                                    <h5 className="font-serif text-sm font-bold text-warm-cocoa mb-1">Fishers of Faith</h5>
                                    <p className="text-[10px] text-warm-grey/50 leading-normal mb-3">
                                        Cast your line on the Sea of Galilee, catch scripture treasures, collect pearls, and fill a peaceful biblical fishing journal.
                                    </p>
                                </div>
                                <div className="flex items-center justify-between border-t border-stone-200/20 pt-2.5 mt-2">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-sky-600/70 bg-sky-50 px-2 py-0.5 rounded-md">Biblical Fishing</span>
                                    <span className="text-[10px] font-bold text-warm-cocoa/50 group-hover:text-warm-cocoa transition-colors flex items-center gap-0.5">Play Game →</span>
                                </div>
                            </div>

                            {/* Multiplayer Games Link Card */}
                            <Link
                                href="/minigames/multiplayer"
                                className="group relative flex flex-col justify-between p-5 rounded-3xl bg-white/60 hover:bg-white/90 border border-white/80 hover:border-rose-250/40 transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-pointer overflow-hidden text-left sm:col-span-2"
                            >
                                <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-rose-100/20 to-transparent rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                                <div>
                                    <div className="w-10 h-10 rounded-2xl bg-rose-100/60 text-muted-rose flex items-center justify-center text-lg mb-3 shadow-inner group-hover:scale-105 transition-transform duration-300">
                                        👥
                                    </div>
                                    <h5 className="font-serif text-sm font-bold text-warm-cocoa mb-1">Multiplayer Lobby</h5>
                                    <p className="text-[10px] text-warm-grey/50 leading-normal mb-3">
                                        Connect with other sisters in real-time. Invite them to play cozy card games or co-op matches.
                                    </p>
                                </div>
                                <div className="flex items-center justify-between border-t border-stone-200/20 pt-2.5 mt-2">
                                    <span className="text-[9px] uppercase tracking-wider font-bold text-rose-700/70 bg-rose-50 px-2 py-0.5 rounded-md">Real-Time Hub</span>
                                    <span className="text-[10px] font-bold text-warm-cocoa/50 group-hover:text-warm-cocoa transition-colors flex items-center gap-0.5">Enter Lobby →</span>
                                </div>
                            </Link>
                        </div>
                    </div>
                ) : (
                    // ------------------ Active Single-Player Game View ------------------
                    <div className="flex flex-col gap-4 animate-fade-in">
                        {activeTab !== "gracealchemy" && (
                            <button
                                onClick={() => setActiveTab("lobby")}
                                className="self-start flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/60 hover:bg-white border border-stone-200/40 text-xs text-warm-cocoa font-bold transition-all shadow-sm hover:scale-[1.02] active:scale-95 duration-200 cursor-pointer mb-2"
                            >
                                ← Back to Lobby
                            </button>
                        )}

                        {activeTab === "blockblast" && <BlockBlast />}
                        {activeTab === "crosswords" && <Crosswords />}
                        {activeTab === "wordsearch" && <WordSearch />}
                        {activeTab === "sudoku" && <Sudoku />}
                        {activeTab === "gracealchemy" && <GraceAlchemy onBack={() => setActiveTab("lobby")} />}
                        {activeTab === "memorymatch" && <MemoryMatch />}
                        {activeTab === "garden" && <GardenGrid />}
                        {activeTab === "mytalkinglamb" && <MyTalkingLamb />}
                        {activeTab === "gracecafe" && <GraceCafe />}
                        {activeTab === "galileefishing" && <GalileeFishing />}
                        {activeTab === "scriptureflashcards" && <ScriptureFlashcards onBack={() => setActiveTab("lobby")} />}
                    </div>
                )}
            </div>
        </div>
    );
}
