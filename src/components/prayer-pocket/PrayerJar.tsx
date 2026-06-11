"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Sparkles, X, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

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
    wingAngle: number;
}

interface Sparkle {
    x: number;
    y: number;
    size: number;
    alpha: number;
    fadeSpeed: number;
    fadeDir: number;
}

const drawGardenBackdrop = (ctx: CanvasRenderingContext2D, width: number, height: number, centerX: number) => {
    ctx.save();
    
    // Draw soft grass hills at the very bottom base of the jar
    ctx.fillStyle = "rgba(188, 214, 195, 0.45)"; // Soft sage green
    ctx.beginPath();
    ctx.ellipse(centerX, height - 35, width * 0.35, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(163, 196, 172, 0.4)"; // Slightly darker layer
    ctx.beginPath();
    ctx.ellipse(centerX - 30, height - 32, width * 0.3, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Helper to draw a leaf
    const drawLeaf = (lx: number, ly: number, angle: number, size: number) => {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(angle);
        ctx.fillStyle = "rgba(163, 196, 172, 0.55)";
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    // Helper to draw a daisy
    const drawDaisy = (fx: number, fy: number, size: number) => {
        ctx.save();
        ctx.translate(fx, fy);
        ctx.fillStyle = "rgba(255, 255, 255, 0.75)"; // Petals
        for (let i = 0; i < 6; i++) {
            ctx.rotate(Math.PI / 3);
            ctx.beginPath();
            ctx.ellipse(size * 0.8, 0, size * 0.8, size * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = "rgba(254, 215, 170, 0.95)"; // Orange/yellow center
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    };

    // Helper to draw a tulip
    const drawTulip = (tx: number, ty: number, size: number) => {
        ctx.save();
        ctx.translate(tx, ty);
        ctx.fillStyle = "rgba(240, 187, 202, 0.85)"; // Lilac/Pink
        ctx.beginPath();
        ctx.moveTo(0, size);
        ctx.bezierCurveTo(-size, 0, -size * 1.2, -size * 0.5, -size * 0.8, -size * 1.2);
        ctx.bezierCurveTo(-size * 0.3, -size * 0.7, 0, -size, 0, -size * 1.2);
        ctx.bezierCurveTo(0, -size, size * 0.3, -size * 0.7, size * 0.8, -size * 1.2);
        ctx.bezierCurveTo(size * 1.2, -size * 0.5, size, 0, 0, size);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    };

    // Helper to draw a stem
    const drawStem = (x1: number, y1: number, x2: number, y2: number, cx: number, cy: number) => {
        ctx.strokeStyle = "rgba(141, 178, 151, 0.65)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        ctx.stroke();
    };

    // 1. Left Plant (Tulip)
    drawStem(centerX - 50, height - 35, centerX - 65, height - 100, centerX - 60, height - 65);
    drawLeaf(centerX - 58, height - 60, -Math.PI / 4, 12);
    drawLeaf(centerX - 62, height - 80, -Math.PI / 6, 9);
    drawTulip(centerX - 65, height - 105, 10);

    // 2. Center Plant (Daisy)
    drawStem(centerX, height - 35, centerX + 10, height - 130, centerX + 5, height - 80);
    drawLeaf(centerX + 3, height - 65, Math.PI / 4, 14);
    drawLeaf(centerX + 8, height - 95, -Math.PI / 5, 11);
    drawDaisy(centerX + 10, height - 135, 8);

    // 3. Right Plant (Peach Bud)
    drawStem(centerX + 55, height - 35, centerX + 45, height - 85, centerX + 50, height - 60);
    drawLeaf(centerX + 51, height - 55, Math.PI / 3, 10);
    drawLeaf(centerX + 47, height - 75, Math.PI / 6, 8);
    // Bud
    ctx.fillStyle = "rgba(253, 186, 116, 0.9)"; // Pastel peach
    ctx.beginPath();
    ctx.arc(centerX + 45, height - 88, 6, 0, Math.PI * 2);
    ctx.fill();

    // 4. Hanging Vines from top-left neck
    ctx.strokeStyle = "rgba(141, 178, 151, 0.5)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(centerX - 45, 90);
    ctx.quadraticCurveTo(centerX - 60, 120, centerX - 50, 160);
    ctx.stroke();
    
    // Vine leaves
    drawLeaf(centerX - 50, 110, Math.PI / 6, 6);
    drawLeaf(centerX - 53, 135, -Math.PI / 4, 7);
    drawLeaf(centerX - 50, 160, Math.PI / 3, 5);

    // 5. Hanging Vines from top-right neck
    ctx.beginPath();
    ctx.moveTo(centerX + 45, 90);
    ctx.quadraticCurveTo(centerX + 55, 115, centerX + 48, 140);
    ctx.stroke();
    
    drawLeaf(centerX + 48, 105, -Math.PI / 6, 6);
    drawLeaf(centerX + 52, 125, Math.PI / 5, 5);
    drawLeaf(centerX + 48, 140, -Math.PI / 4, 5);

    ctx.restore();
};

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

        prayers.forEach((prayer) => {
            const existing = existingParticles.find((p) => p.id === prayer.id);
            if (existing) {
                existing.userPrayed = !!prayer.user_prayed;
                newParticles.push(existing);
            } else {
                // Sizing butterflies slightly larger than dots to render wing paths clearly
                const radius = 6.5 + Math.random() * 3.5;
                const speed = 0.12 + Math.random() * 0.22;
                
                const y = 100 + Math.random() * (height - 150);
                const halfWidth = getJarWidthAtY(y, height, width);
                const x = centerX + (Math.random() - 0.5) * halfWidth * 1.7;

                newParticles.push({
                    id: prayer.id,
                    x,
                    y,
                    vx: (Math.random() - 0.5) * 0.25,
                    vy: (Math.random() - 0.5) * 0.25,
                    radius,
                    angle: Math.random() * Math.PI * 2,
                    speed,
                    alpha: 0.35 + Math.random() * 0.6,
                    pulseSpeed: 0.007 + Math.random() * 0.012,
                    pulseDir: Math.random() > 0.5 ? 1 : -1,
                    userPrayed: !!prayer.user_prayed,
                    trail: [],
                    wingAngle: Math.random() * Math.PI * 2,
                });
            }
        });

        particlesRef.current = newParticles;

        // Initialize background sparkles if empty
        if (sparklesRef.current.length === 0) {
            const sparkles: Sparkle[] = [];
            for (let i = 0; i < 24; i++) {
                const sy = 90 + Math.random() * (height - 130);
                const shalfWidth = getJarWidthAtY(sy, height, width);
                const sx = centerX + (Math.random() - 0.5) * shalfWidth * 1.8;

                sparkles.push({
                    x: sx,
                    y: sy,
                    size: 1 + Math.random() * 1.8,
                    alpha: Math.random() * 0.6,
                    fadeSpeed: 0.004 + Math.random() * 0.007,
                    fadeDir: Math.random() > 0.5 ? 1 : -1,
                });
            }
            sparklesRef.current = sparkles;
        }
    }, [prayers]);

    // Jar shape boundary helper: returns half-width of the jar at a given Y coordinate
    // Configured for the new enlarged 380 x 480 dimensions
    const getJarWidthAtY = (y: number, height: number, width: number): number => {
        const neckY = height * 0.22; // ~105px
        const shoulderY = height * 0.32; // ~153px
        const padding = 34; // margins to prevent clips

        if (y < neckY) {
            return (width * 0.48) / 2 - padding; // ~60px limit
        } else if (y < shoulderY) {
            const t = (y - neckY) / (shoulderY - neckY);
            const w = width * 0.48 + t * (width * 0.36); // expands to width * 0.84
            return w / 2 - padding;
        } else {
            const bodyHeight = height - shoulderY;
            const bodyY = y - shoulderY;
            if (bodyY > bodyHeight * 0.8) {
                const t = (bodyY - bodyHeight * 0.8) / (bodyHeight * 0.2);
                const curve = Math.sqrt(Math.max(0, 1 - t * t));
                return (width * 0.86 / 2 * curve) - padding;
            }
            return (width * 0.86) / 2 - padding; // ~130px limit
        }
    };

    // Vector-drawn butterfly with flapping wings
    const drawButterfly = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        radius: number,
        angle: number,
        wingAngle: number,
        alpha: number,
        colorHex: string,
        userPrayed: boolean
    ) => {
        ctx.save();
        ctx.translate(x, y);
        // Rotate body to face the general drift direction
        ctx.rotate(angle);

        // Flapping wings ratio using sine wave (oscillates width between 0.15 and 1.0)
        const flap = Math.sin(wingAngle);
        const wingScaleX = 0.22 + 0.78 * Math.abs(flap);

        const wSize = radius * 1.5;

        // Double glow pass configurations
        const glowRadius = userPrayed ? radius * 4.8 : radius * 3.2;

        // Draw Left Wings
        ctx.save();
        ctx.beginPath();
        // Upper-Left
        ctx.ellipse(-wSize * 0.5 * wingScaleX, -wSize * 0.3, wSize * 0.55 * wingScaleX, wSize * 0.45, -Math.PI / 6, 0, Math.PI * 2);
        // Lower-Left
        ctx.ellipse(-wSize * 0.4 * wingScaleX, wSize * 0.35, wSize * 0.4 * wingScaleX, wSize * 0.35, Math.PI / 8, 0, Math.PI * 2);
        
        ctx.shadowBlur = glowRadius * 1.5;
        ctx.shadowColor = `rgba(${colorHex}, ${alpha * 0.8})`;
        ctx.fillStyle = userPrayed ? `rgba(255, 174, 188, ${alpha * 0.85})` : `rgba(255, 230, 160, ${alpha * 0.85})`;
        ctx.fill();
        ctx.restore();

        // Draw Right Wings
        ctx.save();
        ctx.beginPath();
        // Upper-Right
        ctx.ellipse(wSize * 0.5 * wingScaleX, -wSize * 0.3, wSize * 0.55 * wingScaleX, wSize * 0.45, Math.PI / 6, 0, Math.PI * 2);
        // Lower-Right
        ctx.ellipse(wSize * 0.4 * wingScaleX, wSize * 0.35, wSize * 0.4 * wingScaleX, wSize * 0.35, -Math.PI / 8, 0, Math.PI * 2);
        
        ctx.shadowBlur = glowRadius * 1.5;
        ctx.shadowColor = `rgba(${colorHex}, ${alpha * 0.8})`;
        ctx.fillStyle = userPrayed ? `rgba(255, 174, 188, ${alpha * 0.85})` : `rgba(255, 230, 160, ${alpha * 0.85})`;
        ctx.fill();
        ctx.restore();

        // White-hot Core Body (No blur to keep body sharp)
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.16, radius * 0.82, 0, 0, Math.PI * 2);
        ctx.fill();

        // Delicate antennae
        ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-radius * 0.22, -radius * 0.8, radius * 0.45, 0, Math.PI * 1.15, true);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(radius * 0.22, -radius * 0.8, radius * 0.45, -Math.PI * 0.15, Math.PI, true);
        ctx.stroke();

        ctx.restore();
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

            // Track cursor velocity
            if (mousePos && lastMousePosRef.current) {
                const dx = mousePos.x - lastMousePosRef.current.x;
                const dy = mousePos.y - lastMousePosRef.current.y;
                mouseVelocityRef.current = {
                    x: mouseVelocityRef.current.x * 0.78 + dx * 0.18,
                    y: mouseVelocityRef.current.y * 0.78 + dy * 0.18,
                };
            } else {
                mouseVelocityRef.current = {
                    x: mouseVelocityRef.current.x * 0.85,
                    y: mouseVelocityRef.current.y * 0.85,
                };
            }
            lastMousePosRef.current = mousePos;

            // Clear frame
            ctx.clearRect(0, 0, width, height);

            // 1. Pulsing Ambient Glass Glow (Aesthetic gradient backing)
            ambientAngleRef.current += 0.005;
            const ambientGlow = 0.1 + Math.sin(ambientAngleRef.current) * 0.035;
            
            ctx.save();
            const bgGrad = ctx.createRadialGradient(
                centerX, height * 0.6, 15,
                centerX, height * 0.6, width * 0.45
            );
            bgGrad.addColorStop(0, `rgba(255, 182, 193, ${ambientGlow * 0.6})`);
            bgGrad.addColorStop(0.5, `rgba(186, 225, 255, ${ambientGlow * 0.4})`);
            bgGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = bgGrad;
            ctx.beginPath();
            ctx.rect(30, 70, width - 60, height - 100);
            ctx.fill();
            ctx.restore();

            // 1.5 Draw Garden Backdrop Elements
            drawGardenBackdrop(ctx, width, height, centerX);

            // 2. Twinkling Background Sparkles (Stardust)
            const sparkles = sparklesRef.current;
            sparkles.forEach((s) => {
                s.alpha += s.fadeSpeed * s.fadeDir;
                if (s.alpha > 0.6) {
                    s.alpha = 0.6;
                    s.fadeDir = -1;
                } else if (s.alpha < 0.05) {
                    s.alpha = 0.05;
                    s.fadeDir = 1;
                    
                    const newY = 90 + Math.random() * (height - 130);
                    const shalfWidth = getJarWidthAtY(newY, height, width);
                    s.x = centerX + (Math.random() - 0.5) * shalfWidth * 1.8;
                    s.y = newY;
                    s.size = 1 + Math.random() * 1.6;
                }

                ctx.save();
                ctx.shadowBlur = s.size * 2.5;
                ctx.shadowColor = "rgba(253, 230, 138, 0.75)";
                ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // 3. Update & Render Butterflies
            const particles = particlesRef.current;

            particles.forEach((p) => {
                // Record trail history
                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > 5) {
                    p.trail.shift();
                }

                // Flapping wing speed linked to drift velocity (flaps faster when stirred!)
                const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                p.wingAngle += 0.12 + speed * 0.45;

                // Drift physics
                p.angle += p.pulseSpeed;
                p.vx += Math.sin(p.angle) * 0.007;
                p.vy += Math.cos(p.angle) * 0.007;

                // Mouse force repulsion & stir
                if (mousePos) {
                    const dx = p.x - mousePos.x;
                    const dy = p.y - mousePos.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const forceRadius = 75;

                    if (dist < forceRadius) {
                        const force = (forceRadius - dist) / forceRadius;
                        const repulsionAngle = Math.atan2(dy, dx);
                        
                        p.vx += Math.cos(repulsionAngle) * force * 0.14;
                        p.vy += Math.sin(repulsionAngle) * force * 0.14;

                        // Stir effect
                        p.vx += mouseVelocityRef.current.x * force * 0.22;
                        p.vy += mouseVelocityRef.current.y * force * 0.22;
                    }
                }

                // Damping drag
                const speedCap = p.userPrayed ? 1.6 : 0.95;
                p.vx *= 0.93;
                p.vy *= 0.93;

                const curSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
                if (curSpeed > speedCap) {
                    p.vx = (p.vx / curSpeed) * speedCap;
                    p.vy = (p.vy / curSpeed) * speedCap;
                }

                p.x += p.vx;
                p.y += p.vy;

                // Collision limits
                const minY = 72;
                const maxY = height - 42;
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

                // Pulsate alpha glow
                p.alpha += p.pulseSpeed * p.pulseDir;
                if (p.alpha > 0.96) {
                    p.alpha = 0.96;
                    p.pulseDir = -1;
                } else if (p.alpha < 0.25) {
                    p.alpha = 0.25;
                    p.pulseDir = 1;
                }

                const colorHex = p.userPrayed ? "255, 174, 188" : "255, 230, 160";

                // A. Draw Comet Trails
                p.trail.forEach((pt, index) => {
                    const ratio = (index + 1) / p.trail.length;
                    const trailAlpha = p.alpha * ratio * 0.22;
                    const trailRadius = p.radius * ratio * 0.75;

                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, trailRadius, 0, Math.PI * 2);
                    ctx.shadowBlur = (p.userPrayed ? p.radius * 4.2 : p.radius * 2.8) * ratio * 0.6;
                    ctx.shadowColor = `rgba(${colorHex}, ${trailAlpha})`;
                    ctx.fillStyle = p.userPrayed ? `rgba(255, 174, 188, ${trailAlpha})` : `rgba(255, 230, 160, ${trailAlpha})`;
                    ctx.fill();
                    ctx.restore();
                });

                // B. Draw Flapping Butterfly
                drawButterfly(
                    ctx,
                    p.x,
                    p.y,
                    p.radius,
                    Math.atan2(p.vy, p.vx) + Math.PI / 2, // Rotate butterfly to face velocity angle direction
                    p.wingAngle,
                    p.alpha,
                    colorHex,
                    p.userPrayed
                );
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
        let minDist = 30; // Click radius target threshold in px

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
            {/* The Visual Jar Assembly - Enlarged to 380x480 */}
            <div className="relative w-[380px] h-[480px] flex items-center justify-center filter drop-shadow-[0_20px_45px_rgba(24,20,44,0.4)] select-none">
                {/* SVG Glass Bottle Overlay (Bigger with thick base & 3D reflections) */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    viewBox="0 0 380 480"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Cork Lid */}
                    <path
                        d="M140 50 C140 45, 240 45, 240 50 L234 62 C234 65, 146 65, 146 62 Z"
                        fill="#AC8A6D"
                        stroke="#8E7055"
                        strokeWidth="1.8"
                    />
                    {/* Rose-Gold Rim Band */}
                    <rect x="134" y="62" width="112" height="8" rx="2.5" fill="#E2A292" opacity="0.9" />
                    
                    {/* Thick 3D Glass Bottom Base */}
                    <path
                        d="M62 410 
                           C62 435, 72 447, 110 447 
                           L270 447 
                           C308 447, 318 435, 318 410 
                           C318 425, 308 443, 270 443 
                           L110 443 
                           C72 443, 62 425, 62 410 Z"
                        fill="rgba(255, 255, 255, 0.14)"
                    />
                    <path
                        d="M74 426 C74 442, 84 445, 120 445 L260 445 C296 445, 306 442, 306 426"
                        stroke="rgba(255, 255, 255, 0.35)"
                        strokeWidth="2.5"
                    />

                    {/* Glass Jar Outer Frame Outline */}
                    <path
                        d="M140 70 
                           C140 85, 138 95, 138 105 
                           C138 108, 90 135, 75 165 
                           C62 190, 60 230, 60 360 
                           C60 425, 68 450, 110 450 
                           L270 450 
                           C312 450, 320 425, 320 360 
                           C320 230, 318 190, 305 165 
                           C290 135, 242 108, 242 105 
                           C242 95, 240 85, 240 70"
                        stroke="rgba(255, 255, 255, 0.88)"
                        strokeWidth="3.2"
                    />
                    
                    {/* Glass Body Inner Rim Reflection */}
                    <path
                        d="M141 72 
                           C141 87, 139 97, 139 107 
                           C139 110, 92 137, 77 167 
                           C64 192, 62 232, 62 360 
                           C62 423, 70 447, 110 447 
                           L270 447 
                           C310 447, 318 423, 318 360 
                           C318 232, 316 192, 303 167 
                           C290 137, 243 110, 243 107 
                           C243 97, 241 87, 241 72"
                        stroke="rgba(255, 255, 255, 0.38)"
                        strokeWidth="5.5"
                    />

                    {/* Spherical Glare Highlight (Left Curved side) */}
                    <path
                        d="M74 180 C68 220, 68 350, 78 415"
                        stroke="rgba(255, 255, 255, 0.44)"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                    />

                    {/* Spherical Glare Highlight (Right Curved side) */}
                    <path
                        d="M306 180 C312 220, 312 350, 302 415"
                        stroke="rgba(255, 255, 255, 0.16)"
                        strokeWidth="2.0"
                        strokeLinecap="round"
                    />

                    {/* Twine rope neck ribbon */}
                    <path
                        d="M138 90 Q190 96 242 90"
                        stroke="#8E7055"
                        strokeWidth="2.2"
                    />
                    <path
                        d="M190 92 C184 86, 176 83, 178 92 C180 101, 188 95, 190 92 Z"
                        stroke="#8E7055"
                        strokeWidth="1.5"
                        fill="rgba(142, 112, 85, 0.2)"
                    />
                    <path
                        d="M190 92 C196 86, 204 83, 202 92 C200 101, 192 95, 190 92 Z"
                        stroke="#8E7055"
                        strokeWidth="1.5"
                        fill="rgba(142, 112, 85, 0.2)"
                    />
                </svg>

                {/* Canvas Render Node with Dreamy Pastel Gradient */}
                <canvas
                    ref={canvasRef}
                    width={380}
                    height={480}
                    className="absolute inset-0 bg-gradient-to-b from-[#E8F5E9] via-[#FFF3E0] to-[#FFF0F5] rounded-[3.8rem] cursor-pointer border border-white/20"
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    onClick={handleCanvasClick}
                />

                {/* Ambient glow backing */}
                <div className="absolute inset-x-12 inset-y-16 bg-radial-gradient from-pink-300/15 via-purple-300/8 to-transparent filter blur-3xl pointer-events-none rounded-full" />
                
                {/* Floating prompt overlay */}
                {!selectedPrayerId && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-pink-200/50 text-[10px] text-pink-500 font-bold uppercase tracking-widest flex items-center gap-1.5 pointer-events-none shadow-sm animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 text-pink-400 fill-pink-300" />
                        Tap a butterfly to pray ౨ৎ
                    </div>
                )}
            </div>

            {/* Selected Prayer Preview Detail Card */}
            {selectedPrayer ? (
                <div className="w-full max-w-md bg-white/90 backdrop-blur-lg border border-white/70 shadow-2xl rounded-[2rem] p-6 flex flex-col gap-4.5 animate-fade-in-up text-left z-20">
                    <div className="flex justify-between items-start">
                        {selectedPrayer.is_anonymous ? (
                            <div className="flex items-center gap-3">
                                <div className="w-9.5 h-9.5 rounded-full flex items-center justify-center text-xs font-serif bg-warm-grey/10 text-warm-grey/40">
                                    ?
                                </div>
                                <div>
                                    <h4 className="font-bold text-warm-grey text-sm">Anonymous Sister</h4>
                                    <p className="text-[10px] text-warm-grey/40 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(selectedPrayer.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <Link 
                                href={`/profile/${selectedPrayer.profiles?.username || ""}`}
                                className="flex items-center gap-3 group/link hover:opacity-95 transition-opacity"
                            >
                                <div className="w-9.5 h-9.5 rounded-full flex items-center justify-center text-xs font-serif bg-soft-blush text-warm-cocoa group-hover/link:ring-2 ring-sage-green transition-all overflow-hidden">
                                    {selectedPrayer.profiles?.first_name?.[0] || "S"}
                                </div>
                                <div>
                                    <h4 className="font-bold text-warm-grey text-sm group-hover/link:text-sage-green transition-colors">
                                        {selectedPrayer.profiles?.first_name} {selectedPrayer.profiles?.last_name?.[0] || ""}.
                                    </h4>
                                    <p className="text-[10px] text-warm-grey/40 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDistanceToNow(new Date(selectedPrayer.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            </Link>
                        )}
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
