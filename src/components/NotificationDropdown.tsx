"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell, Heart, MessageCircle, MessageSquare, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Notification = {
    id: string;
    type: 'like' | 'comment' | 'reply' | 'pray' | 'friend_request' | 'message' | 'post';
    read: boolean;
    created_at: string;
    resource_id: string;
    actor_id: string;
    actor: {
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
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "default") {
                Notification.requestPermission();
            }
        }
    }, []);

    useEffect(() => {
        if (isOpen && unreadCount > 0) {
            markAllAsRead();
        }
    }, [isOpen]);

    useEffect(() => {
        fetchNotifications();

        // Real-time subscription
        const channel = supabase
            .channel('notifications')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications'
            }, (payload) => {
                console.log('New notification!', payload);
                fetchNotifications(); // Refresh list on new item

                // Trigger local system notification
                const newNotif = payload.new as any;
                if (newNotif && newNotif.actor_id) {
                    fetchActorAndNotify(newNotif.actor_id, newNotif.type);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function fetchNotifications() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from("notifications")
            .select(`
                *,
                actor:profiles!notifications_actor_id_fkey(username, first_name, last_name, avatar_url)
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10);

        if (data) {
            setNotifications(data as any);
            setUnreadCount(data.filter((n: any) => !n.read).length);
        }
    }

    async function fetchActorAndNotify(actorId: string, type: string) {
        if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('first_name')
            .eq('id', actorId)
            .single();

        const name = profile?.first_name || "Someone";
        let action = "sent you a notification.";
        if (type === 'like') action = "liked your post.";
        else if (type === 'comment') action = "commented on your post.";
        else if (type === 'reply') action = "replied to your question.";
        else if (type === 'pray') action = "prayed for you.";
        else if (type === 'friend_request') action = "sent you a friend request.";
        else if (type === 'message') action = "sent you a message.";
        else if (type === 'post') action = "shared a new post.";

        new window.Notification("Selahly ౨ৎ", {
            body: `${name} ${action}`,
            icon: "/logo-v2.png"
        });
    }

    async function handleRead(notificationId: string) {
        // Individual read is less important if we bulk read on open, 
        // but still good for specific interactions if needed.
        await supabase
            .from("notifications")
            .update({ read: true })
            .eq("id", notificationId);

        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
    }

    async function markAllAsRead() {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);

        // Update DB
        await supabase
            .from("notifications")
            .update({ read: true })
            .in("id", unreadIds);
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart className="w-3 h-3 text-white" />;
            case 'comment': return <MessageCircle className="w-3 h-3 text-white" />;
            case 'reply': return <MessageSquare className="w-3 h-3 text-white" />;
            case 'pray': return <Heart className="w-3 h-3 text-white" />; // Prayer hands unavailable in standard set, using Heart
            case 'friend_request': return <User className="w-3 h-3 text-white" />;
            case 'message': return <MessageCircle className="w-3 h-3 text-white" />; // Use Message icon
            case 'post': return <Heart className="w-3 h-3 text-white" />; // Use generic icon for post or image
            default: return <Bell className="w-3 h-3 text-white" />;
        }
    };

    const getColor = (type: string) => {
        switch (type) {
            case 'like': return "bg-muted-rose";
            case 'comment': return "bg-blue-400";
            case 'reply': return "bg-deep-velvet";
            case 'pray': return "bg-stone-400";
            case 'friend_request': return "bg-emerald-400";
            case 'message': return "bg-sage-green"; // Distinct color for messages
            case 'post': return "bg-warm-cocoa";
            default: return "bg-warm-grey";
        }
    };

    const getLink = (n: Notification) => {
        if (n.type === 'reply') return `/velvet-vault/${n.resource_id}`;
        if (n.type === 'pray') return `/prayer-pocket`;
        if (n.type === 'friend_request') return `/profile/${n.actor?.username || "user"}`;
        if (n.type === 'message') return `/messages/${n.actor_id}`; // Correctly use UUID
        // For feeds, we might just go to base page if we don't have single post view yet
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
                        <div className="p-3 border-b border-warm-grey/5 flex justify-between items-baseline">
                            <h3 className="font-serif text-warm-cocoa pl-1">Notifications</h3>
                            <button onClick={() => { fetchNotifications(); }} className="text-[10px] text-warm-grey/40 hover:text-warm-grey">Refresh</button>
                        </div>

                        <div className="max-h-[70vh] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-warm-grey/40 text-xs italic">
                                    No new updates yet.
                                </div>
                            ) : (
                                notifications.map(n => (
                                    <Link
                                        href={getLink(n)}
                                        key={n.id}
                                        onClick={() => { handleRead(n.id); setIsOpen(false); }}
                                        className={`block p-3 hover:bg-stone-50 transition-colors border-b border-warm-grey/5 last:border-0 ${!n.read ? "bg-stone-50/50" : ""}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="relative flex-shrink-0">
                                                <div className="w-8 h-8 rounded-full bg-stone-200 overflow-hidden">
                                                    {n.actor?.avatar_url ? (
                                                        <img src={n.actor.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="w-full h-full flex items-center justify-center text-[10px] uppercase">
                                                            {(n.actor?.first_name?.[0] || "") + (n.actor?.last_name?.[0] || "")}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-white flex items-center justify-center ${getColor(n.type)}`}>
                                                    {getIcon(n.type)}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-warm-grey leading-snug">
                                                    <span className="font-bold text-warm-cocoa">{n.actor?.first_name || "Someone"}</span>
                                                    {" "}
                                                    {n.type === 'like' && "liked your post."}
                                                    {n.type === 'comment' && "commented on your post."}
                                                    {n.type === 'reply' && "replied to your question."}
                                                    {n.type === 'pray' && "prayed for you."}
                                                    {n.type === 'friend_request' && "sent you a friend request."}
                                                </p>
                                                <p className="text-[10px] text-warm-grey/40 mt-1">
                                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                </p>
                                            </div>
                                            {!n.read && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-muted-rose mt-1.5"></div>
                                            )}
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
