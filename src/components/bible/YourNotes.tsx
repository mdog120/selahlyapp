"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StickyNote, ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

type PrivateNote = {
    id: string;
    book: string;
    chapter: number;
    verse?: number;
    selected_text: string;
    comment: string;
    created_at: string;
};

export function YourNotes() {
    const [notes, setNotes] = useState<PrivateNote[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchNotes = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data } = await supabase
                .from('bible_notes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            if (data) {
                // @ts-ignore
                setNotes(data);
            }
            setLoading(false);
        };

        fetchNotes();

        const channel = supabase
            .channel('private_notes_feed')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bible_notes' }, () => {
                fetchNotes();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); }
    }, []);

    if (loading) return <div className="h-48 bg-white/50 rounded-3xl animate-pulse" />;

    if (notes.length === 0) {
        return (
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-warm-grey/10 text-center">
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-400">
                    <StickyNote className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg text-warm-cocoa mb-1">Your Notes</h3>
                <p className="text-xs text-warm-grey/60">Use the pencil icon to save private reflections.</p>
            </div>
        );
    }

    return (
        <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-warm-grey/10">
            <div className="flex items-center gap-2 mb-4 text-warm-cocoa">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="font-serif text-lg">Your Notes</h3>
            </div>

            <div className="space-y-4">
                {notes.map((note) => (
                    <div key={note.id} className="group relative pl-4 border-l-2 border-indigo-100 hover:border-indigo-300 transition-colors">
                        <Link
                            href={`/bible?book=${encodeURIComponent(note.book)}&chapter=${note.chapter}`}
                            className="block"
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                                    {note.book} {note.chapter}{note.verse ? `:${note.verse}` : ''}
                                </span>
                                <span className="text-[10px] text-warm-grey/40">
                                    {format(new Date(note.created_at), "MMM d")}
                                </span>
                            </div>

                            {note.selected_text && (
                                <p className="text-[10px] text-warm-grey/60 italic mb-2 line-clamp-1 border-l-2 border-gray-200 pl-2">
                                    "{note.selected_text}"
                                </p>
                            )}

                            <p className="text-xs text-warm-grey leading-relaxed line-clamp-3 group-hover:text-warm-cocoa transition-colors">
                                {note.comment}
                            </p>

                            <div className="mt-2 flex items-center text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                Read Context <ArrowRight className="w-3 h-3 ml-1" />
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
}
