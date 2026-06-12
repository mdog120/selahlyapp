"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { Menu, Heart, Bell, X, Search, User, Settings, LogOut, MessageCircle, BookOpen, Home, Lock, Music, Book } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
import dynamic from "next/dynamic";
import { BowLogo } from "@/components/ui/BowLogo";

const DonateModal = dynamic(() => import("@/components/ui/DonateModal").then(mod => mod.DonateModal), {
    ssr: false,
});

export function Navbar() {
    const pathname = usePathname();
    const isPublicPage = pathname === "/" || pathname === "/transition" || pathname === "/login" || pathname === "/signup" || pathname === "/onboarding" || pathname === "/donate" || pathname?.startsWith("/legal");

    // State
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
    const [userProfile, setUserProfile] = useState<{ name: string, email: string } | null>(null);
    const supabase = createClient();

    // Fetch User
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('first_name').eq('id', user.id).single();
                setUserProfile({
                    name: profile?.first_name || "Sister",
                    email: user.email || ""
                });
            }
        };
        fetchUser();
    }, []);

    // Close menu when route changes
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    // Auto-open donation modal if returning from a successful Stripe redirect
    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            if (params.get("redirect_status") === "succeeded") {
                setIsDonateModalOpen(true);
            }
        }
    }, []);

    const handleSignOut = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsMenuOpen(false);
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            // If click is not inside the menu container, close it
            if (isMenuOpen && !target.closest('.menu-container')) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    if (isPublicPage) return null;

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 pt-[env(safe-area-inset-top,0px)]">
            <div className="absolute inset-0 bg-warm-paper/90 backdrop-blur-md border-b border-warm-grey/5" />
            <div className="container relative mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/home" className="font-serif text-2xl font-medium tracking-tight text-warm-grey hover:opacity-80 transition-opacity flex items-center gap-2">
                    <span className="text-muted-rose text-xl">౨ৎ</span>
                    Selahly
                </Link>

                {/* Center - Quick Links removed because they duplicate the hamburger menu */}

                {/* Right Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Bible Widget */}
                    <Link href="/bible" className="hidden md:flex w-10 h-10 items-center justify-center rounded-full hover:bg-white/50 text-warm-grey/70 transition-colors" title="Read Bible">
                        <Book className="w-5 h-5" />
                    </Link>

                    {/* Search Link */}
                    <Link href="/search" className="hidden md:flex w-10 h-10 items-center justify-center rounded-full hover:bg-white/50 text-warm-grey/70 transition-colors">
                        <Search className="w-5 h-5" />
                    </Link>

                    {/* Messages Link */}
                    <Link href="/messages" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/50 text-warm-grey/70 transition-colors">
                        <MessageCircle className="w-5 h-5" />
                    </Link>

                    {/* Notifications */}
                    <NotificationDropdown />

                    {/* Sandwich Menu Container */}
                    <div className="relative menu-container">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-10 h-10 rounded-full hover:bg-white/50"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen(!isMenuOpen);
                            }}
                        >
                            {isMenuOpen ? <X className="w-5 h-5 text-warm-grey" /> : <Menu className="w-5 h-5 text-warm-grey" />}
                        </Button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-4 animate-fade-in-up origin-top-right flex flex-col gap-2 z-50">
                                <div className="pb-3 border-b border-warm-grey/5">
                                    <p className="font-serif text-lg text-warm-grey">{userProfile?.name || "My Account"}</p>
                                    <p className="text-xs text-warm-grey/40">{userProfile?.email || "Loading..."}</p>
                                </div>

                                <Link
                                    href="/profile/me"
                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-soft-blush/20 text-warm-grey/80 hover:text-warm-grey transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <User className="w-4 h-4" /> Profile & Friends
                                </Link>
                                <Link
                                    href="/settings"
                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-soft-blush/20 text-warm-grey/80 hover:text-warm-grey transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <Settings className="w-4 h-4" /> Settings
                                </Link>

                                <Link
                                    href="/garden"
                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-green-50 text-warm-grey/80 hover:text-green-700 transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <span className="text-lg">🌿</span> Selah Garden
                                </Link>

                                <Link
                                    href="/grace-inhale"
                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-rose-50 text-warm-grey/80 hover:text-muted-rose transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <span className="text-lg">🌸</span> Grace Inhale
                                </Link>

                                <Link
                                    href="/bible"
                                    className="md:hidden flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 text-warm-grey/80 hover:text-warm-cocoa transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <span className="text-lg">📖</span> Read Bible
                                </Link>

                                <Link
                                    href="/vibe-board"
                                    className="md:hidden flex items-center gap-3 p-2 rounded-xl hover:bg-teal-50 text-warm-grey/80 hover:text-teal-700 transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <span className="text-lg">🎵</span> Vibes Board
                                </Link>

                                <Link
                                    href="/search"
                                    className="md:hidden flex items-center gap-3 p-2 rounded-xl hover:bg-soft-blush/20 text-warm-grey/80 hover:text-warm-grey transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <Search className="w-4 h-4" /> Search
                                </Link>

                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        setIsDonateModalOpen(true);
                                    }}
                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-rose-50 text-warm-grey/80 hover:text-muted-rose transition-colors text-left w-full cursor-pointer"
                                >
                                    <span className="text-lg">💖</span> Support Selahly
                                </button>

                                <div className="h-px bg-warm-grey/5 my-1" />

                                <div className="hidden md:block px-1 py-1">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-warm-grey/40 mb-2">Quick Navigation</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Link
                                            href="/home"
                                            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-sage-green/10 hover:bg-sage-green/20 text-warm-grey border border-sage-green/5 transition-all text-center gap-1 group"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <Home className="w-4 h-4 text-warm-grey/60 group-hover:scale-105 transition-transform" />
                                            <span className="text-[10px] font-medium">Lily Pad</span>
                                        </Link>
                                        <Link
                                            href="/diaries"
                                            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-soft-blush/20 hover:bg-soft-blush/30 text-warm-grey border border-soft-blush/5 transition-all text-center gap-1 group"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <BookOpen className="w-4 h-4 text-warm-grey/60 group-hover:scale-105 transition-transform" />
                                            <span className="text-[10px] font-medium">Diaries</span>
                                        </Link>
                                        <Link
                                            href="/prayer-pocket"
                                            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-muted-rose/10 hover:bg-muted-rose/20 text-warm-grey border border-muted-rose/5 transition-all text-center gap-1 group"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <Heart className="w-4 h-4 text-warm-grey/60 group-hover:scale-105 transition-transform" />
                                            <span className="text-[10px] font-medium">Prayers</span>
                                        </Link>
                                        <Link
                                            href="/velvet-vault"
                                            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-100/10 transition-all text-center gap-1 group"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <Lock className="w-4 h-4 text-purple-400 group-hover:scale-105 transition-transform" />
                                            <span className="text-[10px] font-medium">The Vault</span>
                                        </Link>
                                        <Link
                                            href="/vibe-board"
                                            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-100/10 transition-all text-center gap-1 group"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <Music className="w-4 h-4 text-teal-400 group-hover:scale-105 transition-transform" />
                                            <span className="text-[10px] font-medium">Vibes</span>
                                        </Link>
                                        <Link
                                            href="/bible"
                                            className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100 text-warm-cocoa border border-warm-grey/5 transition-all text-center gap-1 group"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <Book className="w-4 h-4 text-warm-cocoa/60 group-hover:scale-105 transition-transform" />
                                            <span className="text-[10px] font-medium">Bible</span>
                                        </Link>
                                    </div>
                                </div>

                                <div className="hidden md:block h-px bg-warm-grey/5 my-1" />

                                <Link
                                    href="/"
                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors"
                                    onClick={handleSignOut}
                                >
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isDonateModalOpen && (
                <DonateModal isOpen={isDonateModalOpen} onClose={() => setIsDonateModalOpen(false)} />
            )}
        </nav>
    );
}
