"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, MessageCircle, Check, Clock, Shield, MoreHorizontal, X, Music, GraduationCap, Church, Trophy, Palette, Heart, Star, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDistanceToNow } from "date-fns";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StickyBoard } from "@/components/profile/StickyBoard";
import { ScrapbookGrid } from "@/components/profile/ScrapbookGrid";
import { SongPlayer } from "@/components/ui/SongPlayer";
import { RetroCassette } from "@/components/ui/RetroCassette";
import { VerseWallpaperModal } from "@/components/home/VerseWallpaperModal";
import { BadgeGrid } from "@/components/gamification/BadgeGrid";
import { useBadge } from "@/context/BadgeContext";
import { HeartHandshake } from "lucide-react";
import { MomentsBar } from "@/components/social/MomentsBar";
import { MomentModal } from "@/components/social/MomentModal";
import { AnimatePresence } from "framer-motion";
import { SongSearchModal } from "@/components/ui/SongSearchModal";

const COLOR_MAP: Record<string, string> = {
    'rose': 'bg-muted-rose/10 text-muted-rose border-muted-rose/20',
    'blue': 'bg-indigo-50 text-indigo-600 border-indigo-100',
    'green': 'bg-emerald-50 text-emerald-600 border-emerald-100',
    'orange': 'bg-orange-50 text-orange-600 border-orange-100',
    'purple': 'bg-purple-50 text-purple-600 border-purple-100',
    'yellow': 'bg-yellow-50 text-yellow-600 border-yellow-100',
};

function getBadgeStyle(colorName: string | null | undefined) {
    const color = colorName || 'rose';
    return COLOR_MAP[color] || COLOR_MAP['rose'];
}

const parseMomentConfig = (bgColorField: string | null) => {
    if (!bgColorField) return { color: 'rose', frame: 'none', highlightName: null, coverUrl: null };
    const parts = bgColorField.split('|');
    const color = parts[0] || 'rose';
    const frame = parts[1] || 'none';
    
    let highlightName: string | null = null;
    let coverUrl: string | null = null;
    
    parts.forEach(part => {
        if (part.startsWith('highlight:')) {
            highlightName = part.substring('highlight:'.length);
        } else if (part.startsWith('cover:')) {
            coverUrl = part.substring('cover:'.length);
        } else if (part === 'highlight') {
            highlightName = 'My Highlight';
        }
    });
    
    return { color, frame, highlightName, coverUrl };
};

type Profile = {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    biography: string;
    created_at: string;
    streak_count: number;
    points?: number;
    song_title?: string | null;
    song_artist?: string | null;
    song_link?: string | null;
    song_preview_url?: string | null;
    song_album_art?: string | null;
    song_cassette_color?: string | null;
    is_friends_public?: boolean;
    school?: string | null;
    school_color?: string | null;
    church?: string | null;
    church_color?: string | null;
    sport?: string | null;
    sport_color?: string | null;
    hobby?: string | null;
    hobby_color?: string | null;
    fav_verse?: string | null;
    fav_verse_color?: string | null;
};

