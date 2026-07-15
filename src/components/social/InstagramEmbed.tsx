"use client";

import { Instagram, Heart, MessageCircle, ExternalLink } from "lucide-react";

// Curated aesthetic Unsplash images representing Selahly vibes (faith, peace, journaling, nature)
const INSTAGRAM_MOCK_POSTS = [
    {
        id: "1",
        imageUrl: "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?q=80&w=400&auto=format&fit=crop",
        likes: 124,
        comments: 18,
    },
    {
        id: "2",
        imageUrl: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=400&auto=format&fit=crop",
        likes: 98,
        comments: 12,
    },
    {
        id: "3",
        imageUrl: "https://images.unsplash.com/photo-1516414447565-b14be0adf13e?q=80&w=400&auto=format&fit=crop",
        likes: 145,
        comments: 24,
    },
    {
        id: "4",
        imageUrl: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=400&auto=format&fit=crop",
        likes: 112,
        comments: 15,
    },
    {
        id: "5",
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&auto=format&fit=crop",
        likes: 132,
        comments: 9,
    },
    {
        id: "6",
        imageUrl: "https://images.unsplash.com/photo-1447069387593-a5de0862481e?q=80&w=400&auto=format&fit=crop",
        likes: 156,
        comments: 32,
    }
];

export function InstagramEmbed() {
    return (
        <div className="w-full flex flex-col gap-4 mt-2">
            {/* Grid of posts */}
            <div className="grid grid-cols-3 gap-2">
                {INSTAGRAM_MOCK_POSTS.map((post) => (
                    <a
                        key={post.id}
                        href="https://www.instagram.com/selahlyapp/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square overflow-hidden rounded-xl bg-stone-100 shadow-sm transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <img
                            src={post.imageUrl}
                            alt="Instagram post preview"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3 text-white text-[10px] font-bold">
                            <span className="flex items-center gap-1">
                                <Heart className="w-3.5 h-3.5 fill-current" />
                                {post.likes}
                            </span>
                            <span className="flex items-center gap-1">
                                <MessageCircle className="w-3.5 h-3.5 fill-current" />
                                {post.comments}
                            </span>
                        </div>
                    </a>
                ))}
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
