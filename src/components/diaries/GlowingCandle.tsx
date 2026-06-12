"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GlowingCandleProps {
    isLit: boolean;
    streak?: number;
    hasJournaledToday?: boolean;
    isCelebrating?: boolean;
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

export function GlowingCandle({ isLit, streak = 0, hasJournaledToday = false, isCelebrating = false, onIgniteComplete }: GlowingCandleProps) {
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
        const wickX = 118; // Wick tip X position
        const wickY = 145; // Wick tip Y position

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
            const wickX = 118; // Wick tip X position
            const wickY = 145; // Wick tip Y position

            ctx.clearRect(0, 0, width, height);
            timeRef.current += 0.05;

            // 1. Draw Igniting Burst Particles
            if (igniting) {
                const particles = ignitionParticlesRef.current;
                particles.forEach((p) => {
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
                // Streak multiplier: flame grows by 10% per day of streak, capping at 7 days (+70% size)
                const scale = 1 + Math.min(streak, 7) * 0.1;

                const h = 36 * scale;
                const wOuter = 18 * scale;
                const wInner = 11 * scale;
                const wCore = 6 * scale;

                // Flame wobble offset using multiple sine waves
                const time = timeRef.current;
                const wobbleX = Math.sin(time * 2.2) * 2.5 + Math.cos(time * 1.3) * 1.2;
                const wobbleY = Math.cos(time * 3.1) * 1.5;

                const flameTipX = wickX + wobbleX;
                const flameTipY = wickY - h + wobbleY;

                // A. Draw Flame Core & Glows
                ctx.save();
                
                // Pass 1: Massive soft outer glow
                ctx.beginPath();
                ctx.moveTo(wickX, wickY);
                ctx.quadraticCurveTo(wickX - wOuter, wickY - h * 0.5, wickX - wOuter * 0.45, wickY - h * 0.72);
                ctx.quadraticCurveTo(wickX - wOuter * 0.17, wickY - h * 0.94, flameTipX, flameTipY);
                ctx.quadraticCurveTo(wickX + wOuter * 0.17, wickY - h * 0.94, wickX + wOuter * 0.45, wickY - h * 0.72);
                ctx.quadraticCurveTo(wickX + wOuter, wickY - h * 0.5, wickX, wickY);
                ctx.shadowBlur = 32 * scale;
                ctx.shadowColor = "rgba(251, 191, 36, 0.35)"; // golden glow
                ctx.fillStyle = "rgba(251, 191, 36, 0.1)";
                ctx.fill();

                // Pass 2: Intense middle flame
                ctx.beginPath();
                ctx.moveTo(wickX, wickY);
                ctx.quadraticCurveTo(wickX - wInner, wickY - h * 0.39, wickX - wInner * 0.45, wickY - h * 0.58);
                ctx.quadraticCurveTo(wickX - wInner * 0.18, wickY - h * 0.78, flameTipX, wickY - h * 0.89 + wobbleY);
                ctx.quadraticCurveTo(wickX + wInner * 0.18, wickY - h * 0.78, wickX + wInner * 0.45, wickY - h * 0.58);
                ctx.quadraticCurveTo(wickX + wInner, wickY - h * 0.39, wickX, wickY);
                ctx.shadowBlur = 12 * scale;
                ctx.shadowColor = "rgba(244, 115, 115, 0.85)"; // rose border glow
                ctx.fillStyle = "rgba(251, 191, 36, 0.75)";
                ctx.fill();

                // Pass 3: White-hot inner core with blue base
                ctx.beginPath();
                ctx.moveTo(wickX, wickY);
                ctx.quadraticCurveTo(wickX - wCore, wickY - h * 0.28, wickX - wCore * 0.5, wickY - h * 0.42);
                ctx.quadraticCurveTo(wickX - wCore * 0.17, wickY - h * 0.56, flameTipX, wickY - h * 0.72 + wobbleY);
                ctx.quadraticCurveTo(wickX + wCore * 0.17, wickY - h * 0.56, wickX + wCore * 0.5, wickY - h * 0.42);
                ctx.quadraticCurveTo(wickX + wCore, wickY - h * 0.28, wickX, wickY);
                
                const flameGrad = ctx.createLinearGradient(wickX, wickY, wickX, wickY - h * 0.72 + wobbleY);
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
                        x: flameTipX + (Math.random() - 0.5) * 6 * scale,
                        y: flameTipY - 2,
                        vx: (Math.random() - 0.5) * 0.4,
                        vy: -0.6 - Math.random() * 0.7,
                        radius: (0.8 + Math.random() * 1.2) * scale,
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
    }, [isLit, streak, igniting]);

    return (
        <div className="flex flex-col items-center gap-4 w-full md:max-w-xs mb-6 select-none">
            {/* 3D Glass Jar Candle Visual Assembly */}
            <div className="relative w-[240px] h-[290px] flex items-center justify-center filter drop-shadow-[0_12px_28px_rgba(141,123,104,0.2)]">
                {/* Layered SVG Candle Container Overlay */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    viewBox="0 0 240 290"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Glass Container Outer Outline */}
                    <path
                        d="M60 145 
                           L60 264 
                           C60 275, 69 284, 80 284 
                           L160 284 
                           C171 284, 180 275, 180 264 
                           L180 145"
                        stroke="rgba(255, 255, 255, 0.9)"
                        strokeWidth="2.5"
                    />

                    {/* Thick Glass base at bottom */}
                    <path
                        d="M60 261 L60 264 C60 275, 69 284, 80 284 L160 284 C171 284, 180 275, 180 264 L180 261 C180 269, 171 277, 160 277 L80 277 C69 277, 60 269, 60 261 Z"
                        fill="rgba(255, 255, 255, 0.15)"
                    />

                    {/* Wax Line Level inside Jar (Cream Wax) */}
                    <path
                        d="M61 185 L179 185 L179 264 C179 272, 171 277, 160 277 L80 277 C69 277, 61 272, 61 264 Z"
                        fill="#FDF6EC"
                        opacity="0.85"
                    />

                    {/* Wick structure in center */}
                    {/* Wick base clip */}
                    <rect x="116" y="182" width="8" height="3" rx="1" fill="#78350F" />
                    {/* Wick thread */}
                    <path
                        d="M120 182 Q119 161 118 145"
                        stroke="#27272A"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                    />

                    {/* Glass Rim highlight */}
                    <ellipse cx="120" cy="145" rx="60" ry="7" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="2" />
                    <ellipse cx="120" cy="145" rx="57" ry="5.5" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />

                    {/* Golden Label on the front ("Grace & Glow") */}
                    <rect x="77" y="200" width="86" height="48" rx="8" fill="#FDFBF7" stroke="#E2A292" strokeWidth="1.5" />
                    <rect x="81" y="204" width="78" height="40" rx="4" fill="none" stroke="#E2A292" strokeWidth="0.6" opacity="0.6" />
                    {/* Emojis/Tiny Text styling in SVG */}
                    <text x="120" y="219" fill="#8D7B68" fontSize="10" fontWeight="bold" fontFamily="serif" textAnchor="middle">GRACE</text>
                    <text x="120" y="228" fill="#E2A292" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">✨ & ✨</text>
                    <text x="120" y="238" fill="#8D7B68" fontSize="10" fontWeight="bold" fontFamily="serif" textAnchor="middle">GLOW</text>

                    {/* Spherical Glare Reflection on Jar side */}
                    <path
                        d="M65 158 L65 257"
                        stroke="rgba(255, 255, 255, 0.4)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />
                </svg>

                {/* Canvas Render Node - Overlayed behind glass frame but above wax */}
                <canvas
                    ref={canvasRef}
                    width={240}
                    height={290}
                    className="absolute inset-0 bg-transparent rounded-2xl pointer-events-none"
                />

                {/* Background breathing glow behind candle */}
                {(isLit || igniting) && (
                    <div className="absolute inset-x-8 top-12 bottom-20 bg-radial-gradient from-amber-400/22 via-rose-300/8 to-transparent filter blur-xl pointer-events-none rounded-full animate-pulse" />
                )}
            </div>

            {/* Lit state feedback text */}
            <div className="flex items-center gap-1.5 bg-white/60 px-4.5 py-1.5 rounded-full border border-white/80 shadow-sm text-[10px] font-bold uppercase tracking-wider text-warm-cocoa">
                {hasJournaledToday ? (
                    <>
                        <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-100 animate-pulse" />
                        Reflection completed today ౨ৎ
                    </>
                ) : isLit ? (
                    <>
                        <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-100 animate-pulse" />
                        Keep your flame alive today! 🕯️
                    </>
                ) : (
                    <>
                        <span className="w-2 h-2 rounded-full bg-stone-300 animate-pulse" />
                        Write diary to light candle
                    </>
                )}
            </div>

            {/* Video-like Full Screen Flame Celebration Overlay */}
            <AnimatePresence>
                {isCelebrating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none"
                    >
                        <motion.div
                            initial={{ scale: 0.1, y: 100, rotate: -10 }}
                            animate={{ scale: [1, 2.5, 3.5, 3.2], y: 0, rotate: 0 }}
                            exit={{ scale: 6, opacity: 0, y: -200 }}
                            transition={{ duration: 1.8, ease: "easeOut" }}
                            className="flex flex-col items-center justify-center"
                        >
                            {/* A massive golden-rose flame that pulses and glows */}
                            <div className="relative w-72 h-72 flex items-center justify-center">
                                {/* Radial gradients */}
                                <div className="absolute inset-0 bg-radial-gradient from-amber-400/60 via-rose-500/30 to-transparent filter blur-2xl rounded-full scale-150 animate-pulse" />
                                <Flame className="w-56 h-56 text-orange-500 fill-orange-400 drop-shadow-[0_0_50px_rgba(251,191,36,0.9)]" />
                                <Sparkles className="absolute top-0 right-4 w-12 h-12 text-yellow-300 animate-bounce" />
                                <Sparkles className="absolute bottom-4 left-0 w-10 h-10 text-pink-300 animate-pulse" />
                            </div>
                            <motion.h2 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="font-serif text-5xl text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] mt-6 font-bold text-center"
                            >
                                Flame Restored! 🔥
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-white/95 text-xl font-medium tracking-wide mt-2 drop-shadow-md text-center"
                            >
                                Streak continued: {streak} {streak === 1 ? "day" : "days"} of grace
                            </motion.p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
