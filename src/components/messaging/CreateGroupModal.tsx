"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Plus, X, Search, Check, Users } from "lucide-react";

type Friend = {
    id: string;
    username: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
};

export function CreateGroupModal({ onGroupCreated }: { onGroupCreated: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriendIds, setSelectedFriendIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        if (isOpen) {
            fetchFriends();
        }
    }, [isOpen]);

    const fetchFriends = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

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

        if (friendshipsData) {
            const friendList = friendshipsData.map((f: any) => {
                if (f.user_id_1 === user.id) return f.user2;
                return f.user1;
            });
            setFriends(friendList);
        }
    };

    const toggleFriend = (id: string) => {
        const newSelected = new Set(selectedFriendIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedFriendIds(newSelected);
    };

    const handleCreate = async () => {
        if (!groupName.trim() || selectedFriendIds.size === 0) return;
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Create Group
        const { data: group, error: groupError } = await supabase
            .from("groups")
            .insert({
                name: groupName,
                admin_id: user.id
            })
            .select()
            .single();

        if (groupError || !group) {
            console.error("Group creation error:", groupError);
            alert(`Failed to create group: ${groupError?.message || "Unknown error"}`);
            setLoading(false);
            return;
        }

        // 2. Add Members (Self + Selected)
        const membersToAdd = [
            { group_id: group.id, user_id: user.id },
            ...Array.from(selectedFriendIds).map(fid => ({ group_id: group.id, user_id: fid }))
        ];

        const { error: membersError } = await supabase
            .from("group_members")
            .insert(membersToAdd);

        if (membersError) {
            console.error("Error adding members:", membersError);
            alert("Group created but failed to add some members.");
        }

        setLoading(false);
        setIsOpen(false);
        setGroupName("");
        setSelectedFriendIds(new Set());
        onGroupCreated();
    };

    const filteredFriends = friends.filter(f =>
        f.first_name.toLowerCase().includes(search.toLowerCase()) ||
        f.last_name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 ml-2 bg-stone-100 hover:bg-stone-200 rounded-full text-warm-grey transition-colors"
                title="Create Group"
            >
                <Plus className="w-5 h-5" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-cocoa/20 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-white/50 flex flex-col max-h-[80vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-warm-grey/5 flex justify-between items-center">
                            <h2 className="font-serif text-xl text-warm-cocoa">New Group Chat</h2>
                            <button onClick={() => setIsOpen(false)} className="text-warm-grey/40 hover:text-warm-grey">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Group Name */}
                            <div>
                                <label className="block text-xs font-medium text-warm-grey mb-2 ml-1">GROUP NAME</label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-grey/40" />
                                    <input
                                        type="text"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        placeholder="e.g. Prayer Warriors"
                                        className="w-full pl-10 p-3 bg-stone-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-muted-rose/20"
                                    />
                                </div>
                            </div>

                            {/* Friend Selection */}
                            <div>
                                <label className="block text-xs font-medium text-warm-grey mb-2 ml-1">ADD FRIENDS</label>
                                <div className="relative mb-3">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-warm-grey/40" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search..."
                                        className="w-full pl-8 p-2 bg-white border border-warm-grey/10 rounded-lg text-xs"
                                    />
                                </div>

                                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                    {filteredFriends.map(friend => {
                                        const isSelected = selectedFriendIds.has(friend.id);
                                        return (
                                            <div
                                                key={friend.id}
                                                onClick={() => toggleFriend(friend.id)}
                                                className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${isSelected ? "bg-muted-rose/10 border border-muted-rose/20" : "hover:bg-stone-50 border border-transparent"
                                                    }`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-stone-200 overflow-hidden">
                                                    {friend.avatar_url ? (
                                                        <img src={friend.avatar_url} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="w-full h-full flex items-center justify-center text-[10px]">
                                                            {friend.first_name[0]}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium ${isSelected ? "text-muted-rose" : "text-warm-grey"}`}>
                                                        {friend.first_name} {friend.last_name}
                                                    </p>
                                                    <p className="text-[10px] text-warm-grey/40">@{friend.username}</p>
                                                </div>
                                                {isSelected && <Check className="w-4 h-4 text-muted-rose" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-warm-grey/5">
                            <Button
                                onClick={handleCreate}
                                disabled={!groupName.trim() || selectedFriendIds.size === 0 || loading}
                                className="w-full bg-muted-rose hover:bg-muted-rose/90 text-white rounded-xl h-11 shadow-md shadow-muted-rose/20"
                            >
                                {loading ? "Creating..." : `Create Group (${selectedFriendIds.size})`}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
