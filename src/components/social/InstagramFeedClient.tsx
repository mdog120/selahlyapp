"use client";

import { useState } from "react";
import Image from "next/image";
import { InstagramPost as InstagramPostType } from "@/lib/instagram";
import { InstagramModal } from "./InstagramModal";
import { Copy, Heart } from "lucide-react";

interface InstagramFeedClientProps {
    posts: InstagramPostType[];
}

export function InstagramFeedClient({ posts }: InstagramFeedClientProps) {
    const [selectedPost, setSelectedPost] = useState<InstagramPostType | null>(null);

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-gray-100"
                        onClick={() => setSelectedPost(post)}
                    >
                        <Image
                            src={post.media_url}
                            alt={post.caption?.slice(0, 50) || "Instagram post"}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div className="text-white flex items-center gap-2 font-medium">
                                <Heart className="w-5 h-5 fill-white" />
                                <span>View</span>
                            </div>
                        </div>

                        {/* Media Type Indicator (Icon) could go here if we had video/carousel icons */}
                    </div>
                ))}
            </div>

            <InstagramModal
                post={selectedPost}
                onClose={() => setSelectedPost(null)}
            />
        </>
    );
}
