"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Sparkles } from "lucide-react";

export function AskQuestion({ onQuestionAsked }: { onQuestionAsked: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [category, setCategory] = useState("Faith");
    const [loading, setLoading] = useState(false);

    const supabase = createClient();

    const categories = ["Faith", "Relationships", "Mental Health", "Culture", "Bible Study", "Other"];

    const handleAsk = async () => {
        if (!title.trim()) return;
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from("threads").insert({
            user_id: user.id,
            title: title,
            category: category,
            message_count: 0,
            view_count: 0
        });

        if (!error) {
            setTitle("");
            setCategory("Faith");
            setIsOpen(false);
            onQuestionAsked();
        } else {
            alert("Failed to ask question. Please try again.");
        }
        setLoading(false);
    };

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // ... existing code ...

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="w-full md:w-auto bg-deep-velvet text-white hover:bg-deep-velvet/90 shadow-lg shadow-deep-velvet/20 rounded-full px-6"
            >
                <Plus className="w-4 h-4 mr-2" /> Ask a Question
            </Button>

            {/* Modal - specific fix: use Portal to escape parent 'transform' from animations */}
            {mounted && isOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-warm-cocoa/20 backdrop-blur-sm animate-fade-in"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl border border-white/50 relative animate-fade-in-up z-10">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-warm-grey/40 hover:text-warm-grey transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 rounded-full bg-deep-velvet/10 flex items-center justify-center text-deep-velvet">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-serif text-xl text-warm-cocoa">Open the Vault</h2>
                                <p className="text-xs text-warm-grey/60">Ask safely. Answer honestly.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-warm-grey mb-1 ml-1">YOUR QUESTION</label>
                                <textarea
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., How do I explain to my friends why I'm waiting for marriage?"
                                    className="w-full p-4 rounded-xl bg-stone-50 border-none focus:ring-2 ring-deep-velvet/20 outline-none text-warm-grey h-32 resize-none placeholder:text-warm-grey/30"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-warm-grey mb-1 ml-1">CATEGORY</label>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setCategory(cat)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${category === cat
                                                ? "bg-deep-velvet text-white shadow-md shadow-deep-velvet/20"
                                                : "bg-stone-100 text-warm-grey/60 hover:bg-stone-200"
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleAsk}
                                disabled={!title.trim() || loading}
                                className="w-full bg-deep-velvet hover:bg-deep-velvet/90 text-white mt-2 h-12 rounded-xl"
                            >
                                {loading ? "Posting..." : "Post Question"}
                            </Button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
