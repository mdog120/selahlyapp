"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Music, Loader2, Play, Pause, X, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

type SongResult = {
    trackId: number;
    trackName: string;
    artistName: string;
    artworkUrl100: string;
    previewUrl: string;
    collectionViewUrl: string;
    primaryGenreName: string;
};

interface SongSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (song: { title: string; artist: string; link: string; previewUrl: string; artwork: string }) => void;
}

export function SongSearchModal({ isOpen, onClose, onSelect }: SongSearchModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SongResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [playingId, setPlayingId] = useState<number | null>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-warm-grey/10 flex justify-between items-center bg-warm-paper">
                    <div>
                        <h3 className="font-serif text-xl text-warm-cocoa">Select your Anthem</h3>
                        <p className="text-xs text-warm-grey/60">Search for your favorite worship song.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-stone-200/50 rounded-full transition-colors">
                        <X className="w-5 h-5 text-warm-grey" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 bg-white">
                    <div className="relative flex items-center">
                        <Search className="absolute left-4 w-4 h-4 text-warm-grey/40" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Search title, artist, or lyrics..."
                            className="w-full pl-10 pr-4 py-3 bg-stone-50 rounded-xl text-sm outline-none focus:ring-2 ring-muted-rose/20 transition-all border border-transparent focus:border-muted-rose/10"
                            autoFocus
                        />
                        <Button
                            onClick={handleSearch}
                            disabled={loading}
                            className="absolute right-2 h-8 px-3 text-xs bg-warm-cocoa hover:bg-deep-velvet text-white rounded-lg"
                        >
                            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Search"}
                        </Button>
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-stone-50/50">
                    {results.length === 0 && !loading && (
                        <div className="text-center py-12 text-warm-grey/40">
                            <Music className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Search for a song to begin</p>
                        </div>
                    )}

                    {results.map((song) => (
                        <div key={song.trackId} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-100 hover:border-muted-rose/30 transition-all group shadow-sm">
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-stone-200">
                                <img src={song.artworkUrl100} alt={song.trackName} className="w-full h-full object-cover" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); togglePreview(song.previewUrl, song.trackId); }}
                                    className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                >
                                    {playingId === song.trackId ? (
                                        <Pause className="w-5 h-5 text-white fill-current" />
                                    ) : (
                                        <Play className="w-5 h-5 text-white fill-current" />
                                    )}
                                </button>
                            </div>

                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-warm-grey truncate text-sm">{song.trackName}</h4>
                                <p className="text-xs text-warm-grey/60 truncate">{song.artistName}</p>
                            </div>

                            <Button
                                size="sm"
                                onClick={() => handleSelect(song)}
                                className="shrink-0 bg-transparent hover:bg-soft-blush text-muted-rose border border-muted-rose/20"
                            >
                                Select
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (mounted) {
        return createPortal(modalContent, document.body);
    }

    return null;

    async function handleSearch() {
        if (!query.trim()) return;
        setLoading(true);
        setPlayingId(null);
        if (audio) {
            audio.pause();
            setAudio(null);
        }

        try {
            // Searching specifically in the music entity with strict Christian filtering
            const term = `${query} Christian`;
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=30`);
            const data = await res.json();

            // Client-side double check to ensure genre matches
            // Relax genre check to allow all iTunes Christian search query results (prevents missing songs categorized as Pop/Rock/Alternative)
            const filteredResults = data.results || [];

            setResults(filteredResults);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function togglePreview(url: string, id: number) {
        if (playingId === id && audio) {
            audio.pause();
            setPlayingId(null);
            setAudio(null);
        } else {
            if (audio) audio.pause();
            const newAudio = new Audio(url);
            newAudio.volume = 0.5;
            newAudio.play();
            newAudio.onended = () => setPlayingId(null);
            setAudio(newAudio);
            setPlayingId(id);
        }
    }

    function handleSelect(song: SongResult) {
        if (audio) audio.pause();
        onSelect({
            title: song.trackName,
            artist: song.artistName,
            link: song.collectionViewUrl, // Helper link to Apple Music
            previewUrl: song.previewUrl,
            artwork: song.artworkUrl100
        });
        onClose();
    }
}
