"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ImagePlus, Loader2 } from "lucide-react";

const SCRAPBOOK_FRAMES = [
    { name: "polaroid", label: "Polaroid 📸" },
    { name: "lace", label: "Lace ౨ৎ" },
    { name: "gingham", label: "Gingham 🏁" },
    { name: "polka", label: "Polka Dot ⚪" }
];

interface ScrapbookModalProps {
    isOpen: boolean;
    editingEntry?: any | null;
    onClose: () => void;
    onSuccess: () => void;
}

export function ScrapbookModal({ isOpen, editingEntry = null, onClose, onSuccess }: ScrapbookModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState("");
    const [selectedFrame, setSelectedFrame] = useState("polaroid");
    const [uploading, setUploading] = useState(false);
    const [friends, setFriends] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!isOpen) return;

        const loadFriends = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data } = await supabase
                    .from("friendships")
                    .select(`
                        user_id_1, user_id_2,
                        user1:profiles!friendships_user_id_1_fkey(id, username, first_name, avatar_url),
                        user2:profiles!friendships_user_id_2_fkey(id, username, first_name, avatar_url)
                    `)
                    .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
                    .eq("status", "accepted");

                if (data) {
                    const friendList = data.map((f: any) => {
                        const otherProfile = f.user_id_1 === user.id ? f.user2 : f.user1;
                        return otherProfile;
                    }).filter(Boolean);
                    setFriends(friendList);
                }
            } catch (err) {
                console.error("Error loading friends in ScrapbookModal:", err);
            }
        };
        loadFriends();
    }, [isOpen]);

    useEffect(() => {
        if (editingEntry) {
            setCaption(editingEntry.caption || "");
            setSelectedFrame(editingEntry.styles?.frame || "polaroid");
            setPreview(editingEntry.image_url);
            setFile(null);
        } else {
            setCaption("");
            setSelectedFrame("polaroid");
            setPreview(null);
            setFile(null);
        }
    }, [isOpen, editingEntry]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const handleUpload = async () => {
        if (!caption) return;
        if (!editingEntry && !file) return;
        setUploading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            let publicUrl = editingEntry ? editingEntry.image_url : "";

            // 1. Upload new image if chosen
            if (file) {
                const fileName = `${user.id}/${Date.now()}-${file.name}`;
                const { error: uploadError } = await supabase.storage
                    .from("scrapbook")
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl: newUrl } } = supabase.storage
                    .from("scrapbook")
                    .getPublicUrl(fileName);
                
                publicUrl = newUrl;
            }

            // 2. Insert or Update Entry
            if (editingEntry) {
                const { error: dbError } = await supabase
                    .from("scrapbook_entries")
                    .update({
                        image_url: publicUrl,
                        caption: caption,
                        styles: { filter: "polaroid", frame: selectedFrame }
                    })
                    .eq("id", editingEntry.id);

                if (dbError) throw dbError;
            } else {
                const { error: dbError } = await supabase.from("scrapbook_entries").insert({
                    user_id: user.id,
                    image_url: publicUrl,
                    caption: caption,
                    styles: { filter: "polaroid", frame: selectedFrame }
                });

                if (dbError) throw dbError;
            }

            // Reset & Close
            setFile(null);
            setPreview(null);
            setCaption("");
            setSelectedFrame("polaroid");
            onSuccess();

        } catch (error) {
            console.error("Scrapbook save failed:", error);
            alert("Failed to save memory. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-warm-paper flex flex-col max-h-[80vh] max-h-[80dvh] min-h-0 overflow-hidden">
                <div className="shrink-0 pb-2 border-b border-warm-grey/5 text-center mb-4">
                    <DialogTitle>{editingEntry ? "Edit Memory ✏️" : "New Memory 📸"}</DialogTitle>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-4 sm:space-y-6 pr-1 custom-scrollbar">
                    {/* Image Preview / Upload Area */}
                    <div
                        className={`aspect-square mx-auto w-48 sm:w-64 relative cursor-pointer group transition-transform hover:scale-[1.02] ${
                            selectedFrame === 'polaroid' ? 'border-polaroid' :
                            selectedFrame === 'lace' ? 'border-lace' :
                            selectedFrame === 'gingham' ? 'border-gingham' :
                            selectedFrame === 'polka' ? 'border-polka' : 'border-polaroid'
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="w-full h-full flex flex-col justify-between">
                            <div className="flex-1 bg-stone-100 overflow-hidden relative rounded filter sepia-[.2] contrast-110 brightness-110">
                                {preview ? (
                                    <>
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-gradient-to-tr from-orange-50/20 to-blue-50/10 pointer-events-none mix-blend-overlay"></div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-center text-warm-grey/40 group-hover:text-muted-rose transition-colors p-4">
                                        <ImagePlus className="w-8 h-8 mb-1" />
                                        <span className="text-xs font-medium">Click to upload photo</span>
                                    </div>
                                )}
                            </div>
                            <div className="h-6 flex items-center justify-center mt-2 overflow-hidden shrink-0">
                                <p className="font-handwriting text-warm-grey text-base truncate px-1">
                                    {caption || "Memory lane..."}
                                </p>
                            </div>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-warm-grey uppercase tracking-widest">Caption</label>
                        <Input
                            placeholder="Write something cute..."
                            value={caption}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCaption(e.target.value)}
                            className="font-handwriting text-lg"
                            maxLength={40}
                        />
                        <p className="text-[10px] text-warm-grey/40 text-right">{caption.length}/40</p>
                    </div>

                    {/* Tag Helper */}
                    {friends.length > 0 && (
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-warm-grey/50 uppercase tracking-widest">Tag Sisters 🏷️</label>
                            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                                {friends.map(f => (
                                    <button
                                        key={f.id}
                                        type="button"
                                        onClick={() => {
                                            if (!caption.includes(`@${f.username}`)) {
                                                const separator = caption.trim() === "" ? "" : " ";
                                                const newText = `${caption.trim()}${separator}@${f.username} `;
                                                if (newText.length <= 40) {
                                                    setCaption(newText);
                                                }
                                            }
                                        }}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted-rose/5 hover:bg-muted-rose/10 text-[9px] font-bold text-muted-rose border border-muted-rose/15 transition-colors"
                                    >
                                        {f.avatar_url ? (
                                            <img src={f.avatar_url} alt={f.username} className="w-3.5 h-3.5 rounded-full object-cover" />
                                        ) : (
                                            <span className="w-3.5 h-3.5 rounded-full bg-stone-100 flex items-center justify-center text-[7px] font-sans font-bold">{f.username[0].toUpperCase()}</span>
                                        )}
                                        @{f.username}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-warm-grey uppercase tracking-widest">Select Frame</label>
                        <div className="flex flex-wrap gap-2">
                            {SCRAPBOOK_FRAMES.map((frame) => (
                                <button
                                    key={frame.name}
                                    type="button"
                                    onClick={() => setSelectedFrame(frame.name)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                                        selectedFrame === frame.name
                                            ? "bg-muted-rose text-white border-muted-rose shadow-sm"
                                            : "bg-white text-warm-grey/70 border-warm-grey/10 hover:bg-stone-50"
                                    }`}
                                >
                                    {frame.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-warm-grey/5 shrink-0">
                    <Button variant="ghost" onClick={onClose} disabled={uploading}>Cancel</Button>
                    <Button
                        onClick={handleUpload}
                        disabled={(!editingEntry && !file) || !caption || uploading}
                        className="bg-muted-rose text-white hover:bg-muted-rose/90"
                    >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Memory"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
