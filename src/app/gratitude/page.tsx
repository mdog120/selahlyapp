"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2, X, Check, Heart, Smile } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GratitudeNote {
    id: string;
    content: string;
    color: 'pink' | 'blue' | 'green' | 'yellow' | 'purple';
    created_at: string;
    user_id: string;
    author: {
        first_name: string;
    } | null;
}

const GINGHAM_STYLES = {
    pink: {
        backgroundColor: "#FFF2F2",
        backgroundImage: "linear-gradient(90deg, rgba(244,143,177,0.12) 50%, transparent 50%), linear-gradient(rgba(244,143,177,0.12) 50%, transparent 50%)",
        backgroundSize: "16px 16px",
        color: "#881337",
        borderColor: "rgba(244,143,177,0.2)"
    },
    blue: {
        backgroundColor: "#F0F6FF",
        backgroundImage: "linear-gradient(90deg, rgba(144,202,249,0.12) 50%, transparent 50%), linear-gradient(rgba(144,202,249,0.12) 50%, transparent 50%)",
        backgroundSize: "16px 16px",
        color: "#1e3a8a",
        borderColor: "rgba(144,202,249,0.2)"
    },
    green: {
        backgroundColor: "#F0FDF4",
        backgroundImage: "linear-gradient(90deg, rgba(165,214,167,0.12) 50%, transparent 50%), linear-gradient(rgba(165,214,167,0.12) 50%, transparent 50%)",
        backgroundSize: "16px 16px",
        color: "#14532d",
        borderColor: "rgba(165,214,167,0.2)"
    },
    yellow: {
        backgroundColor: "#FFFFF0",
        backgroundImage: "linear-gradient(90deg, rgba(253,224,71,0.12) 50%, transparent 50%), linear-gradient(rgba(253,224,71,0.12) 50%, transparent 50%)",
        backgroundSize: "16px 16px",
        color: "#713f12",
        borderColor: "rgba(253,224,71,0.2)"
    },
    purple: {
        backgroundColor: "#FAF5FF",
        backgroundImage: "linear-gradient(90deg, rgba(206,147,216,0.12) 50%, transparent 50%), linear-gradient(rgba(206,147,216,0.12) 50%, transparent 50%)",
        backgroundSize: "16px 16px",
        color: "#581c87",
        borderColor: "rgba(206,147,216,0.2)"
    }
};

// Generates a deterministic rotation angle based on note ID string
const getNoteRotation = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const degrees = (Math.abs(hash) % 7) - 3.5; // -3.5 to 3.5 degrees
    return degrees;
};

// Returns a font size class based on text length to prevent scrolling on aspect-square cards
const getFontSizeClass = (length: number) => {
    if (length < 60) return "text-lg md:text-xl";
    if (length < 110) return "text-base md:text-lg";
    if (length < 160) return "text-sm md:text-base";
    return "text-xs md:text-sm";
};

