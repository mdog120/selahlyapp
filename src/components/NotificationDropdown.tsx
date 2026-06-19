"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Heart, MessageCircle, MessageSquare, User, AtSign, Flower, Gamepad2, BookOpen, Sparkles, ThumbsDown } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getNotificationTextOnly, stripEmojis, formatMessagePreview } from "@/lib/notifications";

type Notification = {
    id: string;
    type: string;
    read: boolean;
    created_at: string;
    resource_id: string | null;
    resource_type?: string | null;
    actor_id: string | null;
    message_content?: string;
    actor?: {
        username: string;
        first_name: string;
        last_name: string;
        avatar_url: string;
    };
};

export function NotificationDropdown() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [userId, setUserId] = useState<string | null>(null);
    const supabase = createClient();
    const router = useRouter();

    // Note: Push notification permission and FCM registration is handled by FCMProvider.
    // This component only manages the in-app notification dropdown UI.

    useEffect(() => {
        if (isOpen && unreadCount > 0) {
            markAllAsRead();
        }
    }, [isOpen, unreadCount]);

    useEffect(() => {
        let channel: any;

        const setupSubscription = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUserId(user.id);
            fetchNotifications(user.id);

            // Subscribe only to Postgres INSERT changes for the current user
            channel = supabase
                .channel(`notifications:${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                }, (payload) => {
                    console.log('New notification for current user!', payload);
                    fetchNotifications(user.id); // Refresh list on new item
                })
                .subscribe();
        };

        setupSubscription();

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, []);

    async function fetchNotifications(currentUserId?: string) {
        const uid = currentUserId || userId;
        if (!uid) return;

        // Fetch top 10 visible notifications
        const { data } = await supabase
            .from("notifications")
            .select(`
                *,
                actor:profiles!notifications_actor_id_fkey(username, first_name, last_name, avatar_url)
            `)
            .eq("user_id", uid)
            .order("created_at", { ascending: false })
            .limit(10);

        if (data) {
            // Find all message notifications to batch fetch their content
            const messageNotifs = data.filter((n: any) => n.type === 'message' && n.resource_id);
            if (messageNotifs.length > 0) {
                const messageIds = messageNotifs.map((n: any) => n.resource_id);
                const { data: dms } = await supabase
                    .from('direct_messages')
                    .select('id, content')
                    .in('id', messageIds);
                
                if (dms) {
                    const dmMap = new Map(dms.map(d => [d.id, d.content]));
                    data.forEach((n: any) => {
                        if (n.type === 'message' && n.resource_id) {
                            n.message_content = dmMap.get(n.resource_id);
                        }
                    });
                }
            }
            setNotifications(data as any);
        }

        // Fetch exact unread count from the entire database for this user
        const { count } = await supabase
            .from("notifications")
            .select("*", { count: "exact", head: true })
            .eq("user_id", uid)
            .eq("read", false);

        if (count !== null) {
            setUnreadCount(count);
        }
    }



    async function handleRead(notificationId: string) {
        const { error } = await supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", notificationId);

        if (error) {
            console.error("Error marking single notification as read:", error);
        }

        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }

    async function markAllAsRead() {
        const uid = userId;
        if (!uid) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        // Update ALL unread notifications for this user in DB (resolving limit pagination leak)
        const { error } = await supabase
            .from("notifications")
            .update({ read: true })
            .eq("user_id", uid)
            .eq("read", false);

        if (error) {
            console.error("Error marking all notifications as read in database:", error);
        }
    }

    async function clearAllNotifications() {
        const uid = userId;
        if (!uid) return;

        // Optimistic update
        setNotifications([]);
        setUnreadCount(0);

        // Delete all notifications for this user in DB
        const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("user_id", uid);

        if (error) {
            console.error("Error clearing all notifications in database:", error);
        }
    }

    async function deleteNotification(notificationId: string) {
        // Find notification
        const notification = notifications.find(n => n.id === notificationId);
        
        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (notification && !notification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        const { error } = await supabase
            .from("notifications")
            .delete()
            .eq("id", notificationId);

        if (error) {
            console.error("Error deleting notification:", error);
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'like':
            case 'comment_like':
            case 'message_like':
            case 'group_message_like':
                return <Heart className="w-3 h-3 text-white" />;
            case 'message_dislike':
            case 'group_message_dislike':
                return <ThumbsDown className="w-3 h-3 text-white" />;
            case 'comment': return <MessageCircle className="w-3 h-3 text-white" />;
            case 'reply': return <MessageSquare className="w-3 h-3 text-white" />;
            case 'pray':
            case 'prayer': return <Heart className="w-3 h-3 text-white" />; // Prayer hands unavailable in standard set, using Heart
            case 'friend_request': return <User className="w-3 h-3 text-white" />;
            case 'message': return <MessageCircle className="w-3 h-3 text-white" />; // Use Message icon
            case 'post': return <Heart className="w-3 h-3 text-white" />; // Use generic icon for post or image
            case 'mention': return <AtSign className="w-3 h-3 text-white" />;
            case 'plant_ready': return <Flower className="w-3 h-3 text-white" />;
            case 'lobby': return <Gamepad2 className="w-3 h-3 text-white" />;
            case 'prayer_request': return <Heart className="w-3 h-3 text-white" />;
            case 'verse_of_the_day': return <BookOpen className="w-3 h-3 text-white" />;
            case 'solo_minigame': return <Sparkles className="w-3 h-3 text-white" />;
            default: return <Bell className="w-3 h-3 text-white" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'like':
            case 'comment_like':
            case 'message_like':
            case 'group_message_like':
                return "bg-muted-rose";
            case 'message_dislike':
            case 'group_message_dislike':
                return "bg-stone-400";
            case 'comment': return "bg-blue-400";
            case 'reply': return "bg-deep-velvet";
            case 'pray':
            case 'prayer': return "bg-stone-400";
            case 'friend_request': return "bg-emerald-400";
            case 'message': return "bg-sage-green"; // Distinct color for messages
            case 'post': return "bg-warm-cocoa";
            case 'mention': return "bg-purple-400";
            case 'plant_ready': return "bg-pink-400";
            case 'lobby': return "bg-indigo-400";
            case 'prayer_request': return "bg-rose-400";
            case 'verse_of_the_day': return "bg-amber-400";
            case 'solo_minigame': return "bg-teal-400";
            default: return "bg-warm-grey";
        }
    };

    const getLink = (n: Notification) => {
        if (n.type === 'reply') return `/velvet-vault/${n.resource_id}`;
        if (n.type === 'pray' || n.type === 'prayer' || n.type === 'prayer_request') return `/prayer-pocket`;
        if (n.type === 'friend_request') return `/profile/me`;
        if (n.type === 'message' || n.type === 'message_like' || n.type === 'message_dislike') return `/messages/${n.actor_id}`; // Correctly use UUID
        if (n.type === 'group_message_like' || n.type === 'group_message_dislike') return `/messages/group/${n.resource_id}`;
        if (n.type === 'comment_like') return `/home`;
        if (n.type === 'mention') {
            if (n.resource_type === 'note') return `/profile/${n.actor?.username || "user"}`;
            if (n.resource_type === 'group_chat') return `/messages/group/${n.resource_id}`;
            return `/home`;
        }
        if (n.type === 'plant_ready' || n.type === 'solo_minigame') return `/minigames`;
        if (n.type === 'lobby') return n.resource_id ? `/minigames/multiplayer/room/${n.resource_id}` : `/minigames/multiplayer`;
        if (n.type === 'verse_of_the_day') return `/diaries`;
        return `/home`;
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-stone-100 transition-colors text-warm-grey"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-muted-rose rounded-full border border-white animate-pulse"></span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 z-50 overflow-hidden animate-fade-in-up origin-top-right">
                        <div className="p-3 border-b border-warm-grey/5 flex justify-between items-center">
                            <h3 className="font-serif text-warm-cocoa pl-1 text-sm font-bold">Notifications</h3>
                            <div className="flex gap-2.5 items-center">
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={markAllAsRead} 
                                        className="text-[10px] text-muted-rose hover:text-muted-rose/80 font-semibold"
                                    >
                                        Mark read
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button 
                                        onClick={clearAllNotifications} 
                                        className="text-[10px] text-warm-grey/40 hover:text-warm-grey font-semibold"
                                    >
                                        Clear all
                                    </button>
                                )}
                                <button onClick={() => { fetchNotifications(); }} className="text-[10px] text-warm-grey/40 hover:text-warm-grey font-medium">Refresh</button>
                            </div>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-warm-grey/40 text-xs italic">
                                    No new updates yet.
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <div
                                        key={n.id}
                                        className={`group relative block hover:bg-stone-50 transition-colors border-b border-warm-grey/5 last:border-0 ${!n.read ? "bg-stone-50/50" : ""}`}
                                    >
                                        <div className="p-3 pr-8 flex gap-3">
                                            <Link
                                                href={getLink(n)}
                                                onClick={() => { handleRead(n.id); setIsOpen(false); }}
                                                className="flex-1 flex gap-3 min-w-0"
                                            >
                                                <div className="relative flex-shrink-0">
                                                    <div className="w-8 h-8 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center border border-stone-200/30">
                                                        {n.actor?.avatar_url ? (
                                                            <img src={n.actor.avatar_url} className="w-full h-full object-cover" />
                                                        ) : n.actor ? (
                                                            <span className="w-full h-full flex items-center justify-center text-[10px] uppercase font-bold text-warm-cocoa">
                                                                {(n.actor?.first_name?.[0] || "") + (n.actor?.last_name?.[0] || "")}
                                                            </span>
                                                        ) : (
                                                            <span className="w-full h-full flex items-center justify-center text-xs text-muted-rose font-serif bg-stone-50 select-none">
                                                                ౨ৎ
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-white flex items-center justify-center ${getColor(n.type)}`}>
                                                        {getIcon(n.type)}
                                                    </div>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-xs text-warm-grey leading-snug break-words">
                                                        {n.type === 'message' ? (
                                                            <>
                                                                <span className="font-bold text-warm-cocoa block mb-0.5">{n.actor?.first_name || "Someone"}</span>
                                                                <span className="text-warm-grey/70 text-[11px] block">{formatMessagePreview(n.message_content || "")}</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {n.type !== 'plant_ready' && n.type !== 'verse_of_the_day' && n.type !== 'solo_minigame' && (
                                                                    <span className="font-bold text-warm-cocoa">{n.actor?.first_name || "Someone"} </span>
                                                                )}
                                                                {getNotificationTextOnly(n.type, n.id, n.message_content)}
                                                            </>
                                                        )}
                                                    </p>
                                                    <p className="text-[10px] text-warm-grey/40 mt-1">
                                                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </Link>
                                            
                                            {/* Unread indicators & individual clear/delete button */}
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
                                                {!n.read && (
                                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-rose shrink-0"></div>
                                                )}
                                                <button
                                                    onClick={async (e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        await deleteNotification(n.id);
                                                    }}
                                                    className="w-5 h-5 rounded-full hover:bg-stone-200 flex items-center justify-center text-warm-grey/30 hover:text-warm-grey opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Delete"
                                                >
                                                    <span className="text-[11px] font-bold">×</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
