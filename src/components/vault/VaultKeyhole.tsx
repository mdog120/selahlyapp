"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Key, Lock, ChevronRight, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

interface VaultKeyholeProps {
    onThreadCreated: () => void;
}

interface DustMote {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    speedMultiplier: number;
}

interface TrailSpark {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    fadeSpeed: number;
    color: string;
}

interface Shockwave {
    radius: number;
    maxRadius: number;
    alpha: number;
    speed: number;
    color: string;
}

interface SpiralStar {
    baseAngle: number;
    radius: number;
    rotSpeed: number;
    expandSpeed: number;
    size: number;
    alpha: number;
    fadeSpeed: number;
    color: string;
    angleOffset: number;
}

const WISDOM_PROMPTS = [
    { text: "How do you handle comparison when scrolling through social media?", category: "Mental Health" },
    { text: "What does 'guarding your heart' mean to you in relationships?", category: "Relationships" },
    { text: "Where do you find peace when it feels like your prayers aren't being answered?", category: "Faith" },
    { text: "How can we build genuine sisterhood instead of competing with one another?", category: "Culture" },
    { text: "In what ways has your faith helped you overcome anxiety or doubt?", category: "Mental Health" },
    { text: "What is one value you look for in a true friend, and how do you practice it?", category: "Relationships" },
    { text: "How do you balance being in the world but not of it as a young Christian?", category: "Culture" },
    { text: "How can you tell the difference between healthy boundaries and shutting people out?", category: "Mental Health" },
    { text: "What parts of scripture do you turn to when you feel alone or forgotten?", category: "Bible Study" }
];

