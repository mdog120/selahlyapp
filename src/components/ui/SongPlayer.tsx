"use client";

import { useState, useRef } from "react";
import { Play, Pause, Music } from "lucide-react";

interface SongPlayerProps {
    previewUrl?: string | null;
    color?: string; // e.g. "rose"
}

export function SongPlayer({ previewUrl, color = "rose" }: SongPlayerProps) {
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    if (!previewUrl) return null;

    const togglePlay = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio(previewUrl);
            audioRef.current.volume = 0.5;
            audioRef.current.onended = () => setPlaying(false);
        }

        if (playing) {
            audioRef.current.pause();
            setPlaying(false);
        } else {
            // Pause all other audio elements on the page if any (optional but good UX)
            document.querySelectorAll('audio').forEach(el => el.pause());

            audioRef.current.play();
            setPlaying(true);
        }
    };

    return (
        <button
            onClick={togglePlay}
            className={`
                w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all
                ${playing ? 'bg-muted-rose text-white shadow-md scale-110' : 'bg-stone-100 text-warm-grey/40 hover:bg-stone-200'}
            `}
            title={playing ? "Pause Snippet" : "Play Snippet"}
        >
            {playing ? (
                <div className="flex gap-0.5 items-end h-3">
                    <span className="w-0.5 h-3 bg-white animate-[bounce_1s_infinite]" />
                    <span className="w-0.5 h-2 bg-white animate-[bounce_1.2s_infinite]" />
                    <span className="w-0.5 h-3 bg-white animate-[bounce_0.8s_infinite]" />
                </div>
            ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
        </button>
    );
}
