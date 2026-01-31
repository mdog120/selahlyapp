import { getDailyVerse } from "@/lib/dailyVerse";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/Button";
import { Sparkles, MessageCircle, Heart, BookOpen, Flower2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SocialFeed } from "@/components/social/SocialFeed";
export default async function UserHome(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    // ... params & auth logic ...
    const dailyVerse = getDailyVerse();

    // ...
    {/* Grace & Glow (Daily Verse) */ }
    <div className="group relative overflow-hidden glass-card p-6 rounded-3xl border border-white/60">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-warm-cocoa">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Grace & Glow</span>
            </div>
            <a href="/diaries" className="text-[10px] text-warm-grey/40 hover:text-warm-grey underline">Open Journal</a>
        </div>
        <h3 className="font-serif text-xl mb-2">Verse of the Day</h3>
        <p className="font-serif italic text-warm-grey/80 mb-4 line-clamp-3">
            "{dailyVerse.text}"
        </p>
        <p className="text-xs text-right text-warm-grey/40 mb-4">— {dailyVerse.reference}</p>
        <a href="/diaries" className="block w-full">
            <Button variant="outline" size="sm" className="w-full">Reflect & Journal</Button>
        </a>
    </div>
    const searchParams = await props.searchParams;

    // Try to get real user from Supabase
    // Try to get real user from Supabase
    let displayName = "Sister";
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Fetch latest profile data to ensure name is up to date
            const { data: profile } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', user.id)
                .single();

            if (profile?.first_name) {
                const first = profile.first_name;
                const last = profile.last_name || "";
                const initial = last ? last.charAt(0) : "";
                displayName = initial ? `${first} ${initial}.` : first;
            } else if (user.user_metadata?.first_name) {
                // Fallback to metadata if profile missing
                const first = user.user_metadata.first_name;
                displayName = first;
            }
        } else {
            // Fallback
            const name = typeof searchParams.name === 'string' ? searchParams.name : "Sister";
            displayName = name;
        }
    } catch (e) {
        // Keys might be missing, fall back to params
        const name = typeof searchParams.name === 'string' ? searchParams.name : "Sister";
        displayName = name;
    }

    return (
        <div className="min-h-screen bg-warm-paper">
            {/* Note: Navbar is handled in Layout, but we might want a user-specific one. 
          For now, we'll reuse the layout's Navbar or assume it handles state. 
          If Layout has fixed Navbar, this content pushes down. */}

            <div className="container mx-auto px-4 pt-8 pb-20 max-w-5xl">
                {/* Welcome Section */}
                <header className="mb-8 text-center md:text-left animate-fade-in-up">
                    <h1 className="font-serif text-3xl md:text-4xl text-warm-grey mb-2">
                        Good Morning, <span className="text-warm-cocoa italic">{displayName}</span> ☁️
                    </h1>
                    <p className="text-warm-grey/60">"She is clothed with strength and dignity..." — Proverbs 31:25</p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Main Feed - The Lily Pad */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        {/* Feed Header */}
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-serif text-2xl text-warm-grey">The Lily Pad</h2>
                            <span className="text-xs font-medium uppercase tracking-widest text-warm-grey/40">Latest Updates</span>
                        </div>

                        {/* Real Social Feed */}
                        <SocialFeed />
                    </div>

                    {/* Sidebar (Mature Widgets) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">

                        {/* Grace & Glow (Daily Verse) */}
                        <div className="group relative overflow-hidden glass-card p-6 rounded-3xl border border-white/60">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-warm-cocoa">
                                    <BookOpen className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Grace & Glow</span>
                                </div>
                                <a href="/diaries" className="text-[10px] text-warm-grey/40 hover:text-warm-grey underline">Open Journal</a>
                            </div>
                            <h3 className="font-serif text-xl mb-2">Verse of the Day</h3>
                            <p className="font-serif italic text-warm-grey/80 mb-4 h-16 line-clamp-3">
                                "{dailyVerse.text}"
                            </p>
                            <p className="text-xs text-right text-warm-grey/40 mb-4">— {dailyVerse.reference}</p>
                            <a href="/diaries" className="block w-full">
                                <Button variant="outline" size="sm" className="w-full">Reflect & Journal</Button>
                            </a>
                        </div>

                        {/* Prayer Pocket (Requests) */}
                        <div className="glass-card p-6 rounded-3xl border border-white/60">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-muted-rose">
                                    <Heart className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Prayer Pocket</span>
                                </div>
                                <a href="/prayer-pocket" className="text-[10px] text-warm-grey/40 hover:text-warm-grey underline">View All</a>
                            </div>
                            <div className="space-y-4">
                                <div className="pb-3 border-b border-warm-grey/5 last:border-0 last:pb-0">
                                    <p className="text-sm text-warm-grey mb-2">Please pray for my grandmother's surgery tomorrow. 🙏</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-warm-grey/40">Sarah J.</span>
                                        <button className="text-[10px] bg-soft-blush/30 px-2 py-1 rounded-full text-warm-grey hover:bg-soft-blush transition-colors">
                                            Praying (4)
                                        </button>
                                    </div>
                                </div>
                                <div className="pb-3 border-b border-warm-grey/5 last:border-0 last:pb-0">
                                    <p className="text-sm text-warm-grey mb-2">Anxiety about finals week.</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-warm-grey/40">Mia K.</span>
                                        <button className="text-[10px] bg-soft-blush/30 px-2 py-1 rounded-full text-warm-grey hover:bg-soft-blush transition-colors">
                                            Praying (12)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Velvet Vault (Discussions) */}
                        <div className="glass-card p-6 rounded-3xl border border-white/60 bg-gradient-to-b from-purple-50/30 to-transparent flex flex-col items-center text-center">
                            <div className="flex items-center gap-2 text-purple-400 mb-4">
                                <Lock className="w-5 h-5" />
                                <span className="text-xs font-bold uppercase tracking-widest">Velvet Vault</span>
                            </div>

                            <h3 className="font-serif text-xl mb-2 text-warm-cocoa">Deep Questions,<br />Honest Answers</h3>
                            <p className="text-xs text-warm-grey/60 mb-6">
                                A safe space to ask the hard things.
                            </p>

                            <a href="/velvet-vault" className="w-full">
                                <Button className="w-full bg-warm-cocoa hover:bg-warm-cocoa/90 text-white rounded-xl py-6 text-sm font-serif tracking-widest shadow-lg shadow-warm-cocoa/20 transition-transform hover:scale-[1.02] flex items-center justify-center gap-2">
                                    <Lock className="w-4 h-4" />
                                    ENTER THE VAULT
                                </Button>
                            </a>
                        </div>


                        {/* Vibe Board (New) */}
                        <div className="glass-card p-6 rounded-3xl border border-white/60 bg-gradient-to-br from-teal-50/40 to-transparent">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-sage-green">
                                    <Sparkles className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">The Vibe Board</span>
                                </div>
                                <a href="/vibe-board" className="text-[10px] text-warm-grey/40 hover:text-warm-grey underline">View Board</a>
                            </div>
                            <h3 className="font-serif text-lg mb-2">Music, Podcasts & More</h3>
                            <p className="text-xs text-warm-grey/60 mb-4">
                                Discover what's helping others grow in their faith journey.
                            </p>
                            <a href="/vibe-board" className="block w-full">
                                <Button variant="outline" size="sm" className="w-full border-sage-green/20 text-sage-green hover:bg-sage-green hover:text-white">
                                    Browse Vibes 🎧
                                </Button>
                            </a>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
