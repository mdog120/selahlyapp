"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/Dialog"; // Assuming you have a Dialog component, if not will use raw div
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Send } from "lucide-react";

// Fallback plain modal if standard Dialog not available
function Modal({ children, onClose }: { children: React.ReactNode, onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                {children}
            </div>
            <div className="absolute inset-0 z-[-1]" onClick={onClose} />
        </div>
    );
}

interface ShareModalProps {
    data: {
        content: string;
        reference: string;
        book?: string;
        chapter?: number;
        verse?: number;
    };
    onClose: () => void;
}

export function ShareModal({ data, onClose }: ShareModalProps) {
    const [target, setTarget] = useState<'lilypad' | 'public_note' | 'private_note'>('lilypad');
    const [comment, setComment] = useState("");
    const [sending, setSending] = useState(false);
    const supabase = createClient();

    const handlePost = async () => {
        setSending(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not logged in");

            const textPayload = `"${data.content}"\n— ${data.reference}\n\n${comment}`;

            if (target === 'lilypad') {
                // Insert into posts
                // Assuming posts table has content and user_id. 
                // Previous context said image_url is nullable now.
                const { error } = await supabase.from('posts').insert({
                    user_id: user.id,
                    content: textPayload,
                    // image_url can be null or maybe we generate a quote card later
                });
                if (error) throw error;
            } else if (target === 'public_note') {
                // Insert into social notes (existing table)
                const { error } = await supabase.from('notes').insert({
                    user_id: user.id,
                    content: textPayload,
                    style: 'bible-quote',
                    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                });
                if (error) throw error;
            } else if (target === 'private_note') {
                // Insert into PRIVATE bible_notes
                if (!data.book || !data.chapter) {
                    throw new Error("Missing Bible reference for private note");
                }

                const { error } = await supabase.from('bible_notes').insert({
                    user_id: user.id,
                    book: data.book,
                    chapter: data.chapter,
                    verse: data.verse,
                    selected_text: data.content,
                    comment: comment
                });
                if (error) throw error;
            }
            onClose();
        } catch (e) {
            console.error(e);
            alert("Failed to share. Please try again.");
        } finally {
            setSending(false);
        }
    };

    return (
        <Modal onClose={onClose}>
            <div className="text-center mb-6">
                <h3 className="font-serif text-2xl text-warm-cocoa mb-1">Share Verse</h3>
                <p className="text-xs text-warm-grey/50 uppercase tracking-widest">Spread the Light</p>
            </div>

            {/* Preview Card */}
            <div className="bg-warm-paper p-4 rounded-xl border border-warm-grey/10 italic text-warm-grey mb-6 text-sm relative">
                <div className="absolute top-2 left-2 text-4xl text-warm-cocoa/10 font-serif leading-none">“</div>
                <p className="relative z-10">{data.content}</p>
                <div className="absolute bottom-[-10px] right-4 text-xs font-bold bg-white px-2 py-1 rounded shadow-sm text-warm-cocoa border border-warm-grey/5">
                    {data.reference}
                </div>
            </div>

            {/* Target Selection */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                <button
                    onClick={() => setTarget('lilypad')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${target === 'lilypad' ? 'bg-white shadow text-warm-cocoa' : 'text-warm-grey/60 hover:text-warm-grey'}`}
                >
                    To Lily Pad
                </button>
                <button
                    onClick={() => setTarget('public_note')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${target === 'public_note' ? 'bg-white shadow text-warm-cocoa' : 'text-warm-grey/60 hover:text-warm-grey'}`}
                >
                    Selahly Note
                </button>
                <button
                    onClick={() => setTarget('private_note')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${target === 'private_note' ? 'bg-white shadow text-warm-cocoa' : 'text-warm-grey/60 hover:text-warm-grey'}`}
                >
                    Your Note
                </button>
            </div>

            <textarea
                placeholder="Add your thoughts... (optional)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-warm-cocoa/20 min-h-[80px] mb-4"
                value={comment}
                onChange={e => setComment(e.target.value)}
            />

            <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button className="flex-1 bg-warm-cocoa text-white" onClick={handlePost} disabled={sending}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Post</>}
                </Button>
            </div>
        </Modal>
    );
}
