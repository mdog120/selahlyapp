"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Sparkles, X, Clock } from "lucide-react";
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

interface TrailPoint {
    x: number;
    y: number;
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
    trail: TrailPoint[];
}

interface Sparkle {
    x: number;
    y: number;
    size: number;
    alpha: number;
    fadeSpeed: number;
    fadeDir: number;
}

export function PrayerJar({ prayers, onPray }: PrayerJarProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [selectedPrayerId, setSelectedPrayerId] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

    const particlesRef = useRef<Particle[]>([]);
    const sparklesRef = useRef<Sparkle[]>([]);
    const lastMousePosRef = useRef<{ x: number; y: number } | null>(null);
    const mouseVelocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    // Ambient jar breathing factor
    const ambientAngleRef = useRef<number>(0);

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

        // Map prayers to particles. Keep positions if they still exist.
        prayers.forEach((prayer) => {
            const existing = existingParticles.find((p) => p.id === prayer.id);
            if (existing) {
                existing.userPrayed = !!prayer.user_prayed;
                newParticles.push(existing);
            } else {
                const radius = 5 + Math.random() * 3.5;
                const speed = 0.15 + Math.random() * 0.25;
                
                const y = 90 + Math.random() * (height - 130);
                const halfWidth = getJarWidthAtY(y, height, width);
                const x = centerX + (Math.random() - 0.5) * halfWidth * 1.7;

                newParticles.push({
                    id: prayer.id,
                    x,
                    y,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    radius,
                    angle: Math.random() * Math.PI * 2,
                    speed,
                    alpha: 0.3 + Math.random() * 0.65,
                    pulseSpeed: 0.008 + Math.random() * 0.015,
                    pulseDir: Math.random() > 0.5 ? 1 : -1,
                    userPrayed: !!prayer.user_prayed,
                    trail: [],
                });
            }
        });

        particlesRef.current = newParticles;

        // Initialize background sparkles if empty
        if (sparklesRef.current.length === 0) {
            const sparkles: Sparkle[] = [];
            for (let i = 0; i < 22; i++) {
                const sy = 80 + Math.random() * (height - 120);
                const shalfWidth = getJarWidthAtY(sy, height, width);
                const sx = centerX + (Math.random() - 0.5) * shalfWidth * 1.8;

                sparkles.push({
                    x: sx,
                    y: sy,
                    size: 1 + Math.random() * 1.5,
                    alpha: Math.random() * 0.6,
                    fadeSpeed: 0.005 + Math.random() * 0.008,
                    fadeDir: Math.random() > 0.5 ? 1 : -1,
                });
            }
            sparklesRef.current = sparkles;
        }
    }, [prayers]);

    // Jar shape boundary helper: returns half-width of the jar at a given Y coordinate
    const getJarWidthAtY = (y: number, height: number, width: number): number => {
        const neckY = height * 0.22;
        const shoulderY = height * 0.32;
        const padding = 28;

        if (y < neckY) {
            return (width * 0.48) / 2 - padding;
        } else if (y < shoulderY) {
            const t = (y - neckY) / (shoulderY - neckY);
            const w = width * 0.48 + t * (width * 0.36);
            return w / 2 - padding;
        } else {
            const bodyHeight = height - shoulderY;
            const bodyY = y - shoulderY;
            if (bodyY > bodyHeight * 0.8) {
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

            // Calculate mouse velocity for active stir force
            if (mousePos && lastMousePosRef.current) {
                const dx = mousePos.x - lastMousePosRef.current.x;
                const dy = mousePos.y - lastMousePosRef.current.y;
                // Soft smoothing on velocity
                mouseVelocityRef.current = {
                    x: mouseVelocityRef.current.x * 0.8 + dx * 0.15,
                    y: mouseVelocityRef.current.y * 0.8 + dy * 0.15,
                };
            } else {
                mouseVelocityRef.current = {
                    x: mouseVelocityRef.current.x * 0.9,
                    y: mouseVelocityRef.current.y * 0.9,
                };
            }
            lastMousePosRef.current = mousePos;

            // Clear canvas completely
            ctx.clearRect(0, 0, width, height);

            // 1. Draw Pulsing Ambient Jar Background Aura
            ambientAngleRef.current += 0.006;
            const ambientGlow = 0.08 + Math.sin(ambientAngleRef.current) * 0.03;
            
            ctx.save();
            const bgGrad = ctx.createRadialGradient(
                centerX, height * 0.6, 10,
                centerX, height * 0.6, width * 0.45
            );
            // Multi-layered amber-rose light gradient
            bgGrad.addColorStop(0, `rgba(251, 191, 36, ${ambientGlow})`);
            bgGrad.addColorStop(0.4, `rgba(212, 165, 165, ${ambientGlow * 0.8})`);
            bgGrad.addColorStop(1, "rgba(10, 10, 10, 0)");
            ctx.fillStyle = bgGrad;
            ctx.beginPath();
            ctx.rect(30, 60, width - 60, height - 90);
            ctx.fill();
            ctx.restore();

            // 2. Draw Twinkling Background Sparkles (Stardust)
            const sparkles = sparklesRef.current;
            sparkles.forEach((s) => {
                s.alpha += s.fadeSpeed * s.fadeDir;
                if (s.alpha > 0.65) {
                    s.alpha = 0.65;
                    s.fadeDir = -1;
                } else if (s.alpha < 0.05) {
                    s.alpha = 0.05;
                    s.fadeDir = 1;
                    
                    // Relocate sparkle randomly within jar to keep background fresh
                    const newY = 80 + Math.random() * (height - 120);
                    const shalfWidth = getJarWidthAtY(newY, height, width);
                    s.x = centerX + (Math.random() - 0.5) * shalfWidth * 1.8;
                    s.y = newY;
                    s.size = 1 + Math.random() * 1.8;
                }

                ctx.save();
                ctx.shadowBlur = s.size * 2.5;
                ctx.shadowColor = "rgba(254, 243, 199, 0.8)"; // soft golden twinkle
                ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // 3. Draw & Animate Firefly Particles
            const particles = particlesRef.current;

            particles.forEach((p) => {
                // Record trail history
                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > 5) {
                    p.trail.shift();
                }

                // Gentle sine-wave floating drift
                p.angle += p.pulseSpeed;
                p.vx += Math.sin(p.angle) * 0.008;
                p.vy += Math.cos(p.angle) * 0.008;

                // Mouse Repulsion & Stir Force
                if (mousePos) {
                    const dx = p.x - mousePos.x;
                    const dy = p.y - mousePos.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const forceRadius = 70;

                    if (dist < forceRadius) {
                        const force = (forceRadius - dist) / forceRadius;
                        const angle = Math.atan2(dy, dx);
                        
                        // Repel push
                        p.vx += Math.cos(angle) * force * 0.12;
                        p.vy += Math.sin(angle) * force * 0.12;

                        // Stir momentum: drag particle along with mouse velocity
                        p.vx += mouseVelocityRef.current.x * force * 0.25;
                        p.vy += mouseVelocityRef.current.y * force * 0.25;
                    }
                }

                // Speed cap & drag damping
                const speedCap = p.userPrayed ? 1.5 : 0.85;
                p.vx *= 0.94;
                p.vy *= 0.94;

                const curSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (curSpeed > speedCap) {
                    p.vx = (p.vx / curSpeed) * speedCap;
                    p.vy = (p.vy / curSpeed) * speedCap;
                }

                // Update particle coordinates
                p.x += p.vx;
                p.y += p.vy;

                // Jar Boundaries Collisions
                const minY = 62;
                const maxY = height - 32;
                const halfWidth = getJarWidthAtY(p.y, height, width);
                const minX = centerX - halfWidth;
                const maxX = centerX + halfWidth;

                if (p.y < minY) {
                    p.y = minY;
                    p.vy = Math.abs(p.vy) * 0.7;
                } else if (p.y > maxY) {
                    p.y = maxY;
                    p.vy = -Math.abs(p.vy) * 0.7;
                }

                if (p.x < minX) {
                    p.x = minX;
                    p.vx = Math.abs(p.vx) * 0.7;
                } else if (p.x > maxX) {
                    p.x = maxX;
                    p.vx = -Math.abs(p.vx) * 0.7;
                }

                // Pulsate alpha
                p.alpha += p.pulseSpeed * p.pulseDir;
                if (p.alpha > 0.98) {
                    p.alpha = 0.98;
                    p.pulseDir = -1;
                } else if (p.alpha < 0.2) {
                    p.alpha = 0.2;
                    p.pulseDir = 1;
                }

                const colorHex = p.userPrayed ? "214, 115, 115" : "251, 191, 36"; // glowing rose vs amber gold
                const glowRadius = p.userPrayed ? p.radius * 4.2 : p.radius * 2.8;

                // A. Draw Comet Trails
                p.trail.forEach((pt, index) => {
                    const ratio = (index + 1) / p.trail.length;
                    const trailAlpha = p.alpha * ratio * 0.22;
                    const trailRadius = p.radius * ratio * 0.85;

                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, trailRadius, 0, Math.PI * 2);
                    ctx.shadowBlur = glowRadius * ratio * 0.5;
                    ctx.shadowColor = `rgba(${colorHex}, ${trailAlpha})`;
                    ctx.fillStyle = p.userPrayed ? `rgba(244, 185, 185, ${trailAlpha})` : `rgba(253, 230, 138, ${trailAlpha})`;
                    ctx.fill();
                    ctx.restore();
                });

                // B. Draw Main Firefly Glow - Layer 1 (Wide Outer Glow)
                ctx.save();
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 1.3, 0, Math.PI * 2);
                ctx.shadowBlur = glowRadius * 2.2;
                ctx.shadowColor = `rgba(${colorHex}, ${p.alpha * 0.35})`;
                ctx.fillStyle = p.userPrayed ? `rgba(214, 115, 115, ${p.alpha * 0.2})` : `rgba(251, 191, 36, ${p.alpha * 0.2})`;
                ctx.fill();
                ctx.restore();

                // C. Draw Main Firefly Glow - Layer 2 (Intense Inner Glow)
                ctx.save();
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.shadowBlur = glowRadius * 0.9;
                ctx.shadowColor = `rgba(${colorHex}, ${p.alpha * 0.95})`;

                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
                grad.addColorStop(0, "#ffffff"); // white hot center
                grad.addColorStop(0.3, p.userPrayed ? "rgba(244, 160, 160, 1)" : "rgba(252, 211, 77, 1)");
                grad.addColorStop(1, p.userPrayed ? "rgba(214, 115, 115, 0)" : "rgba(251, 191, 36, 0)");

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
        lastMousePosRef.current = null;
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const particles = particlesRef.current;
        let nearest: Particle | null = null;
        let minDist = 25; // Click radius limit in px

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
            setSelectedPrayerId(null);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full mb-6" ref={containerRef}>
            {/* Elegant 3D Jar Graphic Container */}
            <div className="relative w-[320px] h-[400px] flex items-center justify-center filter drop-shadow-[0_12px_30px_rgba(141,123,104,0.22)] select-none">
                {/* SVG Glass Bottle Overlay */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    viewBox="0 0 320 400"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Cork Top */}
                    <path
                        d="M120 42 C120 38, 200 38, 200 42 L196 52 C196 54, 124 54, 124 52 Z"
                        fill="#B2967D"
                        stroke="#957960"
                        strokeWidth="1.5"
                    />
                    {/* Golden Rim Highlight */}
                    <rect x="114" y="52" width="92" height="6" rx="2" fill="#FBBF24" opacity="0.85" />
                    
                    {/* Frosted Glass Body */}
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
                        stroke="rgba(255, 255, 255, 0.9)"
                        strokeWidth="2.8"
                    />
                    
                    {/* Glass Depth Rim */}
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
                        stroke="rgba(255, 255, 255, 0.38)"
                        strokeWidth="5"
                    />

                    {/* Gloss Highlights (Left Side) */}
                    <path
                        d="M92 144 C88 180, 88 280, 94 340"
                        stroke="rgba(255, 255, 255, 0.45)"
                        strokeWidth="3"
                        strokeLinecap="round"
                    />

                    {/* Gloss Highlights (Right Side) */}
                    <path
                        d="M228 144 C232 180, 232 280, 226 340"
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                    />

                    {/* Twine Rope ribbon */}
                    <path
                        d="M115 78 Q160 84 205 78"
                        stroke="#957960"
                        strokeWidth="2.2"
                    />
                    <path
                        d="M160 81 C154 75, 146 72, 148 81 C150 90, 158 84, 160 81 Z"
                        stroke="#957960"
                        strokeWidth="1.5"
                        fill="rgba(149, 121, 96, 0.15)"
                    />
                    <path
                        d="M160 81 C166 75, 174 72, 172 81 C170 90, 162 84, 160 81 Z"
                        stroke="#957960"
                        strokeWidth="1.5"
                        fill="rgba(149, 121, 96, 0.15)"
                    />
                </svg>

                {/* Canvas Render Node */}
                <canvas
                    ref={canvasRef}
                    width={320}
                    height={400}
                    className="absolute inset-0 bg-stone-900/10 backdrop-blur-[0.4px] rounded-[3.2rem] cursor-pointer"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleCanvasClick}
                />

                {/* Ambient breathing backglow */}
                <div className="absolute inset-x-10 inset-y-14 bg-radial-gradient from-amber-500/15 via-rose-400/5 to-transparent filter blur-3xl pointer-events-none rounded-full" />
                
                {/* Floating prompt overlay */}
                {!selectedPrayerId && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-[9px] text-white/95 font-bold uppercase tracking-widest flex items-center gap-1.5 pointer-events-none animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                        Tap a glowing light to pray
                    </div>
                )}
            </div>

            {/* Selected Prayer Preview Detail Card */}
            {selectedPrayer ? (
                <div className="w-full max-w-md bg-white/90 backdrop-blur-lg border border-white/70 shadow-2xl rounded-[2rem] p-6 flex flex-col gap-4.5 animate-fade-in-up text-left z-20">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className={`w-9.5 h-9.5 rounded-full flex items-center justify-center text-xs font-serif ${selectedPrayer.is_anonymous ? "bg-warm-grey/10 text-warm-grey/40" : "bg-soft-blush text-warm-cocoa"}`}>
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

                    <p className="font-serif text-lg text-warm-grey leading-relaxed whitespace-pre-wrap italic">
                        "{selectedPrayer.content}"
                    </p>

                    <div className="flex items-center justify-between border-t border-warm-grey/5 pt-4 mt-1">
                        <button
                            onClick={() => !selectedPrayer.user_prayed && onPray(selectedPrayer.id)}
                            disabled={selectedPrayer.user_prayed}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all shadow-md ${
                                selectedPrayer.user_prayed
                                    ? "bg-sage-green text-white cursor-default shadow-sage-green/10"
                                    : "bg-sage-green/15 text-sage-green hover:bg-sage-green hover:text-white hover:-translate-y-0.5 active:translate-y-0 shadow-black/5"
                            }`}
                        >
                            <Heart className={`w-4 h-4 ${selectedPrayer.user_prayed ? "fill-current" : ""}`} />
                            <span className="text-xs font-bold uppercase tracking-wider">
                                {selectedPrayer.user_prayed ? "Prayed" : "I'm Praying"}
                            </span>
                        </button>

                        {(selectedPrayer.pray_count > 0 || selectedPrayer.user_prayed) && (
                            <span className="text-xs text-warm-grey/50 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-yellow-500 fill-yellow-200" />
                                {selectedPrayer.pray_count || (selectedPrayer.user_prayed ? 1 : 0)} Praying
                            </span>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
