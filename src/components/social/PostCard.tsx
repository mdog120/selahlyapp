"use client";


import { useRef, useEffect, useState, useMemo } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Image as ImageIcon, X, Flame, Feather, Users, Mail, Sun, Flower2, Star, TreeDeciduous, CloudSun, Send, Trash2, Flag, AlertTriangle, Music, Volume2, VolumeX, MapPin, Smile, Edit2 } from "lucide-react";
import { SongPlayer } from "@/components/ui/SongPlayer";
import { SongSearchModal } from "@/components/ui/SongSearchModal";
import { ShareModal } from "../messaging/ShareModal";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useBadge } from "@/context/BadgeContext";
import { motion, AnimatePresence } from "framer-motion";

type Post = {
    id: string;
    image_url: string | null;
    media_urls: string[] | null;
    type: 'image' | 'video' | 'carousel' | 'text' | 'song' | 'poll';
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
    const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const lastTap = useRef<number>(0);

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

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editCaption, setEditCaption] = useState(post.caption);
    const [editLocation, setEditLocation] = useState(post.location || "");
    const [editSongTitle, setEditSongTitle] = useState(post.song_title || "");
    const [editSongArtist, setEditSongArtist] = useState(post.song_artist || "");
    const [editSongLink, setEditSongLink] = useState(post.song_link || "");
    const [editSongPreview, setEditSongPreview] = useState(post.song_preview_url || "");
    const [editSongArtwork, setEditSongArtwork] = useState(post.song_album_art || "");
    const [isSongModalOpen, setIsSongModalOpen] = useState(false);

    // Audio State
    const hasVisualMedia = post.type !== 'text' && (!!post.image_url || (post.media_urls && post.media_urls.length > 0));
    const [isMuted, setIsMuted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    // Header Cycling State
    const [headerIndex, setHeaderIndex] = useState(0);
 
    // Poll States
    const [poll, setPoll] = useState<{ question: string } | null>(null);
    const [pollOptions, setPollOptions] = useState<{ id: string, option_text: string, votes_count: number }[]>([]);
    const [userVotedOptionId, setUserVotedOptionId] = useState<string | null>(null);
    const [totalVotes, setTotalVotes] = useState(0);

    const supabase = createClient();
    const { triggerBadge } = useBadge();

    useEffect(() => {
        setEditCaption(post.caption);
        setEditLocation(post.location || "");
        setEditSongTitle(post.song_title || "");
        setEditSongArtist(post.song_artist || "");
        setEditSongLink(post.song_link || "");
        setEditSongPreview(post.song_preview_url || "");
        setEditSongArtwork(post.song_album_art || "");
    }, [post]);

    // Autoplay post song when details open, and clean up global music states
    useEffect(() => {
        checkOwnership();
        if (post.type === 'poll') {
            fetchPollData();
        }

        // Autoplay the song when the post detail is opened
        if (post.song_preview_url) {
            setIsPlaying(true);
        }

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
            clearInterval(interval);
            if (audioRef.current) audioRef.current.pause();
            window.dispatchEvent(new CustomEvent("selahly_post_audio_stop"));
        };
    }, [post.song_preview_url]);

    // Handle post audio play/pause and dispatch events to pause/resume global background music
    useEffect(() => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.play()
                .then(() => {
                    window.dispatchEvent(new CustomEvent("selahly_post_audio_play"));
                })
                .catch(err => {
                    console.log("Post audio autoplay blocked/failed:", err);
                    setIsPlaying(false);
                });
        } else {
            audioRef.current.pause();
            window.dispatchEvent(new CustomEvent("selahly_post_audio_stop"));
        }
    }, [isPlaying]);

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
 
    const fetchPollData = async () => {
        if (post.type !== 'poll') return;
        
        try {
            const { data: pollData } = await supabase
                .from("polls")
                .select("question")
                .eq("post_id", post.id)
                .maybeSingle();
                
            const { data: optionsData } = await supabase
                .from("poll_options")
                .select("id, option_text, votes_count")
                .eq("post_id", post.id);
 
            const { data: { user } } = await supabase.auth.getUser();
            let votedId = null;
            if (user) {
                const { data: voteData } = await supabase
                    .from("poll_votes")
                    .select("option_id")
                    .eq("post_id", post.id)
                    .eq("user_id", user.id)
                    .maybeSingle();
                if (voteData) votedId = voteData.option_id;
            }
 
            if (pollData) setPoll(pollData);
            if (optionsData) {
                setPollOptions(optionsData);
                setTotalVotes(optionsData.reduce((acc, curr) => acc + curr.votes_count, 0));
            }
            setUserVotedOptionId(votedId);
        } catch (err) {
            console.error("Error loading poll:", err);
        }
    };
 
    const handleVote = async (optionId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Please log in to vote!");
            return;
        }
        if (userVotedOptionId) return;
 
        const { error } = await supabase.rpc("cast_poll_vote", {
            p_post_id: post.id,
            p_user_id: user.id,
            p_option_id: optionId
        });
 
        if (error) {
            console.error("Error voting:", error);
            alert("Failed to cast vote: " + error.message);
        } else {
            setUserVotedOptionId(optionId);
            setPollOptions(prev => prev.map(opt => 
                opt.id === optionId 
                    ? { ...opt, votes_count: opt.votes_count + 1 }
                    : opt
            ));
            setTotalVotes(t => t + 1);
        }
    };

    const handleShare = () => {
        setIsShareModalOpen(true);
    };

    const handleDoubleTap = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const now = Date.now();
        const DOUBLE_PRESS_DELAY = 300;
        if (now - lastTap.current < DOUBLE_PRESS_DELAY) {
            if (!liked) {
                await handleLike();
            } else {
                setAnimating(true);
                setTimeout(() => setAnimating(false), 1000);
            }
            setShowDoubleTapHeart(true);
            setTimeout(() => setShowDoubleTapHeart(false), 850);
        } else {
            lastTap.current = now;
        }
    };

    const shareContent = {
        type: 'post' as const,
        id: post.id,
        title: post.caption || "Sister's Post",
        image: post.media_urls?.[0] ? post.media_urls[0] : (post.image_url ? post.image_url : undefined),
        content: post.caption
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

                    // If the current user is the author, trigger the animation
                    if (currentUserId === post.user_id) {
                        triggerBadge('Star', 'You got 10 likes on your post!', <Star className="w-12 h-12 text-yellow-400" />);
                    }
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

        setNewComment("");
        setCommentsCount(c => c + 1);

        await supabase.from("post_comments").insert({
            post_id: post.id,
            user_id: user.id,
            content: newComment
        });

        await supabase.rpc("increment_post_comments", { post_uuid: post.id });

        // Check for "Encourager" Badge (5 Comments)
        const { count: commentCount } = await supabase
            .from('post_comments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (commentCount && commentCount >= 5) {
            await supabase.rpc("award_badge", {
                p_user_id: user.id,
                p_badge_name: 'Encourager'
            });
            triggerBadge('Encourager', 'You commented 5 times!', <Mail className="w-12 h-12 text-purple-400" />);
        }
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

    const handleUpdatePost = async () => {
        const { error } = await supabase
            .from("posts")
            .update({
                caption: editCaption,
                location: editLocation,
                song_title: editSongTitle,
                song_artist: editSongArtist,
                song_link: editSongLink,
                song_preview_url: editSongPreview,
                song_album_art: editSongArtwork
            })
            .eq("id", post.id);

        if (!error) {
            setIsEditing(false);
            // In a real app we'd update parent state or context, here we rely on prop update or reload
            // But since props won't update without parent refresh, we might need a local refresh
            window.location.reload();
        } else {
            alert("Failed to update post.");
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
                <div className="relative mb-4 group cursor-pointer" onClick={handleDoubleTap}>
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
                    <AnimatePresence>
                        {showDoubleTapHeart && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.3 }}
                                animate={{ opacity: 1, scale: 1.1 }}
                                exit={{ opacity: 0, scale: 1.4 }}
                                transition={{ type: "spring", damping: 15 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                            >
                                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 shadow-xl border border-pink-100/30 flex items-center justify-center">
                                    <Heart className="w-14 h-14 text-muted-rose fill-muted-rose animate-pulse" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        }

        const imgUrl = post.media_urls?.[0] || post.image_url;
        if (imgUrl) {
            return (
                <div 
                    className="aspect-square rounded-2xl bg-stone-100 mb-4 overflow-hidden relative group cursor-pointer"
                    onClick={handleDoubleTap}
                >
                    <img
                        src={imgUrl}
                        alt="Post content"
                        className="w-full h-full object-cover"
                    />
 
                    {/* Volume Toggle Overlay */}
                    {post.song_preview_url && (
                        <button
                            onClick={toggleMute}
                            className="absolute bottom-3 right-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white p-2 rounded-full transition-all z-20"
                        >
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                    )}

                    <AnimatePresence>
                        {showDoubleTapHeart && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.3 }}
                                animate={{ opacity: 1, scale: 1.1 }}
                                exit={{ opacity: 0, scale: 1.4 }}
                                transition={{ type: "spring", damping: 15 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                            >
                                <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 shadow-xl border border-pink-100/30 flex items-center justify-center">
                                    <Heart className="w-14 h-14 text-muted-rose fill-muted-rose animate-pulse" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            );
        }
 
        // Music Post Card (Song type or song attached without image)
        if (post.type === 'song' || (post.song_title && !imgUrl)) {
            return (
                <div className="bg-gradient-to-br from-soft-blush/40 to-sage-green/20 border border-white/60 p-5 rounded-2xl mb-4 flex items-center gap-4 relative overflow-hidden group shadow-sm">
                    {/* Album Art */}
                    <div className="w-16 h-16 rounded-xl bg-stone-200 overflow-hidden relative shadow-md shrink-0 group-hover:scale-105 transition-transform duration-300">
                        {post.song_album_art ? (
                            <img src={post.song_album_art} alt="Album Art" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted-rose/20 text-muted-rose">
                                <Music className="w-6 h-6" />
                            </div>
                        )}
                        {post.song_preview_url && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Music className="w-5 h-5 text-white animate-pulse" />
                            </div>
                        )}
                    </div>
 
                    {/* Song Details */}
                    <div className="flex-1 min-w-0 text-left">
                        <h4 className="font-bold text-warm-cocoa truncate text-sm leading-snug">{post.song_title}</h4>
                        <p className="text-xs text-warm-grey/60 truncate mb-2">{post.song_artist || "Unknown Artist"}</p>
                        
                        {post.song_preview_url && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsPlaying(!isPlaying);
                                    }}
                                    className="px-3 py-1 rounded-full bg-white hover:bg-stone-50 border border-warm-grey/5 text-[10px] font-bold text-warm-cocoa transition-all shadow-sm flex items-center gap-1"
                                >
                                    {isPlaying ? "Pause Preview ⏸" : "Play Preview ▶"}
                                </button>
                                {post.song_link && (
                                    <a
                                        href={post.song_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-warm-grey/40 hover:text-warm-grey hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Listen
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/20 rounded-full blur-xl pointer-events-none" />
                </div>
            );
        }
 
        // Poll Rendering
        if (post.type === 'poll') {
            return (
                <div className="bg-white/40 border border-warm-grey/5 p-5 rounded-2xl mb-4 text-left shadow-sm">
                    <h4 className="font-serif text-base text-warm-cocoa mb-4 font-medium">📊 {poll?.question || post.caption || "Poll"}</h4>
                    <div className="space-y-3">
                        {pollOptions.map((opt) => {
                            const percent = totalVotes > 0 ? Math.round((opt.votes_count / totalVotes) * 100) : 0;
                            const isSelected = userVotedOptionId === opt.id;
                            const hasVoted = userVotedOptionId !== null;
                            
                            return (
                                <button
                                    key={opt.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleVote(opt.id);
                                    }}
                                    disabled={hasVoted}
                                    className={`w-full relative overflow-hidden rounded-xl py-3 px-4 border transition-all text-left flex justify-between items-center text-xs ${
                                        isSelected 
                                            ? "border-sage-green bg-sage-green/10 font-bold" 
                                            : hasVoted 
                                                ? "border-warm-grey/10 bg-stone-50/20" 
                                                : "border-warm-grey/10 hover:border-sage-green/40 bg-white/40 hover:bg-white/60"
                                    }`}
                                >
                                    {hasVoted && (
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percent}%` }}
                                            transition={{ type: "spring", stiffness: 80, damping: 15 }}
                                            className="absolute left-0 top-0 bottom-0 bg-sage-green/15" 
                                        />
                                    )}
                                    <span className="relative z-10 text-warm-grey font-medium">{opt.option_text}</span>
                                    {hasVoted && (
                                        <span className="relative z-10 font-bold text-warm-cocoa">{percent}% ({opt.votes_count})</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                    {totalVotes > 0 && (
                        <p className="text-[10px] text-warm-grey/40 mt-3 text-right font-medium">{totalVotes} total votes</p>
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
        // Split by sticker, mention, or hashtag
        const parts = text.split(/(\[sticker:[^\]]+\]|@[\w.-]+|#[\w]+)/g);
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

                if (stickerName === 'Heart') {
                    return (
                        <span key={index} className="inline-block mx-1.5 align-middle select-none">
                            <img 
                                src="/images/heart_sticker.png" 
                                alt="Heart Sticker" 
                                className="w-7 h-7 object-contain drop-shadow-sticker" 
                            />
                        </span>
                    );
                }

                if (stickerMap[stickerName]) {
                    Icon = stickerMap[stickerName].icon;
                    color = stickerMap[stickerName].color;
                }

                return <span key={index} className="inline-block mx-1 align-middle"><Icon className={`w-4 h-4 ${color} fill-current`} /></span>;
            }

            const mentionMatch = part.match(/^@([\w.-]+)$/);
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

            // Hashtags
            const hashtagMatch = part.match(/^#([\w]+)$/);
            if (hashtagMatch) {
                return (
                    <span key={index} className="text-sage-green font-medium">
                        {part}
                    </span>
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
                                <>
                                    <button
                                        onClick={() => { setShowMenu(false); setIsEditing(true); }}
                                        className="w-full text-left px-4 py-3 text-sm text-warm-grey hover:bg-stone-50 flex items-center gap-2"
                                    >
                                        <Smile className="w-4 h-4" /> Edit Post
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-stone-50 flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete Post
                                    </button>
                                </>
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

            {/* Volume Control for Text-Only Posts */}
            {!hasVisualMedia && post.song_preview_url && (
                <button
                    onClick={toggleMute}
                    className="absolute top-6 right-12 text-warm-grey/40 hover:text-warm-grey p-1 transition-colors"
                >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
            )}

            {renderMedia()}

            {/* Removed separate Song Badge as it's now in header/auto-playing */}

            <div className="font-serif text-lg text-warm-grey mb-4 leading-relaxed whitespace-pre-wrap">
                {isEditing ? (
                    <div className="flex flex-col gap-3">
                        <textarea
                            value={editCaption}
                            onChange={(e) => setEditCaption(e.target.value)}
                            className="w-full p-3 rounded-xl bg-white/50 border border-warm-grey/20 focus:ring-1 focus:ring-sage-green resize-none outline-none font-sans text-sm"
                            rows={3}
                            placeholder="Edit caption..."
                        />

                        {/* Location Edit */}
                        <div className="flex items-center gap-2 bg-white/50 p-2 rounded-xl border border-warm-grey/10">
                            <MapPin className="w-4 h-4 text-warm-grey/60" />
                            <input
                                type="text"
                                value={editLocation}
                                onChange={(e) => setEditLocation(e.target.value)}
                                placeholder="Add location..."
                                className="bg-transparent text-sm text-warm-grey outline-none w-full placeholder:text-warm-grey/40"
                            />
                        </div>

                        {/* Music Edit */}
                        <div className="flex items-center justify-between bg-white/50 p-2 rounded-xl border border-warm-grey/10">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <Music className="w-4 h-4 text-warm-grey/60 flex-shrink-0" />
                                {editSongTitle ? (
                                    <div className="truncate text-sm text-warm-cocoa">
                                        <span className="font-medium">{editSongTitle}</span>
                                        <span className="text-warm-grey/60"> - {editSongArtist}</span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-warm-grey/40 italic">No song selected</span>
                                )}
                            </div>
                            <div className="flex gap-1">
                                {editSongTitle && (
                                    <button
                                        onClick={() => {
                                            setEditSongTitle("");
                                            setEditSongArtist("");
                                            setEditSongLink("");
                                            setEditSongPreview("");
                                            setEditSongArtwork("");
                                        }}
                                        className="p-1.5 hover:bg-red-50 text-warm-grey/40 hover:text-red-400 rounded-full transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsSongModalOpen(true)}
                                    className="p-1.5 hover:bg-stone-100 text-warm-grey/60 hover:text-sage-green rounded-full transition-colors"
                                >
                                    <Edit2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                            <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button size="sm" onClick={handleUpdatePost}>Save Changes</Button>
                        </div>
                    </div>
                ) : (
                    renderContentWithStickers(post.caption)
                )}
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

            <SongSearchModal
                isOpen={isSongModalOpen}
                onClose={() => setIsSongModalOpen(false)}
                onSelect={(song) => {
                    setEditSongTitle(song.title);
                    setEditSongArtist(song.artist);
                    setEditSongLink(song.link);
                    setEditSongPreview(song.previewUrl);
                    setEditSongArtwork(song.artwork);
                }}
            />

            {isShareModalOpen && (
                <ShareModal
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    content={shareContent}
                />
            )}
        </div>
    );
}
