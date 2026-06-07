"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Upload, Loader2, Sparkles } from "lucide-react";
import { MomentModal } from "./MomentModal";
import { Button } from "@/components/ui/Button";

type Moment = {
    id: string;
    media_url: string | null;
    caption: string | null;
    background_color: string;
    created_at: string;
    user_id: string;
    profiles: {
        first_name: string;
        username: string;
        avatar_url: string | null;
    };
};

type GroupedMoment = {
    user_id: string;
    userName: string;
    userAvatar: string | null;
    moments: Moment[];
};

export function MomentsBar() {
    const [groupedMoments, setGroupedMoments] = useState<GroupedMoment[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

    // Modal view states
    const [selectedGroup, setSelectedGroup] = useState<GroupedMoment | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);

    // Modal create states
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const [caption, setCaption] = useState("");
    const [bgColor, setBgColor] = useState("rose");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    useEffect(() => {
        loadCurrentUserAndMoments();
    }, []);

    const loadCurrentUserAndMoments = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("first_name, avatar_url, username")
                    .eq("id", user.id)
                    .single();
                setCurrentUserProfile(profile);
            }

            // Fetch moments from the last 24 hours
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: momentsData, error } = await supabase
                .from("moments")
                .select(`
                    id, media_url, caption, background_color, created_at, user_id,
                    profiles!moments_user_id_fkey (first_name, username, avatar_url)
                `)
                .gt("created_at", twentyFourHoursAgo)
                .order("created_at", { ascending: true });

            if (error) throw error;

            if (momentsData) {
                // Group by user_id
                const groups: { [key: string]: Moment[] } = {};
                momentsData.forEach((m: any) => {
                    if (!groups[m.user_id]) groups[m.user_id] = [];
                    groups[m.user_id].push(m);
                });

                const formattedGroups: GroupedMoment[] = Object.keys(groups).map(userId => {
                    const firstMoment = groups[userId][0];
                    return {
                        user_id: userId,
                        userName: firstMoment.profiles?.first_name || "Sister",
                        userAvatar: firstMoment.profiles?.avatar_url || null,
                        moments: groups[userId]
                    };
                });

                setGroupedMoments(formattedGroups);
            }
        } catch (err) {
            console.error("Error loading moments:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setFilePreview(URL.createObjectURL(file));
        }
    };

    const handleShareMoment = async () => {
        if (!currentUser) return;
        if (!caption.trim() && !selectedFile) return;

        setCreating(true);
        try {
            let mediaUrl = null;

            if (selectedFile) {
                const fileExt = selectedFile.name.split('.').pop();
                const fileName = `${currentUser.id}/${Date.now()}_moment.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('posts')
                    .upload(fileName, selectedFile);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('posts')
                    .getPublicUrl(fileName);

                mediaUrl = publicUrl;
            }

            const { error: insertError } = await supabase
                .from("moments")
                .insert({
                    user_id: currentUser.id,
                    caption: caption.trim() || null,
                    media_url: mediaUrl,
                    background_color: selectedFile ? 'default' : bgColor
                });

            if (insertError) throw insertError;

            // Reset states
            setCaption("");
            setBgColor("rose");
            setSelectedFile(null);
            setFilePreview(null);
            setIsCreatorOpen(false);

            // Reload moments
            await loadCurrentUserAndMoments();
        } catch (err: any) {
            console.error("Error sharing moment:", err);
            alert("Failed to share moment: " + err.message);
        } finally {
            setCreating(false);
        }
    };

    const openViewer = (group: GroupedMoment) => {
        setSelectedGroup(group);
        setIsViewerOpen(true);
    };

    const myGroup = groupedMoments.find(g => g.user_id === currentUser?.id);
    const otherGroups = groupedMoments.filter(g => g.user_id !== currentUser?.id);

    if (loading && !currentUser) {
        return (
            <div className="flex gap-4 overflow-x-auto py-2 mb-6">
                {[1, 2, 3, 4].map(n => (
                    <div key={n} className="w-16 h-16 rounded-full bg-stone-100 animate-pulse shrink-0" />
                ))}
            </div>
        );
    }

    return (
        <div className="flex gap-4 overflow-x-auto py-3 px-2 mb-6 scrollbar-hide select-none border-b border-warm-grey/5">
            {/* My Moment Bubble */}
            <div className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer">
                <div className="relative">
                    {myGroup ? (
                        // If I have an active moment
                        <div 
                            onClick={() => openViewer(myGroup)}
                            className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-muted-rose to-sage-green shadow-md active:scale-95 transition-transform"
                        >
                            <div className="w-full h-full rounded-full border border-white overflow-hidden bg-white">
                                {currentUserProfile?.avatar_url ? (
                                    <img src={currentUserProfile.avatar_url} alt="My Moment" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-soft-blush text-warm-grey font-serif uppercase text-lg">
                                        {currentUserProfile?.first_name?.[0] || "Me"}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // If I do NOT have an active moment
                        <div 
                            onClick={() => setIsCreatorOpen(true)}
                            className="w-16 h-16 rounded-full border-2 border-dashed border-warm-grey/20 flex items-center justify-center bg-white/40 hover:border-muted-rose/40 hover:bg-white transition-all shadow-sm active:scale-95"
                        >
                            {currentUserProfile?.avatar_url ? (
                                <img src={currentUserProfile.avatar_url} alt="Me" className="w-full h-full rounded-full object-cover p-[2px]" />
                            ) : (
                                <span className="text-xl text-warm-grey/40 font-bold font-serif">+</span>
                            )}
                        </div>
                    )}

                    {/* Plus badge overlay */}
                    {!myGroup && (
                        <div 
                            onClick={() => setIsCreatorOpen(true)}
                            className="absolute bottom-0 right-0 w-5 h-5 bg-muted-rose text-white rounded-full flex items-center justify-center border border-white hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </div>
                    )}
                </div>
                <span className="text-[10px] font-bold text-warm-grey/60">Your Moment</span>
            </div>

            {/* Friend Moments Bubbles */}
            {otherGroups.map((group) => (
                <div 
                    key={group.user_id}
                    onClick={() => openViewer(group)}
                    className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer"
                >
                    <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-muted-rose via-soft-blush to-sage-green shadow-md active:scale-95 transition-transform">
                        <div className="w-full h-full rounded-full border border-white overflow-hidden bg-white">
                            {group.userAvatar ? (
                                <img src={group.userAvatar} alt={group.userName} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-sage-green/20 text-warm-grey font-serif uppercase text-lg">
                                    {group.userName[0]}
                                </div>
                            )}
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-warm-grey/70">{group.userName}</span>
                </div>
            ))}

            {/* Moments Viewer Modal */}
            {selectedGroup && (
                <MomentModal 
                    isOpen={isViewerOpen}
                    onClose={() => {
                        setIsViewerOpen(false);
                        setSelectedGroup(null);
                    }}
                    moments={selectedGroup.moments}
                    userName={selectedGroup.userName}
                    userAvatar={selectedGroup.userAvatar}
                />
            )}

            {/* Moments Creator Modal */}
            {isCreatorOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
                    <div className="bg-warm-paper rounded-3xl p-6 shadow-2xl w-full max-w-sm border border-white flex flex-col gap-4 animate-fade-in-up text-left">
                        <div className="flex justify-between items-center pb-2 border-b border-warm-grey/5">
                            <h3 className="font-serif text-lg text-warm-cocoa flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-muted-rose" /> Share a Moment
                            </h3>
                            <button 
                                onClick={() => {
                                    setIsCreatorOpen(false);
                                    setCaption("");
                                    setSelectedFile(null);
                                    setFilePreview(null);
                                }}
                                className="p-1 rounded-full hover:bg-stone-100 text-warm-grey/60"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* File preview or Text-only preview */}
                        <div className="relative aspect-[9/16] max-h-[300px] w-full rounded-2xl border border-warm-grey/10 overflow-hidden flex items-center justify-center shadow-inner">
                            {filePreview ? (
                                <>
                                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                                    <button 
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setFilePreview(null);
                                        }}
                                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </>
                            ) : (
                                <div className={`w-full h-full flex flex-col items-center justify-center p-6 transition-all duration-300 ${
                                    bgColor === 'rose' ? 'bg-muted-rose text-white' :
                                    bgColor === 'blue' ? 'bg-indigo-400 text-white' :
                                    bgColor === 'green' ? 'bg-sage-green text-warm-grey' :
                                    bgColor === 'orange' ? 'bg-orange-400 text-white' :
                                    bgColor === 'purple' ? 'bg-purple-400 text-white' :
                                    bgColor === 'yellow' ? 'bg-yellow-400 text-warm-grey' :
                                    'bg-white text-warm-grey'
                                }`}>
                                    <p className="font-serif text-lg leading-relaxed italic max-w-xs px-2 break-words">
                                        {caption.trim() ? `"${caption}"` : '"Be still..."'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Caption input */}
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-warm-cocoa">Caption / Thought</label>
                            <input 
                                type="text"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value.slice(0, 100))}
                                placeholder="Type a cozy thought..."
                                className="w-full px-4 py-2.5 text-xs rounded-xl bg-white/50 border border-warm-grey/5 focus:outline-none text-warm-grey placeholder:text-warm-grey/30"
                            />
                        </div>

                        {/* BG Color picker if text-only */}
                        {!selectedFile && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-warm-cocoa">Background Color</label>
                                <div className="flex gap-2">
                                    {['rose', 'blue', 'green', 'orange', 'purple', 'yellow'].map((color) => (
                                        <button 
                                            key={color}
                                            onClick={() => setBgColor(color)}
                                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                                                color === 'rose' ? 'bg-muted-rose' :
                                                color === 'blue' ? 'bg-indigo-400' :
                                                color === 'green' ? 'bg-sage-green' :
                                                color === 'orange' ? 'bg-orange-400' :
                                                color === 'purple' ? 'bg-purple-400' :
                                                'bg-yellow-400'
                                            } ${bgColor === color ? 'border-warm-grey scale-110' : 'border-transparent hover:scale-105'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Photo selection button */}
                        <input 
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />

                        <div className="flex gap-2 mt-2">
                            <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex-1 border-warm-grey/10 text-warm-grey flex items-center justify-center gap-1"
                            >
                                <Upload className="w-4 h-4" /> Photo
                            </Button>
                            <Button 
                                size="sm"
                                onClick={handleShareMoment}
                                disabled={creating || (!caption.trim() && !selectedFile)}
                                className="flex-1 bg-muted-rose hover:bg-muted-rose/90 text-white flex items-center justify-center gap-1 shadow-md shadow-muted-rose/10"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Share Moment ౨ৎ"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
