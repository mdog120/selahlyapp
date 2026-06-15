"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { BottomNav } from "@/components/BottomNav";
import { createClient } from "@/lib/supabase/client";

interface LayoutContentProps {
    children: React.ReactNode;
}

export function LayoutContent({ children }: LayoutContentProps) {
    const pathname = usePathname();
    const isGraceInhale = pathname === "/grace-inhale";
    const supabase = createClient();
    const [profile, setProfile] = useState<any>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const channelRef = useRef<any>(null);

    useEffect(() => {
        document.body.classList.remove("theme-sunrise", "theme-sunset", "theme-night");
        document.body.classList.add("theme-midday");
        document.documentElement.classList.remove("theme-sunrise", "theme-sunset", "theme-night");
        document.documentElement.classList.add("theme-midday");
    }, []);

    // 1. Fetch user profile and listen to auth changes
    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from("profiles")
                    .select("id, first_name, username, avatar_url")
                    .eq("id", user.id)
                    .single();
                if (data) {
                    setProfile(data);
                }
            }
        };
        fetchProfile();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const { data } = await supabase
                    .from("profiles")
                    .select("id, first_name, username, avatar_url")
                    .eq("id", session.user.id)
                    .single();
                if (data) {
                    setProfile(data);
                }
            } else {
                setProfile(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // 2. Setup presence channel subscription
    useEffect(() => {
        if (!profile) {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
                setIsSubscribed(false);
            }
            return;
        }

        const channel = supabase.channel("sisters_online", {
            config: {
                presence: {
                    key: profile.id,
                },
            },
        });

        channel.subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
                setIsSubscribed(true);
            }
        });

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
            setIsSubscribed(false);
        };
    }, [profile]);

    // 3. Track location updates when path changes
    useEffect(() => {
        if (profile && isSubscribed && channelRef.current) {
            channelRef.current.track({
                user_id: profile.id,
                first_name: profile.first_name || "Sister",
                username: profile.username || "",
                avatar_url: profile.avatar_url || "",
                location: pathname,
                online_at: new Date().toISOString()
            });
        }
    }, [profile, isSubscribed, pathname]);

    if (isGraceInhale) {
        return (
            <div className="flex flex-col min-h-screen">
                <main className="flex-1 w-full h-full">
                    {children}
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 pt-[calc(3.5rem+env(safe-area-inset-top,0px))] md:pt-[calc(4rem+env(safe-area-inset-top,0px))] pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
