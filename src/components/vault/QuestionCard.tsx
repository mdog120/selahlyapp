"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Eye, Clock, Share2, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShareModal } from "../messaging/ShareModal";
import { createClient } from "@/lib/supabase/client";
import { StoryAvatar } from "../social/StoryAvatar";
import { getAnonymousAlias } from "@/lib/vaultHelper";

type Thread = {
    id: string;
    user_id: string;
    title: string;
    category: string;
    message_count: number;
    created_at: string;
    is_anonymous?: boolean;
    author: {
        username: string;
        first_name: string;
        last_name: string;
        avatar_url: string;
    };
};

export function QuestionCard({ thread }: { thread: Thread }) {
    const isAnon = thread.is_anonymous;
    const alias = getAnonymousAlias(thread.user_id);
    const formattedName = isAnon ? alias : `${thread.author?.first_name || "Sister"} ${thread.author?.last_name ? thread.author.last_name[0] + "." : ""}`;

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
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [upvoteCount, setUpvoteCount] = useState(0);
    const [hasUpvoted, setHasUpvoted] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);
        };
        fetchUserData();
        fetchUpvotes();

        // Real-time subscription
        const channel = supabase
            .channel(`public:vault_question_upvotes:${thread.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'vault_question_upvotes',
                    filter: `question_id=eq.${thread.id}`
                },
                () => {
                    fetchUpvotes();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [thread.id]);

    const fetchUpvotes = async () => {
        // Get count
        const { count } = await supabase
            .from("vault_question_upvotes")
            .select("*", { count: "exact", head: true })
            .eq("question_id", thread.id);

        setUpvoteCount(count || 0);

        // Check if user upvoted (needs user id)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from("vault_question_upvotes")
                .select("id")
                .eq("question_id", thread.id)
                .eq("user_id", user.id)
                .single();
            if (data) setHasUpvoted(true);
        }
    };

    const handleUpvote = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUserId) {
            router.push("/login");
            return;
        }

        // Optimistic update
        const newHasUpvoted = !hasUpvoted;
        setHasUpvoted(newHasUpvoted);
        setUpvoteCount(prev => newHasUpvoted ? prev + 1 : prev - 1);

        try {
            if (newHasUpvoted) {
                const { error } = await supabase
                    .from("vault_question_upvotes")
                    .insert({ question_id: thread.id, user_id: currentUserId });
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("vault_question_upvotes")
                    .delete()
                    .eq("question_id", thread.id)
                    .eq("user_id", currentUserId);
                if (error) throw error;
            }
        } catch (error) {
            console.error("Error toggling upvote:", error);
            // Revert on error
            setHasUpvoted(!newHasUpvoted);
            setUpvoteCount(prev => !newHasUpvoted ? prev + 1 : prev - 1);
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this question?")) return;

        const { error } = await supabase
            .from('threads')
            .delete()
            .eq('id', thread.id);

        if (!error) {
            window.location.reload();
        } else {
            alert("Error deleting thread");
        }
    };

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
                    {isAnon ? (
                        <div className="flex items-center gap-2 select-none">
                            <div className="w-6 h-6 rounded-full bg-deep-velvet/10 flex items-center justify-center text-[9px] text-deep-velvet font-bold">
                                {((alias.split(" ")[0]?.[0] || "") + (alias.split(" ")[1]?.[0] || ""))}
                            </div>
                            <span className="text-xs text-warm-grey/60 font-medium">
                                Asked by <span className="text-warm-grey">{formattedName}</span>
                            </span>
                        </div>
                    ) : (
                        <Link
                            href={`/profile/${thread.author?.username || ""}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        >
                            <StoryAvatar
                                userId={thread.user_id}
                                username={thread.author?.username || ""}
                                avatarUrl={thread.author?.avatar_url}
                                firstName={thread.author?.first_name}
                                lastName={thread.author?.last_name}
                                sizeClass="w-6 h-6"
                            />
                            <span className="text-xs text-warm-grey/60 font-medium">
                                Asked by <span className="text-warm-grey">{formattedName}</span>
                            </span>
                        </Link>
                    )}

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleUpvote}
                            className={`flex items-center gap-1 text-xs font-medium transition-colors px-2 py-1 rounded-full ${hasUpvoted
                                ? "bg-sage-green/10 text-sage-green"
                                : "text-warm-grey/40 hover:text-warm-grey hover:bg-stone-100"
                                }`}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill={hasUpvoted ? "currentColor" : "none"}
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="m18 15-6-6-6 6" />
                            </svg>
                            {upvoteCount}
                        </button>

                        <div className="w-px h-4 bg-warm-grey/10"></div>

                        {currentUserId === thread.user_id && (
                            <button
                                onClick={handleDelete}
                                className="p-2 -mr-2 rounded-full hover:bg-red-50 text-warm-grey/40 hover:text-red-500 transition-colors"
                                title="Delete Question"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
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