export default function GratitudeWall() {
    const [notes, setNotes] = useState<GratitudeNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewerId, setViewerId] = useState<string | null>(null);
    const [userFirstName, setUserFirstName] = useState("Sister");
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Form States
    const [noteContent, setNoteContent] = useState("");
    const [noteColor, setNoteColor] = useState<'pink' | 'blue' | 'green' | 'yellow' | 'purple'>('pink');
    const [submitting, setSubmitting] = useState(false);
    
    const supabase = createClient();

    const fetchNotes = async () => {
        const { data, error } = await supabase
            .from('gratitude_notes')
            .select('*, author:profiles!user_id(first_name)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching gratitude notes:", error);
        } else {
            setNotes(data as any || []);
        }
        setLoading(false);
    };

    const fetchCurrentUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setViewerId(user.id);
            const { data: profile } = await supabase
                .from('profiles')
                .select('first_name')
                .eq('id', user.id)
                .single();
            if (profile?.first_name) {
                setUserFirstName(profile.first_name);
            }
        }
    };

    useEffect(() => {
        fetchNotes();
        fetchCurrentUser();

        // Realtime Subscription
        const channel = supabase
            .channel('public:gratitude_notes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'gratitude_notes'
                },
                () => {
                    fetchNotes();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleCreateNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!noteContent.trim() || submitting || !viewerId) return;

        setSubmitting(true);
        const { error } = await supabase.from('gratitude_notes').insert({
            user_id: viewerId,
            content: noteContent.trim(),
            color: noteColor
        });

        if (error) {
            alert("Could not pin note: " + error.message);
        } else {
            setNoteContent("");
            setIsModalOpen(false);
            fetchNotes();
        }
        setSubmitting(false);
    };

    const handleDeleteNote = async (id: string) => {
        if (!confirm("Are you sure you want to unpin your gratitude note?")) return;

        const { error } = await supabase.from('gratitude_notes').delete().eq('id', id);
        if (error) {
            alert("Could not delete note: " + error.message);
        } else {
            fetchNotes();
        }
    };

    return (
        <div className="min-h-screen bg-warm-paper">
            <Navbar />

            <main className="container mx-auto px-4 pt-24 pb-20 max-w-6xl">
                {/* Header */}
                <div className="flex flex-col items-center mb-8 animate-fade-in-up text-center">
                    <div className="w-14 h-14 bg-soft-blush rounded-full flex items-center justify-center text-2xl mb-3 border border-muted-rose/10">
                        <span>౨ৎ</span>
                    </div>
                    <h1 className="font-serif text-4xl text-warm-cocoa font-bold mb-2">Gratitude Wall</h1>
                    <p className="text-sm text-warm-grey/70 max-w-md leading-relaxed">
                        "Enter into his gates with thanksgiving, and into his courts with praise..." — Psalm 100:4
                    </p>
                </div>

                {/* Bulletin Board Frame */}
                <div className="relative border-[16px] border-[#5d4037] rounded-[2.5rem] shadow-2xl overflow-hidden bg-[#d7ccc8] min-h-[500px] p-6 md:p-8">
                    
                    {/* Corkboard Background Texture */}
                    <div 
                        className="absolute inset-0 pointer-events-none opacity-45"
                        style={{
                            backgroundImage: "radial-gradient(rgba(121, 85, 72, 0.2) 1.2px, transparent 1.2px), radial-gradient(rgba(121, 85, 72, 0.2) 1.2px, transparent 1.2px)",
                            backgroundSize: "8px 8px",
                            backgroundPosition: "0 0, 4px 4px"
                        }}
                    />

                    {/* Content Grid */}
                    <div className="relative z-10">
                        {loading ? (
                            <div className="text-center py-20 text-stone-700/60 font-serif italic animate-pulse">
                                Gathering prayers and thanksgivings...
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-8 pt-4">
                                
                                {/* Add Note Trigger Card */}
                                {viewerId && (
                                    <motion.button
                                        whileHover={{ scale: 1.03, y: -2 }}
                                        onClick={() => setIsModalOpen(true)}
                                        className="relative p-6 aspect-square rounded-sm border-2 border-dashed border-stone-600/30 bg-white/30 hover:bg-white/50 text-stone-700 hover:text-warm-cocoa transition-all duration-300 flex flex-col items-center justify-center gap-3 cursor-pointer group shadow-sm"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-white/60 group-hover:bg-white flex items-center justify-center shadow-sm transition-colors">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <span className="font-sans text-xs font-bold uppercase tracking-wider">Pin Gratitude</span>
                                    </motion.button>
                                )}

                                {/* Pinned Notes */}
                                <AnimatePresence>
                                    {notes.map((note) => {
                                        const isAuthor = viewerId === note.user_id;
                                        const rotation = getNoteRotation(note.id);
                                        const style = GINGHAM_STYLES[note.color];

                                        return (
                                            <motion.div
                                                key={note.id}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1, rotate: rotation }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                whileHover={{ scale: 1.05, zIndex: 30, rotate: rotation * 0.5 }}
                                                className="relative p-5 pb-8 aspect-square rounded-sm border shadow-md flex flex-col justify-between cursor-default group"
                                                style={{ 
                                                    backgroundColor: style.backgroundColor,
                                                    backgroundImage: style.backgroundImage,
                                                    backgroundSize: style.backgroundSize,
                                                    borderColor: style.borderColor,
                                                    color: style.color
                                                }}
                                            >
                                                {/* Push Pin */}
                                                <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border border-rose-600 shadow-[0_2px_4px_rgba(0,0,0,0.3)] absolute -top-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center select-none pointer-events-none">
                                                    <div className="w-1 h-1 bg-white/75 rounded-full mb-0.5" />
                                                </div>

                                                {/* Delete Button (Visible on Hover for Note Author) */}
                                                {isAuthor && (
                                                    <button
                                                        onClick={() => handleDeleteNote(note.id)}
                                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-black/5 rounded cursor-pointer"
                                                        title="Remove Note"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" style={{ color: style.color }} />
                                                    </button>
                                                )}

                                                {/* Heart Icon decoration */}
                                                <div className="absolute bottom-2 left-2 opacity-35">
                                                    <Heart className="w-3.5 h-3.5 fill-current" />
                                                </div>

                                                {/* Content */}
                                                <p className={`font-handwriting ${getFontSizeClass(note.content.length)} leading-snug text-left flex-1 overflow-hidden select-text`}>
                                                    {note.content}
                                                </p>

                                                {/* Author Sign-off */}
                                                <div className="text-right text-xs font-bold tracking-wide mt-2">
                                                    — {note.author?.first_name || "Sister"}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Pin Note Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
                    <div className="relative w-full max-w-md bg-warm-paper rounded-[2.5rem] border border-white/80 shadow-2xl p-6 md:p-8 flex flex-col gap-5 overflow-hidden animate-scale-up">
                        
                        {/* Decorative bow background */}
                        <div className="absolute top-0 right-0 w-28 h-28 bg-muted-rose/5 rounded-bl-full pointer-events-none" />

                        {/* Modal Header */}
                        <div className="flex justify-between items-center z-10">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">౨ৎ</span>
                                <h3 className="font-serif text-xl text-warm-cocoa font-bold">Pin Your Gratitude</h3>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 rounded-full hover:bg-stone-200/50 text-warm-grey/60 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Note Form */}
                        <form onSubmit={handleCreateNote} className="flex flex-col gap-4 z-10">
                            
                            {/* Color Selector */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-warm-cocoa block mb-2">Choose Gingham Shade</label>
                                <div className="flex gap-2.5">
                                    {(['pink', 'blue', 'green', 'yellow', 'purple'] as const).map((color) => {
                                        const sample = GINGHAM_STYLES[color];
                                        return (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setNoteColor(color)}
                                                className={`w-8 h-8 rounded-full border shadow-sm transition-all relative ${noteColor === color ? 'ring-2 ring-muted-rose ring-offset-2 scale-110' : 'hover:scale-105'}`}
                                                style={{ 
                                                    backgroundColor: sample.backgroundColor,
                                                    backgroundImage: sample.backgroundImage,
                                                    backgroundSize: sample.backgroundSize,
                                                    borderColor: sample.borderColor
                                                }}
                                            >
                                                {noteColor === color && (
                                                    <Check className="w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: sample.color }} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Content Input */}
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-warm-cocoa block mb-1.5">What are you grateful for today?</label>
                                <div 
                                    className="p-4 rounded-2xl border shadow-inner min-h-[140px] flex flex-col justify-between"
                                    style={{
                                        backgroundColor: GINGHAM_STYLES[noteColor].backgroundColor,
                                        backgroundImage: GINGHAM_STYLES[noteColor].backgroundImage,
                                        backgroundSize: GINGHAM_STYLES[noteColor].backgroundSize,
                                        borderColor: GINGHAM_STYLES[noteColor].borderColor
                                    }}
                                >
                                    <textarea
                                        required
                                        maxLength={200}
                                        value={noteContent}
                                        onChange={(e) => setNoteContent(e.target.value)}
                                        placeholder="I am grateful to God for..."
                                        className="w-full flex-1 bg-transparent border-none resize-none focus:outline-none focus:ring-0 font-handwriting text-lg leading-relaxed placeholder:text-stone-400"
                                        style={{ color: GINGHAM_STYLES[noteColor].color }}
                                    />
                                    <div className="flex justify-between items-center mt-2 text-[10px] opacity-70 font-sans font-bold" style={{ color: GINGHAM_STYLES[noteColor].color }}>
                                        <span>— {userFirstName}</span>
                                        <span>{noteContent.length}/200</span>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                disabled={!noteContent.trim() || submitting}
                                className="w-full mt-2 bg-gradient-to-r from-muted-rose to-rose-400 text-white rounded-2xl py-5 font-serif tracking-widest hover:scale-[1.01] transition-transform shadow-lg shadow-muted-rose/25"
                            >
                                {submitting ? "PINNING NOTE..." : "PIN TO BOARD ౨ৎ"}
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
