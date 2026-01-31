"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Search, Send, Check } from "lucide-react";

type Friend = {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
};

type ShareContent = {
    type: 'post' | 'verse' | 'vibe';
    id: string;
    title?: string;
    image?: string;
    content?: string;
};

type ShareModalProps = {
    isOpen: boolean;
    onClose: () => void;
    content: ShareContent;
};

export function ShareModal({ isOpen, onClose, content }: ShareModalProps) {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
    const [sending, setSending] = useState(false);
    const [messageText, setMessageText] = useState("");
    const supabase = createClient();

    useEffect(() => {
        if (isOpen) {
            fetchFriends();
        } else {
            // Reset state on close
            setSelectedFriendIds([]);
            setMessageText("");
            setSearchQuery("");
        }
    }, [isOpen]);

    const fetchFriends = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch accepted friendships
        const { data, error } = await supabase
            .from("friendships")
            .select(`
                user_id_1,
                user_id_2,
                user1:profiles!friendships_user_id_1_fkey(id, username, first_name, last_name, avatar_url),
                user2:profiles!friendships_user_id_2_fkey(id, username, first_name, last_name, avatar_url)
            `)
            .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
            .eq("status", "accepted");

        if (data) {
            const friendList = data.map((f: any) => {
                // Determine which profile is the friend (not the current user)
                if (f.user_id_1 === user.id) return f.user2;
                return f.user1;
            });
            setFriends(friendList);
        }
    };

    const handleSend = async () => {
        if (selectedFriendIds.length === 0) return;
        setSending(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setSending(false);
            return;
        }

        try {
            // Send message to each selected friend
            const promises = selectedFriendIds.map(async (friendId) => {
                return supabase.from("direct_messages").insert({
                    sender_id: user.id,
                    receiver_id: friendId,
                    content: messageText.trim() || `Shared a ${content.type}`,
                    metadata: content,
                    reactions: {}
                });
            });

            await Promise.all(promises);
            onClose();
        } catch (error) {
            console.error("Error sharing:", error);
            alert("Failed to share.");
        } finally {
            setSending(false);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedFriendIds(prev =>
            prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
        );
    };

    const filteredFriends = friends.filter(f => {
        const query = searchQuery.toLowerCase();
        return (
            (f.first_name?.toLowerCase() || "").includes(query) ||
            (f.last_name?.toLowerCase() || "").includes(query) ||
            (f.username?.toLowerCase() || "").includes(query)
        );
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-warm-cocoa/20 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border border-warm-grey/5">
                <div className="p-4 border-b border-warm-grey/5 flex justify-between items-center bg-stone-50/50">
                    <h3 className="font-serif text-lg text-warm-cocoa">Share {content.title ? `"${content.title}"` : "this"}</h3>
                    <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-stone-200/50 transition-colors group">
                        <X className="w-6 h-6 text-warm-grey/60 group-hover:text-warm-grey" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Content Preview */}
                    <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-warm-grey/5">
                        {content.image && (
                            <img src={content.image} className="w-12 h-12 rounded-lg object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-warm-grey truncate">{content.title || "Content"}</p>
                            <p className="text-xs text-warm-grey/60 capitalize">{content.type}</p>
                        </div>
                    </div>

                    {/* Check users */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-grey/40" />
                        <input
                            type="text"
                            placeholder="Search friends..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-3 bg-stone-50 rounded-xl border border-transparent focus:bg-white focus:border-muted-rose/20 focus:ring-2 focus:ring-muted-rose/10 transition-all text-sm outline-none"
                        />
                    </div>

                    {/* Friend List */}
                    <div className="max-h-48 overflow-y-auto space-y-1">
                        {filteredFriends.map(friend => {
                            const isSelected = selectedFriendIds.includes(friend.id);
                            return (
                                <div
                                    key={friend.id}
                                    onClick={() => toggleSelection(friend.id)}
                                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${isSelected ? "bg-muted-rose/10" : "hover:bg-stone-50"}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-stone-200 overflow-hidden flex-shrink-0">
                                        {friend.avatar_url ? (
                                            <img src={friend.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-warm-grey">
                                                {friend.first_name[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-warm-grey leading-none">{friend.first_name} {friend.last_name}</p>
                                        <p className="text-[10px] text-warm-grey/40">@{friend.username}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? "bg-muted-rose border-muted-rose" : "border-warm-grey/20"}`}>
                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                </div>
                            );
                        })}
                        {filteredFriends.length === 0 && (
                            <p className="text-center text-xs text-warm-grey/40 py-2">No friends found.</p>
                        )}
                    </div>

                    {/* Message Input */}
                    <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Write a message (optional)..."
                        className="w-full p-3 bg-stone-50 rounded-xl border border-transparent focus:bg-white focus:border-muted-rose/20 focus:ring-2 focus:ring-muted-rose/10 transition-all text-sm outline-none resize-none h-20"
                    />

                    <button
                        onClick={handleSend}
                        disabled={selectedFriendIds.length === 0 || sending}
                        className="w-full py-3 bg-muted-rose text-white rounded-xl font-medium shadow-lg shadow-muted-rose/20 hover:bg-muted-rose/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {sending ? "Sending..." : (
                            <>
                                Send <Send className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
