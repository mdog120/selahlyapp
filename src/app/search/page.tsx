"use client";

import { useEffect, useState, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SuggestedFriends } from "@/components/social/SuggestedFriends";

type Profile = {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
};

// Main Page Component with Suspense Boundary
export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-warm-paper flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-warm-grey/40" />
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}

// Inner Component using useSearchParams
function SearchPageContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get("q") || "";

    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<Profile[]>([]);
    const [searching, setSearching] = useState(false);

    const supabase = createClient();

    const handleSearch = async (overrideQuery?: string) => {
        const q = overrideQuery !== undefined ? overrideQuery : query;
        if (!q.trim()) {
            setResults([]);
            return;
        }

        setSearching(true);

        // Search by username, first name, last name
        const { data } = await supabase
            .from("profiles")
            .select("*")
            .or(`username.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
            .limit(20);

        if (data) {
            setResults(data as any);
        }
        setSearching(false);
    };

    // Live search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Auto search on load if param exists
    useEffect(() => {
        const q = searchParams.get("q");
        if (q) {
            setQuery(q);
            handleSearch(q);
        }
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-warm-paper font-sans">
            <Navbar />

            <main className="container mx-auto px-4 pt-24 pb-20 max-w-2xl">
                <div className="text-center mb-8">
                    <h1 className="font-serif text-3xl text-warm-cocoa mb-2">Find Friends</h1>
                    <p className="text-warm-grey/60">Search for sisters by name or username.</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative mb-10 max-w-md mx-auto">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search names (e.g., 'Sarah')..."
                        className="w-full bg-white border border-warm-grey/10 rounded-full pl-12 pr-4 py-4 shadow-sm focus:ring-2 ring-muted-rose/20 outline-none text-warm-grey text-lg transition-shadow"
                        autoFocus
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-grey/40" />
                    <Button
                        type="submit"
                        disabled={searching || !query.trim()}
                        className="absolute right-2 top-2 bottom-2 bg-muted-rose rounded-full px-6 text-white text-sm hover:bg-muted-rose/90 transition-colors"
                    >
                        {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                    </Button>
                </form>

                {!query && !searching && <SuggestedFriends />}

                <div className="space-y-4">
                    {results.length > 0 ? (
                        results.map(profile => (
                            <Link href={`/profile/${profile.username || "user"}`} key={profile.id} className="block group">
                                <div className="bg-white/60 hover:bg-white p-4 rounded-2xl border border-white transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-stone-200 overflow-hidden">
                                            {profile.avatar_url ? (
                                                <img src={profile.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="w-full h-full flex items-center justify-center text-warm-grey font-medium text-lg">
                                                    {(profile.first_name?.[0] || "")}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-warm-grey group-hover:text-warm-cocoa">{profile.first_name} {profile.last_name}</p>
                                            <p className="text-xs text-warm-grey/40">@{profile.username || "user"}</p>
                                        </div>
                                    </div>
                                    <div className="text-muted-rose opacity-0 group-hover:opacity-100 transition-opacity">
                                        View Profile
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        query && !searching && (
                            <div className="text-center py-20 text-warm-grey/40">
                                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No friends found matching "{query}".</p>
                            </div>
                        )
                    )}
                </div>
            </main>
        </div>
    );
}
