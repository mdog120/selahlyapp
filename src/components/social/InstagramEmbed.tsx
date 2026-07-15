"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Instagram, Heart, MessageCircle, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

type GridPost = {
    id: string;
    imageUrl?: string;
    image_url?: string | null;
    media_urls?: string[] | null;
    likes?: number;
    likes_count?: number;
    comments?: number;
    comments_count?: number;
    isFallback?: boolean;
};

// Curated aesthetic Unsplash images representing Selahly vibes (faith, peace, journaling, nature)
const FALLBACK_POSTS: GridPost[] = [
    {
        id: "fallback-1",
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?q=80&w=400&auto=format&fit=crop",
        likes: 124,
        comments: 18,
        isFallback: true
    },
    {
        id: "fallback-2",
        imageUrl: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=400&auto=format&fit=crop",
        likes: 98,
        comments: 12,
        isFallback: true
    },
    {
        id: "fallback-3",
        imageUrl: "https://images.unsplash.com/photo-1516414447565-b14be0adf13e?q=80&w=400&auto=format&fit=crop",
        likes: 145,
        comments: 24,
        isFallback: true
    },
    {
        id: "fallback-4",
        imageUrl: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=400&auto=format&fit=crop",
        likes: 112,
        comments: 15,
        isFallback: true
    },
    {
        id: "fallback-5",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop",
        likes: 132,
        comments: 9,
        isFallback: true
    },
    {
        id: "fallback-6",
        imageUrl: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?q=80&w=400&auto=format&fit=crop",
        likes: 156,
        comments: 32,
        isFallback: true
    }
];

export function InstagramEmbed() {
    const [posts, setPosts] = useState<GridPost[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        async function fetchImagePosts() {
            try {
                const { data, error } = await supabase
                    .from("posts")
                    .select("id, image_url, media_urls, likes_count, comments_count")
                    .order("created_at", { ascending: false });

                if (error) {
                    console.error("Error fetching posts for widget:", error);
                } else if (data) {
                    // Filter out posts that do not have an image/media URL
                    const imagePosts = data.filter(p => p.media_urls?.[0] || p.image_url);
                    setPosts(imagePosts);
                }
            } catch (err) {
                console.error("Failed to load widget posts:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchImagePosts();
    }, []);

    const handlePostClick = (postId: string) => {
        router.push(`/home?postId=${postId}`);
    };

    // Combine real posts and fallback posts to fill a 6-item grid
    const displayPosts: GridPost[] = [...posts];
    if (displayPosts.length < 6) {
        const remaining = 6 - displayPosts.length;
        for (let i = 0; i < remaining; i++) {
            displayPosts.push(FALLBACK_POSTS[i]);
        }
    } else {
        displayPosts.splice(6); // Max 6 items
    }

    return (
        <div className="w-full flex flex-col gap-4 mt-2">
            {/* Grid of posts */}
            <div className="grid grid-cols-3 gap-2">
                {displayPosts.map((post) => {
                    const imgUrl = post.imageUrl || post.media_urls?.[0] || post.image_url || "";
                    const likes = post.likes !== undefined ? post.likes : (post.likes_count || 0);
                    const comments = post.comments !== undefined ? post.comments : (post.comments_count || 0);

                    if (post.isFallback) {
                        return (
                            <a
                                key={post.id}
                                href="https://www.instagram.com/selahlyapp/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative aspect-square overflow-hidden rounded-xl bg-stone-100 shadow-sm transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <img
                                    src={imgUrl}
                                    alt="Instagram post preview"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 text-white text-[10px] font-bold">
                                    <span className="flex items-center gap-1">
                                        <Heart className="w-3.5 h-3.5 fill-current" />
                                        {likes}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                                        {comments}
                                    </span>
                                </div>
                            </a>
                        );
                    }

                    // Real clickable community post
                    return (
                        <button
                            key={post.id}
                            onClick={() => handlePostClick(post.id)}
                            className="group relative aspect-square overflow-hidden rounded-xl bg-stone-100 shadow-sm transition-all hover:scale-[1.02] active:scale-95 cursor-pointer text-left w-full p-0 border-0"
                        >
                            <img
                                src={imgUrl}
                                alt="Post preview"
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 text-white text-[10px] font-bold">
                                <span className="flex items-center gap-1">
                                    <Heart className="w-3.5 h-3.5 fill-current" />
                                    {likes}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MessageCircle className="w-3.5 h-3.5 fill-current" />
                                    {comments}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Bottom Actions / Info */}
            <div className="flex flex-col items-center gap-2 mt-2 pt-2 border-t border-warm-grey/5">
                <a
                    href="https://www.instagram.com/selahlyapp/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-warm-cocoa font-bold font-serif hover:underline"
                >
                    <Instagram className="w-4 h-4 text-muted-rose" />
                    <span>@selahlyapp</span>
                    <ExternalLink className="w-3 h-3 text-warm-grey/40" />
                </a>
                
                <a
                    href="https://www.instagram.com/selahlyapp/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-center py-2.5 bg-warm-cocoa text-white text-xs font-serif font-bold rounded-2xl shadow-sm hover:shadow-md hover:bg-warm-cocoa/95 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                    <Instagram className="w-3.5 h-3.5 text-pink-200 fill-current" />
                    <span>View Profile</span>
                </a>
            </div>
        </div>
    );
}
