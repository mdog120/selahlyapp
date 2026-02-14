"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, X, Flame, Feather, Users, Mail, Sun, Flower2, Star, TreeDeciduous, CloudSun, Send, Trash2, Flag, AlertTriangle, Music, Volume2, VolumeX, MapPin, Smile } from "lucide-react";
import { SongPlayer } from "@/components/ui/SongPlayer";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

type Post = {
    id: string;
    image_url: string | null;
    media_urls: string[] | null;
    type: 'image' | 'video' | 'carousel' | 'text';
    caption: string;
    song_title?: string;
    song_artist?: string;
    song_link?: string;
    song_preview_url?: string;
    song_album_art?: string;
    location?: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
    author: {
        id?: string;
        username: string;
        first_name: string;
        last_name: string;
        avatar_url: string;
    };
    user_id?: string;
    user_has_liked?: boolean;
};

type Comment = {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    author: {
        username: string;
        first_name: string;
        avatar_url: string;
    };
};

export function PostCard({ post }: { post: Post }) {
    const [liked, setLiked] = useState(post.user_has_liked || false);
    const [likesCount, setLikesCount] = useState(post.likes_count || 0);
    const [animating, setAnimating] = useState(false);

    // Comments
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [commentsCount, setCommentsCount] = useState(post.comments_count || 0);
    const [loadingComments, setLoadingComments] = useState(false);

    // Menu & Report
    const [showMenu, setShowMenu] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [isOwner, setIsOwner] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Audio State
    const [isMuted, setIsMuted] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    // Header Cycling State
    const [headerIndex, setHeaderIndex] = useState(0);

    const supabase = createClient();

    useEffect(() => {
        checkOwnership();

        // Audio & Intersection Observer
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsPlaying(true);
                    if (audioRef.current) {
                        audioRef.current.play().catch(e => console.log("Autoplay blocked", e));
                    }
                } else {
                    setIsPlaying(false);
                    if (audioRef.current) {
                        audioRef.current.pause();
                    }
                }
            },
            { threshold: 0.6 } // Play when 60% visible
        );

        if (cardRef.current) observer.observe(cardRef.current);

        // Header Cycling Interval
        const interval = setInterval(() => {
            setHeaderIndex(prev => (prev + 1) % 2); // Cycle between 0 and 1
        }, 4000); // 4 seconds per info

        // Close menu on click outside
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            observer.disconnect();
            clearInterval(interval);
            if (audioRef.current) audioRef.current.pause();
        };
    }, []);

    // Handle Mute Toggle
    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMuted(!isMuted);
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
        }
    };

    const checkOwnership = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setCurrentUserId(user.id);
            if (user.id === post.user_id) {
                setIsOwner(true);
            } else {
                setIsOwner(false);
            }
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: 'Selahly Post',
            text: post.caption,
            url: window.location.href
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard! 📋");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLike = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const newLiked = !liked;
        setLiked(newLiked);
        setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
        if (newLiked) setAnimating(true);

        if (newLiked) {
            await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
            await supabase.rpc("increment_post_likes", { post_uuid: post.id });

            // Check for Star Badge (10 likes)
            // We need to fetch the fresh count because likesCount state might be stale or optimistic
            const { count } = await supabase
                .from('post_likes')
                .select('*', { count: 'exact', head: true })
                .eq('post_id', post.id);

            if (count && count >= 10) {
                // Award to the AUTHOR of the post, NOT the liker (unless they are same, but usually badge is for content creator)
                // The badge description "Get 10 likes on a post" implies the author gets it.
                if (post.user_id) {
                    await supabase.rpc("award_badge", {
                        p_user_id: post.user_id,
                        p_badge_name: 'Star'
                    });
                }
            }
        } else {
            await supabase.from("post_likes").delete().match({ post_id: post.id, user_id: user.id });
            await supabase.rpc("decrement_post_likes", { post_uuid: post.id });
        }
        setTimeout(() => setAnimating(false), 1000);
    };

    const toggleComments = async () => {
        if (!showComments) {
            setLoadingComments(true);
            const { data } = await supabase
                .from("post_comments")
                .select(`
                    id, content, created_at, user_id,
                    author:profiles!post_comments_user_id_fkey (username, first_name, avatar_url)
                `)
                .eq("post_id", post.id)
                .order("created_at", { ascending: true });

            if (data) setComments(data as any);
            setLoadingComments(false);
        }
        setShowComments(!showComments);
    };

    const handlePostComment = async () => {
        if (!newComment.trim()) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase.from("profiles").select("username, first_name, last_name, avatar_url").eq("id", user.id).single();

        const fakeComment: Comment = {
            id: Date.now().toString(),
            content: newComment,
            user_id: user.id,
            created_at: new Date().toISOString(),
            author: {
                username: profile?.username || "me",
                first_name: profile?.first_name || "Me",
                avatar_url: profile?.avatar_url || ""
            }
        };

        setComments([...comments, fakeComment]);
        setNewComment("");
        setCommentsCount(c => c + 1);

        await supabase.from("post_comments").insert({
            post_id: post.id,
            user_id: user.id,
            content: newComment
        });

        await supabase.rpc("increment_post_comments", { post_uuid: post.id });
    };

    const handleDelete = async () => {
        if (confirm("Are you sure you want to delete this post?")) {
            const { error } = await supabase.from("posts").delete().eq("id", post.id);
            if (!error) {
                window.location.reload();
            } else {
                alert("Could not delete post.");
            }
        }
    };

    const handleReport = async () => {
        if (!reportReason) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from("reports").insert({
            reporter_id: user.id,
            post_id: post.id,
            reason: reportReason
        });

        setShowReportModal(false);
        setReportReason("");
        alert("Report submitted. Thank you for keeping our community safe. 🛡️");
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm("Delete this comment?")) return;

        // Optimistic update
        setComments(prev => prev.filter(c => c.id !== commentId));
        setCommentsCount(prev => prev - 1);

        const { error } = await supabase.from("post_comments").delete().eq("id", commentId);

        if (error) {
            console.error("Error deleting comment:", error);
            // Revert if failed (optional, but good UX)
            // For now just alerting
            alert("Failed to delete comment");
            toggleComments(); // Reload comments
        } else {
            await supabase.rpc("decrement_post_comments", { post_uuid: post.id });
        }
    };

    const renderMedia = () => {
        if (post.type === 'video' && post.media_urls?.[0]) {
            return (
                <div className="aspect-[9/16] max-h-[500px] w-full bg-black rounded-2xl overflow-hidden mb-4 relative">
                    <video
                        src={post.media_urls[0]}
                        controls
                        className="w-full h-full object-contain"
                        playsInline
                    />
                </div>
            );
        }

        if (post.type === 'carousel' && post.media_urls && post.media_urls.length > 0) {
            return (
                <div className="relative mb-4 group">
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-0 rounded-2xl scrollbar-hide">
                        {post.media_urls.map((url, idx) => (
                            <div key={idx} className="w-full flex-shrink-0 snap-center aspect-square bg-stone-100 relative">
                                {url.includes('.mp4') || url.includes('.mov') ? (
                                    <video src={url} controls className="w-full h-full object-cover" />
                                ) : (
                                    <img src={url} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full">
                                    {idx + 1}/{post.media_urls!.length}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        const imgUrl = post.media_urls?.[0] || post.image_url;
        if (imgUrl) {
            return (
                <div className="aspect-square rounded-2xl bg-stone-100 mb-4 overflow-hidden relative group">
                    <img
                        src={imgUrl}
                        alt="Post content"
                        className="w-full h-full object-cover"
                    />

                    {/* Volume Toggle Overlay */}
                    {post.song_preview_url && (
                        <button
                            onClick={toggleMute}
                            className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white p-2 rounded-full transition-all animate-fade-in"
                        >
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            );
        }
        return null;
    };

    const formattedName = `${post.author?.first_name || "Sister"} ${post.author?.last_name ? post.author.last_name[0] + "." : ""}`;

    // Derived State for Header Info
    const displayInfos = useMemo(() => {
        const infos = [];
        // 1. Song (if exists)
        if (post.song_title) {
            infos.push(
                <div className="flex items-center gap-1 text-xs font-medium text-warm-cocoa animate-fade-in">
                    <Music className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{post.song_title} {post.song_artist ? `- ${post.song_artist}` : ""}</span>
                </div>
            );
        }
        // 2. Location (if exists)
        if (post.location) {
            infos.push(
                <div className="flex items-center gap-1 text-xs font-medium text-warm-grey animate-fade-in">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{post.location}</span>
                </div>
            );
        }
        // Always add Timestamp as fallback or if list is empty
        if (infos.length === 0) {
            infos.push(<p className="text-xs text-warm-grey/40">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>);
        }
        return infos;
    }, [post]);

    const currentHeaderInfo = displayInfos.length > 1
        ? displayInfos[headerIndex % displayInfos.length]
        : displayInfos[0];

    // Helper to render stickers
    const renderContentWithStickers = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(\[sticker:[^\]]+\]|@\w+)/g);
        return parts.map((part, index) => {
            const stickerMatch = part.match(/\[sticker:(.+)\]/);
            if (stickerMatch) {
                const stickerName = stickerMatch[1];
                let Icon = Star;
                let color = "text-yellow-400";

                // Map sticker names to icons and colors
                const stickerMap: any = {
                    'Candle': { icon: Flame, color: "text-orange-300" },
                    'Feather': { icon: Feather, color: "text-stone-400" },
                    'Users': { icon: Users, color: "text-rose-400" },
                    'Heart': { icon: Heart, color: "text-pink-400" },
                    'Prayer Warrior': { icon: Users, color: "text-blue-400" },
                    'Encourager': { icon: Mail, color: "text-purple-400" },
                    'Sunshine': { icon: Sun, color: "text-yellow-400" },
                    'Bloom': { icon: Flower2, color: "text-pink-300" },
                    'Peace': { icon: CloudSun, color: "text-sky-400" },
                    'Rooted': { icon: TreeDeciduous, color: "text-green-600" },
                    'Star': { icon: Star, color: "text-yellow-400" },
                    'Selah Circle': { icon: Users, color: "text-sage-green" },
                };

                if (stickerMap[stickerName]) {
                    Icon = stickerMap[stickerName].icon;
                    color = stickerMap[stickerName].color;
                }

                return <span key={index} className="inline-block mx-1 align-middle"><Icon className={`w-4 h-4 ${color} fill-current`} /></span>;
            }

            const mentionMatch = part.match(/^@(\w+)$/);
            if (mentionMatch) {
                const username = mentionMatch[1];
                return (
                    <a
                        key={index}
                        href={`/profile/${username}`}
                        className="text-muted-rose hover:underline font-medium"
                    >
                        {part}
                    </a>
                );
            }

            return part;
        });
    };

    return (
        <div className="glass-card p-6 rounded-3xl animate-fade-in-up mb-6 relative" ref={cardRef}>
            {/* Hidden Audio Element */}
            {post.song_preview_url && (
                <audio
                    ref={audioRef}
                    src={post.song_preview_url}
                    loop
                    muted={isMuted}
                />
            )}

            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <Link href={`/profile/${post.author?.username || ""}`} className="group flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-soft-blush flex items-center justify-center text-sm font-serif overflow-hidden group-hover:ring-2 ring-sage-green transition-all">
                            {post.author?.avatar_url ? (
                                <img src={post.author.avatar_url} alt={post.author.username} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-warm-grey uppercase text-xs">
                                    {(post.author?.first_name?.[0] || "")}
                                    {(post.author?.last_name?.[0] || "")}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="font-medium text-warm-grey text-sm group-hover:text-sage-green transition-colors">
                                {formattedName}
                            </p>

                            {/* Cycling Header Info */}
                            <div className="h-4 flex items-center overflow-hidden">
                                {currentHeaderInfo}
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="relative" ref={menuRef}>
                    <button onClick={() => setShowMenu(!showMenu)} className="text-warm-grey/40 hover:text-warm-grey p-1">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-8 bg-white/90 backdrop-blur-md border border-white/60 shadow-lg rounded-xl overflow-hidden min-w-[150px] z-50 animate-fade-in">
                            {isOwner ? (
                                <button
                                    onClick={handleDelete}
                                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-stone-50 flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" /> Delete Post
                                </button>
                            ) : (
                                <button
                                    onClick={() => { setShowMenu(false); setShowReportModal(true); }}
                                    className="w-full text-left px-4 py-3 text-sm text-warm-grey hover:bg-stone-50 flex items-center gap-2"
                                >
                                    <Flag className="w-4 h-4" /> Report
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {renderMedia()}

            {/* Removed separate Song Badge as it's now in header/auto-playing */}

            <div className="font-serif text-lg text-warm-grey mb-4 leading-relaxed whitespace-pre-wrap">
                {renderContentWithStickers(post.caption)}
            </div>

            <div className="flex gap-6 border-t border-white/50 pt-4 mb-2">
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 text-xs font-medium transition-colors ${liked ? "text-muted-rose" : "text-warm-grey/60 hover:text-muted-rose"}`}
                >
                    <Heart className={`w-5 h-5 transition-transform duration-300 ${liked ? "fill-current scale-110" : ""} ${animating ? "animate-bounce" : ""}`} />
                    {likesCount}
                </button>
                <button
                    onClick={toggleComments}
                    className="flex items-center gap-2 text-xs text-warm-grey/60 font-medium hover:text-warm-cocoa transition-colors"
                >
                    <MessageCircle className="w-5 h-5" /> {commentsCount}
                </button>
                <button onClick={handleShare} className="ml-auto flex items-center gap-2 text-xs text-warm-grey/60 font-medium hover:text-warm-cocoa transition-colors">
                    <Share2 className="w-5 h-5" />
                </button>
            </div>

            {showComments && (
                <div className="bg-white/40 rounded-xl p-4 mt-2 animate-fade-in-up">
                    {loadingComments ? (
                        <p className="text-xs text-warm-grey/40 text-center py-2">Loading comments...</p>
                    ) : comments.length === 0 ? (
                        <p className="text-xs text-warm-grey/40 text-center py-2 mb-2">No comments yet. Be the first!</p>
                    ) : (
                        <div className="flex flex-col gap-3 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                            {comments.map(comment => (
                                <div key={comment.id} className="flex gap-2">
                                    <div className="w-6 h-6 rounded-full bg-soft-blush flex-shrink-0 flex items-center justify-center text-[10px] overflow-hidden">
                                        {comment.author?.avatar_url ? (
                                            <img src={comment.author.avatar_url} alt={comment.author.first_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{comment.author?.first_name?.[0] || "?"}</span>
                                        )}
                                    </div>
                                    <div className="bg-white/60 px-3 py-2 rounded-lg rounded-tl-none text-xs text-warm-grey flex-1 group/comment relative">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-bold mr-1">{comment.author?.first_name}:</span>
                                                {comment.content}
                                            </div>

                                            {(currentUserId === comment.user_id || isOwner) && (
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="opacity-0 group-hover/comment:opacity-100 transition-opacity p-1 hover:text-red-400 text-warm-grey/40"
                                                    title="Delete comment"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2 mt-2">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="flex-1 bg-white/60 border-none rounded-full px-4 py-2 text-xs text-warm-grey outline-none focus:ring-1 ring-sage-green/30"
                            onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                        />
                        <button
                            onClick={handlePostComment}
                            disabled={!newComment.trim()}
                            className="bg-sage-green text-white p-2 rounded-full hover:bg-sage-green/90 transition-colors disabled:opacity-50"
                        >
                            <Send className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            )}

            {showReportModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-3xl">
                    <div className="bg-white p-6 rounded-2xl shadow-xl w-4/5 border border-stone-100 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-serif text-lg text-warm-cocoa flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-orange-400" /> Report Post
                            </h3>
                            <button onClick={() => setShowReportModal(false)}><X className="w-5 h-5 text-warm-grey/50" /></button>
                        </div>
                        <p className="text-xs text-warm-grey/60 mb-3">Please select a reason for reporting this content:</p>

                        <div className="flex flex-col gap-2 mb-4">
                            {["Inappropriate Content", "Spam", "Harassment", "Other"].map(reason => (
                                <label key={reason} className="flex items-center gap-2 p-2 rounded-lg hover:bg-stone-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="reason"
                                        value={reason}
                                        onChange={(e) => setReportReason(e.target.value)}
                                        className="text-sage-green focus:ring-sage-green"
                                    />
                                    <span className="text-sm text-warm-grey">{reason}</span>
                                </label>
                            ))}
                        </div>

                        <Button onClick={handleReport} disabled={!reportReason} className="w-full">
                            Submit Report
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
