"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { Image, Send, X } from "lucide-react";

export function CreatePost({ onPostCreated }: { onPostCreated: () => void }) {
    const [caption, setCaption] = useState("");
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    // User Identity State
    const [userAvatar, setUserAvatar] = useState<string | null>(null);
    const [userInitial, setUserInitial] = useState("Me");

    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    // Fetch user profile on mount
    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("avatar_url, first_name")
                    .eq("id", user.id)
                    .single();

                if (profile) {
                    setUserAvatar(profile.avatar_url);
                    setUserInitial(profile.first_name?.[0] || "Me");
                }
            }
        };
        loadProfile();
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploadedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handlePost = async () => {
        if (!caption.trim()) return;
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let finalImageUrl = null;

        // Upload Image if present
        if (uploadedFile) {
            const fileExt = uploadedFile.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('posts')
                .upload(fileName, uploadedFile);

            if (uploadError) {
                console.error("Upload Error:", uploadError);
                alert("Failed to upload image.");
                setLoading(false);
                return;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('posts')
                .getPublicUrl(fileName);

            finalImageUrl = publicUrl;
        }

        const { error } = await supabase.from("posts").insert({
            user_id: user.id,
            caption: caption,
            image_url: finalImageUrl
        });

        if (error) {
            console.error("Error creating post:", error);
            alert("Failed to post. Please try again.");
        } else {
            setCaption("");
            setUploadedFile(null);
            setPreviewUrl("");
            if (fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
            setExpanded(false);
            onPostCreated();
        }
        setLoading(false);
    };

    return (
        <div className={`glass-card p-4 rounded-3xl transition-all duration-300 ${expanded ? "ring-2 ring-sage-green/20" : ""}`}>
            <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-soft-blush flex-shrink-0 flex items-center justify-center text-warm-grey text-sm font-serif overflow-hidden">
                    {userAvatar ? (
                        <img src={userAvatar} alt="Me" className="w-full h-full object-cover" />
                    ) : (
                        <span>{userInitial}</span>
                    )}
                </div>
                <div className="flex-1">
                    <input
                        type="text"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        onFocus={() => setExpanded(true)}
                        placeholder="Share a thought, verse, or OOTD..."
                        className="w-full bg-transparent border-none outline-none text-warm-grey placeholder:text-warm-grey/40 py-2"
                    />

                    {expanded && (
                        <div className="mt-4 animate-fade-in-up">
                            {/* Preview Area */}
                            {previewUrl && (
                                <div className="relative mb-4 w-full h-48 bg-stone-100 rounded-xl overflow-hidden group">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => {
                                            setUploadedFile(null);
                                            setPreviewUrl("");
                                        }}
                                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Hidden File Input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                            />

                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-warm-grey/40 hover:text-sage-green transition-colors flex items-center gap-2 text-xs"
                                >
                                    <Image className="w-5 h-5" />
                                    <span>Add Photo</span>
                                </button>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setExpanded(false)}>Cancel</Button>
                                    <Button size="sm" onClick={handlePost} disabled={loading || !caption.trim()}>
                                        {loading ? "Posting..." : "Post"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {!expanded && (
                    <Button size="sm" variant="ghost" onClick={handlePost} disabled={!caption.trim()}>
                        Post
                    </Button>
                )}
            </div>
        </div>
    );
}
