"use client";

import { useState } from "react";
import { MessageSquare, Eye, Clock, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShareModal } from "../messaging/ShareModal";

type Thread = {
    id: string;
    title: string;
    category: string;
    message_count: number;
    created_at: string;
    author: {
        username: string;
        first_name: string;
        last_name: string;
        avatar_url: string;
    };
};

export function QuestionCard({ thread }: { thread: Thread }) {
    const formattedName = `${thread.author?.first_name || "Sister"} ${thread.author?.last_name ? thread.author.last_name[0] + "." : ""}`;

    // Choose color based on category (simple hash or preset)
    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case "Faith": return "bg-blue-100 text-blue-600 border-blue-200";
            case "Relationships": return "bg-pink-100 text-pink-600 border-pink-200";
            case "Mental Health": return "bg-purple-100 text-purple-600 border-purple-200";
            default: return "bg-stone-100 text-warm-grey border-stone-200";
        }
    };

    const router = useRouter();
    const [isShareOpen, setIsShareOpen] = useState(false);

    return (
        <>
            <div
                onClick={() => router.push(`/velvet-vault/${thread.id}`)}
                className="block group bg-white/60 backdrop-blur-sm border border-white/60 p-6 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] cursor-pointer"
            >
                <div className="flex justify-between items-start mb-3">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getCategoryColor(thread.category)}`}>
                        {thread.category}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-warm-grey/40 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
                        </span>
                    </div>
                </div>

                <h3 className="font-serif text-xl text-warm-cocoa mb-3 group-hover:text-deep-velvet transition-colors">
                    {thread.title}
                </h3>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-warm-grey/5">
                    <Link
                        href={`/profile/${thread.author.username}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <div className="w-6 h-6 rounded-full bg-soft-blush flex items-center justify-center text-[10px] text-warm-grey font-medium overflow-hidden">
                            {thread.author?.avatar_url ? (
                                <img src={thread.author.avatar_url} alt={thread.author.username} className="w-full h-full object-cover" />
                            ) : (
                                <span>{(thread.author?.first_name?.[0] || "")}{(thread.author?.last_name?.[0] || "")}</span>
                            )}
                        </div>
                        <span className="text-xs text-warm-grey/60 font-medium">
                            Asked by <span className="text-warm-grey">{formattedName}</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsShareOpen(true);
                            }}
                            className="p-2 -mr-2 rounded-full hover:bg-stone-100 text-warm-grey/40 hover:text-warm-grey transition-colors"
                        >
                            <Share2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1 text-warm-grey/40 text-xs">
                            <MessageSquare className="w-4 h-4" />
                            {thread.message_count}
                        </div>
                    </div>
                </div>
            </div>

            <ShareModal
                isOpen={isShareOpen}
                onClose={() => setIsShareOpen(false)}
                content={{
                    type: 'post',
                    id: thread.id,
                    title: thread.title,
                }}
            />
        </>
    );
}
