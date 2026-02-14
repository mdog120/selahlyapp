"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams } from "next/navigation";
import { Send, Phone, Video, Info, Smile, Image as ImageIcon, Mic, X, MoreVertical, Users, Hash, Flame, Feather, Heart, Mail, Sun, Flower2, CloudSun, TreeDeciduous, Star, ArrowLeft, Check, CheckCheck, Settings } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { GroupSettingsModal } from "@/components/messaging/GroupSettingsModal";
import { StickerPicker } from "@/components/gamification/StickerPicker";

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
            // In a group chat, we should ideally restrict mentions to GROUP MEMBERS.
            // But for now, global search is easier, or we filter `group.members`.
            // Filtering group members is better UX.
            if (group?.members) {
                const lowerQuery = mentionQuery.toLowerCase();
                const matches = group.members
                    .filter((m: any) =>
                        m.profile.username?.toLowerCase().includes(lowerQuery) ||
                        m.profile.first_name.toLowerCase().includes(lowerQuery)
                    )
                    .map((m: any) => ({
                        id: m.user_id,
                        username: m.profile.username,
                        first_name: m.profile.first_name,
                        avatar_url: m.profile.avatar_url
                    }))
                    .slice(0, 5);

                if (matches.length > 0) {
                    setMentionResults(matches);
                    setIsMentionOpen(true);
                } else {
                    setMentionResults([]);
                    setIsMentionOpen(false);
                }
            }
        };
        // Debounce logic is a bit manual here, but since it's local filtering it's fine to run immediately or debounce slightly
        const timeoutId = setTimeout(fetchProfiles, 100);
        return () => clearTimeout(timeoutId);
    }, [mentionQuery, group]);

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
    }

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

            // Notify Mentioned Users
            const mentions = content.match(/@([\w.-]+)/g);
            if (mentions) {
                const uniqueMentions = [...new Set(mentions)];
                for (const mention of uniqueMentions) {
                    const username = mention.substring(1);
                    await supabase.rpc('notify_mention', {
                        target_username: username,
                        resource_id: groupId,
                        resource_type: 'group_chat'
                    });
                }
            }
        }
    };

    // Helper to render stickers
    const renderContentWithStickers = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(\[sticker:[^\]]+\]|@[\w.-]+)/g);
        return parts.map((part, index) => {
            const stickerMatch = part.match(/\[sticker:(.+)\]/);
            if (stickerMatch) {
                // ... sticker logic ...
                const stickerName = stickerMatch[1];
                let Icon = Star;
                let color = "text-yellow-400";

                // Reusing the map from above is hard without copy-paste or refactoring. 
                // I will just copy-paste the switch/map logic or assume it is kept if I don't replace it.
                // Wait, use replace_file_content with context.

                switch (stickerName) {
                    case 'Candle': Icon = Flame; color = "text-orange-300"; break;
                    case 'Feather': Icon = Feather; color = "text-stone-400"; break;
                    case 'Users': Icon = Users; color = "text-rose-400"; break;
                    case 'Heart': Icon = Heart; color = "text-pink-400"; break;
                    case 'Prayer Warrior': Icon = Users; color = "text-blue-400"; break;
                    case 'Encourager': Icon = Mail; color = "text-purple-400"; break;
                    case 'Sunshine': Icon = Sun; color = "text-yellow-400"; break;
                    case 'Bloom': Icon = Flower2; color = "text-pink-300"; break;
                    case 'Peace': Icon = CloudSun; color = "text-sky-400"; break;
                    case 'Rooted': Icon = TreeDeciduous; color = "text-green-600"; break;
                    case 'Star': Icon = Star; color = "text-yellow-400"; break;
                    case 'Selah Circle': Icon = Users; color = "text-sage-green"; break;
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
                {/* Live Sticker Preview */}
                {newMessage.includes('[sticker:') && (
                    <div className="flex gap-2 mb-2 px-2 overflow-x-auto pb-2">
                        {newMessage.match(/\[sticker:([^\]]+)\]/g)?.map((match, i) => {
                            const name = match.replace('[sticker:', '').replace(']', '');
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

                {/* Mention Autocomplete */}
                {isMentionOpen && mentionResults.length > 0 && (
                    <div className="absolute bottom-20 left-4 w-48 bg-white rounded-xl shadow-lg border border-warm-grey/10 overflow-hidden z-20 animate-fade-in-up">
                        {mentionResults.map((profile) => (
                            <button
                                key={profile.id}
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

                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex items-center gap-2 bg-stone-50 p-2 rounded-full border border-warm-grey/10 focus-within:ring-2 focus-within:ring-muted-rose/20 transition-all"
                >
                    <StickerPicker onSelect={(badge) => setNewMessage(prev => `${prev} [sticker:${badge.name}]`)} />

                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
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
