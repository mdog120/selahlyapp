"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, Music, Trash2, Edit } from "lucide-react";

interface RetroCassetteProps {
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
    shell: string;
    label: string;
    accent: string;
    textColor: string;
    reelHub: string;
}> = {
    rose: {
        shell: "bg-pink-400/95 border-pink-500/80 shadow-pink-100/50",
        label: "bg-pink-50/90 border-pink-200/50",
        accent: "bg-pink-200/60",
        textColor: "text-pink-800",
        reelHub: "bg-pink-300/60"
    },
    blue: {
        shell: "bg-indigo-400/95 border-indigo-500/80 shadow-indigo-100/50",
        label: "bg-indigo-50/90 border-indigo-200/50",
        accent: "bg-indigo-200/60",
        textColor: "text-indigo-800",
        reelHub: "bg-indigo-300/60"
    },
    green: {
        shell: "bg-emerald-400/95 border-emerald-500/80 shadow-emerald-100/50",
        label: "bg-emerald-50/90 border-emerald-200/50",
        accent: "bg-emerald-200/60",
        textColor: "text-emerald-800",
        reelHub: "bg-emerald-300/60"
    },
    orange: {
        shell: "bg-orange-400/95 border-orange-500/80 shadow-orange-100/50",
        label: "bg-orange-50/90 border-orange-200/50",
        accent: "bg-orange-200/60",
        textColor: "text-orange-800",
        reelHub: "bg-orange-300/60"
    },
    purple: {
        shell: "bg-purple-400/95 border-purple-500/80 shadow-purple-100/50",
        label: "bg-purple-50/90 border-purple-200/50",
        accent: "bg-purple-200/60",
        textColor: "text-purple-800",
        reelHub: "bg-purple-300/60"
    },
    yellow: {
        shell: "bg-yellow-400/95 border-yellow-500/80 shadow-yellow-100/50",
        label: "bg-yellow-50/90 border-yellow-200/50",
        accent: "bg-yellow-200/60",
        textColor: "text-yellow-800",
        reelHub: "bg-yellow-300/60"
    }
};

