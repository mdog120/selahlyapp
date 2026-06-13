"use client";

import { useStoryAuras } from "@/context/StoryAuraContext";

interface StoryAvatarProps {
    userId: string;
    username: string;
    avatarUrl?: string | null;
    firstName?: string;
    lastName?: string;
    sizeClass?: string; // e.g. "w-10 h-10", "w-6 h-6", "w-4.5 h-4.5"
}

export function StoryAvatar({
    userId,
    username,
    avatarUrl,
    firstName = "",
    lastName = "",
    sizeClass = "w-10 h-10"
}: StoryAvatarProps) {
    const { auraStates } = useStoryAuras();
    const state = auraStates[userId] || "none";

    const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();

    // Determine custom padding for border layout depending on sizes
    const isTiny = sizeClass.includes("w-4.5") || sizeClass.includes("w-5") || sizeClass.includes("w-6");
    const paddingClass = isTiny ? "p-[1.5px]" : "p-[2.5px]";
    const borderClass = isTiny ? "border-[0.5px]" : "border";

    const renderInnerAvatar = () => {
        if (avatarUrl) {
            return <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />;
        }
        return (
            <span className={`text-warm-grey uppercase font-serif font-bold ${isTiny ? "text-[6px]" : "text-xs"}`}>
                {initials || username?.[0]?.toUpperCase() || "?"}
            </span>
        );
    };

    if (state === "none") {
        return (
            <div className={`${sizeClass} rounded-full bg-soft-blush flex items-center justify-center overflow-hidden border border-warm-grey/5 flex-shrink-0`}>
                {renderInnerAvatar()}
            </div>
        );
    }

    const glowClass =
        state === "pink"
            ? "from-pink-400 via-pink-300 to-pink-400 ring-[1px] ring-pink-100/50 shadow-[0_0_8px_rgba(244,143,177,0.5)] animate-pulse"
            : "from-[#D4C3B3] via-[#EBE3DB] to-[#D4C3B3] ring-[1px] ring-[#F5EFEB]/50 shadow-[0_0_8px_rgba(212,195,179,0.35)]";

    return (
        <div className={`${sizeClass} rounded-full ${paddingClass} bg-gradient-to-tr ${glowClass} flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-[1.03]`}>
            <div className={`w-full h-full rounded-full ${borderClass} border-white overflow-hidden bg-white flex items-center justify-center`}>
                {renderInnerAvatar()}
            </div>
        </div>
    );
}
