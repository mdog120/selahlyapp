"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { X, PenLine, Loader2, Lock } from "lucide-react";

interface AddStickyModalProps {
    profileId: string;
    viewerId: string;
    onAdded: () => void;
}

const COLORS = [
    { id: 'yellow', class: 'bg-yellow-100', name: 'Lemon' },
    { id: 'pink', class: 'bg-pink-100', name: 'Rose' },
    { id: 'blue', class: 'bg-blue-100', name: 'Sky' },
    { id: 'green', class: 'bg-green-100', name: 'Mint' },
    { id: 'purple', class: 'bg-purple-100', name: 'Lavender' },
] as const;

export function AddStickyModal({ profileId, viewerId, onAdded }: AddStickyModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [content, setContent] = useState("");
    const [color, setColor] = useState<typeof COLORS[number]['id']>('yellow');
    const [isPrivate, setIsPrivate] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsSubmitting(true);

        const { error } = await supabase.from('profile_stickies').insert({
            profile_id: profileId,
            author_id: viewerId,
            content: content.trim(),
            color: color,
            is_private: isPrivate
        });

        if (error) {
            console.error(error);
            alert("Failed to post note. Please try again.");
        } else {
            onAdded();
            setIsOpen(false);
            setContent("");
            setIsPrivate(false);
        }

        setIsSubmitting(false);
    };

    if (!isOpen) {
        return (
            <Button size="sm" onClick={() => setIsOpen(true)} className="gap-2 bg-warm-cocoa text-white hover:bg-warm-cocoa/90 rounded-full font-serif">
                <PenLine className="w-3 h-3" /> Leave a Note
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-warm-cocoa/20 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

            {/* Modal */}
            <div className={`relative w-full max-w-sm rounded-[24px] shadow-2xl p-6 animate-in zoom-in-95 duration-200 ${COLORS.find(c => c.id === color)?.class}`}>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full bg-white/50 hover:bg-white text-warm-cocoa/60"
                >
                    <X className="w-4 h-4" />
                </Button>

                <h3 className="font-serif text-xl text-warm-cocoa mb-4">Write a Note</h3>

                <form onSubmit={handleSubmit}>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write something encouraging..."
                        maxLength={140}
                        className="w-full h-32 bg-white/50 rounded-xl p-4 text-warm-cocoa placeholder:text-warm-cocoa/40 resize-none focus:outline-none focus:ring-2 focus:ring-white/50 text-sm font-handwriting leading-relaxed"
                        autoFocus
                    />
                    <div className="flex justify-end text-xs text-warm-cocoa/50 mt-1 mb-4">
                        {content.length}/140
                    </div>

                    <div className="space-y-4">
                        {/* Color Picker */}
                        <div className="flex justify-center gap-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setColor(c.id)}
                                    className={`w-6 h-6 rounded-full border border-warm-cocoa/10 shadow-sm transition-transform ${c.class} ${color === c.id ? 'scale-125 ring-2 ring-white ring-offset-1' : 'hover:scale-110'}`}
                                    title={c.name}
                                />
                            ))}
                        </div>

                        {/* Private Toggle */}
                        <div className="flex items-center justify-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsPrivate(!isPrivate)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isPrivate
                                        ? 'bg-warm-cocoa text-white'
                                        : 'bg-white/40 text-warm-cocoa hover:bg-white/60'
                                    }`}
                            >
                                <Lock className="w-3 h-3" />
                                {isPrivate ? "Private Note" : "Public Note"}
                            </button>
                        </div>

                        <Button
                            type="submit"
                            disabled={isSubmitting || !content.trim()}
                            className="w-full rounded-full bg-warm-cocoa text-white hover:bg-warm-cocoa/90 font-medium"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Stick It ✨"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
