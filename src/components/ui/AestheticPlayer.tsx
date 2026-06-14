"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Edit, Trash2 } from "lucide-react";

interface AestheticPlayerProps {
    title: string;
    artist: string;
    previewUrl?: string | null;
    color?: string; // 'rose' | 'blue' | 'green' | 'orange' | 'purple' | 'yellow'
    onPlayingChange?: (isPlaying: boolean) => void;
    isEditable?: boolean;
    onEditClick?: () => void;
    onDeleteClick?: () => void;
}

const COLOR_THEMES: Record<string, {
    cardBorder: string;
    labelBg: string;
    buttonBg: string;
    buttonText: string;
    waveBg: string;
    glow: string;
}> = {
    rose: {
        cardBorder: "border-pink-200/40",
        labelBg: "bg-pink-100 border-pink-200/60 text-pink-700",
        buttonBg: "bg-pink-50 hover:bg-pink-100/80 active:bg-pink-200/40 border-pink-100/40",
        buttonText: "text-pink-600",
        waveBg: "bg-pink-400",
        glow: "shadow-pink-100/40"
    },
    blue: {
        cardBorder: "border-sky-200/40",
        labelBg: "bg-sky-100 border-sky-200/60 text-sky-700",
        buttonBg: "bg-sky-50 hover:bg-sky-100/80 active:bg-sky-200/40 border-sky-100/40",
        buttonText: "text-sky-600",
        waveBg: "bg-sky-400",
        glow: "shadow-sky-100/40"
    },
    green: {
        cardBorder: "border-emerald-200/40",
        labelBg: "bg-emerald-100 border-emerald-200/60 text-emerald-700",
        buttonBg: "bg-emerald-50 hover:bg-emerald-100/80 active:bg-emerald-200/40 border-emerald-100/40",
        buttonText: "text-emerald-600",
        waveBg: "bg-emerald-400",
        glow: "shadow-emerald-100/40"
    },
    orange: {
        cardBorder: "border-orange-200/40",
        labelBg: "bg-orange-100 border-orange-200/60 text-orange-700",
        buttonBg: "bg-orange-50 hover:bg-orange-100/80 active:bg-orange-200/40 border-orange-100/40",
        buttonText: "text-orange-600",
        waveBg: "bg-orange-400",
        glow: "shadow-orange-100/40"
    },
    purple: {
        cardBorder: "border-purple-200/40",
        labelBg: "bg-purple-100 border-purple-200/60 text-purple-700",
        buttonBg: "bg-purple-50 hover:bg-purple-100/80 active:bg-purple-200/40 border-purple-100/40",
        buttonText: "text-purple-600",
        waveBg: "bg-purple-400",
        glow: "shadow-purple-100/40"
    },
    yellow: {
        cardBorder: "border-amber-200/40",
        labelBg: "bg-amber-100 border-amber-200/60 text-amber-700",
        buttonBg: "bg-amber-50 hover:bg-amber-100/80 active:bg-amber-200/40 border-amber-100/40",
        buttonText: "text-amber-600",
        waveBg: "bg-amber-400",
        glow: "shadow-amber-100/40"
    }
};

