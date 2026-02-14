"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { Menu, Heart, Bell, X, Search, User, Settings, LogOut, MessageCircle, BookOpen } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";

export function Navbar() {
    const pathname = usePathname();
    const isPublicPage = pathname === "/" || pathname === "/transition" || pathname === "/login" || pathname === "/signup" || pathname === "/onboarding" || pathname === "/donate" || pathname?.startsWith("/legal");

    // State
    const [isMenuOpen, setIsMenuOpen] = useState(false);
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
        <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
            <div className="absolute inset-0 bg-warm-paper/90 backdrop-blur-md border-b border-warm-grey/5" />
            <div className="container relative mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/home" className="font-serif text-2xl font-medium tracking-tight text-warm-grey hover:opacity-80 transition-opacity flex items-center gap-2">
                    <span className="text-muted-rose text-xl">౨ৎ</span>
                    Selahly
                </Link>

                {/* Center - Quick Links */}
                <div className="hidden md:flex items-center gap-1 bg-stone-50/50 p-1 rounded-full border border-warm-grey/5">
                    <Link href="/home" className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${pathname === '/home' ? 'bg-white shadow-sm text-warm-cocoa' : 'text-warm-grey/60 hover:text-warm-grey hover:bg-stone-100'}`}>
                        Lily Pad
                    </Link>
                    <Link href="/diaries" className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${pathname === '/diaries' ? 'bg-white shadow-sm text-warm-cocoa' : 'text-warm-grey/60 hover:text-warm-grey hover:bg-stone-100'}`}>
                        Diaries
                    </Link>
                    <Link href="/prayer-pocket" className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${pathname === '/prayer-pocket' ? 'bg-white shadow-sm text-warm-cocoa' : 'text-warm-grey/60 hover:text-warm-grey hover:bg-stone-100'}`}>
                        Prayers
                    </Link>
                    <Link href="/velvet-vault" className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${pathname === '/velvet-vault' ? 'bg-white shadow-sm text-warm-cocoa' : 'text-warm-grey/60 hover:text-warm-grey hover:bg-stone-100'}`}>
                        The Vault
                    </Link>
                    <Link href="/vibe-board" className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${pathname === '/vibe-board' ? 'bg-white shadow-sm text-warm-cocoa' : 'text-warm-grey/60 hover:text-warm-grey hover:bg-stone-100'}`}>
                        Vibes
                    </Link>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 md:gap-4">
                    {/* Bible Widget */}
                    <Link href="/bible" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/50 text-warm-grey/70 transition-colors" title="Read Bible">
                        <BookOpen className="w-5 h-5" />
                    </Link>

                    {/* Search Link */}
                    <Link href="/search" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/50 text-warm-grey/70 transition-colors">
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

                                <div className="h-px bg-warm-grey/5 my-1" />

                                {/* Mobile Search */}
                                <div className="md:hidden pb-2">
                                    <div className="relative px-2">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 text-warm-grey/40" />
                                        <input type="text" placeholder="Search..." className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-warm-paper/50 border border-transparent" />
                                    </div>
                                </div>

                                <Link
                                    href="/"
                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-500 transition-colors"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </nav>
    );
}
