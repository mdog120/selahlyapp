"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PostCard } from "./PostCard";
import { CreatePost } from "./CreatePost";

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
            // Check likes state for current user
            const postsWithLikeState = await Promise.all(data.map(async (post) => {
                if (!user) return post;
                const { data: like } = await supabase
                    .from("post_likes")
                    .select("user_id")
                    .eq("post_id", post.id)
                    .eq("user_id", user.id)
                    .single();
                return { ...post, user_has_liked: !!like };
            }));
            setPosts(postsWithLikeState as Post[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <CreatePost onPostCreated={fetchPosts} />

            {loading ? (
                <div className="text-center py-10 text-warm-grey/40">Loading community...</div>
            ) : posts.length === 0 ? (
                <div className="glass-card p-8 rounded-3xl text-center">
                    <p className="text-warm-grey mb-2">The Lily Pad is quiet currently.</p>
                    <p className="text-sm text-warm-grey/60">Be the first to share something beautiful!</p>
                </div>
            ) : (
                posts.map(post => (
                    <PostCard key={post.id} post={post} />
                ))
            )}
        </div>
    );
}
