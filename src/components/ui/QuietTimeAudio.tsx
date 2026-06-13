"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play, Pause, Compass, Music, CloudRain, Flame, Disc } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SOUNDSCAPES = [
    { id: "rain", name: "Soft Rain 🌧️", url: "/audio/rain.mp3", icon: CloudRain },
    { id: "fire", name: "Crackling Fire 🪵", url: "/audio/fire.mp3", icon: Flame },
    { id: "nature", name: "Forest Birds 🕊️", url: "/audio/birds.mp3", icon: Compass },
    { id: "musicbox", name: "Music Box ౨ৎ", url: "/audio/musicbox.mp3", icon: Music }
] as const;

export function QuietTimeAudio() {
    const [isOpen, setIsOpen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedSound, setSelectedSound] = useState<typeof SOUNDSCAPES[number]["id"]>("rain");
    const [volume, setVolume] = useState(0.5);
    const [isMuted, setIsMuted] = useState(false);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Create audio element on client mount
        audioRef.current = new Audio();
        audioRef.current.loop = true;
        audioRef.current.volume = volume;
        
        // Find URL for default sound
        const track = SOUNDSCAPES.find(s => s.id === selectedSound);
        if (track) {
            audioRef.current.src = track.url;
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Handle track change
    useEffect(() => {
        if (!audioRef.current) return;
        
        const track = SOUNDSCAPES.find(s => s.id === selectedSound);
        if (!track) return;

        const wasPlaying = isPlaying;
        
        audioRef.current.pause();
        audioRef.current.src = track.url;
        audioRef.current.load();
        
        if (wasPlaying) {
            audioRef.current.play().catch(e => {
                console.error("Autoplay blocked:", e);
                setIsPlaying(false);
            });
        }
    }, [selectedSound]);

    // Handle volume change
    useEffect(() => {
        if (!audioRef.current) return;
        audioRef.current.volume = isMuted ? 0 : volume;
    }, [volume, isMuted]);

    // Toggle playback
    const togglePlayback = () => {
        if (!audioRef.current) return;
        
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play().then(() => {
                setIsPlaying(true);
            }).catch(e => {
                console.error("Audio playback failed:", e);
                alert("Please click anywhere on the page first, then try playing!");
            });
        }
    };

    const handleVolumeSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (val > 0 && isMuted) {
            setIsMuted(false);
        }
    };

    const currentTrack = SOUNDSCAPES.find(s => s.id === selectedSound);
    const TrackIcon = currentTrack ? currentTrack.icon : Disc;

    return (
        <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 15 }}
                        className="bg-white/95 border border-pink-100/50 backdrop-blur-md p-4 rounded-3xl shadow-xl w-60 mb-3 text-left relative z-50 text-warm-grey"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-rose mb-3 flex items-center gap-1.5">
                            <Disc className={`w-3.5 h-3.5 ${isPlaying ? 'animate-spin-slow' : ''}`} />
                            <span>Quiet-Time Vibe</span>
                        </div>

                        {/* Track Selection */}
                        <div className="space-y-1.5 mb-4">
                            {SOUNDSCAPES.map((sound) => {
                                const Icon = sound.icon;
                                const isActive = selectedSound === sound.id;
                                return (
                                    <button
                                        key={sound.id}
                                        onClick={() => setSelectedSound(sound.id)}
                                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-all border ${
                                            isActive
                                                ? "bg-muted-rose/10 border-muted-rose/25 text-muted-rose font-bold"
                                                : "bg-transparent border-transparent hover:bg-stone-50 text-warm-grey/80"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-3.5 h-3.5" />
                                            <span>{sound.name}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between gap-3 pt-3 border-t border-warm-grey/5">
                            <button
                                onClick={togglePlayback}
                                className="w-8 h-8 rounded-full bg-muted-rose text-white flex items-center justify-center shadow hover:bg-muted-rose/95 transition-colors shrink-0"
                            >
                                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                            </button>

                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="text-warm-grey/50 hover:text-warm-cocoa transition-colors"
                                >
                                    {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                </button>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeSliderChange}
                                    className="w-full h-1 bg-stone-100 accent-muted-rose rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center border transition-all relative z-50 ${
                    isPlaying 
                        ? "bg-muted-rose text-white border-muted-rose hover:bg-muted-rose/90 animate-pulse" 
                        : "bg-white text-warm-grey/60 border-pink-100 hover:bg-stone-50"
                }`}
            >
                {isPlaying ? (
                    <div className="flex gap-0.5 items-end justify-center w-5 h-5">
                        <div className="w-0.5 h-3 bg-white animate-soundwave animation-delay-100" />
                        <div className="w-0.5 h-4 bg-white animate-soundwave animation-delay-200" />
                        <div className="w-0.5 h-2.5 bg-white animate-soundwave animation-delay-300" />
                    </div>
                ) : (
                    <TrackIcon className="w-5 h-5" />
                )}
            </motion.button>
        </div>
    );
}