export function VaultKeyhole({ onThreadCreated }: VaultKeyholeProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [unlocked, setUnlocked] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);
    
    // Posting state
    const [posting, setPosting] = useState(false);
    const [posted, setPosted] = useState(false);
    const [confirmPost, setConfirmPost] = useState(false);

    // Physics Refs
    const dustMotesRef = useRef<DustMote[]>([]);
    const trailSparksRef = useRef<TrailSpark[]>([]);
    const shockwavesRef = useRef<Shockwave[]>([]);
    const spiralStarsRef = useRef<SpiralStar[]>([]);
    
    const timeRef = useRef<number>(0);
    const keyTiltRef = useRef<number>(0);
    const animationProgressRef = useRef<number>(0); // 0 to 1 during key rotation/slide
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

    const supabase = createClient();

    // Get prompt of the day deterministically hashed by date string (changes daily)
    const todayStr = new Date().toDateString();
    let dateHash = 0;
    for (let i = 0; i < todayStr.length; i++) {
        dateHash = todayStr.charCodeAt(i) + ((dateHash << 5) - dateHash);
    }
    const promptIndex = Math.abs(dateHash) % WISDOM_PROMPTS.length;
    const dailyPrompt = WISDOM_PROMPTS[promptIndex];

    const handleUnlock = () => {
        if (unlocked || isUnlocking) return;
        setIsUnlocking(true);
        animationProgressRef.current = 0.01; // trigger key slide
    };

    const handleCreateThread = async () => {
        setPosting(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Please log in to create a thread!");
            setPosting(false);
            return;
        }

        const { error } = await supabase.from("threads").insert({
            user_id: user.id,
            title: dailyPrompt.text,
            category: dailyPrompt.category,
            message_count: 0,
            view_count: 0
        });

        if (!error) {
            setPosted(true);
            setConfirmPost(false);
            onThreadCreated();
            setTimeout(() => setPosted(false), 3000);
        } else {
            alert("Failed to start thread.");
        }
        setPosting(false);
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
            const centerY = height / 2;

            ctx.clearRect(0, 0, width, height);
            timeRef.current += 0.05;

            // Ambient background pulse
            const pulse = 0.12 + Math.sin(timeRef.current * 0.5) * 0.03;
            ctx.save();
            const bgGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, width * 0.5);
            bgGrad.addColorStop(0, `rgba(251, 191, 36, ${pulse})`); // gold ambient
            bgGrad.addColorStop(0.6, "rgba(46, 27, 56, 0.05)"); // plum ambient
            bgGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();

            // 1. Background Dust Motes Physics (Always rendering)
            if (dustMotesRef.current.length === 0) {
                const motes: DustMote[] = [];
                for (let i = 0; i < 24; i++) {
                    motes.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        vx: (Math.random() - 0.5) * 0.15,
                        vy: (Math.random() - 0.5) * 0.15,
                        size: 1.0 + Math.random() * 2.0,
                        alpha: 0.1 + Math.random() * 0.4,
                        speedMultiplier: 0.6 + Math.random() * 0.8
                    });
                }
                dustMotesRef.current = motes;
            }

            ctx.save();
            dustMotesRef.current.forEach((m) => {
                m.x += m.vx * m.speedMultiplier;
                m.y += m.vy * m.speedMultiplier;

                if (m.x < 0) m.x = width;
                if (m.x > width) m.x = 0;
                if (m.y < 0) m.y = height;
                if (m.y > height) m.y = 0;

                const moteAlpha = m.alpha * (0.7 + Math.sin(timeRef.current * 0.8 + m.x) * 0.3);

                ctx.beginPath();
                ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(251, 191, 36, ${moteAlpha * 0.45})`;
                ctx.shadowBlur = m.size * 2;
                ctx.shadowColor = "rgba(251, 191, 36, 0.2)";
                ctx.fill();
            });
            ctx.restore();

            // Setup state positions
            let keyX = 60;
            let keyY = centerY + Math.sin(timeRef.current * 2) * 5; // gentle hover bob
            let keyRotation = 0;
            let lockParting = 0; // parting keyhole halves on unlock

            // Follow mouse if not unlocking and mouse inside panel
            if (!unlocked && !isUnlocking && mousePos) {
                const targetX = mousePos.x - 15;
                const targetY = mousePos.y;
                
                const prevX = keyX;
                keyX += (targetX - keyX) * 0.15;
                keyY += (targetY - keyY) * 0.15;

                // Tilting calculations based on horizontal velocity
                const velocityX = keyX - prevX;
                const targetTilt = velocityX * 0.08;
                keyTiltRef.current += (targetTilt - keyTiltRef.current) * 0.18;

                // Snap check
                const dx = keyX - centerX;
                const dy = keyY - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 28) {
                    handleUnlock();
                }
            } else {
                keyTiltRef.current *= 0.9; // decay tilt
            }

            // Unlocking animation sequences
            if (isUnlocking && !unlocked) {
                const p = animationProgressRef.current;
                animationProgressRef.current += 0.018; // smooth easing

                if (p < 0.5) {
                    // Sequence 1: Key slides into the lock
                    const t = p / 0.5;
                    keyX = keyX + (centerX - keyX) * t;
                    keyY = keyY + (centerY - keyY) * t;
                } else if (p < 0.8) {
                    // Sequence 2: Snapped, Key rotates 90 degrees
                    const t = (p - 0.5) / 0.3;
                    keyX = centerX;
                    keyY = centerY;
                    keyRotation = t * Math.PI / 2;
                } else if (p < 1.0) {
                    // Sequence 3: Keyhole splits/parting, trigger shockwaves & galaxy stardust
                    const t = (p - 0.8) / 0.2;
                    keyX = centerX;
                    keyY = centerY;
                    keyRotation = Math.PI / 2;
                    lockParting = t * 28;

                    // Trigger shockwaves & spiral galaxy stardust once at start of split
                    if (spiralStarsRef.current.length === 0) {
                        shockwavesRef.current = [
                            { radius: 0, maxRadius: 180, alpha: 1, speed: 4.5, color: "251, 191, 36" }, // gold ring
                            { radius: 0, maxRadius: 240, alpha: 1, speed: 3.5, color: "192, 132, 252" }, // purple ring
                            { radius: 0, maxRadius: 120, alpha: 1, speed: 6.0, color: "244, 115, 115" }  // rose ring
                        ];

                        const stars: SpiralStar[] = [];
                        for (let i = 0; i < 70; i++) {
                            const baseAngle = Math.random() * Math.PI * 2;
                            const rotSpeed = (0.025 + Math.random() * 0.045) * (Math.random() > 0.5 ? 1 : -1);
                            const expandSpeed = 1.6 + Math.random() * 3.2;
                            stars.push({
                                baseAngle,
                                radius: 8,
                                rotSpeed,
                                expandSpeed,
                                size: 2.0 + Math.random() * 3.5,
                                alpha: 1.0,
                                fadeSpeed: 0.006 + Math.random() * 0.01,
                                color: Math.random() > 0.65 ? "244, 115, 115" : Math.random() > 0.3 ? "251, 191, 36" : "192, 132, 252",
                                angleOffset: Math.random() * Math.PI * 2
                            });
                        }
                        spiralStarsRef.current = stars;
                    }
                } else {
                    setUnlocked(true);
                    setIsUnlocking(false);
                }
            }

            // 2. Draw Keyhole (only if not unlocked)
            if (!unlocked) {
                // A. Draw Outer Glow Rim
                const keyholeGlow = 8 + Math.sin(timeRef.current * 1.5) * 3;
                ctx.save();
                ctx.beginPath();
                ctx.arc(centerX - lockParting, centerY - 6, 15, -Math.PI / 2, Math.PI / 2, true);
                ctx.lineTo(centerX - 8 - lockParting, centerY + 20);
                ctx.lineTo(centerX - lockParting, centerY + 20);
                ctx.closePath();
                ctx.arc(centerX + lockParting, centerY - 6, 15, -Math.PI / 2, Math.PI / 2, false);
                ctx.lineTo(centerX + 8 + lockParting, centerY + 20);
                ctx.lineTo(centerX + lockParting, centerY + 20);
                ctx.closePath();
                ctx.shadowBlur = keyholeGlow;
                ctx.shadowColor = "rgba(251, 191, 36, 0.4)";
                ctx.strokeStyle = "rgba(251, 191, 36, 0.3)";
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.restore();

                // B. Draw Main Keyhole Halves
                ctx.save();
                ctx.lineWidth = 2.5;
                ctx.strokeStyle = "#FBBF24"; // gold rim
                ctx.fillStyle = "#1E152A"; // dark hollow interior

                // Left side keyhole outline half
                ctx.beginPath();
                ctx.arc(centerX - lockParting, centerY - 6, 12, -Math.PI / 2, Math.PI / 2, true);
                ctx.lineTo(centerX - 6 - lockParting, centerY + 18);
                ctx.lineTo(centerX - lockParting, centerY + 18);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Right side keyhole outline half
                ctx.beginPath();
                ctx.arc(centerX + lockParting, centerY - 6, 12, -Math.PI / 2, Math.PI / 2, false);
                ctx.lineTo(centerX + 6 + lockParting, centerY + 18);
                ctx.lineTo(centerX + lockParting, centerY + 18);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }

            // 3. Draw Floating / Rotating Key (Only if lock is not yet parted)
            if (!unlocked && animationProgressRef.current < 0.85) {
                ctx.save();
                ctx.translate(keyX, keyY);
                
                // Scale key down during insertion to simulate 3D depth
                let keyScale = 1.0;
                if (isUnlocking) {
                    if (animationProgressRef.current < 0.5) {
                        const t = animationProgressRef.current / 0.5;
                        keyScale = 1.0 - t * 0.25;
                    } else {
                        keyScale = 0.75;
                    }
                }
                ctx.scale(keyScale, keyScale);
                ctx.rotate(keyRotation + keyTiltRef.current);

                // Setup Key drawing style
                ctx.strokeStyle = "#FBBF24"; // golden metallic
                ctx.fillStyle = "#FBBF24";
                ctx.lineWidth = 2.2;
                ctx.shadowBlur = 10;
                ctx.shadowColor = "rgba(251, 191, 36, 0.45)";

                // Key Ring/Handle (Heart Shape)
                ctx.beginPath();
                ctx.moveTo(-22, 6);
                ctx.bezierCurveTo(-29, 2, -29, -6, -22, -6);
                ctx.bezierCurveTo(-15, -6, -15, 2, -22, 6);
                ctx.stroke();
                ctx.fillStyle = "rgba(251, 191, 36, 0.15)";
                ctx.fill();
                
                // Key Shaft
                ctx.beginPath();
                ctx.moveTo(-14, 0);
                ctx.lineTo(14, 0);
                ctx.stroke();

                // Key Teeth
                ctx.fillRect(6, 0, 3, 5);
                ctx.fillRect(11, 0, 3, 5);
                ctx.restore();
            }

            // 4. Update and Draw Mouse Trail Sparks
            const trailSparks = trailSparksRef.current;
            trailSparks.forEach((s) => {
                s.x += s.vx;
                s.y += s.vy;
                s.alpha -= s.fadeSpeed;

                if (s.alpha > 0) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                    ctx.shadowBlur = s.size * 3;
                    ctx.shadowColor = `rgba(${s.color}, ${s.alpha})`;
                    ctx.fillStyle = `rgba(${s.color}, ${s.alpha})`;
                    ctx.fill();
                    ctx.restore();
                }
            });
            trailSparksRef.current = trailSparks.filter((s) => s.alpha > 0);

            // 5. Update and Draw Shockwaves
            const shockwaves = shockwavesRef.current;
            shockwaves.forEach((sw) => {
                sw.radius += sw.speed;
                sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);

                if (sw.alpha > 0) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, sw.radius, 0, Math.PI * 2);
                    ctx.lineWidth = 1.5 + sw.alpha * 2;
                    ctx.strokeStyle = `rgba(${sw.color}, ${sw.alpha * 0.65})`;
                    ctx.shadowBlur = 10 * sw.alpha;
                    ctx.shadowColor = `rgba(${sw.color}, ${sw.alpha * 0.5})`;
                    ctx.stroke();
                    ctx.restore();
                }
            });
            shockwavesRef.current = shockwaves.filter((sw) => sw.alpha > 0);

            // 6. Update and Draw Swirling Galaxy Stardust
            const spiralStars = spiralStarsRef.current;
            spiralStars.forEach((s) => {
                s.baseAngle += s.rotSpeed;
                s.radius += s.expandSpeed;
                s.alpha -= s.fadeSpeed;
                s.angleOffset += 0.08;

                if (s.alpha > 0) {
                    const starX = centerX + Math.cos(s.baseAngle) * s.radius;
                    const starY = centerY + Math.sin(s.baseAngle) * s.radius;

                    ctx.save();
                    ctx.translate(starX, starY);
                    ctx.rotate(s.angleOffset);
                    ctx.beginPath();
                    
                    const size = s.size;
                    ctx.moveTo(0, -size);
                    ctx.lineTo(size * 0.3, -size * 0.3);
                    ctx.lineTo(size, 0);
                    ctx.lineTo(size * 0.3, size * 0.3);
                    ctx.lineTo(0, size);
                    ctx.lineTo(-size * 0.3, size * 0.3);
                    ctx.lineTo(-size, 0);
                    ctx.lineTo(-size * 0.3, -size * 0.3);
                    ctx.closePath();

                    ctx.shadowBlur = size * 3.5;
                    ctx.shadowColor = `rgba(${s.color}, ${s.alpha})`;
                    ctx.fillStyle = `rgba(${s.color}, ${s.alpha})`;
                    ctx.fill();
                    ctx.restore();
                }
            });
            spiralStarsRef.current = spiralStars.filter((s) => s.alpha > 0);

            animationFrameId = requestAnimationFrame(updateFrame);
        };

        updateFrame();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [mousePos, unlocked, isUnlocking]);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            setMousePos({ x, y });

            // Spawn mouse trail sparks
            if (!unlocked && !isUnlocking && Math.random() < 0.45) {
                for (let i = 0; i < 2; i++) {
                    trailSparksRef.current.push({
                        x: x - 15 + (Math.random() - 0.5) * 8,
                        y: y + (Math.random() - 0.5) * 8,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5 - 0.2,
                        size: 0.8 + Math.random() * 1.5,
                        alpha: 0.8,
                        fadeSpeed: 0.025 + Math.random() * 0.02,
                        color: Math.random() > 0.5 ? "251, 191, 36" : "192, 132, 252"
                    });
                }
            }
        }
    };

    const handleMouseLeave = () => {
        setMousePos(null);
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full" ref={containerRef}>
            {/* The Vault Box Panel Container */}
            <div className={`relative w-full max-w-lg flex items-center justify-center rounded-[2.5rem] bg-gradient-to-b from-[#180E21] via-[#2F153C] to-[#180E21] border border-yellow-500/25 shadow-2xl overflow-hidden group select-none transition-all duration-500 ease-in-out ${unlocked ? "min-h-[350px] md:min-h-[380px] h-auto p-4" : "h-[260px]"}`}>
                
                {/* Velvet Gold-embossed corners */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-yellow-500/40 rounded-tl-lg pointer-events-none" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-yellow-500/40 rounded-tr-lg pointer-events-none" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-yellow-500/40 rounded-bl-lg pointer-events-none" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-yellow-500/40 rounded-br-lg pointer-events-none" />

                {/* Canvas Element for key drag & unlock animations - set to z-10 underneath unlocked card z-20 */}
                <canvas
                    ref={canvasRef}
                    width={512}
                    height={260}
                    className={`absolute inset-0 z-10 ${unlocked ? "pointer-events-none opacity-0" : "cursor-pointer"} transition-opacity duration-500`}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleUnlock}
                />

                {/* If Locked: show instructions overlay */}
                {!unlocked && (
                    <div className="absolute bottom-6 z-20 flex flex-col items-center gap-1.5 pointer-events-none animate-pulse text-center">
                        <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Key className="w-3.5 h-3.5" />
                            Drag Key or Click lock to unlock
                        </p>
                        <p className="text-[9px] text-white/40 italic font-serif">Daily wisdom awaits inside...</p>
                    </div>
                )}

                {/* Unlocked State: Daily Wisdom Prompt Card (Higher z-20 for full button clickability) */}
                <AnimatePresence>
                    {unlocked && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: -20 }}
                            transition={{ type: "spring", stiffness: 100, damping: 15 }}
                            className="relative z-20 flex flex-col items-center justify-center p-2 md:p-4 text-center w-full h-full"
                        >
                            <div className="space-y-4 max-w-md w-full glass-card p-6 md:p-8 rounded-[2.5rem] border border-yellow-500/20 shadow-2xl relative overflow-hidden bg-gradient-to-b from-[#2F153C]/90 via-[#180E21]/95 to-[#2F153C]/90 backdrop-blur-md">
                                
                                {/* Inner gold glow line */}
                                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />
                                
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Daily Wisdom Prompt
                                </span>

                                <p className="font-serif text-lg md:text-xl text-yellow-50/90 leading-relaxed italic px-2">
                                    "{dailyPrompt.text}"
                                </p>

                                <div className="flex items-center justify-center gap-2 pt-1">
                                    <span className="text-[9px] bg-white/5 border border-white/10 text-white/50 px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">
                                        Topic: {dailyPrompt.category}
                                    </span>
                                </div>

                                {/* Inline post-creation workflow */}
                                <div className="pt-2">
                                    {posted ? (
                                        <span className="inline-flex items-center gap-1.5 text-xs text-green-400 font-bold bg-green-500/10 px-4 py-2 rounded-full animate-fade-in border border-green-500/20">
                                            <Check className="w-4 h-4" /> Discussion launched!
                                        </span>
                                    ) : confirmPost ? (
                                        <div className="flex gap-2 justify-center animate-fade-in">
                                            <Button 
                                                size="sm" 
                                                variant="secondary"
                                                className="border-white/10 hover:bg-white/5 text-white/70 py-4 text-xs font-bold uppercase tracking-wider"
                                                onClick={() => setConfirmPost(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button 
                                                size="sm"
                                                onClick={handleCreateThread}
                                                disabled={posting}
                                                className="bg-yellow-500 hover:bg-yellow-600 text-[#1C152B] py-4 text-xs font-bold uppercase tracking-wider shadow-lg shadow-yellow-500/20"
                                            >
                                                {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Post to Vault ౨ৎ"}
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() => setConfirmPost(true)}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-[#1C152B] rounded-full px-6 py-4.5 text-xs font-bold uppercase tracking-wider shadow-lg shadow-yellow-500/20 hover:scale-[1.03] active:scale-95 transition-all duration-300"
                                        >
                                            Discuss this prompt <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
