"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { Image, Send, X, Video, Layers, Music } from "lucide-react";
import * as tus from 'tus-js-client';
import { SongSearchModal } from "@/components/ui/SongSearchModal";

export function CreatePost({ onPostCreated }: { onPostCreated: () => void }) {
    const [caption, setCaption] = useState("");
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<{ url: string, type: 'image' | 'video' }[]>([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    // Song State
    const [songTitle, setSongTitle] = useState("");
    const [songArtist, setSongArtist] = useState("");
    const [songLink, setSongLink] = useState("");
    const [songPreview, setSongPreview] = useState("");
    const [songArtwork, setSongArtwork] = useState("");
    const [showSongInput, setShowSongInput] = useState(false);
    const [isSongModalOpen, setIsSongModalOpen] = useState(false);

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

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) throw new Error("User not authenticated");

            const mediaUrls: string[] = [];
            const user = session.user;

            // Upload Files using TUS
            for (const file of uploadedFiles) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

                console.log(`Starting TUS upload: ${fileName}, size: ${file.size}, type: ${file.type}`);

                await new Promise<void>((resolve, reject) => {
                    const upload = new tus.Upload(file, {
                        endpoint: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/upload/resumable`,
                        retryDelays: [0, 3000, 5000, 10000, 20000],
                        headers: {
                            authorization: `Bearer ${session.access_token}`,
                            'x-upsert': 'true',
                        },
                        uploadDataDuringCreation: true,
                        removeFingerprintOnSuccess: true,
                        metadata: {
                            bucketName: 'posts',
                            objectName: fileName,
                            contentType: file.type,
                            cacheControl: '3600',
                        },
                        chunkSize: 6 * 1024 * 1024,
                        onError: function (error) {
                            console.error('TUS Upload Failed:', error);
                            reject(error);
                        },
                        onProgress: function (bytesUploaded, bytesTotal) {
                            const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
                            console.log(`Upload progress: ${percentage}%`);
                        },
                        onSuccess: function () {
                            console.log(`Upload success: ${fileName}`);
                            const { data: { publicUrl } } = supabase.storage
                                .from('posts')
                                .getPublicUrl(fileName);

                            mediaUrls.push(publicUrl);
                            resolve();
                        },
                    });

                    upload.findPreviousUploads().then(function (previousUploads) {
                        if (previousUploads.length) {
                            upload.resumeFromPreviousUpload(previousUploads[0]);
                        }
                        upload.start();
                    });
                });
            }

            // If user tried to upload files but all failed
            if (uploadedFiles.length > 0 && mediaUrls.length === 0) {
                throw new Error("All file uploads failed. Please check your connection or file format.");
            }

            // Determine Post Type
            let postType = 'text';
            if (mediaUrls.length === 1) {
                const file = uploadedFiles[0];
                const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|webm|quicktime)$/i);
                postType = isVideo ? 'video' : 'image';
            } else if (mediaUrls.length > 1) {
                postType = 'carousel';
            }

            console.log("Creating post record...", { type: postType, mediaCount: mediaUrls.length });

            const { error: insertError } = await supabase.from("posts").insert({
                user_id: user.id,
                caption: caption,
                media_urls: mediaUrls,
                type: postType,
                image_url: mediaUrls.length > 0 ? mediaUrls[0] : null,
                song_title: songTitle.trim() || null,
                song_artist: songArtist.trim() || null,
                song_link: songLink.trim() || null,
                song_preview_url: songPreview?.trim() || null,
                song_album_art: songArtwork?.trim() || null,
            });

            if (insertError) {
                console.error("Database Insert Error:", insertError);
                throw new Error(`Failed to save post: ${insertError.message}`);
            }

            // Success
            setCaption("");
            setUploadedFiles([]);
            setPreviewUrls([]);
            setSongTitle("");
            setSongArtist("");
            setSongLink("");
            setSongPreview("");
            setSongArtwork("");
            setShowSongInput(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setExpanded(false);
            onPostCreated();

        } catch (error: any) {
            console.error("Handle Post Error:", error);
            alert(error.message || "An unexpected error occurred while posting.");
        } finally {
            setLoading(false);
        }
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

                            {/* Song Inputs */}
                            {showSongInput ? (
                                <div className="bg-white/40 p-3 rounded-xl border border-warm-grey/10 mb-4 animate-fade-in relative group">
                                    <div className="flex items-center gap-3">
                                        {songArtwork ? (
                                            <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
                                                <img src={songArtwork} alt="Cover" className="w-full h-full object-cover" />
                                            </div>
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center shrink-0">
                                                <Music className="w-5 h-5 text-warm-grey/40" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="font-bold text-warm-cocoa truncate text-xs">{songTitle}</div>
                                            <div className="text-[10px] text-warm-grey/60 truncate">{songArtist}</div>
                                        </div>
                                        <button onClick={() => {
                                            setShowSongInput(false);
                                            setSongTitle("");
                                            setSongArtist("");
                                            setSongLink("");
                                            setSongPreview("");
                                            setSongArtwork("");
                                        }} className="p-1 text-warm-grey/40 hover:text-red-400">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            <SongSearchModal
                                isOpen={isSongModalOpen}
                                onClose={() => setIsSongModalOpen(false)}
                                onSelect={(song) => {
                                    setSongTitle(song.title);
                                    setSongArtist(song.artist);
                                    setSongLink(song.link);
                                    setSongPreview(song.previewUrl);
                                    setSongArtwork(song.artwork);
                                    setShowSongInput(true);
                                }}
                            />

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
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="text-warm-grey/40 hover:text-sage-green transition-colors flex items-center gap-2 text-xs"
                                    >
                                        <Layers className="w-5 h-5" />
                                        <span>Add Photos/Video</span>
                                    </button>
                                    {!showSongInput && (
                                        <button
                                            onClick={() => setIsSongModalOpen(true)}
                                            className="text-warm-grey/40 hover:text-sage-green transition-colors flex items-center gap-2 text-xs"
                                        >
                                            <Music className="w-5 h-5" />
                                            <span>Add Song</span>
                                        </button>
                                    )}
                                </div>
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
