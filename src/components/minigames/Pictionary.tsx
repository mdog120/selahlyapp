"use client";

import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Eraser, Send, Trash, Edit, Star, Clock } from "lucide-react";

// Web Audio sound chimes
const playChime = (type: "correct" | "draw" | "time-up") => {
    if (typeof window === "undefined") return;
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        if (type === "correct") {
            // Arpeggio chime
            const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
                gain.gain.setValueAtTime(0.04, ctx.currentTime + idx * 0.08);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.2);
                osc.start(ctx.currentTime + idx * 0.08);
                osc.stop(ctx.currentTime + idx * 0.08 + 0.2);
            });
        } else if (type === "time-up") {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        }
    } catch (e) {
        console.error("Audio chime error:", e);
    }
};

const WORDS_DB = [
    { word: "NOAHS ARK", hint: "A giant wooden vessel with pairs of animals 🦁" },
    { word: "CROSS", hint: "The wooden symbol of salvation and crucifixion ✝️" },
    { word: "RED SEA", hint: "Water parted by Moses with his staff 🌊" },
    { word: "EDEN", hint: "The first garden home with the tree of life 🍎" },
    { word: "ANGEL", hint: "A heavenly messenger with wings and light 👼" },
    { word: "OLIVE BRANCH", hint: "Brought back by a dove indicating dry land 🕊️" },
    { word: "RAINBOW", hint: "God's sign of covenant promise in the sky 🌈" },
    { word: "BREAD AND FISH", hint: "Multiplied by Jesus to feed 5,000 people 🍞" },
    { word: "MANGER", hint: "A feed trough where baby Jesus was laid 🌟" },
    { word: "DAVIDS SLING", hint: "Used to defeat a giant with a smooth stone 🪨" },
    { word: "MOSES", hint: "Found in a basket, led Israel out of Egypt 🧺" },
    { word: "STAR OF BETHLEHEM", hint: "Guided the wise men to Jesus 🌟" },
];

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