export function RetroCassette({
    title,
    artist,
    previewUrl,
    color = "rose",
    onPlayingChange,
    isEditable = false,
    onEditClick,
    onDeleteClick
}: RetroCassetteProps) {
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
            document.querySelectorAll('audio').forEach(el => el.pause());
            audioRef.current.play().catch(err => console.error("Audio playback error:", err));
            setIsPlaying(true);
        }
    };

    return (
        <div className="w-full max-w-sm mx-auto select-none relative group animate-fade-in">
            {/* The Cassette Outer Body */}
            <div 
                onClick={previewUrl ? togglePlay : undefined}
                className={`
                    w-full rounded-2xl p-3 border-4 border-stone-800/90 shadow-lg relative aspect-[1.6/1] flex flex-col justify-between transition-all duration-300
                    ${theme.shell}
                    ${previewUrl ? "cursor-pointer hover:scale-[1.02] active:scale-95" : ""}
                `}
            >
                {/* Vintage metallic details (Screws in 4 corners) */}
                <div className="absolute top-1 left-1.5 w-2.5 h-2.5 rounded-full bg-stone-700/60 border border-stone-600/50 flex items-center justify-center text-[5px] text-stone-900 font-bold select-none">+</div>
                <div className="absolute top-1 right-1.5 w-2.5 h-2.5 rounded-full bg-stone-700/60 border border-stone-600/50 flex items-center justify-center text-[5px] text-stone-900 font-bold select-none">+</div>
                <div className="absolute bottom-1 left-1.5 w-2.5 h-2.5 rounded-full bg-stone-700/60 border border-stone-600/50 flex items-center justify-center text-[5px] text-stone-900 font-bold select-none">+</div>
                <div className="absolute bottom-1 right-1.5 w-2.5 h-2.5 rounded-full bg-stone-700/60 border border-stone-600/50 flex items-center justify-center text-[5px] text-stone-900 font-bold select-none">+</div>

                {/* Inner Border Line */}
                <div className="absolute inset-1.5 border border-stone-800/10 rounded-xl pointer-events-none"></div>

                {/* Label Sticker */}
                <div className={`w-full h-[62%] rounded-lg border-2 border-stone-800/80 p-2.5 flex flex-col justify-between relative overflow-hidden shadow-inner ${theme.label}`}>
                    
                    {/* Decorative tape stripe */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 opacity-60"></div>
                    
                    {/* Side A & Write-in lines */}
                    <div className="flex justify-between items-start pt-1 z-10">
                        <span className="text-[10px] font-bold font-sans text-stone-700/80 border-2 border-stone-700/60 rounded px-1 leading-none bg-white/50">A</span>
                        <div className="flex-1 mx-4 border-b border-dashed border-stone-400/60 h-3"></div>
                        <span className="text-[8px] font-bold text-stone-500/80 font-mono">120 min</span>
                    </div>

                    {/* Song Metadata (Handwritten Retro Style) */}
                    <div className="z-10 text-center pb-1 flex flex-col items-center">
                        <h4 className="font-serif italic font-bold text-stone-800 text-sm md:text-base tracking-wide truncate max-w-[90%] leading-tight">
                            {title || "My Anthem"}
                        </h4>
                        <p className="text-[10px] text-stone-600 font-medium tracking-wider truncate max-w-[80%] font-sans">
                            {artist || "Unknown Artist"}
                        </p>
                    </div>
                </div>

                {/* Bottom Section (Center window & Trapeze holes) */}
                <div className="w-full flex justify-between items-center px-4 pt-1 h-[32%] z-10">
                    
                    {/* Left Small Hole */}
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-stone-800/40"></div>

                    {/* Tape Reels Center Window */}
                    <div className="w-[62%] bg-stone-950/95 border-2 border-stone-800/90 rounded-lg h-full flex items-center justify-around relative overflow-hidden px-2 py-1 shadow-inner">
                        {/* Magnetic tape roll background (brown shade) */}
                        <div className="absolute inset-x-4 inset-y-1 bg-amber-950/20 rounded-full blur-[1px]"></div>
                        
                        {/* Left Reel Hub */}
                        <div className="relative w-6 h-6 rounded-full border border-stone-700/60 bg-stone-850 flex items-center justify-center shrink-0 shadow-md">
                            <div className={`w-4.5 h-4.5 rounded-full border border-dashed border-stone-500/80 bg-stone-900 flex items-center justify-center ${isPlaying ? "animate-[spin_3s_linear_infinite]" : ""} ${theme.reelHub}`}>
                                <div className="w-2 h-2 rounded-full bg-stone-950 border border-stone-800"></div>
                            </div>
                        </div>

                        {/* Center Indicator / Tape showing */}
                        <div className="flex-1 h-2 mx-1 relative flex items-center justify-center">
                            <div className="w-full h-[3px] bg-amber-950/90 border-y border-stone-900/60"></div>
                            {/* Pulse line when playing */}
                            {isPlaying && (
                                <div className="absolute w-1.5 h-1.5 bg-muted-rose rounded-full animate-ping"></div>
                            )}
                        </div>

                        {/* Right Reel Hub */}
                        <div className="relative w-6 h-6 rounded-full border border-stone-700/60 bg-stone-850 flex items-center justify-center shrink-0 shadow-md">
                            <div className={`w-4.5 h-4.5 rounded-full border border-dashed border-stone-500/80 bg-stone-900 flex items-center justify-center ${isPlaying ? "animate-[spin_3s_linear_infinite]" : ""} ${theme.reelHub}`}>
                                <div className="w-2 h-2 rounded-full bg-stone-950 border border-stone-800"></div>
                            </div>
                        </div>
                    </div>

                    {/* Right Small Hole */}
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-stone-800/40"></div>
                </div>

                {/* Play/Pause Overlay Icon (visible on hover) */}
                {previewUrl && (
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex items-center justify-center pointer-events-none z-20">
                        <div className="w-10 h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-stone-800 scale-90 group-hover:scale-100 transition-transform duration-300">
                            {isPlaying ? (
                                <Pause className="w-5 h-5 fill-current" />
                            ) : (
                                <Play className="w-5 h-5 fill-current ml-0.5" />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Editable Action overlays (only visible if isEditable is true) */}
            {isEditable && (
                <div className="absolute top-2 right-2 flex gap-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEditClick?.(); }}
                        className="p-1.5 bg-white border border-stone-200 text-stone-700 hover:text-deep-velvet rounded-full shadow-sm hover:scale-105 transition-transform"
                        title="Change Song"
                    >
                        <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDeleteClick?.(); }}
                        className="p-1.5 bg-white border border-stone-200 text-stone-700 hover:text-red-500 rounded-full shadow-sm hover:scale-105 transition-transform"
                        title="Remove Song"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}
