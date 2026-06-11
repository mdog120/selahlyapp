"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Flame } from "lucide-react";

interface GlowingCandleProps {
    isLit: boolean;
    onIgniteComplete?: () => void;
}

interface Spark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    alpha: number;
    fadeSpeed: number;
    color: string;
}

export function GlowingCandle({ isLit, onIgniteComplete }: GlowingCandleProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [igniting, setIgniting] = useState(false);
    
    const sparksRef = useRef<Spark[]>([]);
    const ignitionParticlesRef = useRef<Spark[]>([]);
    const timeRef = useRef<number>(0);

    // Watch isLit transition. If it changes from false to true, trigger an ignition burst!
    useEffect(() => {
        if (isLit) {
            triggerIgnitionBurst();
        } else {
            setIgniting(false);
            ignitionParticlesRef.current = [];
            sparksRef.current = [];
        }
    }, [isLit]);

    const triggerIgnitionBurst = () => {
        setIgniting(true);
        const particles: Spark[] = [];
        
        // Spawn a burst of golden sparks from the wick center
        const wickX = 100; // Center X of canvas
        const wickY = 110; // Wick Y position on canvas

        for (let i = 0; i < 45; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.2 + Math.random() * 2.8;
            particles.push({
                x: wickX,
                y: wickY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.5, // slightly upwards bias
                radius: 1.5 + Math.random() * 2,
                alpha: 1,
                fadeSpeed: 0.015 + Math.random() * 0.025,
                color: Math.random() > 0.45 ? "251, 191, 36" : "244, 115, 115", // gold or soft rose
            });
        }
        
        ignitionParticlesRef.current = particles;
        
        setTimeout(() => {
            setIgniting(false);
            ignitionParticlesRef.current = [];
            if (onIgniteComplete) onIgniteComplete();
        }, 1200);
    };

    // Canvas animation loop
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
            const wickX = centerX;
            const wickY = 108; // Wick tip Y position

            ctx.clearRect(0, 0, width, height);
            timeRef.current += 0.05;

            // 1. Draw Igniting Burst Particles
            if (igniting) {
                const particles = ignitionParticlesRef.current;
                particles.forEach((p, idx) => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.04; // gravity drag
                    p.vx *= 0.96; // air drag
                    p.alpha -= p.fadeSpeed;

                    if (p.alpha > 0) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                        ctx.shadowBlur = p.radius * 3.5;
                        ctx.shadowColor = `rgba(${p.color}, ${p.alpha})`;
                        ctx.fillStyle = `rgba(${p.color}, ${p.alpha})`;
                        ctx.fill();
                        ctx.restore();
                    }
                });
            }

            // 2. Draw Flame & Rising Sparks (If lit or igniting)
            if (isLit || igniting) {
                // Flame wobble offset using multiple sine waves
                const time = timeRef.current;
                const wobbleX = Math.sin(time * 2.2) * 2.5 + Math.cos(time * 1.3) * 1.2;
                const wobbleY = Math.cos(time * 3.1) * 1.5;

                const flameTipX = wickX + wobbleX;
                const flameTipY = wickY - 36 + wobbleY;

                // A. Draw Flame Core & Glows
                ctx.save();
                
                // Pass 1: Massive soft outer glow
                ctx.beginPath();
                ctx.moveTo(wickX, wickY);
                ctx.quadraticCurveTo(wickX - 18, wickY - 18, wickX - 8, wickY - 26);
                ctx.quadraticCurveTo(wickX - 3, wickY - 34, flameTipX, flameTipY);
                ctx.quadraticCurveTo(wickX + 3, wickY - 34, wickX + 8, wickY - 26);
                ctx.quadraticCurveTo(wickX + 18, wickY - 18, wickX, wickY);
                ctx.shadowBlur = 32;
                ctx.shadowColor = "rgba(251, 191, 36, 0.35)"; // golden glow
                ctx.fillStyle = "rgba(251, 191, 36, 0.1)";
                ctx.fill();

                // Pass 2: Intense middle flame
                ctx.beginPath();
                ctx.moveTo(wickX, wickY);
                ctx.quadraticCurveTo(wickX - 11, wickY - 14, wickX - 5, wickY - 21);
                ctx.quadraticCurveTo(wickX - 2, wickY - 28, flameTipX, flameTipY + 4);
                ctx.quadraticCurveTo(wickX + 2, wickY - 28, wickX + 5, wickY - 21);
                ctx.quadraticCurveTo(wickX + 11, wickY - 14, wickX, wickY);
                ctx.shadowBlur = 12;
                ctx.shadowColor = "rgba(244, 115, 115, 0.85)"; // rose border glow
                ctx.fillStyle = "rgba(251, 191, 36, 0.75)";
                ctx.fill();

                // Pass 3: White-hot inner core with blue base
                ctx.beginPath();
                ctx.moveTo(wickX, wickY);
                ctx.quadraticCurveTo(wickX - 6, wickY - 10, wickX - 3, wickY - 15);
                ctx.quadraticCurveTo(wickX - 1, wickY - 20, flameTipX, flameTipY + 10);
                ctx.quadraticCurveTo(wickX + 1, wickY - 20, wickX + 3, wickY - 15);
                ctx.quadraticCurveTo(wickX + 6, wickY - 10, wickX, wickY);
                
                const flameGrad = ctx.createLinearGradient(wickX, wickY, wickX, flameTipY + 10);
                flameGrad.addColorStop(0, "rgba(59, 130, 246, 0.95)"); // blue heat base
                flameGrad.addColorStop(0.35, "rgba(255, 255, 255, 0.98)"); // white hot center
                flameGrad.addColorStop(1, "rgba(253, 230, 138, 0.8)"); // golden yellow tip
                
                ctx.fillStyle = flameGrad;
                ctx.fill();
                ctx.restore();

                // B. Manage & Draw Rising Sparks
                const sparks = sparksRef.current;
                
                // Spawn new rising spark occasionally
                if (Math.random() < 0.22 && sparks.length < 15) {
                    sparks.push({
                        x: flameTipX + (Math.random() - 0.5) * 6,
                        y: flameTipY - 2,
                        vx: (Math.random() - 0.5) * 0.4,
                        vy: -0.6 - Math.random() * 0.7,
                        radius: 0.8 + Math.random() * 1.2,
                        alpha: 0.8 + Math.random() * 0.2,
                        fadeSpeed: 0.015 + Math.random() * 0.02,
                        color: "251, 191, 36", // gold
                    });
                }

                // Update and draw active sparks
                sparks.forEach((s, sIdx) => {
                    s.x += s.vx;
                    s.y += s.vy;
                    // drift sideways slightly
                    s.vx += Math.sin(time + sIdx) * 0.012;
                    s.alpha -= s.fadeSpeed;

                    if (s.alpha > 0 && s.y > 10) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                        ctx.shadowBlur = s.radius * 2.5;
                        ctx.shadowColor = `rgba(${s.color}, ${s.alpha})`;
                        ctx.fillStyle = `rgba(${s.color}, ${s.alpha})`;
                        ctx.fill();
                        ctx.restore();
                    }
                });

                // Remove faded sparks
                sparksRef.current = sparks.filter(s => s.alpha > 0 && s.y > 10);
            }

            animationFrameId = requestAnimationFrame(updateFrame);
        };

        updateFrame();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isLit, igniting]);

    return (
        <div className="flex flex-col items-center gap-4 w-full md:max-w-xs mb-6 select-none">
            {/* 3D Glass Jar Candle Visual Assembly */}
            <div className="relative w-[180px] h-[220px] flex items-center justify-center filter drop-shadow-[0_8px_22px_rgba(141,123,104,0.18)]">
                {/* Layered SVG Candle Container Overlay */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    viewBox="0 0 180 220"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Glass Container Outer Outline */}
                    <path
                        d="M45 110 
                           L45 200 
                           C45 208, 52 215, 60 215 
                           L120 215 
                           C128 215, 135 208, 135 200 
                           L135 110"
                        stroke="rgba(255, 255, 255, 0.9)"
                        strokeWidth="2"
                    />

                    {/* Thick Glass base at bottom */}
                    <path
                        d="M45 198 L45 200 C45 208, 52 215, 60 215 L120 215 C128 215, 135 208, 135 200 L135 198 C135 204, 128 210, 120 210 L60 210 C52 210, 45 204, 45 198 Z"
                        fill="rgba(255, 255, 255, 0.15)"
                    />

                    {/* Wax Line Level inside Jar (Cream Wax) */}
                    <path
                        d="M46 140 L134 140 L134 200 C134 206, 128 210, 120 210 L60 210 C52 210, 46 206, 46 200 Z"
                        fill="#FDF6EC"
                        opacity="0.85"
                    />

                    {/* Wick structure in center */}
                    {/* Wick base clip */}
                    <rect x="87" y="138" width="6" height="2" rx="1" fill="#78350F" />
                    {/* Wick thread */}
                    <path
                        d="M90 138 Q89 122 88 110"
                        stroke="#27272A"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                    />

                    {/* Glass Rim highlight */}
                    <ellipse cx="90" cy="110" rx="45" ry="5" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="1.8" />
                    <ellipse cx="90" cy="110" rx="43" ry="4" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />

                    {/* Golden Label on the front ("Grace & Glow") */}
                    <rect x="58" y="152" width="64" height="36" rx="6" fill="#FDFBF7" stroke="#E2A292" strokeWidth="1.2" />
                    <rect x="61" y="155" width="58" height="30" rx="3" fill="none" stroke="#E2A292" strokeWidth="0.5" opacity="0.6" />
                    {/* Emojis/Tiny Text styling in SVG */}
                    <text x="90" y="167" fill="#8D7B68" fontSize="8" fontWeight="bold" fontFamily="serif" textAnchor="middle">GRACE</text>
                    <text x="90" y="174" fill="#E2A292" fontSize="6" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">✨ & ✨</text>
                    <text x="90" y="182" fill="#8D7B68" fontSize="8" fontWeight="bold" fontFamily="serif" textAnchor="middle">GLOW</text>

                    {/* Spherical Glare Reflection on Jar side */}
                    <path
                        d="M49 120 L49 195"
                        stroke="rgba(255, 255, 255, 0.4)"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </svg>

                {/* Canvas Render Node - Overlayed behind glass frame but above wax */}
                <canvas
                    ref={canvasRef}
                    width={200}
                    height={220}
                    className="absolute inset-0 bg-transparent rounded-2xl pointer-events-none"
                />

                {/* Background breathing glow behind candle */}
                {(isLit || igniting) && (
                    <div className="absolute inset-x-8 top-10 bottom-16 bg-radial-gradient from-amber-400/22 via-rose-300/8 to-transparent filter blur-xl pointer-events-none rounded-full animate-pulse" />
                )}
            </div>

            {/* Lit state feedback text */}
            <div className="flex items-center gap-1.5 bg-white/60 px-4.5 py-1.5 rounded-full border border-white/80 shadow-sm text-[10px] font-bold uppercase tracking-wider text-warm-cocoa">
                {isLit ? (
                    <>
                        <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-100" />
                        Your sanctuary is glowing
                    </>
                ) : (
                    <>
                        <span className="w-2 h-2 rounded-full bg-stone-300 animate-pulse" />
                        Write diary to light candle
                    </>
                )}
            </div>
        </div>
    );
}
