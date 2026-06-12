"use client";

import { useEffect, useState, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Heart, MessageSquare, Trash2, Volume2, VolumeX, Send, Loader2, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";

type Moment = {
    id: string;
    media_url: string | null;
    caption: string | null;
    background_color: string;
    created_at: string;
    user_id: string;
    song_title?: string | null;
    song_artist?: string | null;
    song_album_art?: string | null;
    song_preview_url?: string | null;
    song_link?: string | null;
    profiles: {
        first_name: string;
        username: string;
        avatar_url: string | null;
    };
};

type MomentModalProps = {
    isOpen: boolean;
    onClose: () => void;
    moments: Moment[];
    userName: string;
    userAvatar: string | null;
    currentUserId?: string | null;
    onMomentDeleted?: () => void;
};

const PASTEL_COLORS = [
    { name: 'rose', bg: '#FFF0F0', text: '#B85C5C', label: 'Rose' },
    { name: 'lavender', bg: '#F5EFFF', text: '#6C5CB8', label: 'Lavender' },
    { name: 'blue', bg: '#E8F4FF', text: '#3D7AB8', label: 'Blue' },
    { name: 'mint', bg: '#E8FDF5', text: '#2D8A66', label: 'Mint' },
    { name: 'sage', bg: '#F0F4F1', text: '#556B5D', label: 'Sage' },
    { name: 'peach', bg: '#FFF4EC', text: '#B87845', label: 'Peach' },
    { name: 'yellow', bg: '#FFFCE6', text: '#948010', label: 'Yellow' },
    { name: 'cream', bg: '#FAF5EF', text: '#7E6D59', label: 'Cream' }
];

export function MomentModal({ 
    isOpen, 
    onClose, 
    moments, 
    userName, 
    userAvatar,
    currentUserId = null,
    onMomentDeleted
}: MomentModalProps) {
    const parseVideoTimeFragment = (url: string | null | undefined): { start: number; end: number | null } => {
        if (!url) return { start: 0, end: null };
        try {
            const hash = url.split('#')[1];
            if (hash && hash.startsWith('t=')) {
                const timePart = hash.slice(2);
                const parts = timePart.split(',');
                const start = parseFloat(parts[0]) || 0;
                const end = parts[1] ? parseFloat(parts[1]) : null;
                return { start, end };
            }
        } catch (e) {
            console.error("Error parsing video fragment:", e);
        }
        return { start: 0, end: null };
    };

    const handleVideoLoadedMetadata = (url: string) => (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        const timeFragment = parseVideoTimeFragment(url);
        if (timeFragment.start > 0) {
            video.currentTime = timeFragment.start;
        }
    };

    const handleVideoTimeUpdate = (url: string) => (e: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = e.currentTarget;
        const timeFragment = parseVideoTimeFragment(url);
        if (timeFragment.end !== null && video.currentTime >= timeFragment.end) {
            video.currentTime = timeFragment.start;
            video.play().catch(() => {});
        } else if (video.currentTime < timeFragment.start) {
            video.currentTime = timeFragment.start;
        }
    };

    const [activeIndex, setActiveIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [highlightToggle, setHighlightToggle] = useState(false);

    // Likes & Comments State
    const [likes, setLikes] = useState<{ user_id: string; profiles: { first_name: string; username: string } }[]>([]);
    const [userHasLiked, setUserHasLiked] = useState(false);
    const [comments, setComments] = useState<{ 
        id: string; 
        content: string; 
        created_at: string; 
        user_id: string; 
        profiles: { first_name: string; username: string; avatar_url: string | null } 
    }[]>([]);
    const [newComment, setNewComment] = useState("");
    const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
    const [showLikesModal, setShowLikesModal] = useState(false);
    const [loadingLikesComments, setLoadingLikesComments] = useState(false);

    // Audio & DB refs
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const supabase = createClient();

    // Mention State for story reply comment
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionResults, setMentionResults] = useState<{ id: string, username: string, first_name: string, avatar_url: string }[]>([]);
    const [isMentionOpen, setIsMentionOpen] = useState(false);
    const [cursorPosition, setCursorPosition] = useState<number | null>(null);
    const storyCommentInputRef = useRef<HTMLInputElement>(null);

    // Helper to render mentions in pink
    const renderContentWithMentions = (text: string | null) => {
        if (!text) return null;
        const parts = text.split(/(@[\w.-]+)/g);
        return parts.map((part, index) => {
            const mentionMatch = part.match(/^@([\w.-]+)$/);
            if (mentionMatch) {
                const username = mentionMatch[1];
                return (
                    <a
                        key={index}
                        href={`/profile/${username}`}
                        className="text-pink-300 hover:underline font-bold"
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    // Mention Search
    useEffect(() => {
        if (mentionQuery === null) {
            setMentionResults([]);
            setIsMentionOpen(false);
            return;
        }

        const fetchFriendsForMention = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from("friendships")
                .select(`
                    user_id_1,
                    user_id_2,
                    user1:profiles!friendships_user_id_1_fkey(id, username, first_name, avatar_url),
                    user2:profiles!friendships_user_id_2_fkey(id, username, first_name, avatar_url)
                `)
                .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
                .eq("status", "accepted");

            if (error) {
                console.error("Error fetching friends for mention:", error);
                setMentionResults([]);
                setIsMentionOpen(false);
                return;
            }

            if (data) {
                const friendsList = data.map((f: any) => {
                    return f.user_id_1 === user.id ? f.user2 : f.user1;
                }).filter(Boolean);

                const lowerQuery = mentionQuery.toLowerCase();
                const filtered = friendsList.filter((friend: any) => {
                    return (
                        friend.username?.toLowerCase().includes(lowerQuery) ||
                        friend.first_name?.toLowerCase().includes(lowerQuery)
                    );
                });

                if (filtered.length > 0) {
                    setMentionResults(filtered as any);
                    setIsMentionOpen(true);
                } else {
                    setMentionResults([]);
                    setIsMentionOpen(false);
                }
            } else {
                setMentionResults([]);
                setIsMentionOpen(false);
            }
        };

        const timeoutId = setTimeout(fetchFriendsForMention, 300);
        return () => clearTimeout(timeoutId);
    }, [mentionQuery]);

    const handleCommentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const pos = e.target.selectionStart || 0;
        setNewComment(value);
        setCursorPosition(pos);

        // Detect @ match
        const textBeforeCursor = value.slice(0, pos);
        const match = textBeforeCursor.match(/(?:\s|^)@([\w.-]*)$/);

        if (match) {
            setMentionQuery(match[1]);
        } else {
            setMentionQuery(null);
            setIsMentionOpen(false);
        }
    };

    const insertCommentMention = (username: string) => {
        if (!cursorPosition) return;
        const textBeforeCursor = newComment.slice(0, cursorPosition);
        const match = textBeforeCursor.match(/(?:\s|^)@([\w.-]*)$/);

        if (match) {
            const matchIndex = match.index! + match[0].indexOf('@');
            const textAfterCursor = newComment.slice(cursorPosition);
            const newText = newComment.slice(0, matchIndex) + `@${username} ` + textAfterCursor;

            setNewComment(newText);
            setMentionQuery(null);
            setIsMentionOpen(false);
            
            setTimeout(() => {
                storyCommentInputRef.current?.focus();
            }, 50);
        }
    };

    useEffect(() => {
        if (!isOpen || moments.length === 0) return;

        setActiveIndex(0);
        setProgress(0);
        setShowCommentsDrawer(false);
        setShowLikesModal(false);
    }, [isOpen, moments]);

    // Handle Story Autoplay Progress (Paused when drawers are open)
    useEffect(() => {
        if (!isOpen || moments.length === 0 || showCommentsDrawer || showLikesModal) return;

        setProgress(0);
        const duration = 7000; // 7 seconds per slide for more relaxed reading
        const intervalTime = 50;
        
        let elapsed = 0;
        const timer = setInterval(() => {
            elapsed += intervalTime;
            setProgress((elapsed / duration) * 100);

            if (elapsed >= duration) {
                clearInterval(timer);
                handleNext();
            }
        }, intervalTime);

        return () => clearInterval(timer);
    }, [isOpen, activeIndex, moments, showCommentsDrawer, showLikesModal]);

    // Handle Background Music Playback
    useEffect(() => {
        if (!isOpen || moments.length === 0) {
            stopAudio();
            return;
        }

        stopAudio();
        const currentMoment = moments[activeIndex];
        if (currentMoment?.song_preview_url) {
            audioRef.current = new Audio(currentMoment.song_preview_url);
            audioRef.current.loop = true;
            audioRef.current.volume = 0.4;
            audioRef.current.muted = isMuted;
            audioRef.current.play().catch(e => console.log("Audio play blocked", e));
        }

        return () => stopAudio();
    }, [isOpen, activeIndex]);

    // Update audio mute status
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
        }
    }, [isMuted]);

    // Fetch likes and comments for the current moment
    const currentMoment = moments[activeIndex];
    useEffect(() => {
        if (!isOpen || !currentMoment) return;
        fetchLikesAndComments();
    }, [isOpen, activeIndex, currentMoment?.id]);

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current = null;
        }
    };

    const fetchLikesAndComments = async () => {
        if (!currentMoment) return;
        setLoadingLikesComments(true);
        try {
            // 1. Fetch likes
            const { data: likesData } = await supabase
                .from("moment_likes")
                .select("user_id, profiles(first_name, username)")
                .eq("moment_id", currentMoment.id);

            const fetchedLikes = (likesData || []) as any[];
            setLikes(fetchedLikes);
            
            if (currentUserId) {
                setUserHasLiked(fetchedLikes.some(l => l.user_id === currentUserId));
            }

            // 2. Fetch comments
            const { data: commentsData } = await supabase
                .from("moment_comments")
                .select("id, content, created_at, user_id, profiles(first_name, username, avatar_url)")
                .eq("moment_id", currentMoment.id)
                .order("created_at", { ascending: true });

            setComments((commentsData || []) as any[]);
        } catch (err) {
            console.error("Error loading likes/comments:", err);
        } finally {
            setLoadingLikesComments(false);
        }
    };

    if (moments.length === 0) return null;

    const handlePrev = () => {
        if (activeIndex > 0) {
            setActiveIndex(prev => prev - 1);
        } else {
            setProgress(0);
        }
    };

    const handleNext = () => {
        if (activeIndex < moments.length - 1) {
            setActiveIndex(prev => prev + 1);
        } else {
            onClose();
        }
    };

    const handleDeleteMoment = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Remove this moment from your story?")) return;

        try {
            const { error } = await supabase
                .from("moments")
                .delete()
                .eq("id", currentMoment.id);

            if (error) throw error;

            if (onMomentDeleted) onMomentDeleted();
            handleNext();
        } catch (err: any) {
            console.error("Error deleting moment:", err);
            alert("Failed to delete moment.");
        }
    };

    const handleToggleHighlight = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentMoment || !currentUserId) return;

        const isHighlighted = currentMoment.background_color?.includes('|highlight');
        let newBgColor = currentMoment.background_color || "";

        if (isHighlighted) {
            newBgColor = newBgColor.replace('|highlight', '');
        } else {
            newBgColor = newBgColor + '|highlight';
        }

        try {
            const { error } = await supabase
                .from("moments")
                .update({ background_color: newBgColor })
                .eq("id", currentMoment.id);

            if (error) throw error;

            currentMoment.background_color = newBgColor;
            setHighlightToggle(prev => !prev);
            
            if (onMomentDeleted) {
                onMomentDeleted();
            }
        } catch (err: any) {
            console.error("Error toggling highlight:", err);
            alert("Failed to update highlight status: " + err.message);
        }
    };

    const handleLikeToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUserId || !currentMoment) return;

        const previouslyLiked = userHasLiked;
        setUserHasLiked(!previouslyLiked);

        try {
            if (previouslyLiked) {
                setLikes(prev => prev.filter(l => l.user_id !== currentUserId));
                await supabase
                    .from("moment_likes")
                    .delete()
                    .eq("moment_id", currentMoment.id)
                    .eq("user_id", currentUserId);
            } else {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("first_name, username")
                    .eq("id", currentUserId)
                    .single();

                setLikes(prev => [...prev, { 
                    user_id: currentUserId, 
                    profiles: { first_name: profile?.first_name || "Sister", username: profile?.username || "" } 
                }]);
                
                await supabase
                    .from("moment_likes")
                    .insert({ moment_id: currentMoment.id, user_id: currentUserId });
            }
        } catch (err) {
            console.error("Like toggle error:", err);
        }
    };

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUserId || !currentMoment) return;

        const text = newComment.trim();
        setNewComment("");

        try {
            const { data: profile } = await supabase
                .from("profiles")
                .select("first_name, username, avatar_url")
                .eq("id", currentUserId)
                .single();

            const fakeComment = {
                id: Math.random().toString(),
                content: text,
                created_at: new Date().toISOString(),
                user_id: currentUserId,
                profiles: {
                    first_name: profile?.first_name || "Sister",
                    username: profile?.username || "sister",
                    avatar_url: profile?.avatar_url || null
                }
            };

            setComments(prev => [...prev, fakeComment]);

            await supabase
                .from("moment_comments")
                .insert({
                    moment_id: currentMoment.id,
                    user_id: currentUserId,
                    content: text
                });
        } catch (err) {
            console.error("Error creating comment:", err);
            fetchLikesAndComments();
        }
    };

    const getPastelStyle = (bgName: string) => {
        const color = PASTEL_COLORS.find(c => c.name === bgName) || PASTEL_COLORS[0];
        return {
            backgroundColor: color.bg,
            color: color.text
        };
    };

    const getMomentConfig = (bgColorField: string | null) => {
        if (!bgColorField) return { color: 'rose', frame: 'none' };
        const parts = bgColorField.split('|');
        const color = parts[0] || 'rose';
        const frame = parts[1] || 'none';
        return { color, frame };
    };

    const getFrameClass = (frame: string) => {
        switch (frame) {
            case 'polaroid':
                return 'border-[12px] border-white pb-16 bg-white shadow-xl rounded-sm';
            case 'lace':
                return 'border-[8px] border-double border-muted-rose bg-white outline-[4px] outline-soft-blush outline-offset-[-6px] rounded-3xl shadow-xl p-2';
            case 'gingham':
                return 'border-gingham bg-white p-3 rounded-2xl shadow-xl';
            case 'polka':
                return 'border-polka bg-white p-3 rounded-2xl shadow-xl';
            default:
                return '';
        }
    };

    const MusicCard = ({ moment, bgName }: { moment: any; bgName: string }) => {
        const color = PASTEL_COLORS.find(c => c.name === bgName) || PASTEL_COLORS[0];
        return (
            <div 
                className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none"
                style={{
                    backgroundColor: color.bg,
                    color: color.text
                }}
            >
                {/* Rotating vinyl record mockup */}
                <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-full bg-stone-900 shadow-xl border-4 border-white/20 flex items-center justify-center overflow-hidden mb-6 animate-spin-slow">
                    {/* Vinyl grooves */}
                    <div className="absolute inset-2 border border-white/5 rounded-full" />
                    <div className="absolute inset-4 border border-white/5 rounded-full" />
                    <div className="absolute inset-6 border border-white/5 rounded-full" />
                    <div className="absolute inset-8 border border-white/5 rounded-full" />
                    <div className="absolute inset-10 border border-white/5 rounded-full" />
                    
                    {/* Album art in the middle */}
                    <div className="w-16 h-16 md:w-18 md:h-18 rounded-full overflow-hidden border-2 border-stone-850 bg-stone-700 shrink-0">
                        {moment.song_album_art ? (
                            <img src={moment.song_album_art} alt="Cover" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted-rose text-white">
                                🎵
                            </div>
                        )}
                    </div>
                    {/* Center spindle hole */}
                    <div className="absolute w-3 h-3 bg-white rounded-full border border-stone-900 shadow-inner z-10" />
                </div>

                {/* Song details */}
                <div className="space-y-1 max-w-xs">
                    <h4 className="font-serif text-xl md:text-2xl font-bold tracking-tight text-current drop-shadow-sm line-clamp-2">
                        {moment.song_title || "Untitled Song"}
                    </h4>
                    <p className="text-xs font-semibold opacity-75 line-clamp-1">
                        {moment.song_artist || "Unknown Artist"}
                    </p>
                </div>

                {/* Aesthetic visualizer lines */}
                <div className="flex items-end gap-1 mt-6 h-8 justify-center">
                    {[...Array(6)].map((_, i) => (
                        <div 
                            key={i} 
                            className="w-1 bg-current rounded-full animate-soundwave"
                            style={{
                                height: '24px',
                                animationDelay: `${i * 0.15}s`
                            }}
                        />
                    ))}
                </div>
                
                <span className="text-[9px] uppercase tracking-widest opacity-40 mt-8 font-bold">
                    Sisters, tune in! ౨ৎ
                </span>
            </div>
        );
    };

    const { color: bgColorName, frame: frameStyle } = getMomentConfig(currentMoment.background_color);
    const mediaUrl = currentMoment.media_url;
    const isVideo = mediaUrl ? (
        mediaUrl.endsWith(".mp4") || 
        mediaUrl.includes(".mov") || 
        mediaUrl.includes(".webm") || 
        mediaUrl.includes(".m4v") ||
        mediaUrl.includes("_moment.mp4")
    ) : false;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
        >
            {/* Click zones */}
            <div className="absolute inset-0 flex">
                <div className="w-1/3 h-full cursor-w-resize" onClick={handlePrev} />
                <div className="w-1/3 h-full" onClick={() => { setShowCommentsDrawer(false); setShowLikesModal(false); }} />
                <div className="w-1/3 h-full cursor-e-resize" onClick={handleNext} />
            </div>

            {/* Modal Card */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                transition={{ type: "spring", damping: 20, stiffness: 260 }}
                className="relative w-full max-w-md h-[85vh] mx-4 bg-stone-950 rounded-[2.5rem] overflow-hidden flex flex-col justify-between shadow-2xl border border-stone-900 z-10">
                {/* Progress Indicators */}
                <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
                    {moments.map((_, idx) => (
                        <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-white transition-all duration-75"
                                style={{ 
                                    width: idx < activeIndex 
                                        ? '100%' 
                                        : idx === activeIndex 
                                            ? `${progress}%` 
                                            : '0%' 
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header Profile Info */}
                <div className="absolute top-8 left-4 right-4 flex justify-between items-center z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-soft-blush overflow-hidden border border-white/20 shadow-sm">
                            {userAvatar ? (
                                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="w-full h-full flex items-center justify-center text-xs text-warm-grey font-serif bg-white uppercase">
                                    {userName[0]}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-white text-xs shadow-sm">{userName}</p>
                            <p className="text-[10px] text-white/60 shadow-sm">Active Moment</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Song details */}
                        {currentMoment.song_title && (
                            <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full text-[9px] text-white border border-white/10 shrink max-w-[120px]">
                                <span className="animate-spin-slow">🎵</span>
                                <span className="truncate">{currentMoment.song_title}</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                                    className="ml-1 text-white/60 hover:text-white"
                                >
                                    {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                                </button>
                            </div>
                        )}

                        {/* Star Button for highlighting */}
                        {currentMoment.user_id === currentUserId && (
                            <button
                                onClick={handleToggleHighlight}
                                className={`p-1.5 rounded-full bg-black/40 hover:bg-yellow-500/80 text-white transition-colors border border-white/10 ${
                                    currentMoment.background_color?.includes('|highlight') 
                                        ? "text-yellow-400 fill-yellow-400 border-yellow-400/30" 
                                        : "text-white"
                                }`}
                                title={currentMoment.background_color?.includes('|highlight') ? "Remove from Highlights" : "Add to Highlights"}
                            >
                                <Star className="w-3.5 h-3.5" />
                            </button>
                        )}

                        {/* Trash Button for deletion */}
                        {currentMoment.user_id === currentUserId && (
                            <button
                                onClick={handleDeleteMoment}
                                className="p-1.5 rounded-full bg-black/40 hover:bg-red-500/80 text-white transition-colors border border-white/10"
                                title="Delete Moment"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}

                        <button 
                            onClick={onClose}
                            className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors border border-white/10"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col items-center justify-center relative bg-stone-950 p-6">
                    {frameStyle && frameStyle !== 'none' ? (
                        <div className={`w-full aspect-[9/16] relative flex flex-col overflow-hidden ${getFrameClass(frameStyle)}`}>
                            <div className="w-full h-full relative overflow-hidden bg-stone-100 flex items-center justify-center">
                                {mediaUrl ? (
                                    isVideo ? (
                                        <video 
                                            src={mediaUrl || undefined} 
                                            autoPlay 
                                            playsInline 
                                            muted 
                                            loop 
                                            onLoadedMetadata={handleVideoLoadedMetadata(mediaUrl!)}
                                            onTimeUpdate={handleVideoTimeUpdate(mediaUrl!)}
                                            className="w-full h-full object-cover" 
                                        />
                                    ) : (
                                        <img 
                                            src={mediaUrl} 
                                            alt="Moment Content" 
                                            className="w-full h-full object-cover" 
                                        />
                                    )
                                ) : (
                                    <MusicCard moment={currentMoment} bgName={bgColorName} />
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                            {mediaUrl ? (
                                isVideo ? (
                                    <video 
                                        src={mediaUrl || undefined} 
                                        autoPlay 
                                        playsInline 
                                        muted 
                                        loop 
                                        onLoadedMetadata={handleVideoLoadedMetadata(mediaUrl!)}
                                        onTimeUpdate={handleVideoTimeUpdate(mediaUrl!)}
                                        className="w-full h-full object-contain" 
                                    />
                                ) : (
                                    <img 
                                        src={mediaUrl} 
                                        alt="Moment Content" 
                                        className="w-full h-full object-contain" 
                                    />
                                )
                            ) : (
                                <MusicCard moment={currentMoment} bgName={bgColorName} />
                            )}
                        </div>
                    )}
                    {currentMoment.caption && (
                        <div className="absolute bottom-16 left-4 right-4 bg-black/50 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center z-10">
                            <p className="text-white text-sm font-medium">{renderContentWithMentions(currentMoment.caption)}</p>
                        </div>
                    )}
                </div>

                {/* Footer Controls (Like & Comment buttons) */}
                <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-center gap-3">
                    <button
                        onClick={handleLikeToggle}
                        className="flex items-center gap-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-md px-4 py-2.5 rounded-full text-xs text-white border border-white/10 transition-all active:scale-95"
                    >
                        <Heart className={`w-4 h-4 transition-transform ${userHasLiked ? "fill-red-500 text-red-500 scale-110 animate-pulse" : "text-white"}`} />
                        {currentMoment.user_id === currentUserId && (
                            <span 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (likes.length > 0) {
                                        setShowLikesModal(true);
                                    }
                                }}
                                className="hover:underline font-bold cursor-pointer"
                            >
                                {likes.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); setShowCommentsDrawer(true); }}
                        className="flex items-center gap-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-md px-4 py-2.5 rounded-full text-xs text-white border border-white/10 transition-all active:scale-95 flex-1 justify-center"
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span className="font-bold">Comments ({comments.length})</span>
                    </button>
                </div>

                {/* Comments Drawer Overlay */}
                {showCommentsDrawer && (
                    <div className="absolute inset-x-0 bottom-0 max-h-[60%] bg-stone-900 border-t border-white/10 rounded-t-[2rem] z-30 flex flex-col p-4 animate-in slide-in-from-bottom duration-300">
                        {/* Header */}
                        <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <span className="text-xs font-bold uppercase tracking-wider text-white/60">Comments ({comments.length})</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowCommentsDrawer(false); }}
                                className="p-1 text-white/40 hover:text-white rounded-full hover:bg-white/5"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto py-3 space-y-3 custom-scrollbar text-left">
                            {comments.length === 0 ? (
                                <p className="text-xs text-white/30 text-center py-8">No comments yet. Encourage your sister! ౨ৎ</p>
                            ) : (
                                comments.map(c => (
                                    <div key={c.id} className="flex gap-2.5 items-start text-xs">
                                        <div className="w-6 h-6 rounded-full bg-white/10 overflow-hidden shrink-0 border border-white/10">
                                            {c.profiles.avatar_url ? (
                                                <img src={c.profiles.avatar_url} alt={c.profiles.first_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="w-full h-full flex items-center justify-center font-serif text-[10px] bg-soft-blush text-warm-cocoa uppercase">
                                                    {c.profiles.first_name[0]}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 bg-white/5 p-2 rounded-xl border border-white/5">
                                            <p className="font-bold text-white mb-0.5">@{c.profiles.username}</p>
                                            <p className="text-white/80 leading-relaxed">{renderContentWithMentions(c.content)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input Form */}
                        {currentUserId ? (
                            <form onSubmit={handleAddComment} className="relative flex gap-2 pt-2 border-t border-white/5">
                                {/* Mention Autocomplete */}
                                {isMentionOpen && mentionResults.length > 0 && (
                                    <div className="absolute bottom-full mb-2 left-0 w-48 bg-stone-900 rounded-xl shadow-lg border border-white/10 overflow-hidden z-50 animate-fade-in-up">
                                        {mentionResults.map((profile) => (
                                            <button
                                                type="button"
                                                key={profile.id}
                                                className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-white/5 transition-colors"
                                                onClick={() => insertCommentMention(profile.username)}
                                            >
                                                <div className="w-6 h-6 rounded-full bg-white/10 overflow-hidden">
                                                    {profile.avatar_url ? (
                                                        <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white/40">
                                                            {profile.first_name?.[0]}
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-white truncate">@{profile.username}</p>
                                                    <p className="text-[10px] text-white/60 truncate">{profile.first_name}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <input
                                    ref={storyCommentInputRef}
                                    type="text"
                                    value={newComment}
                                    onChange={handleCommentInputChange}
                                    placeholder="Add a sweet reply..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:ring-1 focus:ring-muted-rose"
                                />
                                <button 
                                    type="submit"
                                    className="bg-muted-rose text-white p-2.5 rounded-xl hover:bg-muted-rose/90 transition-colors"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        ) : (
                            <p className="text-[10px] text-white/40 text-center pt-2">Log in to comment.</p>
                        )}
                    </div>
                )}

                {/* Liked By List Modal Overlay */}
                {showLikesModal && (
                    <div className="absolute inset-x-0 bottom-0 max-h-[50%] bg-stone-900 border-t border-white/10 rounded-t-[2rem] z-30 flex flex-col p-4 animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center pb-3 border-b border-white/5">
                            <span className="text-xs font-bold uppercase tracking-wider text-white/60">Liked By ({likes.length})</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowLikesModal(false); }}
                                className="p-1 text-white/40 hover:text-white rounded-full hover:bg-white/5"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto py-3 space-y-3 text-left">
                            {likes.map(l => (
                                <div key={l.user_id} className="flex items-center gap-3 py-1 border-b border-white/5">
                                    <div className="w-8 h-8 rounded-full bg-soft-blush flex items-center justify-center font-serif text-xs text-warm-cocoa uppercase border border-white/10">
                                        {l.profiles.first_name[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-xs">@{l.profiles.username}</p>
                                        <p className="text-[10px] text-white/50">{l.profiles.first_name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Nav Controls (Desktop Only) */}
                <button 
                    onClick={handlePrev} 
                    className="absolute left-[-60px] top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hidden md:flex z-20"
                    title="Previous"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                    onClick={handleNext} 
                    className="absolute right-[-60px] top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hidden md:flex z-20"
                    title="Next"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </motion.div>
        </motion.div>
    );
}
