"use client";

import React, { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Play, Users, Bot, RefreshCw } from "lucide-react";

// Web Audio API Beep synthesizer (no file dependencies)
const playBeep = (type: "hit" | "wall" | "score") => {
    if (typeof window === "undefined") return;
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === "hit") {
            osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } else if (type === "wall") {
            osc.frequency.setValueAtTime(330, ctx.currentTime); // E4
            gain.gain.setValueAtTime(0.03, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } else if (type === "score") {
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        }
    } catch (e) {
        console.error("Audio Web Synth error:", e);
    }
};

const WIDTH = 600;
const HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 8;
const WINNING_SCORE = 5;

export function Pong({ 
    roomId, 
    userId,
    isHost: initialIsHost 
}: { 
    roomId?: string; 
    userId?: string;
    isHost?: boolean;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const supabase = createClient();

    // Mode: "solo" or "multiplayer"
    const isMultiplayer = !!roomId;
    const isHost = isMultiplayer ? initialIsHost : true;

    const [gameStarted, setGameStarted] = useState(false);
    const [score, setScore] = useState({ left: 0, right: 0 });
    const [winner, setWinner] = useState<"left" | "right" | null>(null);

    // Paddle positions (0 to HEIGHT - PADDLE_HEIGHT)
    const paddle1Y = useRef(HEIGHT / 2 - PADDLE_HEIGHT / 2); // Left (Host / Solo Player)
    const paddle2Y = useRef(HEIGHT / 2 - PADDLE_HEIGHT / 2); // Right (Guest / AI)

    // Ball state (Host only calculates this)
    const ballX = useRef(WIDTH / 2);
    const ballY = useRef(HEIGHT / 2);
    const ballVX = useRef(4);
    const ballVY = useRef(3);

    // Sync ref values for rendering loop
    const scores = useRef({ left: 0, right: 0 });

    const keyState = useRef<{ [key: string]: boolean }>({});
    const animationFrameId = useRef<number | null>(null);
    const channelRef = useRef<any>(null);

    // Reset game state
    const resetBall = () => {
        ballX.current = WIDTH / 2;
        ballY.current = HEIGHT / 2;
        // Randomize direction
        ballVX.current = (Math.random() > 0.5 ? 4 : -4);
        ballVY.current = (Math.random() > 0.5 ? 2.5 : -2.5) * (Math.random() * 0.5 + 0.8);
    };

    const resetGame = () => {
        scores.current = { left: 0, right: 0 };
        setScore({ left: 0, right: 0 });
        setWinner(null);
        paddle1Y.current = HEIGHT / 2 - PADDLE_HEIGHT / 2;
        paddle2Y.current = HEIGHT / 2 - PADDLE_HEIGHT / 2;
        resetBall();
        setGameStarted(false);
    };

    // Keyboard event listeners
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            keyState.current[e.key] = true;
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            keyState.current[e.key] = false;
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    // Multiplayer real-time syncing setup
    useEffect(() => {
        if (!isMultiplayer || !roomId) return;

        const channel = supabase.channel(`pong:${roomId}`);
        channelRef.current = channel;

        // Listen for peer movements and game updates
        channel
            .on("broadcast", { event: "paddle-move" }, (payload: any) => {
                if (isHost) {
                    // Host receives guest paddle (Right)
                    paddle2Y.current = payload.payload.y;
                } else {
                    // Guest receives host paddle (Left)
                    paddle1Y.current = payload.payload.y;
                }
            })
            .on("broadcast", { event: "game-sync" }, (payload: any) => {
                if (!isHost) {
                    // Guest receives synced ball and scores
                    ballX.current = payload.payload.bx;
                    ballY.current = payload.payload.by;
                    scores.current = payload.payload.score;
                    setScore({ ...payload.payload.score });
                    paddle1Y.current = payload.payload.p1y;
                    
                    if (payload.payload.beep) {
                        playBeep(payload.payload.beep);
                    }
                }
            })
            .on("broadcast", { event: "game-start" }, () => {
                setGameStarted(true);
            })
            .on("broadcast", { event: "game-over" }, (payload: any) => {
                setWinner(payload.payload.winner);
                setGameStarted(false);
            })
            .subscribe((status) => {
                if (status === "SUBSCRIBED" && isHost) {
                    // Host lets guest know the game is ready
                    channel.send({
                        type: "broadcast",
                        event: "game-start",
                        payload: {}
                    });
                    setGameStarted(true);
                }
            });

        return () => {
            channel.unsubscribe();
        };
    }, [isMultiplayer, roomId, isHost]);

    // Main Game Loops (Physics + Render)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const updatePhysics = () => {
            if (!gameStarted || winner) return;

            // 1. Move Paddles
            // Left paddle (Host / Solo Player)
            if (isHost) {
                if (
                    keyState.current["w"] || 
                    keyState.current["W"] || 
                    keyState.current["ArrowUp"] || 
                    keyState.current["ArrowLeft"]
                ) {
                    paddle1Y.current = Math.max(0, paddle1Y.current - 6);
                }
                if (
                    keyState.current["s"] || 
                    keyState.current["S"] || 
                    keyState.current["ArrowDown"] || 
                    keyState.current["ArrowRight"]
                ) {
                    paddle1Y.current = Math.min(HEIGHT - PADDLE_HEIGHT, paddle1Y.current + 6);
                }
            } else {
                // Guest movement controls
                if (
                    keyState.current["ArrowUp"] || 
                    keyState.current["ArrowLeft"]
                ) {
                    paddle2Y.current = Math.max(0, paddle2Y.current - 6);
                }
                if (
                    keyState.current["ArrowDown"] || 
                    keyState.current["ArrowRight"]
                ) {
                    paddle2Y.current = Math.min(HEIGHT - PADDLE_HEIGHT, paddle2Y.current + 6);
                }
 
                // Send guest movement to host
                channelRef.current?.send({
                    type: "broadcast",
                    event: "paddle-move",
                    payload: { y: paddle2Y.current }
                });
            }

            // Right paddle (Solo AI mode)
            if (!isMultiplayer) {
                // Adaptive AI paddle tracking
                const targetY = ballY.current - PADDLE_HEIGHT / 2;
                const diff = targetY - paddle2Y.current;
                const aiSpeed = 3.8; // Speed limit
                if (Math.abs(diff) > 2) {
                    paddle2Y.current += Math.sign(diff) * Math.min(aiSpeed, Math.abs(diff));
                    paddle2Y.current = Math.max(0, Math.min(HEIGHT - PADDLE_HEIGHT, paddle2Y.current));
                }
            }

            // 2. Ball Physics (Calculated by Host only)
            if (isHost) {
                // Broadcast updates to guest
                let beep: "hit" | "wall" | "score" | null = null;

                ballX.current += ballVX.current;
                ballY.current += ballVY.current;

                // Wall Collisions (Top & Bottom)
                if (ballY.current <= BALL_SIZE) {
                    ballY.current = BALL_SIZE;
                    ballVY.current = -ballVY.current;
                    beep = "wall";
                    playBeep("wall");
                }
                if (ballY.current >= HEIGHT - BALL_SIZE) {
                    ballY.current = HEIGHT - BALL_SIZE;
                    ballVY.current = -ballVY.current;
                    beep = "wall";
                    playBeep("wall");
                }

                // Left Paddle Collision
                if (ballX.current <= PADDLE_WIDTH + BALL_SIZE && ballVX.current < 0) {
                    if (ballY.current >= paddle1Y.current && ballY.current <= paddle1Y.current + PADDLE_HEIGHT) {
                        ballX.current = PADDLE_WIDTH + BALL_SIZE;
                        ballVX.current = -ballVX.current;
                        // Speed up slightly on hits
                        ballVX.current *= 1.05;
                        beep = "hit";
                        playBeep("hit");
                    } else if (ballX.current <= 0) {
                        // Point Right
                        scores.current.right += 1;
                        setScore({ ...scores.current });
                        beep = "score";
                        playBeep("score");
                        
                        if (scores.current.right >= WINNING_SCORE) {
                            setWinner("right");
                            setGameStarted(false);
                            channelRef.current?.send({
                                type: "broadcast",
                                event: "game-over",
                                payload: { winner: "right" }
                            });
                        } else {
                            resetBall();
                        }
                    }
                }

                // Right Paddle Collision
                if (ballX.current >= WIDTH - PADDLE_WIDTH - BALL_SIZE && ballVX.current > 0) {
                    if (ballY.current >= paddle2Y.current && ballY.current <= paddle2Y.current + PADDLE_HEIGHT) {
                        ballX.current = WIDTH - PADDLE_WIDTH - BALL_SIZE;
                        ballVX.current = -ballVX.current;
                        ballVX.current *= 1.05;
                        beep = "hit";
                        playBeep("hit");
                    } else if (ballX.current >= WIDTH) {
                        // Point Left
                        scores.current.left += 1;
                        setScore({ ...scores.current });
                        beep = "score";
                        playBeep("score");

                        if (scores.current.left >= WINNING_SCORE) {
                            setWinner("left");
                            setGameStarted(false);
                            channelRef.current?.send({
                                type: "broadcast",
                                event: "game-over",
                                payload: { winner: "left" }
                            });
                        } else {
                            resetBall();
                        }
                    }
                }

                // Broadcast state to guest
                if (isMultiplayer) {
                    channelRef.current?.send({
                        type: "broadcast",
                        event: "game-sync",
                        payload: {
                            bx: ballX.current,
                            by: ballY.current,
                            score: scores.current,
                            p1y: paddle1Y.current,
                            beep
                        }
                    });
                }
            }
        };

        const draw = () => {
            // Clear board
            ctx.fillStyle = "#FAF9F5"; // Warm Paper matches Selahly
            ctx.fillRect(0, 0, WIDTH, HEIGHT);

            // Draw center divider
            ctx.strokeStyle = "rgba(102, 90, 84, 0.1)"; // Soft cocoa tint
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.moveTo(WIDTH / 2, 0);
            ctx.lineTo(WIDTH / 2, HEIGHT);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw left paddle
            ctx.fillStyle = "#EAA79E"; // Pastel Rose
            ctx.shadowColor = "rgba(0, 0, 0, 0.05)";
            ctx.shadowBlur = 4;
            ctx.fillRect(0, paddle1Y.current, PADDLE_WIDTH, PADDLE_HEIGHT);

            // Draw right paddle
            ctx.fillStyle = "#93C572"; // Soft Pastel Green (Sage/Mint)
            ctx.fillRect(WIDTH - PADDLE_WIDTH, paddle2Y.current, PADDLE_WIDTH, PADDLE_HEIGHT);

            // Draw Ball
            ctx.fillStyle = "#CCA43B"; // Gold pastel accent
            ctx.beginPath();
            ctx.arc(ballX.current, ballY.current, BALL_SIZE, 0, Math.PI * 2);
            ctx.fill();

            // Clean shadow state
            ctx.shadowBlur = 0;
        };

        const loop = () => {
            updatePhysics();
            draw();
            animationFrameId.current = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [gameStarted, winner, isMultiplayer, isHost]);

    // Solo Mouse Track control helper
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!gameStarted || winner) return;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const relativeY = e.clientY - rect.top;
        const boundedY = Math.max(0, Math.min(HEIGHT - PADDLE_HEIGHT, relativeY - PADDLE_HEIGHT / 2));

        if (isHost) {
            paddle1Y.current = boundedY;
            if (isMultiplayer) {
                // Host broadcasts their paddle
                channelRef.current?.send({
                    type: "broadcast",
                    event: "paddle-move",
                    payload: { y: paddle1Y.current }
                });
            }
        } else {
            paddle2Y.current = boundedY;
            // Guest broadcasts their paddle
            channelRef.current?.send({
                type: "broadcast",
                event: "paddle-move",
                payload: { y: paddle2Y.current }
            });
        }
    };

    const triggerGameStart = () => {
        setGameStarted(true);
        if (isMultiplayer) {
            channelRef.current?.send({
                type: "broadcast",
                event: "game-start",
                payload: {}
            });
        }
    };

    return (
        <div className="flex flex-col items-center max-w-2xl mx-auto w-full select-none">
            {/* Header info */}
            <div className="w-full flex items-center justify-between bg-white/40 border border-warm-grey/5 p-4 rounded-2xl mb-4 shadow-sm">
                <div className="flex flex-col items-start">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-warm-grey/40">Score (P1)</span>
                    <span className="text-2xl font-serif text-warm-cocoa font-bold">{score.left}</span>
                </div>
                
                <div className="text-center">
                    <h4 className="font-serif text-sm font-bold text-warm-cocoa">Table Tennis</h4>
                    <span className="text-[9px] uppercase tracking-widest text-warm-grey/40 block">
                        {isMultiplayer ? `Room Match (1v1)` : "Training Mode (vs. Bot)"}
                    </span>
                </div>

                <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-warm-grey/40">Score (P2)</span>
                    <span className="text-2xl font-serif text-warm-cocoa font-bold">{score.right}</span>
                </div>
            </div>

            {/* Main Canvas view */}
            <div className="relative w-full aspect-[3/2] max-w-[600px] border border-stone-200/40 rounded-3xl overflow-hidden shadow-md">
                <canvas
                    ref={canvasRef}
                    width={WIDTH}
                    height={HEIGHT}
                    onMouseMove={handleMouseMove}
                    className="w-full h-full block bg-[#FAF9F5] cursor-none"
                />

                {/* Overlays */}
                {!gameStarted && !winner && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-center z-10 p-6">
                        <div className="w-14 h-14 rounded-full bg-soft-blush/30 flex items-center justify-center text-xl shadow-sm">🏓</div>
                        <h4 className="font-serif text-lg font-bold text-warm-cocoa">Table Tennis Lined up</h4>
                        <p className="text-[10px] text-warm-grey/50 max-w-xs leading-normal">
                            {isMultiplayer 
                                ? (isHost 
                                    ? "Waiting for the invited sister to accept..." 
                                    : "Invited! Accept and click start to begin!")
                                : "Move your cursor vertically on the board to move your paddle. First to 5 points wins!"}
                        </p>
                        
                        {/* Only Host or Solo Player can start the game trigger */}
                        {(isHost || !isMultiplayer) && (
                            <Button 
                                onClick={triggerGameStart}
                                className="bg-warm-cocoa text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md hover:scale-[1.02] transition-all flex items-center gap-1.5 active-press-shrink"
                            >
                                <Play className="w-3.5 h-3.5" /> Start Match
                            </Button>
                        )}
                    </div>
                )}

                {/* Winner screen */}
                {winner && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-center z-10 p-6 animate-fade-in">
                        <div className="w-14 h-14 rounded-full bg-yellow-100 flex items-center justify-center text-xl shadow-sm">🏆</div>
                        <h4 className="font-serif text-lg font-bold text-warm-cocoa">
                            {isMultiplayer 
                                ? ((isHost && winner === "left") || (!isHost && winner === "right") 
                                    ? "Victory is Yours!" 
                                    : "Sister Won the Match!")
                                : (winner === "left" ? "You Beat the Bot!" : "Bot Won the Match!")
                            }
                        </h4>
                        <p className="text-[10px] text-warm-grey/50">
                            Final Score: {score.left} to {score.right}
                        </p>
                        {/* Only Host / Solo can reset */}
                        {(isHost || !isMultiplayer) && (
                            <Button 
                                onClick={resetGame}
                                className="bg-warm-cocoa text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md hover:scale-[1.02] transition-all flex items-center gap-1.5 active-press-shrink"
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> Rematch 🔄
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Controls Info Footer */}
            <div className="text-[10px] text-warm-grey/40 flex gap-4 mt-2">
                <span>🖱️ Move mouse up/down to slide paddle</span>
                <span className="hidden md:inline">|</span>
                <span>Keyboard fallback: W/S or Arrow Keys (Left/Right & Up/Down)</span>
            </div>
        </div>
    );
}
