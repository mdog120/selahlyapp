"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, X } from "lucide-react";
// MVP wrapping manual implementation below
import { Button } from "@/components/ui/Button";

type Note = {
    id: string;
    content: string;
    style: string;
    created_at: string;
    user_id: string;
    first_name: string;
    avatar_url: string;
    username?: string;
};
};

export function SelahlyNotes() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const supabase = createClient();

    const fetchNotes = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);

        console.log("Fetching notes...");
        const { data, error } = await supabase
            .from('notes')
            .select(`
                id, content, style, created_at, user_id, expires_at,
                profiles!notes_user_id_fkey_profiles (first_name, avatar_url, username)
            `)
            .gt('expires_at', new Date().toISOString()) // Only active notes
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching notes:", error);
        }

        if (data) {
            console.log("Notes fetched:", data.length);
            // @ts-ignore
            setNotes(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchNotes();

        // Subscription for real-time updates
        const channel = supabase
            .channel('notes_channel')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notes' }, (payload) => {
                console.log("Realtime update received", payload);
                fetchNotes();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); }
    }, []);

    const handleCreateNote = async () => {
        if (!newNote.trim() || !userId) {
            console.error("Missing note content or user ID");
            return;
        }

        console.log("Creating/Updating note for user:", userId);

        let error;

        // Check for existing notes to update instead of create
        const existingNotes = notes.filter(n => n.user_id === userId);

        if (existingNotes.length > 0) {
            // Update the existing one
            const noteToUpdate = existingNotes[0];

            // Cleanup duplicates if any
            if (existingNotes.length > 1) {
                const idsToDelete = existingNotes.slice(1).map(n => n.id);
                await supabase.from('notes').delete().in('id', idsToDelete);
            }

            const { error: updateError } = await supabase
                .from('notes')
                .update({
                    content: newNote,
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    created_at: new Date().toISOString()
                })
                .eq('id', noteToUpdate.id);
            error = updateError;
        } else {
            // Create new
            const { error: insertError } = await supabase.from('notes').insert({
                user_id: userId,
                content: newNote,
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });
            error = insertError;
        }

        if (error) {
            console.error("Error saving note:", error);
            alert("Failed to share note. Please try again.");
            return;
        }

        // Success
        console.log("Note saved successfully");
        setNewNote("");
        setIsOpen(false);
        // Manually fetch immediately to ensure UI update
        await fetchNotes();
    };

    if (loading) return <div className="h-24 bg-gray-50/50 rounded-xl animate-pulse" />;

    const myNote = notes.find(n => n.user_id === userId);
    const otherNotes = notes.filter(n => n.user_id !== userId);

    return (
        <div className="mb-8 overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex gap-4 min-w-max px-2">

                {/* My Note / Add Note */}
                <div className="flex flex-col items-center gap-1 w-[72px]">
                    {/* Note Bubble (if exists) */}
                    {myNote ? (
                        <div
                            onClick={() => setIsOpen(true)}
                            className="bg-soft-blush/10 border border-soft-blush/20 rounded-2xl p-2 shadow-sm min-h-[40px] flex items-center justify-center text-[10px] leading-tight text-center relative max-w-[80px] cursor-pointer hover:scale-105 transition-transform mb-1"
                        >
                            <span className="line-clamp-3 text-warm-grey/90">{myNote.content}</span>
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-rose-50 border-b border-r border-soft-blush/20 rotate-45"></div>
                        </div>
                    ) : (
                        <div className="h-[40px] mb-1 opacity-0 pointer-events-none"></div> // Spacer
                    )}

                    <div className="relative group">
                        <div
                            className="w-14 h-14 rounded-full bg-stone-100 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center cursor-pointer hover:bg-stone-200 transition-colors"
                            onClick={() => setIsOpen(true)}
                        >
                            {/* We would need current user avatar here, but for now we just show a plus or placeholder if we don't have it locally in state easily without fetching profile. 
                                Ideally populate currentUserAvatar in the fetchNotes or passed prop. For now, use a generic user icon or Plus if no note. 
                            */}
                            <Plus className="w-5 h-5 text-gray-400" />
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-warm-cocoa rounded-full flex items-center justify-center text-white text-xs border-2 border-white pointer-events-none">
                            +
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-warm-grey">You</span>
                        <button onClick={fetchNotes} className="text-[10px] text-warm-grey/50 hover:text-warm-cocoa" title="Refresh Notes">↻</button>
                    </div>
                </div>

                {/* Others */}
                {otherNotes.map(note => {
                    // Profile Link
                    const profileLink = `/profile/${note.profiles?.username || note.user_id}`;

                    return (
                        <div key={note.id} className="flex flex-col items-center gap-1 group w-[72px]">
                            {/* Thought Bubble */}
                            <div
                                onClick={() => {
                                    const replyText = `Replying to note: "${note.content}"`;
                                    window.location.href = `/messages/${note.user_id}?reply=${encodeURIComponent(replyText)}`;
                                }}
                                className="bg-white border border-warm-grey/10 rounded-2xl p-2 shadow-sm min-h-[40px] flex items-center justify-center text-[10px] leading-tight text-center relative max-w-[80px] cursor-pointer hover:scale-105 transition-transform mb-1"
                            >
                                <span className="line-clamp-3 text-warm-grey/90">{note.content}</span>
                                {/* Little triangle for speech bubble */}
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-b border-r border-warm-grey/10 rotate-45"></div>
                            </div>

                            {/* Avatar */}
                            <a href={profileLink} className="block">
                                <div className="w-14 h-14 rounded-full bg-stone-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0 cursor-pointer hover:border-soft-blush transition-colors">
                                    {note.profiles?.avatar_url ? (
                                        <img src={note.profiles.avatar_url} alt={note.profiles.first_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-warm-grey/30 text-xs font-bold">
                                            {note.profiles?.first_name?.[0]}
                                        </div>
                                    )}
                                </div>
                            </a>

                            <a href={profileLink} className="text-[10px] text-warm-grey/60 max-w-[64px] truncate text-center font-medium hover:underline hover:text-warm-cocoa">
                                {note.profiles?.first_name || "Sister"}
                            </a>
                        </div>
                    )
                })}

                {/* Creation Dialog */}
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={(e) => {
                        if (e.target === e.currentTarget) setIsOpen(false);
                    }}>
                        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95">
                            <h3 className="font-serif text-lg mb-4 text-warm-cocoa">
                                {myNote ? "Update Your Note" : "New Selahly Note"}
                            </h3>
                            <textarea
                                value={newNote}
                                onChange={e => setNewNote(e.target.value)}
                                placeholder="Share a quick thought... (24h)"
                                className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm focus:ring-1 focus:ring-warm-cocoa/20 mb-4 h-32 resize-none"
                                maxLength={60} // Instagram notes are short
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleCreateNote}>{myNote ? "Update" : "Share"}</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
