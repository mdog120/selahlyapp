"use client";

import { useState } from "react";
import { Youtube, Mic, Music, Users, ExternalLink, Play, Share2, ShoppingBag } from "lucide-react";
import { ShareModal } from "../messaging/ShareModal";
import { formatDistanceToNow } from "date-fns";

type Vibe = {
    id: string;
    title: string;
    url: string;
    category: string;
    description: string;
    created_at: string;
    author: {
        username: string;
        first_name: string;
        last_name: string;
        avatar_url: string;
    };
};

export function VibeCard({ vibe }: { vibe: Vibe }) {
    const formattedName = `${vibe.author?.first_name || "Sister"} ${vibe.author?.last_name ? vibe.author.last_name[0] + "." : ""}`;
    const [isShareOpen, setIsShareOpen] = useState(false);

    const getIcon = (cat: string) => {
        switch (cat) {
            case "Video": return <Youtube className="w-5 h-5" />;
            case "Podcast": return <Mic className="w-5 h-5" />;
            case "Music": return <Music className="w-5 h-5" />;
            case "Influencer": return <Users className="w-5 h-5" />;
            case "Product": return <ShoppingBag className="w-5 h-5" />;
            default: return <ExternalLink className="w-5 h-5" />;
        }
    };

    const getColors = (cat: string) => {
        switch (cat) {
            case "Video": return "bg-red-50 text-red-500 border-red-100";
            case "Podcast": return "bg-purple-50 text-purple-500 border-purple-100";
            case "Music": return "bg-blue-50 text-blue-500 border-blue-100";
            case "Influencer": return "bg-orange-50 text-orange-500 border-orange-100";
            case "Product": return "bg-rose-50 text-rose-500 border-rose-100";
            default: return "bg-stone-50 text-warm-grey border-stone-200";
        }
    };

    // Helper to get initials
    const getInitials = (first?: string, last?: string) => {
        return (first?.[0] || "") + (last?.[0] || "");
    };

    return (
        <>
            <a
                href={vibe.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group h-full"
            >
                <div className={`bg-white/70 backdrop-blur-sm border border-white/60 p-5 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col relative overflow-hidden`}>

                    {/* Decorative background circle */}
                    <div className={`absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2 transition-transform group-hover:scale-150 duration-700 ${getColors(vibe.category).split(' ')[0].replace('bg-', 'bg-')}`}></div>

                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${getColors(vibe.category)}`}>
                            {getIcon(vibe.category)}
                        </div>
                    </div>

                    <h3 className="font-serif text-lg text-warm-cocoa mb-2 leading-tight group-hover:text-sage-green transition-colors line-clamp-2">
                        {vibe.title}
                    </h3>

                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-warm-grey/5">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-soft-blush flex items-center justify-center text-[8px] text-warm-grey font-medium overflow-hidden">
                                {vibe.author?.avatar_url ? (
                                    <img src={vibe.author.avatar_url} alt={vibe.author.username} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{getInitials(vibe.author?.first_name, vibe.author?.last_name)}</span>
                                )}
                            </div>
                            <span className="text-[10px] text-warm-grey/40">Shared by {formattedName}</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsShareOpen(true);
                                }}
                                className="p-1.5 rounded-full hover:bg-stone-100 text-warm-grey/40 hover:text-warm-grey transition-colors"
                            >
                                <Share2 className="w-4 h-4" />
                            </button>
                            <span className="text-[10px] bg-stone-100 px-2 py-1 rounded-full text-warm-grey/40 group-hover:bg-sage-green group-hover:text-white transition-colors">
                                Visit Link
                            </span>
                        </div>
                    </div>
                </div>
            </a>
            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                content={{
                    type: 'vibe',
                    id: vibe.id,
                    title: vibe.title,
                    content: vibe.url
                }}
            />
        </>
    );
}
