"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type AuraState = "pink" | "beige" | "none";

interface StoryAuraContextType {
    auraStates: Record<string, AuraState>;
    refreshAuras: () => Promise<void>;
}

const StoryAuraContext = createContext<StoryAuraContextType | undefined>(undefined);

export function StoryAuraProvider({ children }: { children: React.ReactNode }) {
    const [auraStates, setAuraStates] = useState<Record<string, AuraState>>({});
    const supabase = createClient();

    const fetchAuraStates = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            // 1. Fetch active (non-archived) moments from last 24h
            const { data: moments } = await supabase
                .from("moments")
                .select("id, user_id, background_color")
                .gt("created_at", twentyFourHoursAgo);

            if (!moments) {
                setAuraStates({});
                return;
            }

            const nonArchivedMoments = moments.filter(m => !m.background_color?.includes('|archived'));
            if (nonArchivedMoments.length === 0) {
                setAuraStates({});
                return;
            }

            // 2. Fetch logged-in user views for these moments
            const momentIds = nonArchivedMoments.map(m => m.id);
            const viewedSet = new Set<string>();

            if (user) {
                const { data: viewsData } = await supabase
                    .from("moment_views")
                    .select("moment_id")
                    .eq("user_id", user.id)
                    .in("moment_id", momentIds);
                if (viewsData) {
                    viewsData.forEach((v: any) => viewedSet.add(v.moment_id));
                }
            }

            // 3. Compute status for each user who has active stories
            const userMomentsMap: Record<string, string[]> = {};
            nonArchivedMoments.forEach(m => {
                if (!userMomentsMap[m.user_id]) {
                    userMomentsMap[m.user_id] = [];
                }
                userMomentsMap[m.user_id].push(m.id);
            });

            const states: Record<string, AuraState> = {};
            Object.keys(userMomentsMap).forEach(uid => {
                const mIds = userMomentsMap[uid];
                const allSeen = mIds.every(id => viewedSet.has(id));
                states[uid] = allSeen ? "beige" : "pink";
            });

            setAuraStates(states);
        } catch (err) {
            console.error("Error loading story aura states:", err);
        }
    };

    useEffect(() => {
        fetchAuraStates();
        
        // Poll every 30 seconds to keep auras in sync
        const interval = setInterval(fetchAuraStates, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <StoryAuraContext.Provider value={{ auraStates, refreshAuras: fetchAuraStates }}>
            {children}
        </StoryAuraContext.Provider>
    );
}

export function useStoryAuras() {
    const context = useContext(StoryAuraContext);
    if (!context) {
        throw new Error("useStoryAuras must be used within a StoryAuraProvider");
    }
    return context;
}
