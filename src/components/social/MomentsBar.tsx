"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Upload, Loader2, Sparkles, Music, Scissors } from "lucide-react";
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

export function MomentsBar() {
    const [groupedMoments, setGroupedMoments] = useState<GroupedMoment[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

    // Modal view states
    const [selectedGroup, setSelectedGroup] = useState<GroupedMoment | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);

    // Modal create states
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const [caption, setCaption] = useState("");
    const [bgColor, setBgColor] = useState("rose");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
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

    // Mention State for story caption
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionResults, setMentionResults] = useState<{ id: string, username: string, first_name: string, avatar_url: string }[]>([]);
    const [isMentionOpen, setIsMentionOpen] = useState(false);
    const [cursorPosition, setCursorPosition] = useState<number | null>(null);
    const storyInputRef = useRef<HTMLInputElement>(null);

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

    const handleStoryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.slice(0, 100);
        const pos = e.target.selectionStart || 0;
        setCaption(value);
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

    const insertStoryMention = (username: string) => {
        if (!cursorPosition) return;
        const textBeforeCursor = caption.slice(0, cursorPosition);
        const match = textBeforeCursor.match(/(?:\s|^)@([\w.-]*)$/);

        if (match) {
            const matchIndex = match.index! + match[0].indexOf('@');
            const textAfterCursor = caption.slice(cursorPosition);
            const newText = caption.slice(0, matchIndex) + `@${username} ` + textAfterCursor;

            setCaption(newText.slice(0, 100));
            setMentionQuery(null);
            setIsMentionOpen(false);

            setTimeout(() => {
                storyInputRef.current?.focus();
            }, 50);
        }
    };

    useEffect(() => {
        loadCurrentUserAndMoments();
    }, []);

    const loadCurrentUserAndMoments = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("first_name, avatar_url, username")
                    .eq("id", user.id)
                    .single();
                setCurrentUserProfile(profile);
            }

            // Fetch moments from the last 24 hours
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: momentsData, error } = await supabase
                .from("moments")
                .select(`
                    id, media_url, caption, background_color, created_at, user_id,
                    song_title, song_artist, song_album_art, song_preview_url, song_link,
                    profiles!moments_user_id_fkey (first_name, username, avatar_url)
                `)
                .gt("created_at", twentyFourHoursAgo)
                .order("created_at", { ascending: true });

            if (error) throw error;

            if (momentsData) {
                // Group by user_id
                const groups: { [key: string]: Moment[] } = {};
                momentsData.forEach((m: any) => {
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

                setGroupedMoments(formattedGroups);
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
        if (!caption.trim() && !selectedFile) return;

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
                    caption: caption.trim() || null,
                    media_url: mediaUrl,
                    background_color: selectedFile ? 'default' : bgColor,
                    song_title: songTitle.trim() || null,
                    song_artist: songArtist.trim() || null,
                    song_album_art: songArtwork?.trim() || null,
                    song_preview_url: songPreview?.trim() || null,
                    song_link: songLink.trim() || null
                });

            if (insertError) throw insertError;

            // Reset states
            setCaption("");
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
            setMentionQuery(null);
            setIsMentionOpen(false);

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

    const myGroup = groupedMoments.find(g => g.user_id === currentUser?.id);
    const otherGroups = groupedMoments.filter(g => g.user_id !== currentUser?.id);

    if (loading && !currentUser) {
        return (
            <div className="flex gap-4 overflow-x-auto py-2 mb-6">
                {[1, 2, 3, 4].map(n => (
                    <div key={n} className="w-16 h-16 rounded-full bg-stone-100 animate-pulse shrink-0" />
                ))}
            </div>
        );
    }

    return (
        <div className="flex gap-4 overflow-x-auto py-3 px-2 mb-6 scrollbar-hide select-none border-b border-warm-grey/5">
            {/* My Moment Bubble */}
            <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer">
                <div className="relative">
                    {myGroup ? (
                        // If I have an active moment
                        <div 
                            onClick={() => openViewer(myGroup)}
                            className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-muted-rose to-sage-green shadow-md active:scale-95 transition-transform"
                        >
                            <div className="w-full h-full rounded-full border border-white overflow-hidden bg-white">
                                {currentUserProfile?.avatar_url ? (
                                    <img src={currentUserProfile.avatar_url} alt="My Moment" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-soft-blush text-warm-grey font-serif uppercase text-lg">
                                        {currentUserProfile?.first_name?.[0] || "Me"}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // If I do NOT have an active moment
                        <div 
                            onClick={() => setIsCreatorOpen(true)}
                            className="w-16 h-16 rounded-full border-2 border-dashed border-warm-grey/20 flex items-center justify-center bg-white/40 hover:border-muted-rose/40 hover:bg-white transition-all shadow-sm active:scale-95"
                        >
                            {currentUserProfile?.avatar_url ? (
                                <img src={currentUserProfile.avatar_url} alt="Me" className="w-full h-full rounded-full object-cover p-[2px]" />
                            ) : (
                                <span className="text-xl text-warm-grey/40 font-bold font-serif">+</span>
                            )}
                        </div>
                    )}

                    {/* Plus badge overlay */}
                    {!myGroup && (
                        <div 
                            onClick={() => setIsCreatorOpen(true)}
                            className="absolute bottom-0 right-0 w-5 h-5 bg-muted-rose text-white rounded-full flex items-center justify-center border border-white hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </div>
                    )}
                </div>
                <span className="text-[10px] font-bold text-warm-grey/60">Your Moment</span>
            </div>

            {/* Friend Moments Bubbles */}
            {otherGroups.map((group) => (
                <motion.div 
                    key={group.user_id}
                    onClick={() => openViewer(group)}
                    whileTap={{ scale: 0.92 }}
                    className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
                >
                    <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-muted-rose via-soft-blush to-sage-green shadow-md transition-transform">
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
                    <span className="text-[10px] font-bold text-warm-grey/70">{group.userName}</span>
                </motion.div>
            ))}

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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
                    <div className="bg-warm-paper rounded-3xl p-6 shadow-2xl w-full max-w-sm border border-white flex flex-col gap-4 animate-fade-in-up text-left">
                        <div className="flex justify-between items-center pb-2 border-b border-warm-grey/5">
                            <h3 className="font-serif text-lg text-warm-cocoa flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-muted-rose" /> Share a Moment
                            </h3>
                            <button 
                                onClick={() => {
                                    setIsCreatorOpen(false);
                                    setCaption("");
                                    setSelectedFile(null);
                                    setFilePreview(null);
                                    setMentionQuery(null);
                                    setIsMentionOpen(false);
                                }}
                                className="p-1 rounded-full hover:bg-stone-100 text-warm-grey/60"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* File preview or Text-only preview */}
                        <div className="relative aspect-[9/16] max-h-[300px] w-full rounded-2xl border border-warm-grey/10 overflow-hidden flex items-center justify-center shadow-inner">
                            {filePreview ? (
                                <>
                                    {selectedFile?.type.startsWith('video/') ? (
                                        <video src={filePreview} controls muted className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                                    )}
                                    <button 
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setFilePreview(null);
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                    {selectedFile?.type.startsWith('video/') && (
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setTempTrimStart(trimStart);
                                                setTempTrimEnd(trimEnd || videoDuration);
                                                setIsTrimming(true);
                                            }}
                                            className="absolute bottom-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors flex items-center justify-center z-10"
                                            title="Trim video"
                                        >
                                            <Scissors className="w-4 h-4" />
                                        </button>
                                    )}
                                    {selectedFile?.type.startsWith('video/') && (trimStart > 0 || trimEnd < videoDuration) && (
                                        <div className="absolute bottom-2 left-2 bg-pink-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md shadow-sm z-10">
                                            Trimmed
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className={`w-full h-full flex flex-col items-center justify-center p-6 transition-all duration-300 ${
                                    bgColor === 'rose' ? 'bg-muted-rose text-white' :
                                    bgColor === 'blue' ? 'bg-indigo-400 text-white' :
                                    bgColor === 'green' ? 'bg-sage-green text-warm-grey' :
                                    bgColor === 'orange' ? 'bg-orange-400 text-white' :
                                    bgColor === 'purple' ? 'bg-purple-400 text-white' :
                                    bgColor === 'yellow' ? 'bg-yellow-400 text-warm-grey' :
                                    'bg-white text-warm-grey'
                                }`}>
                                    <p className="font-serif text-lg leading-relaxed italic max-w-xs px-2 break-words">
                                        {caption.trim() ? `"${caption}"` : '"Be still..."'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Caption input */}
                        <div className="space-y-1 relative">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-warm-cocoa">Caption / Thought</label>
                            <input 
                                ref={storyInputRef}
                                type="text"
                                value={caption}
                                onChange={handleStoryInputChange}
                                placeholder="Type a cozy thought..."
                                className="w-full px-4 py-2.5 text-xs rounded-xl bg-white/50 border border-warm-grey/5 focus:outline-none text-warm-grey placeholder:text-warm-grey/30"
                            />
                            {/* Mention Autocomplete */}
                            {isMentionOpen && mentionResults.length > 0 && (
                                <div className="absolute bottom-full mb-2 left-0 w-48 bg-white rounded-xl shadow-lg border border-warm-grey/10 overflow-hidden z-50 animate-fade-in-up">
                                    {mentionResults.map((profile) => (
                                        <button
                                            type="button"
                                            key={profile.id}
                                            className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-stone-50 transition-colors"
                                            onClick={() => insertStoryMention(profile.username)}
                                        >
                                            <div className="w-6 h-6 rounded-full bg-stone-200 overflow-hidden">
                                                {profile.avatar_url ? (
                                                    <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="w-full h-full flex items-center justify-center text-[10px] font-bold text-warm-grey/40">
                                                        {profile.first_name?.[0]}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-warm-grey truncate">@{profile.username}</p>
                                                <p className="text-[10px] text-warm-grey/60 truncate">{profile.first_name}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* BG Color picker if text-only */}
                        {!selectedFile && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-warm-cocoa">Background Color</label>
                                <div className="flex gap-2">
                                    {['rose', 'blue', 'green', 'orange', 'purple', 'yellow'].map((color) => (
                                        <button 
                                            key={color}
                                            onClick={() => setBgColor(color)}
                                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                                                color === 'rose' ? 'bg-muted-rose' :
                                                color === 'blue' ? 'bg-indigo-400' :
                                                color === 'green' ? 'bg-sage-green' :
                                                color === 'orange' ? 'bg-orange-400' :
                                                color === 'purple' ? 'bg-purple-400' :
                                                'bg-yellow-400'
                                            } ${bgColor === color ? 'border-warm-grey scale-110' : 'border-transparent hover:scale-105'}`}
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
                            <Button 
                                size="sm"
                                onClick={handleShareMoment}
                                disabled={creating || (!caption.trim() && !selectedFile)}
                                className="w-full bg-muted-rose hover:bg-muted-rose/90 text-white flex items-center justify-center gap-1 shadow-md shadow-muted-rose/10 py-5 text-xs font-bold uppercase tracking-wider"
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
