"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { Image, Send, X, Video, Layers } from "lucide-react";

export function CreatePost({ onPostCreated }: { onPostCreated: () => void }) {
    const [caption, setCaption] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<{ url: string, type: 'image' | 'video' }[]>([]);
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
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);

            // Limit to 5 files for now
            if (files.length + uploadedFiles.length > 5) {
                alert("You can only select up to 5 items.");
                return;
            }

            const newPreviews = files.map(file => ({
                url: URL.createObjectURL(file),
                type: file.type.startsWith('video/') ? 'video' : 'image'
            }));

            setUploadedFiles(prev => [...prev, ...files]);
            // @ts-ignore
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handlePost = async () => {
        if (!caption.trim() && uploadedFiles.length === 0) return;
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const mediaUrls: string[] = [];

        // Upload Files
        for (const file of uploadedFiles) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('posts')
                .upload(fileName, file);

            if (uploadError) {
                console.error("Upload Error:", uploadError);
                // @ts-ignore
                const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                // @ts-ignore
                alert(`Error uploading ${file.name} (${sizeMB}MB, ${file.type}): ${uploadError.message || uploadError.error || "Unknown error"}`);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('posts')
                .getPublicUrl(fileName);

            mediaUrls.push(publicUrl);
        }

        // If user tried to upload files but all failed, DO NOT create the post
        if (uploadedFiles.length > 0 && mediaUrls.length === 0) {
            alert("Upload failed. Post cancelled.");
            setLoading(false);
            return;
        }

        // Determine Post Type
        let postType = 'text';
        if (mediaUrls.length === 1) {
            // Robust check regarding file type - if original file was video or extension is video
            const file = uploadedFiles[0];
            const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|webm|quicktime)$/i);
            postType = isVideo ? 'video' : 'image';
        } else if (mediaUrls.length > 1) {
            postType = 'carousel';
        }

        const { error } = await supabase.from("posts").insert({
            user_id: user.id,
            caption: caption,
            media_urls: mediaUrls,
            type: postType,
            // Backwards compatibility if needed, using first image
            image_url: mediaUrls.length > 0 ? mediaUrls[0] : null
        });

        if (error) {
            console.error("Error creating post:", error);
            alert("Failed to post. Please try again.");
        } else {
            setCaption("");
            setUploadedFiles([]);
            setPreviewUrls([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
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
                            {/* Preview Area (Horizontal Scroll for Carousel preview) */}
                            {previewUrls.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
                                    {previewUrls.map((preview, index) => (
                                        <div key={index} className="relative w-32 h-32 flex-shrink-0 bg-stone-100 rounded-xl overflow-hidden group">
                                            {preview.type === 'video' ? (
                                                <video src={preview.url} className="w-full h-full object-cover" />
                                            ) : (
                                                <img src={preview.url} alt="Preview" className="w-full h-full object-cover" />
                                            )}

                                            <button
                                                onClick={() => removeFile(index)}
                                                className="absolute top-1 right-1 bg-black/50 text-white p-0.5 rounded-full hover:bg-black/70"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Hidden File Input */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*,video/*"
                                multiple
                                onChange={handleFileSelect}
                            />

                            <div className="flex justify-between items-center">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-warm-grey/40 hover:text-sage-green transition-colors flex items-center gap-2 text-xs"
                                >
                                    <Layers className="w-5 h-5" />
                                    <span>Add Photos/Video</span>
                                </button>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setExpanded(false)}>Cancel</Button>
                                    <Button size="sm" onClick={handlePost} disabled={loading || (!caption.trim() && uploadedFiles.length === 0)}>
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