export function Pictionary({ 
    roomId, 
    userId,
    userName: initialUserName 
}: { 
    roomId: string; 
    userId: string;
    userName: string;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const supabase = createClient();

    const [players, setPlayers] = useState<{ id: string; name: string; score: number }[]>([]);
    const [drawerId, setDrawerId] = useState<string>("");
    const [secretWord, setSecretWord] = useState<string>("");
    const [hint, setHint] = useState<string>("");
    
    const [guessInput, setGuessInput] = useState("");
    const [chatLogs, setChatLogs] = useState<{ id: string; sender: string; text: string; system?: boolean }[]>([]);
    
    const [timeRemaining, setTimeRemaining] = useState(60);
    const [gameStarted, setGameStarted] = useState(false);

    // Brush config
    const [brushColor, setBrushColor] = useState("#665A54"); // Charcoal Cocoa
    const [brushSize, setBrushSize] = useState(4);
    const [isDrawingTool, setIsDrawingTool] = useState(true);

    const isDrawing = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const timerRef = useRef<any>(null);
    const channelRef = useRef<any>(null);

    const pictionaryStateRef = useRef({
        players: [] as { id: string; name: string; score: number }[],
        drawerId: "",
        secretWord: "",
        gameStarted: false,
    });

    useEffect(() => {
        pictionaryStateRef.current = { players, drawerId, secretWord, gameStarted };
    }, [players, drawerId, secretWord, gameStarted]);

    // Fetch user details
    const myName = initialUserName || "Sister";

    // Initialize Real-time channel and presence
    useEffect(() => {
        const channel = supabase.channel(`pictionary:${roomId}`, {
            config: {
                presence: {
                    key: userId,
                },
            },
        });
        channelRef.current = channel;

        // Listen for canvas sync, game turns, guesses, and chat
        channel
            .on("broadcast", { event: "draw-stroke" }, (payload: any) => {
                drawStrokeOnCanvas(payload.payload);
            })
            .on("broadcast", { event: "canvas-clear" }, () => {
                clearCanvasLocally();
            })
            .on("broadcast", { event: "chat" }, (payload: any) => {
                setChatLogs(prev => [...prev, payload.payload]);
            })
            .on("broadcast", { event: "turn-sync" }, (payload: any) => {
                const data = payload.payload;
                setDrawerId(data.drawerId);
                setSecretWord(data.drawerId === userId ? data.word : "");
                setHint(data.hint);
                setTimeRemaining(60);
                setGameStarted(true);
                clearCanvasLocally();
                setChatLogs(prev => [...prev, {
                    id: Math.random().toString(),
                    sender: "System",
                    text: `A new round started! ${data.drawerName} is drawing.`,
                    system: true
                }]);
            })
            .on("broadcast", { event: "round-success" }, (payload: any) => {
                const data = payload.payload;
                playChime("correct");
                setChatLogs(prev => [...prev, {
                    id: Math.random().toString(),
                    sender: "System",
                    text: `✨ Correct guess! ${data.guesserName} guessed "${data.word}"! (+10 pts)`,
                    system: true
                }]);
                
                // Update local scores
                setPlayers(prev => prev.map(p => 
                    p.id === data.guesserId 
                        ? { ...p, score: p.score + 10 } 
                        : (p.id === data.drawerId ? { ...p, score: p.score + 5 } : p)
                ));
            })
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                const syncedPlayers = Object.keys(state).map(id => {
                    const pres = state[id] && state[id][0] as any;
                    return {
                        id,
                        name: (pres && pres.name) || "Sister",
                        score: (pres && pres.score) || 0
                    };
                });
                setPlayers(syncedPlayers);
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({
                        name: myName,
                        score: 0,
                    });
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [roomId, userId]);

    // Timer countdown loop (run by Drawer only, who acts as the round controller)
    useEffect(() => {
        if (!gameStarted || drawerId !== userId) {
            clearInterval(timerRef.current);
            return;
        }

        timerRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleTimeExpired();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [gameStarted, drawerId, secretWord]);

    const handleTimeExpired = () => {
        playChime("time-up");
        setChatLogs(prev => [...prev, {
            id: Math.random().toString(),
            sender: "System",
            text: `⏳ Time's up! The word was "${secretWord}".`,
            system: true
        }]);

        // Automatically rotate turn
        rotateTurn();
    };

    // Rotate turn (called by active Drawer)
    const rotateTurn = () => {
        const { players: currentPlayers } = pictionaryStateRef.current;
        if (currentPlayers.length < 2) return;
        
        // Find next player index
        const currentIdx = currentPlayers.findIndex(p => p.id === userId);
        const nextIdx = (currentIdx + 1) % currentPlayers.length;
        const nextPlayer = currentPlayers[nextIdx];

        // Pick random secret word
        const randomTerm = WORDS_DB[Math.floor(Math.random() * WORDS_DB.length)];

        channelRef.current?.send({
            type: "broadcast",
            event: "turn-sync",
            payload: {
                drawerId: nextPlayer.id,
                drawerName: nextPlayer.name,
                word: randomTerm.word,
                hint: randomTerm.hint
            }
        });

        // Set local state directly
        setDrawerId(nextPlayer.id);
        setSecretWord(nextPlayer.id === userId ? randomTerm.word : "");
        setHint(randomTerm.hint);
        setTimeRemaining(60);
        clearCanvasLocally();
    };

    // Canvas drawing helper logic
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (drawerId !== userId || !gameStarted) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        // Calculate coordinates scaled to standard 600x400 aspect ratio space
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;

        isDrawing.current = true;
        lastPos.current = {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing.current || drawerId !== userId || !gameStarted) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;

        const currentPos = {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };

        const strokeData = {
            x1: lastPos.current.x,
            y1: lastPos.current.y,
            x2: currentPos.x,
            y2: currentPos.y,
            color: isDrawingTool ? brushColor : "#FFFFFF",
            size: isDrawingTool ? brushSize : 24
        };

        // Draw locally
        drawStrokeOnCanvas(strokeData);

        // Broadcast line stroke
        channelRef.current?.send({
            type: "broadcast",
            event: "draw-stroke",
            payload: strokeData
        });

        lastPos.current = currentPos;
    };

    const handleMouseUp = () => {
        isDrawing.current = false;
    };

    const drawStrokeOnCanvas = (stroke: any) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;

        // Scale strokes correctly relative to local resolution
        const scale = canvas.width / CANVAS_WIDTH;

        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size * scale;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(stroke.x1 * scale, stroke.y1 * scale);
        ctx.lineTo(stroke.x2 * scale, stroke.y2 * scale);
        ctx.stroke();
    };

    const clearCanvasLocally = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx) return;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const handleClearCanvasClick = () => {
        if (drawerId !== userId) return;
        clearCanvasLocally();
        channelRef.current?.send({
            type: "broadcast",
            event: "canvas-clear",
            payload: {}
        });
    };

    // Chat / Guess Submission
    const handleSendGuess = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guessInput.trim() || !gameStarted) return;

        const cleanGuess = guessInput.trim().toUpperCase();
        setGuessInput("");

        // Broadcast normal chat text
        const log = {
            id: Math.random().toString(),
            sender: myName,
            text: guessInput.trim()
        };
        setChatLogs(prev => [...prev, log]);
        channelRef.current?.send({
            type: "broadcast",
            event: "chat",
            payload: log
        });

        // Check if guess matches secret word (evaluated on Guesser side)
        // Note: The Drawer coordinates round victory when guess is correct
        if (drawerId !== userId && secretWord === "") {
            // Send guess verification request via chat to the drawer
            // Drawer will compare and coordinate "round-success" event
            channelRef.current?.send({
                type: "broadcast",
                event: "chat-guess",
                payload: {
                    guesserId: userId,
                    guesserName: myName,
                    guess: cleanGuess
                }
            });
        }
    };

    // Listen for incoming guesses on Drawer side
    useEffect(() => {
        if (drawerId !== userId || !gameStarted) return;

        const handleGuessVerification = (payload: any) => {
            const data = payload.payload;
            if (data.guess === secretWord) {
                // Correct! Coordinated by Drawer
                channelRef.current?.send({
                    type: "broadcast",
                    event: "round-success",
                    payload: {
                        guesserId: data.guesserId,
                        guesserName: data.guesserName,
                        drawerId: userId,
                        word: secretWord
                    }
                });

                // Update drawer score local state
                setPlayers(prev => prev.map(p => 
                    p.id === data.guesserId 
                        ? { ...p, score: p.score + 10 } 
                        : (p.id === userId ? { ...p, score: p.score + 5 } : p)
                ));

                playChime("correct");
                setChatLogs(prev => [...prev, {
                    id: Math.random().toString(),
                    sender: "System",
                    text: `✨ Correct guess! ${data.guesserName} guessed "${secretWord}"!`,
                    system: true
                }]);

                // Clear timer and advance to next drawer
                clearInterval(timerRef.current);
                setTimeout(() => {
                    rotateTurn();
                }, 2000);
            }
        };

        const channel = channelRef.current;
        if (channel) {
            channel.on("broadcast", { event: "chat-guess" }, handleGuessVerification);
        }

        return () => {
            if (channel) {
                channel.off("broadcast", { event: "chat-guess" }, handleGuessVerification);
            }
        };
    }, [drawerId, secretWord, gameStarted, players]);

    // Force start game (called by Host / first player)
    const handleForceStart = () => {
        if (players.length < 2) {
            alert("Waiting for at least 2 players to start Pictionary!");
            return;
        }

        const randomTerm = WORDS_DB[Math.floor(Math.random() * WORDS_DB.length)];
        
        channelRef.current?.send({
            type: "broadcast",
            event: "turn-sync",
            payload: {
                drawerId: userId,
                drawerName: myName,
                word: randomTerm.word,
                hint: randomTerm.hint
            }
        });

        setDrawerId(userId);
        setSecretWord(randomTerm.word);
        setHint(randomTerm.hint);
        setTimeRemaining(60);
        setGameStarted(true);
        clearCanvasLocally();
    };

    const isMyTurn = drawerId === userId;

    return (
        <div className="flex flex-col lg:flex-row gap-6 max-w-5xl mx-auto w-full select-none text-left">
            {/* Sidebar scoreboard */}
            <div className="w-full lg:w-56 bg-white/40 border border-warm-grey/5 p-4 rounded-3xl shadow-sm flex flex-col gap-4">
                <h5 className="font-serif text-sm font-bold text-warm-cocoa border-b border-warm-grey/5 pb-2">
                    Sisters Joined ({players.length})
                </h5>
                <div className="space-y-2">
                    {players.map(p => (
                        <div 
                            key={p.id} 
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
                                p.id === drawerId 
                                    ? "bg-rose-50 border-rose-200 text-muted-rose" 
                                    : "bg-white/60 border-stone-200/30 text-warm-grey"
                            }`}
                        >
                            <span className="font-bold truncate max-w-[100px]">
                                {p.name} {p.id === drawerId && "🎨"}
                            </span>
                            <span className="font-mono text-warm-grey/50 font-bold">{p.score} pts</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Canvas / Main game */}
            <div className="flex-1 flex flex-col bg-white/40 p-6 border border-warm-grey/5 rounded-3xl shadow-sm gap-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h4 className="font-serif text-lg font-bold text-warm-cocoa">Sisters Sketch</h4>
                        {gameStarted && (
                            <p className="text-[10px] text-warm-grey/50 font-bold uppercase tracking-wider mt-0.5">
                                {isMyTurn 
                                    ? `Secret Word: "${secretWord}"` 
                                    : `Clue: ${hint}`}
                            </p>
                        )}
                    </div>
                    {gameStarted && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-warm-cocoa bg-stone-100/60 border border-stone-200/40 px-3 py-1.5 rounded-full shadow-inner">
                            <Clock className="w-3.5 h-3.5 text-warm-grey/40" /> {timeRemaining}s
                        </div>
                    )}
                </div>

                {/* Draw Canvas container */}
                <div className="relative w-full aspect-[3/2] max-w-[600px] border border-stone-200/40 rounded-3xl overflow-hidden bg-white shadow-inner">
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className={`w-full h-full block bg-white ${isMyTurn ? "cursor-crosshair" : "cursor-not-allowed"}`}
                    />

                    {/* Start overlay */}
                    {!gameStarted && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-center p-6">
                            <div className="w-14 h-14 rounded-full bg-soft-blush/30 flex items-center justify-center text-xl shadow-sm">🎨</div>
                            <h4 className="font-serif text-lg font-bold text-warm-cocoa">Sisters Sketch (Pictionary)</h4>
                            <p className="text-[10px] text-warm-grey/50 max-w-xs leading-normal">
                                Gather at least 2 sisters in the room to play. One player draws a secret Bible term, while others guess in real-time chat!
                            </p>
                            <Button 
                                onClick={handleForceStart}
                                className="bg-warm-cocoa text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md hover:scale-[1.02] transition-all flex items-center gap-1.5 active-press-shrink"
                            >
                                Start Drawing 🚀
                            </Button>
                        </div>
                    )}
                </div>

                {/* Brush controls for Drawer */}
                {isMyTurn && gameStarted && (
                    <div className="w-full max-w-[600px] flex items-center justify-between bg-stone-50/60 border border-stone-200/20 p-3 rounded-2xl flex-wrap gap-3">
                        <div className="flex gap-1.5 items-center">
                            <button
                                onClick={() => setIsDrawingTool(true)}
                                className={`p-1.5 rounded-xl border transition-all ${
                                    isDrawingTool 
                                        ? "bg-white border-rose-200 text-muted-rose shadow-sm scale-105" 
                                        : "bg-transparent border-transparent text-warm-grey/50"
                                }`}
                                title="Brush"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsDrawingTool(false)}
                                className={`p-1.5 rounded-xl border transition-all ${
                                    !isDrawingTool 
                                        ? "bg-white border-rose-200 text-muted-rose shadow-sm scale-105" 
                                        : "bg-transparent border-transparent text-warm-grey/50"
                                }`}
                                title="Eraser"
                            >
                                <Eraser className="w-4 h-4" />
                            </button>
                            <button
                                onClick={handleClearCanvasClick}
                                className="p-1.5 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors border border-transparent"
                                title="Clear Board"
                            >
                                <Trash className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Brush colors */}
                        {isDrawingTool && (
                            <div className="flex gap-1.5">
                                {["#665A54", "#EAA79E", "#93C572", "#9ECAEA", "#EAD89E", "#BCA7EA"].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setBrushColor(c)}
                                        style={{ backgroundColor: c }}
                                        className={`w-6 h-6 rounded-full border border-white/80 shadow-sm transition-all hover:scale-110 active:scale-95 ${
                                            brushColor === c ? "ring-2 ring-warm-cocoa scale-110" : ""
                                        }`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Brush sizes */}
                        <div className="flex items-center gap-2 text-[10px] font-bold text-warm-grey/60">
                            <span>Size</span>
                            <input
                                type="range"
                                min={1}
                                max={20}
                                value={brushSize}
                                onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                                className="w-20 accent-muted-rose h-1 bg-stone-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="font-mono text-warm-grey/40">{brushSize}px</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Chat guessing side panel */}
            <div className="w-full lg:w-72 bg-white/40 border border-warm-grey/5 p-4 rounded-3xl shadow-sm flex flex-col h-[400px] lg:h-auto">
                <h5 className="font-serif text-sm font-bold text-warm-cocoa border-b border-warm-grey/5 pb-2 mb-3">
                    Game Chat & Guesses
                </h5>
                
                {/* Chat Log logs list */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-1 custom-scrollbar text-xs">
                    {chatLogs.map((log) => {
                        if (log.system) {
                            return (
                                <div key={log.id} className="text-center italic text-muted-rose font-bold py-1 bg-rose-50/50 rounded-lg">
                                    {log.text}
                                </div>
                            );
                        }
                        return (
                            <div key={log.id} className="p-2 rounded-xl bg-white/60 border border-stone-200/25">
                                <span className="font-bold text-warm-cocoa block mb-0.5">{log.sender}</span>
                                <span className="text-warm-grey leading-relaxed">{log.text}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Guess input form */}
                <form onSubmit={handleSendGuess} className="flex gap-2">
                    <input
                        type="text"
                        value={guessInput}
                        onChange={(e) => setGuessInput(e.target.value)}
                        placeholder={isMyTurn ? "You are drawing..." : "Type guess..."}
                        disabled={isMyTurn || !gameStarted}
                        className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/80 border border-stone-200/40 focus:outline-none text-warm-grey placeholder:text-warm-grey/40"
                    />
                    <Button 
                        type="submit" 
                        disabled={isMyTurn || !gameStarted || !guessInput.trim()}
                        className="bg-warm-cocoa text-white p-2.5 rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0"
                    >
                        <Send className="w-3.5 h-3.5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
