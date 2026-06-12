"use client";

import { Heart, Music, Layers, Play, BarChart2, MapPin } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type Post = {
    id: string;
    image_url: string | null;
    media_urls: string[] | null;
    type: 'image' | 'video' | 'carousel' | 'text' | 'song' | 'poll';
    caption: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    location?: string;
    song_title?: string;
    song_artist?: string;
    song_album_art?: string;
    author: {
        username: string;
        first_name: string;
        last_name: string;
        avatar_url: string;
    };
    user_has_liked?: boolean;
};

interface PostPreviewCardProps {
    post: Post;
    onClick: () => void;
    onLikeToggle?: (newLiked: boolean, newCount: number) => void;
}

export function PostPreviewCard({ post, onClick, onLikeToggle }: PostPreviewCardProps) {
    const [liked, setLiked] = useState(post.user_has_liked || false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [showHeartOverlay, setShowHeartOverlay] = useState(false);
    const lastTap = useRef<number>(0);
    const supabase = createClient();
    const videoRef = useRef<HTMLVideoElement>(null);

    // Video Autoplay/Pause on Scroll Observer
    useEffect(() => {
        if (post.type !== 'video' || !videoRef.current) return;

        const video = videoRef.current;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    video.play().catch(err => {
                        console.log("Video preview autoplay blocked or paused:", err);
                    });
                } else {
                    video.pause();
                }
            },
            {
                threshold: 0.5
            }
        );

        observer.observe(video);
        return () => {
            observer.disconnect();
        };
    }, [post.type]);

    // Sync internal state with prop changes
    useEffect(() => {
        setLiked(post.user_has_liked || false);
        setLikesCount(post.likes_count || 0);
    }, [post.user_has_liked, post.likes_count]);

    const getPastelBg = (id: string) => {
        const bgs = [
            "from-pink-50/80 via-rose-50/50 to-orange-50/80 border-pink-100/30",
            "from-purple-50/80 via-indigo-50/50 to-pink-50/80 border-purple-100/30",
            "from-blue-50/80 via-sky-50/50 to-teal-50/80 border-blue-100/30",
            "from-emerald-50/80 via-teal-50/50 to-yellow-50/80 border-emerald-100/30",
            "from-amber-50/80 via-rose-50/50 to-pink-100/40 border-amber-100/30"
        ];
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash += id.charCodeAt(i);
        }
        return bgs[hash % bgs.length];
    };

    const handleLike = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const newLiked = !liked;
        const newCount = newLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
        
        setLiked(newLiked);
        setLikesCount(newCount);
        if (onLikeToggle) {
            onLikeToggle(newLiked, newCount);
        }

        try {
            if (newLiked) {
                await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
                await supabase.rpc("increment_post_likes", { post_uuid: post.id });
            } else {
                await supabase.from("post_likes").delete().match({ post_id: post.id, user_id: user.id });
                await supabase.rpc("decrement_post_likes", { post_uuid: post.id });
            }
        } catch (err) {
            console.error("Failed to toggle like:", err);
        }
    };

    const handleMediaClick = (e: React.MouseEvent) => {
        const now = Date.now();
        const DOUBLE_PRESS_DELAY = 300;
        if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
            e.stopPropagation(); // Stop click from bubbling up to open modal
            if (!liked) {
                handleLike();
            }
            setShowHeartOverlay(true);
            setTimeout(() => setShowHeartOverlay(false), 850);
        } else {
            lastTap.current = now;
            // Let the click event bubble up to trigger the parent's onClick (opening the detail view)
        }
    };

    const getInitials = (first?: string, last?: string) => {
        return (first?.[0] || "") + (last?.[0] || "");
    };

    const formattedName = `${post.author?.first_name || "Sister"} ${post.author?.last_name ? post.author.last_name[0] + "." : ""}`;

    const renderMedia = () => {
        const bgStyle = getPastelBg(post.id);
        const imgUrl = post.media_urls?.[0] || post.image_url;

        // 1. Image, Carousel, Video, or Song with Image
        if (imgUrl && post.type !== 'poll') {
            const isVideo = post.type === 'video';
            return (
                <div 
                    className="relative w-full aspect-[4/5] overflow-hidden bg-stone-50 select-none cursor-pointer"
                    onClick={handleMediaClick}
                >
                    {isVideo ? (
                        <video 
                            ref={videoRef}
                            src={imgUrl} 
                            muted
                            playsInline
                            loop
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                        />
                    ) : (
                        <img 
                            src={imgUrl} 
                            alt="Post media preview" 
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                            loading="lazy"
                        />
                    )}

                    {/* Top-Right Badges */}
                    {post.type === 'carousel' && post.media_urls && post.media_urls.length > 1 && (
                        <div className="absolute top-2.5 right-2.5 bg-black/45 backdrop-blur-sm text-white px-2 py-1 rounded-full text-[9px] font-bold flex items-center gap-1 shadow-sm select-none">
                            <Layers className="w-2.5 h-2.5" />
                            <span>1/{post.media_urls.length}</span>
                        </div>
                    )}
                    {post.type === 'video' && (
                        <div className="absolute top-2.5 right-2.5 bg-black/45 backdrop-blur-sm text-white p-1.5 rounded-full shadow-sm select-none">
                            <Play className="w-2.5 h-2.5 fill-current" />
                        </div>
                    )}
                    {post.type === 'song' && (
                        <div className="absolute top-2.5 right-2.5 bg-black/45 backdrop-blur-sm text-white px-2 py-1 rounded-full text-[9px] font-bold flex items-center gap-1 shadow-sm select-none">
                            <Music className="w-2.5 h-2.5 text-pink-400 fill-pink-300/10" />
                            <span>Audio</span>
                        </div>
                    )}

                    {/* Pulsing Double-Tap Heart Overlay */}
                    <AnimatePresence>
                        {showHeartOverlay && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.3 }}
                                animate={{ opacity: 1, scale: 1.1 }}
                                exit={{ opacity: 0, scale: 1.4 }}
                                transition={{ type: "spring", damping: 15 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 bg-black/5"
                            >
                                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-pink-100/30">
                                    <Heart className="w-10 h-10 text-muted-rose fill-muted-rose animate-pulse" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        }

        // 2. Song
        if (post.type === 'song') {
            return (
                <div 
                    className={`relative w-full aspect-[4/5] bg-gradient-to-br ${bgStyle} border-b flex flex-col items-center justify-center p-4 cursor-pointer`}
                    onClick={handleMediaClick}
                >
                    <div className="relative w-28 h-28 md:w-32 md:h-32 mb-4 group select-none">
                        <div className="w-full h-full rounded-2xl overflow-hidden shadow-md border border-white/60 bg-stone-100 flex items-center justify-center relative z-10 transition-transform duration-300 group-hover:rotate-2">
                            {post.song_album_art ? (
                                <img src={post.song_album_art} alt={post.song_title} className="w-full h-full object-cover" />
                            ) : (
                                <Music className="w-12 h-12 text-warm-grey/30" />
                            )}
                        </div>
                        {/* Decorative Vinyl sticking out */}
                        <div className="absolute -right-2 top-2 bottom-2 aspect-square rounded-full bg-stone-900 border border-stone-800 shadow shadow-black/35 flex items-center justify-center animate-spin-slow">
                            <div className="w-6 h-6 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-stone-900" />
                            </div>
                        </div>
                    </div>

                    <div className="text-center px-2 z-10">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-warm-grey/40 flex items-center justify-center gap-1 mb-1">
                            <Music className="w-3 h-3 text-pink-400" />
                            <span>Song Share</span>
                        </div>
                        <h4 className="font-serif text-sm text-warm-cocoa font-bold truncate max-w-[140px]">{post.song_title || "Untitled"}</h4>
                        <p className="text-[10px] text-warm-grey/60 truncate max-w-[140px] mt-0.5">{post.song_artist || "Unknown Artist"}</p>
                    </div>
                </div>
            );
        }

        // 3. Poll
        if (post.type === 'poll') {
            return (
                <div 
                    className={`relative w-full aspect-[4/5] bg-gradient-to-br ${bgStyle} border-b flex flex-col justify-between p-4 cursor-pointer select-none`}
                    onClick={handleMediaClick}
                >
                    <div className="text-[9px] uppercase font-bold tracking-widest text-warm-grey/40 flex items-center gap-1">
                        <BarChart2 className="w-3 h-3 text-pink-400" />
                        <span>Community Poll</span>
                    </div>

                    <div className="flex-1 flex items-center justify-center py-2">
                        <p className="font-serif text-xs md:text-sm text-warm-cocoa font-bold text-center leading-snug line-clamp-4">
                            {post.caption}
                        </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-warm-grey/5">
                        <div className="w-full bg-white/60 border border-stone-100 py-1.5 px-3 rounded-xl text-[10px] text-warm-grey/70 font-semibold text-center shadow-sm">
                            Tap to Cast Vote 📊
                        </div>
                    </div>
                </div>
            );
        }

        // 4. Text only (or fallback)
        return (
            <div 
                className={`relative w-full aspect-[4/5] bg-gradient-to-br ${bgStyle} border-b flex flex-col justify-between p-5 cursor-pointer select-none`}
                onClick={handleMediaClick}
            >
                <div className="font-serif text-3xl text-pink-300/40 select-none -mb-2">“</div>
                
                <div className="flex-1 flex items-center justify-center">
                    <p className="font-serif text-xs md:text-sm text-warm-cocoa/90 italic text-center leading-relaxed line-clamp-6 px-1">
                        {post.caption}
                    </p>
                </div>
                
                <div className="font-serif text-3xl text-pink-300/40 select-none text-right -mt-2">”</div>
            </div>
        );
    };

    return (
        <motion.div 
            whileTap={{ scale: 0.97 }}
            onClick={onClick}
            className="bg-white border border-stone-100/60 rounded-[20px] overflow-hidden shadow-[0_4px_12px_rgba(212,165,165,0.04)] hover:shadow-[0_8px_20px_rgba(212,165,165,0.08)] transition-all cursor-pointer flex flex-col active-press-shrink"
        >
            {renderMedia()}

            {/* Info details under the media */}
            <div className="p-3 flex flex-col flex-1 min-w-0">
                {/* Caption - Only show for image/carousel/video/song (already center staged for text/polls) */}
                {(post.type !== 'text' && post.type !== 'poll') && (
                    <p className="text-[11px] font-bold text-warm-cocoa leading-snug line-clamp-2 mb-1.5 font-sans">
                        {post.caption}
                    </p>
                )}

                {/* Location */}
                {post.location && (
                    <div className="flex items-center gap-0.5 text-[9px] text-warm-grey/40 font-semibold mb-1.5 truncate">
                        <MapPin className="w-2.5 h-2.5 text-pink-300 shrink-0" />
                        <span className="truncate">{post.location}</span>
                    </div>
                )}

                {/* Card Footer (Author & Like count) */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-stone-50 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <div className="w-4.5 h-4.5 rounded-full bg-soft-blush flex-shrink-0 flex items-center justify-center text-[7px] text-warm-grey font-bold overflow-hidden border border-stone-100/60">
                            {post.author?.avatar_url ? (
                                <img src={post.author.avatar_url} alt={post.author.first_name} className="w-full h-full object-cover" />
                            ) : (
                                <span>{getInitials(post.author?.first_name, post.author?.last_name)}</span>
                            )}
                        </div>
                        <span className="text-[9px] font-bold text-warm-grey/60 truncate max-w-[65px]">
                            {formattedName}
                        </span>
                    </div>

                    <button 
                        onClick={(e) => {
                            e.stopPropagation(); // Don't open detail view
                            handleLike();
                        }}
                        className="flex items-center gap-0.5 text-[9px] font-bold text-warm-grey/50 hover:text-muted-rose transition-colors shrink-0"
                    >
                        <Heart className={`w-3.5 h-3.5 transition-transform ${liked ? "text-muted-rose fill-muted-rose scale-110" : "text-warm-grey/30"}`} />
                        <span>{likesCount}</span>
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
