"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Search, Circle, Users } from "lucide-react";
import { CreateGroupModal } from "./CreateGroupModal";

function formatMessageTime(timeStr: string | undefined): string {
    if (!timeStr) return "";
    const date = new Date(timeStr);
    const now = new Date();
    
    // Reset times to compare calendar days
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = startOfNow.getTime() - startOfDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
        return "Yesterday";
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

type Friend = {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
};

type FriendWithLastMessage = Friend & {
    lastMessage?: string;
    lastMessageTime?: string;
    lastSenderId?: string;
};

export function MessagesSidebar({ className = "" }: { className?: string }) {
    const [circles, setCircles] = useState<FriendWithLastMessage[]>([]);
    const [directMessages, setDirectMessages] = useState<FriendWithLastMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const pathname = usePathname();
    const supabase = createClient();

    useEffect(() => {
        const fetchFriendsAndMessages = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch Friends (DMs)
            const { data: friendshipsData } = await supabase
                .from("friendships")
                .select(`
                    user_id_1,
                    user_id_2,
                    user1:profiles!friendships_user_id_1_fkey(id, username, first_name, last_name, avatar_url),
                    user2:profiles!friendships_user_id_2_fkey(id, username, first_name, last_name, avatar_url)
                `)
                .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
                .eq("status", "accepted");

            let friendsWithMsg: any[] = [];

            if (friendshipsData) {
                const friendList = friendshipsData.map((f: any) => {
                    const friend = f.user_id_1 === user.id ? f.user2 : f.user1;
                    return { ...friend, type: 'dm' };
                });

                // Fetch Last Message for each friend
                friendsWithMsg = await Promise.all(friendList.map(async (friend: any) => {
                    const { data: lastMsg } = await supabase
                        .from("direct_messages")
                        .select("content, created_at, sender_id")
                        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friend.id}),and(sender_id.eq.${friend.id},receiver_id.eq.${user.id})`)
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .single();

                    return {
                        ...friend,
                        lastMessage: lastMsg?.content,
                        lastMessageTime: lastMsg?.created_at,
                        lastSenderId: lastMsg?.sender_id
                    };
                }));
            }

            // 2. Fetch Groups
            const { data: userGroups } = await supabase
                .from("group_members")
                .select(`
                    group_id,
                    group:groups!group_members_group_id_fkey(id, name, image_url)
                `)
                .eq("user_id", user.id);

            let groupsWithMsg: any[] = [];

            if (userGroups) {
                groupsWithMsg = await Promise.all(userGroups.map(async (g: any) => {
                    const { data: lastMsg } = await supabase
                        .from("group_messages")
                        .select("content, created_at, sender_id, sender:profiles!group_messages_sender_id_fkey(first_name)")
                        .eq("group_id", g.group.id)
                        .order("created_at", { ascending: false })
                        .limit(1)
                        .single();

                    return {
                        id: g.group.id,
                        name: g.group.name,
                        image_url: g.group.image_url,
                        type: 'group',
                        lastMessage: lastMsg ? `${(lastMsg.sender as any)?.first_name || "Sister"}: ${lastMsg.content}` : "New Circle",
                        lastMessageTime: lastMsg?.created_at || g.created_at || new Date().toISOString(),
                    };
                }));
            }

            // Sort both lists
            const sortFn = (a: any, b: any) => {
                const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                return timeB - timeA;
            };

            setCircles(groupsWithMsg.sort(sortFn));
            setDirectMessages(friendsWithMsg.sort(sortFn));
            setLoading(false);
        };
        fetchFriendsAndMessages();
    }, []);

    useEffect(() => {
        let channelParams: any;
        let channelGroup: any;

        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // DMs Subscription
            channelParams = supabase
                .channel('sidebar_messages_dm')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
                    const newMsg = payload.new as any;

                    setDirectMessages(prev => {
                        const friendId = newMsg.sender_id === user.id ? newMsg.receiver_id : newMsg.sender_id;
                        const friendIndex = prev.findIndex(f => f.id === friendId);

                        if (friendIndex === -1) return prev;

                        const updatedFriend = {
                            ...prev[friendIndex],
                            lastMessage: newMsg.content,
                            lastMessageTime: newMsg.created_at,
                            lastSenderId: newMsg.sender_id
                        };

                        const newFriends = [...prev];
                        newFriends.splice(friendIndex, 1);
                        return [updatedFriend, ...newFriends];
                    });
                })
                .subscribe();

            // Group Messages Subscription
            // Note: We need a way to listen to ALL group messages for groups I'm in. 
            // supabase realtime doesn't support "where id in array" easily in filter string.
            // But we can listen to "group_messages" generally and filter client side if we have the list, 
            // OR strictly speaking we should subscribe to specific group channels if possible, or just one global table channel and check if group_id is in my circles.

            channelGroup = supabase
                .channel('sidebar_messages_group')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, async (payload) => {
                    const newMsg = payload.new as any;

                    // We need to know if this group is in our circles list
                    // Since state setter has access to prev, we can check there
                    setCircles(prev => {
                        const groupIndex = prev.findIndex(c => c.id === newMsg.group_id);
                        if (groupIndex === -1) return prev; // Not in a group we know about

                        // We might need sender name for group msg preview
                        // For optimization, we can just say "Sister: ..." or fetch async. 
                        // Fetching async inside state setter is tricky. 
                        // Simplified: Update with content now

                        const updatedCircle = {
                            ...prev[groupIndex],
                            lastMessage: "New message...", // TODO: Ideally fetch sender name or include it in payload if possible (not possible with standard realtime headers usually)
                            lastMessageTime: newMsg.created_at,
                        };

                        // We can fire a separate fetch to get the nice preview text if needed, but for now:
                        updatedCircle.lastMessage = `Sister: ${newMsg.content}`;

                        const newCircles = [...prev];
                        newCircles.splice(groupIndex, 1);
                        return [updatedCircle, ...newCircles];
                    });
                })
                .subscribe();
        };

        setupRealtime();

        return () => {
            if (channelParams) supabase.removeChannel(channelParams);
            if (channelGroup) supabase.removeChannel(channelGroup);
        };
    }, []);

    const filteredCircles = circles.filter((c: any) =>
        (c.name || "").toLowerCase().includes(search.toLowerCase())
    );

    const filteredDMs = directMessages.filter((friend: any) =>
        (friend.first_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (friend.last_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (friend.username || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={`flex flex-col h-full bg-white border-r border-warm-grey/5 ${className}`}>
            <div className="p-4 border-b border-warm-grey/5">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-serif text-xl text-warm-cocoa">Messages</h2>
                    <CreateGroupModal onGroupCreated={() => window.location.reload()} />
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-grey/40" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-stone-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-muted-rose/20 text-warm-grey"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {loading ? (
                    <div className="p-4 text-center text-xs text-warm-grey/40">Loading conversations...</div>
                ) : (
                    <>
                        {/* Selah Circles Widget */}
                        <div className="mb-2">
                            <h3 className="px-2 text-xs font-bold text-warm-grey/40 uppercase tracking-wider mb-2">Selah Circles</h3>
                            {filteredCircles.length === 0 ? (
                                <p className="px-2 text-xs text-warm-grey/40 italic">No circles yet.</p>
                            ) : (
                                <div className="space-y-1">
                                    {filteredCircles.map((item: any) => {
                                        const linkHref = `/messages/group/${item.id}`;
                                        const isActive = pathname === linkHref;
                                        const hasMessage = !!item.lastMessage;

                                        return (
                                            <Link
                                                key={item.id}
                                                href={linkHref}
                                                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? "bg-muted-rose/10 border border-muted-rose/20" : "hover:bg-stone-50 border border-transparent"}`}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-muted-rose border border-warm-grey/10 overflow-hidden shadow-sm shrink-0">
                                                    {item.image_url ? (
                                                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="font-serif font-bold text-sm">{item.name[0]}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <p className={`font-bold text-sm truncate ${isActive ? "text-muted-rose" : "text-warm-grey"}`}>
                                                            {item.name}
                                                        </p>
                                                        {item.lastMessageTime && (
                                                            <span className="text-[9px] text-warm-grey/40 shrink-0 ml-2">
                                                                {formatMessageTime(item.lastMessageTime)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs truncate ${isActive ? "text-muted-rose/80" : "text-warm-grey/60"}`}>
                                                        {item.lastMessage || "New Circle"}
                                                    </p>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Direct Messages */}
                        <div>
                            <h3 className="px-2 text-xs font-bold text-warm-grey/40 uppercase tracking-wider mb-2">Messages</h3>
                            {filteredDMs.length === 0 ? (
                                <div className="p-4 text-center text-warm-grey/40 text-xs">
                                    No conversations found.
                                </div>
                            ) : (
                                filteredDMs.map((item: any) => {
                                    const linkHref = `/messages/${item.id}`;
                                    const isActive = pathname === linkHref;
                                    const hasMessage = !!item.lastMessage;

                                    return (
                                        <Link
                                            key={item.id}
                                            href={linkHref}
                                            className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isActive ? "bg-soft-blush/20" : "hover:bg-stone-50"
                                                }`}
                                        >
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden border border-white shadow-sm flex items-center justify-center flex-shrink-0">
                                                    {item.avatar_url ? (
                                                        <img src={item.avatar_url} alt={item.username} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-warm-grey text-xs font-serif">
                                                            {(item.first_name?.[0] || item.username?.[0] || "?").toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-baseline mb-0.5">
                                                    <p className="font-bold text-warm-grey text-sm truncate">
                                                        {item.first_name} {item.last_name}
                                                    </p>
                                                    {item.lastMessageTime && (
                                                        <span className="text-[10px] text-warm-grey/40 flex-shrink-0 ml-2">
                                                            {formatMessageTime(item.lastMessageTime)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-xs truncate ${isActive ? "text-warm-grey/80" : "text-warm-grey/60"}`}>
                                                    {hasMessage ? (
                                                        <span>
                                                            {item.lastSenderId !== item.id && "You: "}
                                                            {item.lastMessage}
                                                        </span>
                                                    ) : (
                                                        <span className="italic opacity-70">Start chatting</span>
                                                    )}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
