"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Search, Circle, Users } from "lucide-react";
import { CreateGroupModal } from "./CreateGroupModal";

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
    const [friends, setFriends] = useState<FriendWithLastMessage[]>([]);
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

            let conversationList: any[] = [];

            if (friendshipsData) {
                const friendList = friendshipsData.map((f: any) => {
                    const friend = f.user_id_1 === user.id ? f.user2 : f.user1;
                    return { ...friend, type: 'dm' };
                });

                // Fetch Last Message for each friend
                const friendsWithMsg = await Promise.all(friendList.map(async (friend: any) => {
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
                conversationList = [...friendsWithMsg];
            }

            // 2. Fetch Groups
            const { data: userGroups } = await supabase
                .from("group_members")
                .select(`
                    group_id,
                    group:groups!group_members_group_id_fkey(id, name, image_url)
                `)
                .eq("user_id", user.id);

            if (userGroups) {
                const groupsWithMsg = await Promise.all(userGroups.map(async (g: any) => {
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
                        lastMessage: lastMsg ? `${(lastMsg.sender as any)?.first_name || "Sister"}: ${lastMsg.content}` : "Group created",
                        lastMessageTime: lastMsg?.created_at || g.created_at, // Fallback to group creation if no msg? Need group created_at but simpler to just use null or now
                        // actually fetch Groups table created_at if needed, but lastMsg check is fine
                    };
                }));
                conversationList = [...conversationList, ...groupsWithMsg];
            }

            // Sort by last message time
            conversationList.sort((a, b) => {
                const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
                const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
                return timeB - timeA;
            });

            setFriends(conversationList);
            setLoading(false);
        };
        fetchFriendsAndMessages();
    }, []);

    useEffect(() => {
        let channel: any;

        const setupRealtime = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            channel = supabase
                .channel('sidebar_messages')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
                    const newMsg = payload.new as any;

                    // Update the friend list if the message involves me
                    setFriends(prev => {
                        const friendId = newMsg.sender_id === user.id ? newMsg.receiver_id : newMsg.sender_id;

                        // Check if this message is relevant to any friend in the list
                        const friendIndex = prev.findIndex(f => f.id === friendId);

                        if (friendIndex === -1) return prev; // Message from someone not in friend list (or new friend)

                        const updatedFriend = {
                            ...prev[friendIndex],
                            lastMessage: newMsg.content,
                            lastMessageTime: newMsg.created_at,
                            lastSenderId: newMsg.sender_id
                        };

                        // Move to top
                        const newFriends = [...prev];
                        newFriends.splice(friendIndex, 1);
                        return [updatedFriend, ...newFriends];
                    });
                })
                .subscribe();
        };

        setupRealtime();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, []);

    const filteredFriends = friends.filter((friend: any) =>
        (friend.first_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (friend.last_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (friend.username || "").toLowerCase().includes(search.toLowerCase()) ||
        (friend.name || "").toLowerCase().includes(search.toLowerCase()) // For groups
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

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {loading ? (
                    <div className="p-4 text-center text-xs text-warm-grey/40">Loading conversations...</div>
                ) : filteredFriends.length === 0 ? (
                    <div className="p-8 text-center text-warm-grey/40 text-sm">
                        No conversations found.
                        <br />
                        <Link href="/search" className="text-muted-rose hover:underline mt-2 inline-block">Find sisters</Link>
                    </div>
                ) : (
                    filteredFriends.map((item: any) => {
                        const isGroup = item.type === 'group';
                        const linkHref = isGroup ? `/messages/group/${item.id}` : `/messages/${item.id}`;
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
                                    <div className="w-12 h-12 rounded-full bg-stone-200 overflow-hidden border border-white shadow-sm flex items-center justify-center flex-shrink-0">
                                        {isGroup ? (
                                            <div className="w-full h-full bg-muted-rose/10 flex items-center justify-center text-muted-rose">
                                                <Users className="w-6 h-6" />
                                            </div>
                                        ) : item.avatar_url ? (
                                            <img src={item.avatar_url} alt={item.username} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-warm-grey text-lg font-serif">
                                                {(item.first_name?.[0] || item.username?.[0] || "?").toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    {/* Online indicator placeholder */}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <p className="font-bold text-warm-grey text-sm truncate">
                                            {isGroup ? item.name : `${item.first_name} ${item.last_name}`}
                                        </p>
                                        {item.lastMessageTime && (
                                            <span className="text-[10px] text-warm-grey/40 flex-shrink-0 ml-2">
                                                {new Date(item.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-xs truncate ${isActive ? "text-warm-grey/80" : "text-warm-grey/60"}`}>
                                        {hasMessage ? (
                                            <span>
                                                {!isGroup && item.lastSenderId !== item.id && "You: "}
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
        </div>
    );
}
