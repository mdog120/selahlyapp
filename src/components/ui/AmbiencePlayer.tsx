"use client";

import { useEffect, useRef, useState } from "react";
import { Music } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AmbiencePlayer() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    // Track user preference and setup interaction listener to resume play if enabled
    useEffect(() => {
        // Default to true (play ambient music) unless the user has explicitly turned it off
        const savedPref = localStorage.getItem("selahly_ambient_music") !== "false";
        setIsPlaying(savedPref);

        // Standard browsers block autoplay until a user interaction occurs.
        // If the user has it enabled, we play it on their first click/tap anywhere.
        if (savedPref) {
            const startOnInteraction = (e: Event) => {
                // If they click/tap the ambience toggle button itself, let handleToggle handle it.
                if (e.target instanceof Element && e.target.closest("#ambience-toggle-btn")) {
                    return;
                }
                if (audioRef.current && audioRef.current.paused) {
                    audioRef.current.play()
                        .then(() => {
                            setIsPlaying(true);
                        })
                        .catch(err => console.log("Ambient play on interaction failed:", err));
                }
                window.removeEventListener("click", startOnInteraction);
                window.removeEventListener("touchstart", startOnInteraction);
            };
            window.addEventListener("click", startOnInteraction);
            window.addEventListener("touchstart", startOnInteraction);

            return () => {
                window.removeEventListener("click", startOnInteraction);
                window.removeEventListener("touchstart", startOnInteraction);
            };
        }
    }, []);

    const [pausedByPost, setPausedByPost] = useState(false);

    // Listen to post song playback events to pause/resume ambient music
    useEffect(() => {
        const handlePostPlay = () => setPausedByPost(true);
        const handlePostStop = () => setPausedByPost(false);

        window.addEventListener("selahly_post_audio_play", handlePostPlay);
        window.addEventListener("selahly_post_audio_stop", handlePostStop);

        return () => {
            window.removeEventListener("selahly_post_audio_play", handlePostPlay);
            window.removeEventListener("selahly_post_audio_stop", handlePostStop);
        };
    }, []);

    // Handle audio play/pause states based on state changes
    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.volume = 0.05; // Keep it very soft and soothing in the background (5% volume)

        if (isPlaying && !pausedByPost) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Play failed or blocked by autoplay restrictions:", error);
                    // Do NOT reset isPlaying or localStorage preference here,
                    // just wait for the interaction listener or direct button tap.
                });
            }
            localStorage.setItem("selahly_ambient_music", "true");
        } else {
            audioRef.current.pause();
            if (!pausedByPost) {
                localStorage.setItem("selahly_ambient_music", "false");
            }
        }
    }, [isPlaying, pausedByPost]);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsPlaying(!isPlaying);
    };

    return (
        <>
            <audio
                ref={audioRef}
                src="https://archive.org/download/Gymnopedie_201309/Gymnop%C3%A9die%20No.%201.mp3"
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
                    id="ambience-toggle-btn"
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
