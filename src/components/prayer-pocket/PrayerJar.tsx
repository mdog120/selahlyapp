"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Sparkles, X, Clock, HelpCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Prayer = {
    id: string;
    content: string;
    is_anonymous: boolean;
    pray_count: number;
    created_at: string;
    profiles: {
        first_name: string;
        last_name: string;
        username: string;
    } | null;
    user_prayed?: boolean;
};

interface PrayerJarProps {
    prayers: Prayer[];
    onPray: (id: string) => void;
}

interface Particle {
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    angle: number;
    speed: number;
    alpha: number;
    pulseSpeed: number;
    pulseDir: number;
    userPrayed: boolean;
}

export function PrayerJar({ prayers, onPray }: PrayerJarProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [selectedPrayerId, setSelectedPrayerId] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

    const particlesRef = useRef<Particle[]>([]);

    // Find the currently selected prayer
    const selectedPrayer = prayers.find((p) => p.id === selectedPrayerId);

    // Initialize or update particles when prayers list changes
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;

        const existingParticles = particlesRef.current;
        const newParticles: Particle[] = [];

        // Map prayers to particles. We keep existing particles' positions if they still exist.
        prayers.forEach((prayer) => {
            const existing = existingParticles.find((p) => p.id === prayer.id);
            if (existing) {
                // Keep existing particle but update its userPrayed state
                existing.userPrayed = !!prayer.user_prayed;
                newParticles.push(existing);
            } else {
                // Create a new particle at a random valid spot in the jar
                const radius = 5 + Math.random() * 3.5;
                const speed = 0.2 + Math.random() * 0.3;
                
                // Choose a random Y in the body of the jar
                const y = 80 + Math.random() * (height - 120);
                const halfWidth = getJarWidthAtY(y, height, width);
                const x = centerX + (Math.random() - 0.5) * halfWidth * 1.8;

                newParticles.push({
                    id: prayer.id,
                    x,
                    y,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: (Math.random() - 0.5) * 0.4,
                    radius,
                    angle: Math.random() * Math.PI * 2,
                    speed,
                    alpha: 0.3 + Math.random() * 0.7,
                    pulseSpeed: 0.01 + Math.random() * 0.02,
                    pulseDir: Math.random() > 0.5 ? 1 : -1,
                    userPrayed: !!prayer.user_prayed,
                });
            }
        });

        particlesRef.current = newParticles;
    }, [prayers]);

    // Jar shape boundary helper: returns half-width of the jar at a given Y coordinate
    const getJarWidthAtY = (y: number, height: number, width: number): number => {
        const neckY = height * 0.22;
        const shoulderY = height * 0.32;
        const padding = 28;

        if (y < neckY) {
            // Jar neck (narrow)
            return (width * 0.48) / 2 - padding;
        } else if (y < shoulderY) {
            // Transition from neck to body (shoulder curve)
            const t = (y - neckY) / (shoulderY - neckY);
            const w = width * 0.48 + t * (width * 0.36); // expands to width * 0.84
            return w / 2 - padding;
        } else {
            // Body of the jar (curved bottom)
            const bodyHeight = height - shoulderY;
            const bodyY = y - shoulderY;
            if (bodyY > bodyHeight * 0.8) {
                // Curve in bottom corners
                const t = (bodyY - bodyHeight * 0.8) / (bodyHeight * 0.2);
                const curve = Math.sqrt(Math.max(0, 1 - t * t));
                return (width * 0.86 / 2 * curve) - padding;
            }
            return (width * 0.86) / 2 - padding;
        }
    };

    // Canvas rendering & physics loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;

        const updateFrame = () => {
            const width = canvas.width;
            const height = canvas.height;
            const centerX = width / 2;

            ctx.clearRect(0, 0, width, height);

            const particles = particlesRef.current;

            particles.forEach((p) => {
                // 1. Gentle drift (Sine wave + slight noise)
                p.angle += p.pulseSpeed;
                p.vx += Math.sin(p.angle) * 0.01;
                p.vy += Math.cos(p.angle) * 0.01;

                // 2. Mouse Repulsion Force
                if (mousePos) {
                    const dx = p.x - mousePos.x;
                    const dy = p.y - mousePos.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const forceRadius = 75;

                    if (dist < forceRadius) {
                        const force = (forceRadius - dist) / forceRadius;
                        const angle = Math.atan2(dy, dx);
                        // Push away
                        p.vx += Math.cos(angle) * force * 0.15;
                        p.vy += Math.sin(angle) * force * 0.15;
                    }
                }

                // Apply drag & speed cap
                const speedCap = p.userPrayed ? 1.2 : 0.7;
                p.vx *= 0.95;
                p.vy *= 0.95;

                const curSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (curSpeed > speedCap) {
                    p.vx = (p.vx / curSpeed) * speedCap;
                    p.vy = (p.vy / curSpeed) * speedCap;
                }

                // Update position
                p.x += p.vx;
                p.y += p.vy;

                // 3. Boundary Collisions (Stay inside the jar)
                const minY = 62; // top lid level
                const maxY = height - 32; // bottom curve level
                const halfWidth = getJarWidthAtY(p.y, height, width);
                const minX = centerX - halfWidth;
                const maxX = centerX + halfWidth;

                // Bounce off top/bottom
                if (p.y < minY) {
                    p.y = minY;
                    p.vy = Math.abs(p.vy) * 0.8;
                } else if (p.y > maxY) {
                    p.y = maxY;
                    p.vy = -Math.abs(p.vy) * 0.8;
                }

                // Bounce off curved walls
                if (p.x < minX) {
                    p.x = minX;
                    p.vx = Math.abs(p.vx) * 0.8;
                } else if (p.x > maxX) {
                    p.x = maxX;
                    p.vx = -Math.abs(p.vx) * 0.8;
                }

                // 4. Glow Alpha Pulsing
                p.alpha += p.pulseSpeed * p.pulseDir;
                if (p.alpha > 0.95) {
                    p.alpha = 0.95;
                    p.pulseDir = -1;
                } else if (p.alpha < 0.25) {
                    p.alpha = 0.25;
                    p.pulseDir = 1;
                }

                // 5. Draw Particle Glow
                ctx.save();
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

                // Setup dynamic glow based on state
                // Amber/yellow for standard, beautiful rose-pink for prayed-for requests
                const colorHex = p.userPrayed ? "212, 165, 165" : "245, 158, 11"; // rgb soft-rose vs amber
                const glowRadius = p.userPrayed ? p.radius * 3.5 : p.radius * 2.2;
                
                ctx.shadowBlur = glowRadius;
                ctx.shadowColor = `rgba(${colorHex}, ${p.alpha})`;

                // Gradient core
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
                grad.addColorStop(0, "#ffffff");
                grad.addColorStop(0.3, p.userPrayed ? "rgba(235, 190, 190, 1)" : "rgba(251, 191, 36, 1)");
                grad.addColorStop(1, p.userPrayed ? "rgba(212, 165, 165, 0)" : "rgba(245, 158, 11, 0)");

                ctx.fillStyle = grad;
                ctx.fill();
                ctx.restore();
            });

            animationFrameId = requestAnimationFrame(updateFrame);
        };

        updateFrame();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [mousePos]);

    // Handle cursor tracking inside canvas
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            setMousePos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    };

    const handleMouseLeave = () => {
        setMousePos(null);
    };

    // Click on canvas to select the nearest firefly
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Find nearest particle
        const particles = particlesRef.current;
        let nearest: Particle | null = null;
        let minDist = 25; // max click threshold in pixels

        particles.forEach((p) => {
            const dx = p.x - clickX;
            const dy = p.y - clickY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
                minDist = dist;
                nearest = p;
            }
        });

        if (nearest) {
            setSelectedPrayerId((nearest as Particle).id);
        } else {
            // Clicked empty space: clear selection
            setSelectedPrayerId(null);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full mb-10" ref={containerRef}>
            {/* The Visual Jar Assembly */}
            <div className="relative w-[320px] h-[400px] flex items-center justify-center filter drop-shadow-[0_10px_25px_rgba(141,123,104,0.15)] select-none">
                {/* SVG Glass Jar Overlay Layer */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    viewBox="0 0 320 400"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Cork Lid */}
                    <path
                        d="M120 42 C120 38, 200 38, 200 42 L196 52 C196 54, 124 54, 124 52 Z"
                        fill="#A88B70"
                        stroke="#8B6F57"
                        strokeWidth="1.5"
                    />
                    {/* Gold Rim Band */}
                    <rect x="114" y="52" width="92" height="6" rx="2" fill="#EAB308" opacity="0.8" />
                    
                    {/* Glass Jar Body Outline */}
                    {/* Neck -> Shoulder -> Body -> Rounded Bottom */}
                    <path
                        d="M116 58 
                           C116 70, 114 74, 114 84
                           C114 86, 92 108, 88 128
                           C82 150, 80 180, 80 280
                           C80 348, 86 376, 120 376
                           L200 376
                           C234 376, 240 348, 240 280
                           C240 180, 238 150, 232 128
                           C228 108, 206 86, 206 84
                           C206 74, 204 70, 204 58"
                        stroke="rgba(255, 255, 255, 0.85)"
                        strokeWidth="2.5"
                    />
                    
                    {/* Soft Inner Glow (creates depth) */}
                    <path
                        d="M117 60 
                           C117 72, 115 76, 115 86
                           C115 88, 93 110, 89 130
                           C83 152, 81 182, 81 280
                           C81 346, 87 374, 120 374
                           L200 374
                           C233 374, 239 346, 239 280
                           C239 182, 237 152, 231 130
                           C227 110, 205 88, 205 86
                           C205 76, 203 72, 203 60"
                        stroke="rgba(255, 255, 255, 0.35)"
                        strokeWidth="6"
                    />

                    {/* Gloss Glare Highlight (Left Side) */}
                    <path
                        d="M92 144 C88 180, 88 280, 94 340"
                        stroke="rgba(255, 255, 255, 0.4)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />

                    {/* Gloss Glare Highlight (Right Side) */}
                    <path
                        d="M228 144 C232 180, 232 280, 226 340"
                        stroke="rgba(255, 255, 255, 0.15)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />

                    {/* Twine Bow Ribbon Ribbon on Neck */}
                    <path
                        d="M115 78 Q160 84 205 78"
                        stroke="#A88B70"
                        strokeWidth="2"
                    />
                    {/* Cute bow loop details */}
                    <path
                        d="M160 81 C154 75, 146 72, 148 81 C150 90, 158 84, 160 81 Z"
                        stroke="#A88B70"
                        strokeWidth="1.5"
                        fill="rgba(168, 139, 112, 0.1)"
                    />
                    <path
                        d="M160 81 C166 75, 174 72, 172 81 C170 90, 162 84, 160 81 Z"
                        stroke="#A88B70"
                        strokeWidth="1.5"
                        fill="rgba(168, 139, 112, 0.1)"
                    />
                </svg>

                {/* Canvas Render Element */}
                <canvas
                    ref={canvasRef}
                    width={320}
                    height={400}
                    className="absolute inset-0 bg-stone-900/5 backdrop-blur-[0.5px] rounded-[3rem] cursor-pointer"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleCanvasClick}
                />

                {/* Background Jar Ambient Glow */}
                <div className="absolute inset-x-12 inset-y-16 bg-radial-gradient from-amber-500/10 via-rose-400/5 to-transparent filter blur-2xl pointer-events-none rounded-full" />
                
                {/* Floating Hint Text overlay (disappears if a particle is selected) */}
                {!selectedPrayerId && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-[10px] text-white/80 font-bold uppercase tracking-wider flex items-center gap-1.5 pointer-events-none animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        Tap a light to pray
                    </div>
                )}
            </div>

            {/* Selected Prayer Preview Card */}
            {selectedPrayer ? (
                <div className="w-full max-w-md bg-white/80 backdrop-blur-md border border-white/60 shadow-xl rounded-3xl p-5 flex flex-col gap-4 animate-fade-in-up text-left">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-serif ${selectedPrayer.is_anonymous ? "bg-warm-grey/10 text-warm-grey/40" : "bg-soft-blush text-warm-cocoa"}`}>
                                {selectedPrayer.is_anonymous ? "?" : (selectedPrayer.profiles?.first_name?.[0] || "S")}
                            </div>
                            <div>
                                <h4 className="font-bold text-warm-grey text-sm">
                                    {selectedPrayer.is_anonymous ? "Anonymous Sister" : `${selectedPrayer.profiles?.first_name} ${selectedPrayer.profiles?.last_name?.[0] || ""}.`}
                                </h4>
                                <p className="text-[10px] text-warm-grey/40 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(new Date(selectedPrayer.created_at), { addSuffix: true })}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedPrayerId(null)}
                            className="p-1 rounded-full hover:bg-stone-200/50 text-warm-grey/40 hover:text-warm-grey transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <p className="font-serif text-base text-warm-grey leading-relaxed whitespace-pre-wrap italic">
                        "{selectedPrayer.content}"
                    </p>

                    <div className="flex items-center justify-between border-t border-warm-grey/5 pt-3.5 mt-1">
                        <button
                            onClick={() => !selectedPrayer.user_prayed && onPray(selectedPrayer.id)}
                            disabled={selectedPrayer.user_prayed}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${
                                selectedPrayer.user_prayed
                                    ? "bg-sage-green text-white cursor-default shadow-md shadow-sage-green/10"
                                    : "bg-sage-green/10 text-sage-green hover:bg-sage-green hover:text-white active:scale-95"
                            }`}
                        >
                            <Heart className={`w-4 h-4 ${selectedPrayer.user_prayed ? "fill-current" : ""}`} />
                            <span className="text-xs font-bold uppercase tracking-wider">
                                {selectedPrayer.user_prayed ? "Prayed" : "I'm Praying"}
                            </span>
                        </button>

                        {(selectedPrayer.pray_count > 0 || selectedPrayer.user_prayed) && (
                            <span className="text-xs text-warm-grey/50 font-bold uppercase tracking-wider">
                                ✨ {selectedPrayer.pray_count || (selectedPrayer.user_prayed ? 1 : 0)} Praying
                            </span>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
