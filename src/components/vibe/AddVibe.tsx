"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Sparkles, Link as LinkIcon } from "lucide-react";

export function AddVibe({ onVibeAdded }: { onVibeAdded: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [category, setCategory] = useState("Music");
    const [loading, setLoading] = useState(false);

    const supabase = createClient();

    // Ordered same as filters but without "All"
    const categories = ["Music", "Podcast", "Video", "Influencer"];

    const handleAdd = async () => {
        if (!title.trim() || !url.trim()) return;
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from("vibes").insert({
            user_id: user.id,
            title: title,
            url: url,
            category: category,
        });

        if (!error) {
            setTitle("");
            setUrl("");
            setCategory("Music");
            setIsOpen(false);
            onVibeAdded();
        } else {
            alert("Failed to add vibe. Please try again.");
        }
        setLoading(false);
    };

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                className="w-full md:w-auto bg-sage-green text-white hover:bg-sage-green/90 shadow-lg shadow-sage-green/20 rounded-full px-6"
            >
                <Plus className="w-4 h-4 mr-2" /> Share Vibe
            </Button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-cocoa/20 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-white/50 relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-warm-grey/40 hover:text-warm-grey transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 rounded-full bg-sage-green/10 flex items-center justify-center text-sage-green">
                                <LinkIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-serif text-xl text-warm-cocoa">Share a Vibe</h2>
                                <p className="text-xs text-warm-grey/60">Help others grow in faith.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-warm-grey mb-1 ml-1">TITLE</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Maverick City Music Playlist"
                                    className="w-full p-3 rounded-xl bg-stone-50 border-none focus:ring-2 ring-sage-green/20 outline-none text-warm-grey text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-warm-grey mb-1 ml-1">LINK (URL)</label>
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full p-3 rounded-xl bg-stone-50 border-none focus:ring-2 ring-sage-green/20 outline-none text-warm-grey text-sm font-mono"
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
                                                    ? "bg-sage-green text-white shadow-md shadow-sage-green/20"
                                                    : "bg-stone-100 text-warm-grey/60 hover:bg-stone-200"
                                                }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button
                                onClick={handleAdd}
                                disabled={!title.trim() || !url.trim() || loading}
                                className="w-full bg-sage-green hover:bg-sage-green/90 text-white mt-2 h-12 rounded-xl"
                            >
                                {loading ? "Adding..." : "Add to Board"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