export function AestheticPlayer({
    title,
    artist,
    previewUrl,
    color = "rose",
    onPlayingChange,
    isEditable = false,
    onEditClick,
    onDeleteClick
}: AestheticPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const theme = COLOR_THEMES[color] || COLOR_THEMES.rose;

    useEffect(() => {
        onPlayingChange?.(isPlaying);
    }, [isPlaying, onPlayingChange]);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!previewUrl) return;

        if (!audioRef.current) {
            audioRef.current = new Audio(previewUrl);
            audioRef.current.volume = 0.5;
            audioRef.current.onended = () => setIsPlaying(false);
        }

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            // Pause any other audio playing on the page
            document.querySelectorAll("audio").forEach((el) => el.pause());
            audioRef.current.play().catch((err) => console.error("Audio playback error:", err));
            setIsPlaying(true);
        }
    };

    return (
        <div className="w-full max-w-[320px] select-none relative group animate-fade-in">
            {/* Elegant Glassmorphic Card Container */}
            <div 
                onClick={previewUrl ? togglePlay : undefined}
                className={`
                    w-full rounded-2xl p-4 border glass-card flex items-center gap-4 relative overflow-hidden transition-all duration-300 shadow-sm
                    ${theme.cardBorder} ${theme.glow}
                    ${previewUrl ? "cursor-pointer hover:shadow-md hover:scale-[1.01] active:scale-[0.99]" : ""}
                `}
            >
                {/* Vinyl Record Section (Left) */}
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center z-10">
                    
                    {/* The Frosted Pearl Vinyl Disk */}
                    <div 
                        className={`
                            w-16 h-16 rounded-full border border-warm-grey/10 bg-white/70 shadow-md flex items-center justify-center relative transition-transform duration-700 overflow-hidden
                            ${isPlaying ? "animate-[spin_8s_linear_infinite]" : ""}
                        `}
                    >
                        {/* Vinyl Grooves (Concentric Circles) */}
                        <div className="absolute inset-1 rounded-full border border-warm-grey/5"></div>
                        <div className="absolute inset-2.5 rounded-full border border-dashed border-warm-grey/10"></div>
                        <div className="absolute inset-4 rounded-full border border-warm-grey/5"></div>
                        
                        {/* Center Pastel Label */}
                        <div className={`w-6 h-6 rounded-full border shadow-inner flex items-center justify-center absolute z-10 ${theme.labelBg}`}>
                            {/* Tiny Spindle Hole */}
                            <div className="w-1.5 h-1.5 rounded-full bg-white border border-warm-grey/15 shadow-sm"></div>
                        </div>

                        {/* Sheen Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent pointer-events-none rounded-full"></div>
                    </div>

                    {/* Minimalist Pivoting Tone Arm Stylus */}
                    <div 
                        className="absolute top-0 right-0 w-8 h-10 origin-top-right transition-transform duration-700 ease-in-out pointer-events-none z-20"
                        style={{
                            transform: isPlaying ? "rotate(16deg) translateX(-2px) translateY(1px)" : "rotate(-20deg)"
                        }}
                    >
                        {/* Base connector */}
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-warm-cocoa/40 border border-warm-cocoa/20 shadow-sm flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-warm-cocoa"></div>
                        </div>
                        {/* Needle shaft */}
                        <div className="absolute top-1 right-1.5 w-0.5 h-7 bg-warm-cocoa/50 origin-top rotate-[25deg]"></div>
                        {/* Needle head/cartridge */}
                        <div className="absolute top-[28px] left-[3px] w-1.5 h-2.5 bg-warm-cocoa rounded-[1px] rotate-[22deg] shadow-sm"></div>
                    </div>
                </div>

                {/* Song Meta Details & Control Panel (Right) */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    
                    {/* Song Title (Full view, no truncation, responsive font sizing) */}
                    <h4 className="font-serif italic font-bold text-warm-cocoa text-xs md:text-sm leading-tight break-words text-left">
                        {title || "My Anthem"}
                    </h4>
                    
                    {/* Artist Name (Full view, no truncation) */}
                    <p className="text-[10px] md:text-xs text-warm-grey/50 font-medium tracking-wide leading-tight break-words text-left mt-0.5">
                        {artist || "Unknown Artist"}
                    </p>

                    {/* Interactive elements */}
                    <div className="flex items-center gap-3.5 mt-2.5">
                        {/* Play/Pause Button */}
                        {previewUrl && (
                            <button
                                type="button"
                                onClick={togglePlay}
                                className={`
                                    w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 scale-95 hover:scale-105 active:scale-95 shadow-sm
                                    ${theme.buttonBg} ${theme.buttonText}
                                `}
                            >
                                {isPlaying ? (
                                    <Pause className="w-3.5 h-3.5 fill-current" />
                                ) : (
                                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                )}
                            </button>
                        )}

                        {/* Soundwave Micro-Visualizer */}
                        <div className="flex items-end gap-[3px] h-3.5 pb-0.5">
                            <div className={`w-[2px] rounded-full transition-all duration-300 ${theme.waveBg} ${isPlaying ? "h-3 animate-soundwave animation-delay-100" : "h-1.5"}`}></div>
                            <div className={`w-[2px] rounded-full transition-all duration-300 ${theme.waveBg} ${isPlaying ? "h-4 animate-soundwave animation-delay-300" : "h-2"}`}></div>
                            <div className={`w-[2px] rounded-full transition-all duration-300 ${theme.waveBg} ${isPlaying ? "h-3.5 animate-soundwave animation-delay-200" : "h-1.5"}`}></div>
                            <div className={`w-[2px] rounded-full transition-all duration-300 ${theme.waveBg} ${isPlaying ? "h-2 animate-soundwave animation-delay-400" : "h-1"}`}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit/Delete Controls Overlays */}
            {isEditable && (
                <div className="absolute top-2 right-2 flex gap-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onEditClick?.(); }}
                        className="p-1 bg-white/95 border border-warm-grey/10 text-warm-cocoa hover:text-deep-velvet rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
                        title="Change Song"
                    >
                        <Edit className="w-3 h-3" />
                    </button>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDeleteClick?.(); }}
                        className="p-1 bg-white/95 border border-warm-grey/10 text-warm-cocoa hover:text-red-500 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
                        title="Remove Song"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
}
