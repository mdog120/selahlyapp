"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/Dialog"; // MVP wrapping
import { Button } from "@/components/ui/Button";

type Note = {
    id: string;
    content: string;
    style: string;
    created_at: string;
    user_id: string;
    profiles: {
        first_name: string;
        avatar_url: string;
    };
};

export function SelahlyNotes() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        const fetchNotes = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);

            // Fetch active notes (expires_at > now)
            // Note: If you didn't create the expires_at constraint or view, 
            // you might fetch all and filter client side for MVP.
            // We'll filter client side to be safe if DB logic isn't strictly enforcing yet.
            const { data, error } = await supabase
                .from('notes')
                .select(`
                    id, content, style, created_at, user_id, expires_at,
                    profiles (first_name)
                `)
                .gt('expires_at', new Date().toISOString()) // Only active notes
                .order('created_at', { ascending: false });

            if (data) {
                // @ts-ignore - Supabase types inference can be tricky without full generation
                setNotes(data);
            }
            setLoading(false);
        };

        fetchNotes();

        // Subscription for real-time updates
        const channel = supabase
            .channel('notes_channel')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notes' }, (payload) => {
                // Ideally reload to get profile data, or optimistically update if we had user info
                fetchNotes();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); }
    }, []);

    const handleCreateNote = async () => {
        if (!newNote.trim() || !userId) return;

        const { error } = await supabase.from('notes').insert({
            user_id: userId,
            content: newNote,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        });

        if (!error) {
            setNewNote("");
            setIsOpen(false);
        }
    };

    if (loading) return <div className="h-24 bg-gray-50/50 rounded-xl animate-pulse" />;

    const myNote = notes.find(n => n.user_id === userId);
    const otherNotes = notes.filter(n => n.user_id !== userId);

    return (
        <div className="mb-8 overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex gap-4 min-w-max px-2">

                {/* My Note / Add Note */}
                <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                        {myNote ? (
                            <div className="w-16 h-16 rounded-full bg-soft-rose/20 border-2 border-soft-rose flex items-center justify-center p-2 text-center text-[10px] leading-tight overflow-hidden cursor-pointer hover:scale-105 transition-transform">
                                <span className="line-clamp-3">{myNote.content}</span>
                                {myNote.style === 'bible-quote' && <span className="absolute bottom-0 right-0 text-[8px] bg-white rounded px-1">✝</span>}
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsOpen(true)}
                                className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                                <Plus className="w-6 h-6 text-gray-400" />
                            </button>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-warm-cocoa rounded-full flex items-center justify-center text-white text-xs border-2 border-white">
                            +
                        </span>
                    </div>
                    <span className="text-xs text-warm-grey">Your Note</span>
                </div>

                {/* Others */}
                {otherNotes.map(note => (
                    <div key={note.id} className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-full bg-white border border-warm-grey/10 shadow-sm flex items-center justify-center p-2 text-center text-[10px] leading-tight overflow-hidden hover:scale-105 transition-transform cursor-pointer relative group">
                            <span className="line-clamp-3 text-warm-grey/80">{note.content}</span>

                            {/* Full view tool tip styled via group-hover or click modal later. For now just visual. */}
                        </div>
                        <span className="text-xs text-warm-grey/60 max-w-[64px] truncate text-center">
                            {note.profiles?.first_name || "Sister"}
                        </span>
                    </div>
                ))}

                {/* Creation Dialog */}
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={(e) => {
                        if (e.target === e.currentTarget) setIsOpen(false);
                    }}>
                        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95">
                            <h3 className="font-serif text-lg mb-4 text-warm-cocoa">New Selahly Note</h3>
                            <textarea
                                value={newNote}
                                onChange={e => setNewNote(e.target.value)}
                                placeholder="Share a quick thought... (24h)"
                                className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm focus:ring-1 focus:ring-warm-cocoa/20 mb-4 h-32 resize-none"
                                maxLength={60} // Instagram notes are short
                            />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleCreateNote}>Share</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
