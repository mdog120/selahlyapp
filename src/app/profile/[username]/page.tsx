"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, MessageCircle, Check, Clock, Shield, MoreHorizontal, X, Music, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDistanceToNow } from "date-fns";
import { useParams } from "next/navigation";
import Link from "next/link";
import { StickyBoard } from "@/components/profile/StickyBoard";
import { ScrapbookGrid } from "@/components/profile/ScrapbookGrid";

type Profile = {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    biography: string;
    created_at: string;
    streak_count: number;
    song_title?: string | null;
    song_artist?: string | null;
    song_link?: string | null;
    is_friends_public?: boolean;
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

    // Anthem State
    const [editingAnthem, setEditingAnthem] = useState(false);
    const [anthemTitle, setAnthemTitle] = useState("");
    const [anthemArtist, setAnthemArtist] = useState("");
    const [anthemLink, setAnthemLink] = useState("");

    const supabase = createClient();

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
                    lastDate.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);

                    if (lastDate.getTime() < yesterday.getTime()) {
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
            }
            setLoading(false);
        };

        fetchData();
    }, [username]);

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
                setFriends(prev => [...prev, req.requester]);
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

    const handleSaveAnthem = async () => {
        if (!currentUser) return;

        const updates = {
            song_title: anthemTitle.trim() || null,
            song_artist: anthemArtist.trim() || null,
            song_link: anthemLink.trim() || null
        };

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', currentUser.id);

        if (!error) {
            setProfile(prev => prev ? ({ ...prev, ...updates }) : null);
            setEditingAnthem(false);
        } else {
            alert("Failed to update anthem.");
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

    return (
        <div className="min-h-screen bg-warm-paper font-sans">
            <Navbar />

            <div className="h-64 bg-gradient-to-b from-stone-200 to-warm-paper relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            </div>

            <main className="container mx-auto px-4 pb-20 max-w-4xl -mt-20 relative">

                {/* Profile Card */}
                <div className="bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-8 shadow-sm animate-fade-in-up mb-8">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-stone-100 border-4 border-white shadow-lg overflow-hidden flex-shrink-0 mx-auto md:mx-0">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-warm-grey/20 text-5xl font-serif">
                                    {(profile.first_name?.[0] || "")}
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
                                {profile.biography || "No biography yet. Just a sister in Christ walking the journey! ✨"}
                            </p>

                            {/* Anthem Section */}
                            {(profile.song_title || (currentUser?.id === profile.id)) && (
                                <div className="mb-6 inline-block">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xs font-bold text-warm-grey/40 uppercase tracking-widest flex items-center gap-1">
                                            <Music className="w-3 h-3" /> My Anthem
                                        </h3>
                                        {currentUser?.id === profile.id && (
                                            <button
                                                onClick={() => {
                                                    setAnthemTitle(profile.song_title || "");
                                                    setAnthemArtist(profile.song_artist || "");
                                                    setAnthemLink(profile.song_link || "");
                                                    setEditingAnthem(true);
                                                }}
                                                className="text-warm-grey/40 hover:text-warm-cocoa transition-colors"
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>

                                    {profile.song_title ? (
                                        <a
                                            href={profile.song_link || "#"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 bg-white/50 border border-white p-2 pr-4 rounded-xl hover:bg-white transition-colors group"
                                        >
                                            <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-warm-grey group-hover:bg-warm-cocoa group-hover:text-white transition-colors">
                                                <Music className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-warm-grey leading-none mb-0.5">{profile.song_title}</p>
                                                <p className="text-xs text-warm-grey/60 leading-none">{profile.song_artist}</p>
                                            </div>
                                        </a>
                                    ) : (
                                        // Only shown to owner if empty
                                        <button
                                            onClick={() => setEditingAnthem(true)}
                                            className="text-xs text-warm-grey/40 italic hover:text-muted-rose"
                                        >
                                            + Add your anthem song
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Anthem Edit Modal */}
                            {editingAnthem && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-serif text-lg text-warm-cocoa">Update Anthem</h3>
                                            <button onClick={() => setEditingAnthem(false)}><X className="w-5 h-5 text-warm-grey/40" /></button>
                                        </div>
                                        <div className="space-y-3 mb-6">
                                            <div>
                                                <label className="text-xs font-bold text-warm-grey/60 block mb-1">Song Title</label>
                                                <input
                                                    value={anthemTitle}
                                                    onChange={e => setAnthemTitle(e.target.value)}
                                                    className="w-full bg-stone-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-warm-cocoa/20"
                                                    placeholder="e.g. Oceans"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-warm-grey/60 block mb-1">Artist</label>
                                                <input
                                                    value={anthemArtist}
                                                    onChange={e => setAnthemArtist(e.target.value)}
                                                    className="w-full bg-stone-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-warm-cocoa/20"
                                                    placeholder="e.g. Hillsong United"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-warm-grey/60 block mb-1">Link (Spotify/YouTube)</label>
                                                <input
                                                    value={anthemLink}
                                                    onChange={e => setAnthemLink(e.target.value)}
                                                    className="w-full bg-stone-50 border-none rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-warm-cocoa/20"
                                                    placeholder="https://..."
                                                />
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => setEditingAnthem(false)}>Cancel</Button>
                                            <Button size="sm" onClick={handleSaveAnthem}>Save Anthem</Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                <div className="px-4 py-2 rounded-2xl bg-stone-50 border border-warm-grey/5 flex items-center gap-2 text-xs font-medium text-warm-grey">
                                    <span className="text-orange-400">🔥</span> {profile.streak_count || 0} Day Streak
                                </div>
                                <div className="px-4 py-2 rounded-2xl bg-stone-50 border border-warm-grey/5 flex items-center gap-2 text-xs font-medium text-warm-grey">
                                    <Clock className="w-3 h-3 text-warm-grey/40" /> Joined {formatDistanceToNow(new Date(profile.created_at || new Date()), { addSuffix: true })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Friend Requests Section */}
                {friendStatus === 'self' && requests.length > 0 && (
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
                )}

                {/* Sticky Board */}
                <div className="mb-12">
                    <StickyBoard
                        profileId={profile.id}
                        isOwner={currentUser?.id === profile.id}
                        viewerId={currentUser?.id}
                    />
                </div>

                {/* Content Tabs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Friends List */}
                    <div className="md:col-span-1">
                        <div className="bg-white/60 p-6 rounded-3xl border border-white h-full">
                            <h3 className="font-serif text-lg text-warm-cocoa mb-4">Friends ({friends.length})</h3>
                            {friends.length > 0 ? (
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
                                    {friendStatus === 'accepted' || friendStatus === 'self' || profile.is_friends_public
                                        ? "No friends added yet."
                                        : "Friend list private."}
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
                        isOwner={currentUser?.id === profile.id}
                    />
                </div>
            </main>
        </div>
    );
}
