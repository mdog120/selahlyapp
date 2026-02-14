"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useSearchParams } from "next/navigation";
import { Send, Phone, Video, Info, Smile, Image as ImageIcon, Mic, X, MoreVertical, Flame, Feather, Users, Heart, Mail, Sun, Flower2, CloudSun, TreeDeciduous, Star, ArrowLeft, Check, CheckCheck, Trash2, Pencil } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns";
import { StickerPicker } from "@/components/gamification/StickerPicker";

type Message = {
    id: string;
    content: string;
    sender_id: string;
    receiver_id: string;
    created_at: string;
    read_at: string | null;
    is_edited?: boolean;
    reactions: Record<string, 'bow' | 'dislike'>; // userId -> reaction type
    metadata?: {
        type: 'post' | 'verse' | 'vibe' | 'question' | 'prayer';
        id: string;
        title?: string;
        image?: string;
        content?: string;
    };
};

type Profile = {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    avatar_url: string;
};

export default function ChatPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const otherUserId = params.userId as string;

    // State
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [otherUser, setOtherUser] = useState<Profile | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Mention State
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionResults, setMentionResults] = useState<{ id: string, username: string, first_name: string, avatar_url: string }[]>([]);
    const [isMentionOpen, setIsMentionOpen] = useState(false);
    const [cursorPosition, setCursorPosition] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Mention Search
    useEffect(() => {
        if (mentionQuery === null) {
            setMentionResults([]);
            setIsMentionOpen(false);
            return;
        }

        const fetchProfiles = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, username, first_name, avatar_url')
                .ilike('username', `${mentionQuery}%`)
                .limit(5);

            if (data && data.length > 0) {
                setMentionResults(data as any);
                setIsMentionOpen(true);
            } else {
                setMentionResults([]);
                setIsMentionOpen(false);
            }
        };

        const timeoutId = setTimeout(fetchProfiles, 300);
        return () => clearTimeout(timeoutId);
    }, [mentionQuery]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const pos = e.target.selectionStart || 0;
        setNewMessage(value);
        setCursorPosition(pos);
        handleTyping();

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

    const insertMention = (username: string) => {
        if (!cursorPosition) return;
        const textBeforeCursor = newMessage.slice(0, cursorPosition);
        const match = textBeforeCursor.match(/(?:\s|^)@([\w.-]*)$/);

        if (match) {
            const matchIndex = match.index! + match[0].indexOf('@');
            const textAfterCursor = newMessage.slice(cursorPosition);
            const newText = newMessage.slice(0, matchIndex) + `@${username} ` + textAfterCursor;

            setNewMessage(newText);
            setMentionQuery(null);
            setIsMentionOpen(false);
            inputRef.current?.focus();
        }
    };

    // Real-time State
    const [isOnline, setIsOnline] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // 0. Check for reply param
    useEffect(() => {
        const replyContent = searchParams.get('reply');
        if (replyContent) {
            setNewMessage(replyContent);
            // Clear the param cleanly without refresh if possible, or just leave it.
            // For now, let's just use it to init state.
        }
    }, [searchParams]);

    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        if (isToday(date)) {
            return format(date, "h:mm a");
        } else if (isYesterday(date)) {
            return "Yesterday " + format(date, "h:mm a");
        } else {
            return format(date, "MMM d, h:mm a");
        }
    };

    // Helper to render stickers
    const renderContentWithStickers = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(\[sticker:[^\]]+\]|@[\w.-]+)/g);
        return parts.map((part, index) => {
            const stickerMatch = part.match(/\[sticker:(.+)\]/);
            if (stickerMatch) {
                const stickerName = stickerMatch[1];
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
                    case 'Peace': Icon = CloudSun; color = "text-sky-400"; break; // Updated for Direct Messages
                    case 'Rooted': Icon = TreeDeciduous; color = "text-green-600"; break;
                    case 'Star': Icon = Star; color = "text-yellow-400"; break;
                    case 'Selah Circle': Icon = Users; color = "text-sage-green"; break; // Added for Selah Circle
                }
                return <span key={index} className="inline-block mx-1 align-middle"><Icon className={`w-4 h-4 ${color} fill-current`} /></span>;
            }

            const mentionMatch = part.match(/^@([\w.-]+)$/);
            if (mentionMatch) {
                const username = mentionMatch[1];
                return (
                    <a
                        key={index}
                        href={`/profile/${username}`}
                        className="text-muted-rose hover:underline font-medium"
                    >
                        {part}
                    </a>
                );
            }

            return part;
        });
    };

    // 1. Fetch Current User (Once)
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUser(user);
        };
        getUser();
    }, []);

    // 2. Fetch Chat Data & Mark as Read
    useEffect(() => {
        if (!currentUser) return;

        const fetchChatData = async () => {
            // Fetch other user profile
            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", otherUserId)
                .single();
            setOtherUser(profile);

            // Fetch messages
            const { data: msgs } = await supabase
                .from("direct_messages")
                .select("*")
                .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id})`)
                .order("created_at", { ascending: true });

            if (msgs) {
                setMessages(msgs);

                // Mark unread messages from other user as read
                const unreadIds = msgs
                    .filter(m => m.sender_id === otherUserId && !m.read_at)
                    .map(m => m.id);

                if (unreadIds.length > 0) {
                    await supabase
                        .from("direct_messages")
                        .update({ read_at: new Date().toISOString() })
                        .in("id", unreadIds);
                }
            }
            setLoading(false);
        };

        fetchChatData();
    }, [otherUserId, currentUser?.id]);

    // 3. Real-time Subscription (Presence, Typing, Messages)
    useEffect(() => {
        if (!currentUser) return;

        // generated shared room ID so both users are in the same channel
        const roomId = [currentUser.id, otherUserId].sort().join('_');
        const channel = supabase.channel(`chat_room:${roomId}`);

        channel
            // Presence: Track if friend is online
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                // Check if otherUserId is in the presence state
                const isFriendOnline = Object.values(state).some((presences: any) =>
                    presences.some((p: any) => p.user_id === otherUserId)
                );
                setIsOnline(isFriendOnline);
            })
            // Broadcast: Typing Indicators
            .on('broadcast', { event: 'typing' }, (payload) => {
                if (payload.payload.user_id === otherUserId) {
                    setIsTyping(true);
                    // Auto-clear typing after 3s if no new event
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
                }
            })
            // Database: New Messages
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, async (payload) => {
                const newMsg = payload.new as Message;

                if (
                    (newMsg.sender_id === otherUserId) ||
                    (newMsg.sender_id === currentUser.id && newMsg.receiver_id === otherUserId)
                ) {
                    setMessages(prev => {
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });

                    // If received while looking, mark as read immediately
                    if (newMsg.sender_id === otherUserId) {
                        await supabase
                            .from("direct_messages")
                            .update({ read_at: new Date().toISOString() })
                            .eq("id", newMsg.id);
                    }
                }
            })
            // Database: Update (Read Receipts)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'direct_messages' }, (payload) => {
                const updatedMsg = payload.new as Message;
                setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    // Track MY presence
                    await channel.track({ user_id: currentUser.id, online_at: new Date().toISOString() });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [otherUserId, currentUser?.id]);

    // Scroll to bottom effect
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // Handle Typing Broadcast
    const handleTyping = async () => {
        const roomId = [currentUser.id, otherUserId].sort().join('_');
        const channel = supabase.channel(`chat_room:${roomId}`);
        await channel.send({
            type: 'broadcast',
            event: 'typing',
            payload: { user_id: currentUser?.id }
        });
    };

    const handleReaction = async (messageId: string, type: 'bow' | 'dislike') => {
        if (!currentUser) return;

        // Find message
        const msg = messages.find(m => m.id === messageId);
        if (!msg) return;

        // Current reactions
        const currentReactions = msg.reactions || {};
        const myReaction = currentReactions[currentUser.id];

        // Toggle logic: if clicking same type, remove it. If different, update it.
        let newReactions = { ...currentReactions };
        if (myReaction === type) {
            delete newReactions[currentUser.id];
        } else {
            newReactions[currentUser.id] = type;
        }

        // Optimistic Update
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: newReactions } : m));

        // DB Update
        await supabase
            .from("direct_messages")
            .update({ reactions: newReactions })
            .eq("id", messageId);
    };

    const handleDoubleTap = (messageId: string) => {
        handleReaction(messageId, 'bow');
    };

    const handleDelete = async (messageId: string) => {
        if (!confirm("Are you sure you want to delete this message?")) return;

        // Optimistic
        setMessages(prev => prev.filter(m => m.id !== messageId));

        const { error } = await supabase.from("direct_messages").delete().eq("id", messageId);
        if (error) {
            console.error("Error deleting message:", error);
            // Revert would be complex without refetch, but acceptable for MVP
            alert("Failed to delete message");
        }
    };

    const startEditing = (msg: Message) => {
        setEditingMessageId(msg.id);
        setEditContent(msg.content);
    };

    const saveEdit = async () => {
        if (!editingMessageId || !editContent.trim()) return;

        const updatedContent = editContent.trim();
        const msgId = editingMessageId; // capture closure

        // Optimistic
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: updatedContent, is_edited: true } : m));
        setEditingMessageId(null);
        setEditContent("");

        const { error } = await supabase
            .from("direct_messages")
            .update({ content: updatedContent, is_edited: true })
            .eq("id", msgId);

        if (error) {
            console.error("Error updating message:", error);
            alert("Failed to update message");
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !currentUser) return;

        const content = newMessage;
        setNewMessage("");

        // Optimistic Update
        const tempMsg: Message = {
            id: `temp-${Date.now()}`,
            content: content,
            sender_id: currentUser.id,
            receiver_id: otherUserId,
            created_at: new Date().toISOString(),
            read_at: null,
            reactions: {}
        };

        setMessages(prev => [...prev, tempMsg]);

        // Send to DB
        const { data, error } = await supabase.from("direct_messages").insert({
            sender_id: currentUser.id,
            receiver_id: otherUserId,
            content: content,
            reactions: {}
        }).select().single();

        if (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message");
            setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
        } else if (data) {
            setMessages(prev => {
                // If real message already exists (from Realtime), just remove the temp one
                if (prev.some(m => m.id === data.id)) {
                    return prev.filter(m => m.id !== tempMsg.id);
                }
                // Otherwise replace temp with real
                return prev.map(m => m.id === tempMsg.id ? data : m);
            });
        }
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center text-warm-grey/40">Loading chat...</div>
    );

    return (
        <div className="flex flex-col h-full bg-stone-50/30">
            {/* Header */}
            <header className="bg-white border-b border-warm-grey/5 p-4 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <Link href="/messages" className="md:hidden p-2 -ml-2 text-warm-grey/60 hover:bg-stone-100 rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>

                    <div className="relative">
                        <Link href={`/profile/${otherUser?.username || otherUserId}`}>
                            <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden border border-white shadow-sm hover:opacity-90 transition-opacity">
                                {otherUser?.avatar_url ? (
                                    <img src={otherUser.avatar_url} alt={otherUser.username} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-warm-grey font-serif">
                                        {otherUser?.first_name?.[0]}
                                    </div>
                                )}
                            </div>
                        </Link>
                        {/* Real Presence Indicator */}
                        {isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full animate-pulse-slow"></div>
                        )}
                    </div>
                    <div>
                        <Link href={`/profile/${otherUser?.username || otherUserId}`} className="hover:underline decoration-warm-grey/40">
                            <h1 className="font-bold text-warm-grey text-sm">
                                {otherUser ? `${otherUser.first_name} ${otherUser.last_name}` : "Sister"}
                            </h1>
                        </Link>
                        <p className="text-xs text-warm-grey/40 font-medium">
                            {isOnline ? "Online Now" : "Offline"}
                        </p>
                    </div>
                </div>
                <button className="p-2 text-warm-grey/40 hover:bg-stone-100 rounded-full">
                    <MoreVertical className="w-5 h-5" />
                </button>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center py-10 text-warm-grey/40 text-sm">
                        <p>No messages yet.</p>
                        <p>Say hello to {otherUser?.first_name}! 👋</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.sender_id === currentUser?.id;
                        const showAvatar = !isMe && (index === 0 || messages[index - 1].sender_id !== msg.sender_id);

                        return (
                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-2`}>
                                <div className={`flex ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[80%] group/message relative`}>
                                    {!isMe && (
                                        <div className="w-6 h-6 rounded-full bg-stone-200 overflow-hidden mx-2 flex-shrink-0 mb-1 opacity-0" style={{ opacity: showAvatar ? 1 : 0 }}>
                                            {otherUser?.avatar_url && <img src={otherUser.avatar_url} className="w-full h-full object-cover" />}
                                        </div>
                                    )}

                                    {/* Hover Actions */}
                                    <div className={`absolute top-0 opacity-0 group-hover/message:opacity-100 transition-opacity flex gap-1 -translate-y-1/2 z-10 ${isMe ? 'right-full mr-2' : 'left-full ml-2'}`}>
                                        <button
                                            onClick={() => handleReaction(msg.id, 'bow')}
                                            className="w-7 h-7 bg-white rounded-full shadow-sm border border-warm-grey/10 flex items-center justify-center hover:scale-110 transition-transform text-muted-rose font-serif text-xs"
                                            title="Like"
                                        >
                                            ౨ৎ
                                        </button>
                                        <button
                                            onClick={() => handleReaction(msg.id, 'dislike')}
                                            className="w-7 h-7 bg-white rounded-full shadow-sm border border-warm-grey/10 flex items-center justify-center hover:scale-110 transition-transform text-warm-grey/60 text-[10px]"
                                            title="Dislike"
                                        >
                                            :(
                                        </button>

                                        {isMe && (
                                            <>
                                                <button
                                                    onClick={() => startEditing(msg)}
                                                    className="w-7 h-7 bg-white rounded-full shadow-sm border border-warm-grey/10 flex items-center justify-center hover:scale-110 transition-transform text-warm-grey/60"
                                                    title="Edit"
                                                >
                                                    <Pencil className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(msg.id)}
                                                    className="w-7 h-7 bg-white rounded-full shadow-sm border border-warm-grey/10 flex items-center justify-center hover:scale-110 transition-transform text-red-400"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <div
                                        onDoubleClick={() => handleDoubleTap(msg.id)}
                                        className={`px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm relative cursor-pointer select-none transition-all ${isMe
                                            ? 'bg-muted-rose text-white rounded-tr-sm'
                                            : 'bg-white text-warm-grey rounded-tl-sm border border-warm-grey/5'
                                            }`}
                                    >
                                        {/* Edit Mode vs View Mode */}
                                        {editingMessageId === msg.id ? (
                                            <div className="flex flex-col gap-2 min-w-[200px]" onClick={e => e.stopPropagation()}>
                                                <input
                                                    value={editContent}
                                                    onChange={e => setEditContent(e.target.value)}
                                                    className="text-black bg-white/90 rounded px-2 py-1 text-sm w-full"
                                                    autoFocus
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => setEditingMessageId(null)} className="text-xs opacity-80 hover:opacity-100">Cancel</button>
                                                    <button onClick={saveEdit} className="text-xs font-bold bg-white/20 px-2 py-1 rounded hover:bg-white/30">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                {msg.metadata && (
                                                    <Link
                                                        href={
                                                            msg.metadata.type === 'vibe' ? '/vibe-board' :
                                                                msg.metadata.type === 'verse' ? '/diaries' :
                                                                    msg.metadata.type === 'question' ? '/velvet-vault' :
                                                                        msg.metadata.type === 'prayer' ? '/prayer-pocket' :
                                                                            '/home'
                                                        }
                                                        className="block mb-2 p-2 rounded-lg bg-black/5 hover:bg-black/10 transition-colors flex gap-3 items-center max-w-xs cursor-pointer text-left"
                                                    >
                                                        {msg.metadata.image && (
                                                            <img src={msg.metadata.image} className="w-10 h-10 rounded-md object-cover bg-white" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold opacity-90 truncate">{msg.metadata.title || "Shared Content"}</p>
                                                            <p className="text-[10px] opacity-70 capitalize">{msg.metadata.type}</p>
                                                        </div>
                                                    </Link>
                                                )}

                                                {renderContentWithStickers(msg.content)}
                                                {msg.is_edited && <span className="text-[9px] opacity-60 ml-1 italic">(edited)</span>}
                                            </>
                                        )}

                                        <div className={`flex items-center gap-1 mt-1 text-[9px] ${isMe ? 'text-white/70 justify-end' : 'text-warm-grey/40 justify-start'}`}>
                                            {formatMessageTime(msg.created_at)}
                                            {/* Read Receipt */}
                                            {isMe && (
                                                <span className="opacity-80">
                                                    {msg.read_at ? (
                                                        <CheckCheck className="w-3 h-3" />
                                                    ) : (
                                                        <Check className="w-3 h-3" />
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        {/* Reactions Display */}
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
                            </div>
                        );
                    })
                )}

                {/* Typing Indicator */}
                {isTyping && (
                    <div className="flex items-center gap-2 ml-10 mb-2">
                        <div className="bg-white border border-warm-grey/10 px-3 py-2 rounded-full rounded-tl-none shadow-sm flex items-center gap-1">
                            <span className="animate-bounce font-serif text-muted-rose text-xs" style={{ animationDelay: '0ms' }}>౨ৎ</span>
                            <span className="animate-bounce font-serif text-muted-rose text-xs" style={{ animationDelay: '150ms' }}>౨ৎ</span>
                            <span className="animate-bounce font-serif text-muted-rose text-xs" style={{ animationDelay: '300ms' }}>౨ৎ</span>
                        </div>
                        <span className="text-xs text-warm-grey/40">{otherUser?.first_name} is typing...</span>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-warm-grey/5">
                {/* Live Sticker Preview */}
                {newMessage.includes('[sticker:') && (
                    <div className="flex gap-2 mb-2 px-2 overflow-x-auto pb-2">
                        {newMessage.match(/\[sticker:([^\]]+)\]/g)?.map((match, i) => {
                            const name = match.replace('[sticker:', '').replace(']', '');
                            // Quick render for preview (reusing logic would be better but simple map is fine for MVP)
                            return (
                                <div key={i} className="bg-stone-50 border border-warm-grey/10 rounded-full px-3 py-1 flex items-center gap-2 text-xs text-warm-grey animate-pop-in">
                                    <span className="font-medium">{name}</span>
                                    <button
                                        onClick={() => setNewMessage(prev => prev.replace(match, ''))}
                                        className="hover:text-red-400"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}

                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex items-center gap-2 bg-stone-50 p-2 rounded-full border border-warm-grey/10 focus-within:ring-2 focus-within:ring-muted-rose/20 transition-all"
                >
                    <StickerPicker onSelect={(badge) => setNewMessage(prev => `${prev} [sticker:${badge.name}]`)} />

                    <div className="relative flex-1">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={handleInputChange}
                            placeholder="Type a message..."
                            className="w-full bg-transparent px-4 py-2 text-sm text-warm-grey placeholder:text-warm-grey/40 focus:outline-none"
                        />
                        {/* Mention Autocomplete Dropdown */}
                        {isMentionOpen && mentionResults.length > 0 && (
                            <div className="absolute left-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-lg border border-warm-grey/10 overflow-hidden z-50 animate-fade-in-up">
                                {mentionResults.map((profile) => (
                                    <button
                                        key={profile.id}
                                        type="button"
                                        className="w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-stone-50 transition-colors"
                                        onClick={() => insertMention(profile.username)}
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
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-2 bg-muted-rose text-white rounded-full hover:bg-muted-rose/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-muted-rose/20"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
}
