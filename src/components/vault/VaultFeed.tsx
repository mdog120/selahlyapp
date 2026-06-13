"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { QuestionCard } from "./QuestionCard";
import { AskQuestion } from "./AskQuestion";
import { Search } from "lucide-react";
import { VaultKeyhole } from "./VaultKeyhole";

type Thread = {
    id: string;
    user_id: string;
    title: string;
    category: string; // "Faith", "Relationships", etc
    message_count: number;
    created_at: string;
    author: {
        username: string;
        first_name: string;
        last_name: string;
        avatar_url: string;
    };
};

export function VaultFeed() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const supabase = createClient();

    const fetchThreads = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("threads")
            .select(`
                *,
                user_id,
                author:profiles!threads_user_id_fkey (username, first_name, last_name, avatar_url)
            `)
            .order("created_at", { ascending: false });

        if (!error && data) {
            setThreads(data as any);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchThreads();
    }, []);

    const filteredThreads = threads.filter(t => {
        const matchesSearch = (t.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (t.category?.toLowerCase() || "").includes(searchQuery.toLowerCase());
        const matchesCategory = !selectedCategory || t.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="flex flex-col gap-8">
            {/* Velvet Keyhole Wisdom Centerpiece */}
            <VaultKeyhole onThreadCreated={fetchThreads} />

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center animate-fade-in-up delay-100">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-grey/40" />
                    <input
                        type="text"
                        placeholder="Search for topics (e.g., 'dating', 'prayer')..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/60 border border-white focus:ring-2 ring-deep-velvet/10 outline-none text-warm-grey transition-all placeholder:text-warm-grey/30"
                    />
                </div>
                <AskQuestion onQuestionAsked={fetchThreads} />
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-2 overflow-x-auto py-1 scrollbar-hide -mt-4 mb-2">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                        !selectedCategory
                            ? "bg-deep-velvet text-white shadow-sm"
                            : "bg-white/60 text-warm-grey/60 border border-white hover:bg-stone-50"
                    }`}
                >
                    All Topics
                </button>
                {["Faith", "Relationships", "Mental Health", "Culture", "Bible Study", "Other"].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                            selectedCategory === cat
                                ? "bg-deep-velvet text-white shadow-sm"
                                : "bg-white/60 text-warm-grey/60 border border-white hover:bg-stone-50"
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex flex-col gap-4 animate-fade-in-up delay-200">
                {loading ? (
                    <div className="text-center py-20 text-warm-grey/40 italic">Opening the vault...</div>
                ) : filteredThreads.length === 0 ? (
                    <div className="text-center py-20 bg-white/40 rounded-3xl border border-white/50">
                        <p className="text-warm-grey mb-2">The vault is empty.</p>
                        <p className="text-sm text-warm-grey/60">Be the brave one to ask the first question.</p>
                    </div>
                ) : (
                    filteredThreads.map(thread => (
                        <QuestionCard key={thread.id} thread={thread} />
                    ))
                )}
            </div>
        </div>
    );
}
