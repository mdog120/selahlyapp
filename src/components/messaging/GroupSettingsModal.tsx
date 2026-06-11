"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { X, Search, Check, Trash2, Shield, LogOut, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

type Member = {
    user_id: string;
    profile: {
        id: string;
        username: string;
        first_name: string;
        last_name: string;
        avatar_url: string;
    };
    joined_at: string;
};

export function GroupSettingsModal({
    groupId,
    isAdmin,
    currentUserId,
    isOpen,
    onClose
}: {
    groupId: string;
    isAdmin: boolean;
    currentUserId: string;
    isOpen: boolean;
    onClose: () => void;
}) {
    const [members, setMembers] = useState<Member[]>([]);
    const [friends, setFriends] = useState<any[]>([]); // For adding new members
    const [search, setSearch] = useState("");
    const [isAddMode, setIsAddMode] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editImage, setEditImage] = useState("");
    const [uploading, setUploading] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        if (!isOpen) return; // Wait for modal to be open
        fetchMembers();
        fetchGroupDetails();
    }, [groupId, isOpen]);

    useEffect(() => {
        if (isAddMode) fetchFriends();
    }, [isAddMode]);

    const fetchGroupDetails = async () => {
        const { data } = await supabase.from("groups").select("name, image_url").eq("id", groupId).single();
        if (data) {
            setEditName(data.name);
            setEditImage(data.image_url || "");
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `group-${groupId}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            let bucket = 'posts';
            let { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) {
                console.warn("Upload to 'posts' failed, trying 'avatars'", uploadError);
                bucket = 'avatars';
                const { error: retryError } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, file);
                if (retryError) throw retryError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);

            setEditImage(publicUrl);

        } catch (error: any) {
            alert(error.message || 'Error uploading image! Ensure storage buckets are set up.');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const fetchMembers = async () => {
        const { data, error } = await supabase
            .from("group_members")
            .select(`
                user_id,
                joined_at,
                profile:profiles!group_members_user_id_fkey(*)
            `)
            .eq("group_id", groupId);

        if (error) console.error("Error fetching members:", error);
        if (data) setMembers(data as any);
    };

    const handleUpdateGroup = async () => {
        if (!editName.trim()) return;

        const { error } = await supabase
            .from("groups")
            .update({ name: editName, image_url: editImage })
            .eq("id", groupId);

        if (error) {
            alert(`Failed to update group: ${error.message}`);
        } else {
            setIsEditing(false);
            window.location.reload(); // Refresh to show new details
        }
    };

    const handleDeleteGroup = async () => {
        if (!confirm("Are you sure? This will delete the group and all messages for everyone.")) return;

        const { error } = await supabase.from("groups").delete().eq("id", groupId);

        if (error) {
            alert(`Failed to delete group: ${error.message}`);
        } else {
            router.push("/messages");
        }
    };

    const fetchFriends = async () => {
        // Reuse friend fetch logic to find people NOT in the group
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: friendshipsData } = await supabase
            .from("friendships")
            .select(`
                user_id_1,
                user_id_2,
                user1:profiles!friendships_user_id_1_fkey(*),
                user2:profiles!friendships_user_id_2_fkey(*)
            `)
            .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
            .eq("status", "accepted");

        if (friendshipsData) {
            const friendList = friendshipsData.map((f: any) => {
                if (f.user_id_1 === user.id) return f.user2;
                return f.user1;
            });

            // Filter out existing members
            const memberIds = new Set(members.map(m => m.user_id));
            setFriends(friendList.filter((f: any) => !memberIds.has(f.id)));
        }
    };

    const handleAddMember = async (userId: string) => {
        const { error } = await supabase
            .from("group_members")
            .insert({ group_id: groupId, user_id: userId });

        if (!error) {
            fetchMembers();
            // Remove from available friends list locally
            setFriends(prev => prev.filter(f => f.id !== userId));
            // setIsAddMode(false); // Optional: keep open to add more
        } else {
            alert(`Failed to add member: ${error.message}`);
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm("Are you sure you want to remove this sister?")) return;

        const { error } = await supabase
            .from("group_members")
            .delete()
            .match({ group_id: groupId, user_id: userId });

        if (!error) {
            fetchMembers();
        } else {
            alert(`Failed to remove member: ${error.message}`);
        }
    };

    const handleLeaveGroup = async () => {
        if (!confirm("Are you sure you want to leave this group?")) return;

        const { error } = await supabase
            .from("group_members")
            .delete()
            .match({ group_id: groupId, user_id: currentUserId });

        if (!error) {
            router.push("/messages");
        } else {
            alert(`Failed to leave group: ${error.message}`);
        }
    };

    if (!isOpen) return null; // Logic controlled by parent usually, but good safeguard if we moved state up

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-cocoa/20 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-white/50 flex flex-col max-h-[80vh]">

                {/* Header */}
                <div className="p-6 border-b border-warm-grey/5 flex justify-between items-center">
                    <h2 className="font-serif text-xl text-warm-cocoa">Group Settings</h2>
                    <button onClick={onClose} className="text-warm-grey/40 hover:text-warm-grey">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">

                    {/* Admin: Edit Details */}
                    {isAdmin && (
                        <div className="pb-6 border-b border-warm-grey/5">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-warm-grey">Group Details</h3>
                                <button
                                    onClick={() => {
                                        if (isEditing) handleUpdateGroup();
                                        else setIsEditing(true);
                                    }}
                                    className="text-xs text-muted-rose font-medium hover:underline"
                                >
                                    {isEditing ? "Save" : "Edit"}
                                </button>
                            </div>

                             {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-warm-grey/60 mb-1">NAME</label>
                                        <input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full text-sm p-2 bg-stone-50 rounded-lg border border-warm-grey/10 focus:outline-none focus:ring-1 focus:ring-muted-rose"
                                            placeholder="Group Name"
                                        />
                                    </div>
                                    <div className="flex flex-col items-center gap-3 pt-2">
                                        <label className="block text-[10px] font-bold text-warm-grey/60 self-start">GROUP PROFILE PICTURE</label>
                                        <div className="relative group w-20 h-20 rounded-full bg-stone-50 border border-warm-grey/15 overflow-hidden flex items-center justify-center shadow-inner">
                                            {editImage ? (
                                                <img src={editImage} alt="Group Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="font-serif text-2xl text-warm-cocoa/40 font-bold">
                                                    {editName ? editName[0].toUpperCase() : "G"}
                                                </span>
                                            )}
                                            {uploading && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                        <label className="cursor-pointer bg-muted-rose hover:bg-muted-rose/90 text-white text-xs font-semibold py-1.5 px-4 rounded-full shadow-md shadow-muted-rose/10 flex items-center gap-2 transition-all">
                                            <Camera className="w-3.5 h-3.5" />
                                            {uploading ? "Uploading..." : "Choose from Library"}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-stone-50 border border-warm-grey/10 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                                        {editImage ? (
                                            <img src={editImage} alt={editName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-serif font-bold text-warm-cocoa">{editName?.[0]?.toUpperCase()}</span>
                                        )}
                                    </div>
                                    <p className="text-sm font-semibold text-warm-grey">{editName || "Loading..."}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Members List */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold text-warm-grey">Members ({members.length})</h3>
                            {isAdmin && !isAddMode && (
                                <button
                                    onClick={() => setIsAddMode(true)}
                                    className="text-xs text-muted-rose font-medium hover:underline"
                                >
                                    + Add Sister
                                </button>
                            )}
                        </div>

                        {isAddMode && (
                            <div className="mb-6 bg-stone-50 p-4 rounded-xl border border-warm-grey/10 animate-fade-in-down">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-warm-grey">Add to Group</span>
                                    <button onClick={() => setIsAddMode(false)} className="text-xs text-warm-grey/40">Cancel</button>
                                </div>
                                <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                    {friends.length === 0 ? (
                                        <p className="text-xs text-warm-grey/40 italic">No other friends to add.</p>
                                    ) : (
                                        friends.map((f: any) => (
                                            <div key={f.id} className="flex justify-between items-center p-2 bg-white rounded-lg border border-warm-grey/5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-stone-200 overflow-hidden">
                                                        {f.avatar_url && <img src={f.avatar_url} className="w-full h-full object-cover" />}
                                                    </div>
                                                    <span className="text-sm text-warm-grey">{f.first_name}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleAddMember(f.id)}
                                                    className="text-xs bg-muted-rose text-white px-2 py-1 rounded-md hover:bg-muted-rose/90"
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {members.map(m => (
                                <div key={m.user_id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden">
                                            {m.profile.avatar_url ? (
                                                <img src={m.profile.avatar_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="w-full h-full flex items-center justify-center text-xs">
                                                    {m.profile.first_name[0]}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-warm-grey">
                                                {m.profile.first_name} {m.profile.last_name}
                                                {m.user_id === currentUserId && " (You)"}
                                            </p>
                                            <p className="text-[10px] text-warm-grey/40">@{m.profile.username}</p>
                                        </div>
                                    </div>

                                    {isAdmin && m.user_id !== currentUserId && (
                                        <button
                                            onClick={() => handleRemoveMember(m.user_id)}
                                            className="text-warm-grey/20 hover:text-red-400 transition-colors p-2"
                                            title="Remove from group"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    {/* Show Admin badge if implemented later, currently explicit admin check passed as prop */}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-warm-grey/5 flex justify-center gap-4">
                    <button
                        onClick={handleLeaveGroup}
                        className="flex items-center gap-2 text-warm-grey/60 hover:text-warm-grey text-sm font-medium"
                    >
                        <LogOut className="w-4 h-4" />
                        Leave Group
                    </button>

                    {isAdmin && (
                        <button
                            onClick={handleDeleteGroup}
                            className="flex items-center gap-2 text-red-300 hover:text-red-400 text-sm font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete Group
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
