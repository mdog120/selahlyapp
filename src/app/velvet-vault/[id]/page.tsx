"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, MessageSquare, Send, X } from "lucide-react";
import Link from "next/link";
import { getAnonymousAlias } from "@/lib/vaultHelper";

type Thread = {
    id: string;
    user_id: string;
    title: string;
    category: string;
    created_at: string;
    is_anonymous?: boolean;
    author?: {
        username: string;
        first_name: string;
        last_name: string;
        avatar_url: string;
    } | null;
};

type Message = {
    id: string;
    user_id?: string;
    content: string;
    created_at: string;
    is_anonymous?: boolean;
    author?: {
        username: string;
        first_name: string;
        last_name: string;
        avatar_url: string;
    } | null;
};

export default function ThreadPage() {
    const params = useParams();
    const threadId = params.id as string;

    const [thread, setThread] = useState<Thread | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isReplying, setIsReplying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isAnonymousReply, setIsAnonymousReply] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            // Fetch User
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setCurrentUserId(user.id);

            // Fetch Thread
            const { data: threadData } = await supabase
                .from("threads")
                .select(`*, author:profiles!threads_user_id_fkey(username, first_name, last_name, avatar_url)`)
                .eq("id", threadId)
                .single();

            if (threadData) setThread(threadData as any);

            // Fetch Messages
            const { data: messagesData } = await supabase
                .from("thread_messages")
                .select(`*, author:profiles!thread_messages_user_id_fkey(username, first_name, last_name, avatar_url)`)
                .eq("thread_id", threadId)
                .order("created_at", { ascending: true });

            if (messagesData) setMessages(messagesData as any);

            setLoading(false);
        };
        fetchData();
    }, [threadId]);

    const handleReply = async () => {
        if (!newMessage.trim()) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic Update
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

        const fakeMessage: Message = {
            id: Date.now().toString(),
            user_id: user.id,
            content: newMessage,
            created_at: new Date().toISOString(),
            is_anonymous: isAnonymousReply,
            author: isAnonymousReply ? null : {
                username: profile?.username || "me",
                first_name: profile?.first_name || "Me",
                last_name: profile?.last_name || "",
                avatar_url: profile?.avatar_url || ""
            }
        };

        setMessages([...messages, fakeMessage]);
        setNewMessage("");
        setIsReplying(false);
        const savedIsAnonymous = isAnonymousReply;
        setIsAnonymousReply(false);

        await supabase.from("thread_messages").insert({
            thread_id: threadId,
            user_id: user.id,
            content: newMessage,
            is_anonymous: savedIsAnonymous
        });

        // Increment message count on thread
        await supabase.rpc('increment_thread_messages', { thread_uuid: threadId });
    };

    const getInitials = (first?: string, last?: string) => {
        return (first?.[0] || "") + (last?.[0] || "");
    };

    const getAnonymousInitials = (alias: string) => {
        const parts = alias.split(" ");
        return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
    };

    if (loading) return <div className="min-h-screen bg-warm-paper flex items-center justify-center text-warm-grey/40">Opening vault...</div>;
    if (!thread) return <div className="min-h-screen bg-warm-paper flex items-center justify-center text-warm-grey">Thread not found.</div>;

    return (
        <div className="min-h-screen bg-warm-paper font-sans">
            <Navbar />
            <main className="container mx-auto px-4 pt-24 pb-20 max-w-3xl">
                <Link href="/velvet-vault" className="inline-flex items-center gap-2 text-warm-grey/60 hover:text-warm-grey mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Vault
                </Link>

                {/* Main Question */}
                <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-sm border border-white mb-8 animate-fade-in-up">
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-deep-velvet/5 text-deep-velvet mb-4">
                        {thread.category}
                    </span>
                    <h1 className="font-serif text-2xl md:text-3xl text-warm-cocoa mb-6 leading-relaxed">
                        {thread.title}
                    </h1>

                    <div className="flex items-center justify-between pt-6 border-t border-warm-grey/10">
                        {thread.is_anonymous ? (
                            <div className="flex items-center gap-3 select-none">
                                <div className="w-10 h-10 rounded-full bg-deep-velvet/10 flex items-center justify-center text-xs font-bold text-deep-velvet">
                                    {getAnonymousInitials(getAnonymousAlias(thread.user_id))}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-warm-grey">{getAnonymousAlias(thread.user_id)}</p>
                                    <p className="text-xs text-warm-grey/40">{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</p>
                                </div>
                            </div>
                        ) : (
                            <Link href={`/profile/${thread.author?.username || ""}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                <div className="w-10 h-10 rounded-full bg-soft-blush flex items-center justify-center text-xs font-medium text-warm-grey overflow-hidden">
                                    {thread.author?.avatar_url ? (
                                        <img src={thread.author.avatar_url} alt={thread.author.username} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{getInitials(thread.author?.first_name, thread.author?.last_name)}</span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-warm-grey">{thread.author?.first_name || "Sister"} {thread.author?.last_name ? thread.author.last_name[0] + "." : ""}</p>
                                    <p className="text-xs text-warm-grey/40">{formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}</p>
                                </div>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Answers / Discussion */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-warm-grey/60 mb-4 px-2">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-widest">{messages.length} Responses</span>
                    </div>

                    {messages.map((msg) => {
                        const isAnon = msg.is_anonymous;
                        const alias = getAnonymousAlias(msg.user_id);
                        return (
                            <div key={msg.id} className="flex gap-4 animate-fade-in-up">
                                {isAnon ? (
                                    <div className="flex-shrink-0 select-none">
                                        <div className="w-8 h-8 rounded-full bg-deep-velvet/10 flex items-center justify-center text-[10px] text-deep-velvet font-bold">
                                            {getAnonymousInitials(alias)}
                                        </div>
                                    </div>
                                ) : (
                                    <Link href={`/profile/${msg.author?.username || ""}`} className="flex-shrink-0 hover:opacity-80 transition-opacity">
                                        <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-[10px] text-warm-grey font-medium overflow-hidden">
                                            {msg.author?.avatar_url ? (
                                                <img src={msg.author.avatar_url} alt={msg.author.username} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{getInitials(msg.author?.first_name, msg.author?.last_name)}</span>
                                            )}
                                        </div>
                                    </Link>
                                )}
                                <div className="flex-1 bg-white/60 p-4 rounded-2xl rounded-tl-none border border-white/50">
                                    <div className="flex justify-between items-baseline mb-1">
                                        {isAnon ? (
                                            <span className="text-xs font-bold text-warm-grey select-none">{alias}</span>
                                        ) : (
                                            <Link href={`/profile/${msg.author?.username || ""}`} className="text-xs font-bold text-warm-grey hover:underline">
                                                {msg.author?.first_name || "Sister"}
                                            </Link>
                                        )}
                                        <span className="text-[10px] text-warm-grey/30">{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
                                    </div>
                                    <p className="text-warm-grey text-sm leading-relaxed">{msg.content}</p>
                                </div>
                            </div>
                        );
                    })}

                    {/* Reply Box */}
                    <div className="mt-8 bg-white p-4 rounded-3xl shadow-lg shadow-warm-grey/5 border border-white sticky bottom-6 flex flex-col gap-3">
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Share your wisdom gently..."
                                className="flex-1 bg-stone-50 border-none rounded-xl px-4 py-3 text-sm text-warm-grey focus:ring-2 ring-deep-velvet/10 outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                            />
                            <Button
                                onClick={handleReply}
                                disabled={!newMessage.trim()}
                                className="bg-deep-velvet hover:bg-deep-velvet/90 text-white rounded-xl px-4"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 py-0.5 ml-1 select-none">
                            <input
                                type="checkbox"
                                id="reply-anonymous"
                                checked={isAnonymousReply}
                                onChange={(e) => setIsAnonymousReply(e.target.checked)}
                                className="rounded border-warm-grey/30 text-deep-velvet focus:ring-deep-velvet bg-transparent w-4 h-4 cursor-pointer"
                            />
                            <label htmlFor="reply-anonymous" className="text-xs text-warm-grey/70 cursor-pointer">
                                Reply anonymously as <span className="font-semibold text-deep-velvet">{getAnonymousAlias(currentUserId)}</span>
                            </label>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
