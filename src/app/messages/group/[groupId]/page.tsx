"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { Send, ArrowLeft, MoreVertical, Check, CheckCheck, Settings, Smile, Sun, Flower2, Star, TreeDeciduous, Users, Feather, Flame, Mail, Heart } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { GroupSettingsModal } from "@/components/messaging/GroupSettingsModal";

type Message = {
    id: string;
    content: string;
    sender_id: string;
    group_id: string; // Changed from receiver_id
    created_at: string;
    read_by: string[];
    reactions: Record<string, 'bow' | 'dislike'>;
    sender?: {
        first_name: string;
        avatar_url: string;
    };
};

type Group = {
    id: string;
    name: string;
    admin_id: string;
    image_url: string;
    members: {
        user_id: string;
        profile: {
            first_name: string;
            avatar_url: string;
        }
    }[];
};

export default function GroupChatPage() {
    const params = useParams();
    const groupId = params.groupId as string;

    // State
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [group, setGroup] = useState<Group | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Real-time State
    const [isTyping, setIsTyping] = useState<string | null>(null); // userId who is typing
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // 1. Fetch Current User
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUser(user);
        };
        getUser();
    }, []);

    // 2. Fetch Group & Messages
    useEffect(() => {
        if (!groupId || !currentUser) return;

        const fetchGroupData = async () => {
            // Fetch Group Details + Members
            const { data: groupData } = await supabase
                .from("groups")
                .select(`
                    id, name, admin_id, image_url
                `)
                .eq("id", groupId)
                .single();

            if (groupData) {
                // Fetch members separately to join cleanly
                const { data: members } = await supabase
                    .from("group_members")
                    .select(`user_id, profile:profiles(*)`)
                    .eq("group_id", groupId);

                setGroup({ ...groupData, members: members as any });
            }

            // Fetch Messages
            const { data: msgs } = await supabase
                .from("group_messages")
                .select(`
                    *,
                    sender:profiles(first_name, avatar_url)
                `)
                .eq("group_id", groupId)
                .order("created_at", { ascending: true });

            if (msgs) {
                setMessages(msgs as any);
            }
            setLoading(false);
        };

        fetchGroupData();
    }, [groupId, currentUser]);

    // 3. Real-time Subscription
    useEffect(() => {
        if (!currentUser || !groupId) return;

        const channel = supabase.channel(`group_chat:${groupId}`);

        channel
            .on('broadcast', { event: 'typing' }, (payload) => {
                if (payload.payload.user_id !== currentUser.id) {
                    setIsTyping(payload.payload.first_name); // Show name
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => setIsTyping(null), 3000);
                }
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` }, async (payload) => {
                const newMsg = payload.new as Message;

                // Fetch sender info for the new message
                const { data: sender } = await supabase
                    .from("profiles")
                    .select("first_name, avatar_url")
                    .eq("id", newMsg.sender_id)
                    .single();

                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, { ...newMsg, sender: sender as any }];
                });

                // Mark as read immediately if window is focused
                markRead();
            })
            // Reactions update
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'group_messages', filter: `group_id=eq.${groupId}` }, (payload) => {
                const updatedMsg = payload.new as Message;
                setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, reactions: updatedMsg.reactions, read_by: updatedMsg.read_by } : m));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId, currentUser]);

    // Mark read on load or view
    const markRead = async () => {
        if (!groupId || !currentUser) return;
        await supabase.rpc('mark_group_messages_read', { p_group_id: groupId });
    };

    useEffect(() => {
        if (currentUser && groupId) {
            markRead();
        }
    }, [messages.length, groupId, currentUser?.id]); // Retry when user loads

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleTyping = async () => {
        const channel = supabase.channel(`group_chat:${groupId}`);
        await channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { user_id: currentUser?.id, first_name: currentUser?.user_metadata?.first_name }
        });
    };

    const handleReaction = async (messageId: string, type: 'bow' | 'dislike') => {
        if (!currentUser) return;
        const msg = messages.find(m => m.id === messageId);
        if (!msg) return;

        const currentReactions = msg.reactions || {};
        const myReaction = currentReactions[currentUser.id];

        let newReactions = { ...currentReactions };
        if (myReaction === type) {
            delete newReactions[currentUser.id];
        } else {
            newReactions[currentUser.id] = type;
        }

        // Optimistic
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: newReactions } : m));

        // DB
        await supabase.from("group_messages").update({ reactions: newReactions }).eq("id", messageId);
    };

    const handleDoubleTap = (messageId: string) => {
        handleReaction(messageId, 'bow');
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !currentUser) return;
        const content = newMessage;
        setNewMessage("");

        // Optimistic
        const tempMsg: Message = {
            id: `temp-${Date.now()}`,
            content: content,
            sender_id: currentUser.id,
            group_id: groupId,
            created_at: new Date().toISOString(),
            reactions: {},
            read_by: [],
            sender: {
                first_name: currentUser.user_metadata?.first_name || "Me",
                avatar_url: currentUser.user_metadata?.avatar_url || ""
            }
        };
        setMessages(prev => [...prev, tempMsg]);

        const { data, error } = await supabase.from("group_messages").insert({
            sender_id: currentUser.id,
            group_id: groupId,
            content: content,
            reactions: {}
        }).select().single();

        if (error) {
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
            alert("Failed to send");
        } else if (data) {
            setMessages(prev => prev.map(m => m.id === tempMsg.id ? { ...m, id: data.id } : m));
        }
    };

    // Helper to render stickers
    const renderContentWithStickers = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(\[sticker:[^\]]+\])/g);
        return parts.map((part, index) => {
            const match = part.match(/\[sticker:(.+)\]/);
            if (match) {
                const stickerName = match[1];
                let Icon = Star;
                let color = "text-yellow-400";

                switch (stickerName) {
                    case 'Candle': Icon = Flame; color = "text-orange-300"; break;
                    case 'Feather': Icon = Feather; color = "text-stone-400"; break;
                    case 'Users': Icon = Users; color = "text-rose-400"; break;
                    case 'Heart': Icon = Heart; color = "text-pink-400"; break;
                    case 'Prayer Warrior': Icon = Users; color = "text-blue-400"; break;
                    case 'Encourager': Icon = Mail; color = "text-purple-400"; break;
                    case 'Sunshine': Icon = Sun; color = "text-yellow-400"; break;
                    case 'Bloom': Icon = Flower2; color = "text-pink-300"; break;
                    case 'Peace': Icon = Feather; color = "text-blue-300"; break;
                    case 'Rooted': Icon = TreeDeciduous; color = "text-green-600"; break;
                    case 'Star': Icon = Star; color = "text-yellow-400"; break;
                }
                return <span key={index} className="inline-block mx-1 align-middle"><Icon className={`w-4 h-4 ${color} fill-current`} /></span>;
            }
            return part;
        });
    };

    if (loading) return <div className="h-full flex items-center justify-center text-warm-grey/40">Loading group...</div>;

    const isAdmin = group?.admin_id === currentUser?.id;

    return (
        <div className="flex flex-col h-full bg-stone-50/30">
            {/* Header */}
            <header className="bg-white border-b border-warm-grey/5 p-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <Link href="/messages" className="md:hidden p-2 -ml-2 text-warm-grey/60 hover:bg-stone-100 rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>

                    <div className="w-10 h-10 rounded-full bg-muted-rose/10 flex items-center justify-center text-muted-rose border border-white shadow-sm">
                        {/* Group Icon */}
                        {/* Could use group image if user uploads one later, for now initials or icon */}
                        <span className="font-bold font-serif">{group?.name[0].toUpperCase()}</span>
                    </div>

                    <div>
                        <h1 className="font-bold text-warm-grey text-sm">{group?.name}</h1>
                        <p className="text-xs text-warm-grey/40 font-medium">
                            {group?.members?.length || 0} sisters
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 text-warm-grey/40 hover:bg-stone-100 rounded-full"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center py-10 text-warm-grey/40 text-sm">
                        <p>Welcome to {group?.name}!</p>
                        <p>Be the first to say hello. 👋</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sender_id === currentUser?.id;
                        const showAvatar = !isMe && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);
                        const senderName = msg.sender?.first_name || "Sister";

                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-2`}>
                                {/* Name on top of group message if not me */}
                                {!isMe && showAvatar && (
                                    <span className="text-[10px] text-warm-grey/60 ml-10 mb-1">{senderName}</span>
                                )}

                                <div className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[80%] group/message relative`}>
                                    {!isMe && (
                                        <div className="w-6 h-6 rounded-full bg-stone-200 overflow-hidden mx-2 flex-shrink-0 mb-1 opacity-0" style={{ opacity: showAvatar ? 1 : 0 }}>
                                            {msg.sender?.avatar_url && <img src={msg.sender.avatar_url} className="w-full h-full object-cover" />}
                                        </div>
                                    )}

                                    {/* Hover Actions (Same as DM) */}
                                    <div className={`absolute top-0 opacity-0 group-hover/message:opacity-100 transition-opacity flex gap-1 -translate-y-1/2 z-10 ${isMe ? 'right-full mr-2' : 'left-full ml-2'}`}>
                                        <button onClick={() => handleReaction(msg.id, 'bow')} className="w-7 h-7 bg-white rounded-full shadow-sm border border-warm-grey/10 flex items-center justify-center hover:scale-110 transition-transform text-muted-rose font-serif text-xs">౨ৎ</button>
                                        <button onClick={() => handleReaction(msg.id, 'dislike')} className="w-7 h-7 bg-white rounded-full shadow-sm border border-warm-grey/10 flex items-center justify-center hover:scale-110 transition-transform text-warm-grey/60 text-[10px]">:(</button>
                                    </div>

                                    <div
                                        onDoubleClick={() => handleDoubleTap(msg.id)}
                                        className={`px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm relative cursor-pointer select-none transition-all ${isMe
                                            ? 'bg-muted-rose text-white rounded-tr-sm'
                                            : 'bg-white text-warm-grey rounded-tl-sm border border-warm-grey/5'
                                            }`}
                                    >
                                        {renderContentWithStickers(msg.content)}
                                        <div className={`flex items-center gap-1 mt-1 text-[9px] ${isMe ? 'text-white/70 justify-end' : 'text-warm-grey/40 justify-start'}`}>
                                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                        </div>

                                        {/* Reactions */}
                                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                            <div className={`absolute -bottom-2 ${isMe ? 'left-0 -translate-x-2' : 'right-0 translate-x-2'} flex gap-1`}>
                                                {Object.entries(msg.reactions).map(([uid, r]) => (
                                                    <div key={uid} className="bg-white border border-warm-grey/10 shadow-sm rounded-full w-5 h-5 flex items-center justify-center text-[10px]">
                                                        {r === 'bow' ? <span className="text-muted-rose font-serif relative top-[1px]">౨ৎ</span> : <span className="text-warm-grey/60 relative -top-[1px]">:(</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Read Receipts */}
                                {msg.read_by && msg.read_by.length > 0 && (
                                    <div className={`text-[9px] text-warm-grey/40 mt-1 px-1 ${isMe ? 'text-right mr-1' : 'ml-10'}`}>
                                        {(() => {
                                            const readers = (msg.read_by || [])
                                                .filter((uid: string) => uid !== currentUser?.id && uid !== msg.sender_id) // Exclude me and sender
                                                .map((uid: string) => {
                                                    const member = group?.members?.find(m => m.user_id === uid);
                                                    return member?.profile?.first_name;
                                                })
                                                .filter(Boolean); // Remove nulls

                                            if (readers.length === 0) return null;
                                            return `Read by ${readers.join(", ")}`;
                                        })()}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex items-center gap-2 ml-10 mb-2">
                        <div className="bg-white border border-warm-grey/10 px-3 py-2 rounded-full rounded-tl-none shadow-sm flex items-center gap-1">
                            <span className="animate-bounce font-serif text-muted-rose text-xs">౨ৎ</span>
                            <span className="animate-bounce font-serif text-muted-rose text-xs" style={{ animationDelay: '150ms' }}>౨ৎ</span>
                            <span className="animate-bounce font-serif text-muted-rose text-xs" style={{ animationDelay: '300ms' }}>౨ৎ</span>
                        </div>
                        <span className="text-xs text-warm-grey/40">{isTyping} is typing...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-warm-grey/5">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex items-center gap-2 bg-stone-50 p-2 rounded-full border border-warm-grey/10 focus-within:ring-2 focus-within:ring-muted-rose/20 transition-all"
                >
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                            setNewMessage(e.target.value);
                            handleTyping();
                        }}
                        placeholder={`Message ${group?.name}...`}
                        className="flex-1 bg-transparent px-4 py-2 text-sm text-warm-grey placeholder:text-warm-grey/40 focus:outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-muted-rose text-white rounded-full hover:bg-muted-rose/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-muted-rose/20"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>

            {/* Settings Modal */}
            {isSettingsOpen && group && currentUser && (
                <GroupSettingsModal
                    groupId={groupId}
                    isAdmin={isAdmin}
                    currentUserId={currentUser.id}
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                />
            )}
        </div>
    );
}
