"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { PostCard } from "./PostCard";
import { CreatePost } from "./CreatePost";
import { PostPreviewCard } from "./PostPreviewCard";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Heart, Clock } from "lucide-react";

type Post = {
    id: string;
    image_url: string;
    media_urls: string[] | null;
    type: 'image' | 'video' | 'carousel' | 'text';
    caption: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    author: {
        username: string;
        first_name: string;
        last_name: string;
        avatar_url: string;
    };
    user_has_liked?: boolean;
};

export function SocialFeed() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'newest' | 'most_liked' | 'oldest'>('newest');
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isFeedLocked, setIsFeedLocked] = useState(false);
    const justClosedRef = useRef(false);
    const supabase = createClient();

    const fetchPosts = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        // Fix: Explicitly use the foreign key for the author to avoid ambiguity with post_likes
        const { data, error } = await supabase
            .from("posts")
            .select(`
                *,
                author:profiles!posts_user_id_fkey (username, first_name, last_name, avatar_url)
            `)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching posts:", error);
        } else if (data) {
            // Check likes state for current user efficiently in a single query (resolving N+1 query issue)
            let likedPostIds = new Set<string>();
            if (user && data.length > 0) {
                const postIds = data.map(p => p.id);
                const { data: likes, error: likesError } = await supabase
                    .from("post_likes")
                    .select("post_id")
                    .eq("user_id", user.id)
                    .in("post_id", postIds);

                if (likesError) {
                    console.error("Error fetching post likes:", likesError);
                } else if (likes) {
                    likedPostIds = new Set(likes.map(l => l.post_id));
                }
            }

            const postsWithLikeState = data.map((post) => ({
                ...post,
                user_has_liked: user ? likedPostIds.has(post.id) : false
            }));

            setPosts(postsWithLikeState as Post[]);

            // Sync the active post modal if it is open
            if (selectedPost) {
                const freshActivePost = postsWithLikeState.find(p => p.id === selectedPost.id);
                if (freshActivePost) {
                    setSelectedPost(freshActivePost as Post);
                }
            }
        }
        setLoading(false);
    };

    const handleLikeToggle = (postId: string, newLiked: boolean, newCount: number) => {
        setPosts(prev => prev.map(p => 
            p.id === postId 
                ? { ...p, user_has_liked: newLiked, likes_count: newCount }
                : p
        ));
    };

    const handleCloseModal = (e?: React.MouseEvent | React.TouchEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        justClosedRef.current = true;
        setSelectedPost(null);
        setIsFeedLocked(true);
        fetchPosts();
        setTimeout(() => {
            justClosedRef.current = false;
            setIsFeedLocked(false);
        }, 800); // 800ms lock to absorb all browser fastclick/ghost-click events
    };

    const handleOpenModal = (post: Post) => {
        if (justClosedRef.current || isFeedLocked) return;
        setSelectedPost(post);
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    // Sort posts based on the active filter
    const sortedPosts = [...posts].sort((a, b) => {
        if (filter === 'newest') {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (filter === 'oldest') {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (filter === 'most_liked') {
            if (b.likes_count !== a.likes_count) {
                return b.likes_count - a.likes_count;
            }
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return 0;
    });

    // Split sorted posts into two columns for Lemon8-style staggered masonry layout
    const leftColumnPosts = sortedPosts.filter((_, idx) => idx % 2 === 0);
    const rightColumnPosts = sortedPosts.filter((_, idx) => idx % 2 !== 0);

    const isPointerEventsLocked = !!selectedPost || isFeedLocked;

    return (
        <div className="flex flex-col gap-6">
            {/* Wrapped main feed interactive content in a lockable pointer-events container */}
            <div className={`flex flex-col gap-6 ${isPointerEventsLocked ? "pointer-events-none select-none" : ""}`}>
                <CreatePost onPostCreated={fetchPosts} />

                {/* Cute Lemon8-styled segment filter selector */}
                <div className="flex justify-center -mb-2">
                    <div className="flex items-center gap-1 bg-stone-100/60 p-1 rounded-full border border-stone-200/40 shadow-inner">
                        <button
                            onClick={() => setFilter('newest')}
                            className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 active-press-shrink ${
                                filter === 'newest'
                                    ? "bg-white text-muted-rose shadow-sm border border-pink-100/30 scale-105"
                                    : "text-warm-grey/50 hover:text-warm-grey/80"
                            }`}
                        >
                            <Sparkles className="w-3.5 h-3.5 text-pink-400 fill-pink-300/10" />
                            <span>Newest</span>
                        </button>
                        <button
                            onClick={() => setFilter('most_liked')}
                            className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 active-press-shrink ${
                                filter === 'most_liked'
                                    ? "bg-white text-muted-rose shadow-sm border border-pink-100/30 scale-105"
                                    : "text-warm-grey/50 hover:text-warm-grey/80"
                            }`}
                        >
                            <Heart className="w-3.5 h-3.5 text-muted-rose fill-muted-rose/10" />
                            <span>Most Liked</span>
                        </button>
                        <button
                            onClick={() => setFilter('oldest')}
                            className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center gap-1.5 active-press-shrink ${
                                filter === 'oldest'
                                    ? "bg-white text-muted-rose shadow-sm border border-pink-100/30 scale-105"
                                    : "text-warm-grey/50 hover:text-warm-grey/80"
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5 text-warm-grey/50" />
                            <span>Oldest</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-10 text-warm-grey/40">Loading community...</div>
                ) : posts.length === 0 ? (
                    <div className="glass-card p-8 rounded-3xl text-center">
                        <p className="text-warm-grey mb-2">The Lily Pad is quiet currently.</p>
                        <p className="text-sm text-warm-grey/60">Be the first to share something beautiful!</p>
                    </div>
                ) : (
                    // Lemon8-Style Two-Column Masonry Grid
                    <div className="grid grid-cols-2 gap-3.5 items-start">
                        {/* Left Column */}
                        <div className="flex flex-col gap-3.5">
                            {leftColumnPosts.map(post => (
                                <PostPreviewCard 
                                    key={post.id} 
                                    post={post} 
                                    onClick={() => handleOpenModal(post)}
                                    onLikeToggle={(newLiked, newCount) => handleLikeToggle(post.id, newLiked, newCount)}
                                />
                            ))}
                        </div>

                        {/* Right Column */}
                        <div className="flex flex-col gap-3.5">
                            {rightColumnPosts.map(post => (
                                <PostPreviewCard 
                                    key={post.id} 
                                    post={post} 
                                    onClick={() => handleOpenModal(post)}
                                    onLikeToggle={(newLiked, newCount) => handleLikeToggle(post.id, newLiked, newCount)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Post Detail Modal - Kept outside the locked container to ensure full interactivity */}
            <AnimatePresence>
                {selectedPost && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCloseModal}
                        onTouchEnd={handleCloseModal}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-default"
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.93, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", damping: 20, stiffness: 280 }}
                            onClick={(e) => e.stopPropagation()} // Prevent modal closure when clicking inside the card content
                            onTouchEnd={(e) => e.stopPropagation()} // Prevent modal closure on touch inside the card
                            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-warm-paper rounded-[2rem] shadow-2xl z-10 pt-14 pb-2 px-2 custom-scrollbar border border-white/60 cursor-default"
                        >
                            {/* Close Button overlay */}
                            <button 
                                onClick={handleCloseModal}
                                onTouchEnd={handleCloseModal}
                                className="absolute top-4 right-4 z-50 bg-white/95 hover:bg-stone-50 text-warm-grey border border-warm-grey/5 p-2 rounded-full shadow-md transition-all active:scale-90"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            
                            {/* Full Post Card view */}
                            <PostCard post={selectedPost} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
