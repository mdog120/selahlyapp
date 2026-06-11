"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Key, Lock, ChevronRight, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

interface VaultKeyholeProps {
    onThreadCreated: () => void;
}

interface SparkleStar {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    angle: number;
    spinSpeed: number;
    alpha: number;
    fadeSpeed: number;
    color: string;
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

    const starsRef = useRef<SparkleStar[]>([]);
    const timeRef = useRef<number>(0);
    const animationProgressRef = useRef<number>(0); // 0 to 1 during key rotation/slide
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

    const supabase = createClient();

    // Get prompt of the day based on day of month
    const promptIndex = new Date().getDate() % WISDOM_PROMPTS.length;
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

            // Setup state positions
            let keyX = 60;
            let keyY = centerY + Math.sin(timeRef.current * 2) * 5; // gentle hover bob
            let keyRotation = 0;
            let lockParting = 0; // parting keyhole halves on unlock

            // Follow mouse if not unlocking and mouse inside panel
            if (!unlocked && !isUnlocking && mousePos) {
                // Smooth follow towards mouse position (slightly offset to left of cursor)
                const targetX = mousePos.x - 15;
                const targetY = mousePos.y;
                
                keyX += (targetX - keyX) * 0.15;
                keyY += (targetY - keyY) * 0.15;

                // If key is dragged extremely close to the keyhole center, snap & trigger unlock
                const dx = keyX - centerX;
                const dy = keyY - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 28) {
                    handleUnlock();
                }
            }

            // Unlocking animation sequences
            if (isUnlocking && !unlocked) {
                const p = animationProgressRef.current;
                animationProgressRef.current += 0.02;

                if (p < 0.5) {
                    // Sequence 1: Key slides into the lock
                    const t = p / 0.5; // 0 to 1
                    keyX = keyX + (centerX - keyX) * t;
                    keyY = keyY + (centerY - keyY) * t;
                } else if (p < 0.8) {
                    // Sequence 2: Snapped, Key rotates 90 degrees
                    const t = (p - 0.5) / 0.3; // 0 to 1
                    keyX = centerX;
                    keyY = centerY;
                    keyRotation = t * Math.PI / 2;
                } else if (p < 1.0) {
                    // Sequence 3: Keyhole splits/parting, trigger stardust explosion
                    const t = (p - 0.8) / 0.2; // 0 to 1
                    keyX = centerX;
                    keyY = centerY;
                    keyRotation = Math.PI / 2;
                    lockParting = t * 20;

                    // Spawn explosion particles once at start of split
                    if (starsRef.current.length === 0) {
                        const stars: SparkleStar[] = [];
                        for (let i = 0; i < 55; i++) {
                            const angle = Math.random() * Math.PI * 2;
                            const speed = 1.5 + Math.random() * 3.5;
                            stars.push({
                                x: centerX,
                                y: centerY,
                                vx: Math.cos(angle) * speed,
                                vy: Math.sin(angle) * speed - 0.4,
                                size: 2 + Math.random() * 4,
                                angle: Math.random() * Math.PI * 2,
                                spinSpeed: (Math.random() - 0.5) * 0.15,
                                alpha: 1,
                                fadeSpeed: 0.015 + Math.random() * 0.02,
                                color: Math.random() > 0.6 ? "244, 115, 115" : Math.random() > 0.3 ? "251, 191, 36" : "192, 132, 252", // rose, gold, or purple stars
                            });
                        }
                        starsRef.current = stars;
                    }
                } else {
                    // Lock fully unlocked, settle
                    setUnlocked(true);
                    setIsUnlocking(false);
                }
            }

            // Draw Keyhole
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

            // Draw Floating / Rotating Key (Only if lock is not yet parted)
            if (!unlocked && animationProgressRef.current < 0.85) {
                ctx.save();
                ctx.translate(keyX, keyY);
                ctx.rotate(keyRotation);

                // Setup Key drawing style
                ctx.strokeStyle = "#FBBF24"; // golden metallic
                ctx.fillStyle = "#FBBF24";
                ctx.lineWidth = 2;
                ctx.shadowBlur = 8;
                ctx.shadowColor = "rgba(251, 191, 36, 0.4)";

                // Key Ring/Handle
                ctx.beginPath();
                ctx.arc(-22, 0, 8, 0, Math.PI * 2);
                ctx.stroke();
                
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

            // Update & Draw Stardust Particles
            const stars = starsRef.current;
            stars.forEach((s) => {
                s.x += s.vx;
                s.y += s.vy;
                s.angle += s.spinSpeed;
                s.alpha -= s.fadeSpeed;

                if (s.alpha > 0) {
                    ctx.save();
                    ctx.translate(s.x, s.y);
                    ctx.rotate(s.angle);
                    ctx.beginPath();
                    
                    // Draw a 4-point star path
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

                    ctx.shadowBlur = size * 3;
                    ctx.shadowColor = `rgba(${s.color}, ${s.alpha})`;
                    ctx.fillStyle = `rgba(${s.color}, ${s.alpha})`;
                    ctx.fill();
                    ctx.restore();
                }
            });

            // Filter out dead particles
            starsRef.current = stars.filter((s) => s.alpha > 0);

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
            setMousePos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    };

    const handleMouseLeave = () => {
        setMousePos(null);
    };

    return (
        <div className="flex flex-col items-center gap-6 w-full" ref={containerRef}>
            {/* The Vault Box Panel Container */}
            <div className="relative w-full max-w-lg h-[260px] flex items-center justify-center rounded-[2.5rem] bg-gradient-to-b from-[#1C152B] via-[#2E1B38] to-[#1C152B] border border-white/10 shadow-xl overflow-hidden group select-none">
                
                {/* Velvet Gold-embossed corners */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-yellow-500/30 rounded-tl-lg pointer-events-none" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-yellow-500/30 rounded-tr-lg pointer-events-none" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-yellow-500/30 rounded-bl-lg pointer-events-none" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-yellow-500/30 rounded-br-lg pointer-events-none" />

                {/* Canvas Element for key drag & unlock animations */}
                {!unlocked && (
                    <canvas
                        ref={canvasRef}
                        width={512}
                        height={260}
                        className="absolute inset-0 z-10 cursor-pointer"
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        onClick={handleUnlock}
                    />
                )}

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

                {/* Unlocked State: Daily Wisdom Prompt Card */}
                {unlocked && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                        <div className="space-y-3 max-w-md">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold uppercase tracking-wider">
                                <Sparkles className="w-3.5 h-3.5" />
                                Daily Wisdom Prompt
                            </span>

                            <p className="font-serif text-lg md:text-xl text-yellow-50/90 leading-relaxed italic px-2">
                                "{dailyPrompt.text}"
                            </p>

                            <div className="flex items-center justify-center gap-2 pt-2">
                                <span className="text-[10px] bg-white/5 border border-white/10 text-white/50 px-2.5 py-1 rounded-full font-bold uppercase tracking-wide">
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
                                            className="bg-yellow-500 hover:bg-yellow-600 text-[#1C152B] py-4 text-xs font-bold uppercase tracking-wider shadow-lg shadow-yellow-500/10"
                                        >
                                            {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Post to Vault ౨ৎ"}
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={() => setConfirmPost(true)}
                                        className="bg-yellow-500 hover:bg-yellow-600 text-[#1C152B] rounded-full px-6 py-4.5 text-xs font-bold uppercase tracking-wider shadow-lg shadow-yellow-500/10 hover:scale-[1.01] active:scale-95 transition-all"
                                    >
                                        Discuss this prompt <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
