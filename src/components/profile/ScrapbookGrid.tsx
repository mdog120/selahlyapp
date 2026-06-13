"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ScrapbookModal } from "./ScrapbookModal";
import Link from "next/link";
import { motion } from "framer-motion";

type ScrapbookEntry = {
    id: string;
    user_id: string;
    image_url: string;
    caption: string;
    created_at: string;
    styles: any;
    profiles?: {
        username: string;
        avatar_url: string | null;
        first_name: string;
    } | null;
};

interface ScrapbookGridProps {
    userId: string;
    username: string;
    isOwner: boolean;
}

export function ScrapbookGrid({ userId, username, isOwner }: ScrapbookGridProps) {
    const [entries, setEntries] = useState<ScrapbookEntry[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [editingEntry, setEditingEntry] = useState<ScrapbookEntry | null>(null);
    const supabase = createClient();

    const renderCaptionWithTags = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(@[\w.-]+)/g);
        return parts.map((part, index) => {
            const mentionMatch = part.match(/^@([\w.-]+)$/);
            if (mentionMatch) {
                const targetUsername = mentionMatch[1];
                return (
                    <Link
                        key={index}
                        href={`/profile/${targetUsername}`}
                        className="text-muted-rose hover:underline font-bold"
                    >
                        {part}
                    </Link>
                );
            }
            return part;
        });
    };

    const fetchEntries = async () => {
        const { data } = await supabase
            .from("scrapbook_entries")
            .select("*, profiles!scrapbook_entries_user_id_fkey(username, avatar_url, first_name)")
            .or(`user_id.eq.${userId},caption.ilike.%@${username}%`)
            .order("created_at", { ascending: false });

        if (data) setEntries(data as any);
        setLoading(false);
    };

    useEffect(() => {
        const getCurrentUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
        };
        getCurrentUser();
        fetchEntries();
    }, [userId, username]);

    const handleDelete = async (id: string, imageUrl: string) => {
        if (!confirm("Remove this memory?")) return;

        // 1. Delete from storage (optional, but good practice)
        const path = imageUrl.split("/").pop(); // Simple extraction, might need robustness
        if (path) {
            await supabase.storage.from("scrapbook").remove([path]);
        }

        // 2. Delete row
        const { error } = await supabase.from("scrapbook_entries").delete().eq("id", id);
        if (!error) {
            setEntries(prev => prev.filter(e => e.id !== id));
        }
    };

    return (
        <div className="py-8">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-2xl text-warm-cocoa">My Scrapbook 📸</h3>
                {isOwner && (
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-muted-rose text-white hover:bg-muted-rose/90 shadow-md shadow-muted-rose/20 rounded-full"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Add Memory
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-12 text-warm-grey/40 animate-pulse">Loading memories...</div>
            ) : entries.length === 0 ? (
                <div className="text-center py-16 bg-white/40 rounded-3xl border border-dashed border-warm-grey/20">
                    <p className="text-warm-grey/60 mb-2">Your scrapbook is empty.</p>
                    {isOwner && <p className="text-sm text-warm-grey/40">Upload a photo to start collecting memories! ✨</p>}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {entries.map((entry, index) => (
                        <div
                            key={entry.id}
                            className={`hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 hover:rotate-1 relative group flex flex-col justify-between ${
                                entry.styles?.frame === 'polaroid' || !entry.styles?.frame ? 'border-polaroid' :
                                entry.styles?.frame === 'lace' ? 'border-lace' :
                                entry.styles?.frame === 'gingham' ? 'border-gingham' :
                                entry.styles?.frame === 'polka' ? 'border-polka' : 'border-polaroid'
                            }`}
                            style={{
                                transform: `rotate(${index % 2 === 0 ? '-2deg' : '2deg'})`, // Slight random rotation
                            }}
                        >
                            {/* Card Content wrapper to flow nicely */}
                            <div className="w-full flex flex-col justify-between h-full">
                                <div className="aspect-square bg-stone-100 overflow-hidden relative rounded filter sepia-[.2] contrast-110 brightness-110 mb-4">
                                    <img src={entry.image_url} alt={entry.caption} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-tr from-orange-50/20 to-blue-50/10 pointer-events-none mix-blend-overlay"></div>
                                </div>
                                <p className="font-handwriting text-center text-warm-grey text-lg leading-tight px-2 min-h-6">
                                    {renderCaptionWithTags(entry.caption)}
                                </p>
                            </div>

                            {/* Placed Stickers */}
                            {entry.styles?.stickers && Array.isArray(entry.styles.stickers) && entry.styles.stickers.map((sticker: any, sIdx: number) => (
                                <div
                                    key={sIdx}
                                    style={{
                                        position: 'absolute',
                                        left: `${sticker.x}%`,
                                        top: `${sticker.y}%`,
                                        transform: `translate(-50%, -50%) rotate(${sticker.rotate || 0}deg)`,
                                        pointerEvents: 'none',
                                        zIndex: 15,
                                    }}
                                >
                                    <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 200, damping: 12, delay: sIdx * 0.1 }}
                                        className="text-2xl select-none drop-shadow-sticker"
                                    >
                                        {sticker.emoji}
                                    </motion.div>
                                </div>
                            ))}

                            {/* Creator tag badge */}
                            {entry.profiles && entry.user_id !== userId && (
                                <Link
                                    href={`/profile/${entry.profiles.username}`}
                                    className="absolute top-2 left-2 bg-white/95 px-2 py-0.5 rounded-full shadow-sm text-[9px] font-bold text-muted-rose hover:text-muted-rose/80 border border-warm-grey/5 flex items-center gap-1 z-10 transition-colors"
                                >
                                    <span>✨</span> @{entry.profiles.username}
                                </Link>
                            )}

                            {/* Edit Button (Creator Only) */}
                            {currentUserId === entry.user_id && (
                                <button
                                    onClick={() => {
                                        setEditingEntry(entry);
                                        setIsModalOpen(true);
                                    }}
                                    className="absolute top-2 right-10 bg-white/80 p-2 rounded-full text-warm-grey opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
                                    title="Edit Memory"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                            )}

                            {/* Delete Button (Creator Only) */}
                            {currentUserId === entry.user_id && (
                                <button
                                    onClick={() => handleDelete(entry.id, entry.image_url)}
                                    className="absolute top-2 right-2 bg-white/80 p-2 rounded-full text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white z-10"
                                    title="Delete Memory"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <ScrapbookModal
                isOpen={isModalOpen}
                editingEntry={editingEntry}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingEntry(null);
                }}
                onSuccess={() => {
                    fetchEntries();
                    setIsModalOpen(false);
                    setEditingEntry(null);
                }}
            />
        </div>
    );
}
