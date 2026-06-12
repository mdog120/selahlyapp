"use client";

import { useEffect, useRef, useState } from "react";
import { Music, VolumeX, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AmbiencePlayer() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    // Persist audio preference across page reloads
    useEffect(() => {
        const savedPref = localStorage.getItem("selahly_ambient_music");
        if (savedPref === "true") {
            // Browsers block autoplay on fresh load, so we try playing.
            // If blocked, it will fall back to paused state.
            setIsPlaying(true);
        }
    }, []);

    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.volume = 0.12; // Keep it soft and ambient in the background

        if (isPlaying) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    console.log("Ambient autoplay blocked by browser policy. Waiting for user interaction.");
                    setIsPlaying(false);
                });
            }
            localStorage.setItem("selahly_ambient_music", "true");
        } else {
            audioRef.current.pause();
            localStorage.setItem("selahly_ambient_music", "false");
        }
    }, [isPlaying]);

    const handleToggle = () => {
        setIsPlaying(!isPlaying);
    };

    return (
        <>
            <audio
                ref={audioRef}
                src="https://upload.wikimedia.org/wikipedia/commons/b/b5/Gymnopedie_No._1_%28ISRC_USUAN1100787%29.mp3"
                loop
            />

            {/* Floating Coquette-styled Ambient Player */}
            <div 
                className="fixed bottom-24 right-4 z-40 select-none flex items-center gap-2"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <AnimatePresence>
                    {showTooltip && (
                        <motion.div
                            initial={{ opacity: 0, x: 10, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 10, scale: 0.9 }}
                            className="bg-white/95 backdrop-blur-xl border border-pink-100/40 text-warm-cocoa px-3 py-1.5 rounded-2xl text-[9px] font-bold tracking-wider uppercase shadow-sm select-none pointer-events-none"
                        >
                            <span>Sanctuary Music</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={handleToggle}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-[0.93] shadow-md ${
                        isPlaying 
                            ? "bg-white border-pink-200/60 text-muted-rose" 
                            : "bg-white/80 backdrop-blur-sm border-stone-200/50 text-warm-grey/40 hover:text-warm-grey hover:bg-white"
                    }`}
                >
                    {isPlaying ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                            className="flex items-center justify-center relative"
                        >
                            <span className="font-serif text-sm relative top-[0.5px]">౨ৎ</span>
                            <span className="absolute -top-1 -right-1.5 w-1.5 h-1.5 rounded-full bg-pink-300 animate-ping" />
                        </motion.div>
                    ) : (
                        <Music className="w-4 h-4" />
                    )}
                </button>
            </div>
        </>
    );
}
