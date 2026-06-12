"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Upload, Loader2, Sparkles, Music, Scissors, Star } from "lucide-react";
import { MomentModal } from "./MomentModal";
import { Button } from "@/components/ui/Button";
import { SongSearchModal } from "@/components/ui/SongSearchModal";
import { motion, AnimatePresence } from "framer-motion";

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

type GroupedMoment = {
    user_id: string;
    userName: string;
    userAvatar: string | null;
    moments: Moment[];
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

const FRAMES = [
    { name: "none", label: "No Frame" },
    { name: "polaroid", label: "Polaroid 📸" },
    { name: "lace", label: "Lace ౨ৎ" },
    { name: "gingham", label: "Gingham 🏁" },
    { name: "polka", label: "Polka Dot ⚪" }
];

interface MomentsBarProps {
    profileUserId?: string;
    isOwner?: boolean;
}

export function MomentsBar({ profileUserId, isOwner = true }: MomentsBarProps) {
    const [myMoments, setMyMoments] = useState<Moment[]>([]);
    const [highlightedMoments, setHighlightedMoments] = useState<Moment[]>([]);
    const [otherGroups, setOtherGroups] = useState<GroupedMoment[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

    // Modal view states
    const [selectedGroup, setSelectedGroup] = useState<GroupedMoment | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);

    // Modal create states
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const [bgColor, setBgColor] = useState("rose");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [selectedFrame, setSelectedFrame] = useState("none");
    const [creating, setCreating] = useState(false);

    // Trimming states
    const [trimStart, setTrimStart] = useState<number>(0);
    const [trimEnd, setTrimEnd] = useState<number>(0);
    const [videoDuration, setVideoDuration] = useState<number>(0);
    const [isTrimming, setIsTrimming] = useState(false);
    const [tempTrimStart, setTempTrimStart] = useState<number>(0);
    const [tempTrimEnd, setTempTrimEnd] = useState<number>(0);
    const trimmerVideoRef = useRef<HTMLVideoElement>(null);

    // Song selection state
    const [songTitle, setSongTitle] = useState("");
    const [songArtist, setSongArtist] = useState("");
    const [songLink, setSongLink] = useState("");
    const [songPreview, setSongPreview] = useState("");
    const [songArtwork, setSongArtwork] = useState("");
    const [showSongInput, setShowSongInput] = useState(false);
    const [isSongModalOpen, setIsSongModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    useEffect(() => {
        loadCurrentUserAndMoments();
    }, [profileUserId]);

    const loadCurrentUserAndMoments = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            const targetUserId = profileUserId || user?.id;
            if (!targetUserId) {
                setLoading(false);
                return;
            }

            // Fetch target user profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("first_name, avatar_url, username")
                .eq("id", targetUserId)
                .single();
            
            if (profileUserId || user?.id === targetUserId) {
                setCurrentUserProfile(profile);
            }

            const formatMoment = (m: any): Moment => {
                const profileObj = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
                return {
                    id: m.id,
                    media_url: m.media_url,
                    caption: m.caption,
                    background_color: m.background_color,
                    created_at: m.created_at,
                    user_id: m.user_id,
                    song_title: m.song_title,
                    song_artist: m.song_artist,
                    song_album_art: m.song_album_art,
                    song_preview_url: m.song_preview_url,
                    song_link: m.song_link,
                    profiles: {
                        first_name: profileObj?.first_name || "Sister",
                        username: profileObj?.username || "",
                        avatar_url: profileObj?.avatar_url || null
                    }
                };
            };

            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

            // 1. Fetch moments for the target user (both active and highlighted)
            const { data: targetMomentsData } = await supabase
                .from("moments")
                .select(`
                    id, media_url, caption, background_color, created_at, user_id,
                    song_title, song_artist, song_album_art, song_preview_url, song_link,
                    profiles!moments_user_id_fkey (first_name, username, avatar_url)
                `)
                .eq("user_id", targetUserId)
                .or(`created_at.gt.${twentyFourHoursAgo},background_color.like.*highlight*`)
                .order("created_at", { ascending: true });

            // 2. Fetch active moments for friends (ONLY if we are on own dashboard view)
            let friendsMomentsData: Moment[] = [];
            if (!profileUserId && user) {
                const { data: friendships } = await supabase
                    .from("friendships")
                    .select("user_id_1, user_id_2")
                    .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
                    .eq("status", "accepted");

                if (friendships && friendships.length > 0) {
                    const friendIds = friendships.map((f: any) => 
                        f.user_id_1 === user.id ? f.user_id_2 : f.user_id_1
                    );

                    const { data: friendsMoments } = await supabase
                        .from("moments")
                        .select(`
                            id, media_url, caption, background_color, created_at, user_id,
                            song_title, song_artist, song_album_art, song_preview_url, song_link,
                            profiles!moments_user_id_fkey (first_name, username, avatar_url)
                        `)
                        .in("user_id", friendIds)
                        .gt("created_at", twentyFourHoursAgo)
                        .order("created_at", { ascending: true });

                    if (friendsMoments) {
                        friendsMomentsData = friendsMoments.map(formatMoment);
                    }
                }
            }

            // Filter target user's moments into active and highlighted
            const personalMoments = (targetMomentsData || []).map(formatMoment);
            const activePersonal = personalMoments.filter(m => new Date(m.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000));
            const highlightedPersonal = personalMoments.filter(m => m.background_color?.includes('|highlight'));

            setMyMoments(activePersonal);
            setHighlightedMoments(highlightedPersonal);

            // Group friends' moments
            if (friendsMomentsData.length > 0) {
                const groups: { [key: string]: Moment[] } = {};
                friendsMomentsData.forEach((m) => {
                    if (!groups[m.user_id]) groups[m.user_id] = [];
                    groups[m.user_id].push(m);
                });

                const formattedGroups: GroupedMoment[] = Object.keys(groups).map(userId => {
                    const firstMoment = groups[userId][0];
                    return {
                        user_id: userId,
                        userName: firstMoment.profiles?.first_name || "Sister",
                        userAvatar: firstMoment.profiles?.avatar_url || null,
                        moments: groups[userId]
                    };
                });

                setOtherGroups(formattedGroups);
            } else {
                setOtherGroups([]);
            }

        } catch (err) {
            console.error("Error loading moments:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
            if (file.size > MAX_FILE_SIZE) {
                alert("This file is too large! The maximum file size limit is 50MB.");
                return;
            }
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setFilePreview(objectUrl);

            if (file.type.startsWith('video/')) {
                const duration = await new Promise<number>((resolve) => {
                    const tempVideo = document.createElement('video');
                    tempVideo.src = objectUrl;
                    tempVideo.onloadedmetadata = () => {
                        resolve(tempVideo.duration);
                    };
                    tempVideo.onerror = () => {
                        resolve(0);
                    };
                });
                setVideoDuration(duration);
                setTrimStart(0);
                setTrimEnd(duration);
            } else {
                setVideoDuration(0);
                setTrimStart(0);
                setTrimEnd(0);
            }
        }
    };

    const handleShareMoment = async () => {
        if (!currentUser) return;
        if (!selectedFile && !songTitle) return;

        setCreating(true);
        try {
            let mediaUrl = null;

            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${currentUser.id}/${Date.now()}_moment.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('posts')
                    .upload(fileName, selectedFile);

                if (uploadError) throw uploadError;

                let { data: { publicUrl } } = supabase.storage
                    .from('posts')
                    .getPublicUrl(fileName);

                if (selectedFile.type.startsWith('video/') && trimEnd > 0) {
                    publicUrl = `${publicUrl}#t=${trimStart.toFixed(2)},${trimEnd.toFixed(2)}`;
                }

                mediaUrl = publicUrl;
            }

            const { error: insertError } = await supabase
                .from("moments")
                .insert({
                    user_id: currentUser.id,
                    caption: null,
                    media_url: mediaUrl,
                    background_color: `${selectedFile ? 'default' : bgColor}|${selectedFrame}`,
                    song_title: songTitle.trim() || null,
                    song_artist: songArtist.trim() || null,
                    song_album_art: songArtwork?.trim() || null,
                    song_preview_url: songPreview?.trim() || null,
                    song_link: songLink.trim() || null
                });

            if (insertError) throw insertError;

            // Reset states
            setSelectedFrame("none");
            setBgColor("rose");
            setSelectedFile(null);
            setFilePreview(null);
            setSongTitle("");
            setSongArtist("");
            setSongLink("");
            setSongPreview("");
            setSongArtwork("");
            setShowSongInput(false);
            setIsCreatorOpen(false);

            // Reload moments
            await loadCurrentUserAndMoments();
        } catch (err: any) {
            console.error("Error sharing moment:", err);
            alert("Failed to share moment: " + err.message);
        } finally {
            setCreating(false);
        }
    };

    const openViewer = (group: GroupedMoment) => {
        setSelectedGroup(group);
        setIsViewerOpen(true);
    };

    const myGroup = myMoments.length > 0 ? {
        user_id: currentUser?.id,
        userName: currentUserProfile?.first_name || "Me",
        userAvatar: currentUserProfile?.avatar_url || null,
        moments: myMoments
    } : null;

    if (loading && !currentUser) {
        return (
            <div className="flex gap-4 overflow-x-auto py-2 mb-6">
                {[1, 2, 3, 4].map(n => (
                    <div key={n} className="w-16 h-16 rounded-full bg-stone-100 animate-pulse shrink-0" />
                ))}
            </div>
        );
    }

    if (!isOwner) {
        if (highlightedMoments.length === 0) return null;
        return (
            <div className="w-full flex flex-col gap-4 select-none mb-6">
                {/* Highlights row */}
                <div className="flex flex-col gap-2 w-full px-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-warm-grey/40 flex items-center gap-1 font-sans">
                        <Star className="w-3.5 h-3.5 fill-pink-400 text-pink-400" /> Sister Highlights
                    </span>
                    <div className="flex gap-4 overflow-x-auto py-2 scrollbar-hide">
                        {highlightedMoments.map((moment) => {
                            const bgColorName = moment.background_color.split('|')[0] || 'rose';
                            const color = PASTEL_COLORS.find(c => c.name === bgColorName) || PASTEL_COLORS[0];
                            return (
                                <motion.div
                                    key={moment.id}
                                    onClick={() => {
                                        setSelectedGroup({
                                            user_id: moment.user_id,
                                            userName: currentUserProfile?.first_name || "Sister",
                                            userAvatar: currentUserProfile?.avatar_url || null,
                                            moments: highlightedMoments
                                        });
                                        setIsViewerOpen(true);
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
                                >
                                    <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-pink-400 via-pink-300 to-pink-400 shadow-md ring-2 ring-pink-100/50 transition-transform group-hover:scale-105">
                                        <div className="w-full h-full rounded-full border border-white overflow-hidden bg-white flex items-center justify-center">
                                            {moment.media_url ? (
                                                moment.media_url.endsWith(".mp4") || moment.media_url.includes(".mov") ? (
                                                    <span className="text-xs">🎥</span>
                                                ) : (
                                                    <img src={moment.media_url} alt="Highlight" className="w-full h-full object-cover" />
                                                )
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs" style={{ backgroundColor: color.bg, color: color.text }}>
                                                    🎵
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-bold text-warm-grey/60 max-w-[64px] truncate text-center font-sans">
                                        {moment.song_title || new Date(moment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Moments Viewer Modal */}
                <AnimatePresence>
                    {selectedGroup && (
                        <MomentModal 
                            isOpen={isViewerOpen}
                            onClose={() => {
                                setIsViewerOpen(false);
                                setSelectedGroup(null);
                            }}
                            moments={selectedGroup.moments}
                            userName={selectedGroup.userName}
                            userAvatar={selectedGroup.userAvatar}
                            currentUserId={currentUser?.id}
                            onMomentDeleted={loadCurrentUserAndMoments}
                        />
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-5 select-none mb-6">
            {/* Highlights row (Visible above own share card) */}
            {highlightedMoments.length > 0 && (
                <div className="flex flex-col gap-2 w-full px-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-warm-grey/40 flex items-center gap-1 font-sans">
                        <Star className="w-3.5 h-3.5 fill-pink-400 text-pink-400" /> My Highlights
                    </span>
                    <div className="flex gap-4 overflow-x-auto py-2 scrollbar-hide">
                        {highlightedMoments.map((moment) => {
                            const bgColorName = moment.background_color.split('|')[0] || 'rose';
                            const color = PASTEL_COLORS.find(c => c.name === bgColorName) || PASTEL_COLORS[0];
                            return (
                                <motion.div
                                    key={moment.id}
                                    onClick={() => {
                                        setSelectedGroup({
                                            user_id: moment.user_id,
                                            userName: currentUserProfile?.first_name || "Me",
                                            userAvatar: currentUserProfile?.avatar_url || null,
                                            moments: highlightedMoments
                                        });
                                        setIsViewerOpen(true);
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
                                >
                                    <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-pink-400 via-pink-300 to-pink-400 shadow-md ring-2 ring-pink-100/50 transition-transform group-hover:scale-105">
                                        <div className="w-full h-full rounded-full border border-white overflow-hidden bg-white flex items-center justify-center">
                                            {moment.media_url ? (
                                                moment.media_url.endsWith(".mp4") || moment.media_url.includes(".mov") ? (
                                                    <span className="text-xs">🎥</span>
                                                ) : (
                                                    <img src={moment.media_url} alt="Highlight" className="w-full h-full object-cover" />
                                                )
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs" style={{ backgroundColor: color.bg, color: color.text }}>
                                                    🎵
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[9px] font-bold text-warm-grey/60 max-w-[64px] truncate text-center font-sans">
                                        {moment.song_title || new Date(moment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* My Moment Cute Centered Card */}
            <div 
                className="w-full max-w-sm mx-auto p-6 rounded-3xl border-2 border-dashed border-[#8D7B68]/30 shadow-sm relative overflow-hidden flex flex-col items-center justify-center"
                style={{
                    backgroundColor: "#FFF0F5",
                    backgroundImage: "radial-gradient(#8D7B68 10%, transparent 11%), radial-gradient(#FFFFFF 12%, transparent 13%)",
                    backgroundSize: "16px 16px",
                    backgroundPosition: "0 0, 8px 8px"
                }}
            >
                <div 
                    onClick={myGroup ? () => openViewer(myGroup) : () => setIsCreatorOpen(true)}
                    className="relative cursor-pointer group flex flex-col items-center"
                >
                    {/* Signature Bow on top */}
                    <img 
                        src="/images/selahly_bow.png" 
                        alt="Signature Bow" 
                        className="absolute -top-5 w-10 h-10 object-contain z-20 drop-shadow-sm transform group-hover:scale-110 transition-transform duration-200" 
                    />

                    {/* Bigger Circle (w-20 h-20) */}
                    <div className={`w-20 h-20 rounded-full p-[3.5px] bg-gradient-to-tr ${
                        myGroup 
                            ? 'from-pink-400 via-pink-300 to-pink-400 ring-4 ring-pink-100 shadow-[0_0_15px_rgba(244,143,177,0.7)] animate-pulse' 
                            : 'from-warm-grey/15 to-warm-grey/30'
                    } shadow-md transition-all group-hover:scale-[1.03] duration-200`}>
                        <div className="w-full h-full rounded-full border border-white overflow-hidden bg-white flex items-center justify-center">
                            {currentUserProfile?.avatar_url ? (
                                <img src={currentUserProfile.avatar_url} alt="Me" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-soft-blush text-warm-grey font-serif uppercase text-2xl">
                                    {currentUserProfile?.first_name?.[0] || "Me"}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Plus badge overlay if no moment */}
                    {!myGroup && (
                        <div className="absolute bottom-0 right-0 w-6 h-6 bg-muted-rose text-white rounded-full flex items-center justify-center border-2 border-white shadow-sm hover:scale-105 active:scale-95 transition-all">
                            <Plus className="w-4 h-4" />
                        </div>
                    )}
                </div>

                <div 
                    onClick={myGroup ? () => openViewer(myGroup) : () => setIsCreatorOpen(true)}
                    className="cursor-pointer text-center mt-3.5 relative z-10 bg-white/80 backdrop-blur-md py-1.5 px-5 rounded-full border border-warm-grey/10 shadow-sm transition-all hover:bg-white hover:shadow"
                >
                    <span className="text-xs font-serif text-warm-cocoa font-bold">
                        {myGroup ? "View Your Story" : "Share Your Moment ౨ৎ"}
                    </span>
                </div>
            </div>

            {/* Friend bubbles scrollable row */}
            {otherGroups.length > 0 && (
                <div className="flex flex-col gap-1.5 px-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-warm-grey/40 mb-1">Sister Updates</span>
                    <div className="flex gap-4 overflow-x-auto py-2 scrollbar-hide">
                        {otherGroups.map((group) => (
                            <motion.div 
                                key={group.user_id}
                                onClick={() => openViewer(group)}
                                whileTap={{ scale: 0.92 }}
                                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
                            >
                                <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-pink-400 via-pink-300 to-pink-400 ring-2 ring-pink-100 shadow-[0_0_10px_rgba(244,143,177,0.6)] animate-pulse shrink-0 transition-transform">
                                    <div className="w-full h-full rounded-full border border-white overflow-hidden bg-white">
                                        {group.userAvatar ? (
                                            <img src={group.userAvatar} alt={group.userName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-sage-green/20 text-warm-grey font-serif uppercase text-lg">
                                                {group.userName[0]}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-warm-grey/70 font-sans">{group.userName}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Moments Viewer Modal */}
            <AnimatePresence>
                {selectedGroup && (
                    <MomentModal 
                        isOpen={isViewerOpen}
                        onClose={() => {
                            setIsViewerOpen(false);
                            setSelectedGroup(null);
                        }}
                        moments={selectedGroup.moments}
                        userName={selectedGroup.userName}
                        userAvatar={selectedGroup.userAvatar}
                        currentUserId={currentUser?.id}
                        onMomentDeleted={loadCurrentUserAndMoments}
                    />
                )}
            </AnimatePresence>

            {/* Moments Creator Modal */}
            {isCreatorOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4 pb-24">
                    <div className="bg-warm-paper rounded-3xl p-6 shadow-2xl w-full max-w-sm border border-white flex flex-col gap-4 animate-fade-in-up text-left">
                        <div className="flex justify-between items-center pb-2 border-b border-warm-grey/5">
                            <h3 className="font-serif text-lg text-warm-cocoa flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-muted-rose" /> Share a Moment
                            </h3>
                            <button 
                                onClick={() => {
                                    setIsCreatorOpen(false);
                                    setSelectedFile(null);
                                    setFilePreview(null);
                                    setSelectedFrame("none");
                                }}
                                className="p-1 rounded-full hover:bg-stone-100 text-warm-grey/60"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* File preview or Text-only preview */}
                        <div className="relative aspect-[9/16] max-h-[300px] w-full rounded-2xl border border-warm-grey/10 overflow-hidden bg-stone-900 flex items-center justify-center shadow-inner p-3">
                            <div className={`w-full h-full relative overflow-hidden flex items-center justify-center transition-all duration-300 ${
                                selectedFrame === 'polaroid' ? 'border-[8px] border-white pb-10 bg-white shadow-md rounded-sm' :
                                selectedFrame === 'lace' ? 'border-[6px] border-double border-muted-rose bg-white outline-[3px] outline-soft-blush outline-offset-[-5px] rounded-2xl shadow-md p-1' :
                                selectedFrame === 'gingham' ? 'border-gingham bg-white p-2.5 rounded-xl shadow-md' :
                                selectedFrame === 'polka' ? 'border-polka bg-white p-2.5 rounded-xl shadow-md' : ''
                            }`}>
                                <div className="w-full h-full relative overflow-hidden bg-stone-100 flex items-center justify-center">
                                    {filePreview ? (
                                        <>
                                            {selectedFile?.type.startsWith('video/') ? (
                                                <video src={filePreview} controls muted className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                                            )}
                                        </>
                                    ) : (
                                        <div 
                                            className="w-full h-full flex flex-col items-center justify-center p-4 text-center select-none"
                                            style={{
                                                backgroundColor: PASTEL_COLORS.find(c => c.name === bgColor)?.bg || '#FFF0F0',
                                                color: PASTEL_COLORS.find(c => c.name === bgColor)?.text || '#B85C5C'
                                            }}
                                        >
                                            {songTitle ? (
                                                <div className="flex flex-col items-center justify-center">
                                                    {songArtwork ? (
                                                        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/40 shadow-sm mb-2 animate-spin-slow">
                                                            <img src={songArtwork} alt="Cover" className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-current/10 flex items-center justify-center mb-2">
                                                            <Music className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                    <span className="font-bold text-[11px] line-clamp-1 max-w-[120px]">{songTitle}</span>
                                                    <span className="text-[9px] opacity-75 line-clamp-1 max-w-[120px] mt-0.5">{songArtist}</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1.5 opacity-40">
                                                    <Music className="w-6 h-6" />
                                                    <span className="text-[9px] font-bold uppercase tracking-wider">Photo/Video or Song</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Remove file button */}
                            {filePreview && (
                                <button 
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setFilePreview(null);
                                    }}
                                    className="absolute top-5 right-5 p-1 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors z-20"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}

                            {selectedFile?.type.startsWith('video/') && (
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setTempTrimStart(trimStart);
                                        setTempTrimEnd(trimEnd || videoDuration);
                                        setIsTrimming(true);
                                    }}
                                    className="absolute bottom-5 right-5 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors flex items-center justify-center z-20"
                                    title="Trim video"
                                >
                                    <Scissors className="w-3.5 h-3.5" />
                                </button>
                            )}

                            {selectedFile?.type.startsWith('video/') && (trimStart > 0 || trimEnd < videoDuration) && (
                                <div className="absolute bottom-5 left-5 bg-pink-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-sm z-20">
                                    Trimmed
                                </div>
                            )}
                        </div>

                        {/* Frame picker */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-warm-cocoa">Select Frame</label>
                            <div className="flex flex-wrap gap-1.5">
                                {FRAMES.map((frame) => (
                                    <button 
                                        key={frame.name}
                                        type="button"
                                        onClick={() => setSelectedFrame(frame.name)}
                                        className={`px-2.5 py-1 rounded-full text-[9px] font-bold border transition-all ${
                                            selectedFrame === frame.name
                                                ? "bg-muted-rose text-white border-muted-rose"
                                                : "bg-white/50 text-warm-grey/70 border-warm-grey/10 hover:bg-white"
                                        }`}
                                    >
                                        {frame.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* BG Color picker if text-only */}
                        {!selectedFile && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-warm-cocoa">Background Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {PASTEL_COLORS.map((color) => (
                                        <button 
                                            key={color.name}
                                            type="button"
                                            onClick={() => setBgColor(color.name)}
                                            className="w-6 h-6 rounded-full border-2 transition-all hover:scale-105 active:scale-95"
                                            style={{
                                                backgroundColor: color.bg,
                                                borderColor: bgColor === color.name ? '#8D7B68' : 'transparent'
                                            }}
                                            title={color.label}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Song Inputs */}
                        {showSongInput ? (
                            <div className="bg-white/40 p-3 rounded-xl border border-warm-grey/10 relative group">
                                <div className="flex items-center gap-3">
                                    {songArtwork ? (
                                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                                            <img src={songArtwork} alt="Cover" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center shrink-0">
                                            <Music className="w-5 h-5 text-warm-grey/40" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0 text-left">
                                        <div className="font-bold text-warm-cocoa truncate text-xs">{songTitle}</div>
                                        <div className="text-[10px] text-warm-grey/60 truncate">{songArtist}</div>
                                    </div>
                                    <button onClick={() => {
                                        setShowSongInput(false);
                                        setSongTitle("");
                                        setSongArtist("");
                                        setSongLink("");
                                        setSongPreview("");
                                        setSongArtwork("");
                                    }} className="p-1 text-warm-grey/40 hover:text-red-400">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        {/* Photo/Video selection button */}
                        <input 
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*,video/*"
                            onChange={handleFileChange}
                        />

                        <div className="flex flex-col gap-2 mt-2">
                            <div className="flex gap-2">
                                <Button 
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 border-warm-grey/10 text-warm-grey flex items-center justify-center gap-1"
                                >
                                    <Upload className="w-4 h-4" /> Photo/Video
                                </Button>
                                {!showSongInput && (
                                    <Button 
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsSongModalOpen(true)}
                                        className="flex-1 border-warm-grey/10 text-warm-grey flex items-center justify-center gap-1"
                                    >
                                        <Music className="w-4 h-4" /> Add Song
                                    </Button>
                                )}
                            </div>
                            {(!selectedFile && !songTitle) && (
                                <p className="text-[10px] text-pink-500 font-bold text-center italic mt-1">
                                    * Stories require a photo, video, or song selection! 🎵
                                </p>
                            )}
                            <Button 
                                size="sm"
                                onClick={handleShareMoment}
                                disabled={creating || (!selectedFile && !songTitle)}
                                className="w-full bg-muted-rose hover:bg-muted-rose/90 text-white flex items-center justify-center gap-1 shadow-md shadow-muted-rose/10 py-5 text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Share Moment ౨ৎ"}
                            </Button>
                        </div>

                        <SongSearchModal
                            isOpen={isSongModalOpen}
                            onClose={() => setIsSongModalOpen(false)}
                            onSelect={(song) => {
                                setSongTitle(song.title);
                                setSongArtist(song.artist);
                                setSongLink(song.link);
                                setSongPreview(song.previewUrl);
                                setSongArtwork(song.artwork);
                                setShowSongInput(true);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Video Trimmer Modal */}
            {isTrimming && selectedFile && filePreview && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-md border border-warm-grey/10 flex flex-col gap-4 animate-fade-in-up text-left">
                        <div className="flex justify-between items-center pb-2 border-b border-warm-grey/5">
                            <h3 className="font-serif text-lg text-warm-cocoa flex items-center gap-2">
                                <Scissors className="w-5 h-5 text-pink-400 animate-pulse" /> Cut Down Video
                            </h3>
                            <button 
                                onClick={() => setIsTrimming(false)}
                                className="p-1 rounded-full hover:bg-stone-100 text-warm-grey/60"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Video Preview */}
                        <div className="relative aspect-video bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
                            <video 
                                ref={trimmerVideoRef}
                                src={filePreview}
                                controls={false}
                                autoPlay
                                loop
                                muted
                                playsInline
                                onTimeUpdate={() => {
                                    if (!trimmerVideoRef.current) return;
                                    const video = trimmerVideoRef.current;
                                    if (video.currentTime >= tempTrimEnd) {
                                        video.currentTime = tempTrimStart;
                                        video.play().catch(() => {});
                                    } else if (video.currentTime < tempTrimStart) {
                                        video.currentTime = tempTrimStart;
                                    }
                                }}
                                className="w-full h-full object-contain"
                            />
                            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-md text-[10px] font-mono">
                                {tempTrimStart.toFixed(1)}s - {tempTrimEnd.toFixed(1)}s ({(tempTrimEnd - tempTrimStart).toFixed(1)}s)
                            </div>
                        </div>

                        {/* Sliders Container */}
                        <div className="space-y-4">
                            {/* Start Time Slider */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-warm-cocoa">
                                    <span>Start Position</span>
                                    <span className="font-mono text-warm-grey/60">{tempTrimStart.toFixed(1)}s</span>
                                </div>
                                <input 
                                    type="range"
                                    min={0}
                                    max={Math.max(0, tempTrimEnd - 0.2)}
                                    step={0.05}
                                    value={tempTrimStart}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setTempTrimStart(val);
                                        if (trimmerVideoRef.current) {
                                            trimmerVideoRef.current.currentTime = val;
                                            trimmerVideoRef.current.pause();
                                        }
                                    }}
                                    className="w-full accent-pink-400 h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>

                            {/* End Time Slider */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-bold text-warm-cocoa">
                                    <span>End Position</span>
                                    <span className="font-mono text-warm-grey/60">{tempTrimEnd.toFixed(1)}s</span>
                                </div>
                                <input 
                                    type="range"
                                    min={tempTrimStart + 0.2}
                                    max={videoDuration || 0}
                                    step={0.05}
                                    value={tempTrimEnd}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        setTempTrimEnd(val);
                                        if (trimmerVideoRef.current) {
                                            trimmerVideoRef.current.currentTime = val;
                                            trimmerVideoRef.current.pause();
                                        }
                                    }}
                                    className="w-full accent-pink-400 h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-2 pt-2 border-t border-warm-grey/5">
                            <Button variant="ghost" size="sm" onClick={() => setIsTrimming(false)}>
                                Cancel
                            </Button>
                            <Button 
                                size="sm" 
                                onClick={() => {
                                    setTrimStart(tempTrimStart);
                                    setTrimEnd(tempTrimEnd);
                                    setIsTrimming(false);
                                }}
                                className="bg-pink-400 hover:bg-pink-500 text-white font-bold"
                            >
                                Apply Trim
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