export default function ProfilePage() {
    const params = useParams();
    const usernameParam = Array.isArray(params.username) ? params.username[0] : params.username;
    const username = decodeURIComponent(usernameParam || "");

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'accepted' | 'self'>('none');
    const [requests, setRequests] = useState<any[]>([]);
    const [friends, setFriends] = useState<any[]>([]);
    const [recentPosts, setRecentPosts] = useState<any[]>([]);
    const [activeMoments, setActiveMoments] = useState<any[]>([]);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [highlightAlbums, setHighlightAlbums] = useState<any[]>([]);
    const [selectedAlbumMoments, setSelectedAlbumMoments] = useState<any[] | null>(null);
    const [isAlbumViewerOpen, setIsAlbumViewerOpen] = useState(false);
    const [favVerseText, setFavVerseText] = useState<string | null>(null);
    const [loadingVerse, setLoadingVerse] = useState(false);
    const [viewedMomentIds, setViewedMomentIds] = useState<Set<string>>(new Set());
    const [isAnthemPlaying, setIsAnthemPlaying] = useState(false);
    const [isProfileWallpaperOpen, setIsProfileWallpaperOpen] = useState(false);

    // Selahly Notes Thought Bubble States
    const [activeNote, setActiveNote] = useState<any | null>(null);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [isNoteReplyModalOpen, setIsNoteReplyModalOpen] = useState(false);
    const [noteContent, setNoteContent] = useState("");
    const [replyContent, setReplyContent] = useState("");
    const [songTitle, setSongTitle] = useState("");
    const [songArtist, setSongArtist] = useState("");
    const [songLink, setSongLink] = useState("");
    const [songPreview, setSongPreview] = useState("");
    const [songArtwork, setSongArtwork] = useState("");
    const [showSongInput, setShowSongInput] = useState(false);
    const [isSongModalOpen, setIsSongModalOpen] = useState(false);

    const { triggerBadge } = useBadge();
    const supabase = createClient();

    const formatBiography = (bioText: string) => {
        if (!bioText) return "No biography yet. Just a sister in Christ walking the journey! ✨";
        
        const mentionRegex = /@([\w.-]+)/g;
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionRegex.exec(bioText)) !== null) {
            const index = match.index;
            const fullMatch = match[0];
            const username = match[1];

            if (index > lastIndex) {
                parts.push(bioText.substring(lastIndex, index));
            }

            parts.push(
                <Link
                    key={index}
                    href={`/profile/${username}`}
                    className="text-muted-rose hover:underline font-bold transition-all"
                >
                    {fullMatch}
                </Link>
            );

            lastIndex = mentionRegex.lastIndex;
        }

        if (lastIndex < bioText.length) {
            parts.push(bioText.substring(lastIndex));
        }

        return parts;
    };

    const loadMoments = async (prof: Profile) => {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: userMoments } = await supabase
            .from("moments")
            .select(`
                id, media_url, caption, background_color, created_at, user_id,
                song_title, song_artist, song_album_art, song_preview_url, song_link
            `)
            .eq("user_id", prof.id)
            .or(`created_at.gt.${twentyFourHoursAgo},background_color.like.%|highlight%`)
            .order("created_at", { ascending: true });

        if (userMoments) {
            const active = userMoments.filter(m => new Date(m.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000) && !m.background_color?.includes('|archived')).map((m: any) => ({
                ...m,
                profiles: {
                    first_name: prof.first_name,
                    username: prof.username,
                    avatar_url: prof.avatar_url
                }
            }));
            setActiveMoments(active);

            // Fetch views for current user on these moments
            const viewedSet = new Set<string>();
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser && userMoments.length > 0) {
                const momentIds = userMoments.map((m: any) => m.id);
                const { data: viewsData } = await supabase
                    .from("moment_views")
                    .select("moment_id")
                    .eq("user_id", authUser.id)
                    .in("moment_id", momentIds);
                if (viewsData) {
                    viewsData.forEach((v: any) => viewedSet.add(v.moment_id));
                }
            }
            setViewedMomentIds(viewedSet);

            const groups: Record<string, { name: string; coverUrl: string | null; moments: any[] }> = {};
            userMoments.forEach((m: any) => {
                const config = parseMomentConfig(m.background_color);
                if (config.highlightName) {
                    if (!groups[config.highlightName]) {
                        groups[config.highlightName] = {
                            name: config.highlightName,
                            coverUrl: config.coverUrl,
                            moments: []
                        };
                    }
                    const momentWithProfile = {
                        ...m,
                        profiles: {
                            first_name: prof.first_name,
                            username: prof.username,
                            avatar_url: prof.avatar_url
                        }
                    };
                    groups[config.highlightName].moments.push(momentWithProfile);
                    if (config.coverUrl) {
                        groups[config.highlightName].coverUrl = config.coverUrl;
                    }
                }
            });
            setHighlightAlbums(Object.values(groups));
        }
    };

    // 1. Fetch Profile & User
    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            let query = supabase.from("profiles").select("*");
            if (username === "me" && user) {
                query = query.eq("id", user.id);
            } else {
                query = query.eq("username", username);
            }

            const { data: profileData } = await query.single();

            if (profileData) {
                // Check and fix streak display logic
                if (profileData.last_journal_date) {
                    const lastDate = new Date(profileData.last_journal_date);
                    const today = new Date();
                    
                    const getLocalDayDifference = (d1: Date, d2: Date) => {
                        const date1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
                        const date2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
                        return Math.round((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
                    };

                    if (getLocalDayDifference(lastDate, today) > 1) {
                        profileData.streak_count = 0;
                    }
                }
                setProfile(profileData);

                // 1. Check Friend Status (if not self)
                if (user && profileData.id !== user.id) {
                    const { data: friendship } = await supabase
                        .from("friendships")
                        .select("*")
                        .or(`and(user_id_1.eq.${user.id},user_id_2.eq.${profileData.id}),and(user_id_1.eq.${profileData.id},user_id_2.eq.${user.id})`)
                        .maybeSingle();

                    if (friendship) {
                        setFriendStatus(friendship.status as any);
                    } else {
                        setFriendStatus('none');
                    }
                } else if (user && profileData.id === user.id) {
                    setFriendStatus('self');

                    // IF SELF: Fetch Pending Requests
                    const { data: pending } = await supabase
                        .from("friendships")
                        .select(`
                            *,
                            requester:profiles!friendships_user_id_1_fkey(username, first_name, last_name, avatar_url)
                        `)
                        .eq("user_id_2", user.id)
                        .eq("status", "pending");

                    if (pending) setRequests(pending);
                }

                // 2. Fetch Friends List (for everyone to see if trusted, but let's just show it)
                // Fetch accepted friendships where user is either 1 or 2
                const { data: friendshipsData } = await supabase
                    .from("friendships")
                    .select(`
                        *,
                        user1:profiles!friendships_user_id_1_fkey(username, first_name, last_name, avatar_url),
                        user2:profiles!friendships_user_id_2_fkey(username, first_name, last_name, avatar_url)
                    `)
                    .or(`user_id_1.eq.${profileData.id},user_id_2.eq.${profileData.id}`)
                    .eq("status", "accepted");

                if (friendshipsData) {
                    // Map to get the "other" person
                    const friendList = friendshipsData.map(f => {
                        if (f.user_id_1 === profileData.id) return f.user2;
                        return f.user1;
                    });
                    setFriends(friendList);
                }

                // 3. Fetch Recent Posts
                const { data: postsData } = await supabase
                    .from("posts")
                    .select("*")
                    .eq("user_id", profileData.id)
                    .order("created_at", { ascending: false })
                    .limit(5);

                if (postsData) {
                    setRecentPosts(postsData);
                }

                // 4. Fetch Active Moments & Highlights
                await loadMoments(profileData);

                // 5. Fetch Active Note for this profile
                const { data: noteData } = await supabase
                    .from('notes')
                    .select('*')
                    .eq('user_id', profileData.id)
                    .gt('expires_at', new Date().toISOString())
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                
                setActiveNote(noteData || null);
            }
            setLoading(false);
        };

        fetchData();
    }, [username]);

    // Fetch Bible verse scripture text for profile card
    useEffect(() => {
        if (!profile?.fav_verse) {
            setFavVerseText(null);
            return;
        }

        const fetchProfileVerse = async () => {
            setLoadingVerse(true);
            try {
                const res = await fetch(`https://bible-api.com/${encodeURIComponent(profile.fav_verse!)}?translation=kjv`);
                if (res.ok) {
                    const data = await res.json();
                    setFavVerseText(data.text || null);
                }
            } catch (err) {
                console.error("Error loading profile fav verse:", err);
            } finally {
                setLoadingVerse(false);
            }
        };

        fetchProfileVerse();
    }, [profile?.fav_verse]);

    // Handlers
    const handleAddFriend = async () => {
        if (!currentUser || !profile) return;
        setFriendStatus('pending');
        const { error } = await supabase.from("friendships").insert({
            user_id_1: currentUser.id,
            user_id_2: profile.id,
            status: 'pending'
        });
        if (error) {
            setFriendStatus('none');
            alert("Could not send request.");
        }
    };

    const handleAccept = async (requesterId: string) => {
        const { error } = await supabase
            .from("friendships")
            .update({ status: 'accepted' })
            .eq("user_id_1", requesterId) // Sender
            .eq("user_id_2", currentUser.id); // Me

        if (!error) {
            // Remove from requests
            const req = requests.find(r => r.user_id_1 === requesterId);
            setRequests(prev => prev.filter(r => r.user_id_1 !== requesterId));

            // Add to friends list immediately
            if (req && req.requester) {
                setFriends(prev => {
                    const newFriends = [...prev, req.requester];

                    // Award Social Butterfly badge instantly if they reach 5 friends!
                    if (newFriends.length === 5) {
                        supabase.rpc("award_badge", {
                            p_user_id: currentUser.id,
                            p_badge_name: 'Social Butterfly'
                        }).then(() => {
                            triggerBadge('Social Butterfly', 'You made 5 friends! You are a social butterfly! 🦋', <HeartHandshake className="w-12 h-12 text-blue-400" />);
                        });
                    }

                    return newFriends;
                });
            } else {
                // Fallback reload if data complex
                window.location.reload();
            }
        }
    };

    const handleDecline = async (requesterId: string) => {
        const { error } = await supabase
            .from("friendships")
            .delete()
            .eq("user_id_1", requesterId)
            .eq("user_id_2", currentUser.id);

        if (!error) {
            setRequests(prev => prev.filter(r => r.user_id_1 !== requesterId));
        }
    };

    // Note handlers
    const handleOpenNoteModal = () => {
        if (activeNote) {
            setNoteContent(activeNote.content || "");
            setSongTitle(activeNote.song_title || "");
            setSongArtist(activeNote.song_artist || "");
            setSongLink(activeNote.song_link || "");
            setSongPreview(activeNote.song_preview_url || "");
            setSongArtwork(activeNote.song_album_art || "");
            setShowSongInput(!!activeNote.song_title);
        } else {
            setNoteContent("");
            setSongTitle("");
            setSongArtist("");
            setSongLink("");
            setSongPreview("");
            setSongArtwork("");
            setShowSongInput(false);
        }
        setIsNoteModalOpen(true);
    };

    const handleSaveNote = async () => {
        if (!currentUser) return;
        const noteData = {
            user_id: currentUser.id,
            content: noteContent,
            song_title: songTitle.trim() || null,
            song_artist: songArtist.trim() || null,
            song_link: songLink.trim() || null,
            song_preview_url: songPreview.trim() || null,
            song_album_art: songArtwork.trim() || null,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        let error;
        if (activeNote) {
            const { data, error: updateError } = await supabase
                .from('notes')
                .update({
                    ...noteData,
                    created_at: new Date().toISOString()
                })
                .eq('id', activeNote.id)
                .select()
                .single();
            error = updateError;
            if (!error && data) {
                setActiveNote(data);
            }
        } else {
            const { data, error: insertError } = await supabase
                .from('notes')
                .insert(noteData)
                .select()
                .single();
            error = insertError;
            if (!error && data) {
                setActiveNote(data);
            }
        }

        if (error) {
            console.error("Error saving note:", error);
            alert("Could not save note.");
        } else {
            setIsNoteModalOpen(false);
        }
    };

    const handleDeleteNote = async () => {
        if (!activeNote) return;
        const { error } = await supabase.from('notes').delete().eq('id', activeNote.id);
        if (error) {
            console.error("Error deleting note:", error);
            alert("Could not delete note.");
        } else {
            setActiveNote(null);
            setIsNoteModalOpen(false);
        }
    };

    const handleSendReply = async () => {
        if (!currentUser || !profile || !activeNote || !replyContent.trim()) return;

        const { error } = await supabase.from('direct_messages').insert({
            sender_id: currentUser.id,
            receiver_id: profile.id,
            content: `Replying to note: "${activeNote.content}"\n\n${replyContent}`,
            is_edited: false
        });

        if (error) {
            console.error("Error sending reply:", error);
            alert("Failed to send reply.");
        } else {
            setReplyContent("");
            setIsNoteReplyModalOpen(false);
            alert("Reply sent!");
        }
    };




    if (loading) return (
        <div className="min-h-screen bg-warm-paper flex items-center justify-center text-warm-grey animate-pulse">
            Finding Sister...
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen bg-warm-paper font-sans">
            <Navbar />
            <div className="container mx-auto px-4 pt-32 text-center text-warm-grey">
                <h1 className="text-2xl font-serif">User not found</h1>
            </div>
        </div>
    );

    const hasSeenAllActive = activeMoments.length > 0 && activeMoments.every(m => viewedMomentIds.has(m.id));
    const canViewFriends = friendStatus === 'accepted' || friendStatus === 'self' || profile.is_friends_public;

    return (
        <div className="min-h-screen bg-warm-paper font-sans">
            <Navbar />

            <div className="h-64 bg-gradient-to-b from-stone-200 to-warm-paper relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            </div>

            <main className="container mx-auto px-4 pb-20 max-w-4xl -mt-20 relative">

                {/* Profile Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-8 shadow-sm animate-fade-in-up mb-8">
                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                        {/* Avatar Wrapper with Thought Bubble */}
                        <div className="relative flex-shrink-0 mx-auto md:mx-0">
                            {/* Active Note Thought Bubble */}
                            {activeNote ? (
                                <div 
                                    onClick={() => {
                                        if (friendStatus === 'self') {
                                            handleOpenNoteModal();
                                        } else {
                                            setIsNoteReplyModalOpen(true);
                                        }
                                    }}
                                    className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white border border-warm-grey/10 rounded-2xl p-2.5 shadow-md text-[10px] leading-tight text-center max-w-[130px] min-w-[80px] z-20 cursor-pointer hover:scale-105 transition-transform"
                                >
                                    <div className="line-clamp-2 text-warm-grey/90 font-medium">
                                        {activeNote.song_title && (
                                            <span className="block text-[8px] text-warm-cocoa font-bold truncate max-w-full mb-0.5">
                                                🎵 {activeNote.song_title}
                                            </span>
                                        )}
                                        {activeNote.content}
                                    </div>
                                    {/* Speech bubble tail */}
                                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                                        <div className="w-2 h-2 bg-white border-b border-r border-warm-grey/10 rotate-45"></div>
                                    </div>
                                </div>
                            ) : (
                                friendStatus === 'self' && (
                                    <div 
                                        onClick={handleOpenNoteModal}
                                        className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white/90 hover:bg-white border border-dashed border-warm-grey/20 hover:border-warm-grey/40 rounded-full px-3 py-1 shadow-sm text-[9px] text-warm-grey/50 hover:text-warm-grey font-medium z-20 cursor-pointer hover:scale-105 transition-transform flex items-center gap-1"
                                        title="Add a Selahly note"
                                    >
                                        <span>💭 Note</span>
                                        <span className="font-bold text-xs">+</span>
                                    </div>
                                )
                            )}

                            {/* Avatar Circle Container */}
                            {activeMoments.length > 0 ? (
                                <div 
                                    onClick={() => setIsViewerOpen(true)}
                                    className={`w-32 h-32 md:w-40 md:h-40 rounded-full p-[4px] bg-gradient-to-tr ${
                                        hasSeenAllActive
                                            ? "from-[#D4C3B3] via-[#EBE3DB] to-[#D4C3B3] ring-4 ring-[#F5EFEB] shadow-[0_0_20px_rgba(212,195,179,0.7)]"
                                            : "from-pink-400 via-pink-300 to-pink-400 ring-4 ring-pink-100 shadow-[0_0_20px_rgba(244,143,177,0.8)]"
                                    } cursor-pointer active:scale-95 hover:scale-[1.02] transition-all duration-200`}
                                    title="Watch moments"
                                >
                                    <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-stone-100">
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover object-center" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-warm-grey/20 text-5xl font-serif animate-pulse">
                                                {(profile.first_name?.[0] || "")}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-stone-100 border-4 border-white shadow-lg overflow-hidden">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover object-center" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-warm-grey/20 text-5xl font-serif">
                                            {(profile.first_name?.[0] || "")}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h1 className="font-serif text-3xl text-warm-cocoa">
                                        {profile.first_name} {profile.last_name}
                                    </h1>
                                    <p className="text-warm-grey/60 font-medium">@{profile.username}</p>
                                </div>

                                <div className="flex items-center gap-2 justify-center md:justify-end">
                                    {friendStatus === 'self' ? (
                                        <Button variant="outline" className="border-warm-grey/20 text-warm-grey hover:bg-stone-100" onClick={() => window.location.href = '/settings'}>
                                            Edit Profile
                                        </Button>
                                    ) : (
                                        <>
                                            {friendStatus === 'none' && (
                                                <Button onClick={handleAddFriend} className="bg-muted-rose text-white hover:bg-muted-rose/90 shadow-md shadow-muted-rose/20">
                                                    <UserPlus className="w-4 h-4 mr-2" /> Add Friend
                                                </Button>
                                            )}
                                            {friendStatus === 'pending' && (
                                                <Button disabled className="bg-stone-200 text-warm-grey cursor-default">
                                                    <Clock className="w-4 h-4 mr-2" /> Requested
                                                </Button>
                                            )}
                                            {friendStatus === 'accepted' && (
                                                <Button variant="outline" className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100">
                                                    <Check className="w-4 h-4 mr-2" /> Friends
                                                </Button>
                                            )}

                                            <Button
                                                variant="outline"
                                                className="border-warm-grey/20 text-warm-grey hover:bg-stone-100"
                                                onClick={() => window.location.href = `/messages/${profile.id}`}
                                            >
                                                <MessageCircle className="w-4 h-4 mr-2" /> Message
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <p className="text-warm-grey leading-relaxed max-w-2xl mb-6">
                                {formatBiography(profile.biography)}
                            </p>

                            {/* Anthem Section */}
                            {(profile.song_title || (currentUser?.id === profile.id)) && (
                                <div className="mb-6 inline-block">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xs font-bold text-warm-grey/40 uppercase tracking-widest flex items-center gap-1">
                                            <Music className="w-3 h-3" /> My Anthem
                                        </h3>

                                    </div>

                                    {profile.song_title ? (
                                        <RetroCassette
                                            title={profile.song_title}
                                            artist={profile.song_artist || "Unknown Artist"}
                                            previewUrl={profile.song_preview_url}
                                            color={profile.song_cassette_color || "rose"}
                                        />
                                    ) : (
                                        // Only shown to owner if empty
                                        profile.id === currentUser?.id && (
                                            <Link
                                                href="/settings"
                                                className="text-xs text-warm-grey/40 italic hover:text-muted-rose"
                                            >
                                                + Add your anthem song
                                            </Link>
                                        )
                                    )}
                                </div>
                            )}

                            {/* Extended Bio Fields */}
                            <div className="flex flex-wrap gap-3 mb-6">
                                {profile.school && (
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-sm ${getBadgeStyle(profile.school_color)}`} title="My School">
                                        <GraduationCap className="w-3.5 h-3.5" />
                                        {profile.school}
                                    </div>
                                )}
                                {profile.church && (
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-sm ${getBadgeStyle(profile.church_color)}`} title="My Church">
                                        <Church className="w-3.5 h-3.5" />
                                        {profile.church}
                                    </div>
                                )}
                                {profile.sport && (
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-sm ${getBadgeStyle(profile.sport_color)}`} title="My Sport">
                                        <Trophy className="w-3.5 h-3.5" />
                                        {profile.sport}
                                    </div>
                                )}
                                {profile.hobby && (
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-sm ${getBadgeStyle(profile.hobby_color)}`} title="My Hobby">
                                        <Palette className="w-3.5 h-3.5" />
                                        {profile.hobby}
                                    </div>
                                )}
                            </div>

                            {/* Beautiful Verse Card */}
                            {profile.fav_verse && (
                                <>
                                    <div className={`p-4 rounded-2xl border mb-6 text-left relative overflow-hidden backdrop-blur-sm ${getBadgeStyle(profile.fav_verse_color)} shadow-sm`}>
                                        <div className="flex items-center justify-between mb-1.5 opacity-85">
                                            <div className="flex items-center gap-2">
                                                <Heart className="w-3.5 h-3.5 fill-current" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">Favorite Verse</span>
                                            </div>
                                            {favVerseText && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsProfileWallpaperOpen(true)}
                                                    className="text-[9px] font-bold uppercase tracking-wider bg-white/20 hover:bg-white/40 px-2 py-0.5 rounded transition-all flex items-center gap-1 z-10"
                                                    title="Create Wallpaper card"
                                                >
                                                    <span>✨</span> Wallpaper
                                                </button>
                                            )}
                                        </div>
                                        {loadingVerse ? (
                                            <p className="text-xs italic opacity-75">Loading scripture...</p>
                                        ) : favVerseText ? (
                                            <div className="space-y-1">
                                                <p className="font-serif italic text-sm leading-relaxed text-current">"{favVerseText.trim()}"</p>
                                                <p className="text-[10px] font-bold text-right opacity-90">— {profile.fav_verse} (KJV)</p>
                                            </div>
                                        ) : (
                                            <p className="text-xs font-serif italic text-sm">{profile.fav_verse}</p>
                                        )}
                                    </div>

                                    {favVerseText && (
                                        <VerseWallpaperModal
                                            isOpen={isProfileWallpaperOpen}
                                            onClose={() => setIsProfileWallpaperOpen(false)}
                                            verseText={favVerseText}
                                            verseReference={profile.fav_verse}
                                        />
                                    )}
                                </>
                            )}

                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                <div className="px-4 py-2 rounded-2xl bg-stone-50 border border-warm-grey/5 flex items-center gap-2 text-xs font-medium text-warm-grey">
                                    <span className="text-orange-400">🔥</span> {profile.streak_count || 0} Day Streak
                                </div>
                                <div className="px-4 py-2 rounded-2xl bg-stone-50 border border-warm-grey/5 flex items-center gap-2 text-xs font-medium text-warm-grey">
                                    <span className="text-amber-500">✨</span> {profile.points || 0} pts
                                </div>
                                <div className="px-4 py-2 rounded-2xl bg-stone-50 border border-warm-grey/5 flex items-center gap-2 text-xs font-medium text-warm-grey">
                                    <Clock className="w-3 h-3 text-warm-grey/40" /> Joined {formatDistanceToNow(new Date(profile.created_at || new Date()), { addSuffix: true })}
                                </div>
                            </div>

                            {/* Highlights Row under Stats */}
                            {highlightAlbums.length > 0 && (
                                <div className="mt-6 border-t border-stone-100 pt-5 w-full">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-warm-grey/40 mb-3 flex items-center gap-1 font-sans">
                                        <Star className="w-3.5 h-3.5 fill-pink-400 text-pink-400" /> Highlighted Moments
                                    </h3>
                                    <div className="flex gap-4 overflow-x-auto py-1 scrollbar-hide">
                                        {highlightAlbums.map((album) => (
                                            <div
                                                key={album.name}
                                                onClick={() => {
                                                    setSelectedAlbumMoments(album.moments);
                                                    setIsAlbumViewerOpen(true);
                                                }}
                                                className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                                            >
                                                <div className="w-14 h-14 rounded-full p-[2px] bg-stone-100 border border-warm-grey/10 transition-transform group-hover:scale-105">
                                                    <div className="w-full h-full rounded-full border border-white overflow-hidden bg-white flex items-center justify-center">
                                                        {album.coverUrl ? (
                                                            <img src={album.coverUrl} alt={album.name} className="w-full h-full object-cover animate-fade-in" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center bg-soft-blush text-muted-rose font-serif text-lg font-bold">
                                                                {album.name[0]}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="text-[9px] font-bold text-warm-grey/65 max-w-[64px] truncate text-center font-sans">
                                                    {album.name}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Friend Requests Section */}
                {
                    friendStatus === 'self' && requests.length > 0 && (
                        <div className="mb-8">
                            <div className="bg-gradient-to-r from-soft-blush/20 to-white p-6 rounded-3xl border border-soft-blush/20">
                                <h3 className="font-serif text-lg text-warm-cocoa mb-4 flex items-center gap-2">
                                    <span className="bg-muted-rose text-white text-[10px] px-2 py-0.5 rounded-full">{requests.length}</span>
                                    Friend Requests
                                </h3>
                                <div className="space-y-3">
                                    {requests.map(req => (
                                        <div key={req.user_id_1} className="bg-white p-4 rounded-xl flex items-center justify-between shadow-sm">
                                            <Link href={`/profile/${req.requester.username}`} className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden">
                                                    {req.requester.avatar_url ? (
                                                        <img src={req.requester.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="w-full h-full flex items-center justify-center text-warm-grey">{req.requester.first_name[0]}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-warm-grey text-sm">{req.requester.first_name} {req.requester.last_name}</p>
                                                    <p className="text-xs text-warm-grey/40">@{req.requester.username}</p>
                                                </div>
                                            </Link>
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" onClick={() => handleAccept(req.user_id_1)} className="bg-muted-rose text-white hover:bg-muted-rose/90 rounded-full text-xs px-4">
                                                    Accept
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleDecline(req.user_id_1)} className="text-warm-grey/40 hover:text-red-400 rounded-full w-8 h-8 p-0">
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Moments Bar (for self or accepted friends) */}
                {(friendStatus === 'self' || friendStatus === 'accepted') && (
                    <div className="mb-8 bg-white/60 p-4 rounded-3xl border border-white">
                        <MomentsBar profileUserId={profile.id} isOwner={friendStatus === 'self'} />
                    </div>
                )}

                {/* Sticky Board */}
                <div className="mb-12">
                    <StickyBoard
                        profileId={profile.id}
                        isOwner={currentUser?.id === profile.id}
                        viewerId={currentUser?.id}
                    />
                </div>

                {/* Badge Grid (Stickers) */}
                <div className="mb-12 bg-white/60 p-6 rounded-3xl border border-white">
                    <BadgeGrid userId={profile.id} />
                </div>

                {/* Content Tabs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Friends List */}
                    <div className="md:col-span-1">
                        <div className="bg-white/60 p-6 rounded-3xl border border-white h-full">
                            <h3 className="font-serif text-lg text-warm-cocoa mb-4">Friends ({canViewFriends ? friends.length : "?"})</h3>
                            {canViewFriends ? (
                                friends.length > 0 ? (
                                    <div className="space-y-3">
                                        {friends.map(friend => (
                                            <Link href={`/profile/${friend.username}`} key={friend.username} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl transition-colors">
                                                <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden">
                                                    {friend.avatar_url ? (
                                                        <img src={friend.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="w-full h-full flex items-center justify-center text-warm-grey text-xs">
                                                            {(friend.first_name?.[0] || "")}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-warm-grey text-sm truncate">{friend.first_name} {friend.last_name}</p>
                                                    <p className="text-xs text-warm-grey/40 truncate">@{friend.username}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-warm-grey/40 text-sm italic">
                                        No friends added yet.
                                    </div>
                                )
                            ) : (
                                <div className="text-center py-8 text-warm-grey/40 text-sm italic">
                                    Friend list private.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="md:col-span-2">
                        <div className="bg-white/60 p-6 rounded-3xl border border-white min-h-[200px]">
                            <h3 className="font-serif text-lg text-warm-cocoa mb-4">Recent Activity</h3>

                            {loading ? (
                                <div className="text-center py-12 text-warm-grey/40 text-sm animate-pulse">
                                    Loading activity...
                                </div>
                            ) : recentPosts.length === 0 ? (
                                <div className="text-center py-12 text-warm-grey/40 text-sm">
                                    No public activity to show.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentPosts.map((post) => (
                                        <div key={post.id} className="bg-white p-4 rounded-2xl shadow-sm border border-warm-grey/5 flex gap-4">
                                            {post.image_url && (
                                                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-stone-100">
                                                    <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-warm-grey text-sm mb-2 line-clamp-3">{post.caption}</p>
                                                <p className="text-xs text-warm-grey/40 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scrapbook Section */}
                <div className="mt-12 border-t border-warm-grey/10 pt-12">
                    <ScrapbookGrid
                        userId={profile.id}
                        username={profile.username}
                        isOwner={currentUser?.id === profile.id}
                    />
                </div>

                {/* Moments Viewer Modal */}
                <AnimatePresence>
                    {isViewerOpen && activeMoments.length > 0 && (
                        <MomentModal 
                            isOpen={isViewerOpen}
                            onClose={() => {
                                setIsViewerOpen(false);
                                loadMoments(profile);
                            }}
                            moments={activeMoments}
                            userName={profile.first_name}
                            userAvatar={profile.avatar_url}
                            currentUserId={currentUser?.id}
                            onMomentDeleted={async () => {
                                await loadMoments(profile);
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Album Viewer Modal */}
                <AnimatePresence>
                    {isAlbumViewerOpen && selectedAlbumMoments && (
                        <MomentModal 
                            isOpen={isAlbumViewerOpen}
                            onClose={() => {
                                setIsAlbumViewerOpen(false);
                                setSelectedAlbumMoments(null);
                            }}
                            moments={selectedAlbumMoments}
                            userName={profile.first_name}
                            userAvatar={profile.avatar_url}
                            currentUserId={currentUser?.id}
                            onMomentDeleted={async () => {
                                await loadMoments(profile);
                            }}
                        />
                    )}
                </AnimatePresence>

                {/* Note Creation / Editing Modal */}
                {isNoteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={(e) => {
                        if (e.target === e.currentTarget) setIsNoteModalOpen(false);
                    }}>
                        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-serif text-lg text-warm-cocoa">
                                    {activeNote ? "Update Your Note" : "New Selahly Note"}
                                </h3>
                                {activeNote && (
                                    <button 
                                        onClick={handleDeleteNote}
                                        className="text-xs text-red-400 hover:underline"
                                    >
                                        Delete Note
                                    </button>
                                )}
                            </div>
                            <textarea
                                value={noteContent}
                                onChange={(e) => setNoteContent(e.target.value.slice(0, 60))}
                                placeholder="Share a quick thought... (expires in 24h)"
                                className="w-full bg-gray-50 border-none rounded-xl p-4 text-sm focus:ring-1 focus:ring-warm-cocoa/20 mb-2 h-28 resize-none"
                                maxLength={60}
                            />
                            <div className="text-right text-[10px] text-warm-grey/40 mb-4">
                                {noteContent.length}/60 characters
                            </div>

                            {/* Song Selection */}
                            <div className="mb-4">
                                {!showSongInput ? (
                                    <button
                                        onClick={() => setIsSongModalOpen(true)}
                                        className="text-xs text-warm-grey/60 flex items-center gap-2 hover:text-warm-cocoa transition-colors"
                                    >
                                        <Music className="w-3.5 h-3.5" /> Add Song
                                    </button>
                                ) : (
                                    <div className="bg-stone-50 p-3 rounded-xl border border-warm-grey/5 relative">
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
                                )}
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

                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="ghost" size="sm" onClick={() => setIsNoteModalOpen(false)}>Cancel</Button>
                                <Button size="sm" onClick={handleSaveNote} disabled={!noteContent.trim() && !songTitle}>
                                    {activeNote ? "Update" : "Share"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Note Reply Modal */}
                {isNoteReplyModalOpen && activeNote && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4" onClick={(e) => {
                        if (e.target === e.currentTarget) setIsNoteReplyModalOpen(false);
                    }}>
                        <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden border border-warm-grey/10">
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-warm-grey/40 font-bold">
                                            {profile.first_name?.[0]}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-serif text-lg leading-none text-warm-cocoa">{profile.first_name}</h3>
                                    <p className="text-[10px] text-warm-grey/60">@{profile.username}</p>
                                </div>
                            </div>

                            <div className="bg-soft-blush/10 border border-soft-blush/20 rounded-2xl p-4 text-center mb-6 relative">
                                <p className="text-warm-grey/90 italic font-medium leading-relaxed">"{activeNote.content}"</p>
                                {activeNote.song_title && (
                                    <div className="mt-4 pt-4 border-t border-soft-blush/20">
                                        <div className="flex items-center gap-3 bg-white/60 p-2 rounded-xl">
                                            {activeNote.song_album_art ? (
                                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                                                    <img src={activeNote.song_album_art} alt="Cover" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center shrink-0">
                                                    <Music className="w-5 h-5 text-warm-grey/40" />
                                                </div>
                                            )}

                                            <div className="flex-1 min-w-0 text-left">
                                                <p className="font-bold text-warm-grey text-xs truncate">{activeNote.song_title}</p>
                                                <p className="text-[10px] text-warm-grey/60 truncate">{activeNote.song_artist}</p>
                                            </div>

                                            {activeNote.song_preview_url && (
                                                <SongPlayer previewUrl={activeNote.song_preview_url} />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-warm-grey/60 mb-2 block uppercase tracking-wider font-sans">Reply directly</label>
                                <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder={`Message ${profile.first_name}...`}
                                    className="w-full bg-gray-50 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-warm-cocoa/20 mb-3 h-20 resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setIsNoteReplyModalOpen(false)}>Close</Button>
                                    <Button size="sm" onClick={handleSendReply} disabled={!replyContent.trim()}>Send</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main >
        </div >
    );
}
