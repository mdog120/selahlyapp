"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Heart, Lock, User } from "lucide-react";

export function BottomNav() {
    const pathname = usePathname();
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleResize = () => {
            const activeEl = document.activeElement;
            const isInputFocused = activeEl && (
                activeEl.tagName === "INPUT" || 
                activeEl.tagName === "TEXTAREA" || 
                (activeEl as HTMLElement).isContentEditable
            );

            const keyboardVisible = 
                window.visualViewport 
                    ? window.visualViewport.height < window.innerHeight * 0.85
                    : window.innerHeight < screen.height * 0.75;

            setIsKeyboardOpen(!!(keyboardVisible || (isInputFocused && window.visualViewport && window.visualViewport.height < window.innerHeight * 0.92)));
        };

        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
                // Instantly hide on focus if mobile screen size
                if (window.innerWidth < 768) {
                    setIsKeyboardOpen(true);
                }
            }
        };

        const handleFocusOut = () => {
            // Delay re-evaluation slightly to let layout adjust
            setTimeout(handleResize, 100);
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", handleResize);
        } else {
            window.addEventListener("resize", handleResize);
        }

        document.addEventListener("focusin", handleFocusIn);
        document.addEventListener("focusout", handleFocusOut);

        // Initial check
        handleResize();

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener("resize", handleResize);
            } else {
                window.removeEventListener("resize", handleResize);
            }
            document.removeEventListener("focusin", handleFocusIn);
            document.removeEventListener("focusout", handleFocusOut);
        };
    }, []);

    // Do not show bottom navigation on public pages (login, signup, landing page)
    const isPublicPage = 
        pathname === "/" || 
        pathname === "/transition" || 
        pathname === "/login" || 
        pathname === "/signup" || 
        pathname === "/onboarding" || 
        pathname === "/donate" || 
        pathname?.startsWith("/legal") ||
        pathname === "/grace-inhale"; // Grace Inhale has its own custom full-screen flow

    if (isPublicPage) return null;

    const navItems = [
        {
            label: "Lily Pad",
            path: "/home",
            icon: Home,
        },
        {
            label: "Diaries",
            path: "/diaries",
            icon: BookOpen,
        },
        {
            label: "Prayers",
            path: "/prayer-pocket",
            icon: Heart,
        },
        {
            label: "The Vault",
            path: "/velvet-vault",
            icon: Lock,
        },
        {
            label: "Profile",
            path: "/profile/me",
            icon: User,
        },
    ];

    return (
        <div className={`bottom-nav-bar fixed bottom-0 left-0 right-0 z-50 md:hidden pb-[env(safe-area-inset-bottom,0px)] bg-warm-paper/95 backdrop-blur-lg border-t border-warm-grey/5 transition-all duration-300 ${isKeyboardOpen ? "translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"}`}>
            <div className="flex items-center justify-around h-14 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center group cursor-pointer"
                        >
                            <div className="relative flex items-center justify-center">
                                <Icon
                                    className={`w-5 h-5 transition-all duration-300 ${
                                        isActive 
                                            ? "text-muted-rose scale-110" 
                                            : "text-warm-grey/50 group-hover:text-warm-grey/80 group-hover:scale-105"
                                    }`}
                                />
                                {isActive && (
                                    <span className="absolute -bottom-1.5 w-1 h-1 bg-muted-rose rounded-full animate-pulse" />
                                )}
                            </div>
                            <span
                                className={`text-[10px] font-medium tracking-tight mt-1 transition-colors duration-300 ${
                                    isActive 
                                        ? "text-muted-rose font-semibold" 
                                        : "text-warm-grey/40 group-hover:text-warm-grey/70"
                                }`}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
